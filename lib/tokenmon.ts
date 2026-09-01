/**
 * Tokenmon 공용 계약 — Claude Code statusline 수집 스냅샷의 형태와
 * 캐릭터 상태 파생 규칙.
 *
 * 스냅샷은 수집기(~/.claude/tokenmon/statusline.js, `npm run setup`으로 설치)가
 * ~/.claude/tokenmon/sessions/<session_id>.json 에 세션당 1개(마지막 상태)로 기록한다.
 * 세션마다 고유 종족의 캐릭터가 부화해 그 세션의 작업량만큼 자란다.
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
    total_api_duration_ms?: number | null;
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

export type TokenmonMood = "happy" | "content" | "sleepy" | "exhausted" | "sleeping";
export type TokenmonStage = "egg" | "baby" | "pet" | "dragon";
export type TokenmonSpecies = "sprout" | "ocean" | "star" | "sunset" | "blossom" | "dino" | "unicorn" | "dragonet";

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
  /** 실제 API 응답에 쓰인 누적 시간(밀리초) — 창을 켜둔 시간이 아니라 일한 시간. */
  apiDurationMs: number;
}

export interface TokenmonRateWindow {
  usedPct: number;
  /** epoch 밀리초. 없으면 null. */
  resetsAtMs: number | null;
}

/** 프로젝트가 키우는 캐릭터 — 그 프로젝트의 모든 세션이 먹이를 준다. 종족은 프로젝트명 해시로 고정. */
export interface TokenmonPet {
  projectName: string;
  species: TokenmonSpecies;
  /** 1~20. */
  level: number;
  maxLevel: boolean;
  /** 레벨 구간에 따른 스프라이트 형태. */
  stage: TokenmonStage;
  xp: number;
  /** 다음 레벨까지 진행률(0~100). 만렙이면 100. */
  levelProgressPct: number;
  nextLevelXp: number | null;
  mood: TokenmonMood;
  /** 이 프로젝트의 세션이 최근 3분 안에 갱신됨 = 지금 작업 중. */
  active: boolean;
  sessionCount: number;
  outputTokens: number;
  costUsd: number;
  lastSeenAt: string;
}

export interface TokenmonState {
  /** true면 실제 수집 데이터, false면 미리보기(mock) 데이터. */
  live: boolean;
  /** 최신순 정렬. */
  sessions: TokenmonSession[];
  /** 세션별 캐릭터 — 깨어 있는 순 → 최신순. */
  pets: TokenmonPet[];
  activeSessionCount: number;
  fiveHour: TokenmonRateWindow | null;
  sevenDay: TokenmonRateWindow | null;
  lastActivityAt: string | null;
  totals: {
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
    sessionCount: number;
    activeDays: number;
  };
}

export const MAX_LEVEL = 20;

/**
 * 레벨 n 도달에 필요한 누적 XP(인덱스=레벨, 0·1번은 미사용/0).
 * 매일 종일 토큰을 태우는 개발자가 한 달쯤 갈아야 만렙(50만 XP)이 되도록 잡았다
 * — 실사용 기준 그런 페이스가 월 40만~60만 XP쯤 나온다. 라이트 유저는 만렙까지 1년 안팎.
 */
export const LEVEL_XP: readonly number[] = [
  0, 0, 120, 190, 300, 480, 760, 1_200, 1_900, 3_000, 4_800, 7_600, 12_000, 19_000, 30_000, 48_000, 76_000, 120_000,
  190_000, 300_000, 500_000,
];

export function levelOf(xp: number): number {
  for (let level = MAX_LEVEL; level >= 2; level -= 1) if (xp >= LEVEL_XP[level]) return level;
  return 1;
}

/** 레벨 구간 → 스프라이트 형태: 알 Lv.1, 아기 Lv.2~7, 어른 Lv.8~14, 황금킹 Lv.15~20. */
export function stageOfLevel(level: number): TokenmonStage {
  if (level >= 15) return "dragon";
  if (level >= 8) return "pet";
  if (level >= 2) return "baby";
  return "egg";
}

const ACTIVE_WINDOW_MS = 3 * 60_000;
const FRESH_ACTIVITY_MS = 10 * 60_000;

/** 종족 뽑기표(1000분율) — 흔한 5종 각 18%, 레어: 공룡봇 5% · 유니뿅 3% · 용용봇 2%. */
const SPECIES_TABLE: readonly { species: TokenmonSpecies; upTo: number }[] = [
  { species: "sunset", upTo: 180 },
  { species: "star", upTo: 360 },
  { species: "ocean", upTo: 540 },
  { species: "blossom", upTo: 720 },
  { species: "sprout", upTo: 900 },
  { species: "dino", upTo: 950 },
  { species: "unicorn", upTo: 980 },
  { species: "dragonet", upTo: 1000 },
];

