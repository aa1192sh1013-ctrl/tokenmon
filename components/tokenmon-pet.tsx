"use client";

import { useEffect, useState, type ReactNode } from "react";
import { formatTokenCount, formatUsd, type TokenmonMood, type TokenmonPet, type TokenmonStage } from "@/lib/tokenmon";
import { GOLD, getSpeciesInfo, gridFor, paletteFor, type Palette } from "./tokenmon-species";

const STAGE_LABEL: Record<TokenmonStage, string> = { egg: "알", baby: "아기", pet: "어른", dragon: "황금킹" };

const SAY_LINES: Record<TokenmonMood, string[]> = {
  happy: ["냠냠! 오늘도 잘 먹었다!", "바이브 코딩 가보자고!"],
  content: ["다음 끼니 기다리는 중…", "평화로운 코딩 라이프"],
  sleeping: ["쿨쿨…"],
  starving: ["배고파… 시들고 있어요"],
};

type EyeStyle = "open" | "half" | "closed";

function eyeRect(x: number, y: number, eye: EyeStyle, fill: string) {
  if (eye === "closed") return <rect key={`e${x}-${y}`} x={x} y={y + 0.4} width={1} height={0.25} fill={fill} />;
  if (eye === "half") return <rect key={`e${x}-${y}`} x={x} y={y + 0.45} width={1} height={0.55} fill={fill} />;
  return (
    <g key={`e${x}-${y}`}>
      <rect x={x} y={y} width={1} height={1} fill={fill} />
      <rect x={x + 0.55} y={y + 0.12} width={0.3} height={0.3} fill="#ffffff" opacity={0.9} />
    </g>
  );
}

const OUTLINE = "#2b2b25";
const HIGHLIGHT = "rgba(255,255,255,0.22)";
const SHADOW = "rgba(0,0,0,0.14)";
/* 명암을 입히는 몸통 계열 문자 — 부품(D·E·K·T)은 제외 */
const SHADE_CHARS = new Set(["B", "L", "O", "Y", "P", "M", "W", "S"]);

function Sparkle({ cx, cy, size }: { cx: number; cy: number; size: number }) {
  const arm = size / 2;
  const thick = size / 3.4;
  return (
    <>
      <rect x={cx - thick / 2} y={cy - arm} width={thick} height={size} fill={GOLD} />
      <rect x={cx - arm} y={cy - thick / 2} width={size} height={thick} fill={GOLD} />
    </>
  );
}

const SPARKLE_SPOTS: [number, number, number][] = [
  [1.2, 1.4, 1.5],
  [11, 6, 1.1],
  [10.6, 1.6, 1],
  [0.8, 8.8, 1],
  [6, 11.3, 0.9],
  [11.3, 10.4, 0.9],
];

