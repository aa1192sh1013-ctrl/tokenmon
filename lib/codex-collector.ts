import { createReadStream, existsSync, openSync, closeSync, readSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { DATA_DIR, readJson, writeJson } from "./local-data";
import type { TokenmonSnapshot } from "./tokenmon";

export interface CodexWindow { usedPct: number; minutes: number; resetsAtMs: number | null }
export interface CodexQuota { id: string; name?: string; observedAt: string; windows: CodexWindow[] }
interface Counter { input: number; output: number }
export interface CodexRecord {
  offset: number; id: string; cwd: string; model: string; createdAt: string;
  savedAt: string; previous: Counter; input: number; output: number;
  growth: number; days: string[]; eligible: boolean; fork: boolean;
  quotas: Record<string, CodexQuota>;
}
interface Cache { version: 1; connectedAt: string; files: Record<string, CodexRecord> }
export interface CodexStatus { indexing: boolean; scanned: number; total: number; errors: number; available: boolean }
const FILE = join(DATA_DIR, "codex-index.json");
const CODEX_HOME_DIR = process.env.TOKENMON_CODEX_DIR || process.env.CODEX_HOME || join(homedir(), ".codex");
export function emptyCodexRecord(): CodexRecord {
  return { offset: 0, id: "", cwd: "", model: "Codex", createdAt: "", savedAt: "", previous: { input: 0, output: 0 }, input: 0, output: 0, growth: 0, days: [], eligible: false, fork: false, quotas: {} };
}
const n = (v: unknown) => typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : 0;

/** Only metadata and numeric usage survive parsing. Chat/tool content is never retained. */
export function ingestCodexEvent(record: CodexRecord, event: any, connectedAt: string) {
  const p = event?.payload;
  if (!p) return;
  if (event.type === "session_meta") {
    record.id = typeof p.id === "string" ? p.id : record.id;
    record.cwd = typeof p.cwd === "string" ? p.cwd : record.cwd;
    record.createdAt = p.timestamp || event.timestamp || record.createdAt;
    record.fork = Boolean(p.forked_from_id || p.forked_from);
    return;
  }
  if (event.type === "turn_context") {
    if (typeof p.model === "string") record.model = p.model;
    return;
  }
  if (event.type !== "event_msg" || p.type !== "token_count") return;
  const at = typeof event.timestamp === "string" ? event.timestamp : "";
  if (!Number.isFinite(Date.parse(at))) return;
  const total = p.info?.total_token_usage;
  if (total && typeof total.input_tokens === "number" && typeof total.output_tokens === "number") {
    const next = { input: n(total.input_tokens), output: n(total.output_tokens) };
    // Cached input and reasoning output are already subsets of these counters.
    let di = Math.max(0, next.input - record.previous.input);
    let dout = Math.max(0, next.output - record.previous.output);
    if (record.fork && record.previous.input === 0 && record.previous.output === 0) {
      di = Math.min(di, n(p.info?.last_token_usage?.input_tokens));
      dout = Math.min(dout, n(p.info?.last_token_usage?.output_tokens));
    }
    record.previous = next;
    // Forked files can contain events copied from before their creation.
    if (!record.createdAt || Date.parse(at) >= Date.parse(record.createdAt)) {
      record.input += di; record.output += dout;
      if (di + dout > 0) {
        record.savedAt = at;
        const date = new Date(at);
        const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        if (!record.days.includes(day)) record.days.push(day);
        if (Date.parse(at) >= Date.parse(connectedAt)) record.growth += di + dout;
        if (Date.parse(at) >= Date.parse(connectedAt) - 30 * 60_000) record.eligible = true;
      }
    }
  }
  const limits = p.rate_limits;
  if (limits && (!record.createdAt || Date.parse(at) >= Date.parse(record.createdAt))) {
    const windows: CodexWindow[] = [];
    for (const key of ["primary", "secondary"]) {
      const w = limits[key];
      if (!w || typeof w.used_percent !== "number" || !Number.isFinite(w.used_percent)) continue;
      windows.push({ usedPct: Math.max(0, Math.min(100, w.used_percent)), minutes: n(w.window_minutes), resetsAtMs: typeof w.resets_at === "number" ? w.resets_at * 1000 : null });
    }
    const id = typeof limits.limit_id === "string" ? limits.limit_id : "codex";
    if (windows.length) record.quotas[id] = { id, name: typeof limits.limit_name === "string" ? limits.limit_name : undefined, observedAt: at, windows };
  }
}

function listLogs(root: string): string[] {
  try { return readdirSync(root, { withFileTypes: true }).flatMap(e => e.isDirectory() ? listLogs(join(root, e.name)) : e.name.endsWith(".jsonl") ? [join(root, e.name)] : []); }
  catch { return []; }
}

export async function scanCodexFile(file: string, record: CodexRecord, connectedAt: string) {
  const size = statSync(file).size;
  if (size === record.offset) return;
  if (size < record.offset) throw new Error("Log truncated; retaining the last verified counters");
  const fd = openSync(file, "r"); const last = Buffer.alloc(1);
  try { readSync(fd, last, 0, 1, size - 1); } finally { closeSync(fd); }
  const newline = last[0] === 10;
  const lines = createInterface({ input: createReadStream(file, { start: record.offset, end: size - 1, encoding: "utf8" }), crlfDelay: Infinity });
  let pending: string | undefined;
  const ingest = (line: string) => {
    if (!/"type"\s*:\s*"(?:session_meta|turn_context|event_msg)"/.test(line.slice(0, 180))) return;
    try { ingestCodexEvent(record, JSON.parse(line), connectedAt); } catch { /* Incomplete/malformed events cannot replace valid counters. */ }
  };
  for await (const line of lines) { if (pending !== undefined) ingest(pending); pending = line; }
  if (pending !== undefined && newline) ingest(pending);
  record.offset = newline ? size : size - Buffer.byteLength(pending || "", "utf8");
}

type Store = { cache: Cache; running: boolean; lastScan: number; status: CodexStatus };
const globals = globalThis as unknown as { tokenmonCodex?: Store };
function store(): Store {
  if (!globals.tokenmonCodex) globals.tokenmonCodex = {
    cache: readJson<Cache>(FILE, { version: 1, connectedAt: new Date().toISOString(), files: {} }),
    running: false, lastScan: 0, status: { indexing: false, scanned: 0, total: 0, errors: 0, available: existsSync(/* turbopackIgnore: true */ CODEX_HOME_DIR) },
  };
  return globals.tokenmonCodex;
}

async function refresh(s: Store) {
  s.running = true; s.status.indexing = Object.keys(s.cache.files).length === 0; s.status.errors = 0; s.status.scanned = 0;
  try {
    // Recent sessions become available first while older history is indexed.
    const files = [...listLogs(join(CODEX_HOME_DIR, "sessions")), ...listLogs(join(CODEX_HOME_DIR, "archived_sessions"))].sort().reverse();
    s.status.total = files.length;
    s.status.indexing = files.some(file => !s.cache.files[file]);
    for (const file of files) {
      try {
        const record = structuredClone(s.cache.files[file] || emptyCodexRecord());
        await scanCodexFile(file, record, s.cache.connectedAt);
        s.cache.files[file] = record;
      } catch { s.status.errors++; }
      s.status.scanned++;
      if (s.status.scanned % 25 === 0) writeJson(FILE, s.cache);
    }
    writeJson(FILE, s.cache);
  } catch { s.status.errors++; }
  finally { s.running = false; s.status.indexing = false; s.lastScan = Date.now(); }
}

export function readCodexUsage(): { snapshots: TokenmonSnapshot[]; quotas: CodexQuota[]; status: CodexStatus } {
  const s = store();
  if (!s.running && Date.now() - s.lastScan > 10_000) void refresh(s);
  const unique = new Map<string, CodexRecord>();
  for (const r of Object.values(s.cache.files)) {
    if (!r.id || !r.savedAt) continue;
    const old = unique.get(r.id);
    if (!old || Date.parse(r.savedAt) > Date.parse(old.savedAt) || (r.input + r.output > old.input + old.output)) unique.set(r.id, r);
  }
  const quotas = new Map<string, CodexQuota>();
  const snapshots: TokenmonSnapshot[] = [];
  for (const r of unique.values()) {
    snapshots.push({ savedAt: r.savedAt, payload: { session_id: `codex-${r.id}`, provider: "codex", cwd: r.cwd, history_only: !r.eligible, growth_tokens: r.growth, model: { display_name: r.model }, context_window: { total_input_tokens: r.input, total_output_tokens: r.output }, backfill: { days: r.days } } });
    for (const q of Object.values(r.quotas)) if (!quotas.has(q.id) || Date.parse(q.observedAt) > Date.parse(quotas.get(q.id)!.observedAt)) quotas.set(q.id, q);
  }
  return { snapshots, quotas: [...quotas.values()], status: { ...s.status } };
}
