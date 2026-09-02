#!/usr/bin/env node
/**
 * Tokenmon 백필 — 지난 Claude Code 기록에서 usage 숫자만 뽑아 프로젝트별
 * "지난 기록" 스냅샷을 만든다.
 *
 * 읽는 것:   ~/.claude/projects/<프로젝트>/<세션>.jsonl 의 usage·timestamp·cwd 필드
 * 쓰는 것:   ~/.claude/tokenmon/sessions/backfill-<프로젝트>.json (프로젝트당 요약 1개)
 * 안 하는 것: 대화 내용 저장 — 숫자만 집계한다.
 *
 * 다시 실행해도 안전하다: 요약 파일을 덮어쓰고, 라이브 수집기가 이미 기록한
 * 세션은 중복 집계하지 않도록 건너뛴다.
 *
 * 실행: npm run backfill
 */
"use strict";
const fs = require("fs");
const path = require("path");
const os = require("os");
const readline = require("readline");

const PROJECTS_DIR = path.join(os.homedir(), ".claude", "projects");
const SESSIONS_DIR = path.join(os.homedir(), ".claude", "tokenmon", "sessions");

/* lib/tokenmon.ts 의 LEVEL_XP와 같은 값 — 리포트 출력용 사본 (1 XP = 총 토큰 100만) */
const LEVEL_XP = [0, 0, 37, 81, 134, 198, 274, 366, 476, 608, 766, 956, 1183, 1456, 1783, 2176, 2647, 3212, 3891, 4705, 5700];

function levelOf(xp) {
  for (let level = 20; level >= 2; level -= 1) if (xp >= LEVEL_XP[level]) return level;
  return 1;
}

function fmt(n) {
  if (n < 1000) return String(n);
  if (n < 1e6) return (n / 1e3).toFixed(1) + "k";
  return (n / 1e6).toFixed(2) + "M";
}

function sanitize(id) {
  return String(id).replace(/[^\w.-]/g, "_").slice(0, 80);
}

function basename(p) {
  const parts = String(p).split(/[\\/]/).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : String(p);
}

async function aggregateFile(file, agg) {
  const seen = new Set();
  const rl = readline.createInterface({ input: fs.createReadStream(file, { encoding: "utf8" }), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line) continue;
    let obj;
    try {
      obj = JSON.parse(line);
    } catch {
      continue;
    }
    if (!agg.cwd && typeof obj.cwd === "string" && obj.cwd) agg.cwd = obj.cwd;
    if (typeof obj.timestamp === "string") {
      const ts = Date.parse(obj.timestamp);
      if (!Number.isNaN(ts)) {
        if (ts < agg.firstMs) agg.firstMs = ts;
        if (ts > agg.lastMs) agg.lastMs = ts;
      }
    }
    const usage = obj.message && obj.message.usage;
    if (!usage || typeof usage.output_tokens !== "number") continue;
    const key = (obj.message.id || "") + ":" + (obj.requestId || "");
    if (key !== ":") {
      if (seen.has(key)) continue; // 스트리밍 중복 기록 방지 (같은 메시지의 usage를 두 번 세지 않는다)
      seen.add(key);
    }
    agg.output += usage.output_tokens || 0;
    agg.input += usage.input_tokens || 0;
    agg.cacheCreate += usage.cache_creation_input_tokens || 0;
    agg.cacheRead += usage.cache_read_input_tokens || 0;
  }
}

