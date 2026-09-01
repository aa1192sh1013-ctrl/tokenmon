/**
 * Tokenmon 미리보기 데이터 — 수집기가 아직 스냅샷을 만들기 전에도
 * 화면이 살아 있는 모습으로 보이도록 하는 가짜 스냅샷 묶음.
 * 기준 시각(now)만 받아 항상 같은 모양을 만든다(난수 없음).
 * 세션별 진화 단계가 골고루 보이도록 값을 맞춰두었다(알~용가리).
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
  apiMin: number;
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
        total_duration_ms: spec.apiMin * 3 * MINUTE,
        total_api_duration_ms: spec.apiMin * MINUTE,
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
      id: "mock-side-project-1",
      project: "side-project",
      model: "Opus",
      atMs: t - 1 * MINUTE,
      input: 182_000,
      output: 24_300,
      apiMin: 42,
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
      apiMin: 18,
      cost: 0.63,
      ctxPct: 18,
    }),
    snapshot({
      id: "mock-web-app-140",
      project: "web-app",
      model: "Opus",
      atMs: t - 20 * HOUR,
      input: 241_000,
      output: 118_000,
      apiMin: 95,
      cost: 6.4,
      ctxPct: 55,
    }),
    snapshot({
      id: "mock-dotfiles",
      project: "dotfiles",
      model: "Sonnet",
      atMs: t - 2 * DAY - 2 * HOUR,
      input: 42_500,
      output: 4_800,
      apiMin: 9,
      cost: 0.34,
      ctxPct: 12,
    }),
    snapshot({
      id: "mock-weekend-hack-1",
      project: "weekend-hack",
      model: "Haiku",
      atMs: t - 2 * DAY - 6 * HOUR,
      input: 8_200,
      output: 900,
      apiMin: 2,
      cost: 0.04,
      ctxPct: 4,
    }),
  ];
}
