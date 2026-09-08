import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { deriveTokenmonState, type TokenmonSnapshot } from "../lib/tokenmon";
import { emptyCodexRecord, ingestCodexEvent } from "../lib/codex-collector";
import { normalizeProjectPath, projectIdentity } from "../lib/project-identity";
import { migrateLegacyBaselines } from "../components/pet-registry";

const now = new Date("2026-09-08T04:00:00Z");
function snapshot(provider: "claude" | "codex", id: string, cwd: string, tokens: number): TokenmonSnapshot {
  return { savedAt: now.toISOString(), payload: { provider, session_id: id, cwd, project_id: normalizeProjectPath(cwd), context_window: { total_input_tokens: tokens, total_output_tokens: 0 } } };
}
function event(input: number, output: number, timestamp = now.toISOString()) {
  return { type: "event_msg", timestamp, payload: { type: "token_count", info: { total_token_usage: { input_tokens: input, cached_input_tokens: input * .8, output_tokens: output, reasoning_output_tokens: output * .2 }, last_token_usage: { input_tokens: 10, output_tokens: 2 } } } };
}
test("same project combines providers, same basename in another path stays separate", () => {
  const state = deriveTokenmonState([snapshot("claude", "a", "C:/Dev/app", 5e6), snapshot("codex", "b", "C:/Dev/app", 3e6), snapshot("codex", "c", "D:/Other/app", 1e6)], { live: true, now });
  assert.equal(state.pets.length, 2);
  assert.equal(state.pets.find(p => p.projectId === "c:/dev/app")?.level, 2);
  assert.deepEqual(state.pets[0].providerTokens, { claude: 5e6, codex: 3e6 });
  assert.equal(state.providerTotals.codex.inputTokens, 4e6);
});
test("Codex history affects totals and days, not hatching", () => {
  const s = snapshot("codex", "old", "C:/Dev/old", 1e9); s.payload.history_only = true;
  const state = deriveTokenmonState([s], { live: true, now });
  assert.equal(state.pets.length, 0); assert.equal(state.totals.inputTokens, 1e9); assert.equal(state.totals.sessionCount, 1);
});
test("Codex counters are not repeatedly added and subset tokens are not double counted", () => {
  const r = emptyCodexRecord(); const cutoff = "2026-09-08T03:00:00Z";
  ingestCodexEvent(r, event(100, 20), cutoff); ingestCodexEvent(r, event(100, 20), cutoff); ingestCodexEvent(r, event(130, 25), cutoff);
  assert.equal(r.input, 130); assert.equal(r.output, 25); assert.equal(r.growth, 155);
});
test("history imports produce no XP; new increments do", () => {
  const r = emptyCodexRecord(); const cutoff = "2026-09-08T03:00:00Z";
  ingestCodexEvent(r, event(100, 20, "2026-09-07T03:00:00Z"), cutoff);
  assert.equal(r.growth, 0); assert.equal(r.eligible, false);
  ingestCodexEvent(r, event(150, 30), cutoff);
  assert.equal(r.growth, 60); assert.equal(r.eligible, true);
});
test("forked inherited usage is excluded", () => {
  const r = emptyCodexRecord();
  ingestCodexEvent(r, { type: "session_meta", payload: { id: "child", timestamp: "2026-09-08T03:00:00Z", forked_from_id: "parent" } }, "2026-09-08T03:00:00Z");
  ingestCodexEvent(r, event(1000, 200, "2026-09-07T03:00:00Z"), "2026-09-08T03:00:00Z");
  ingestCodexEvent(r, event(1010, 202), "2026-09-08T03:00:00Z");
  assert.equal(r.input, 10); assert.equal(r.output, 2);
});
test("fork with no copied events starts with only its own first response", () => {
  const r = emptyCodexRecord(); r.fork = true;
  ingestCodexEvent(r, event(1010, 202), "2026-09-08T03:00:00Z");
  assert.equal(r.input, 10); assert.equal(r.output, 2);
});
test("rate-limit windows retain actual duration and separate buckets", () => {
  const r = emptyCodexRecord();
  const e: any = event(100, 20); e.payload.rate_limits = { limit_id: "codex", primary: { used_percent: 5, window_minutes: 10080, resets_at: 1789446464 }, secondary: null };
  ingestCodexEvent(r, e, now.toISOString());
  assert.equal(r.quotas.codex.windows[0].minutes, 10080); assert.equal(r.quotas.codex.windows.length, 1);
});
test("legacy name baselines preserve combined XP when paths are separated", () => {
  const state = deriveTokenmonState([snapshot("claude", "a", "C:/Dev/app", 80e6), snapshot("claude", "b", "D:/Other/app", 20e6)], { live: true, now });
  const baselines = migrateLegacyBaselines(state.pets, { app: { baselineTokens: 40e6 } });
  assert.equal(baselines["c:/dev/app"], 32e6); assert.equal(baselines["d:/other/app"], 8e6);
  const after = deriveTokenmonState([snapshot("claude", "a", "C:/Dev/app", 80e6), snapshot("claude", "b", "D:/Other/app", 20e6)], { live: true, now, baselines });
  assert.equal(after.pets.reduce((s, p) => s + p.xp, 0), 60);
});
test("Git worktrees map to original repository; Unix path case remains significant", () => {
  const dir = mkdtempSync(join(tmpdir(), "tokenmon-identity-"));
  const root = join(dir, "repo"), work = join(dir, "worktree"), gitWork = join(root, ".git", "worktrees", "sample");
  mkdirSync(gitWork, { recursive: true }); mkdirSync(work);
  writeFileSync(join(work, ".git"), `gitdir: ${gitWork}`); writeFileSync(join(gitWork, "commondir"), "../..");
  assert.equal(projectIdentity(work).id, normalizeProjectPath(root));
  assert.notEqual(normalizeProjectPath("/repo/App"), normalizeProjectPath("/repo/app"));
});