async function main() {
  if (!fs.existsSync(PROJECTS_DIR)) {
    console.error("x ~/.claude/projects not found - nothing to backfill.");
    process.exit(1);
  }
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });

  const liveIds = new Set(
    fs
      .readdirSync(SESSIONS_DIR)
      .filter((name) => name.endsWith(".json") && !name.startsWith("backfill-"))
      .map((name) => name.slice(0, -5)),
  ); // transcript-<id>.json 항목은 그대로 들어와서 위의 transcript- 비교와 맞물린다

  const projectDirs = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true }).filter((entry) => entry.isDirectory());
  let grandOutput = 0;
  let grandSessions = 0;
  let grandSkipped = 0;
  console.log(`Backfill started - ${projectDirs.length} project folders\n`);

  for (const entry of projectDirs) {
    const dirPath = path.join(PROJECTS_DIR, entry.name);
    let files;
    try {
      files = fs.readdirSync(dirPath).filter((name) => name.endsWith(".jsonl"));
    } catch {
      continue;
    }
    const agg = { input: 0, cacheCreate: 0, cacheRead: 0, output: 0, sessions: 0, skipped: 0, firstMs: Infinity, lastMs: 0, cwd: null };
    for (const file of files) {
      const sessionId = file.slice(0, -6);
      const filePath = path.join(dirPath, file);
      // statusline 수집분은 항상 건너뛴다 (Claude가 준 정확한 누적치가 이미 있다)
      if (liveIds.has(sanitize(sessionId))) {
        agg.skipped += 1;
        continue;
      }
      // 테일링 스냅샷: 살아 있는 세션은 건너뛰고, 1시간 이상 조용한 세션은
      // 대시보드가 못 본 꼬리가 있을 수 있으니 전체 재집계값으로 "확정"해 둔다.
      // (스냅샷은 캐릭터 성장 원장이라 지우지 않는다 — 값만 정확하게.)
      if (liveIds.has(sanitize(`transcript-${sessionId}`))) {
        let mtimeMs = 0;
        try {
          mtimeMs = fs.statSync(filePath).mtimeMs;
        } catch {}
        if (Date.now() - mtimeMs >= 60 * 60_000) {
          const solo = { input: 0, cacheCreate: 0, cacheRead: 0, output: 0, firstMs: Infinity, lastMs: 0, cwd: null };
          try {
            await aggregateFile(filePath, solo);
            const tailPath = path.join(SESSIONS_DIR, sanitize(`transcript-${sessionId}`) + ".json");
            const body = {
              savedAt: new Date(solo.lastMs || mtimeMs).toISOString(),
              payload: {
                session_id: `transcript-${sessionId}`,
                workspace: solo.cwd ? { project_dir: solo.cwd, current_dir: solo.cwd } : undefined,
                model: { id: "transcript", display_name: "transcript" },
                cost: { total_cost_usd: null, total_duration_ms: null, total_api_duration_ms: 0, total_lines_added: 0, total_lines_removed: 0 },
                context_window: {
                  total_input_tokens: solo.input + solo.cacheCreate + solo.cacheRead,
                  total_output_tokens: solo.output,
                  context_window_size: null,
                  used_percentage: null,
                },
              },
            };
            fs.writeFileSync(tailPath, JSON.stringify(body));
          } catch {
            /* 확정 실패 시 기존 스냅샷 유지 */
          }
        }
        agg.skipped += 1;
        continue;
      }
      agg.sessions += 1;
      try {
        await aggregateFile(filePath, agg);
      } catch {
        /* 깨진 파일은 건너뛴다 */
      }
    }
    if (agg.sessions === 0 || agg.output === 0) {
      if (agg.skipped) console.log(`- ${entry.name}: no new sessions (${agg.skipped} live-collected skipped)`);
      continue;
    }

    const projectDir = agg.cwd || entry.name;
    const body = {
      savedAt: new Date(agg.lastMs || Date.now()).toISOString(),
      payload: {
        session_id: "backfill-" + entry.name,
        workspace: { project_dir: projectDir, current_dir: projectDir },
        model: { id: "backfill", display_name: "history" },
        cost: { total_cost_usd: null, total_duration_ms: 0, total_api_duration_ms: 0, total_lines_added: 0, total_lines_removed: 0 },
        context_window: { total_input_tokens: agg.input + agg.cacheCreate + agg.cacheRead, total_output_tokens: agg.output },
        backfill: { sessions: agg.sessions, first_at: Number.isFinite(agg.firstMs) ? new Date(agg.firstMs).toISOString() : null },
      },
    };
    fs.writeFileSync(path.join(SESSIONS_DIR, sanitize("backfill-" + entry.name) + ".json"), JSON.stringify(body));

    const totalTokens = agg.input + agg.cacheCreate + agg.cacheRead + agg.output;
    const xp = totalTokens / 1e6; // 1 XP = 총 토큰(캐시 포함) 100만
    const skippedNote = agg.skipped ? ` (skipped ${agg.skipped} live-collected)` : "";
    console.log(`+ ${basename(projectDir)}: ${agg.sessions} sessions, ${fmt(totalTokens)} total tokens -> ~${xp.toFixed(1)} XP (Lv.${levelOf(xp)})${skippedNote}`);
    grandOutput += agg.output;
    grandSessions += agg.sessions;
    grandSkipped += agg.skipped;
  }

  console.log(`\nDone - absorbed ${fmt(grandOutput)} output tokens from ${grandSessions} sessions (${grandSkipped} live-collected skipped).`);
  console.log("The dashboard picks this up automatically within seconds.");
}

main().catch((error) => {
  console.error("x Backfill failed:", error.message);
  process.exit(1);
});
