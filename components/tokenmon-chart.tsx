"use client";

import { useState } from "react";
import { formatDayTime, formatTokenCount, formatUsd, type TokenmonSession } from "@/lib/tokenmon";

const MAX_ROWS = 7;

export function TokenmonChart({ sessions }: { sessions: TokenmonSession[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  /* 막대는 출력 토큰 기준 — 캐시 포함 입력은 세션마다 수억까지 벌어져 스케일을 뭉갠다. 입력·비용은 툴팁과 표에. */
  const rows = sessions.filter((session) => session.outputTokens > 0).slice(0, MAX_ROWS);
  const maxOutput = Math.max(...rows.map((row) => row.outputTokens), 1);

  if (rows.length === 0) {
    return (
      <div className="tm-chart-col">
        <div className="state">아직 기록된 세션이 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="tm-chart-col" aria-label="세션별 출력 토큰">
      <div className="tm-chart-head">
        <span className="tm-chart-title">세션별 출력 토큰</span>
        <span className="tm-legend">입력·비용은 표에서</span>
      </div>
      <div className="tm-bars">
        {rows.map((session, index) => {
          const widthPct = (session.outputTokens / maxOutput) * 100;
          return (
            <div
              className="tm-bar-row"
              key={session.id}
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered((current) => (current === index ? null : current))}
            >
              <div className="tm-bar-meta">
                <strong>{session.projectName}</strong>
                {session.model} · {formatDayTime(session.savedAt)}
              </div>
              <div className="tm-bar-slot">
                <div className="tm-bar-track" style={{ width: `${Math.max(widthPct, 2)}%` }}>
                  <span className="tm-seg output cap" style={{ flexGrow: 1 }} />
                </div>
              </div>
              <span className="tm-bar-total">{formatTokenCount(session.outputTokens)}</span>
              {hovered === index && (
                <div className="tm-tip" role="status">
                  출력 {formatTokenCount(session.outputTokens)} · 입력(캐시 포함) {formatTokenCount(session.inputTokens)}
                  <br />
                  {formatUsd(session.costUsd)}
                  {session.contextUsedPct !== null ? ` · 컨텍스트 ${Math.round(session.contextUsedPct)}%` : ""}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <details className="tm-table">
        <summary>표로 보기</summary>
        <table>
          <thead>
            <tr>
              <th>세션</th>
              <th>모델</th>
              <th>마지막 활동</th>
              <th>입력</th>
              <th>출력</th>
              <th>비용</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((session) => (
              <tr key={session.id}>
                <td>{session.projectName}</td>
                <td>{session.model}</td>
                <td>{formatDayTime(session.savedAt)}</td>
                <td>{session.inputTokens.toLocaleString("ko-KR")}</td>
                <td>{session.outputTokens.toLocaleString("ko-KR")}</td>
                <td>{formatUsd(session.costUsd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
