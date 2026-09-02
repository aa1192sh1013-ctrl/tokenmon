"use client";

import { MAX_LEVEL, type TokenmonColor, type TokenmonSpecies } from "@/lib/tokenmon";
import { getColorInfo, getSpeciesInfo, SPECIES_DEFS } from "./tokenmon-species";

/**
 * 캐릭터 스프라이트 — 종/레벨별 일러스트(/species/<id>/<level>.jpg)에
 * 색상 필터를 입혀 보여준다. 원본은 은빛 메탈 + 시안 발광 기준.
 */
export function PetSprite({
  species,
  color,
  level,
  size,
  label,
  dim = false,
}: {
  species: TokenmonSpecies;
  color: TokenmonColor;
  level: number;
  size: number;
  label: string;
  /** 절전/굶주림 등 — 흐리게. */
  dim?: boolean;
}) {
  const safeLevel = Math.max(1, Math.min(MAX_LEVEL, Math.round(level)));
  const info = getSpeciesInfo(species);
  const colorInfo = getColorInfo(color);
  const id = species in SPECIES_DEFS ? species : "dog";
  return (
    <span className={`tm-sprite-frame ${dim ? "dim" : ""}`} style={{ width: size, height: size }} role="img" aria-label={label}>
      {/* eslint-disable-next-line @next/next/no-img-element -- 로컬 정적 스프라이트, 최적화 불필요 */}
      <img
        src={`/species/${id}/${safeLevel}.jpg`}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        draggable={false}
        style={{ filter: colorInfo.filter }}
        title={`${info.label} · ${colorInfo.label}`}
      />
    </span>
  );
}
