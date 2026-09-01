"use client";

import { LEVEL_XP, MAX_LEVEL, stageOfLevel, type TokenmonPet, type TokenmonSpecies } from "@/lib/tokenmon";
import { TokenmonPetCard } from "./tokenmon-pet";

/** 도감 — 모든 종족 × 레벨 구간을 가짜 데이터로 미리 본다. */

const SPECIES_ROWS: { species: TokenmonSpecies; odds: string }[] = [
  { species: "sunset", odds: "18%" },
  { species: "star", odds: "18%" },
  { species: "ocean", odds: "18%" },
  { species: "blossom", odds: "18%" },
  { species: "sprout", odds: "18%" },
  { species: "dino", odds: "5% ✨" },
  { species: "unicorn", odds: "3% ✨" },
  { species: "dragonet", odds: "2% ✨" },
];

const SAMPLE_LEVELS = [1, 5, 10, 17, 20];

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
    sessionCount: level * 3,
    outputTokens: xp * 22,
    costUsd: Number((xp / 900).toFixed(2)),
    lastSeenAt: new Date(0).toISOString(),
  };
}

export function TokenmonGallery() {
  return (
    <section className="content-panel tokenmon-panel" aria-label="Tokenmon 도감">
      <div className="panel-heading">
        <h2>
          도감 <span className="tm-sub">모든 종족 × 레벨 구간</span>
        </h2>
        <p>프로젝트명 뽑기 확률</p>
      </div>
      {SPECIES_ROWS.map(({ species, odds }) => (
        <div className="tm-gallery-row" key={species}>
          <p className="tm-gallery-odds">{odds}</p>
          <div className="tm-roster">
            {SAMPLE_LEVELS.map((level) => (
              <TokenmonPetCard key={`${species}-${level}`} pet={samplePet(species, level)} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
