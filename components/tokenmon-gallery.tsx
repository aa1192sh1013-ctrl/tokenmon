"use client";

import {
  COMMON_SPECIES_IDS,
  DINO_SPECIES_IDS,
  LEVEL_XP,
  MAX_LEVEL,
  MYTHIC_SPECIES_IDS,
  SPECIES_COLOR_KEYS,
  type TokenmonColor,
  type TokenmonPet,
  type TokenmonSpecies,
} from "@/lib/tokenmon";
import { TokenmonPetCard } from "./tokenmon-pet";

/** 도감 — 레벨 성장 미리보기 + 전체 60종 (색은 진열용으로 순환 배정). */

const GROWTH_LEVELS = [1, 2, 3, 5, 7, 9, 11, 13, 15, 17, 20];
const INDEX_LEVEL = 12;

function samplePet(species: TokenmonSpecies, level: number, color: TokenmonColor): TokenmonPet {
  const maxed = level >= MAX_LEVEL;
  const current = LEVEL_XP[level];
  const next = maxed ? null : LEVEL_XP[level + 1];
  const xp = maxed ? 5_900 : Math.round((current + (next ?? current)) / 2);
  return {
    projectName: "도감 미리보기",
    species,
    color,
    level,
    maxLevel: maxed,
    xp,
    levelProgressPct: next === null ? 100 : Math.round(((xp - current) / (next - current)) * 100),
    nextLevelXp: next,
    mood: "happy",
    active: true,
    hungerPct: 0,
    sessionCount: level * 3,
    outputTokens: xp * 2_600,
    costUsd: Number((xp * 0.02).toFixed(2)),
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
        {ids.map((species, index) => (
          <TokenmonPetCard key={species} pet={samplePet(species, level ?? INDEX_LEVEL, SPECIES_COLOR_KEYS[index % SPECIES_COLOR_KEYS.length])} />
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
          도감 <span className="tm-sub">총 {COMMON_SPECIES_IDS.length + DINO_SPECIES_IDS.length + MYTHIC_SPECIES_IDS.length}종 × 색상 12</span>
        </h2>
        <p>프로젝트명 뽑기 확률</p>
      </div>
      <div className="tm-gallery-row">
        <p className="tm-gallery-odds">
          레벨 성장 미리보기 <span>Lv.1 알 → 레벨마다 몸집·장비가 늘어나요</span>
        </p>
        <div className="tm-roster">
          {GROWTH_LEVELS.map((level) => (
            <TokenmonPetCard key={level} pet={samplePet("wolf", level, "blue")} />
          ))}
        </div>
      </div>
      <Section title="흔한 종" odds={`50종 · 각 1.8%`} ids={COMMON_SPECIES_IDS} />
      <Section title="공룡류 ✨RARE" odds={`5종 · 각 1.2%`} ids={DINO_SPECIES_IDS} level={13} />
      <Section title="환수종 ✨RARE" odds={`5종 · 각 0.8%`} ids={MYTHIC_SPECIES_IDS} level={13} />
    </section>
  );
}
