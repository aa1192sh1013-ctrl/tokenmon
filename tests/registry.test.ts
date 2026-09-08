import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const dir = mkdtempSync(join(tmpdir(), "tokenmon-registry-"));
process.env.TOKENMON_DATA_DIR = join(dir, "new");
process.env.TOKENMON_CLAUDE_DIR = join(dir, "legacy");
mkdirSync(process.env.TOKENMON_CLAUDE_DIR);
const oldFile = join(process.env.TOKENMON_CLAUDE_DIR, "projects.json");
const old = JSON.stringify({ demo: { baselineTokens: 40e6, firstSeenAt: "2026-09-01T00:00:00Z" } });
writeFileSync(oldFile, old);
test("persistent migration preserves old XP and accepts only new Codex growth", async () => {
const { deriveTokenmonState } = await import("../lib/tokenmon");
const { syncProjectRegistry } = await import("../components/pet-registry");
const now = new Date("2026-09-08T00:00:00Z");
function state(codexTotal: number, growth: number) {
  return deriveTokenmonState([
    { savedAt: now.toISOString(), payload: { session_id: "a", provider: "claude", cwd: "C:/Dev/demo", context_window: { total_input_tokens: 100e6 } } },
    { savedAt: now.toISOString(), payload: { session_id: "b", provider: "codex", cwd: "C:/Dev/demo", growth_tokens: growth, context_window: { total_input_tokens: codexTotal } } },
  ], { live: true, now });
}
  const initial = state(500e6, 0);
  const base = syncProjectRegistry(initial.pets);
  assert.equal((initial.pets[0].totalTokens - base["c:/dev/demo"]) / 1e6, 60);
  const next = state(505e6, 5e6);
  const nextBase = syncProjectRegistry(next.pets);
  assert.equal((next.pets[0].totalTokens - nextBase["c:/dev/demo"]) / 1e6, 65);
  // More history found later must not become XP.
  const later = state(905e6, 5e6);
  const laterBase = syncProjectRegistry(later.pets);
  assert.equal((later.pets[0].totalTokens - laterBase["c:/dev/demo"]) / 1e6, 65);
  assert.equal(readFileSync(oldFile, "utf8"), old);
});
