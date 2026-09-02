"use client";

import { useState } from "react";
import { formatDayTime, formatTokenCount, formatUsd, type TokenmonLang, type TokenmonSession } from "@/lib/tokenmon";

const MAX_ROWS = 7;

const TEXT = {
  en: {
    empty: "No sessions recorded yet.",
    aria: "Output tokens by session",
    title: "Output tokens by session",
    legend: "input & cost in the table",
    tipOut: (n: string) => `out ${n}`,
    tipIn: (n: string) => `in (incl. cache) ${n}`,
    tipCtx: (pct: number) => ` · context ${pct}%`,
    tableToggle: "View as table",
    session: "Session",
    model: "Model",
    lastActive: "Last active",
    input: "Input",
    output: "Output",
    cost: "Cost",
    transcriptModel: "transcript",
  },
  ko: {
    empty: "아직 기록된 세션이 없습니다.",
    aria: "세션별 출력 토큰",
    title: "세션별 출력 토큰",
    legend: "입력·비용은 표에서",
    tipOut: (n: string) => `출력 ${n}`,
    tipIn: (n: string) => `입력(캐시 포함) ${n}`,
    tipCtx: (pct: number) => ` · 컨텍스트 ${pct}%`,
    tableToggle: "표로 보기",
    session: "세션",
    model: "모델",
    lastActive: "마지막 활동",
    input: "입력",
    output: "출력",
    cost: "비용",
    transcriptModel: "대화 로그",
  },
} as const;

export function TokenmonChart({ sessions, lang = "en" }: { sessions: TokenmonSession[]; lang?: TokenmonLang }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const text = TEXT[lang];
  /* 막대는 출력 토큰 기준 — 캐시 포함 입력은 세션마다 수억까지 벌어져 스케일을 뭉갠다. 입력·비용은 툴팁과 표에. */
  const rows = sessions.filter((session) => session.outputTokens > 0).slice(0, MAX_ROWS);
  const maxOutput = Math.max(...rows.map((row) => row.outputTokens), 1);

  if (rows.length === 0) {
    return (
      <div className="tm-chart-col">
        <div className="state">{text.empty}</div>
      </div>
    );
  }

  const modelName = (model: string) => (model === "대화 로그" || model === "transcript" ? text.transcriptModel : model);

  return (
    <div className="tm-chart-col" aria-label={text.aria}>
      <div className="tm-chart-head">
        <span className="tm-chart-title">{text.title}</span>
        <span className="tm-legend">{text.legend}</span>
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
                {modelName(session.model)} · {formatDayTime(session.savedAt, lang)}
              </div>
              <div className="tm-bar-slot">
                <div className="tm-bar-track" style={{ width: `${Math.max(widthPct, 2)}%` }}>
                  <span className="tm-seg output cap" style={{ flexGrow: 1 }} />
                </div>
              </div>
              <span className="tm-bar-total">{formatTokenCount(session.outputTokens)}</span>
              {hovered === index && (
                <div className="tm-tip" role="status">
                  {text.tipOut(formatTokenCount(session.outputTokens))} · {text.tipIn(formatTokenCount(session.inputTokens))}
                  <br />
                  {formatUsd(session.costUsd)}
                  {session.contextUsedPct !== null ? text.tipCtx(Math.round(session.contextUsedPct)) : ""}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <details className="tm-table">
        <summary>{text.tableToggle}</summary>
        <table>
          <thead>
            <tr>
              <th>{text.session}</th>
              <th>{text.model}</th>
              <th>{text.lastActive}</th>
              <th>{text.input}</th>
              <th>{text.output}</th>
              <th>{text.cost}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((session) => (
              <tr key={session.id}>
                <td>{session.projectName}</td>
                <td>{modelName(session.model)}</td>
                <td>{formatDayTime(session.savedAt, lang)}</td>
                <td>{session.inputTokens.toLocaleString(lang === "ko" ? "ko-KR" : "en-US")}</td>
                <td>{session.outputTokens.toLocaleString(lang === "ko" ? "ko-KR" : "en-US")}</td>
                <td>{formatUsd(session.costUsd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
