import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { TokenmonRateWindow } from "@/lib/tokenmon";

/**
 * 직접 연동 — Claude Code가 로컬에 저장한 본인 OAuth 토큰으로 Anthropic 사용량
 * API(데스크탑 앱 설정 화면이 쓰는 것과 같은 endpoint)를 조회한다.
 *
 * - 통신은 이 컴퓨터 ↔ Anthropic 뿐, 제3자에게 가는 것 없음. 숫자만 쓴다.
 * - 토큰은 읽기만 하고 저장·로그에 남기지 않는다.
 * - 끄기: ~/.claude/tokenmon/config.json 에 { "useUsageApi": false }
 * - 실패(토큰 만료·오프라인 등) 시 statusline/추정 게이지로 자연스럽게 폴백.
 */

const CREDENTIALS_FILE = join(homedir(), ".claude", ".credentials.json");
const CONFIG_FILE = join(homedir(), ".claude", "tokenmon", "config.json");
const USAGE_URL = "https://api.anthropic.com/api/oauth/usage";
const CACHE_TTL_MS = 60_000;
const ERROR_BACKOFF_MS = 5 * 60_000;

export interface ApiUsage {
  fiveHour: TokenmonRateWindow;
  sevenDay: TokenmonRateWindow;
}

interface UsageCache {
  atMs: number;
  value: ApiUsage | null;
  failed: boolean;
}

const globalStore = globalThis as unknown as { tokenmonUsageCache?: UsageCache };

function usageApiEnabled(): boolean {
  try {
    const config = JSON.parse(readFileSync(CONFIG_FILE, "utf8")) as { useUsageApi?: unknown };
    if (config.useUsageApi === false) return false;
  } catch {
    /* 설정 없음 = 기본 켜짐 */
  }
  return true;
}

function readAccessToken(): string | null {
  try {
    const cred = JSON.parse(readFileSync(CREDENTIALS_FILE, "utf8")) as {
      claudeAiOauth?: { accessToken?: unknown; expiresAt?: unknown } | null;
    };
    const oauth = cred.claudeAiOauth;
    if (!oauth || typeof oauth.accessToken !== "string" || oauth.accessToken === "") return null;
    // 만료 임박 토큰은 쓰지 않는다 (갱신은 Claude Code 본체가 알아서 한다)
    if (typeof oauth.expiresAt === "number" && oauth.expiresAt <= Date.now() + 60_000) return null;
    return oauth.accessToken;
  } catch {
    return null;
  }
}

function toWindow(raw: unknown): TokenmonRateWindow | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as { utilization?: unknown; resets_at?: unknown };
  if (typeof value.utilization !== "number" || !Number.isFinite(value.utilization)) return null;
  const resetsAtMs = typeof value.resets_at === "string" ? Date.parse(value.resets_at) : Number.NaN;
  return { usedPct: value.utilization, resetsAtMs: Number.isNaN(resetsAtMs) ? null : resetsAtMs };
}

/** 사용량 API 조회 — 60초 캐시, 실패 시 5분 백오프. 못 가져오면 null(폴백 진행). */
export async function fetchApiUsage(): Promise<ApiUsage | null> {
  if (!usageApiEnabled()) return null;
  const nowMs = Date.now();
  const cache = globalStore.tokenmonUsageCache;
  if (cache && nowMs - cache.atMs < (cache.failed ? ERROR_BACKOFF_MS : CACHE_TTL_MS)) return cache.value;

  const token = readAccessToken();
  if (token === null) {
    globalStore.tokenmonUsageCache = { atMs: nowMs, value: null, failed: true };
    return null;
  }

  try {
    const response = await fetch(USAGE_URL, {
      headers: { Authorization: `Bearer ${token}`, "anthropic-beta": "oauth-2025-04-20" },
      signal: AbortSignal.timeout(5_000),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`usage api ${response.status}`);
    const body = (await response.json()) as { five_hour?: unknown; seven_day?: unknown };
    const fiveHour = toWindow(body.five_hour);
    const sevenDay = toWindow(body.seven_day);
    const value = fiveHour && sevenDay ? { fiveHour, sevenDay } : null;
    globalStore.tokenmonUsageCache = { atMs: nowMs, value, failed: value === null };
    return value;
  } catch {
    globalStore.tokenmonUsageCache = { atMs: nowMs, value: null, failed: true };
    return null;
  }
}
