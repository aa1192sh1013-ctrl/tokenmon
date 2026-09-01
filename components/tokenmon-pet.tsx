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

/* 꽥꽥봇 — 고무오리 + 안테나·태엽 키·배 화면 */
const DUCK_BABY = [
  ".....A......",
  ".....D......",
  "...DDDDDD...",
  "..DBBBBBBD..",
  ".DBEBBBBEBD.",
  ".DBOOOOOOBD.",
  ".DBBOOOOBBD.",
  ".DKBBBBBBKD.",
  ".DBBLLLLBBD.",
  "..DBBBBBBD..",
  "..DDDDDDDD..",
  "..OO....OO..",
];
const DUCK_ADULT = [
  ".....A......",
  ".....D......",
  "...DDDDDD...",
  "..DBBBBBBD..",
  ".DBEBBBBEBD.",
  ".DBOOOOOOBD.",
  "WDBBOOOOBBD.",
  "WDBBLLLLBBD.",
  ".DBLTGGTLBD.",
  ".DBBLLLLBBD.",
  "..DDDDDDDD..",
  "..OO....OO..",
];

/* 냥냥봇 — 스틸 고양이 + 수염·가슴 화면 */
const CAT_BABY = [
  "..D......D..",
  ".DPD....DPD.",
  ".DBBDDDDBBD.",
  ".DBBBBBBBBD.",
  ".DBEBBBBEBD.",
  ".DBBBTTBBBD.",
  ".DKBBBBBBKD.",
  ".DBBLLLLBBD.",
  "..DBBBBBBD..",
  "...DDDDDD...",
  "..DD....DD..",
  "............",
];
const CAT_ADULT = [
  "..D......D..",
  ".DPD....DPD.",
  ".DBBDDDDBBD.",
  ".DBBBBBBBBD.",
  ".DBEBBBBEBD.",
  "WDBBBTTBBBDW",
  "WDKBBBBBBKDW",
  ".DBLTGGTLBD.",
  ".DBBLLLLBBD.",
  "..DBBBBBBD..",
  ".DDDDDDDDDD.",
  "..DD....DD..",
];

/* 펭펭봇 — 네이비 펭귄 + 배 LED·플리퍼 */
const PENGUIN_BABY = [
  "....DDDD....",
  "...DBBBBD...",
  "..DBBBBBBD..",
  ".DBELLLLEBD.",
  ".DBLLOOLLBD.",
  ".DBBLLLLBBD.",
  ".DBLLLLLLBD.",
  ".DBLLLLLLBD.",
  "..DBLLLLBD..",
  "..DDDDDDDD..",
  "..OO....OO..",
  "............",
];
const PENGUIN_ADULT = [
  "....DDDD....",
  "...DBBBBD...",
  "..DBBBBBBD..",
  ".DBELLLLEBD.",
  ".DBLLOOLLBD.",
  "BDBBLLLLBBDB",
  "BDBLLGGLLBDB",
  ".DBLLLLLLBD.",
  "..DBLLLLBD..",
  "..DDDDDDDD..",
  "..OO....OO..",
  "............",
];

/* 깡총봇 — 분홍 토끼 + 한쪽 귀 안테나 볼 */
const BUNNY_BABY = [
  "..DD....DD..",
  "..DPD..DPD..",
  "..DPD..DPD..",
  "..DDDDDDDD..",
  ".DBBBBBBBBD.",
  ".DBEBBBBEBD.",
  ".DBBBTTBBBD.",
  ".DKBBBBBBKD.",
  ".DBBLLLLBBD.",
  "..DBBBBBBD..",
  "...DDDDDD...",
  "..DD....DD..",
];
const BUNNY_ADULT = [
  "..AA....DD..",
  "..DPD..DPD..",
  "..DPD..DPD..",
  "..DDDDDDDD..",
  ".DBBBBBBBBD.",
  ".DBEBBBBEBD.",
  ".DBBBTTBBBD.",
  ".DKBBBBBBKD.",
  ".DBLTGGTLBD.",
  ".DBBLLLLBBD.",
  "..DDDDDDDD..",
  ".DDD....DDD.",
];

