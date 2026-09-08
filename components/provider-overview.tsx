"use client";
import { useEffect, useState } from "react";
import { ClaudeUsageLimits } from "./tokenmon-meters";
import type { CodexQuota, CodexStatus } from "@/lib/codex-collector";
import { formatDayTime, formatDuration, formatTokenCount, type TokenmonLang, type TokenmonState } from "@/lib/tokenmon";

export function ProviderOverview({ state, quotas, status, lang }: { state: TokenmonState; quotas: CodexQuota[]; status?: CodexStatus; lang: TokenmonLang }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const timer = setInterval(() => setNow(Date.now()), 30_000); return () => clearInterval(timer); }, []);
  const ko = lang === "ko";
  return <div className="tm-providers">
    <div className="tm-provider-totals">
      <div><span>{ko ? "함께 모은 총 토큰" : "Combined total tokens"}</span><strong>{formatTokenCount(state.totals.inputTokens + state.totals.outputTokens)}</strong></div>
      {(["claude", "codex"] as const).map(provider => {
        const total = state.providerTotals[provider];
        return <div key={provider}><span>{provider === "codex" ? "Codex" : "Claude Code"}</span><strong>{formatTokenCount(total.inputTokens + total.outputTokens)}</strong><small>{total.sessions} {ko ? "세션" : "sessions"}</small></div>;
      })}
    </div>
    {status?.indexing && <p role="status">{ko ? `Codex 기록 집계 중 · ${status.scanned}/${status.total}개 파일` : `Indexing Codex history · ${status.scanned}/${status.total} files`}</p>}
    {!!status?.errors && <p role="status">{ko ? `${status.errors}개 기록을 읽지 못해 합계가 일부 누락될 수 있습니다. 다음 갱신에서 재시도합니다.` : `${status.errors} logs could not be read; totals may be incomplete. Retrying on the next refresh.`}</p>}
    <div className="tm-provider-limits">
    <ClaudeUsageLimits fiveHour={state.fiveHour} sevenDay={state.sevenDay} nowMs={now} lang={lang} />
    <div className="tm-codex-limits">
      <h3>{ko ? "Codex 사용 한도" : "Codex usage limits"}</h3>
      {!quotas.length && <p>{ko ? "Codex 사용 한도 관측 대기 중 · 로컬 작업 후 자동 반영" : "Waiting for quota data from a local Codex task"}</p>}
      {quotas.map((q, index) => <div key={q.id} className="tm-quota-group">
        <p className="tm-quota-observed">{q.name || (q.id === "codex" ? "Codex" : `${ko ? "추가 모델 한도" : "Additional model limit"} ${index}`)} · {ko ? "마지막 관측" : "Last observed"} {formatDayTime(q.observedAt, lang)}{now !== null && now - Date.parse(q.observedAt) > 10 * 60_000 ? (ko ? " · 갱신 대기" : " · awaiting update") : ""}</p>
        {q.windows.map((w, i) => {
          const expired = now !== null && w.resetsAtMs !== null && w.resetsAtMs <= now;
          const title = w.minutes > 0 ? formatDuration(w.minutes * 60_000, lang) : (ko ? "사용 구간" : "Usage window");
          return <div key={i} className="tm-codex-window">
            <div><span>{title}</span><strong>{expired ? "—" : `${Math.round(w.usedPct)}%`}</strong></div>
            <progress max="100" value={expired ? 0 : w.usedPct} aria-label={`Codex ${title}`} />
            <small>{expired ? (ko ? "이전 구간 만료 · 새 사용량 대기" : "Previous window expired · awaiting new data") : w.resetsAtMs !== null ? `${ko ? "리셋" : "Resets"} ${formatDayTime(new Date(w.resetsAtMs).toISOString(), lang)}` : (ko ? "리셋 시각 정보 없음" : "Reset time unavailable")}</small>
          </div>;
        })}
      </div>)}
    </div>
    </div>
  </div>;
}
