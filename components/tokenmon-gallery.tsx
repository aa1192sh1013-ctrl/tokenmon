"use client";

import { SESSION_STAGE_XP, type TokenmonPet, type TokenmonSpecies, type TokenmonStage } from "@/lib/tokenmon";
import { TokenmonPetCard } from "./tokenmon-pet";

/** 도감 — 모든 종족 × 성장 단계를 가짜 데이터로 미리 본다. */

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

const STAGES: { stage: TokenmonStage; xp: number; progress: number; next: number | null }[] = [
  { stage: "egg", xp: 80, progress: 66, next: SESSION_STAGE_XP.baby },
  { stage: "baby", xp: 500, progress: 35, next: SESSION_STAGE_XP.pet },
  { stage: "pet", xp: 2400, progress: 32, next: SESSION_STAGE_XP.dragon },
  { stage: "dragon", xp: 6800, progress: 100, next: null },
];

function samplePet(species: TokenmonSpecies, spec: (typeof STAGES)[number]): TokenmonPet {
  return {
    session: {
      id: `gallery-${species}-${spec.stage}`,
      projectName: "도감 미리보기",
      model: "Opus",
      savedAt: new Date(0).toISOString(),
      inputTokens: spec.xp * 180,
      outputTokens: spec.xp * 22,
      costUsd: Number((spec.xp / 900).toFixed(2)),
      contextUsedPct: 20,
      linesAdded: 0,
      linesRemoved: 0,
      apiDurationMs: 0,
    },
    species,
    stage: spec.stage,
    xp: spec.xp,
    stageProgressPct: spec.progress,
    nextStageXp: spec.next,
    mood: "happy",
    active: true,
  };
}

export function TokenmonGallery() {
  return (
    <section className="content-panel tokenmon-panel" aria-label="Tokenmon 도감">
      <div className="panel-heading">
        <h2>
          도감 <span className="tm-sub">모든 종족 × 성장 단계</span>
        </h2>
        <p>세션 ID 뽑기 확률</p>
      </div>
      {SPECIES_ROWS.map(({ species, odds }) => (
        <div className="tm-gallery-row" key={species}>
          <p className="tm-gallery-odds">{odds}</p>
          <div className="tm-roster">
            {STAGES.map((spec) => (
              <TokenmonPetCard key={`${species}-${spec.stage}`} pet={samplePet(species, spec)} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
