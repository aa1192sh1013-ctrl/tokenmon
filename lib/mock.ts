/**
 * Tokenmon 미리보기 데이터 — 수집기가 아직 스냅샷을 만들기 전에도
 * 화면이 살아 있는 모습으로 보이도록 하는 가짜 스냅샷 묶음.
 * 기준 시각(now)만 받아 항상 같은 모양을 만든다(난수 없음).
 */
import type { TokenmonSnapshot } from "@/lib/tokenmon";

const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

interface MockSessionSpec {
  id: string;
  project: string;
  model: string;
  atMs: number;
  input: number;
  output: number;
  cost: number;
  ctxPct: number;
  fiveHour?: { pct: number; resetsAtMs: number };
  sevenDay?: { pct: number; resetsAtMs: number };
}

function snapshot(spec: MockSessionSpec): TokenmonSnapshot {
  return {
    savedAt: new Date(spec.atMs).toISOString(),
    payload: {
      session_id: spec.id,
      model: { id: `claude-${spec.model.toLowerCase()}-5`, display_name: spec.model },
      workspace: { current_dir: `~/dev/${spec.project}`, project_dir: `~/dev/${spec.project}` },
      cost: {
        total_cost_usd: spec.cost,
        total_duration_ms: 45 * MINUTE,
        total_lines_added: Math.round(spec.output / 400),
        total_lines_removed: Math.round(spec.output / 2000),
      },
      context_window: {
        total_input_tokens: spec.input,
        total_output_tokens: spec.output,
        context_window_size: 200_000,
        used_percentage: spec.ctxPct,
      },
      rate_limits:
        spec.fiveHour || spec.sevenDay
          ? {
              five_hour: spec.fiveHour
                ? { used_percentage: spec.fiveHour.pct, resets_at: Math.round(spec.fiveHour.resetsAtMs / 1000) }
                : undefined,
              seven_day: spec.sevenDay
                ? { used_percentage: spec.sevenDay.pct, resets_at: Math.round(spec.sevenDay.resetsAtMs / 1000) }
                : undefined,
            }
          : undefined,
    },
  };
}

export function mockTokenmonSnapshots(now: Date = new Date()): TokenmonSnapshot[] {
  const t = now.getTime();
  return [
    snapshot({
      id: "mock-side-project",
      project: "side-project",
      model: "Opus",
      atMs: t - 10 * MINUTE,
      input: 182_000,
      output: 24_300,
      cost: 1.84,
      ctxPct: 42,
      fiveHour: { pct: 62, resetsAtMs: t + 110 * MINUTE },
      sevenDay: { pct: 38, resetsAtMs: t + 2.8 * DAY },
    }),
    snapshot({
      id: "mock-api-server",
      project: "api-server",
      model: "Sonnet",
      atMs: t - 3 * HOUR,
      input: 96_400,
      output: 11_200,
      cost: 0.63,
      ctxPct: 18,
    }),
    snapshot({
      id: "mock-web-app",
      project: "web-app",
      model: "Opus",
      atMs: t - 20 * HOUR,
      input: 241_000,
      output: 31_800,
      cost: 2.9,
      ctxPct: 55,
    }),
    snapshot({
      id: "mock-dotfiles",
      project: "dotfiles",
      model: "Sonnet",
      atMs: t - 2 * DAY - 2 * HOUR,
      input: 129_500,
      output: 14_900,
      cost: 0.98,
      ctxPct: 27,
    }),
    snapshot({
      id: "mock-weekend-hack",
      project: "weekend-hack",
      model: "Haiku",
      atMs: t - 2 * DAY - 6 * HOUR,
      input: 40_200,
      output: 6_100,
      cost: 0.12,
      ctxPct: 9,
    }),
  ];
}
