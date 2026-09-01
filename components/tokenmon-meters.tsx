"use client";

import { useEffect, useState } from "react";
import {
  formatClock,
  formatDurationKo,
  formatTokenCount,
  formatUsd,
  type TokenmonRateWindow,
  type TokenmonState,
} from "@/lib/tokenmon";

type Severity = "ok" | "warn" | "danger";

function severityOf(usedPct: number): Severity {
  return usedPct >= 90 ? "danger" : usedPct >= 70 ? "warn" : "ok";
}

const FACE: Record<Severity, string> = { ok: "😊", warn: "😪", danger: "🥵" };

function Meter({ title, window: win, nowMs }: { title: string; window: TokenmonRateWindow | null; nowMs: number | null }) {
  if (!win) {
    return (
      <div className="tm-meter">
        <div className="tm-meter-head">
          <span className="tm-meter-title">{title}</span>
          <span className="tm-meter-val">–</span>
        </div>
        <div className="tm-meter-track ok">
          <div className="tm-meter-fill ok" style={{ width: 0 }} />
        </div>
        <p className="tm-meter-sub">구독 사용량 정보를 기다리는 중 (첫 응답 후 표시돼요)</p>
      </div>
    );
  }

  const severity = severityOf(win.usedPct);
  const face = win.usedPct >= 99.5 ? "😴" : FACE[severity];
  const reset =
    win.resetsAtMs === null
      ? "리셋 시각 정보 없음"
      : `${formatClock(win.resetsAtMs)} 리셋${nowMs !== null && win.resetsAtMs > nowMs ? ` · ${formatDurationKo(win.resetsAtMs - nowMs)} 남음` : ""}`;

  return (
    <div className="tm-meter">
      <div className="tm-meter-head">
        <span className="tm-meter-title">
          {face} {title}
        </span>
        <span className="tm-meter-val">{Math.round(win.usedPct)}%</span>
      </div>
      <div className={`tm-meter-track ${severity}`}>
        <div className={`tm-meter-fill ${severity}`} style={{ width: `${Math.min(100, win.usedPct)}%` }} />
      </div>
      <p className="tm-meter-sub">{reset}</p>
    </div>
  );
}

export function TokenmonMeters({
  fiveHour,
  sevenDay,
  totals,
  lastActivityAt,
}: {
  fiveHour: TokenmonRateWindow | null;
  sevenDay: TokenmonRateWindow | null;
  totals: TokenmonState["totals"];
  lastActivityAt: string | null;
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

  return (
    <div className="tm-status-col">
      <Meter title="피로도 · 5시간 한도" window={fiveHour} nowMs={nowMs} />
      <Meter title="수명 · 주간 한도" window={sevenDay} nowMs={nowMs} />
      <div className="tm-stats">
        <div className="tm-stat">
          <span className="metric-label">모은 토큰 (출력)</span>
          <div className="tm-stat-value">{formatTokenCount(totals.outputTokens)}</div>
        </div>
        <div className="tm-stat">
          <span className="metric-label">세션 · 활동일</span>
          <div className="tm-stat-value">
            {totals.sessionCount}
            <span className="tm-stat-unit">회</span> · {totals.activeDays}
            <span className="tm-stat-unit">일</span>
          </div>
        </div>
        <div className="tm-stat">
          <span className="metric-label">API 환산 비용</span>
          <div className="tm-stat-value">{formatUsd(totals.costUsd)}</div>
        </div>
      </div>
      {lastSeen && <p className="tm-last-seen">{lastSeen}</p>}
    </div>
  );
}
