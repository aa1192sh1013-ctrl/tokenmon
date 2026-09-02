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
  /** 백필 스냅샷(`npm run backfill`) 전용 — 과거 기록 요약. */
  backfill?: { sessions?: number | null; first_at?: string | null } | null;
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

export type TokenmonMood = "happy" | "content" | "sleeping" | "starving";
/** 종 ID — 동물 50종 + 레어 10종, 각자 고유 형태. */
export type TokenmonSpecies = string;

/** 흔한 종 50가지 — 전부 서로 다른 동물 (초식·육식·조류·어류·수중·곤충 포함). */
export const COMMON_SPECIES_IDS: readonly string[] = [
  "wolf", "fox", "dog", "cat", "lion", "tiger", "leopard", "cheetah", "bear", "panda",
  "rabbit", "deer", "goat", "horse", "bison", "elephant", "rhino", "gorilla", "monkey", "otter",
  "raccoon", "kangaroo", "bat", "eagle", "owl", "raven", "falcon", "penguin", "peacock", "parrot",
  "crane", "crocodile", "cobra", "chameleon", "turtle", "frog", "shark", "orca", "dolphin", "whale",
  "octopus", "squid", "crab", "manta", "seahorse", "stagbeetle", "mantis", "scorpion", "spider", "butterfly",
];
export const DINO_SPECIES_IDS: readonly string[] = ["tyranno", "tricera", "raptor", "anky", "ptera"];
export const MYTHIC_SPECIES_IDS: readonly string[] = ["dragon", "phoenix", "griffin", "qilin", "cerberus"];
export const RARE_SPECIES: readonly string[] = [...DINO_SPECIES_IDS, ...MYTHIC_SPECIES_IDS];

/** 색상 12종 — 빨·주·노·초·파·남·보·흰·검·금·은·동. 종과 별개로 랜덤 배정. */
export const SPECIES_COLOR_KEYS = [
  "red", "orange", "yellow", "green", "blue", "indigo", "violet", "white", "black", "gold", "silver", "bronze",
] as const;
export type TokenmonColor = (typeof SPECIES_COLOR_KEYS)[number];

/** 프로젝트명으로 색을 뽑는다 — 종 해시와 다른 시드를 써서 독립적으로 굴린다. */
export function colorOf(projectName: string): TokenmonColor {
  let hash = 7;
  for (let i = 0; i < projectName.length; i += 1) hash = (hash * 37 + projectName.charCodeAt(i) + 11) >>> 0;
  return SPECIES_COLOR_KEYS[hash % SPECIES_COLOR_KEYS.length];
}

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
  /** 세션이 시작된 폴더의 원본 경로 — 잡폴더 필터링에 쓴다. */
  projectDir: string;
  /** 백필 스냅샷이 대표하는 과거 세션 수(일반 세션은 0). */
  historySessions: number;
}

/** 백필 의사 세션인지 — 성장·누적에는 포함하되 "최근 세션" 차트에서는 제외한다. */
export function isBackfillSession(sessionId: string): boolean {
  return sessionId.startsWith("backfill-");
}

export interface TokenmonRateWindow {
  usedPct: number;
  /** epoch 밀리초. 없으면 null. */
  resetsAtMs: number | null;
  /**
   * 직전 창이 만료됐는데 새 창 관측값이 아직 없음 = 새 밥그릇.
   * (5시간·주간 창은 첫 사용 시점에 시작되므로 리셋 직후엔 타이머가 없다.)
   */
  fresh?: boolean;
}

