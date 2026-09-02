import { createReadStream, mkdirSync, readdirSync, renameSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { TokenmonSnapshot } from "@/lib/tokenmon";

/**
 * 실시간 트랜스크립트 테일러 — statusline이 못 잡는 세션(상태줄 설정 전에
 * 시작했거나 상태줄이 없는 창)도 대화 로그(~/.claude/projects)의 usage 숫자를
 * 증분으로 읽어 실시간 집계한다. 대화 내용은 저장하지 않는다 — 숫자만.
 *
 * 읽은 위치(오프셋)는 메모리에 기억해 매 폴링마다 새로 붙은 부분만 읽고,
 * 결과는 sessions 폴더에 transcript-<세션>.json 스냅샷으로 저장해
 * 백필(scripts/backfill.js)이 같은 세션을 중복 집계하지 않게 한다.
 */

const PROJECTS_DIR = join(homedir(), ".claude", "projects");
const SESSIONS_DIR = join(homedir(), ".claude", "tokenmon", "sessions");
/** 최근 30분 안에 갱신된 트랜스크립트만 살아있는 세션으로 본다. */
const ACTIVE_WINDOW_MS = 30 * 60_000;

interface TailState {
  offset: number;
  leftover: string;
  input: number;
  cacheCreate: number;
  cacheRead: number;
  output: number;
  lastMs: number;
  cwd: string | null;
  seen: Set<string>;
}

/* dev 서버의 모듈 리로드에도 오프셋이 유지되도록 globalThis에 보관 */
const globalStore = globalThis as unknown as { tokenmonTailStates?: Map<string, TailState> };
function states(): Map<string, TailState> {
  if (!globalStore.tokenmonTailStates) globalStore.tokenmonTailStates = new Map();
  return globalStore.tokenmonTailStates;
}

export function sanitizeSessionId(id: string): string {
  return id.replace(/[^\w.-]/g, "_").slice(0, 80);
}

function readNewText(file: string, start: number): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    const stream = createReadStream(file, { encoding: "utf8", start });
    stream.on("data", (chunk) => (data += chunk));
    stream.on("end", () => resolve(data));
    stream.on("error", reject);
  });
}

function ingest(state: TailState, text: string): void {
  const lines = (state.leftover + text).split("\n");
  state.leftover = lines.pop() ?? "";
  for (const line of lines) {
    if (!line) continue;
    let obj: {
      cwd?: unknown;
      timestamp?: unknown;
      requestId?: unknown;
      message?: { id?: unknown; usage?: Record<string, unknown> } | null;
    };
    try {
      obj = JSON.parse(line);
    } catch {
      continue;
    }
    if (!state.cwd && typeof obj.cwd === "string" && obj.cwd) state.cwd = obj.cwd;
    if (typeof obj.timestamp === "string") {
      const ts = Date.parse(obj.timestamp);
      if (!Number.isNaN(ts) && ts > state.lastMs) state.lastMs = ts;
    }
    const usage = obj.message?.usage;
    if (!usage || typeof usage.output_tokens !== "number") continue;
    const key = `${typeof obj.message?.id === "string" ? obj.message.id : ""}:${typeof obj.requestId === "string" ? obj.requestId : ""}`;
    if (key !== ":") {
      if (state.seen.has(key)) continue; // 스트리밍 중복 기록 방지
      state.seen.add(key);
    }
    state.output += typeof usage.output_tokens === "number" ? usage.output_tokens : 0;
    state.input += typeof usage.input_tokens === "number" ? usage.input_tokens : 0;
    state.cacheCreate += typeof usage.cache_creation_input_tokens === "number" ? usage.cache_creation_input_tokens : 0;
    state.cacheRead += typeof usage.cache_read_input_tokens === "number" ? usage.cache_read_input_tokens : 0;
  }
}

function toSnapshot(sessionId: string, state: TailState): TokenmonSnapshot {
  return {
    savedAt: new Date(state.lastMs || Date.now()).toISOString(),
    payload: {
      session_id: `transcript-${sessionId}`,
      workspace: state.cwd ? { project_dir: state.cwd, current_dir: state.cwd } : undefined,
      model: { id: "transcript", display_name: "transcript" },
      cost: { total_cost_usd: null, total_duration_ms: null, total_api_duration_ms: 0, total_lines_added: 0, total_lines_removed: 0 },
      context_window: {
        total_input_tokens: state.input + state.cacheCreate + state.cacheRead,
        total_output_tokens: state.output,
        context_window_size: null,
        used_percentage: null,
      },
    },
  };
}

/**
 * 살아있는(최근 30분 내 갱신) 트랜스크립트를 증분 집계해 스냅샷으로 돌려준다.
 * excludeSessionIds: statusline 수집기가 이미 담당하는 세션 ID들(sanitize된 값) — 중복 방지.
 */
export async function readActiveTranscriptSnapshots(excludeSessionIds: Set<string>): Promise<TokenmonSnapshot[]> {
  const results: TokenmonSnapshot[] = [];
  let dirs;
  try {
    dirs = readdirSync(PROJECTS_DIR, { withFileTypes: true });
  } catch {
    return results;
  }
  const nowMs = Date.now();

  for (const entry of dirs) {
    if (!entry.isDirectory()) continue;
    const dirPath = join(PROJECTS_DIR, entry.name);
    let files: string[];
    try {
      files = readdirSync(dirPath);
    } catch {
      continue;
    }
    for (const file of files) {
      if (!file.endsWith(".jsonl")) continue;
      const sessionId = file.slice(0, -6);
      if (excludeSessionIds.has(sanitizeSessionId(sessionId))) continue;
      const filePath = join(dirPath, file);
      let stat;
      try {
        stat = statSync(filePath);
      } catch {
        continue;
      }
      if (nowMs - stat.mtimeMs > ACTIVE_WINDOW_MS) continue;

      const state: TailState =
        states().get(filePath) ??
        { offset: 0, leftover: "", input: 0, cacheCreate: 0, cacheRead: 0, output: 0, lastMs: 0, cwd: null, seen: new Set<string>() };

      if (stat.size > state.offset) {
        try {
          const text = await readNewText(filePath, state.offset);
          state.offset = stat.size;
          ingest(state, text);
          // 스냅샷 영속화 — 서버 재시작·백필과의 중복 집계 방지용
          try {
            mkdirSync(SESSIONS_DIR, { recursive: true });
            const target = join(SESSIONS_DIR, `${sanitizeSessionId(`transcript-${sessionId}`)}.json`);
            const body = JSON.stringify(toSnapshot(sessionId, state));
            const tmp = `${target}.${process.pid}.tmp`;
            writeFileSync(tmp, body);
            try {
              renameSync(tmp, target);
            } catch {
              writeFileSync(target, body);
            }
          } catch {}
        } catch {
          /* 다음 폴링에서 재시도 */
        }
      }
      states().set(filePath, state);
      if (state.output > 0) results.push(toSnapshot(sessionId, state));
    }
  }
  return results;
}
