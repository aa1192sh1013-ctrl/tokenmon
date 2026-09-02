"use client";

import {
  COMMON_SPECIES_IDS,
  DINO_SPECIES_IDS,
  LEVEL_XP,
  MAX_LEVEL,
  MYTHIC_SPECIES_IDS,
  SPECIES_COLOR_KEYS,
  type TokenmonColor,
  type TokenmonLang,
  type TokenmonPet,
  type TokenmonSpecies,
} from "@/lib/tokenmon";
import { TokenmonPetCard } from "./tokenmon-pet";

/** 도감 — 레벨 성장 미리보기 + 전체 60종 (색은 진열용으로 순환 배정). */

const GROWTH_LEVELS = [1, 2, 3, 5, 7, 9, 11, 13, 15, 17, 20];
const INDEX_LEVEL = 12;

const TEXT = {
  en: {
    preview: "Dex preview",
    title: "Dex",
    sub: (total: number) => `${total} species × 12 colors`,
    rolls: "rolled from your project name",
    growth: "Level growth preview",
    growthSub: "Lv.1 baby → Lv.20 final form — a new look every level",
    common: "Common",
    commonOdds: "50 species · 1.8% each",
    dino: "Dino ✨RARE",
    dinoOdds: "5 species · 1.2% each",
    mythic: "Mythic ✨RARE",
    mythicOdds: "5 species · 0.8% each",
  },
  ko: {
    preview: "도감 미리보기",
    title: "도감",
    sub: (total: number) => `총 ${total}종 × 색상 12`,
    rolls: "프로젝트명 뽑기 확률",
    growth: "레벨 성장 미리보기",
    growthSub: "Lv.1 아기 → Lv.20 최종형 — 레벨마다 모습이 달라져요",
    common: "흔한 종",
    commonOdds: "50종 · 각 1.8%",
    dino: "공룡류 ✨RARE",
    dinoOdds: "5종 · 각 1.2%",
    mythic: "환수종 ✨RARE",
    mythicOdds: "5종 · 각 0.8%",
  },
} as const;

function samplePet(species: TokenmonSpecies, level: number, color: TokenmonColor, previewName: string): TokenmonPet {
  const maxed = level >= MAX_LEVEL;
  const current = LEVEL_XP[level];
  const next = maxed ? null : LEVEL_XP[level + 1];
  const xp = maxed ? 5_900 : Math.round((current + (next ?? current)) / 2);
  return {
    projectName: previewName,
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

function Section({
  title,
  odds,
  ids,
  level,
  lang,
  previewName,
}: {
  title: string;
  odds: string;
  ids: readonly string[];
  level?: number;
  lang: TokenmonLang;
  previewName: string;
}) {
  return (
    <div className="tm-gallery-row">
      <p className="tm-gallery-odds">
        {title} <span>{odds}</span>
      </p>
      <div className="tm-roster">
        {ids.map((species, index) => (
          <TokenmonPetCard
            key={species}
            pet={samplePet(species, level ?? INDEX_LEVEL, SPECIES_COLOR_KEYS[index % SPECIES_COLOR_KEYS.length], previewName)}
            lang={lang}
          />
        ))}
      </div>
    </div>
  );
}

export function TokenmonGallery({ lang = "en" }: { lang?: TokenmonLang }) {
  const text = TEXT[lang];
  const total = COMMON_SPECIES_IDS.length + DINO_SPECIES_IDS.length + MYTHIC_SPECIES_IDS.length;
  return (
    <section className="content-panel tokenmon-panel" aria-label={`Tokenmon ${text.title}`}>
      <div className="panel-heading">
        <h2>
          {text.title} <span className="tm-sub">{text.sub(total)}</span>
        </h2>
        <p>{text.rolls}</p>
      </div>
      <div className="tm-gallery-row">
        <p className="tm-gallery-odds">
          {text.growth} <span>{text.growthSub}</span>
        </p>
        <div className="tm-roster">
          {GROWTH_LEVELS.map((level) => (
            <TokenmonPetCard key={level} pet={samplePet("wolf", level, "blue", text.preview)} lang={lang} />
          ))}
        </div>
      </div>
      <Section title={text.common} odds={text.commonOdds} ids={COMMON_SPECIES_IDS} lang={lang} previewName={text.preview} />
      <Section title={text.dino} odds={text.dinoOdds} ids={DINO_SPECIES_IDS} level={13} lang={lang} previewName={text.preview} />
      <Section title={text.mythic} odds={text.mythicOdds} ids={MYTHIC_SPECIES_IDS} level={13} lang={lang} previewName={text.preview} />
    </section>
  );
}
