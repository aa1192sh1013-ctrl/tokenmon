#!/usr/bin/env node
/**
 * Tokenmon collector + status line.
 *
 * Claude Code pipes session JSON into this script on every status line update.
 * We save the usage numbers to ~/.claude/tokenmon/sessions/<session_id>.json
 * (one file per session, latest state) and print a small status line.
 *
 * If ~/.claude/tokenmon/chain.json exists (created by `npm run setup` when you
 * already had a status line), we run your original command with the same input
 * and print ITS output instead — Tokenmon then collects silently.
 *
 * We never read or store conversation content — only usage numbers.
 * Installed by `npm run setup`; removed by `npm run remove`.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");

const BASE = path.join(os.homedir(), ".claude", "tokenmon");
const SESSIONS = path.join(BASE, "sessions");
const CHAIN_FILE = path.join(BASE, "chain.json");

process.stdin.setEncoding("utf8");
let raw = "";
process.stdin.on("data", (chunk) => (raw += chunk));
process.stdin.on("end", () => main(raw));

function main(input) {
  let payload = null;
  try {
    payload = JSON.parse(input);
  } catch {
    /* never crash the status line */
  }
  if (payload && typeof payload === "object") save(payload);
  if (printChained(input)) return;
  print(payload || {});
}

function save(payload) {
  try {
    fs.mkdirSync(SESSIONS, { recursive: true });
    const id = String(payload.session_id || "unknown")
      .replace(/[^\w.-]/g, "_")
      .slice(0, 80);
    const file = path.join(SESSIONS, id + ".json");
    const body = JSON.stringify({ savedAt: new Date().toISOString(), payload });
    const tmp = file + "." + process.pid + ".tmp";
    fs.writeFileSync(tmp, body);
    try {
      fs.renameSync(tmp, file); // atomic-ish swap so the dashboard never reads a half-written file
    } catch {
      fs.writeFileSync(file, body);
      try { fs.unlinkSync(tmp); } catch {}
    }
  } catch {
    /* saving failed — still print a status line */
  }
}

/** If the user had their own status line before Tokenmon, run it and print its output. */
function printChained(input) {
  let command = null;
  try {
    const chain = JSON.parse(fs.readFileSync(CHAIN_FILE, "utf8"));
    if (chain && typeof chain.command === "string" && chain.command.trim()) command = chain.command;
  } catch {
    return false;
  }
  if (!command) return false;
  try {
    const result = spawnSync(command, { shell: true, input, encoding: "utf8", timeout: 4000, windowsHide: true });
    const out = (result.stdout || "").replace(/\s+$/, "");
    if (result.status === 0 && out) {
      console.log(out);
      return true;
    }
  } catch {
    /* fall back to our own line */
  }
  return false;
}

/* ---------- Tokenmon's own status line ---------- */

const A = { reset: "\x1b[0m", dim: "\x1b[2m", green: "\x1b[32m", yellow: "\x1b[33m", red: "\x1b[31m" };

function tone(pct) {
  if (pct == null) return A.dim;
  return pct >= 90 ? A.red : pct >= 70 ? A.yellow : A.green;
}

function bar(pct) {
  if (pct == null) return "▱▱▱▱";
  const filled = Math.max(0, Math.min(4, Math.round(pct / 25)));
  return "▰".repeat(filled) + "▱".repeat(4 - filled);
}

function face(fiveHourPct) {
  if (fiveHourPct == null) return "🐣";
  if (fiveHourPct >= 100) return "😴";
  if (fiveHourPct >= 90) return "🥵";
  if (fiveHourPct >= 70) return "😪";
  return "😊";
}

function fmtTokens(n) {
  if (n == null || !isFinite(n) || n <= 0) return null;
  if (n < 1000) return String(n);
  if (n < 1e6) return (n / 1e3).toFixed(1) + "k";
  return (n / 1e6).toFixed(2) + "M";
}

function pct(p) {
  return p == null ? "–" : Math.round(p) + "%";
}

function clock(epochSeconds) {
  if (typeof epochSeconds !== "number") return null;
  const d = new Date(epochSeconds * 1000);
  if (isNaN(d.getTime())) return null;
  return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}

function windowPct(win) {
  return win && typeof win.used_percentage === "number" ? win.used_percentage : null;
}

function print(j) {
  const rl = j.rate_limits || {};
  const five = windowPct(rl.five_hour);
  const week = windowPct(rl.seven_day);
  const cw = j.context_window || {};
  const tokens = (cw.total_input_tokens || 0) + (cw.total_output_tokens || 0);
  const ctx = typeof cw.used_percentage === "number" ? cw.used_percentage : null;
  const model = (j.model && j.model.display_name) || "Claude";
  const cost = j.cost && typeof j.cost.total_cost_usd === "number" ? j.cost.total_cost_usd : null;

  const seg = [face(five) + " Tokenmon", model];

  let fiveText = tone(five) + "5h " + bar(five) + " " + pct(five) + A.reset;
  const resetAt = five != null && five >= 70 ? clock(rl.five_hour && rl.five_hour.resets_at) : null;
  if (resetAt) fiveText += A.dim + " ~" + resetAt + A.reset;
  seg.push(fiveText);
  seg.push(tone(week) + "wk " + pct(week) + A.reset);

  const t = fmtTokens(tokens);
  if (t) seg.push("tok " + t);
  if (ctx != null) seg.push("ctx " + Math.round(ctx) + "%");
  if (cost != null && cost > 0) seg.push("$" + cost.toFixed(2));

  console.log(seg.join(A.dim + " │ " + A.reset));
}
