/**
 * Tokenmon 공용 계약 — Claude Code statusline 수집 스냅샷의 형태와
 * 캐릭터 상태(무드·진화 단계·게이지) 파생 규칙.
 *
 * 스냅샷은 수집기(~/.claude/tokenmon/statusline.js, `npm run setup`으로 설치)가
 * ~/.claude/tokenmon/sessions/<session_id>.json 에 세션당 1개(마지막 상태)로 기록한다.
 * 이 모듈은 순수 함수만 담아 서버·클라이언트 어디서든 임포트할 수 있다.
 */

/* ---------- 수집기가 저장하는 원본 형태 (Claude Code statusline stdin JSON) ---------- */

export interface TokenmonRateWindowPayload {
  used_percentage?: number | null;
  /** Unix epoch 초 단위. */
  resets_at?: number | null;
}

export interface TokenmonPayload {
  session_id?: string;
  cwd?: string;
  model?: { id?: string; display_name?: string | null } | null;
  workspace?: { current_dir?: string; project_dir?: string } | null;
  cost?: {
    total_cost_usd?: number | null;
    total_duration_ms?: number | null;
    total_lines_added?: number | null;
    total_lines_removed?: number | null;
  } | null;
  context_window?: {
    /** 세션 누적 입력 토큰 — 캐시 생성·읽기 토큰이 포함된 값. */
    total_input_tokens?: number | null;
    total_output_tokens?: number | null;
    context_window_size?: number | null;
    used_percentage?: number | null;
  } | null;
  /** Claude Pro/Max 구독에서 첫 응답 이후에만 존재. 창별로 독립적으로 빠질 수 있음. */
  rate_limits?: {
    five_hour?: TokenmonRateWindowPayload | null;
    seven_day?: TokenmonRateWindowPayload | null;
  } | null;
}

export interface TokenmonSnapshot {
  /** 수집기가 기록한 ISO 8601 시각. */
  savedAt: string;
  payload: TokenmonPayload;
}

export function parseTokenmonSnapshot(text: string): TokenmonSnapshot | null {
  try {
    const value = JSON.parse(text) as Partial<TokenmonSnapshot>;
    if (!value || typeof value !== "object") return null;
    if (typeof value.savedAt !== "string" || Number.isNaN(Date.parse(value.savedAt))) return null;
    if (!value.payload || typeof value.payload !== "object") return null;
    return { savedAt: value.savedAt, payload: value.payload };
  } catch {
    return null;
  }
}

/* ---------- 화면이 쓰는 파생 상태 ---------- */

export type TokenmonMood = "happy" | "content" | "sleepy" | "exhausted" | "sleeping" | "hungry";
export type TokenmonStage = "egg" | "baby" | "pet" | "dragon";

export interface TokenmonSession {
  id: string;
  projectName: string;
  model: string;
  /** ISO 8601 — 이 세션의 마지막 스냅샷 시각. */
  savedAt: string;
  /** 세션 누적. 입력에는 캐시 토큰이 포함된다. */
  inputTokens: number;
  outputTokens: number;
  costUsd: number | null;
  contextUsedPct: number | null;
  linesAdded: number;
  linesRemoved: number;
}

export interface TokenmonRateWindow {
  usedPct: number;
  /** epoch 밀리초. 없으면 null. */
  resetsAtMs: number | null;
}

export interface TokenmonState {
  /** true면 실제 수집 데이터, false면 미리보기(mock) 데이터. */
  live: boolean;
  /** 최신순 정렬. */
  sessions: TokenmonSession[];
  /** 최근 3분 안에 스냅샷이 갱신된 세션 수 = 지금 열려 있는 Claude Code 창 수. */
  activeSessionCount: number;
  fiveHour: TokenmonRateWindow | null;
  sevenDay: TokenmonRateWindow | null;
  mood: TokenmonMood;
  stage: TokenmonStage;
  xp: number;
  /** 현재 단계 안에서의 진행률(0~100). 최종 단계면 100. */
  stageProgressPct: number;
  nextStageXp: number | null;
  lastActivityAt: string | null;
  totals: {
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
    sessionCount: number;
    activeDays: number;
  };
}

/** 진화 속도 튜닝값 — 하루 한두 세션 기준으로 첫날 부화, 일주일쯤 아기 졸업, 한 달쯤 코딩 펫 졸업이 되도록 잡았다. */
export const TOKENMON_STAGE_XP = { baby: 350, pet: 2500, dragon: 8000 } as const;

const ACTIVE_WINDOW_MS = 3 * 60_000;
const HUNGRY_AFTER_MS = 6 * 3_600_000;
const FRESH_ACTIVITY_MS = 30 * 60_000;

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function basename(value: string | undefined): string | null {
  if (!value) return null;
  const parts = value.split(/[\\/]/).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : null;
}

function toSession(snapshot: TokenmonSnapshot): TokenmonSession {
  const { payload } = snapshot;
  return {
    id: payload.session_id ?? "unknown",
    projectName:
      basename(payload.workspace?.project_dir) ?? basename(payload.workspace?.current_dir) ?? basename(payload.cwd) ?? "알 수 없는 프로젝트",
    model: payload.model?.display_name ?? payload.model?.id ?? "Claude",
    savedAt: snapshot.savedAt,
    inputTokens: num(payload.context_window?.total_input_tokens) ?? 0,
    outputTokens: num(payload.context_window?.total_output_tokens) ?? 0,
    costUsd: num(payload.cost?.total_cost_usd),
    contextUsedPct: num(payload.context_window?.used_percentage),
    linesAdded: num(payload.cost?.total_lines_added) ?? 0,
    linesRemoved: num(payload.cost?.total_lines_removed) ?? 0,
  };
}

