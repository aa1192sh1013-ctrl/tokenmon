"use client";

import type { CodexQuota, CodexStatus } from "@/lib/codex-collector";
import { ProviderOverview } from "./provider-overview";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { TokenmonLang, TokenmonState } from "@/lib/tokenmon";
import { TokenmonChart } from "./tokenmon-chart";
import { TokenmonMeters } from "./tokenmon-meters";
import { TokenmonPetCard } from "./tokenmon-pet";
import { LanguageToggle } from "./language-toggle";

const REFRESH_MS = 5_000;
const MAX_PETS = 12;

const TEXT = {
  en: {
    sub: "Claude Code + Codex companions",
    live: "live",
    preview: "preview data · waiting for hookup",
    rosterTitle: "Project critters",
    rosterCount: (pets: number, awake: number) => `${pets} critters · ${awake} awake · `,
    dex: "dex",
    empty: "No critters hatched yet. Work on any project with Claude Code or Codex and one will be born.",
    resting: (n: number) => `${n} resting critters are tucked away.`,
    note: "Open a local Codex task or run npm run setup for Claude Code. Your first companion starts growing after it is discovered.",
    aria: "Tokenmon — Claude Code + Codex usage",
  },
  ko: {
    sub: "Claude Code + Codex 통합 동물봇",
    live: "실시간 연동",
    preview: "미리보기 데이터 · 연동 대기",
    rosterTitle: "프로젝트 캐릭터",
    rosterCount: (pets: number, awake: number) => `${pets}마리 · 깨어 있음 ${awake}마리 · `,
    dex: "도감",
    empty: "아직 부화한 캐릭터가 없어요. Claude Code 또는 Codex로 아무 프로젝트나 작업하면 캐릭터가 태어납니다.",
    resting: (n: number) => `쉬고 있는 캐릭터 ${n}마리는 접혀 있어요.`,
    note: "로컬 Codex 작업을 시작하거나 Claude Code에서 npm run setup으로 수집기를 연결하세요. 처음 감지된 이후 사용량으로 캐릭터가 성장합니다.",
    aria: "Tokenmon — Claude Code + Codex 사용량",
  },
} as const;

export function TokenmonPanel({ state, lang = "en", codexQuotas = [], codexStatus }: { state: TokenmonState; lang?: TokenmonLang; codexQuotas?: CodexQuota[]; codexStatus?: CodexStatus }) {
  const [showAll, setShowAll] = useState(false);
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
        <div className="tm-heading-actions"><p>
          {state.live ? <span className="status active">{text.live}</span> : <span className="status paused">{text.preview}</span>}
        </p><LanguageToggle lang={lang} /></div>
      </div>

      <ProviderOverview state={state} quotas={codexQuotas} status={codexStatus} lang={lang} />
      <div className="tm-summary">
        <TokenmonMeters
          fiveHour={state.fiveHour}
          totals={state.totals}
          lastActivityAt={state.lastActivityAt}
          claudeLastActivityAt={state.sessions.find(s => s.provider === "claude")?.savedAt ?? null}
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
          <Link className="tm-open-link" href={`/gallery?lang=${lang}`}>
            {text.dex}
          </Link>
        </span>
      </div>
      {state.pets.length === 0 ? (
        <div className="state">{text.empty}</div>
      ) : (
        <div className="tm-roster">
          {(showAll ? state.pets : state.pets.slice(0, MAX_PETS)).map((pet) => (
            <TokenmonPetCard key={pet.projectId || pet.projectName} pet={pet} lang={lang} />
          ))}
        </div>
      )}
      {restingCount > 0 && <button className="tm-button tm-roster-more" onClick={() => setShowAll(!showAll)}>{showAll ? (lang === "ko" ? "접기" : "Show less") : (lang === "ko" ? `${restingCount}마리 더 보기` : `Show ${restingCount} more`)}</button>}

      {!state.live && <p className="tm-note">{text.note}</p>}
    </section>
  );
}
