"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { TokenmonLang, TokenmonState } from "@/lib/tokenmon";
import { TokenmonChart } from "./tokenmon-chart";
import { TokenmonMeters } from "./tokenmon-meters";
import { TokenmonPetCard } from "./tokenmon-pet";

const REFRESH_MS = 5_000;
const MAX_PETS = 12;

const TEXT = {
  en: {
    sub: "the Claude Code token tamagotchi",
    live: "live",
    preview: "preview data · waiting for hookup",
    rosterTitle: "Project critters",
    rosterCount: (pets: number, awake: number) => `${pets} critters · ${awake} awake · `,
    dex: "dex",
    empty: "No critters hatched yet. Work on any project with Claude Code and one will be born.",
    resting: (n: number) => `${n} resting critters are tucked away.`,
    note: "No data collected yet. Run `npm run setup` to install the collector, then do anything in a new Claude Code session and this switches to live data.",
    aria: "Tokenmon — Claude Code usage",
  },
  ko: {
    sub: "Claude Code 토큰 다마고치",
    live: "실시간 연동",
    preview: "미리보기 데이터 · 연동 대기",
    rosterTitle: "프로젝트 캐릭터",
    rosterCount: (pets: number, awake: number) => `${pets}마리 · 깨어 있음 ${awake}마리 · `,
    dex: "도감",
    empty: "아직 부화한 캐릭터가 없어요. Claude Code로 아무 프로젝트나 작업하면 캐릭터가 태어납니다.",
    resting: (n: number) => `쉬고 있는 캐릭터 ${n}마리는 접혀 있어요.`,
    note: "아직 수집된 데이터가 없어요. npm run setup 으로 수집기를 설치한 뒤, 새 Claude Code 세션에서 아무 작업이나 한 번 하면 자동으로 실시간 데이터로 바뀝니다.",
    aria: "Tokenmon — Claude Code 사용량",
  },
} as const;

export function TokenmonPanel({ state, lang = "en" }: { state: TokenmonState; lang?: TokenmonLang }) {
  const router = useRouter();
  const text = TEXT[lang];

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [router]);

  const restingCount = Math.max(0, state.pets.length - MAX_PETS);

  return (
    <section className="content-panel tokenmon-panel" id="tokenmon" aria-label={text.aria}>
      <div className="panel-heading">
        <h2>
          Tokenmon <span className="tm-sub">{text.sub}</span>
        </h2>
        <p>
          {state.live ? <span className="status active">{text.live}</span> : <span className="status paused">{text.preview}</span>}
        </p>
      </div>

      <div className="tm-summary">
        <TokenmonMeters
          fiveHour={state.fiveHour}
          sevenDay={state.sevenDay}
          totals={state.totals}
          lastActivityAt={state.lastActivityAt}
          streakDays={state.streakDays}
          fedToday={state.fedToday}
          wastedFiveHourPct={state.wastedFiveHourPct}
          starvingCount={state.starvingCount}
          lang={lang}
        />
        <TokenmonChart sessions={state.sessions} lang={lang} />
      </div>

      <div className="tm-roster-head">
        <h3>{text.rosterTitle}</h3>
        <span>
          {text.rosterCount(state.pets.length, state.activeSessionCount)}
          <Link className="tm-open-link" href="/gallery">
            {text.dex}
          </Link>
        </span>
      </div>
      {state.pets.length === 0 ? (
        <div className="state">{text.empty}</div>
      ) : (
        <div className="tm-roster">
          {state.pets.slice(0, MAX_PETS).map((pet) => (
            <TokenmonPetCard key={pet.projectName} pet={pet} lang={lang} />
          ))}
        </div>
      )}
      {restingCount > 0 && <p className="tm-roster-more">{text.resting(restingCount)}</p>}

      {!state.live && <p className="tm-note">{text.note}</p>}
    </section>
  );
}
