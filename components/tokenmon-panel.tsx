"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { TokenmonState } from "@/lib/tokenmon";
import { TokenmonChart } from "./tokenmon-chart";
import { TokenmonMeters } from "./tokenmon-meters";
import { TokenmonPetCard } from "./tokenmon-pet";

const REFRESH_MS = 20_000;
const MAX_PETS = 8;

export function TokenmonPanel({ state }: { state: TokenmonState }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [router]);

  const restingCount = Math.max(0, state.pets.length - MAX_PETS);

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

      <div className="tm-summary">
        <TokenmonMeters
          fiveHour={state.fiveHour}
          sevenDay={state.sevenDay}
          totals={state.totals}
          lastActivityAt={state.lastActivityAt}
        />
        <TokenmonChart sessions={state.sessions} />
      </div>

      <div className="tm-roster-head">
        <h3>세션 캐릭터</h3>
        <span>
          {state.pets.length}마리 · 깨어 있음 {state.activeSessionCount}마리 ·{" "}
          <Link className="tm-open-link" href="/gallery">
            도감
          </Link>
        </span>
      </div>
      {state.pets.length === 0 ? (
        <div className="state">아직 부화한 캐릭터가 없어요. Claude Code 세션을 열면 알이 생깁니다.</div>
      ) : (
        <div className="tm-roster">
          {state.pets.slice(0, MAX_PETS).map((pet) => (
            <TokenmonPetCard key={pet.session.id} pet={pet} />
          ))}
        </div>
      )}
      {restingCount > 0 && <p className="tm-roster-more">지난 세션 캐릭터 {restingCount}마리는 더 깊이 잠들어 있어요.</p>}

      {!state.live && (
        <p className="tm-note">
          아직 수집된 데이터가 없어요. <code>npm run setup</code>으로 수집기를 설치한 뒤, 새 Claude Code 세션에서 아무
          작업이나 한 번 하면 자동으로 실시간 데이터로 바뀝니다.
        </p>
      )}
    </section>
  );
}
