"use client";

import { useEffect, useState } from "react";
import { formatTokenCount, formatUsd, type TokenmonMood, type TokenmonPet, type TokenmonSpecies, type TokenmonStage } from "@/lib/tokenmon";

/* ---------- 도트 스프라이트 (12×12, '.'은 투명) ---------- */

type Palette = Record<string, string>;

const EGG_GRID = [
  "....DDDD....",
  "...DBBBBD...",
  "..DBBSBBBD..",
  ".DBSBBBBSBD.",
  ".DBBBBSBBBD.",
  ".DBSBBBBBBD.",
  ".DBBBBBBSBD.",
  ".DBBSBBBBBD.",
  "..DBBBBBBD..",
  "...DBBBBD...",
  "....DDDD....",
  "............",
];

/* 부화가 가까워지면(단계 진행 60% 이상) 금이 간 알을 보여준다. */
const EGG_CRACKED_GRID = [
  "....DDDD....",
  "...DBCBBD...",
  "..DBBCBBBD..",
  ".DBSBCBBSBD.",
  ".DBBBBSBBBD.",
  ".DBSBBBBBBD.",
  ".DBBBBBBSBD.",
  ".DBBSBBBBBD.",
  "..DBBBBBBD..",
  "...DBBBBD...",
  "....DDDD....",
  "............",
];

const BABY_GRID = [
  ".....AA.....",
  "......A.....",
  "...DDDDDD...",
  "..DBBBBBBD..",
  ".DBBBBBBBBD.",
  ".DBEBBBBEBD.",
  ".DBBBBBBBBD.",
  ".DKBBLLBBKD.",
  "..DBLLLLBD..",
  "..DBBBBBBD..",
  "...DDDDDD...",
  "..DD....DD..",
];

const PET_GRID = [
  "..D......D..",
  ".DBD....DBD.",
  ".DBBDDDDBBD.",
  ".DBBBBBBBBD.",
  ".DBEBBBBEBD.",
  ".DBBBBBBBBD.",
  ".DKBBBBBBKD.",
  ".DBBBBBBBBD.",
  "..DWWWWWWD..",
  "..DWTGTGWD..",
  ".DDDDDDDDDD.",
  "............",
];

const DRAGON_GRID = [
  "..A......A..",
  ".DAD....DAD.",
  ".DBBDDDDBBD.",
  "DBBBBBBBBBBD",
  "DBEBBBBBBEBD",
  ".DBBBBBBBBD.",
  "GGDBYYYYBDGG",
  ".GDBYYYYBDG.",
  "..DBYYYYBD..",
  "..DBBBBBBD..",
  "..DD.DD.DD..",
  "............",
];

/* ---------- 종족 — 세션 ID 해시로 결정되는 5종 ---------- */

const SPECIES_INFO: Record<TokenmonSpecies, { label: string; body: Palette }> = {
  sprout: { label: "새싹몬", body: { B: "#4c8272", D: "#2f5347", L: "#cfe6da", A: "#178a5e" } },
  ocean: { label: "바다몬", body: { B: "#4a7d9c", D: "#2e5166", L: "#d3e5ef", A: "#2e6f96" } },
  star: { label: "별몬", body: { B: "#7a6fa8", D: "#4f4477", L: "#e2ddf0", A: "#6a5a9e" } },
  sunset: { label: "노을몬", body: { B: "#b07840", D: "#7a4e22", L: "#f0e0cc", A: "#a06a2a" } },
  blossom: { label: "벚꽃몬", body: { B: "#b06a7e", D: "#7d4353", L: "#f0dde3", A: "#a25a70" } },
};

const COMMON: Palette = { K: "#d9a0a0", E: "#20201e", W: "#c8cfc9", T: "#26332e" };

function paletteFor(species: TokenmonSpecies, stage: TokenmonStage): Palette {
  const sp = SPECIES_INFO[species].body;
  if (stage === "egg") return { B: "#f0e7d4", S: sp.B, D: "#b8a87e", C: "#8f8060" }; // 껍질 반점이 종족색 — 뭐가 나올지 힌트
  if (stage === "dragon") return { ...COMMON, ...sp, Y: "#d9a55a", G: sp.D, A: "#b3701f" };
  return { ...COMMON, ...sp, G: sp.A };
}

function gridFor(stage: TokenmonStage, stageProgressPct: number): string[] {
  if (stage === "egg") return stageProgressPct >= 60 ? EGG_CRACKED_GRID : EGG_GRID;
  if (stage === "baby") return BABY_GRID;
  if (stage === "pet") return PET_GRID;
  return DRAGON_GRID;
}

