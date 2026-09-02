import { createReadStream, mkdirSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";

/**
 * 사용량 시계열 + 새 창 추정 — statusline 실측이 없는 동안 밥그릇 게이지를 채운다.
 *
 * 추정 재료 (전부 로컬, 대화 내용은 읽되 숫자만 집계):
 *  1. 창 스캔 — 리셋 시각 이후의 토큰 소비를 대화 로그(~/.claude/projects)의
 *     usage·timestamp에서 창당 1회 재구성하고, 이후엔 폴링 간 총 토큰 증가분으로 이어간다.
 *  2. 1%당 토큰 보정 — 실측 게이지 마크 쌍(같은 창에서 %가 벌어진 두 관측)이 최우선,
 *     없으면 직전 창(스캔 토큰 ÷ 마지막 관측 %)으로, 그것도 없으면 부트스트랩 값.
 *
 * 저장: ~/.claude/tokenmon/usage-series.json
 */

const DIR = join(homedir(), ".claude", "tokenmon");
const FILE = join(DIR, "usage-series.json");
const PROJECTS_DIR = join(homedir(), ".claude", "projects");
const CHECKPOINT_MIN_GAP_MS = 60_000;
const MAX_CHECKPOINTS = 2_000;
const MAX_MARKS = 80;
const FIVE_HOURS_MS = 5 * 3_600_000;
/** 보정 근거가 하나도 없을 때의 부트스트랩 환산 — 5시간 창 1% ≈ 총 토큰 400만. */
const FALLBACK_TOKENS_PER_PCT = 4_000_000;

interface WindowScan {
  /** 이 스캔이 커버하는 창의 시작(=직전 창 리셋) 시각. */
  resetMs: number;
  /** [resetMs, scannedAtMs) 구간에서 로그로 재구성한 총 토큰. */
  tokens: number;
  /** 스캔 시점의 누적 총 토큰 — 이후 증가분을 더해 현재값을 만든다. */
  grandTotalAtScan: number;
  /** 리셋 후 첫 소비 시각 — 새 창 리셋 예정 시각(+5h) 추정용. */
  firstEatMs: number | null;
}

interface SeriesData {
  checkpoints: [number, number][];
  marks: [number, number, number][];
  windowScan?: WindowScan;
  /** 직전 창 재구성 결과 — [창 리셋 시각, 그 창에서 소비한 토큰]. */
  calibScan?: [number, number];
}

function load(): SeriesData {
  try {
    const parsed = JSON.parse(readFileSync(FILE, "utf8")) as Partial<SeriesData>;
    return {
      checkpoints: Array.isArray(parsed.checkpoints) ? (parsed.checkpoints as [number, number][]) : [],
      marks: Array.isArray(parsed.marks) ? (parsed.marks as [number, number, number][]) : [],
      windowScan: parsed.windowScan,
      calibScan: parsed.calibScan,
    };
  } catch {
    return { checkpoints: [], marks: [] };
  }
}

function save(data: SeriesData): void {
  try {
    mkdirSync(DIR, { recursive: true });
    const tmp = `${FILE}.${process.pid}.tmp`;
    writeFileSync(tmp, JSON.stringify(data));
    try {
      renameSync(tmp, FILE);
    } catch {
      writeFileSync(FILE, JSON.stringify(data));
    }
  } catch {
    /* 기록 실패는 치명적이지 않다 — 다음 폴링에서 재시도 */
  }
}

/** 폴링마다 호출 — 체크포인트를 쌓고, 실측 게이지가 보이면 보정 마크도 남긴다. */
export function recordUsage(
  nowMs: number,
  grandTotalTokens: number,
  liveFiveHour: { usedPct: number; resetsAtMs: number | null } | null,
): void {
  const data = load();
  const last = data.checkpoints[data.checkpoints.length - 1];
  let dirty = false;
  if (!last || nowMs - last[0] >= CHECKPOINT_MIN_GAP_MS) {
    data.checkpoints.push([nowMs, grandTotalTokens]);
    if (data.checkpoints.length > MAX_CHECKPOINTS) data.checkpoints.splice(0, data.checkpoints.length - MAX_CHECKPOINTS);
    dirty = true;
  }
  if (liveFiveHour && liveFiveHour.resetsAtMs !== null) {
    const lastMark = data.marks[data.marks.length - 1];
    if (!lastMark || lastMark[0] !== liveFiveHour.resetsAtMs || lastMark[1] !== liveFiveHour.usedPct) {
      data.marks.push([liveFiveHour.resetsAtMs, liveFiveHour.usedPct, grandTotalTokens]);
      if (data.marks.length > MAX_MARKS) data.marks.splice(0, data.marks.length - MAX_MARKS);
      dirty = true;
    }
  }
  if (dirty) save(data);
}

/** 대화 로그에서 [sinceMs, untilMs) 구간의 토큰 소비를 재구성한다 (숫자만, 창당 1회). */
async function scanTokens(sinceMs: number, untilMs: number): Promise<{ tokens: number; firstMs: number | null }> {
  let tokens = 0;
  let firstMs: number | null = null;
  let dirs;
  try {
    dirs = readdirSync(PROJECTS_DIR, { withFileTypes: true });
  } catch {
    return { tokens: 0, firstMs: null };
  }
  for (const entry of dirs) {
    if (!entry.isDirectory()) continue;
    const dirPath = join(PROJECTS_DIR, entry.name);
    let files: string[];
    try {
      files = readdirSync(dirPath).filter((name) => name.endsWith(".jsonl"));
    } catch {
      continue;
    }
    for (const file of files) {
      const filePath = join(dirPath, file);
      try {
        if (statSync(filePath).mtimeMs < sinceMs) continue; // 창 시작 전에 끝난 파일은 볼 필요 없다
      } catch {
        continue;
      }
      const seen = new Set<string>();
      try {
        const rl = createInterface({ input: createReadStream(filePath, { encoding: "utf8" }), crlfDelay: Infinity });
        for await (const line of rl) {
          if (!line) continue;
          let obj: {
            timestamp?: unknown;
            requestId?: unknown;
            message?: { id?: unknown; usage?: Record<string, unknown> } | null;
          };
          try {
            obj = JSON.parse(line);
          } catch {
            continue;
          }
          const ts = typeof obj.timestamp === "string" ? Date.parse(obj.timestamp) : Number.NaN;
          if (Number.isNaN(ts) || ts < sinceMs || ts >= untilMs) continue;
          const usage = obj.message?.usage;
          if (!usage || typeof usage.output_tokens !== "number") continue;
          const key = `${typeof obj.message?.id === "string" ? obj.message.id : ""}:${typeof obj.requestId === "string" ? obj.requestId : ""}`;
          if (key !== ":") {
            if (seen.has(key)) continue;
            seen.add(key);
          }
          const n = (value: unknown) => (typeof value === "number" ? value : 0);
          tokens += n(usage.output_tokens) + n(usage.input_tokens) + n(usage.cache_creation_input_tokens) + n(usage.cache_read_input_tokens);
          if (firstMs === null || ts < firstMs) firstMs = ts;
        }
      } catch {
        /* 깨진 파일은 건너뛴다 */
      }
    }
  }
  return { tokens, firstMs };
}

/** 실측 마크 쌍 → 직전 창 재구성 → 부트스트랩 순으로 "1%당 토큰"을 고른다. */
function tokensPerPct(data: SeriesData, expiredUsedPct: number): number {
  for (let i = data.marks.length - 1; i > 0; i -= 1) {
    const [resetA, pctA, totalA] = data.marks[i];
    for (let j = i - 1; j >= 0; j -= 1) {
      const [resetB, pctB, totalB] = data.marks[j];
      if (resetB !== resetA) break;
      if (pctA - pctB >= 3 && totalA > totalB) {
        return clampRatio((totalA - totalB) / (pctA - pctB));
      }
    }
  }
  if (data.calibScan && data.calibScan[1] > 0 && expiredUsedPct >= 3) {
    return clampRatio(data.calibScan[1] / expiredUsedPct);
  }
  return FALLBACK_TOKENS_PER_PCT;
}

function clampRatio(ratio: number): number {
  return Math.min(100_000_000, Math.max(200_000, ratio));
}

/* dev 서버에서 같은 창을 두 번 스캔하지 않기 위한 in-flight 가드 */
const globalStore = globalThis as unknown as { tokenmonScanPromise?: Promise<void> | null };

/**
 * 새 창 추정 — 대화 로그 재구성 + 이후 증가분으로 사용률을 추산한다.
 * expiredUsedPct: 직전 창의 마지막 관측 사용률(보정용, 0~100).
 */
export async function estimateFreshFiveHour(
  nowMs: number,
  grandTotalTokens: number,
  expiredResetsAtMs: number,
  expiredUsedPct: number,
): Promise<{ usedPct: number; resetsAtMs: number | null } | null> {
  let data = load();

  // 창당 1회: 현재 창 재구성 + 직전 창 보정 스캔 (동시 폴링은 한 번만 돌게 가드)
  if (!data.windowScan || data.windowScan.resetMs !== expiredResetsAtMs) {
    if (!globalStore.tokenmonScanPromise) {
      globalStore.tokenmonScanPromise = (async () => {
        const [current, previous] = await Promise.all([
          scanTokens(expiredResetsAtMs, nowMs),
          scanTokens(expiredResetsAtMs - FIVE_HOURS_MS, expiredResetsAtMs),
        ]);
        const freshData = load();
        freshData.windowScan = {
          resetMs: expiredResetsAtMs,
          tokens: current.tokens,
          grandTotalAtScan: grandTotalTokens,
          firstEatMs: current.firstMs,
        };
        freshData.calibScan = [expiredResetsAtMs, previous.tokens];
        save(freshData);
      })().finally(() => {
        globalStore.tokenmonScanPromise = null;
      });
    }
    await globalStore.tokenmonScanPromise;
    data = load();
  }

  const scan = data.windowScan;
  if (!scan || scan.resetMs !== expiredResetsAtMs) return null;

  const tokensSince = scan.tokens + Math.max(0, grandTotalTokens - scan.grandTotalAtScan);
  const usedPct = Math.min(99, Math.round(tokensSince / tokensPerPct(data, expiredUsedPct)));
  const resetsAtMs = scan.firstEatMs === null ? null : scan.firstEatMs + FIVE_HOURS_MS;
  return { usedPct, resetsAtMs };
}
