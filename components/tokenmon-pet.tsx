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
  if (eye === "closed") return <rect key={`${x}-${y}`} x={x} y={y + 0.4} width={1} height={0.25} fill={fill} />;
  if (eye === "half") return <rect key={`${x}-${y}`} x={x} y={y + 0.45} width={1} height={0.55} fill={fill} />;
  return <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />;
}

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
  [1.3, 1.2, 1.5],
  [11, 6.2, 1.1],
  [10.6, 1.8, 1],
  [0.9, 8.8, 1],
  [6, 11.2, 0.9],
  [11.2, 10.6, 0.9],
];

/** 레벨 장비 사다리 — 레벨이 오를 때마다 장식이 하나씩 누적된다. */
function levelGear(level: number): ReactNode[] {
  const items: ReactNode[] = [];
  if (level >= 3)
    items.push(
      <rect key="c1" x={2.2} y={6.15} width={0.55} height={0.55} fill="#e88ab0" />,
      <rect key="c2" x={9.25} y={6.15} width={0.55} height={0.55} fill="#e88ab0" />,
    );
  if (level >= 4) items.push(<rect key="ant" x={5.7} y={0.05} width={0.6} height={0.6} fill="#d95f5f" />);
  if (level >= 5)
    items.push(
      <rect key="s1" x={5.55} y={7.25} width={0.9} height={0.32} fill={GOLD} />,
      <rect key="s2" x={5.84} y={6.96} width={0.32} height={0.9} fill={GOLD} />,
    );
  if (level >= 6)
    items.push(
      <rect key="sh1" x={2.7} y={10.7} width={1.7} height={0.55} fill="#33363e" />,
      <rect key="sh2" x={7.6} y={10.7} width={1.7} height={0.55} fill="#33363e" />,
    );
  if (level >= 7) items.push(<rect key="scarf" x={3.1} y={7.05} width={5.8} height={0.55} fill="#d95f5f" opacity={0.85} />);
  if (level >= 9)
    items.push(
      <rect key="b1" x={0.85} y={6.35} width={0.55} height={0.55} fill="#9aa5a8" />,
      <rect key="b2" x={10.6} y={6.35} width={0.55} height={0.55} fill="#9aa5a8" />,
    );
  if (level >= 10) items.push(<rect key="led" x={5.75} y={8.5} width={0.5} height={0.5} fill="#58d08a" />);
  if (level >= 11) items.push(<rect key="band" x={2.6} y={1.75} width={6.8} height={0.5} fill="#58b0d0" opacity={0.9} />);
  if (level >= 12)
    items.push(
      <rect key="bw1" x={1.95} y={0.95} width={0.6} height={0.6} fill="#e88ab0" />,
      <rect key="bw2" x={2.75} y={0.95} width={0.6} height={0.6} fill="#e88ab0" />,
      <rect key="bw3" x={2.4} y={1.4} width={0.5} height={0.5} fill="#d96a8c" />,
    );
  if (level >= 13)
    items.push(
      <rect key="g1" x={6.7} y={7.55} width={1.1} height={0.36} fill={GOLD} />,
      <rect key="g2" x={7.07} y={7.18} width={0.36} height={1.1} fill={GOLD} />,
    );
  if (level >= 14)
    items.push(
      ...[
        [0.7, 0.7],
        [11, 0.7],
        [0.7, 10.9],
        [11, 10.9],
      ].map(([x, y], index) => <rect key={`au${index}`} x={x} y={y} width={0.45} height={0.45} fill={GOLD} opacity={0.7} />),
    );
  if (level >= 20)
    items.push(
      <rect key="cr0" x={4.3} y={0.75} width={3.4} height={0.7} fill={GOLD} />,
      <rect key="cr1" x={4.3} y={0.1} width={0.75} height={0.75} fill={GOLD} />,
      <rect key="cr2" x={5.63} y={0.1} width={0.75} height={0.75} fill={GOLD} />,
      <rect key="cr3" x={6.95} y={0.1} width={0.75} height={0.75} fill={GOLD} />,
    );
  return items;
}

/** 레벨마다 몸집도 조금씩 자란다. */
function spriteSize(level: number, stage: TokenmonStage): number {
  if (stage === "egg") return 46;
  return Math.round(Math.min(74, 44 + level * 1.5));
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
  const sparkles = stage === "dragon" ? Math.max(0, Math.min(SPARKLE_SPOTS.length, level - 14)) : 0;
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
      {stage !== "egg" && levelGear(level)}
      {SPARKLE_SPOTS.slice(0, sparkles).map(([cx, cy, s], index) => (
        <Sparkle key={`sp${index}`} cx={cx} cy={cy} size={s} />
      ))}
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

  return (
    <div className={`tm-pet-card ${pet.active ? "" : "inactive"} ${mood === "starving" ? "starving" : ""}`}>
      {pet.active && <span className="tm-awake" title="지금 열려 있는 세션" />}
      {info.rare && <span className="tm-rare">✨RARE</span>}
      <div className={`tm-sprite-wrap ${mood === "sleeping" || mood === "starving" ? "tm-breathe" : "tm-bob"}`}>
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
