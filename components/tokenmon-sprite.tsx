"use client";

import { MAX_LEVEL, type TokenmonColor, type TokenmonLang, type TokenmonSpecies } from "@/lib/tokenmon";
import { getSpeciesInfo, SPECIES_DEFS } from "./tokenmon-species";

/**
 * 캐릭터 스프라이트 — 종/레벨별 일러스트(/species/<id>/<level>.webp)에
 * AnimalBot 원화의 고유 색상과 투명 오라를 유지한다.
 */
export function PetSprite({
  species,
  level,
  size,
  label,
  dim = false,
  lang = "en",
}: {
  species: TokenmonSpecies;
  color: TokenmonColor;
  level: number;
  size: number;
  label: string;
  /** 절전/굶주림 등 — 흐리게. */
  dim?: boolean;
  lang?: TokenmonLang;
}) {
  const safeLevel = Math.max(0, Math.min(MAX_LEVEL, Math.round(level)));
  const info = getSpeciesInfo(species, lang);
  const id = species in SPECIES_DEFS ? species : "dog";
  const SPRITE_V = "animalbot-20260908"; // 스프라이트 교체 시 올려서 브라우저 캐시 무효화
  return (
    <span className={`tm-sprite-frame ${dim ? "dim" : ""}`} style={{ width: size, height: size }} role="img" aria-label={label}>
      {/* eslint-disable-next-line @next/next/no-img-element -- 로컬 정적 스프라이트, 최적화 불필요 */}
      <img
        src={`/species/${id}/${safeLevel}.webp?v=${SPRITE_V}`}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        draggable={false}
        title={`${info.label} · Lv.${safeLevel}`}
      />
    </span>
  );
}
