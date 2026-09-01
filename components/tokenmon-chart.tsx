"use client";

import { useState } from "react";
import { formatDayTime, formatTokenCount, formatUsd, type TokenmonSession } from "@/lib/tokenmon";

const MAX_ROWS = 7;

export function TokenmonChart({ sessions }: { sessions: TokenmonSession[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const rows = sessions.slice(0, MAX_ROWS);
  const maxTotal = Math.max(...rows.map((row) => row.inputTokens + row.outputTokens), 1);

  if (rows.length === 0) {
    return (
      <div className="tm-chart-col">
        <div className="state">아직 기록된 세션이 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="tm-chart-col" aria-label="세션별 토큰 사용량">
      <div className="tm-chart-head">
        <span className="tm-chart-title">세션별 토큰</span>
        <span className="tm-legend">
          <span>
            <i className="tm-swatch input" aria-hidden /> 입력(캐시 포함)
          </span>
          <span>
            <i className="tm-swatch output" aria-hidden /> 출력
          </span>
        </span>
      </div>
      <div className="tm-bars">
        {rows.map((session, index) => {
          const total = session.inputTokens + session.outputTokens;
          const widthPct = (total / maxTotal) * 100;
          const inputShare = total > 0 ? session.inputTokens / total : 0;
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
                  {session.inputTokens > 0 && (
                    <span
                      className={`tm-seg input ${session.outputTokens === 0 ? "cap" : ""}`}
                      style={{ flexGrow: inputShare }}
                    />
                  )}
                  {session.outputTokens > 0 && <span className="tm-seg output cap" style={{ flexGrow: 1 - inputShare }} />}
                </div>
              </div>
              <span className="tm-bar-total">{formatTokenCount(total)}</span>
              {hovered === index && (
                <div className="tm-tip" role="status">
                  입력 {formatTokenCount(session.inputTokens)} · 출력 {formatTokenCount(session.outputTokens)}
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
