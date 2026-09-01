"use client";

import { useEffect, useState } from "react";
import {
  formatClock,
  formatDurationKo,
  formatTokenCount,
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

function Meter({
  title,
  bowlNoun,
  window: win,
  nowMs,
}: {
  title: string;
  bowlNoun: string;
  window: TokenmonRateWindow | null;
  nowMs: number | null;
}) {
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
        <p className="tm-meter-sub">정보 대기 중 — 상태줄이 있는 Claude 창에서 채워져요</p>
      </div>
    );
  }

  const level = wasteLevelOf(win.usedPct);
  const remainPct = Math.max(0, Math.round(100 - win.usedPct));
  const clock = win.resetsAtMs === null ? null : formatClock(win.resetsAtMs);
  const countdown =
    win.resetsAtMs !== null && nowMs !== null && win.resetsAtMs > nowMs ? formatDurationKo(win.resetsAtMs - nowMs) : null;
  const sub =
    level === "gold"
      ? `완식! 낭비 0% — ${clock ? `${clock}에 새 ${bowlNoun}` : "리셋 대기 중"}`
      : clock
        ? `${clock}에 남은 ${remainPct}% 증발${countdown ? ` · ${countdown} 남음` : ""}`
        : `남은 ${remainPct}%는 리셋 때 증발해요`;

  return (
    <div className="tm-meter">
      <div className="tm-meter-head">
        <span className="tm-meter-title">
          {FACE[level]} {title}
        </span>
        <span className="tm-meter-val">{Math.round(win.usedPct)}% 먹음</span>
      </div>
      <div className={`tm-meter-track ${level}`}>
        <div className={`tm-meter-fill ${level}`} style={{ width: `${Math.min(100, win.usedPct)}%` }} />
      </div>
      <p className="tm-meter-sub">{sub}</p>
    </div>
  );
}

function coachLine(
  five: TokenmonRateWindow | null,
  streakDays: number,
  fedToday: boolean,
): string | null {
  if (!five) return null;
  if (five.usedPct >= 99.5) return "😴 완식! 소화 중 — 새 밥그릇을 기다려요";
  if (!fedToday && streakDays > 0) return `🔥 연속 ${streakDays}일이 오늘 끊길 위기 — 한 입만 먹여주세요`;
  const remainPct = Math.round(100 - five.usedPct);
  if (five.usedPct < 30) return `💸 이번 밥그릇 ${remainPct}%가 증발 대기 중 — 안 쓰면 그대로 사라져요`;
  if (five.usedPct < 70) return `⏳ 아직 ${remainPct}% 남았어요 — 리셋 전에 비우면 이득`;
  return `😊 알뜰하게 먹는 중 — 낭비 ${remainPct}%뿐`;
}

export function TokenmonMeters({
  fiveHour,
  sevenDay,
  totals,
  lastActivityAt,
  streakDays,
  fedToday,
  wastedFiveHourPct,
  starvingCount,
}: {
  fiveHour: TokenmonRateWindow | null;
  sevenDay: TokenmonRateWindow | null;
  totals: TokenmonState["totals"];
  lastActivityAt: string | null;
  streakDays: number;
  fedToday: boolean;
  wastedFiveHourPct: number | null;
  starvingCount: number;
}) {
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNowMs(Date.now());
    tick();
    const timer = setInterval(tick, 30_000);
    return () => clearInterval(timer);
  }, []);

  const sinceMs = lastActivityAt !== null && nowMs !== null ? Math.max(0, nowMs - Date.parse(lastActivityAt)) : null;
  const lastSeen = sinceMs === null ? null : sinceMs < 60_000 ? "마지막 활동 방금 전" : `마지막 활동 ${formatDurationKo(sinceMs)} 전`;
  const coach = coachLine(fiveHour, streakDays, fedToday);

  return (
    <div className="tm-status-col">
      <Meter title="이번 밥그릇 · 5시간" bowlNoun="밥그릇" window={fiveHour} nowMs={nowMs} />
      <Meter title="이번 주 밥통 · 주간" bowlNoun="밥통" window={sevenDay} nowMs={nowMs} />
      <div className="tm-stats">
        <div className="tm-stat">
          <span className="metric-label">모은 토큰 (출력)</span>
          <div className="tm-stat-value">{formatTokenCount(totals.outputTokens)}</div>
        </div>
        <div className="tm-stat">
          <span className="metric-label">연속 출석{!fedToday && streakDays > 0 ? " · 위험⚠️" : ""}</span>
          <div className="tm-stat-value">🔥 {streakDays}일</div>
        </div>
        <div className="tm-stat">
          <span className="metric-label">굶는 중</span>
          <div className="tm-stat-value">🥀 {starvingCount}마리</div>
        </div>
      </div>
      {coach && <p className="tm-coach">{coach}</p>}
      {wastedFiveHourPct !== null && <p className="tm-wasted">지난 밥그릇은 {wastedFiveHourPct}% 증발됐어요 💸</p>}
      {lastSeen && <p className="tm-last-seen">{lastSeen}</p>}
    </div>
  );
}
