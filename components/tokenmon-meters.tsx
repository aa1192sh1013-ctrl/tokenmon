"use client";

import { useEffect, useState } from "react";
import {
  formatClock,
  formatDuration,
  formatTokenCount,
  type TokenmonLang,
  type TokenmonRateWindow,
  type TokenmonState,
} from "@/lib/tokenmon";

/* 낭비 관점 게이지 — 이미 결제한 용량이니, 사용률이 낮을수록 "증발 예정"이 크다. */
type WasteLevel = "danger" | "warn" | "good" | "gold";

function wasteLevelOf(usedPct: number): WasteLevel {
  if (usedPct >= 99.5) return "gold"; // 완식
  if (usedPct >= 70) return "good";
  if (usedPct >= 30) return "warn";
  return "danger"; // 대부분이 증발 대기 중
}

const FACE: Record<WasteLevel, string> = { danger: "💸", warn: "⏳", good: "😊", gold: "😴" };

const METER_TEXT = {
  en: {
    waiting: "Waiting for data — opens up once a Claude window reports",
    eatenPct: (pct: number) => `${pct}% eaten`,
    estEatenPct: (pct: number) => `~${pct}% eaten`,
    freshEating: "digging in",
    freshZero: "0% eaten",
    freshEatingSub: (noun: string) => `Eating from the new ${noun} — the gauge updates when a Claude window gets a response`,
    freshZeroSub: (noun: string) => `Fresh ${noun} served — the timer starts on your first bite`,
    estSub: (noun: string, countdown: string | null) =>
      `Estimated gauge for the new ${noun}${countdown ? ` · ${countdown} left` : ""} — switches to real data when available`,
    goldSub: (clock: string | null, noun: string) => `Clean bowl! 0% wasted — ${clock ? `new ${noun} at ${clock}` : "waiting for reset"}`,
    evapSub: (clock: string, pct: number, countdown: string | null) =>
      `${pct}% left evaporates at ${clock}${countdown ? ` · ${countdown} left` : ""}`,
    evapSubNoClock: (pct: number) => `The remaining ${pct}% evaporates at reset`,
  },
  ko: {
    waiting: "정보 대기 중 — Claude 창이 보고하면 채워져요",
    eatenPct: (pct: number) => `${pct}% 먹음`,
    estEatenPct: (pct: number) => `~${pct}% 먹음`,
    freshEating: "새 그릇 먹는 중",
    freshZero: "0% 먹음",
    freshEatingSub: (noun: string) => `새 ${noun} 먹는 중 — 게이지는 Claude 창이 응답을 받으면 갱신돼요`,
    freshZeroSub: (noun: string) => `새 ${noun} 준비 완료 — 첫 입을 먹으면 타이머가 시작돼요`,
    estSub: (noun: string, countdown: string | null) =>
      `새 ${noun} 추정 게이지${countdown ? ` · ${countdown} 남음` : ""} — 실측이 오면 자동으로 바뀌어요`,
    goldSub: (clock: string | null, noun: string) => `완식! 낭비 0% — ${clock ? `${clock}에 새 ${noun}` : "리셋 대기 중"}`,
    evapSub: (clock: string, pct: number, countdown: string | null) =>
      `${clock}에 남은 ${pct}% 증발${countdown ? ` · ${countdown} 남음` : ""}`,
    evapSubNoClock: (pct: number) => `남은 ${pct}%는 리셋 때 증발해요`,
  },
} as const;

