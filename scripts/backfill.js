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

/* lib/tokenmon.ts 의 LEVEL_XP와 같은 값 — 리포트 출력용 사본 */
const LEVEL_XP = [0, 0, 120, 190, 300, 480, 760, 1200, 1900, 3000, 4800, 7600, 12000, 19000, 30000, 48000, 76000, 120000, 190000, 300000, 500000];

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
    console.error("✗ ~/.claude/projects 가 없습니다 — 백필할 기록이 없어요.");
    process.exit(1);
  }
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });

  const liveIds = new Set(
    fs
      .readdirSync(SESSIONS_DIR)
      .filter((name) => name.endsWith(".json") && !name.startsWith("backfill-"))
      .map((name) => name.slice(0, -5)),
  );

  const projectDirs = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true }).filter((entry) => entry.isDirectory());
  let grandOutput = 0;
  let grandSessions = 0;
  let grandSkipped = 0;
  console.log(`백필 시작 — 프로젝트 폴더 ${projectDirs.length}개\n`);

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
      if (liveIds.has(sanitize(sessionId))) {
        agg.skipped += 1;
        continue;
      }
      agg.sessions += 1;
      try {
        await aggregateFile(path.join(dirPath, file), agg);
      } catch {
        /* 깨진 파일은 건너뛴다 */
      }
    }
    if (agg.sessions === 0 || agg.output === 0) {
      if (agg.skipped) console.log(`· ${entry.name} — 새로 집계할 세션 없음 (라이브 수집 ${agg.skipped}개 제외)`);
      continue;
    }

    const projectDir = agg.cwd || entry.name;
    const body = {
      savedAt: new Date(agg.lastMs || Date.now()).toISOString(),
      payload: {
        session_id: "backfill-" + entry.name,
        workspace: { project_dir: projectDir, current_dir: projectDir },
        model: { id: "backfill", display_name: "지난 기록" },
        cost: { total_cost_usd: null, total_duration_ms: 0, total_api_duration_ms: 0, total_lines_added: 0, total_lines_removed: 0 },
        context_window: { total_input_tokens: agg.input + agg.cacheCreate + agg.cacheRead, total_output_tokens: agg.output },
        backfill: { sessions: agg.sessions, first_at: Number.isFinite(agg.firstMs) ? new Date(agg.firstMs).toISOString() : null },
      },
    };
    fs.writeFileSync(path.join(SESSIONS_DIR, sanitize("backfill-" + entry.name) + ".json"), JSON.stringify(body));

    const xp = Math.floor(agg.output / 25);
    const skippedNote = agg.skipped ? ` · 라이브 수집 ${agg.skipped}개 제외` : "";
    console.log(`✓ ${basename(projectDir)} — 세션 ${agg.sessions}개, 출력 ${fmt(agg.output)} 토큰 → 약 ${fmt(xp)} XP (Lv.${levelOf(xp)})${skippedNote}`);
    grandOutput += agg.output;
    grandSessions += agg.sessions;
    grandSkipped += agg.skipped;
  }

  console.log(`\n완료 — 세션 ${grandSessions}개에서 출력 ${fmt(grandOutput)} 토큰을 반영했습니다 (라이브 수집 ${grandSkipped}개 제외).`);
  console.log("대시보드는 20초 안에 자동 반영됩니다.");
}

main().catch((error) => {
  console.error("✗ 백필 실패:", error.message);
  process.exit(1);
});
