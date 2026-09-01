# Tokenmon 🐣

> A pixel tamagotchi for your Claude Code usage — it grows as you code, gets sleepy near your rate limit, and naps until the limit resets.

Tired of typing `/usage` to check your Claude Code limits? Tokenmon turns your usage into a little creature that lives in a local dashboard:

- **Every project raises its own character**: each project rolls one of **8 animal-robot species** — 5 common (18% each) and 3 rare ✨ — picked deterministically from the project name (the egg's speckles hint at what's inside). Every Claude Code session in that project feeds it. Projects you're working on right now are awake; the rest nap in the roster 💤. Browse them all at `/gallery`.
- **Lv.1–20 with a real grind**: maxing a character out (👑MAX, 500k XP) takes about a month of genuinely unhinged daily usage. Casual use gets you there in a year. No shortcuts.
- **Summary up top**: fatigue gauge = your 5-hour rate limit, life gauge = your weekly limit — both with live reset countdowns — plus per-session token bars and totals.
- At 70% usage everyone gets sleepy 😪, at 90% exhausted 🥵, at 100% they sleep 😴 until the window resets.
- **Real numbers, not just percentages**: per-session input/output tokens and API-equivalent cost.
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

## What it can and cannot show

| ✅ Exact | ❌ Impossible |
|---|---|
| Per-session input/output tokens | "Exactly N tokens remaining" |
| 5h / weekly usage % and reset times | Absolute subscription limits (Anthropic doesn't publish them) |
| API-equivalent cost, context usage | |

## Leveling (per project)

XP = output tokens ÷ 25 + API minutes × 6 + changed lines × 2, summed over every session in the project — weighted toward *actual work*, not leaving a window open.

| Level | Form | Cumulative XP | Roughly |
|---|---|---|---|
| Lv.1 | 🥚 Egg | 0 | a quick question or two (cracks near hatching) |
| Lv.2–7 | 🐣 Baby | 120 → 1,200 | first real day on the project |
| Lv.8–14 | 🤖 Adult | 1,900 → 30,000 | days-to-weeks of steady work |
| Lv.15–19 | 👑 Golden King | 48,000 → 300,000 | weeks of serious grinding — gold trim + sparkles |
| **Lv.20** | 👑 **MAX** | **500,000** | ~a month of unhinged daily token burning |

Each level costs ~1.6× the previous one (120, 190, 300, 480, 760, 1.2k, … 300k, 500k). Calibrated against real `ccusage` data from a certifiable daily heavy user.

## Species gacha

| Species | | Odds |
|---|---|---|
| 꽥꽥봇 | rubber-duck bot (wind-up key included) | 18% |
| 냥냥봇 | steel cat bot with whiskers | 18% |
| 펭펭봇 | navy penguin bot, LED belly | 18% |
| 깡총봇 | pink bunny bot, antenna ear | 18% |
| 개굴봇 | toy frog bot | 18% |
| 공룡봇 ✨ | spiky dino bot | **5%** |
| 유니뿅 ✨ | unicorn bot, golden horn | **3%** |
| 용용봇 ✨ | winged dragonet bot | **2%** |

The roll is a hash of the project name — deterministic, no rerolls, no crying. (Renaming the folder to reroll is between you and your conscience.)

## Uninstall

```bash
npm run remove            # restores your original status line, keeps collected data
npm run remove -- --purge # also deletes collected data
```

Timestamped backups of `settings.json` are left in `~/.claude/`.

## 한국어

Claude Code 사용량으로 키우는 토큰 다마고치예요. 5시간 한도가 차면 졸려하고, 다 차면 리셋까지 잠들어요. 코딩한 만큼 알 → 아기 클로드 → 코딩 펫 → 용가리로 진화합니다. 전부 로컬에서만 돌고 대화 내용은 절대 수집하지 않아요. `npm run setup` 한 번이면 연결 끝!

## License

MIT © Sunhong Min