/** 프로젝트가 키우는 캐릭터 — 그 프로젝트의 모든 세션이 먹이를 준다. 종족·색은 프로젝트명 해시로 고정. */
export interface TokenmonPet {
  projectName: string;
  species: TokenmonSpecies;
  color: TokenmonColor;
  /** 1~20. Lv.1은 아직 알. */
  level: number;
  maxLevel: boolean;
  xp: number;
  /** 다음 레벨까지 진행률(0~100). 만렙이면 100. */
  levelProgressPct: number;
  nextLevelXp: number | null;
  mood: TokenmonMood;
  /** 이 프로젝트의 세션이 최근 3분 안에 갱신됨 = 지금 작업 중. */
  active: boolean;
  /** 굶주림으로 깎여 있는 XP 비율(0~100). 다시 활동하면 전액 회복된다. */
  hungerPct: number;
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
  /** 이미 리셋된 직전 5시간 창에서 관측된 낭비율(0~100). 관측 불가면 null. */
  wastedFiveHourPct: number | null;
  /** 연속 출석 일수 — 오늘 아직 안 썼어도 어제까지의 연속은 유지. */
  streakDays: number;
  /** 오늘 한 번이라도 사용했는지 — 스트릭 소멸 경고용. */
  fedToday: boolean;
  /** 굶주림 감가가 진행 중인 캐릭터 수. */
  starvingCount: number;
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
 * 1 XP = 총 토큰(입력+캐시+출력) 100만 개 — ccusage의 Total Tokens 감각과 같은 단위.
 * 레벨당 ~1.2배 완만한 곡선, 만렙 누적 5,700 XP ≈ 총 57억 토큰.
 */
export const LEVEL_XP: readonly number[] = [
  0, 0, 37, 81, 134, 198, 274, 366, 476, 608, 766, 956, 1_183, 1_456, 1_783, 2_176, 2_647, 3_212, 3_891, 4_705, 5_700,
];

export function levelOf(xp: number): number {
  for (let level = MAX_LEVEL; level >= 2; level -= 1) if (xp >= LEVEL_XP[level]) return level;
  return 1;
}

const ACTIVE_WINDOW_MS = 3 * 60_000;
const FRESH_ACTIVITY_MS = 10 * 60_000;
/** 굶주림 감가 튜닝값 — 3일 유예 후 하루 3%씩 XP가 말라간다(복리). 다시 활동하면 전액 회복. 한 달 방치 시 약 -56%. */
const HUNGER_GRACE_DAYS = 3;
const HUNGER_DECAY_PER_DAY = 0.03;

/** 종족 뽑기(1000분율) — 흔한 50종 각 1.8%, 공룡류 5종 각 1.2%, 환수종 5종 각 0.8%. 프로젝트명이 같으면 언제나 같은 종. */
export function speciesOf(projectName: string): TokenmonSpecies {
  let hash = 0;
  for (let i = 0; i < projectName.length; i += 1) hash = (hash * 31 + projectName.charCodeAt(i)) >>> 0;
  const roll = hash % 1000;
  if (roll < 900) return COMMON_SPECIES_IDS[roll % COMMON_SPECIES_IDS.length];
  if (roll < 960) return DINO_SPECIES_IDS[(roll - 900) % DINO_SPECIES_IDS.length];
  return MYTHIC_SPECIES_IDS[(roll - 960) % MYTHIC_SPECIES_IDS.length];
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
    projectDir: payload.workspace?.project_dir ?? payload.workspace?.current_dir ?? payload.cwd ?? "",
    historySessions: num(payload.backfill?.sessions) ?? 0,
  };
}

/** 경로 비교용 정규화 — 윈도우 경로는 대소문자·구분자 차이를 무시한다. */
function normalizeDir(dir: string): string {
  return dir.replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase();
}

/** "vibesquad-plan-*" 같은 와일드카드(*) 패턴 매칭 — 대소문자 무시. */
function matchesAnyPattern(name: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    const regex = new RegExp(
      `^${pattern
        .split("*")
        .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join(".*")}$`,
      "i",
    );
    return regex.test(name);
  });
}

/**
 * 유효한(아직 리셋 전) 창들 중 최선값을 고른다 — 더 새 창 우선,
 * 같은 창(리셋 시각 동일)이면 최대 사용률. 사용률은 창 안에서 단조증가하므로
 * idle 세션이 계속 내보내는 낡은 값이 신선한 값을 가리지 못한다.
 */
function bestRateWindow(
  sorted: TokenmonSnapshot[],
  key: "five_hour" | "seven_day",
  nowMs: number,
): TokenmonRateWindow | null {
  let best: TokenmonRateWindow | null = null;
  for (const snapshot of sorted) {
    const window = snapshot.payload.rate_limits?.[key];
    const usedPct = num(window?.used_percentage);
    if (usedPct === null) continue;
    const resetsAtSec = num(window?.resets_at);
    const resetsAtMs = resetsAtSec === null ? null : resetsAtSec * 1000;
    if (resetsAtMs !== null && resetsAtMs <= nowMs) continue; // 이미 리셋된 창
    if (!best) {
      best = { usedPct, resetsAtMs };
      continue;
    }
    const bestTime = best.resetsAtMs ?? 0;
    const thisTime = resetsAtMs ?? 0;
    if (thisTime > bestTime || (thisTime === bestTime && usedPct > best.usedPct)) best = { usedPct, resetsAtMs };
  }
  return best;
}