export const RARE_SPECIES: readonly TokenmonSpecies[] = ["dino", "unicorn", "dragonet"];

/** 세션 ID로 종족을 결정한다 — 같은 세션은 언제나 같은 종족. */
export function speciesOf(sessionId: string): TokenmonSpecies {
  let hash = 0;
  for (let i = 0; i < sessionId.length; i += 1) hash = (hash * 31 + sessionId.charCodeAt(i)) >>> 0;
  const roll = hash % 1000;
  return (SPECIES_TABLE.find((row) => roll < row.upTo) ?? SPECIES_TABLE[0]).species;
}

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
    apiDurationMs: num(payload.cost?.total_api_duration_ms) ?? 0,
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

/** 출력 토큰 + 실제 작업 시간 + 코드 변경량으로 세션 XP를 계산한다. */
export function sessionXp(session: TokenmonSession): number {
  return (
    Math.floor(session.outputTokens / 25) +
    Math.floor((session.apiDurationMs / 60_000) * 6) +
    (session.linesAdded + session.linesRemoved) * 2
  );
}

function petMood(active: boolean, fiveHour: TokenmonRateWindow | null, sinceActivityMs: number): TokenmonMood {
  if (!active) return "sleeping";
  if (fiveHour && fiveHour.usedPct >= 99.5) return "sleeping";
  if (fiveHour && fiveHour.usedPct >= 90) return "exhausted";
  if (fiveHour && fiveHour.usedPct >= 70) return "sleepy";
  return sinceActivityMs <= FRESH_ACTIVITY_MS ? "happy" : "content";
}

export function deriveTokenmonState(snapshots: TokenmonSnapshot[], options: { live: boolean; now?: Date }): TokenmonState {
  const nowMs = (options.now ?? new Date()).getTime();
  const sorted = snapshots
    .slice()
    .sort((a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt));
  const sessions = sorted.map(toSession);

  const fiveHour = newestWindow(sorted, "five_hour", nowMs);

  const byProject = new Map<string, TokenmonSession[]>();
  for (const session of sessions) {
    const group = byProject.get(session.projectName);
    if (group) group.push(session);
    else byProject.set(session.projectName, [session]);
  }

  const pets: TokenmonPet[] = [...byProject.entries()]
    .map(([projectName, group]) => {
      const xp = group.reduce((sum, session) => sum + sessionXp(session), 0);
      const level = levelOf(xp);
      const current = LEVEL_XP[level];
      const next = level >= MAX_LEVEL ? null : LEVEL_XP[level + 1];
      const lastSeenMs = Math.max(...group.map((session) => Date.parse(session.savedAt)));
      const active = nowMs - lastSeenMs <= ACTIVE_WINDOW_MS;
      return {
        projectName,
        species: speciesOf(projectName),
        level,
        maxLevel: level >= MAX_LEVEL,
        stage: stageOfLevel(level),
        xp,
        levelProgressPct: next === null ? 100 : Math.max(0, Math.min(100, Math.round(((xp - current) / (next - current)) * 100))),
        nextLevelXp: next,
        mood: petMood(active, fiveHour, nowMs - lastSeenMs),
        active,
        sessionCount: group.length,
        outputTokens: group.reduce((sum, session) => sum + session.outputTokens, 0),
        costUsd: Number(group.reduce((sum, session) => sum + (session.costUsd ?? 0), 0).toFixed(2)),
        lastSeenAt: new Date(lastSeenMs).toISOString(),
      };
    })
    .sort((a, b) => Number(b.active) - Number(a.active) || Date.parse(b.lastSeenAt) - Date.parse(a.lastSeenAt));

  const activeSessionCount = pets.filter((pet) => pet.active).length;
  const lastActivityMs = sessions.length ? Date.parse(sessions[0].savedAt) : null;

  const totals = {
    inputTokens: sessions.reduce((sum, session) => sum + session.inputTokens, 0),
    outputTokens: sessions.reduce((sum, session) => sum + session.outputTokens, 0),
    costUsd: Number(sessions.reduce((sum, session) => sum + (session.costUsd ?? 0), 0).toFixed(2)),
    sessionCount: sessions.length,
    activeDays: new Set(sessions.map((session) => new Date(session.savedAt).toDateString())).size,
  };

  return {
    live: options.live,
    sessions,
    pets,
    activeSessionCount,
    fiveHour,
    sevenDay: newestWindow(sorted, "seven_day", nowMs),
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