/** 레벨 장비 사다리 — 레벨이 오를 때마다 눈에 띄는 장식이 하나씩 누적된다. */
function levelGear(level: number): ReactNode[] {
  const items: ReactNode[] = [];
  if (level >= 3)
    items.push(
      <g key="hearts" fill="#e87b9d">
        <rect x={1.7} y={5.85} width={0.5} height={0.5} />
        <rect x={2.25} y={5.85} width={0.5} height={0.5} />
        <rect x={1.97} y={6.3} width={0.55} height={0.55} />
        <rect x={9.3} y={5.85} width={0.5} height={0.5} />
        <rect x={9.85} y={5.85} width={0.5} height={0.5} />
        <rect x={9.57} y={6.3} width={0.55} height={0.55} />
      </g>,
    );
  if (level >= 4)
    items.push(
      <g key="antenna">
        <rect x={5.85} y={-0.7} width={0.3} height={1.1} fill="#33363e" />
        <rect x={5.55} y={-1.35} width={0.9} height={0.9} fill="#d95f5f" />
        <rect x={5.7} y={-1.2} width={0.3} height={0.3} fill="#ffffff" opacity={0.8} />
      </g>,
    );
  if (level >= 5)
    items.push(
      <g key="star" fill={GOLD}>
        <rect x={5.35} y={7.3} width={1.4} height={0.46} />
        <rect x={5.82} y={6.83} width={0.46} height={1.4} />
      </g>,
    );
  if (level >= 6)
    items.push(
      <g key="shoes">
        <rect x={2.4} y={10.5} width={2.2} height={0.85} fill="#33363e" />
        <rect x={7.4} y={10.5} width={2.2} height={0.85} fill="#33363e" />
        <rect x={2.4} y={10.5} width={2.2} height={0.28} fill="#f0f0ea" />
        <rect x={7.4} y={10.5} width={2.2} height={0.28} fill="#f0f0ea" />
      </g>,
    );
  if (level >= 7)
    items.push(
      <g key="scarf">
        <rect x={2.95} y={6.85} width={6.1} height={0.8} fill="#d95f5f" />
        <rect x={7.35} y={7.6} width={1} height={1.6} fill="#d95f5f" />
        <rect x={7.35} y={8.75} width={1} height={0.45} fill="#b34a4a" />
      </g>,
    );
  if (level >= 9)
    items.push(
      <g key="bolts">
        <rect x={0.55} y={6.1} width={0.85} height={0.85} fill="#9aa5a8" />
        <rect x={10.6} y={6.1} width={0.85} height={0.85} fill="#9aa5a8" />
        <rect x={0.8} y={6.35} width={0.35} height={0.35} fill="#6a747a" />
        <rect x={10.85} y={6.35} width={0.35} height={0.35} fill="#6a747a" />
      </g>,
    );
  if (level >= 10)
    items.push(
      <g key="led" className="tm-twinkle">
        <rect x={5.5} y={8.25} width={1} height={1} fill="#2f4a3a" />
        <rect x={5.72} y={8.47} width={0.56} height={0.56} fill="#58d08a" />
      </g>,
    );
  if (level >= 11)
    items.push(
      <g key="band">
        <rect x={2.35} y={1.55} width={7.3} height={0.8} fill="#58b0d0" />
        <rect x={5.65} y={1.45} width={1} height={1} fill={GOLD} />
      </g>,
    );
  if (level >= 12)
    items.push(
      <g key="bow" fill="#e87b9d">
        <rect x={1.45} y={0.5} width={0.95} height={0.95} />
        <rect x={2.6} y={0.5} width={0.95} height={0.95} />
        <rect x={2.2} y={1.15} width={0.7} height={0.7} fill="#d96a8c" />
      </g>,
    );
  if (level >= 13)
    items.push(
      <g key="goldstar">
        <rect x={6.5} y={7.45} width={1.7} height={0.55} fill={GOLD} />
        <rect x={7.07} y={6.88} width={0.55} height={1.7} fill={GOLD} />
        <rect x={7.07} y={7.45} width={0.55} height={0.55} fill="#c0392b" />
      </g>,
    );
  if (level >= 14)
    items.push(
      <g key="aura" className="tm-twinkle" fill={GOLD} opacity={0.85}>
        <rect x={0.5} y={0.6} width={0.6} height={0.6} />
        <rect x={11} y={0.6} width={0.6} height={0.6} />
        <rect x={0.5} y={10.8} width={0.6} height={0.6} />
        <rect x={11} y={10.8} width={0.6} height={0.6} />
      </g>,
    );
  if (level >= 20)
    items.push(
      <g key="crown">
        <rect x={4.05} y={-0.2} width={3.9} height={1} fill={GOLD} />
        <rect x={4.05} y={-1.05} width={0.95} height={0.95} fill={GOLD} />
        <rect x={5.53} y={-1.2} width={0.95} height={1.1} fill={GOLD} />
        <rect x={7} y={-1.05} width={0.95} height={0.95} fill={GOLD} />
        <rect x={5.7} y={0} width={0.6} height={0.6} fill="#c0392b" />
      </g>,
    );
  return items;
}

