# Tokenmon 🐣

> A pixel tamagotchi for your Claude Code usage — it grows as you code, gets sleepy near your rate limit, and naps until the limit resets.

Tired of typing `/usage` to check your Claude Code limits? Tokenmon turns your usage into a little creature that lives in a local dashboard:

- **It evolves**: Egg → Baby Claude → Coding Pet → Dragon, fed by your coding activity (active days, sessions, output tokens).
- **Fatigue gauge** = your 5-hour rate limit. **Life gauge** = your weekly limit. Both with live reset countdowns.
- At 70% it gets sleepy 😪, at 90% it's exhausted 🥵, at 100% it sleeps 😴 until the window resets.
- **Real numbers, not just percentages**: per-session token counts (input/output), API-equivalent cost, and how many Claude Code windows you have open right now (they appear as little minions).
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

## Evolution

| Stage | XP | Roughly |
|---|---|---|
| 🥚 Egg | 0 | day one (it cracks as it gets close to hatching) |
| 🐣 Baby Claude | 350 | your first day of real use |
| 🐥 Coding Pet | 2,500 | about a week of regular coding |
| 🐲 Dragon | 8,000 | a month+ of heavy vibecoding |

XP = active days × 300 + sessions × 60 + output tokens ÷ 500. Deliberately weighted toward *showing up regularly*, not burning tokens.

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