function Meter({
  title,
  bowlNoun,
  window: win,
  nowMs,
  eating,
  lang,
}: {
  title: string;
  bowlNoun: string;
  window: TokenmonRateWindow | null;
  nowMs: number | null;
  /** 최근 활동이 있음 — 새 창을 이미 먹기 시작한 상태. */
  eating: boolean;
  lang: TokenmonLang;
}) {
  const text = METER_TEXT[lang];
  if (!win) {
    return (
      <div className="tm-meter">
        <div className="tm-meter-head">
          <span className="tm-meter-title">{title}</span>
          <span className="tm-meter-val">–</span>
        </div>
        <div className="tm-meter-track good">
          <div className="tm-meter-fill good" style={{ width: 0 }} />
        </div>
        <p className="tm-meter-sub">{text.waiting}</p>
      </div>
    );
  }

  if (win.fresh && win.estimated) {
    const level = wasteLevelOf(win.usedPct);
    const countdown =
      win.resetsAtMs !== null && nowMs !== null && win.resetsAtMs > nowMs ? formatDuration(win.resetsAtMs - nowMs, lang) : null;
    return (
      <div className="tm-meter">
        <div className="tm-meter-head">
          <span className="tm-meter-title">🍚 {title}</span>
          <span className="tm-meter-val">{text.estEatenPct(Math.round(win.usedPct))}</span>
        </div>
        <div className={`tm-meter-track ${level}`}>
          <div className={`tm-meter-fill ${level}`} style={{ width: `${Math.max(2, Math.min(100, win.usedPct))}%` }} />
        </div>
        <p className="tm-meter-sub">{text.estSub(bowlNoun, countdown)}</p>
      </div>
    );
  }

  if (win.fresh) {
    return (
      <div className="tm-meter">
        <div className="tm-meter-head">
          <span className="tm-meter-title">🍚 {title}</span>
          <span className="tm-meter-val">{eating ? text.freshEating : text.freshZero}</span>
        </div>
        <div className="tm-meter-track good">
          <div className="tm-meter-fill good" style={{ width: eating ? "6%" : 0 }} />
        </div>
        <p className="tm-meter-sub">{eating ? text.freshEatingSub(bowlNoun) : text.freshZeroSub(bowlNoun)}</p>
      </div>
    );
  }

  const level = wasteLevelOf(win.usedPct);
  const remainPct = Math.max(0, Math.round(100 - win.usedPct));
  const clock = win.resetsAtMs === null ? null : formatClock(win.resetsAtMs, lang);
  const countdown =
    win.resetsAtMs !== null && nowMs !== null && win.resetsAtMs > nowMs ? formatDuration(win.resetsAtMs - nowMs, lang) : null;
  const sub =
    level === "gold"
      ? text.goldSub(clock, bowlNoun)
      : clock
        ? text.evapSub(clock, remainPct, countdown)
        : text.evapSubNoClock(remainPct);

  return (
    <div className="tm-meter">
      <div className="tm-meter-head">
        <span className="tm-meter-title">
          {FACE[level]} {title}
        </span>
        <span className="tm-meter-val">{text.eatenPct(Math.round(win.usedPct))}</span>
      </div>
      <div className={`tm-meter-track ${level}`}>
        <div className={`tm-meter-fill ${level}`} style={{ width: `${Math.min(100, win.usedPct)}%` }} />
      </div>
      <p className="tm-meter-sub">{sub}</p>
    </div>
  );
}

const COACH_TEXT = {
  en: {
    freshEating: "🍚 Fresh bowl, already eating — the gauge will catch up",
    fresh: "🍚 A fresh bowl just dropped — eating now is pure profit",
    digesting: "😴 Bowl cleaned! Digesting — waiting for the next one",
    streakRisk: (days: number) => `🔥 Your ${days}-day streak breaks today — one bite keeps it alive`,
    danger: (pct: number) => `💸 ${pct}% of this bowl is about to evaporate — use it or lose it`,
    warn: (pct: number) => `⏳ ${pct}% still left — emptying it before reset is free value`,
    good: (pct: number) => `😊 Eating well — only ${pct}% will go to waste`,
  },
  ko: {
    freshEating: "🍚 새 밥그릇 먹는 중 — 게이지는 곧 따라와요",
    fresh: "🍚 새 밥그릇이 나왔어요 — 지금 먹는 게 제일 이득",
    digesting: "😴 완식! 소화 중 — 새 밥그릇을 기다려요",
    streakRisk: (days: number) => `🔥 연속 ${days}일이 오늘 끊길 위기 — 한 입만 먹여주세요`,
    danger: (pct: number) => `💸 이번 밥그릇 ${pct}%가 증발 대기 중 — 안 쓰면 그대로 사라져요`,
    warn: (pct: number) => `⏳ 아직 ${pct}% 남았어요 — 리셋 전에 비우면 이득`,
    good: (pct: number) => `😊 알뜰하게 먹는 중 — 낭비 ${pct}%뿐`,
  },
} as const;

function coachLine(
  five: TokenmonRateWindow | null,
  streakDays: number,
  fedToday: boolean,
  eating: boolean,
  lang: TokenmonLang,
): string | null {
  const text = COACH_TEXT[lang];
  if (!five) return null;
  if (five.fresh && !five.estimated) return eating ? text.freshEating : text.fresh;
  if (five.usedPct >= 99.5) return text.digesting;
  if (!fedToday && streakDays > 0) return text.streakRisk(streakDays);
  const remainPct = Math.round(100 - five.usedPct);
  if (five.usedPct < 30) return text.danger(remainPct);
  if (five.usedPct < 70) return text.warn(remainPct);
  return text.good(remainPct);
}

