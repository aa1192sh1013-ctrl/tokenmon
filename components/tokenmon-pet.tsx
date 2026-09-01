"use client";

import { useEffect, useState } from "react";
import type { TokenmonMood, TokenmonStage } from "@/lib/tokenmon";

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

const MINION_GRID = [".DDDD.", "DBBBBD", "DEBBED", "DBBBBD", ".DBBD.", "......"];

const EGG_PALETTE: Palette = { B: "#f0e7d4", S: "#d8c8a2", D: "#b8a87e", C: "#8f8060" };
const BODY_PALETTE: Palette = {
  B: "#4c8272",
  D: "#2f5347",
  L: "#cfe6da",
  K: "#d9a0a0",
  A: "#178a5e",
  W: "#c8cfc9",
  T: "#26332e",
  G: "#58b088",
  E: "#20201e",
};
const DRAGON_PALETTE: Palette = { ...BODY_PALETTE, B: "#3c7a5e", Y: "#d9a55a", G: "#275c4a", A: "#b3701f" };

const SPRITES: Record<TokenmonStage, { grid: string[]; palette: Palette }> = {
  egg: { grid: EGG_GRID, palette: EGG_PALETTE },
  baby: { grid: BABY_GRID, palette: BODY_PALETTE },
  pet: { grid: PET_GRID, palette: BODY_PALETTE },
  dragon: { grid: DRAGON_GRID, palette: DRAGON_PALETTE },
};

const STAGE_LABEL: Record<TokenmonStage, string> = { egg: "알", baby: "아기 클로드", pet: "코딩 펫", dragon: "용가리" };
const STAGE_LEVEL: Record<TokenmonStage, number> = { egg: 1, baby: 2, pet: 3, dragon: 4 };

const SAY_LINES: Record<TokenmonMood, string[]> = {
  happy: ["오늘도 바이브 코딩 가보자고!", "토큰 냠냠, 순항 중이에요"],
  content: ["다음 작업을 기다리는 중…", "오늘도 평화로운 코딩 라이프"],
  sleepy: ["5시간 한도가 차오르고 있어요… 하암", "슬슬 졸린데… 쉬엄쉬엄 해요"],
  exhausted: ["한도가 거의 다 찼어요… 녹초예요", "리셋까지 조금만 버텨요…"],
  sleeping: ["한도 리셋을 기다리며 쿨쿨…"],
  hungry: ["요즘 코딩을 안 하셨네요… 배고파요", "토큰 한 입만 주세요…"],
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

export function TokenmonPet({
  stage,
  mood,
  xp,
  nextStageXp,
  stageProgressPct,
  activeSessionCount,
}: {
  stage: TokenmonStage;
  mood: TokenmonMood;
  xp: number;
  nextStageXp: number | null;
  stageProgressPct: number;
  activeSessionCount: number;
}) {
  const [blinking, setBlinking] = useState(false);
  const [sayIndex, setSayIndex] = useState(0);

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

  const sprite = stage === "egg" && stageProgressPct >= 60 ? { grid: EGG_CRACKED_GRID, palette: EGG_PALETTE } : SPRITES[stage];
  const eye: EyeStyle = mood === "sleeping" ? "closed" : blinking ? "closed" : mood === "sleepy" || mood === "exhausted" ? "half" : "open";
  const lines = SAY_LINES[mood];
  const say = stage === "egg" ? "…(알 속에서 꼬물꼬물)" : lines[sayIndex % lines.length];
  const minionCount = Math.max(0, activeSessionCount - 1);
  const label = `토큰몬 — ${STAGE_LABEL[stage]}, 상태: ${mood}`;

  return (
    <div className="tm-pet-col">
      <div className={`tm-sprite-wrap ${mood === "sleeping" ? "tm-breathe" : "tm-bob"}`}>
        <SpriteSvg grid={sprite.grid} palette={sprite.palette} eye={eye} mood={mood} size={104} label={label} />
        {mood === "sleeping" && (
          <span className="tm-zzz" aria-hidden>
            💤
          </span>
        )}
      </div>
      <div className="tm-name">
        토큰몬 <span className="tm-stage">Lv.{STAGE_LEVEL[stage]} {STAGE_LABEL[stage]}</span>
      </div>
      <p className="tm-say">{say}</p>
      <div className="tm-xp">
        <div className="tm-xp-track">
          <div className="tm-xp-fill" style={{ width: `${stageProgressPct}%` }} />
        </div>
        <p className="tm-xp-label">
          {nextStageXp === null ? `최종 진화 · XP ${xp.toLocaleString("ko-KR")}` : `다음 진화까지 ${stageProgressPct}% · XP ${xp.toLocaleString("ko-KR")}/${nextStageXp.toLocaleString("ko-KR")}`}
        </p>
      </div>
      {minionCount > 0 && (
        <div className="tm-minions" title="동시에 열려 있는 Claude Code 창">
          {Array.from({ length: Math.min(minionCount, 3) }, (_, index) => (
            <svg key={index} viewBox="0 0 6 6" width={18} height={18} shapeRendering="crispEdges" aria-hidden>
              {MINION_GRID.map((row, y) =>
                [...row].map((ch, x) => {
                  if (ch === ".") return null;
                  const fill = ch === "E" ? "#20201e" : ch === "D" ? "#2f5347" : "#4c8272";
                  return <rect key={`${x}-${y}`} x={x} y={y} width={1.03} height={1.03} fill={fill} />;
                }),
              )}
            </svg>
          ))}
          <span>동시 작업 창 {activeSessionCount}개</span>
        </div>
      )}
    </div>
  );
}