const STAGE_LABEL: Record<TokenmonStage, string> = { egg: "알", baby: "아기", pet: "펫", dragon: "용가리" };
const STAGE_LEVEL: Record<TokenmonStage, number> = { egg: 1, baby: 2, pet: 3, dragon: 4 };

const SAY_LINES: Record<TokenmonMood, string[]> = {
  happy: ["바이브 코딩 가보자고!", "토큰 냠냠, 순항 중"],
  content: ["다음 작업 기다리는 중…", "평화로운 코딩 라이프"],
  sleepy: ["한도가 차오르고 있어… 하암", "슬슬 졸린데…"],
  exhausted: ["한도가 거의 다 찼어… 녹초야", "리셋까지 조금만…"],
  sleeping: ["쿨쿨…"],
};

type EyeStyle = "open" | "half" | "closed";

function eyeRect(x: number, y: number, eye: EyeStyle, fill: string) {
  if (eye === "closed") return <rect key={`${x}-${y}`} x={x} y={y + 0.4} width={1} height={0.25} fill={fill} />;
  if (eye === "half") return <rect key={`${x}-${y}`} x={x} y={y + 0.45} width={1} height={0.55} fill={fill} />;
  return <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />;
}

function SpriteSvg({
  grid,
  palette,
  eye,
  mood,
  size,
  label,
}: {
  grid: string[];
  palette: Palette;
  eye: EyeStyle;
  mood: TokenmonMood;
  size: number;
  label: string;
}) {
  const cells = grid.length;
  return (
    <svg viewBox={`0 0 ${cells} ${cells}`} width={size} height={size} shapeRendering="crispEdges" role="img" aria-label={label}>
      {grid.map((row, y) =>
        [...row].map((ch, x) => {
          if (ch === ".") return null;
          if (ch === "E") return eyeRect(x, y, eye, palette.E ?? "#20201e");
          const fill = palette[ch];
          return fill ? <rect key={`${x}-${y}`} x={x} y={y} width={1.03} height={1.03} fill={fill} /> : null;
        }),
      )}
      {mood === "exhausted" && (
        <>
          <circle cx={10.35} cy={2.1} r={0.42} fill="#8fb3d6" />
          <circle cx={10.95} cy={3} r={0.28} fill="#8fb3d6" />
        </>
      )}
    </svg>
  );
}

/* ---------- 세션 캐릭터 카드 ---------- */

export function TokenmonPetCard({ pet }: { pet: TokenmonPet }) {
  const [blinking, setBlinking] = useState(false);
  const [sayIndex, setSayIndex] = useState(0);
  const { session, species, stage, mood } = pet;

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

  const info = SPECIES_INFO[species];
  const eye: EyeStyle = mood === "sleeping" ? "closed" : blinking ? "closed" : mood === "sleepy" || mood === "exhausted" ? "half" : "open";
  const lines = SAY_LINES[mood];
  const say = !pet.active ? "쿨쿨… (지난 세션)" : stage === "egg" ? "…(알 속에서 꼬물꼬물)" : lines[sayIndex % lines.length];
  const label = `${info.label} — ${STAGE_LABEL[stage]}, ${session.projectName} 세션`;

  return (
    <div className={`tm-pet-card ${pet.active ? "" : "inactive"}`}>
      {pet.active && <span className="tm-awake" title="지금 열려 있는 세션" />}
      <div className={`tm-sprite-wrap ${mood === "sleeping" ? "tm-breathe" : "tm-bob"}`}>
        <SpriteSvg grid={gridFor(stage, pet.stageProgressPct)} palette={paletteFor(species, stage)} eye={eye} mood={mood} size={68} label={label} />
        {mood === "sleeping" && (
          <span className="tm-zzz" aria-hidden>
            💤
          </span>
        )}
      </div>
      <div className="tm-name">
        {info.label} <span className="tm-stage">Lv.{STAGE_LEVEL[stage]} {STAGE_LABEL[stage]}</span>
      </div>
      <p className="tm-card-sub">{session.projectName}</p>
      <div className="tm-xp">
        <div className="tm-xp-track">
          <div className="tm-xp-fill" style={{ width: `${pet.stageProgressPct}%` }} />
        </div>
        <p className="tm-xp-label">
          {pet.nextStageXp === null
            ? `최종 진화 · XP ${pet.xp.toLocaleString("ko-KR")}`
            : `XP ${pet.xp.toLocaleString("ko-KR")}/${pet.nextStageXp.toLocaleString("ko-KR")}`}
        </p>
      </div>
      <p className="tm-card-stats">
        출력 {formatTokenCount(session.outputTokens)} · {formatUsd(session.costUsd)}
      </p>
      <p className="tm-say">{say}</p>
    </div>
  );
}
