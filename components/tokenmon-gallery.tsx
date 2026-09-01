"use client";

import {
  COMMON_SPECIES_IDS,
  DINO_SPECIES_IDS,
  LEVEL_XP,
  MAX_LEVEL,
  MYTHIC_SPECIES_IDS,
  stageOfLevel,
  type TokenmonPet,
  type TokenmonSpecies,
} from "@/lib/tokenmon";
import { TokenmonPetCard } from "./tokenmon-pet";

/** 도감 — 레벨 성장 미리보기 + 전체 60종. */

const GROWTH_LEVELS = [1, 2, 3, 5, 7, 9, 11, 13, 15, 17, 20];
const INDEX_LEVEL = 10;

function samplePet(species: TokenmonSpecies, level: number): TokenmonPet {
  const maxed = level >= MAX_LEVEL;
  const current = LEVEL_XP[level];
  const next = maxed ? null : LEVEL_XP[level + 1];
  const xp = maxed ? 520_000 : Math.round((current + (next ?? current)) / 2);
  return {
    projectName: "도감 미리보기",
    species,
    level,
    maxLevel: maxed,
    stage: stageOfLevel(level),
    xp,
    levelProgressPct: next === null ? 100 : Math.round(((xp - current) / (next - current)) * 100),
    nextLevelXp: next,
    mood: "happy",
    active: true,
    hungerPct: 0,
    sessionCount: level * 3,
    outputTokens: xp * 22,
    costUsd: Number((xp / 900).toFixed(2)),
    lastSeenAt: new Date(0).toISOString(),
  };
}

function Section({ title, odds, ids, level }: { title: string; odds: string; ids: readonly string[]; level?: number }) {
  return (
    <div className="tm-gallery-row">
      <p className="tm-gallery-odds">
        {title} <span>{odds}</span>
      </p>
      <div className="tm-roster">
        {ids.map((species) => (
          <TokenmonPetCard key={species} pet={samplePet(species, level ?? INDEX_LEVEL)} />
        ))}
      </div>
    </div>
  );
}

export function TokenmonGallery() {
  return (
    <section className="content-panel tokenmon-panel" aria-label="Tokenmon 도감">
      <div className="panel-heading">
        <h2>
          도감 <span className="tm-sub">총 {COMMON_SPECIES_IDS.length + DINO_SPECIES_IDS.length + MYTHIC_SPECIES_IDS.length}종</span>
        </h2>
        <p>프로젝트명 뽑기 확률</p>
      </div>
      <div className="tm-gallery-row">
        <p className="tm-gallery-odds">
          레벨 성장 미리보기 <span>레벨마다 몸집과 장식이 늘어나요</span>
        </p>
        <div className="tm-roster">
          {GROWTH_LEVELS.map((level) => (
            <TokenmonPetCard key={level} pet={samplePet(COMMON_SPECIES_IDS[0], level)} />
          ))}
        </div>
      </div>
      <Section title="흔한 종" odds={`50종 · 각 1.8%`} ids={COMMON_SPECIES_IDS} />
      <Section title="공룡류 ✨RARE" odds={`5종 · 각 1.2%`} ids={DINO_SPECIES_IDS} level={12} />
      <Section title="환수종 ✨RARE" odds={`5종 · 각 0.8%`} ids={MYTHIC_SPECIES_IDS} level={12} />
    </section>
  );
}