/** 최신 스냅샷부터 훑어 해당 창의 유효한 값(리셋 시각이 지나지 않은 것)을 찾는다. */
function newestWindow(
  sorted: TokenmonSnapshot[],
  key: "five_hour" | "seven_day",
  nowMs: number,
): TokenmonRateWindow | null {
  for (const snapshot of sorted) {
    const window = snapshot.payload.rate_limits?.[key];
    const usedPct = num(window?.used_percentage);
    if (usedPct === null) continue;
    const resetsAtSec = num(window?.resets_at);
    const resetsAtMs = resetsAtSec === null ? null : resetsAtSec * 1000;
    if (resetsAtMs !== null && resetsAtMs <= nowMs) return null; // 창이 이미 리셋됨 — 남은 기록은 낡은 값
    return { usedPct, resetsAtMs };
  }
  return null;
}

function deriveMood(fiveHour: TokenmonRateWindow | null, lastActivityMs: number | null, nowMs: number): TokenmonMood {
  if (fiveHour && fiveHour.usedPct >= 99.5) return "sleeping";
  if (fiveHour && fiveHour.usedPct >= 90) return "exhausted";
  if (fiveHour && fiveHour.usedPct >= 70) return "sleepy";
  if (lastActivityMs === null || nowMs - lastActivityMs >= HUNGRY_AFTER_MS) return "hungry";
  if (nowMs - lastActivityMs <= FRESH_ACTIVITY_MS) return "happy";
  return "content";
}

export function deriveTokenmonState(snapshots: TokenmonSnapshot[], options: { live: boolean; now?: Date }): TokenmonState {
  const nowMs = (options.now ?? new Date()).getTime();
  const sorted = snapshots
    .slice()
    .sort((a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt));
  const sessions = sorted.map(toSession);

  const activeSessionCount = sessions.filter((session) => nowMs - Date.parse(session.savedAt) <= ACTIVE_WINDOW_MS).length;
  const lastActivityMs = sessions.length ? Date.parse(sessions[0].savedAt) : null;

  const totals = {
    inputTokens: sessions.reduce((sum, session) => sum + session.inputTokens, 0),
    outputTokens: sessions.reduce((sum, session) => sum + session.outputTokens, 0),
    costUsd: Number(sessions.reduce((sum, session) => sum + (session.costUsd ?? 0), 0).toFixed(2)),
    sessionCount: sessions.length,
    activeDays: new Set(sessions.map((session) => new Date(session.savedAt).toDateString())).size,
  };

  const xp = totals.activeDays * 300 + totals.sessionCount * 60 + Math.floor(totals.outputTokens / 500);
  const stage: TokenmonStage =
    xp >= TOKENMON_STAGE_XP.dragon ? "dragon" : xp >= TOKENMON_STAGE_XP.pet ? "pet" : xp >= TOKENMON_STAGE_XP.baby ? "baby" : "egg";
  const bounds: Record<TokenmonStage, [number, number | null]> = {
    egg: [0, TOKENMON_STAGE_XP.baby],
    baby: [TOKENMON_STAGE_XP.baby, TOKENMON_STAGE_XP.pet],
    pet: [TOKENMON_STAGE_XP.pet, TOKENMON_STAGE_XP.dragon],
    dragon: [TOKENMON_STAGE_XP.dragon, null],
  };
  const [stageStart, stageEnd] = bounds[stage];
  const stageProgressPct =
    stageEnd === null ? 100 : Math.max(0, Math.min(100, Math.round(((xp - stageStart) / (stageEnd - stageStart)) * 100)));

  const fiveHour = newestWindow(sorted, "five_hour", nowMs);

  return {
    live: options.live,
    sessions,
    activeSessionCount,
    fiveHour,
    sevenDay: newestWindow(sorted, "seven_day", nowMs),
    mood: deriveMood(fiveHour, lastActivityMs, nowMs),
    stage,
    xp,
    stageProgressPct,
    nextStageXp: stageEnd,
    lastActivityAt: lastActivityMs === null ? null : new Date(lastActivityMs).toISOString(),
    totals,
  };
}

/* ---------- 표시용 포맷터 (서버·클라이언트 공통) ---------- */

export function formatTokenCount(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0";
  if (value < 1000) return String(Math.round(value));
  if (value < 1_000_000) return `${(value / 1000).toFixed(1)}k`;
  return `${(value / 1_000_000).toFixed(2)}M`;
}

export function formatUsd(value: number | null): string {
  return value === null ? "–" : `$${value.toFixed(2)}`;
}

const clockFormat = new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });

export function formatClock(epochMs: number): string {
  return clockFormat.format(new Date(epochMs));
}

const dayTimeFormat = new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });

export function formatDayTime(iso: string): string {
  return dayTimeFormat.format(new Date(iso));
}

/** "1시간 42분", "3일 4시간" 같은 남은 시간 문구. 1분 미만은 "곧". */
export function formatDurationKo(ms: number): string {
  if (ms < 60_000) return "곧";
  const minutes = Math.floor(ms / 60_000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const rest = minutes % 60;
  if (days > 0) return hours > 0 ? `${days}일 ${hours}시간` : `${days}일`;
  if (hours > 0) return rest > 0 ? `${hours}시간 ${rest}분` : `${hours}시간`;
  return `${rest}분`;
}