/** 레벨마다 몸집도 조금씩 자란다. */
function spriteSize(level: number, stage: TokenmonStage): number {
  if (stage === "egg") return 50;
  return Math.round(Math.min(80, 46 + level * 1.8));
}

function SpriteSvg({
  grid,
  palette,
  eye,
  level,
  stage,
  size,
  label,
}: {
  grid: string[];
  palette: Palette;
  eye: EyeStyle;
  level: number;
  stage: TokenmonStage;
  size: number;
  label: string;
}) {
  const cells = grid.length;
  const filled = grid.map((row) => [...row].map((ch) => ch !== "."));
  const sparkles = stage === "dragon" ? Math.max(0, Math.min(SPARKLE_SPOTS.length, level - 14)) : 0;

  const outline: ReactNode[] = [];
  const body: ReactNode[] = [];
  const shade: ReactNode[] = [];
  grid.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === ".") {
        // 채워진 이웃이 있으면 바깥 잉크 아웃라인 — 게임 스프라이트 느낌의 핵심
        const near =
          (y > 0 && filled[y - 1][x]) ||
          (y < cells - 1 && filled[y + 1][x]) ||
          (x > 0 && filled[y][x - 1]) ||
          (x < row.length - 1 && filled[y][x + 1]);
        if (near) outline.push(<rect key={`o${x}-${y}`} x={x} y={y} width={1.03} height={1.03} fill={OUTLINE} />);
        return;
      }
      if (ch === "E") {
        body.push(eyeRect(x, y, eye, palette.E ?? "#20201e"));
        return;
      }
      const fill = palette[ch];
      if (!fill) return;
      body.push(<rect key={`${x}-${y}`} x={x} y={y} width={1.03} height={1.03} fill={fill} />);
      if (SHADE_CHARS.has(ch)) {
        if (y === 0 || !filled[y - 1][x]) shade.push(<rect key={`h${x}-${y}`} x={x} y={y} width={1.03} height={0.34} fill={HIGHLIGHT} />);
        else if (y === cells - 1 || !filled[y + 1][x])
          shade.push(<rect key={`s${x}-${y}`} x={x} y={y + 0.69} width={1.03} height={0.34} fill={SHADOW} />);
      }
    }),
  );

  return (
    <svg
      viewBox={`0 0 ${cells} ${cells}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      role="img"
      aria-label={label}
      style={{ overflow: "visible" }}
    >
      <ellipse cx={6} cy={11.72} rx={3.7} ry={0.45} fill="#20201e" opacity={0.1} />
      {stage === "dragon" && (
        <g className="tm-aura">
          <circle cx={6} cy={6.2} r={6.6} fill={GOLD} opacity={0.1} />
          <circle cx={6} cy={6.2} r={5.1} fill={GOLD} opacity={0.08} />
        </g>
      )}
      {stage === "dragon" && (
        <g>
          <polygon points="3.4,2.8 8.6,2.8 11.2,10.9 0.8,10.9" fill="#a53434" />
          <polygon points="4.2,2.8 7.8,2.8 9.6,10.4 2.4,10.4" fill="#b74040" />
          <rect x={0.8} y={10.35} width={10.4} height={0.58} fill={GOLD} />
        </g>
      )}
      {outline}
      {body}
      {shade}
      {stage !== "egg" && levelGear(level)}
      {sparkles > 0 && (
        <g className="tm-twinkle">
          {SPARKLE_SPOTS.slice(0, sparkles).map(([cx, cy, s], index) => (
            <Sparkle key={`sp${index}`} cx={cx} cy={cy} size={s} />
          ))}
        </g>
      )}
    </svg>
  );
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
        <SpriteSvg
          grid={gridFor(species, stage, pet.levelProgressPct)}
          palette={paletteFor(species, stage)}
          eye={eye}
          level={pet.level}
          stage={stage}
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