/* 개굴봇 — 장난감 개구리 + 눈 사이 안테나·배 화면 */
const FROG_BABY = [
  ".DDD....DDD.",
  ".DED....DED.",
  ".DBBBBBBBBD.",
  ".DBBBBBBBBD.",
  ".DKBBBBBBKD.",
  ".DBDDDDDDBD.",
  ".DBLLLLLLBD.",
  ".DBLLLLLLBD.",
  "..DBLLLLBD..",
  "..DDDDDDDD..",
  "..DD....DD..",
  "............",
];
const FROG_ADULT = [
  ".DDD.AA.DDD.",
  ".DED.DD.DED.",
  ".DBBBBBBBBD.",
  ".DBBBBBBBBD.",
  ".DKBBBBBBKD.",
  ".DBDDDDDDBD.",
  ".DBLLLLLLBD.",
  ".DBLTGGTLBD.",
  ".DBLLLLLLBD.",
  "..DDDDDDDD..",
  ".DDD....DDD.",
  "............",
];

/* 공룡봇 (레어) — 등가시 티라노 + 이빨·LED 배 */
const DINO_BABY = [
  "..A..AA..A..",
  "..DDDDDDDD..",
  ".DBBBBBBBBD.",
  ".DBEBBBBEBD.",
  ".DBBBWWBBBD.",
  ".DKBBBBBBKD.",
  ".DBBLLLLBBD.",
  "..DBBBBBBD..",
  "..DDDDDDDD..",
  ".DDD....DDD.",
  "............",
  "............",
];
const DINO_ADULT = [
  "..A..AA..A..",
  "..DDDDDDDD..",
  ".DBBBBBBBBD.",
  ".DBEBBBBEBD.",
  ".DBBBWWBBBD.",
  ".DKBBBBBBKD.",
  "DDBBLLLLBBDD",
  ".DBLLLLLLBD.",
  ".DBLLGGLLBD.",
  "..DBBBBBBD..",
  "..DDDDDDDD..",
  ".DDD....DDD.",
];

/* 유니뿅 (레어) — 뿔 + 옆갈기 유니콘 */
const UNICORN_BABY = [
  ".....A......",
  "..MDDDDDD...",
  ".MDBBBBBBD..",
  ".MDBEBBEBD..",
  "..DBBBBBBD..",
  ".DKBBBBBBKD.",
  ".DBBLLLLBBD.",
  "..DBBBBBBD..",
  "...DDDDDD...",
  "..DD....DD..",
  "............",
  "............",
];
const UNICORN_ADULT = [
  ".....A......",
  ".....A......",
  "..MDDDDDD...",
  ".MDBBBBBBD..",
  ".MDBEBBEBD..",
  "..DBBBBBBD..",
  ".DBBBTTBBBD.",
  ".DKBBBBBBKD.",
  ".DBBLLLLBBD.",
  "..DBBBBBBD..",
  "...DDDDDD...",
  "..DD....DD..",
];

/* 용용봇 (레어) — 뿔·송곳니·날개 아기용 */
const DRAGONET_BABY = [
  "..A......A..",
  ".DAD....DAD.",
  ".DBBDDDDBBD.",
  ".DBBBBBBBBD.",
  ".DBEBBBBEBD.",
  ".DBBWBBWBBD.",
  ".DKBBBBBBKD.",
  ".DBLYYYYLBD.",
  "..DBBBBBBD..",
  "..DD....DD..",
  "............",
  "............",
];
const DRAGONET_ADULT = [
  "..A......A..",
  ".DAD....DAD.",
  ".DBBDDDDBBD.",
  ".DBBBBBBBBD.",
  ".DBEBBBBEBD.",
  ".DBBWBBWBBD.",
  "GDKBBBBBBKDG",
  "GDBLYYYYLBDG",
  ".DBLYYYYLBD.",
  "..DBBBBBBD..",
  "..DD.DD.DD..",
  "............",
];

/* ---------- 종족 — 세션 ID 해시로 결정 (흔한 5종 + 레어 3종) ---------- */

interface SpeciesDef {
  label: string;
  cry: string;
  baby: string[];
  adult: string[];
  colors: Palette;
  /** 알 반점 색 — 몸색이 너무 연한 종족용 힌트 색. */
  hint?: string;
  rare?: boolean;
}

