# Tokenmon 🐣

> A pixel tamagotchi for your Claude Code usage — it grows as you code, gets sleepy near your rate limit, and naps until the limit resets.

Tired of typing `/usage` to check your Claude Code limits? Tokenmon turns your usage into a little creature that lives in a local dashboard:

- **Every project raises its own mecha companion**: each project rolls one of **60 distinct animal-mecha species** — 50 commons (mammals, predators, birds, reptiles, fish, sea creatures) plus 10 rares ✨ (5 dinos, 5 mythical beasts) — and separately rolls one of **12 colors** (red/orange/yellow/green/blue/indigo/violet/white/black/gold/silver/bronze), both deterministically from the project name. Every character carries robot hardware: a chest core plate with a glowing power core, panel seams, shoulder bolts, and tech-glow eyes. Projects you're working on right now are awake; the rest go into power-save 💤. Browse them all at `/gallery`.
- **Lv.1–20, no stage classes — just continuous growth**: every species has 20 unique illustrated evolution stages, from a wide-eyed Lv.1 baby bot to a fully-armored Lv.20 war machine (👑MAX at 5,700 XP ≈ 5.7B total tokens — months of unhinged daily usage). The sprite gets bigger and meaner every single level.
- **Don't waste what you already paid for**: the 5-hour bowl and weekly bucket gauges show how much of your subscription capacity you've actually eaten — whatever's left at reset **evaporates** 💸. The panel counts down to the next evaporation and reports how much you wasted last window.
- **Neglect has consequences**: leave a project untouched for 3+ days and its character starts starving 🥀 — XP withers ~3% a day and levels can drop — until one session restores it in full. Skip a day and your streak 🔥 is gone.
- **English & Korean**: the UI is English by default and switches to Korean automatically when your browser prefers it (force either with `{ "lang": "ko" | "en" }` in `~/.claude/tokenmon/config.json`).
- **Real numbers, not just percentages**: per-session output tokens up front; input (cache included) and cost in the table.
- A **terminal status line** too: `😊 Tokenmon │ Opus │ 5h ▰▰▱▱ 42% │ wk 22% │ tok 43.9k │ ctx 4% │ $0.44`

Everything runs **100% locally**. No conversation content is ever read or stored — only usage numbers.

## Requirements

