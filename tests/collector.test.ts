import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, writeFileSync, appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { emptyCodexRecord, scanCodexFile } from "../lib/codex-collector";

const cutoff = "2026-09-08T00:00:00Z";
const meta = { timestamp: cutoff, type: "session_meta", payload: { id: "fixture", cwd: "C:/Dev/demo", timestamp: cutoff } };
const usage = (input: number) => ({ timestamp: "2026-09-08T00:01:00Z", type: "event_msg", payload: { type: "token_count", info: { total_token_usage: { input_tokens: input, output_tokens: 10 } } } });

test("file tail waits for complete lines, survives restart, and ignores conversation text", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tokenmon-collector-")), file = join(dir, "sample.jsonl");
  const secret = "DO_NOT_PERSIST_CONVERSATION";
  writeFileSync(file, [meta, { type: "response_item", payload: { text: secret } }, usage(100)].map(value => JSON.stringify(value)).join("\n") + "\n");
  let record = emptyCodexRecord();
  await scanCodexFile(file, record, cutoff);
  assert.equal(record.input, 100); assert.equal(record.output, 10);
  const offset = record.offset;
  const next = JSON.stringify(usage(200));
  appendFileSync(file, next.slice(0, 50));
  await scanCodexFile(file, record, cutoff);
  assert.equal(record.offset, offset); assert.equal(record.input, 100);
  // Simulate cache round-trip and the rest of a log append.
  record = JSON.parse(JSON.stringify(record));
  appendFileSync(file, next.slice(50) + "\n");
  await scanCodexFile(file, record, cutoff);
  assert.equal(record.input, 200); assert.equal(record.output, 10);
  await scanCodexFile(file, record, cutoff);
  assert.equal(record.input, 200);
  assert.equal(JSON.stringify(record).includes(secret), false);
});

test("truncated source does not silently discard verified counts", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tokenmon-truncate-")), file = join(dir, "sample.jsonl");
  writeFileSync(file, [meta, usage(100)].map(value => JSON.stringify(value)).join("\n") + "\n");
  const record = emptyCodexRecord(); await scanCodexFile(file, record, cutoff);
  writeFileSync(file, "");
  await assert.rejects(scanCodexFile(file, record, cutoff), /truncated/);
  assert.equal(record.input, 100);
});
