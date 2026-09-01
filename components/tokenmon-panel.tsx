"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { TokenmonState } from "@/lib/tokenmon";
import { TokenmonChart } from "./tokenmon-chart";
import { TokenmonMeters } from "./tokenmon-meters";
import { TokenmonPet } from "./tokenmon-pet";

const REFRESH_MS = 20_000;

export function TokenmonPanel({ state }: { state: TokenmonState }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [router]);

  return (
    <section className="content-panel tokenmon-panel" id="tokenmon" aria-label="Tokenmon — Claude Code 사용량">
      <div className="panel-heading">
        <h2>
          Tokenmon <span className="tm-sub">Claude Code 토큰 다마고치</span>
        </h2>
        <p>
          {state.live ? (
            <span className="status active">실시간 연동</span>
          ) : (
            <span className="status paused">미리보기 데이터 · 연동 대기</span>
          )}
        </p>
      </div>
      <div className="tokenmon-grid">
        <TokenmonPet
          stage={state.stage}
          mood={state.mood}
          xp={state.xp}
          nextStageXp={state.nextStageXp}
          stageProgressPct={state.stageProgressPct}
          activeSessionCount={state.activeSessionCount}
        />
        <TokenmonMeters
          fiveHour={state.fiveHour}
          sevenDay={state.sevenDay}
          totals={state.totals}
          lastActivityAt={state.lastActivityAt}
        />
        <TokenmonChart sessions={state.sessions} />
      </div>
      {!state.live && (
        <p className="tm-note">
          아직 수집된 데이터가 없어요. <code>npm run setup</code>으로 수집기를 설치한 뒤, 새 Claude Code 세션에서 아무
          작업이나 한 번 하면 자동으로 실시간 데이터로 바뀝니다.
        </p>
      )}
    </section>
  );
}