- [Claude Code](https://code.claude.com) (run it at least once)
- Node.js 20.9+
- Rate-limit gauges require a Claude Pro/Max subscription (Claude Code only reports `rate_limits` for subscribers). API-key users still get session tokens, cost, and the pet.

## Quick start

```bash
git clone <this-repo>
cd tokenmon
npm install
npm run setup     # installs the collector into ~/.claude (with a settings backup)
npm run dev       # dashboard at http://localhost:4242
```

Then open a new Claude Code session anywhere and do anything — your Tokenmon hatches within seconds.

**Already a Claude Code user?** Pull your past months of usage into the ranch:

```bash
npm run backfill
```

It scans your local `~/.claude/projects` transcripts and aggregates **numbers only** (tokens, timestamps — conversation content is never stored) into one history summary per project, so your characters instantly reflect your real track record. Safe to re-run any time: summaries are overwritten and live-collected sessions are never double-counted.

**Keeping the ranch tidy**: sessions started in your home directory, Desktop/Downloads/Documents, or anywhere under the OS temp folder never hatch characters (their usage still counts in the totals). To exclude more by name, create `~/.claude/tokenmon/config.json`:

```json
{ "ignoreProjects": ["_*", "*-sandbox"] }
```

Want it as a desktop widget? Open it in browser app mode:

```bash
# Windows (Edge)          macOS (Chrome)
start msedge --app=http://localhost:4242
open -na "Google Chrome" --args --app=http://localhost:4242
```

## How it works

```
Claude Code ──(status line JSON: tokens, rate limits, cost)──▶ ~/.claude/tokenmon/statusline.js
        ──▶ ~/.claude/tokenmon/sessions/<session>.json ──▶ this dashboard (reads files, no server needed)
```

Claude Code pipes session JSON into whatever command is configured as your [status line](https://code.claude.com/docs/en/statusline), on every response and every 60 seconds. `npm run setup` points that at Tokenmon's tiny collector (a dependency-free Node script), which stores the latest usage snapshot per session. The dashboard reads those files and derives the pet's state.

**Already have a status line?** Setup won't clobber it. Your original command is saved and keeps rendering exactly as before — Tokenmon chains it and collects silently. Your `settings.json` is backed up before any change.

**Rate-limit gauges are fetched directly.** The bowl meters query Anthropic's usage endpoint — the same one the Claude desktop app's usage screen uses — with the OAuth token Claude Code already stores locally (`~/.claude/.credentials.json`). The token is read, never stored or logged, and the only network traffic is your machine ↔ Anthropic. This keeps the gauges live even in sessions without a status line, and falls back to status-line observations (then a transcript-based estimate) if it's unavailable. Opt out with `{ "useUsageApi": false }` in `~/.claude/tokenmon/config.json`.

## What it can and cannot show

| ✅ Exact | ❌ Impossible |
|---|---|
| Per-session input/output tokens | "Exactly N tokens remaining" |
| 5h / weekly usage % and reset times | Absolute subscription limits (Anthropic doesn't publish them) |
| API-equivalent cost, context usage | |

## Leveling (per project)

**1 XP = 1,000,000 total tokens** (input + cache + output — the same unit as `ccusage`'s Total Tokens column), summed over every session in the project. The curve is gentle (~1.2× per level: 37, 44, 53, 64, … 814, ~1,000) and tops out at **5,700 XP ≈ 5.7B total tokens for Lv.20** — calibrated against real `ccusage` data from a certifiable daily heavy user: months of hard daily grinding on a single project.

## Species gacha — 60 to collect × 12 colors

| Tier | Species | Odds each |
|---|---|---|
| Common (50) | 늑대·여우·강아지·고양이·사자·호랑이·표범·치타·곰·판다 · 토끼·사슴·염소·말·들소·코끼리·코뿔소·고릴라·원숭이·수달 · 너구리·캥거루·박쥐·독수리·부엉이·까마귀·매·펭귄·공작·앵무 · 두루미·악어·코브라·카멜레온·거북·개구리·상어·범고래·돌고래·고래 · 문어·오징어·게·가오리·해마·사슴벌레·사마귀·전갈·거미·나비 | 1.8% |
| Dino ✨ (5) | 티라노봇 · 트리케라봇 · 랩터봇 · 안킬로봇 · 프테라봇 | **1.2%** |
| Mythic ✨ (5) | 드래곤봇 · 불사조봇 · 그리핀봇 · 키린봇 · 케르베로스봇 | **0.8%** |

Every species ships with **20 hand-illustrated evolution stages** (Lv.1 baby bot → Lv.20 final form) as mecha-animal concept art, tinted per project by the color roll.

Color (12 options) rolls on a separate hash, so two projects with the same species can still look different. Both rolls are deterministic from the project name — no rerolls, no crying. (Renaming the folder to reroll is between you and your conscience.)

## Uninstall

```bash
npm run remove            # restores your original status line, keeps collected data
npm run remove -- --purge # also deletes collected data
```

Timestamped backups of `settings.json` are left in `~/.claude/`.

## 한국어

Claude Code 사용량으로 키우는 토큰 다마고치예요. 프로젝트 폴더마다 메카 동물 캐릭터가 한 마리씩 부화해서(60종 × 12색 랜덤), 총 토큰 100만 개당 1 XP로 Lv.20까지 자랍니다. 레벨마다 진화 일러스트가 통째로 바뀌고, 3일 넘게 방치하면 굶어서 XP가 마르고, 5시간 밥그릇을 안 비우면 그만큼 증발해요. 전부 로컬에서만 돌고 대화 내용은 절대 수집하지 않아요. UI는 브라우저가 한국어면 자동으로 한국어로 나옵니다. `npm run setup` 한 번이면 연결 끝!

## License

MIT © Sunhong Min
