import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/**
 * 사용량 시계열 — 밥그릇 게이지 공백(새 창인데 statusline 관측이 아직 없는 동안)을
 * "리셋 이후 총 토큰 증가량"으로 추정하기 위한 체크포인트 기록.
 *
 * 저장: ~/.claude/tokenmon/usage-series.json
 *  - checkpoints: [시각ms, 누적 총 토큰] — 대시보드 폴링마다 60초 간격으로 기록
 *  - marks: [창 리셋시각ms, 관측 사용률%, 그때의 누적 총 토큰] — 실측 게이지 보정용
 */

const FILE = join(homedir(), ".claude", "tokenmon", "usage-series.json");
const CHECKPOINT_MIN_GAP_MS = 60_000;
const MAX_CHECKPOINTS = 2_000;
const MAX_MARKS = 80;
const FIVE_HOURS_MS = 5 * 3_600_000;
/** 보정 마크가 쌓이기 전의 부트스트랩 환산 — 5시간 창 1% ≈ 총 토큰 400만. */
const FALLBACK_TOKENS_PER_PCT = 4_000_000;

interface SeriesData {
  checkpoints: [number, number][];
  marks: [number, number, number][];
}

function load(): SeriesData {
  try {
    const parsed = JSON.parse(readFileSync(FILE, "utf8")) as Partial<SeriesData>;
    return {
      checkpoints: Array.isArray(parsed.checkpoints) ? (parsed.checkpoints as [number, number][]) : [],
      marks: Array.isArray(parsed.marks) ? (parsed.marks as [number, number, number][]) : [],
    };
  } catch {
    return { checkpoints: [], marks: [] };
  }
}

function save(data: SeriesData): void {
  try {
    mkdirSync(join(homedir(), ".claude", "tokenmon"), { recursive: true });
    const tmp = `${FILE}.${process.pid}.tmp`;
    writeFileSync(tmp, JSON.stringify(data));
    try {
      renameSync(tmp, FILE);
    } catch {
      writeFileSync(FILE, JSON.stringify(data));
    }
  } catch {
    /* 기록 실패는 치명적이지 않다 — 다음 폴링에서 재시도 */
  }
}

/** 폴링마다 호출 — 체크포인트를 쌓고, 실측 게이지가 보이면 보정 마크도 남긴다. */
export function recordUsage(
  nowMs: number,
  grandTotalTokens: number,
  liveFiveHour: { usedPct: number; resetsAtMs: number | null } | null,
): void {
  const data = load();
  const last = data.checkpoints[data.checkpoints.length - 1];
  let dirty = false;
  if (!last || nowMs - last[0] >= CHECKPOINT_MIN_GAP_MS) {
    data.checkpoints.push([nowMs, grandTotalTokens]);
    if (data.checkpoints.length > MAX_CHECKPOINTS) data.checkpoints.splice(0, data.checkpoints.length - MAX_CHECKPOINTS);
    dirty = true;
  }
  if (liveFiveHour && liveFiveHour.resetsAtMs !== null) {
    const lastMark = data.marks[data.marks.length - 1];
    if (!lastMark || lastMark[0] !== liveFiveHour.resetsAtMs || lastMark[1] !== liveFiveHour.usedPct) {
      data.marks.push([liveFiveHour.resetsAtMs, liveFiveHour.usedPct, grandTotalTokens]);
      if (data.marks.length > MAX_MARKS) data.marks.splice(0, data.marks.length - MAX_MARKS);
      dirty = true;
    }
  }
  if (dirty) save(data);
}

/** 같은 창 안에서 사용률이 벌어진 마크 쌍으로 "1%당 토큰"을 보정한다. 없으면 부트스트랩 값. */
function tokensPerPct(data: SeriesData): number {
  for (let i = data.marks.length - 1; i > 0; i -= 1) {
    const [resetA, pctA, totalA] = data.marks[i];
    for (let j = i - 1; j >= 0; j -= 1) {
      const [resetB, pctB, totalB] = data.marks[j];
      if (resetB !== resetA) break; // 다른 창까지 넘어가면 중단
      if (pctA - pctB >= 3 && totalA > totalB) {
        const ratio = (totalA - totalB) / (pctA - pctB);
        return Math.min(50_000_000, Math.max(200_000, ratio));
      }
    }
  }
  return FALLBACK_TOKENS_PER_PCT;
}

/**
 * 새 창 추정 — 직전 창 리셋 시각 이후 늘어난 총 토큰으로 사용률을 추산한다.
 * 반환: 추정 %와 (관측 가능하면) 새 창의 리셋 예정 시각.
 */
export function estimateFreshFiveHour(
  nowMs: number,
  grandTotalTokens: number,
  expiredResetsAtMs: number,
): { usedPct: number; resetsAtMs: number | null } | null {
  const data = load();
  if (data.checkpoints.length === 0) return null;

  // 리셋 시각 기준 베이스라인 — 리셋 이전 마지막 체크포인트 (없으면 가장 오래된 것)
  let baseline = data.checkpoints[0];
  for (const point of data.checkpoints) {
    if (point[0] <= expiredResetsAtMs) baseline = point;
    else break;
  }
  const tokensSince = Math.max(0, grandTotalTokens - baseline[1]);
  const usedPct = Math.min(99, Math.round(tokensSince / tokensPerPct(data)));

  // 새 창 시작 시각 추정 = 리셋 후 토큰이 처음 늘어난 체크포인트
  let startMs: number | null = null;
  for (const point of data.checkpoints) {
    if (point[0] <= expiredResetsAtMs) continue;
    if (point[1] > baseline[1]) {
      startMs = point[0];
      break;
    }
  }
  return { usedPct, resetsAtMs: startMs === null ? null : startMs + FIVE_HOURS_MS };
}