/** 이미 리셋돼 버린 직전 창의 마지막 관측값 — "지난 밥그릇 낭비"와 새 밥그릇 판정에 쓴다. */
function lastExpiredWindow(
  sorted: TokenmonSnapshot[],
  key: "five_hour" | "seven_day",
  nowMs: number,
): { usedPct: number; resetsAtMs: number } | null {
  let best: { usedPct: number; resetsAtMs: number } | null = null;
  for (const snapshot of sorted) {
    const window = snapshot.payload.rate_limits?.[key];
    const usedPct = num(window?.used_percentage);
    if (usedPct === null) continue;
    const resetsAtSec = num(window?.resets_at);
    if (resetsAtSec === null) continue;
    const resetsAtMs = resetsAtSec * 1000;
    if (resetsAtMs > nowMs) continue; // 아직 유효한 창
    if (!best || resetsAtMs > best.resetsAtMs || (resetsAtMs === best.resetsAtMs && usedPct > best.usedPct))
      best = { usedPct, resetsAtMs };
  }
  return best;
}

/** 세션 XP — 총 토큰(입력·캐시 포함 + 출력) 100만 개당 1 XP. */
export function sessionXp(session: TokenmonSession): number {
  return (session.inputTokens + session.outputTokens) / 1_000_000;
}

function petMood(active: boolean, starving: boolean, sinceActivityMs: number): TokenmonMood {
  if (starving) return "starving"; // 방치 → XP가 마르는 중
  if (!active) return "sleeping";
  return sinceActivityMs <= FRESH_ACTIVITY_MS ? "happy" : "content";
}

