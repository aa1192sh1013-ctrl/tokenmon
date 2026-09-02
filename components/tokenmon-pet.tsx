"use client";

import { useEffect, useState } from "react";
import { formatTokenCount, formatUsd, type TokenmonMood, type TokenmonPet } from "@/lib/tokenmon";
import { getSpeciesInfo } from "./tokenmon-species";
import { PetSprite } from "./tokenmon-sprite";

const SAY_LINES: Record<TokenmonMood, string[]> = {
  happy: ["시스템 전탄 가동!", "오늘도 순항 중."],
  content: ["대기 모드… 다음 임무 기다림.", "에너지 안정적."],
  sleeping: ["절전 모드…"],
  starving: ["연료 부족… 시들고 있어요"],
};

/** 레벨마다 몸집이 조금씩 자란다. */
function spriteSize(level: number): number {
  return Math.round(Math.min(104, 62 + level * 2.1));
}

/* ---------- 프로젝트 캐릭터 카드 ---------- */

export function TokenmonPetCard({ pet }: { pet: TokenmonPet }) {
  const [sayIndex, setSayIndex] = useState(0);
  const { projectName, species, color, mood } = pet;
  const isBaby = pet.level <= 1;

  useEffect(() => {
    const rotate = () => setSayIndex(Math.floor(Date.now() / 60_000));
    rotate();
    const timer = setInterval(rotate, 60_000);
    return () => clearInterval(timer);
  }, []);

  const info = getSpeciesInfo(species);
  const lines = SAY_LINES[mood];
  const line = lines[sayIndex % lines.length];
  const say =
    mood === "starving"
      ? `🥀 굶주림 XP -${pet.hungerPct}% — 돌아오면 회복돼요`
      : !pet.active
        ? "절전 모드…"
        : isBaby
          ? `${info.cry} (이제 막 부팅됨)`
          : mood === "happy" || mood === "content"
            ? `${info.cry} ${line}`
            : line;
  const label = `${info.label} — Lv.${pet.level}, ${projectName}`;
  const anim =
    mood === "sleeping" || mood === "starving" ? "tm-breathe" : isBaby ? "tm-wobble" : mood === "happy" ? "tm-hop" : "tm-bob";

  return (
    <div className={`tm-pet-card ${pet.active ? "" : "inactive"} ${mood === "starving" ? "starving" : ""}`}>
      {pet.active && <span className="tm-awake" title="지금 열려 있는 세션" />}
      {info.rare && <span className="tm-rare">✨RARE</span>}
      <div className={`tm-sprite-wrap ${anim}`}>
        <PetSprite
          species={species}
          color={color}
          level={pet.level}
          size={spriteSize(pet.level)}
          label={label}
          dim={mood === "sleeping"}
        />
        {mood === "sleeping" && (
          <span className="tm-zzz" aria-hidden>
            💤
          </span>
        )}
        {mood === "starving" && (
          <span className="tm-wilt" aria-hidden>
            🥀
          </span>
        )}
      </div>
      <div className="tm-name">
        {info.label} <span className="tm-stage">Lv.{pet.level}</span>
        {pet.maxLevel && <span className="tm-max">👑MAX</span>}
      </div>
      <p className="tm-card-sub">
        {projectName} · 세션 {pet.sessionCount}회
      </p>
      <div className="tm-xp">
        <div className="tm-xp-track">
          <div className="tm-xp-fill" style={{ width: `${pet.levelProgressPct}%` }} />
        </div>
        <p className="tm-xp-label">
          {pet.nextLevelXp === null
            ? `만렙 · XP ${formatTokenCount(pet.xp)}`
            : `XP ${formatTokenCount(pet.xp)}/${formatTokenCount(pet.nextLevelXp)}`}
        </p>
      </div>
      <p className="tm-card-stats">
        출력 {formatTokenCount(pet.outputTokens)}
        {pet.costUsd > 0 ? ` · ${formatUsd(pet.costUsd)}` : ""}
      </p>
      <p className="tm-say">{say}</p>
    </div>
  );
}