const SPECIES_INFO: Record<TokenmonSpecies, SpeciesDef> = {
  sunset: {
    label: "꽥꽥봇",
    cry: "꽥!",
    baby: DUCK_BABY,
    adult: DUCK_ADULT,
    colors: { B: "#e3bd4a", D: "#96762a", L: "#f7ecc8", O: "#d97b2f", A: "#d95f5f" },
  },
  star: {
    label: "냥냥봇",
    cry: "냥!",
    baby: CAT_BABY,
    adult: CAT_ADULT,
    colors: { B: "#8a93a8", D: "#545c70", L: "#e8ebf2", P: "#e8b7c5", T: "#3a3f4a", A: "#d95f5f" },
  },
  ocean: {
    label: "펭펭봇",
    cry: "펭!",
    baby: PENGUIN_BABY,
    adult: PENGUIN_ADULT,
    colors: { B: "#46536e", D: "#2c3548", L: "#f0f3f0", O: "#d97b2f", A: "#d95f5f" },
  },
  blossom: {
    label: "깡총봇",
    cry: "깡총!",
    baby: BUNNY_BABY,
    adult: BUNNY_ADULT,
    colors: { B: "#d9a8b5", D: "#9c6a79", L: "#f7e6ec", P: "#f2d3dc", T: "#6e4a55", A: "#58b0d0" },
  },
  sprout: {
    label: "개굴봇",
    cry: "개굴!",
    baby: FROG_BABY,
    adult: FROG_ADULT,
    colors: { B: "#7fae5e", D: "#4f7038", L: "#e9f2d8", A: "#d95f5f" },
  },
  dino: {
    label: "공룡봇",
    cry: "쿠앙!",
    rare: true,
    baby: DINO_BABY,
    adult: DINO_ADULT,
    colors: { B: "#4f9e8a", D: "#2f6355", L: "#d8ede5", A: "#d97b2f" },
  },
  unicorn: {
    label: "유니뿅",
    cry: "뿅!",
    rare: true,
    baby: UNICORN_BABY,
    adult: UNICORN_ADULT,
    hint: "#e88ab0",
    colors: { B: "#eef0f4", D: "#8a90a5", L: "#fce8ef", M: "#e88ab0", T: "#b58aa5", A: "#dfae3c" },
  },
  dragonet: {
    label: "용용봇",
    cry: "크앙!",
    rare: true,
    baby: DRAGONET_BABY,
    adult: DRAGONET_ADULT,
    colors: { B: "#c56a5a", D: "#7e4238", L: "#f2ded8", Y: "#e8c078", G: "#8a4a3e", A: "#dfae3c" },
  },
};

/* 공통 부품색 — 리벳(K)·태엽/수염(W)·화면(T)·LED(G) */
const COMMON: Palette = { E: "#20201e", K: "#9aa5a8", W: "#d5d9d5", T: "#26332e", G: "#58d08a" };
const GOLD = "#dfae3c";

function paletteFor(species: TokenmonSpecies, stage: TokenmonStage): Palette {
  const info = SPECIES_INFO[species];
  if (stage === "egg") return { B: "#f0e7d4", S: info.hint ?? info.colors.B, D: "#b8a87e", C: "#8f8060" }; // 껍질 반점이 종족색 — 뭐가 나올지 힌트
  const base = { ...COMMON, ...info.colors };
  if (stage === "dragon") return { ...base, A: GOLD, G: GOLD, K: GOLD }; // 황금킹 — 금장 트림
  return base;
}

function gridFor(species: TokenmonSpecies, stage: TokenmonStage, stageProgressPct: number): string[] {
  if (stage === "egg") return stageProgressPct >= 60 ? EGG_CRACKED_GRID : EGG_GRID;
  if (stage === "baby") return SPECIES_INFO[species].baby;
  return SPECIES_INFO[species].adult; // 어른·황금킹은 같은 몸, 황금킹은 금장+반짝이
}

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

function SpriteSvg({
  grid,
  palette,
  eye,
  golden,
  size,
  label,
}: {
  grid: string[];
  palette: Palette;
  eye: EyeStyle;
  golden: boolean;
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
      {golden && (
        <>
          <Sparkle cx={1.3} cy={1.2} size={1.5} />
          <Sparkle cx={11} cy={6.2} size={1.1} />
        </>
      )}
    </svg>
  );
}

/* ---------- 세션 캐릭터 카드 ---------- */

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

  const info = SPECIES_INFO[species];
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
          golden={stage === "dragon"}
          size={68}
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