export function deriveTokenmonState(
  snapshots: TokenmonSnapshot[],
  options: {
    live: boolean;
    now?: Date;
    /** 정확히 이 폴더에서 시작한 세션은 캐릭터를 만들지 않는다 (예: 홈 디렉터리). */
    ignoreProjectDirs?: string[];
    /** 이 경로 아래 전부 제외 (예: OS 임시 폴더 — 실험용 샌드박스들). */
    ignoreProjectDirPrefixes?: string[];
    /** 프로젝트 이름 와일드카드 제외 (예: "_*", "*-scratch") — 사용자 설정용. */
    ignoreProjectNames?: string[];
  },
): TokenmonState {
  const nowMs = (options.now ?? new Date()).getTime();
  const sorted = snapshots
    .slice()
    .sort((a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt));
  const allSessions = sorted.map(toSession);
  const liveSessions = allSessions.filter((session) => !isBackfillSession(session.id));

  // 유효한 창이 없어도 직전 창의 만료를 관측했다면 "새 밥그릇(0%)"으로 초기화해서 보여준다.
  const expiredFive = lastExpiredWindow(sorted, "five_hour", nowMs);
  const expiredSeven = lastExpiredWindow(sorted, "seven_day", nowMs);
  const fiveHour =
    bestRateWindow(sorted, "five_hour", nowMs) ?? (expiredFive ? { usedPct: 0, resetsAtMs: null, fresh: true } : null);
  const sevenDay =
    bestRateWindow(sorted, "seven_day", nowMs) ?? (expiredSeven ? { usedPct: 0, resetsAtMs: null, fresh: true } : null);

  const ignoredDirs = new Set((options.ignoreProjectDirs ?? []).map(normalizeDir));
  const ignoredPrefixes = (options.ignoreProjectDirPrefixes ?? []).map(normalizeDir);
  const ignoredNames = options.ignoreProjectNames ?? [];
  const byProject = new Map<string, TokenmonSession[]>();
  for (const session of allSessions) {
    // 잡폴더 세션은 캐릭터를 만들지 않는다 (사용량 집계에는 포함)
    const dir = normalizeDir(session.projectDir);
    if (ignoredDirs.has(dir)) continue;
    if (ignoredPrefixes.some((prefix) => dir === prefix || dir.startsWith(`${prefix}/`))) continue;
    if (ignoredNames.length > 0 && matchesAnyPattern(session.projectName, ignoredNames)) continue;
    const group = byProject.get(session.projectName);
    if (group) group.push(session);
    else byProject.set(session.projectName, [session]);
  }

  const pets: TokenmonPet[] = [...byProject.entries()]
    .map(([projectName, group]) => {
      const rawXp = group.reduce((sum, session) => sum + sessionXp(session), 0);
      const liveGroup = group.filter((session) => !isBackfillSession(session.id));
      const lastSeenMs = Math.max(...group.map((session) => Date.parse(session.savedAt)));
      const active = liveGroup.some((session) => nowMs - Date.parse(session.savedAt) <= ACTIVE_WINDOW_MS);

      // 굶주림 감가 — 유예 지나면 하루 3%씩 XP가 마른다. 다시 활동하면 전액 회복(원본 XP는 보존).
      const idleDays = Math.floor(Math.max(0, nowMs - lastSeenMs) / 86_400_000);
      const hungerDays = active ? 0 : Math.max(0, idleDays - HUNGER_GRACE_DAYS);
      const decay = Math.pow(1 - HUNGER_DECAY_PER_DAY, hungerDays);
      const xp = rawXp * decay; // 1 XP = 총 토큰 100만 — 소수 XP도 그대로 둬야 100만 미만 성장이 보인다

      const hungerPct = Math.round((1 - decay) * 100);

      const level = levelOf(xp);
      const current = LEVEL_XP[level];
      const next = level >= MAX_LEVEL ? null : LEVEL_XP[level + 1];
      return {
        projectName,
        species: speciesOf(projectName),
        color: colorOf(projectName),
        level,
        maxLevel: level >= MAX_LEVEL,
        xp,
        levelProgressPct: next === null ? 100 : Math.max(0, Math.min(100, Math.round(((xp - current) / (next - current)) * 100))),
        nextLevelXp: next,
        mood: petMood(active, hungerDays > 0, nowMs - lastSeenMs),
        active,
        hungerPct,
        sessionCount: liveGroup.length + group.reduce((sum, session) => sum + session.historySessions, 0),
        outputTokens: group.reduce((sum, session) => sum + session.outputTokens, 0),
        costUsd: Number(group.reduce((sum, session) => sum + (session.costUsd ?? 0), 0).toFixed(2)),
        lastSeenAt: new Date(lastSeenMs).toISOString(),
      };
    })
    .sort((a, b) => Number(b.active) - Number(a.active) || Date.parse(b.lastSeenAt) - Date.parse(a.lastSeenAt));

  // 연속 출석 스트릭 — 오늘 아직 안 썼어도 어제까지의 연속은 살아있다.
  const dayKeys = new Set(allSessions.map((session) => new Date(session.savedAt).toDateString()));
  const fedToday = dayKeys.has(new Date(nowMs).toDateString());
  let streakDays = 0;
  const cursor = new Date(nowMs);
  if (!fedToday) cursor.setDate(cursor.getDate() - 1);
  while (dayKeys.has(cursor.toDateString())) {
    streakDays += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const activeSessionCount = pets.filter((pet) => pet.active).length;
  const lastActivityMs = allSessions.length ? Date.parse(allSessions[0].savedAt) : null;

  const totals = {
    inputTokens: allSessions.reduce((sum, session) => sum + session.inputTokens, 0),
    outputTokens: allSessions.reduce((sum, session) => sum + session.outputTokens, 0),
    costUsd: Number(allSessions.reduce((sum, session) => sum + (session.costUsd ?? 0), 0).toFixed(2)),
    sessionCount: liveSessions.length + allSessions.reduce((sum, session) => sum + session.historySessions, 0),
    activeDays: new Set(allSessions.map((session) => new Date(session.savedAt).toDateString())).size,
  };

  return {
    live: options.live,
    sessions: liveSessions,
    pets,
    activeSessionCount,
    fiveHour,
    sevenDay,
    wastedFiveHourPct: expiredFive === null ? null : Math.max(0, Math.round(100 - expiredFive.usedPct)),
    streakDays,
    fedToday,
    starvingCount: pets.filter((pet) => pet.mood === "starving").length,
    lastActivityAt: lastActivityMs === null ? null : new Date(lastActivityMs).toISOString(),
    totals,
  };
}

/* ---------- 표시용 포맷터 (서버·클라이언트 공통) ---------- */

export function formatTokenCount(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0";
  if (value < 1000) return String(Math.round(value));
  if (value < 1_000_000) return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return `${(value / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`;
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
