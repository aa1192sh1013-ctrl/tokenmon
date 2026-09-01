#!/usr/bin/env node
/**
 * Tokenmon setup — installs (or removes) the status line collector.
 *
 *   npm run setup              install / update
 *   npm run remove             uninstall (keeps collected data)
 *   npm run remove -- --purge  uninstall and delete collected data too
 *
 * What install does:
 *   1. Copies scripts/statusline.js → ~/.claude/tokenmon/statusline.js
 *   2. Backs up ~/.claude/settings.json, then points `statusLine` at the collector.
 *      If you already had a status line, its command is saved to
 *      ~/.claude/tokenmon/chain.json and keeps rendering — Tokenmon collects silently.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const os = require("os");

const HOME = os.homedir();
const CLAUDE_DIR = path.join(HOME, ".claude");
const TOKENMON_DIR = path.join(CLAUDE_DIR, "tokenmon");
const SESSIONS_DIR = path.join(TOKENMON_DIR, "sessions");
const CHAIN_FILE = path.join(TOKENMON_DIR, "chain.json");
const COLLECTOR_DEST = path.join(TOKENMON_DIR, "statusline.js");
const COLLECTOR_SRC = path.join(__dirname, "statusline.js");
const SETTINGS_FILE = path.join(CLAUDE_DIR, "settings.json");

const args = process.argv.slice(2);
const uninstall = args.includes("--uninstall");
const purge = args.includes("--purge");

function forwardSlashes(p) {
  return p.replace(/\\/g, "/");
}

function readSettings() {
  if (!fs.existsSync(SETTINGS_FILE)) return {};
  const text = fs.readFileSync(SETTINGS_FILE, "utf8").replace(/^﻿/, "");
  if (!text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error(`✗ Could not parse ${SETTINGS_FILE} — not touching it.`);
    console.error(`  (${error.message})`);
    console.error("  Fix the JSON and run setup again.");
    process.exit(1);
  }
}

function backupSettings() {
  if (!fs.existsSync(SETTINGS_FILE)) return null;
  const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
  const backup = `${SETTINGS_FILE}.tokenmon-backup-${stamp}`;
  fs.copyFileSync(SETTINGS_FILE, backup);
  return backup;
}

function writeSettings(settings) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2) + "\n");
}

function isTokenmonCommand(command) {
  return typeof command === "string" && command.includes("tokenmon") && command.includes("statusline.js");
}

function install() {
  if (!fs.existsSync(CLAUDE_DIR)) {
    console.error("✗ ~/.claude not found. Install Claude Code and run it once first:");
    console.error("  https://code.claude.com/docs");
    process.exit(1);
  }

  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
  fs.copyFileSync(COLLECTOR_SRC, COLLECTOR_DEST);
  console.log(`✓ Collector installed → ${COLLECTOR_DEST}`);

  const settings = readSettings();
  const desiredCommand = `node ${forwardSlashes(COLLECTOR_DEST)}`;
  const existing = settings.statusLine;

  const backup = backupSettings();
  if (backup) console.log(`✓ settings.json backed up → ${path.basename(backup)}`);

  if (!existing) {
    settings.statusLine = { type: "command", command: desiredCommand, padding: 0, refreshInterval: 60 };
    console.log("✓ statusLine configured (none existed before).");
  } else if (isTokenmonCommand(existing.command)) {
    settings.statusLine = { ...existing, type: "command", command: desiredCommand };
    if (settings.statusLine.refreshInterval == null) settings.statusLine.refreshInterval = 60;
    console.log("✓ statusLine already pointed at Tokenmon — updated in place.");
  } else {
    fs.writeFileSync(CHAIN_FILE, JSON.stringify({ command: existing.command }, null, 2) + "\n");
    settings.statusLine = { ...existing, type: "command", command: desiredCommand };
    if (settings.statusLine.refreshInterval == null) settings.statusLine.refreshInterval = 60;
    console.log("✓ You already had a status line — it will keep rendering exactly as before.");
    console.log(`  (original command saved to ${CHAIN_FILE}; Tokenmon now collects silently)`);
  }

  writeSettings(settings);
  console.log("");
  console.log("Done! Open a new Claude Code session (any project) to start feeding your Tokenmon,");
  console.log("then run `npm run dev` here and visit http://localhost:4242");
}

function remove() {
  const settings = readSettings();
  const existing = settings.statusLine;

  let chainCommand = null;
  try {
    chainCommand = JSON.parse(fs.readFileSync(CHAIN_FILE, "utf8")).command || null;
  } catch {}

  if (existing && isTokenmonCommand(existing.command)) {
    const backup = backupSettings();
    if (backup) console.log(`✓ settings.json backed up → ${path.basename(backup)}`);
    if (chainCommand) {
      settings.statusLine = { ...existing, command: chainCommand };
      console.log("✓ statusLine restored to your original command.");
    } else {
      delete settings.statusLine;
      console.log("✓ statusLine removed.");
    }
    writeSettings(settings);
  } else {
    console.log("• statusLine is not pointing at Tokenmon — settings.json left untouched.");
  }

  for (const file of [COLLECTOR_DEST, CHAIN_FILE]) {
    try {
      fs.unlinkSync(file);
    } catch {}
  }
  console.log("✓ Collector removed.");

  if (purge) {
    fs.rmSync(TOKENMON_DIR, { recursive: true, force: true });
    console.log("✓ Collected data deleted (~/.claude/tokenmon).");
  } else if (fs.existsSync(SESSIONS_DIR)) {
    console.log(`• Collected data kept at ${SESSIONS_DIR} (run \`npm run remove -- --purge\` to delete).`);
  }
}

if (uninstall) remove();
else install();
