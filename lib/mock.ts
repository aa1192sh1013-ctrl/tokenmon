/**
 * Tokenmon 미리보기 데이터 — 수집기가 아직 스냅샷을 만들기 전에도
 * 화면이 살아 있는 모습으로 보이도록 하는 가짜 스냅샷 묶음.
 * 기준 시각(now)만 받아 항상 같은 모양을 만든다(난수 없음).
 * 프로젝트별 캐릭터 레벨이 알(Lv.1)부터 만렙(Lv.20)까지 골고루 보이도록 값을 맞춰두었다.
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
        // 실사용에서 입력(캐시 포함)은 출력의 수백 배 규모다 — XP(총 토큰 기준)가 그럴듯하게 나오게 맞춘다
        total_input_tokens: spec.output * 350,
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
    // side-project → Lv.1 부화 임박한 알 (약 30 XP, 지금 작업 중)
    snapshot({
      id: "mock-a1",
      project: "side-project",
      model: "Opus",
      atMs: t - 1 * MINUTE,
      output: 86_000,
      apiMin: 3,
      cost: 0.21,
      ctxPct: 9,
      fiveHour: { pct: 62, resetsAtMs: t + 110 * MINUTE },
      sevenDay: { pct: 38, resetsAtMs: t + 2.8 * DAY },
    }),
    // hoppy-notes → Lv.5 (약 228 XP)
    snapshot({ id: "mock-b1", project: "hoppy-notes", model: "Haiku", atMs: t - 3 * DAY, output: 650_000, apiMin: 12, cost: 0.35, ctxPct: 8 }),
    // api-server → Lv.8 (약 540 XP)
    snapshot({ id: "mock-c1", project: "api-server", model: "Sonnet", atMs: t - 2 * DAY, output: 1_540_000, apiMin: 30, cost: 2.4, ctxPct: 21 }),
    // web-app → Lv.10 (약 850 XP)
    snapshot({ id: "mock-d1", project: "web-app", model: "Opus", atMs: t - 5 * HOUR, output: 2_420_000, apiMin: 60, cost: 9.8, ctxPct: 44 }),
    // neon-garden → Lv.16 (약 2,900 XP)
    snapshot({ id: "mock-e1", project: "neon-garden", model: "Opus", atMs: t - 1 * DAY, output: 5_200_000, apiMin: 150, cost: 84, ctxPct: 61 }),
    snapshot({ id: "mock-e2", project: "neon-garden", model: "Sonnet", atMs: t - 4 * DAY, output: 3_060_000, apiMin: 120, cost: 41, ctxPct: 37 }),
    // night-shift → Lv.20 👑MAX (약 6,200 XP — 몇 달 갈아넣은 프로젝트)
    snapshot({ id: "mock-f1", project: "night-shift", model: "Opus", atMs: t - 20 * HOUR, output: 7_400_000, apiMin: 280, cost: 320, ctxPct: 72 }),
    snapshot({ id: "mock-f2", project: "night-shift", model: "Opus", atMs: t - 3 * DAY, output: 6_300_000, apiMin: 300, cost: 288, ctxPct: 68 }),
    snapshot({ id: "mock-f3", project: "night-shift", model: "Sonnet", atMs: t - 6 * DAY, output: 4_000_000, apiMin: 240, cost: 96, ctxPct: 55 }),
  ];
}