const PANEL_TEXT = {
  en: {
    fiveTitle: "This bowl · 5h",
    fiveNoun: "bowl",
    weekTitle: "This week's feeder · 7d",
    weekNoun: "feeder",
    tokens: "tokens collected (output)",
    streak: "daily streak",
    streakRisk: " · at risk⚠️",
    streakDays: (n: number) => `🔥 ${n}d`,
    starving: "starving",
    starvingCount: (n: number) => `🥀 ${n}`,
    wasted: (pct: number) => `The last bowl evaporated ${pct}% unused 💸`,
    lastSeenNow: "last activity just now",
    lastSeen: (duration: string) => `last activity ${duration} ago`,
  },
  ko: {
    fiveTitle: "이번 밥그릇 · 5시간",
    fiveNoun: "밥그릇",
    weekTitle: "이번 주 밥통 · 주간",
    weekNoun: "밥통",
    tokens: "모은 토큰 (출력)",
    streak: "연속 출석",
    streakRisk: " · 위험⚠️",
    streakDays: (n: number) => `🔥 ${n}일`,
    starving: "굶는 중",
    starvingCount: (n: number) => `🥀 ${n}마리`,
    wasted: (pct: number) => `지난 밥그릇은 ${pct}% 증발됐어요 💸`,
    lastSeenNow: "마지막 활동 방금 전",
    lastSeen: (duration: string) => `마지막 활동 ${duration} 전`,
  },
} as const;

export function TokenmonMeters({
  fiveHour,
  sevenDay,
  totals,
  lastActivityAt,
  streakDays,
  fedToday,
  wastedFiveHourPct,
  starvingCount,
  lang = "en",
}: {
  fiveHour: TokenmonRateWindow | null;
  sevenDay: TokenmonRateWindow | null;
  totals: TokenmonState["totals"];
  lastActivityAt: string | null;
  streakDays: number;
  fedToday: boolean;
  wastedFiveHourPct: number | null;
  starvingCount: number;
  lang?: TokenmonLang;
}) {
  const [nowMs, setNowMs] = useState<number | null>(null);
  const text = PANEL_TEXT[lang];

  useEffect(() => {
    const tick = () => setNowMs(Date.now());
    tick();
    const timer = setInterval(tick, 30_000);
    return () => clearInterval(timer);
  }, []);

  const sinceMs = lastActivityAt !== null && nowMs !== null ? Math.max(0, nowMs - Date.parse(lastActivityAt)) : null;
  const lastSeen = sinceMs === null ? null : sinceMs < 60_000 ? text.lastSeenNow : text.lastSeen(formatDuration(sinceMs, lang));
  const eating = sinceMs !== null && sinceMs < 30 * 60_000;
  const coach = coachLine(fiveHour, streakDays, fedToday, eating, lang);

  return (
    <div className="tm-status-col">
      <Meter title={text.fiveTitle} bowlNoun={text.fiveNoun} window={fiveHour} nowMs={nowMs} eating={eating} lang={lang} />
      <Meter title={text.weekTitle} bowlNoun={text.weekNoun} window={sevenDay} nowMs={nowMs} eating={eating} lang={lang} />
      <div className="tm-stats">
        <div className="tm-stat">
          <span className="metric-label">{text.tokens}</span>
          <div className="tm-stat-value">{formatTokenCount(totals.outputTokens)}</div>
        </div>
        <div className="tm-stat">
          <span className="metric-label">
            {text.streak}
            {!fedToday && streakDays > 0 ? text.streakRisk : ""}
          </span>
          <div className="tm-stat-value">{text.streakDays(streakDays)}</div>
        </div>
        <div className="tm-stat">
          <span className="metric-label">{text.starving}</span>
          <div className="tm-stat-value">{text.starvingCount(starvingCount)}</div>
        </div>
      </div>
      {coach && <p className="tm-coach">{coach}</p>}
      {wastedFiveHourPct !== null && <p className="tm-wasted">{text.wasted(wastedFiveHourPct)}</p>}
      {lastSeen && <p className="tm-last-seen">{lastSeen}</p>}
    </div>
  );
}
