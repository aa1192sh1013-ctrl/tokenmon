"use client";

import { useEffect, useState } from "react";
import { formatTokenCount, formatUsd, type TokenmonMood, type TokenmonPet, type TokenmonStage } from "@/lib/tokenmon";
import { getSpeciesInfo } from "./tokenmon-species";
import { PetVector, type EyeStyle } from "./tokenmon-vector";

const STAGE_LABEL: Record<TokenmonStage, string> = { egg: "알", baby: "아기", pet: "어른", dragon: "황금킹" };

const SAY_LINES: Record<TokenmonMood, string[]> = {
  happy: ["냠냠! 오늘도 잘 먹었다!", "바이브 코딩 가보자고!"],
  content: ["다음 끼니 기다리는 중…", "평화로운 코딩 라이프"],
  sleeping: ["쿨쿨…"],
  starving: ["배고파… 시들고 있어요"],
};

/** 레벨마다 몸집도 조금씩 자란다. */
function spriteSize(level: number, stage: TokenmonStage): number {
  if (stage === "egg") return 54;
  return Math.round(Math.min(88, 52 + level * 1.8));
}

/* ---------- 프로젝트 캐릭터 카드 ---------- */

export function TokenmonPetCard({ pet }: { pet: TokenmonPet }) {
  const [blinking, setBlinking] = useState(false);
  const [sayIndex, setSayIndex] = useState(0);
  const { projectName, species, stage, mood } = pet;

  useEffect(() => {
    if (mood === "sleeping") return;
    let closeTimer: ReturnType<typeof setTimeout> | undefined;
    const timer = setInterval(() => {
      setBlinking(true);
      closeTimer = setTimeout(() => setBlinking(false), 180);
    }, 3800);
    return () => {
      clearInterval(timer);
      if (closeTimer) clearTimeout(closeTimer);
    };
  }, [mood]);

  useEffect(() => {
    const rotate = () => setSayIndex(Math.floor(Date.now() / 60_000));
    rotate();
    const timer = setInterval(rotate, 60_000);
    return () => clearInterval(timer);
  }, []);

  const info = getSpeciesInfo(species);
  const eye: EyeStyle = mood === "sleeping" ? "closed" : blinking ? "closed" : mood === "starving" ? "half" : "open";
  const mouth = mood === "starving" ? "frown" : mood === "sleeping" ? "flat" : "smile";
  const lines = SAY_LINES[mood];
  const line = lines[sayIndex % lines.length];
  const say =
    mood === "starving"
      ? `🥀 굶주림 XP -${pet.hungerPct}% — 돌아오면 회복돼요`
      : !pet.active
        ? "쿨쿨…"
        : stage === "egg"
          ? "…(알 속에서 꼬물꼬물)"
          : mood === "happy" || mood === "content"
            ? `${info.cry} ${line}`
            : line;
  const label = `${info.label} — Lv.${pet.level} ${STAGE_LABEL[stage]}, ${projectName}`;
  const anim =
    mood === "sleeping" || mood === "starving" ? "tm-breathe" : stage === "egg" ? "tm-wobble" : mood === "happy" ? "tm-hop" : "tm-bob";

  return (
    <div className={`tm-pet-card ${pet.active ? "" : "inactive"} ${mood === "starving" ? "starving" : ""}`}>
      {pet.active && <span className="tm-awake" title="지금 열려 있는 세션" />}
      {info.rare && <span className="tm-rare">✨RARE</span>}
      <div className={`tm-sprite-wrap ${anim}`}>
        <PetVector
          shape={info.shape}
          colors={info.colors}
          hint={info.hint}
          stage={stage}
          level={pet.level}
          eye={eye}
          mouth={mouth}
          levelProgressPct={pet.levelProgressPct}
          size={spriteSize(pet.level, stage)}
          label={label}
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
        {info.label}{" "}
        <span className="tm-stage">
          Lv.{pet.level} {STAGE_LABEL[stage]}
        </span>
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
        출력 {formatTokenCount(pet.outputTokens)} · {formatUsd(pet.costUsd)}
      </p>
      <p className="tm-say">{say}</p>
    </div>
  );
}
