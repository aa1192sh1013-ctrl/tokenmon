"use client";

import { useId, type ReactNode } from "react";
import type { TokenmonColor, TokenmonSpecies } from "@/lib/tokenmon";
import { GOLD, TECH, getColorInfo, getSpeciesInfo, type BodyKind } from "./tokenmon-species";

/**
 * 메카-동물 벡터 렌더러. 좌표계 100×100, 바닥 y≈92.
 * 모든 캐릭터는 동물 실루엣 + 로봇 공통 레이어(코어 플레이트·판넬 심선·숄더 볼트·
 * 글로우 눈)를 가지며, 종별 파츠 레시피(tokenmon-species.ts)로 형태가 달라진다.
 * 단계 구분 없이 Lv.1은 알, Lv.2~20은 몸집 성장 + 장비 누적.
 */

export type EyeStyle = "open" | "half" | "closed";

const INK = "#262a30";
const METAL = "#b3b9c3";
const METAL_DARK = "#868d99";

function mix(hex: string, target: string, t: number): string {
  const a = hex.replace("#", "");
  const b = target.replace("#", "");
  const ch = (i: number) => {
    const from = parseInt(a.slice(i, i + 2), 16);
    const to = parseInt(b.slice(i, i + 2), 16);
    return Math.round(from + (to - from) * t)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${ch(0)}${ch(2)}${ch(4)}`;
}
const lighten = (hex: string, t: number) => mix(hex, "#ffffff", t);
const darken = (hex: string, t: number) => mix(hex, "#000000", t);

const S = { stroke: INK, strokeWidth: 2.2, strokeLinejoin: "round" } as const;

interface Geom {
  cy: number;
  rx: number;
  ry: number;
  top: number;
  eyeY: number;
  eyeDx: number;
  eyeR: number;
  mouthY: number;
  plateCy: number;
  plateW: number;
  feet: boolean;
}

const GEOMS: Record<BodyKind, Geom> = {
  round: { cy: 56, rx: 27, ry: 29, top: 27, eyeY: 47, eyeDx: 10.5, eyeR: 5.4, mouthY: 58, plateCy: 69, plateW: 24, feet: true },
  wide: { cy: 60, rx: 33, ry: 21, top: 39, eyeY: 55, eyeDx: 12, eyeR: 5, mouthY: 65, plateCy: 71, plateW: 26, feet: true },
  fish: { cy: 56, rx: 30, ry: 24, top: 32, eyeY: 50, eyeDx: 11, eyeR: 5.2, mouthY: 61, plateCy: 69, plateW: 24, feet: false },
  neck: { cy: 75, rx: 25, ry: 16, top: 12, eyeY: 22, eyeDx: 5.2, eyeR: 3.5, mouthY: 28.5, plateCy: 76, plateW: 20, feet: true },
  snake: { cy: 74, rx: 26, ry: 15, top: 37, eyeY: 46, eyeDx: 6, eyeR: 3.9, mouthY: 52, plateCy: 72, plateW: 18, feet: false },
  jelly: { cy: 52, rx: 26, ry: 22, top: 30, eyeY: 49, eyeDx: 10, eyeR: 5, mouthY: 58, plateCy: 60, plateW: 20, feet: false },
};

/* 종별 미세 조정 (눈 위치 등) */
const GEOM_TWEAKS: Record<string, Partial<Geom>> = {
  frog: { eyeY: 33, eyeDx: 11.5, eyeR: 4.6 },
  croc: { eyeY: 42 },
  owl: { eyeR: 4.8 },
  crab: { eyeDx: 10 },
};

/* 기본 입을 그리지 않는 파츠 (자기 입/부리를 가짐) */
const MOUTH_SUPPRESS = new Set([
  "beak:flat", "beak:tiny", "beak:tri", "beak:hook", "beak:hookBig", "beak:sharp", "beak:bent", "beak:tube",
  "snout:dog", "snout:muzzle", "snout:pig", "snout:cow", "snout:croc", "snout:trunk",
  "face:grin", "face:wide", "face:lips", "face:tongue",
]);

/* ---------- 눈·입 ---------- */

function Eye({ cx, cy, eye, r }: { cx: number; cy: number; eye: EyeStyle; r: number }) {
  if (eye === "closed")
    return <path d={`M ${cx - r} ${cy} Q ${cx} ${cy + r * 0.7} ${cx + r} ${cy}`} fill="none" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />;
  if (eye === "half")
    return (
      <g>
        <ellipse cx={cx} cy={cy + 0.8} rx={r} ry={r * 0.5} fill={INK} />
        <ellipse cx={cx} cy={cy + 0.8} rx={r * 0.5} ry={r * 0.26} fill={TECH} opacity={0.9} />
      </g>
    );
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={INK} />
      <circle cx={cx} cy={cy} r={r * 0.55} fill="none" stroke={TECH} strokeWidth={r * 0.32} opacity={0.95} />
      <circle cx={cx + r * 0.32} cy={cy - r * 0.36} r={r * 0.26} fill="#fff" opacity={0.95} />
    </g>
  );
}

function Mouth({ cx, cy, mood }: { cx: number; cy: number; mood: "smile" | "flat" | "frown" }) {
  const d =
    mood === "smile"
      ? `M ${cx - 4.5} ${cy} Q ${cx} ${cy + 4} ${cx + 5.5} ${cy - 1}`
      : mood === "frown"
        ? `M ${cx - 4.5} ${cy + 2.5} Q ${cx} ${cy - 1.5} ${cx + 4.5} ${cy + 2.5}`
        : `M ${cx - 4} ${cy + 1} L ${cx + 4} ${cy + 1}`;
  return <path d={d} fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />;
}

function star4(cx: number, cy: number, r: number): string {
  return `M ${cx} ${cy - r} Q ${cx} ${cy} ${cx + r} ${cy} Q ${cx} ${cy} ${cx} ${cy + r} Q ${cx} ${cy} ${cx - r} ${cy} Q ${cx} ${cy} ${cx} ${cy - r} Z`;
}

/* ---------- 파츠 라이브러리 ---------- */

interface Ctx {
  g: Geom;
  base: string;
  dark: string;
  light: string;
  fill: string; // 몸 그라데이션 참조
}

function renderPart(family: string, kind: string, c: Ctx): { behind?: ReactNode; front?: ReactNode } {
  const { g, base, dark, light, fill } = c;
  const key = `${family}:${kind}`;
  const L = 50 - g.rx;
  const R = 50 + g.rx;

  switch (key) {
    /* ---- 귀 ---- */
    case "ear:floppy":
      return {
        behind: (
          <>
            <ellipse cx={L + 6} cy={g.top + 7} rx={6.5} ry={11.5} fill={fill} {...S} transform={`rotate(26 ${L + 6} ${g.top + 7})`} />
            <ellipse cx={R - 6} cy={g.top + 7} rx={6.5} ry={11.5} fill={fill} {...S} transform={`rotate(-26 ${R - 6} ${g.top + 7})`} />
          </>
        ),
      };
    case "ear:pointy":
      return {
        behind: (
          <>
            <path d={`M ${L + 3} ${g.top + 9} L ${L - 1} ${g.top - 8} L ${L + 16} ${g.top + 2} Z`} fill={fill} {...S} />
            <path d={`M ${R - 3} ${g.top + 9} L ${R + 1} ${g.top - 8} L ${R - 16} ${g.top + 2} Z`} fill={fill} {...S} />
            <path d={`M ${L + 5} ${g.top + 5} L ${L + 3} ${g.top - 3} L ${L + 11} ${g.top + 2} Z`} fill={dark} stroke="none" />
            <path d={`M ${R - 5} ${g.top + 5} L ${R - 3} ${g.top - 3} L ${R - 11} ${g.top + 2} Z`} fill={dark} stroke="none" />
          </>
        ),
      };
    case "ear:tall":
      return {
        behind: (
          <>
            <path d={`M ${L + 4} ${g.top + 8} L ${L + 1} ${g.top - 15} L ${L + 17} ${g.top + 1} Z`} fill={fill} {...S} />
            <path d={`M ${R - 4} ${g.top + 8} L ${R - 1} ${g.top - 15} L ${R - 17} ${g.top + 1} Z`} fill={fill} {...S} />
          </>
        ),
      };
    case "ear:round":
      return {
        behind: (
          <>
            <circle cx={L + 7} cy={g.top + 2} r={7.5} fill={fill} {...S} />
            <circle cx={R - 7} cy={g.top + 2} r={7.5} fill={fill} {...S} />
            <circle cx={L + 7} cy={g.top + 2} r={3.6} fill={dark} stroke="none" />
            <circle cx={R - 7} cy={g.top + 2} r={3.6} fill={dark} stroke="none" />
          </>
        ),
      };
    case "ear:big":
      return {
        behind: (
          <>
            <circle cx={L + 3} cy={g.top + 4} r={11} fill={fill} {...S} />
            <circle cx={R - 3} cy={g.top + 4} r={11} fill={fill} {...S} />
            <circle cx={L + 3} cy={g.top + 4} r={5.5} fill={dark} stroke="none" />
            <circle cx={R - 3} cy={g.top + 4} r={5.5} fill={dark} stroke="none" />
          </>
        ),
      };
    case "ear:long":
      return {
        behind: (
          <>
            <rect x={L + 8} y={g.top - 22} width={11} height={30} rx={5.5} fill={fill} {...S} transform={`rotate(-8 ${L + 13} ${g.top})`} />
            <rect x={R - 19} y={g.top - 22} width={11} height={30} rx={5.5} fill={fill} {...S} transform={`rotate(8 ${R - 13} ${g.top})`} />
            <rect x={L + 11} y={g.top - 17} width={5} height={20} rx={2.5} fill={dark} stroke="none" transform={`rotate(-8 ${L + 13} ${g.top})`} />
            <rect x={R - 16} y={g.top - 17} width={5} height={20} rx={2.5} fill={dark} stroke="none" transform={`rotate(8 ${R - 13} ${g.top})`} />
          </>
        ),
      };
    case "ear:tuft":
      return {
        behind: (
          <>
            <path d={`M ${L + 5} ${g.top + 7} L ${L + 3} ${g.top - 6} L ${L + 14} ${g.top + 2} Z`} fill={fill} {...S} />
            <path d={`M ${R - 5} ${g.top + 7} L ${R - 3} ${g.top - 6} L ${R - 14} ${g.top + 2} Z`} fill={fill} {...S} />
            <path d={`M ${L + 4} ${g.top - 4} q -2 -4 1 -7 M ${R - 4} ${g.top - 4} q 2 -4 -1 -7`} fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" />
          </>
        ),
      };
    case "ear:huge":
      return {
        behind: (
          <>
            <ellipse cx={L - 3} cy={g.cy - 12} rx={12} ry={15} fill={fill} {...S} />
            <ellipse cx={R + 3} cy={g.cy - 12} rx={12} ry={15} fill={fill} {...S} />
            <ellipse cx={L - 3} cy={g.cy - 12} rx={6.5} ry={9} fill={dark} stroke="none" />
            <ellipse cx={R + 3} cy={g.cy - 12} rx={6.5} ry={9} fill={dark} stroke="none" />
          </>
        ),
      };
    case "ear:side":
      return {
        behind: (
          <>
            <circle cx={L + 1} cy={g.eyeY + 2} r={7} fill={fill} {...S} />
            <circle cx={R - 1} cy={g.eyeY + 2} r={7} fill={fill} {...S} />
          </>
        ),
      };
    case "ear:tufts":
      return {
        behind: (
          <>
            <path d={`M ${L + 6} ${g.top + 6} L ${L + 2} ${g.top - 7} L ${L + 14} ${g.top + 1} Z`} fill={fill} {...S} />
            <path d={`M ${R - 6} ${g.top + 6} L ${R - 2} ${g.top - 7} L ${R - 14} ${g.top + 1} Z`} fill={fill} {...S} />
          </>
        ),
      };
    case "ear:stalks":
      return {
        behind: (
          <>
            <line x1={42} y1={g.top + 3} x2={38} y2={g.top - 9} stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
            <line x1={58} y1={g.top + 3} x2={62} y2={g.top - 9} stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
            <circle cx={38} cy={g.top - 11} r={3.4} fill={TECH} stroke={INK} strokeWidth={1.8} />
            <circle cx={62} cy={g.top - 11} r={3.4} fill={TECH} stroke={INK} strokeWidth={1.8} />
          </>
        ),
      };
    /* ---- 부리 ---- */
    case "beak:flat":
      return {
        front: (
          <>
            <ellipse cx={50} cy={g.mouthY - 1} rx={9} ry={4.6} fill="#d98a3a" {...S} />
            <ellipse cx={50} cy={g.mouthY + 2.4} rx={6} ry={2.8} fill="#b56d24" {...S} />
          </>
        ),
      };
    case "beak:tiny":
      return { front: <path d={`M 46.5 ${g.mouthY - 4} L 53.5 ${g.mouthY - 4} L 50 ${g.mouthY + 1.5} Z`} fill="#d98a3a" {...S} /> };
    case "beak:tri":
      return { front: <path d={`M 45.5 ${g.mouthY - 4} L 54.5 ${g.mouthY - 4} L 50 ${g.mouthY + 3} Z`} fill="#d98a3a" {...S} /> };
    case "beak:hook":
      return { front: <path d={`M 45 ${g.mouthY - 6} Q 56 ${g.mouthY - 8} 55 ${g.mouthY} Q 54 ${g.mouthY + 5} 49 ${g.mouthY + 2} Q 52 ${g.mouthY - 1} 45 ${g.mouthY - 2} Z`} fill="#c8872f" {...S} /> };
    case "beak:hookBig":
      return { front: <path d={`M 42 ${g.mouthY - 8} Q 60 ${g.mouthY - 11} 58 ${g.mouthY + 1} Q 56 ${g.mouthY + 9} 48 ${g.mouthY + 4} Q 53 ${g.mouthY} 42 ${g.mouthY - 1} Z`} fill="#c8872f" {...S} /> };
    case "beak:sharp":
      return { front: <path d={`M 44 ${g.mouthY - 5} L 62 ${g.mouthY - 1} L 44 ${g.mouthY + 3} Z`} fill="#c8872f" {...S} /> };
    case "beak:bent":
      return {
        front: (
          <>
            <path d={`M 45 ${g.mouthY - 4} Q 57 ${g.mouthY - 5} 57 ${g.mouthY + 4} Q 57 ${g.mouthY + 9} 52 ${g.mouthY + 9} L 51 ${g.mouthY + 2} Q 48 ${g.mouthY} 45 ${g.mouthY} Z`} fill="#e8a0a8" {...S} />
            <path d={`M 52 ${g.mouthY + 4} L 57 ${g.mouthY + 4} Q 57 ${g.mouthY + 9} 52 ${g.mouthY + 9} Z`} fill={INK} stroke="none" />
          </>
        ),
      };
    case "beak:tube":
      return { front: <rect x={50} y={g.mouthY - 4.5} width={13} height={6} rx={3} fill={darken(base, 0.12)} {...S} /> };
    /* ---- 주둥이·코 ---- */
    case "snout:dog":
      return {
        front: (
          <>
            <ellipse cx={50} cy={g.mouthY} rx={8.5} ry={6} fill={light} {...S} />
            <ellipse cx={50} cy={g.mouthY - 3} rx={3.2} ry={2.4} fill={INK} />
            <path d={`M 50 ${g.mouthY - 1} L 50 ${g.mouthY + 2} M 50 ${g.mouthY + 2} Q 47 ${g.mouthY + 4.5} 45 ${g.mouthY + 2.5} M 50 ${g.mouthY + 2} Q 53 ${g.mouthY + 4.5} 55 ${g.mouthY + 2.5}`} fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />
          </>
        ),
      };
    case "snout:muzzle":
      return {
        front: (
          <>
            <ellipse cx={50} cy={g.mouthY} rx={7.5} ry={5.2} fill={light} {...S} />
            <ellipse cx={50} cy={g.mouthY - 2.6} rx={2.8} ry={2} fill={INK} />
          </>
        ),
      };
    case "snout:tri":
      return { front: <path d={`M 47.5 ${g.mouthY - 4.5} L 52.5 ${g.mouthY - 4.5} L 50 ${g.mouthY - 1.5} Z`} fill={INK} stroke="none" /> };
    case "snout:nose":
      return { front: <ellipse cx={50} cy={g.mouthY - 3} rx={4.2} ry={3.2} fill={INK} /> };
    case "snout:pig":
      return {
        front: (
          <>
            <ellipse cx={50} cy={g.mouthY - 1.5} rx={8} ry={5.8} fill={lighten(base, 0.25)} {...S} />
            <ellipse cx={46.8} cy={g.mouthY - 1.5} rx={1.6} ry={2.4} fill={darken(base, 0.4)} />
            <ellipse cx={53.2} cy={g.mouthY - 1.5} rx={1.6} ry={2.4} fill={darken(base, 0.4)} />
          </>
        ),
      };
    case "snout:cow":
      return {
        front: (
          <>
            <ellipse cx={50} cy={g.mouthY} rx={10} ry={5.6} fill={light} {...S} />
            <ellipse cx={45.5} cy={g.mouthY} rx={1.8} ry={2.4} fill={darken(base, 0.35)} />
            <ellipse cx={54.5} cy={g.mouthY} rx={1.8} ry={2.4} fill={darken(base, 0.35)} />
          </>
        ),
      };
    case "snout:croc":
      return {
        front: (
          <>
            <rect x={38} y={g.mouthY - 5} width={24} height={10.5} rx={5} fill={fill} {...S} />
            <path d={`M 40 ${g.mouthY + 5.5} l 3 -3.4 l 3 3.4 l 3 -3.4 l 3 3.4 l 3 -3.4 l 3 3.4 l 2.5 -3.4`} fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={43} cy={g.mouthY - 2.6} r={1.4} fill={INK} />
            <circle cx={57} cy={g.mouthY - 2.6} r={1.4} fill={INK} />
          </>
        ),
      };
    case "snout:trunk":
      return {
        front: (
          <path d={`M 45.5 ${g.mouthY - 6} Q 44 ${g.mouthY + 8} 52 ${g.mouthY + 12} Q 58 ${g.mouthY + 14} 58 ${g.mouthY + 9} Q 54 ${g.mouthY + 8} 53 ${g.mouthY + 4} Q 52 ${g.mouthY - 2} 54.5 ${g.mouthY - 6} Z`} fill={fill} {...S} />
        ),
      };
    /* ---- 뿔 ---- */
    case "horns:small":
      return {
        behind: (
          <>
            <path d={`M ${L + 8} ${g.top + 4} q -4 -7 1 -10 q 3 4 3 9 Z`} fill="#e8e2d2" {...S} />
            <path d={`M ${R - 8} ${g.top + 4} q 4 -7 -1 -10 q -3 4 -3 9 Z`} fill="#e8e2d2" {...S} />
          </>
        ),
      };
    case "horns:back":
      return {
        behind: (
          <>
            <path d={`M ${L + 10} ${g.top + 3} Q ${L + 2} ${g.top - 10} ${L + 12} ${g.top - 14} Q ${L + 14} ${g.top - 4} ${L + 16} ${g.top + 1} Z`} fill="#d8d2c2" {...S} />
            <path d={`M ${R - 10} ${g.top + 3} Q ${R - 2} ${g.top - 10} ${R - 12} ${g.top - 14} Q ${R - 14} ${g.top - 4} ${R - 16} ${g.top + 1} Z`} fill="#d8d2c2" {...S} />
          </>
        ),
      };
    case "horns:curved":
      return {
        behind: (
          <>
            <path d={`M 39 ${g.top + 3} Q 33 ${g.top - 9} 26 ${g.top - 7} Q 32 ${g.top - 2} 36 ${g.top + 6} Z`} fill={GOLD} {...S} />
            <path d={`M 61 ${g.top + 3} Q 67 ${g.top - 9} 74 ${g.top - 7} Q 68 ${g.top - 2} 64 ${g.top + 6} Z`} fill={GOLD} {...S} />
          </>
        ),
      };
    case "horns:three":
      return {
        behind: (
          <>
            <path d={`M 39 ${g.top + 6} L 34 ${g.top - 9} L 44 ${g.top + 1} Z`} fill="#eee7d8" {...S} />
            <path d={`M 61 ${g.top + 6} L 66 ${g.top - 9} L 56 ${g.top + 1} Z`} fill="#eee7d8" {...S} />
            <path d={`M 47 ${g.eyeY - 6} L 50 ${g.eyeY - 14} L 53 ${g.eyeY - 6} Z`} fill="#eee7d8" {...S} />
          </>
        ),
      };
    case "horns:spiral":
      return {
        behind: (
          <>
            <path d={`M 46.5 ${g.top + 2} L 50 ${g.top - 17} L 53.5 ${g.top + 2} Z`} fill={GOLD} {...S} />
            <path d={`M 47.6 ${g.top - 3} L 52.4 ${g.top - 5} M 48.4 ${g.top - 8} L 51.6 ${g.top - 9.5}`} stroke={darken(GOLD, 0.3)} strokeWidth={1.6} />
          </>
        ),
      };
    case "horns:antler":
      return {
        behind: (
          <g fill="none" stroke="#9c8862" strokeWidth={3.2} strokeLinecap="round">
            <path d={`M ${L + 10} ${g.top + 2} Q ${L + 4} ${g.top - 12} ${L + 10} ${g.top - 18} M ${L + 6} ${g.top - 8} L ${L - 1} ${g.top - 13}`} />
            <path d={`M ${R - 10} ${g.top + 2} Q ${R - 4} ${g.top - 12} ${R - 10} ${g.top - 18} M ${R - 6} ${g.top - 8} L ${R + 1} ${g.top - 13}`} />
          </g>
        ),
      };
    /* ---- 갈기·털 ---- */
    case "mane:ruff":
      return {
        behind: (
          <g>
            {Array.from({ length: 10 }, (_, i) => {
              const a = (i / 10) * Math.PI * 2;
              const cx = 50 + Math.cos(a) * (g.rx + 2);
              const cyy = g.eyeY + 2 + Math.sin(a) * (g.rx + 2) * 0.82;
              return <path key={i} d={`M ${cx} ${cyy} L ${50 + Math.cos(a) * (g.rx + 13)} ${g.eyeY + 2 + Math.sin(a) * (g.rx + 13) * 0.82} L ${50 + Math.cos(a + 0.33) * (g.rx + 2)} ${g.eyeY + 2 + Math.sin(a + 0.33) * (g.rx + 2) * 0.82} Z`} fill={darken(base, 0.28)} {...S} />;
            })}
          </g>
        ),
      };
    case "mane:top":
      return {
        behind: (
          <path d={`M 40 ${g.top + 4} Q 42 ${g.top - 8} 50 ${g.top - 9} Q 58 ${g.top - 8} 60 ${g.top + 4} Q 50 ${g.top - 2} 40 ${g.top + 4} Z`} fill={darken(base, 0.3)} {...S} />
        ),
      };
    case "mane:flow":
      return {
        behind: (
          <>
            <path d={`M ${L + 8} ${g.top + 2} Q ${L - 8} ${g.top + 10} ${L - 2} ${g.top + 28} Q ${L + 8} ${g.top + 20} ${L + 10} ${g.top + 8} Z`} fill="#e88ab0" {...S} />
            <path d={`M ${L + 12} ${g.top - 2} Q ${L + 2} ${g.top + 8} ${L + 8} ${g.top + 20}`} fill="none" stroke={darken("#e88ab0", 0.2)} strokeWidth={2} strokeLinecap="round" />
          </>
        ),
      };
    case "mane:wool":
      return {
        behind: (
          <g fill="#f2f0ea" {...S}>
            {[-14, -5, 4, 13].map((dx, i) => (
              <circle key={i} cx={50 + dx} cy={g.top + 2 - (i % 2 === 1 ? 4 : 0)} r={7.5} />
            ))}
          </g>
        ),
      };
    case "mane:beard":
      return { front: <path d={`M 46 ${g.mouthY + 4} Q 50 ${g.mouthY + 13} 54 ${g.mouthY + 4} Z`} fill="#f2f0ea" {...S} /> };
    /* ---- 볏·크레스트 ---- */
    case "crest:three":
      return {
        behind: (
          <g fill="none" stroke={INK} strokeWidth={2.4} strokeLinecap="round">
            {[-6, 0, 6].map((dx, i) => (
              <path key={i} d={`M ${50 + dx} ${g.top + 2} Q ${50 + dx - 2} ${g.top - 8 - (i === 1 ? 4 : 0)} ${50 + dx + 3} ${g.top - 6 - (i === 1 ? 4 : 0)}`} />
            ))}
          </g>
        ),
      };
    case "crest:tall":
      return {
        behind: (
          <>
            <path d={`M 44 ${g.top + 3} Q 40 ${g.top - 14} 50 ${g.top - 16} Q 60 ${g.top - 14} 56 ${g.top + 3} Z`} fill={darken(base, 0.2)} {...S} />
            <path d={`M 47 ${g.top + 1} Q 46 ${g.top - 9} 50 ${g.top - 11}`} fill="none" stroke={INK} strokeWidth={1.6} opacity={0.5} />
          </>
        ),
      };
    case "crest:tuft":
      return {
        behind: (
          <g fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round">
            <path d={`M 45 ${g.top + 2} q -3 -7 2 -9 M 51 ${g.top} q 0 -8 5 -8 M 55 ${g.top + 2} q 4 -5 8 -3`} />
          </g>
        ),
      };
    case "crest:curl":
      return { behind: <path d={`M 47 ${g.top} Q 50 ${g.top - 9} 57 ${g.top - 5}`} fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" /> };
    case "crest:pins":
      return {
        behind: (
          <g>
            {[-7, 0, 7].map((dx, i) => (
              <g key={i}>
                <line x1={50 + dx * 0.5} y1={g.top + 2} x2={50 + dx} y2={g.top - 10} stroke={INK} strokeWidth={1.8} />
                <circle cx={50 + dx} cy={g.top - 11.5} r={2.6} fill={TECH} stroke={INK} strokeWidth={1.6} />
              </g>
            ))}
          </g>
        ),
      };
    case "crest:flame":
      return {
        behind: (
          <g>
            {[-8, 0, 8].map((dx, i) => (
              <path key={i} d={`M ${50 + dx - 3} ${g.top + 3} Q ${50 + dx - 4} ${g.top - 9 - (i === 1 ? 5 : 0)} ${50 + dx + 1} ${g.top - 12 - (i === 1 ? 5 : 0)} Q ${50 + dx + 4} ${g.top - 5} ${50 + dx + 3} ${g.top + 3} Z`} fill={i === 1 ? GOLD : "#d96a3c"} {...S} />
            ))}
          </g>
        ),
      };
    case "crest:back":
      return { behind: <path d={`M 50 ${g.top + 2} Q 64 ${g.top - 10} 72 ${g.top - 4} Q 62 ${g.top} 53 ${g.top + 6} Z`} fill={darken(base, 0.2)} {...S} /> };
    case "crest:ridge":
      return {
        behind: (
          <g fill={darken(base, 0.22)} {...S}>
            {[-8, 0, 8].map((dx, i) => (
              <path key={i} d={`M ${50 + dx - 4} ${g.top + 3} Q ${50 + dx} ${g.top - 6} ${50 + dx + 4} ${g.top + 3} Z`} />
            ))}
          </g>
        ),
      };
    /* ---- 날개·팔 ---- */
    case "wings:small":
      return {
        behind: (
          <>
            <ellipse cx={L + 2} cy={g.cy + 2} rx={6.5} ry={11} fill={darken(base, 0.12)} {...S} transform={`rotate(16 ${L + 2} ${g.cy})`} />
            <ellipse cx={R - 2} cy={g.cy + 2} rx={6.5} ry={11} fill={darken(base, 0.12)} {...S} transform={`rotate(-16 ${R - 2} ${g.cy})`} />
          </>
        ),
      };
    case "wings:side":
      return {
        behind: (
          <>
            <path d={`M ${L + 4} ${g.cy - 8} Q ${L - 10} ${g.cy} ${L + 2} ${g.cy + 16} Q ${L + 8} ${g.cy + 8} ${L + 8} ${g.cy - 4} Z`} fill={darken(base, 0.18)} {...S} />
            <path d={`M ${R - 4} ${g.cy - 8} Q ${R + 10} ${g.cy} ${R - 2} ${g.cy + 16} Q ${R - 8} ${g.cy + 8} ${R - 8} ${g.cy - 4} Z`} fill={darken(base, 0.18)} {...S} />
          </>
        ),
      };
    case "wings:flippers":
      return {
        behind: (
          <>
            <ellipse cx={L} cy={g.cy + 5} rx={6} ry={13} fill={fill} {...S} transform={`rotate(20 ${L} ${g.cy + 5})`} />
            <ellipse cx={R} cy={g.cy + 5} rx={6} ry={13} fill={fill} {...S} transform={`rotate(-20 ${R} ${g.cy + 5})`} />
          </>
        ),
      };
    case "wings:bat":
    case "wings:batBig": {
      const w = kind === "batBig" ? 1.35 : 1;
      return {
        behind: (
          <>
            <path d={`M ${L + 6} ${g.cy - 10} Q ${L - 20 * w} ${g.cy - 18 * w} ${L - 16 * w} ${g.cy + 12} L ${L - 6 * w} ${g.cy + 6} L ${L + 2} ${g.cy + 12} Z`} fill={darken(base, 0.3)} {...S} />
            <path d={`M ${R - 6} ${g.cy - 10} Q ${R + 20 * w} ${g.cy - 18 * w} ${R + 16 * w} ${g.cy + 12} L ${R + 6 * w} ${g.cy + 6} L ${R - 2} ${g.cy + 12} Z`} fill={darken(base, 0.3)} {...S} />
          </>
        ),
      };
    }
    case "wings:ptera":
      return {
        behind: (
          <>
            <path d={`M ${L + 6} ${g.cy - 6} Q ${L - 24} ${g.cy - 22} ${L - 18} ${g.cy + 16} Q ${L - 4} ${g.cy + 8} ${L + 6} ${g.cy + 4} Z`} fill={darken(base, 0.18)} {...S} />
            <path d={`M ${R - 6} ${g.cy - 6} Q ${R + 24} ${g.cy - 22} ${R + 18} ${g.cy + 16} Q ${R + 4} ${g.cy + 8} ${R - 6} ${g.cy + 4} Z`} fill={darken(base, 0.18)} {...S} />
          </>
        ),
      };
    case "wings:flame":
      return {
        behind: (
          <>
            <path d={`M ${L + 4} ${g.cy - 4} Q ${L - 16} ${g.cy - 14} ${L - 10} ${g.cy + 14} Q ${L - 2} ${g.cy + 8} ${L + 6} ${g.cy + 4} Z`} fill="#d96a3c" {...S} />
            <path d={`M ${R - 4} ${g.cy - 4} Q ${R + 16} ${g.cy - 14} ${R + 10} ${g.cy + 14} Q ${R + 2} ${g.cy + 8} ${R - 6} ${g.cy + 4} Z`} fill="#d96a3c" {...S} />
            <path d={`M ${L - 6} ${g.cy - 2} Q ${L - 10} ${g.cy + 2} ${L - 7} ${g.cy + 8} M ${R + 6} ${g.cy - 2} Q ${R + 10} ${g.cy + 2} ${R + 7} ${g.cy + 8}`} fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round" />
          </>
        ),
      };
    case "wings:feather":
      return {
        behind: (
          <>
            {[0, 1, 2].map((i) => (
              <ellipse key={i} cx={L - 4 - i * 4} cy={g.cy - 4 + i * 6} rx={12 - i * 2} ry={5.5 - i * 0.8} fill="#f4f5f8" {...S} transform={`rotate(${-24 - i * 14} ${L - 4 - i * 4} ${g.cy - 4 + i * 6})`} />
            ))}
            {[0, 1, 2].map((i) => (
              <ellipse key={`r${i}`} cx={R + 4 + i * 4} cy={g.cy - 4 + i * 6} rx={12 - i * 2} ry={5.5 - i * 0.8} fill="#f4f5f8" {...S} transform={`rotate(${24 + i * 14} ${R + 4 + i * 4} ${g.cy - 4 + i * 6})`} />
            ))}
          </>
        ),
      };
    case "wings:flat":
      return {
        behind: (
          <>
            <path d={`M ${L + 8} ${g.cy - 8} Q ${L - 16} ${g.cy} ${L + 6} ${g.cy + 10} Z`} fill={fill} {...S} />
            <path d={`M ${R - 8} ${g.cy - 8} Q ${R + 16} ${g.cy} ${R - 6} ${g.cy + 10} Z`} fill={fill} {...S} />
          </>
        ),
      };
    case "wings:flowfins":
      return {
        behind: (
          <>
            <path d={`M ${L + 4} ${g.cy} Q ${L - 12} ${g.cy - 6} ${L - 8} ${g.cy + 12} Q ${L} ${g.cy + 8} ${L + 5} ${g.cy + 6} Z`} fill={lighten(base, 0.2)} {...S} />
            <path d={`M ${R - 4} ${g.cy} Q ${R + 12} ${g.cy - 6} ${R + 8} ${g.cy + 12} Q ${R} ${g.cy + 8} ${R - 5} ${g.cy + 6} Z`} fill={lighten(base, 0.2)} {...S} />
          </>
        ),
      };
    case "wings:claws":
      return {
        behind: (
          <>
            <path d={`M ${L + 4} ${g.cy - 2} Q ${L - 12} ${g.cy - 14} ${L - 8} ${g.top - 4} Q ${L - 16} ${g.top + 2} ${L - 13} ${g.top - 12} Q ${L - 2} ${g.top - 14} ${L + 2} ${g.top - 2} Z`} fill={fill} {...S} />
            <path d={`M ${R - 4} ${g.cy - 2} Q ${R + 12} ${g.cy - 14} ${R + 8} ${g.top - 4} Q ${R + 16} ${g.top + 2} ${R + 13} ${g.top - 12} Q ${R + 2} ${g.top - 14} ${R - 2} ${g.top - 2} Z`} fill={fill} {...S} />
          </>
        ),
      };
    case "wings:tinyArms":
      return {
        front: (
          <>
            <path d={`M ${L + 7} ${g.cy + 2} q -6 3 -4 8`} fill="none" stroke={INK} strokeWidth={4.4} strokeLinecap="round" />
            <path d={`M ${R - 7} ${g.cy + 2} q 6 3 4 8`} fill="none" stroke={INK} strokeWidth={4.4} strokeLinecap="round" />
          </>
        ),
      };
    /* ---- 꼬리 ---- */
    case "tail:bushy":
      return { behind: <ellipse cx={R + 6} cy={g.cy - 8} rx={8} ry={17} fill={darken(base, 0.15)} {...S} transform={`rotate(18 ${R + 6} ${g.cy - 8})`} /> };
    case "tail:fox":
      return {
        behind: (
          <>
            <ellipse cx={R + 7} cy={g.cy + 6} rx={7.5} ry={15} fill={fill} {...S} transform={`rotate(24 ${R + 7} ${g.cy + 6})`} />
            <ellipse cx={R + 12} cy={g.cy - 5} rx={4} ry={6} fill="#f4f5f8" stroke="none" transform={`rotate(24 ${R + 12} ${g.cy - 5})`} />
          </>
        ),
      };
    case "tail:nine":
      return {
        behind: (
          <g>
            {[-2, -1, 0, 1, 2].map((i) => (
              <g key={i} transform={`rotate(${i * 24} 50 ${g.cy + g.ry - 4})`}>
                <ellipse cx={50} cy={g.cy + g.ry - 26} rx={6.5} ry={19} fill={fill} {...S} />
                <ellipse cx={50} cy={g.cy + g.ry - 39} rx={3.6} ry={6.5} fill="#f4f5f8" stroke="none" />
              </g>
            ))}
          </g>
        ),
      };
    case "tail:fluke":
      return { behind: <path d={`M 44 ${g.cy + g.ry - 2} Q 36 ${g.cy + g.ry + 12} 28 ${g.cy + g.ry + 8} Q 38 ${g.cy + g.ry + 16} 50 ${g.cy + g.ry + 10} Q 62 ${g.cy + g.ry + 16} 72 ${g.cy + g.ry + 8} Q 64 ${g.cy + g.ry + 12} 56 ${g.cy + g.ry - 2} Z`} fill={fill} {...S} /> };
    case "tail:fan":
      return {
        behind: (
          <g fill={lighten(base, 0.18)} {...S}>
            <path d={`M 46 ${g.cy + g.ry - 4} Q 34 ${g.cy + g.ry + 14} 40 ${g.cy + g.ry + 18} Q 48 ${g.cy + g.ry + 8} 50 ${g.cy + g.ry} Z`} />
            <path d={`M 54 ${g.cy + g.ry - 4} Q 66 ${g.cy + g.ry + 14} 60 ${g.cy + g.ry + 18} Q 52 ${g.cy + g.ry + 8} 50 ${g.cy + g.ry} Z`} />
          </g>
        ),
      };
    case "tail:thin":
      return { behind: <path d={`M 50 ${g.cy + g.ry - 2} Q 46 ${g.cy + g.ry + 16} 54 ${g.cy + g.ry + 22}`} fill="none" stroke={INK} strokeWidth={2.8} strokeLinecap="round" /> };
    case "tail:curl":
      return { behind: <path d={`M ${R - 2} ${g.cy + 10} Q ${R + 14} ${g.cy + 6} ${R + 10} ${g.cy - 4} Q ${R + 7} ${g.cy - 10} ${R + 2} ${g.cy - 6}`} fill="none" stroke={darken(base, 0.15)} strokeWidth={4.5} strokeLinecap="round" /> };
    case "tail:tentacles":
      return {
        behind: (
          <g fill={fill} {...S}>
            {[-18, -9, 0, 9, 18].map((dx, i) => (
              <path key={i} d={`M ${48 + dx} ${g.cy + g.ry - 8} Q ${46 + dx + (i % 2 ? 6 : -6)} ${g.cy + g.ry + 14} ${52 + dx} ${g.cy + g.ry + 16} Q ${54 + dx} ${g.cy + g.ry + 6} ${54 + dx} ${g.cy + g.ry - 8} Z`} />
            ))}
          </g>
        ),
      };
    case "tail:strips":
      return {
        behind: (
          <g fill="none" stroke={lighten(base, 0.15)} strokeWidth={3.4} strokeLinecap="round">
            {[-15, -5, 5, 15].map((dx, i) => (
              <path key={i} d={`M ${50 + dx} ${g.cy + g.ry - 6} Q ${50 + dx + (i % 2 ? 5 : -5)} ${g.cy + g.ry + 8} ${50 + dx} ${g.cy + g.ry + 18}`} />
            ))}
          </g>
        ),
      };
    /* ---- 등·배경 파츠 ---- */
    case "back:spikesCrown":
      return {
        behind: (
          <g fill={darken(base, 0.3)} {...S}>
            {[-16, -8, 0, 8, 16].map((dx, i) => (
              <path key={i} d={`M ${50 + dx - 4} ${g.top + 6} L ${50 + dx} ${g.top - 8 - (i % 2 ? 3 : 0)} L ${50 + dx + 4} ${g.top + 6} Z`} />
            ))}
          </g>
        ),
      };
    case "back:ridges":
      return {
        behind: (
          <g fill={darken(base, 0.2)} {...S}>
            {[-12, 0, 12].map((dx, i) => (
              <path key={i} d={`M ${50 + dx - 4} ${g.top + 5} Q ${50 + dx} ${g.top - 4} ${50 + dx + 4} ${g.top + 5} Z`} />
            ))}
          </g>
        ),
      };
    case "back:dorsal":
      return { behind: <path d={`M 44 ${g.top + 4} Q 48 ${g.top - 14} 60 ${g.top - 10} Q 54 ${g.top - 2} 56 ${g.top + 6} Z`} fill={fill} {...S} /> };
    case "back:spikes":
      return {
        behind: (
          <g fill={darken(base, 0.25)} {...S}>
            {[-11, 0, 11].map((dx, i) => (
              <path key={i} d={`M ${50 + dx - 5} ${g.top + 4} L ${50 + dx} ${g.top - 10} L ${50 + dx + 5} ${g.top + 4} Z`} />
            ))}
          </g>
        ),
      };
    case "back:plates":
      return (
        {
          behind: (
            <g fill={darken(base, 0.22)} {...S}>
              {[-15, -5, 5, 15].map((dx, i) => (
                <path key={i} d={`M ${50 + dx - 4} ${g.top + 5} Q ${50 + dx} ${g.top - 9} ${50 + dx + 5} ${g.top + 3} Z`} />
              ))}
            </g>
          ),
        }
      );
    case "back:frill":
      return {
        behind: (
          <path d={`M 24 ${g.eyeY} Q 26 ${g.top - 14} 50 ${g.top - 16} Q 74 ${g.top - 14} 76 ${g.eyeY} Q 63 ${g.top + 4} 50 ${g.top + 3} Q 37 ${g.top + 4} 24 ${g.eyeY} Z`} fill={darken(base, 0.16)} {...S} />
        ),
      };
    case "back:shellRim":
      return { behind: <ellipse cx={50} cy={g.cy + 2} rx={g.rx + 4} ry={g.ry - 2} fill={darken(base, 0.25)} {...S} /> };
    case "back:peacock":
      return {
        behind: (
          <g>
            {[-2, -1, 0, 1, 2].map((i) => (
              <g key={i} transform={`rotate(${i * 22} 50 ${g.cy + 6})`}>
                <ellipse cx={50} cy={g.top - 12} rx={7} ry={16} fill={darken(base, 0.15)} {...S} />
                <circle cx={50} cy={g.top - 17} r={3.4} fill={TECH} stroke={INK} strokeWidth={1.6} />
              </g>
            ))}
          </g>
        ),
      };
    case "back:spikesAround":
      return {
        behind: (
          <g fill={darken(base, 0.2)} {...S}>
            {Array.from({ length: 10 }, (_, i) => {
              const a = (i / 10) * Math.PI * 2 + 0.3;
              const cx = 50 + Math.cos(a) * (g.rx + 1);
              const cyy = g.cy + Math.sin(a) * (g.ry + 1) * 0.9;
              const tx = 50 + Math.cos(a) * (g.rx + 9);
              const ty = g.cy + Math.sin(a) * (g.ry + 9) * 0.9;
              return <path key={i} d={`M ${cx - 2.5} ${cyy} L ${tx} ${ty} L ${cx + 2.5} ${cyy} Z`} />;
            })}
          </g>
        ),
      };
    /* ---- 얼굴 디테일 ---- */
    case "face:whiskers":
      return {
        front: (
          <g stroke={INK} strokeWidth={1.4} strokeLinecap="round" opacity={0.7}>
            <line x1={34} y1={g.mouthY - 4} x2={23} y2={g.mouthY - 7} />
            <line x1={34} y1={g.mouthY} x2={22} y2={g.mouthY} />
            <line x1={66} y1={g.mouthY - 4} x2={77} y2={g.mouthY - 7} />
            <line x1={66} y1={g.mouthY} x2={78} y2={g.mouthY} />
          </g>
        ),
      };
    case "face:teeth":
      return { front: <rect x={47.2} y={g.mouthY + 1} width={5.6} height={5} rx={1.4} fill="#fff" stroke={INK} strokeWidth={1.6} /> };
    case "face:fangs":
      return (
        {
          front: (
            <g fill="#fff" stroke={INK} strokeWidth={1.4} strokeLinejoin="round">
              <path d={`M 43.5 ${g.mouthY + 0.5} l 2.4 4.6 l 2.2 -4.4 Z`} />
              <path d={`M 52 ${g.mouthY + 0.7} l 2.3 4.4 l 2.3 -4.6 Z`} />
            </g>
          ),
        }
      );
    case "face:patch":
      return {
        front: (
          <>
            <ellipse cx={50 - g.eyeDx} cy={g.eyeY} rx={g.eyeR + 3.6} ry={g.eyeR + 4.6} fill={darken(base, 0.42)} opacity={0.85} transform={`rotate(-14 ${50 - g.eyeDx} ${g.eyeY})`} />
            <ellipse cx={50 + g.eyeDx} cy={g.eyeY} rx={g.eyeR + 3.6} ry={g.eyeR + 4.6} fill={darken(base, 0.42)} opacity={0.85} transform={`rotate(14 ${50 + g.eyeDx} ${g.eyeY})`} />
          </>
        ),
      };
    case "face:mask":
      return { front: <path d={`M ${50 - g.rx + 4} ${g.eyeY - 6} Q 50 ${g.eyeY - 10} ${50 + g.rx - 4} ${g.eyeY - 6} L ${50 + g.rx - 6} ${g.eyeY + 6} Q 50 ${g.eyeY + 10} ${50 - g.rx + 6} ${g.eyeY + 6} Z`} fill={darken(base, 0.4)} opacity={0.8} /> };
    case "face:monkey":
      return { front: <path d={`M ${50 - g.eyeDx - 7} ${g.eyeY - 6} Q 50 ${g.eyeY - 12} ${50 + g.eyeDx + 7} ${g.eyeY - 6} Q ${50 + g.eyeDx + 8} ${g.mouthY + 5} 50 ${g.mouthY + 7} Q ${50 - g.eyeDx - 8} ${g.mouthY + 5} ${50 - g.eyeDx - 7} ${g.eyeY - 6} Z`} fill={lighten(base, 0.4)} opacity={0.95} /> };
    case "face:pouch":
      return {
        front: (
          <>
            <circle cx={50 - g.eyeDx - 7} cy={g.mouthY - 1} r={6} fill={lighten(base, 0.28)} opacity={0.95} />
            <circle cx={50 + g.eyeDx + 7} cy={g.mouthY - 1} r={6} fill={lighten(base, 0.28)} opacity={0.95} />
          </>
        ),
      };
    case "face:spots":
      return (
        {
          front: (
            <g fill={darken(base, 0.35)} opacity={0.75}>
              <ellipse cx={33} cy={g.cy - 8} rx={5.5} ry={4} />
              <ellipse cx={66} cy={g.cy + 6} rx={4.6} ry={3.6} />
              <ellipse cx={40} cy={g.cy + 14} rx={3.6} ry={2.8} />
            </g>
          ),
        }
      );
    case "face:tear":
      return {
        front: (
          <g stroke={darken(base, 0.45)} strokeWidth={2} strokeLinecap="round" fill="none" opacity={0.85}>
            <path d={`M ${50 - g.eyeDx} ${g.eyeY + g.eyeR + 1} q -2 4 -4 6`} />
            <path d={`M ${50 + g.eyeDx} ${g.eyeY + g.eyeR + 1} q 2 4 4 6`} />
          </g>
        ),
      };
    case "face:stripes":
      return {
        front: (
          <g fill={darken(base, 0.42)} opacity={0.85}>
            {[0, 1].map((i) => (
              <path key={i} d={`M ${24 + i * 3} ${g.eyeY - 6 + i * 9} q 7 -2 9 2 q -7 2 -9 -2 Z`} />
            ))}
            {[0, 1].map((i) => (
              <path key={`r${i}`} d={`M ${76 - i * 3} ${g.eyeY - 6 + i * 9} q -7 -2 -9 2 q 7 2 9 -2 Z`} />
            ))}
            <path d={`M 44 ${g.top + 3} q 6 -3 12 0 q -6 3 -12 0 Z`} />
          </g>
        ),
      };
    case "face:brow":
      return (
        {
          front: (
            <g stroke={INK} strokeWidth={2.6} strokeLinecap="round">
              <line x1={50 - g.eyeDx - 5} y1={g.eyeY - g.eyeR - 4.5} x2={50 - g.eyeDx + 4} y2={g.eyeY - g.eyeR - 1.5} />
              <line x1={50 + g.eyeDx + 5} y1={g.eyeY - g.eyeR - 4.5} x2={50 + g.eyeDx - 4} y2={g.eyeY - g.eyeR - 1.5} />
            </g>
          ),
        }
      );
    case "face:discs":
      return {
        front: (
          <>
            <circle cx={50 - g.eyeDx} cy={g.eyeY} r={g.eyeR + 4.4} fill={lighten(base, 0.42)} stroke={darken(base, 0.2)} strokeWidth={1.8} />
            <circle cx={50 + g.eyeDx} cy={g.eyeY} r={g.eyeR + 4.4} fill={lighten(base, 0.42)} stroke={darken(base, 0.2)} strokeWidth={1.8} />
          </>
        ),
      };
    case "face:belly":
      return { front: <ellipse cx={50} cy={g.cy + 7} rx={g.rx * 0.6} ry={g.ry * 0.62} fill="#f4f5f8" stroke="none" /> };
    case "face:orca":
      return {
        front: (
          <>
            <ellipse cx={50 - g.eyeDx - 3} cy={g.eyeY - 5} rx={5} ry={3} fill="#f4f5f8" transform={`rotate(-18 ${50 - g.eyeDx - 3} ${g.eyeY - 5})`} />
            <ellipse cx={50 + g.eyeDx + 3} cy={g.eyeY - 5} rx={5} ry={3} fill="#f4f5f8" transform={`rotate(18 ${50 + g.eyeDx + 3} ${g.eyeY - 5})`} />
            <ellipse cx={50} cy={g.cy + 10} rx={g.rx * 0.55} ry={g.ry * 0.45} fill="#f4f5f8" stroke="none" />
          </>
        ),
      };
    case "face:grin":
      return {
        front: (
          <g>
            <path d={`M 38 ${g.mouthY - 1} Q 50 ${g.mouthY + 6} 62 ${g.mouthY - 1}`} fill="none" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
            <path d={`M 41 ${g.mouthY + 0.5} l 2.5 3.5 l 2.5 -3 l 2.5 3 l 2.5 -3 l 2.5 3 l 2.5 -3 l 2.5 3 l 2.5 -3.5`} fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ),
      };
    case "face:gills":
      return {
        front: (
          <g stroke={darken(base, 0.3)} strokeWidth={1.8} strokeLinecap="round" fill="none" opacity={0.8}>
            <path d={`M ${L + 6} ${g.cy - 4} q 3 4 0 8 M ${L + 11} ${g.cy - 4} q 3 4 0 8`} />
            <path d={`M ${R - 6} ${g.cy - 4} q -3 4 0 8 M ${R - 11} ${g.cy - 4} q -3 4 0 8`} />
          </g>
        ),
      };
    case "face:lips":
      return {
        front: (
          <>
            <ellipse cx={50} cy={g.mouthY} rx={5} ry={3.4} fill={darken(base, 0.25)} {...S} />
            <ellipse cx={50} cy={g.mouthY} rx={2} ry={1.3} fill={INK} />
          </>
        ),
      };
    case "face:mounts":
      return {
        behind: (
          <>
            <circle cx={50 - g.eyeDx - 1} cy={g.eyeY + 1} r={8} fill={fill} {...S} />
            <circle cx={50 + g.eyeDx + 1} cy={g.eyeY + 1} r={8} fill={fill} {...S} />
          </>
        ),
      };
    case "face:wide":
      return { front: <path d={`M 37 ${g.mouthY} Q 50 ${g.mouthY + 8} 63 ${g.mouthY}`} fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" /> };
    case "face:tongue":
      return {
        front: (
          <g stroke="#d95f6e" strokeWidth={2.2} strokeLinecap="round" fill="none">
            <path d={`M 50 ${g.mouthY} q 0 5 0 7 M 50 ${g.mouthY + 7} l -2.6 3 M 50 ${g.mouthY + 7} l 2.6 3`} />
          </g>
        ),
      };
    case "face:scales":
      return {
        front: (
          <g fill="none" stroke={darken(base, 0.28)} strokeWidth={1.7} opacity={0.85}>
            <path d={`M 42 ${g.plateCy - 12} Q 50 ${g.plateCy - 8} 58 ${g.plateCy - 12}`} />
            <path d={`M 41 ${g.plateCy - 6} Q 50 ${g.plateCy - 2} 59 ${g.plateCy - 6}`} />
          </g>
        ),
      };
    case "face:cones":
      return {
        front: (
          <>
            <circle cx={50 - g.eyeDx} cy={g.eyeY} r={g.eyeR + 3.4} fill="none" stroke={darken(base, 0.25)} strokeWidth={2.4} />
            <circle cx={50 + g.eyeDx} cy={g.eyeY} r={g.eyeR + 3.4} fill="none" stroke={darken(base, 0.25)} strokeWidth={2.4} />
          </>
        ),
      };
    case "face:shell":
      return {
        front: (
          <g>
            <ellipse cx={50} cy={g.plateCy - 2} rx={19} ry={13.5} fill="#caa25a" stroke={INK} strokeWidth={2.2} />
            <path
              d={`M 32 ${g.plateCy - 2} H 68 M 50 ${g.plateCy - 15} V ${g.plateCy + 11} M 38 ${g.plateCy - 11} L 62 ${g.plateCy + 8} M 62 ${g.plateCy - 11} L 38 ${g.plateCy + 8}`}
              stroke="#8f7136"
              strokeWidth={1.6}
              fill="none"
              opacity={0.9}
            />
          </g>
        ),
      };
    default:
      return {};
  }
}

/* ---------- 바디 ---------- */

function renderBody(kind: BodyKind, g: Geom, fill: string, base: string): ReactNode {
  if (kind === "neck")
    return (
      <>
        <ellipse cx={50} cy={g.cy} rx={g.rx} ry={g.ry} fill={fill} {...S} strokeWidth={2.4} />
        <rect x={43.5} y={15} width={13} height={58} rx={6.5} fill={fill} {...S} strokeWidth={2.4} />
        <circle cx={50} cy={21} r={11.5} fill={fill} {...S} strokeWidth={2.4} />
        <ellipse cx={50} cy={g.cy + 4} rx={g.rx * 0.55} ry={g.ry * 0.55} fill="#ffffff" opacity={0.2} />
      </>
    );
  if (kind === "snake")
    return (
      <>
        <ellipse cx={50} cy={81} rx={26} ry={9.5} fill={fill} {...S} strokeWidth={2.4} />
        <ellipse cx={50} cy={70} rx={20} ry={8.5} fill={fill} {...S} strokeWidth={2.4} />
        <ellipse cx={50} cy={49} rx={14} ry={12} fill={fill} {...S} strokeWidth={2.4} />
        <rect x={42} y={56} width={16} height={10} fill={fill} stroke="none" />
      </>
    );
  if (kind === "jelly")
    return (
      <path
        d={`M 24 54 A 26 25 0 1 1 76 54 L 76 60 Q 69.5 65 63 60 Q 56.5 65 50 60 Q 43.5 65 37 60 Q 30.5 65 24 60 Z`}
        fill={fill}
        {...S}
        strokeWidth={2.4}
      />
    );
  return <ellipse cx={50} cy={g.cy} rx={g.rx} ry={g.ry} fill={fill} {...S} strokeWidth={2.4} />;
}

/* ---------- 로봇 공통 레이어 ---------- */

function RobotLayer({ g, base }: { g: Geom; base: string }) {
  const px = 50 - g.plateW / 2;
  return (
    <g>
      <path
        d={`M ${50 - g.rx + 6} ${g.cy - g.ry + 10} Q ${50 - g.rx + 2} ${g.cy} ${50 - g.rx + 7} ${g.cy + g.ry - 10}`}
        fill="none"
        stroke={darken(base, 0.28)}
        strokeWidth={1.6}
        opacity={0.55}
      />
      <path
        d={`M ${50 + g.rx - 6} ${g.cy - g.ry + 10} Q ${50 + g.rx - 2} ${g.cy} ${50 + g.rx - 7} ${g.cy + g.ry - 10}`}
        fill="none"
        stroke={darken(base, 0.28)}
        strokeWidth={1.6}
        opacity={0.55}
      />
      <circle cx={50 - g.rx + 4} cy={g.top + 16} r={2.4} fill={METAL_DARK} stroke={INK} strokeWidth={1.4} />
      <circle cx={50 + g.rx - 4} cy={g.top + 16} r={2.4} fill={METAL_DARK} stroke={INK} strokeWidth={1.4} />
      <rect x={px} y={g.plateCy - 7} width={g.plateW} height={14} rx={5} fill={METAL} stroke={INK} strokeWidth={2} />
      <rect x={px + 2.5} y={g.plateCy - 4.5} width={g.plateW - 5} height={9} rx={3.5} fill="none" stroke={METAL_DARK} strokeWidth={1.2} />
      <circle cx={50} cy={g.plateCy} r={3.6} fill={TECH} stroke={INK} strokeWidth={1.6} />
      <circle cx={50} cy={g.plateCy} r={1.4} fill="#ffffff" opacity={0.9} />
    </g>
  );
}

function Feet({ g }: { g: Geom }) {
  if (!g.feet) return null;
  return (
    <>
      <ellipse cx={38} cy={89.5} rx={7} ry={3.6} fill={METAL_DARK} stroke={INK} strokeWidth={1.8} />
      <ellipse cx={62} cy={89.5} rx={7} ry={3.6} fill={METAL_DARK} stroke={INK} strokeWidth={1.8} />
    </>
  );
}

/* ---------- 레벨 장비 (로봇 업그레이드 사다리) ---------- */

function levelGear(level: number, g: Geom): ReactNode {
  const items: ReactNode[] = [];
  if (level >= 3)
    items.push(
      <g key="chips">
        <rect x={50 - g.rx - 2} y={g.top + 8} width={5} height={8} rx={2} fill={METAL} stroke={INK} strokeWidth={1.6} />
        <rect x={50 + g.rx - 3} y={g.top + 8} width={5} height={8} rx={2} fill={METAL} stroke={INK} strokeWidth={1.6} />
      </g>,
    );
  if (level >= 4)
    items.push(
      <g key="antenna">
        <line x1={50} y1={g.top - 2} x2={50} y2={g.top - 13} stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
        <circle cx={50} cy={g.top - 15} r={4} fill={TECH} stroke={INK} strokeWidth={1.8} />
        <circle cx={51.4} cy={g.top - 16.4} r={1.2} fill="#fff" opacity={0.9} />
      </g>,
    );
  if (level >= 5) items.push(<circle key="corering" cx={50} cy={g.plateCy} r={6.8} fill="none" stroke={GOLD} strokeWidth={1.8} />);
  if (level >= 6)
    items.push(
      <g key="boosters">
        <rect x={29} y={85} width={18} height={7.5} rx={2.5} fill={METAL_DARK} stroke={INK} strokeWidth={1.8} />
        <rect x={53} y={85} width={18} height={7.5} rx={2.5} fill={METAL_DARK} stroke={INK} strokeWidth={1.8} />
        <path d={`M 35 93 l 3 4.5 l 3 -4.5 Z M 59 93 l 3 4.5 l 3 -4.5 Z`} fill={TECH} stroke="none" opacity={0.9} />
      </g>,
    );
  if (level >= 7)
    items.push(
      <g key="pads">
        <rect x={50 - g.rx - 6} y={g.top + 13} width={13} height={8} rx={3.5} fill={METAL} stroke={INK} strokeWidth={1.8} transform={`rotate(-14 ${50 - g.rx} ${g.top + 17})`} />
        <rect x={50 + g.rx - 7} y={g.top + 13} width={13} height={8} rx={3.5} fill={METAL} stroke={INK} strokeWidth={1.8} transform={`rotate(14 ${50 + g.rx} ${g.top + 17})`} />
      </g>,
    );
  if (level >= 9)
    items.push(
      <g key="bands">
        <rect x={50 - g.rx - 4} y={g.cy + 2} width={8} height={12} rx={4} fill={METAL_DARK} stroke={INK} strokeWidth={1.6} />
        <rect x={50 + g.rx - 4} y={g.cy + 2} width={8} height={12} rx={4} fill={METAL_DARK} stroke={INK} strokeWidth={1.6} />
      </g>,
    );
  if (level >= 10)
    items.push(
      <g key="overcharge" className="tm-twinkle">
        <circle cx={50} cy={g.plateCy} r={5} fill={TECH} opacity={0.55} />
      </g>,
    );
  if (level >= 11)
    items.push(
      <rect
        key="visor"
        x={50 - g.eyeDx - g.eyeR - 5}
        y={g.eyeY - g.eyeR - 7}
        width={(g.eyeDx + g.eyeR + 5) * 2}
        height={5}
        rx={2.5}
        fill={TECH}
        opacity={0.45}
        stroke={INK}
        strokeWidth={1.4}
      />,
    );
  if (level >= 12)
    items.push(
      <g key="jets">
        <path d={`M ${50 - g.rx + 2} ${g.cy - 14} L ${50 - g.rx - 10} ${g.cy - 22} L ${50 - g.rx - 2} ${g.cy - 8} Z`} fill={METAL} stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
        <path d={`M ${50 + g.rx - 2} ${g.cy - 14} L ${50 + g.rx + 10} ${g.cy - 22} L ${50 + g.rx + 2} ${g.cy - 8} Z`} fill={METAL} stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
      </g>,
    );
  if (level >= 13)
    items.push(
      <g key="emblem">
        <path d={star4(50 + g.plateW / 2 + 6, g.plateCy - 4, 5.5)} fill={GOLD} stroke={INK} strokeWidth={1.4} />
      </g>,
    );
  if (level >= 14)
    items.push(
      <g key="particles" className="tm-twinkle">
        {[
          [16, 20],
          [84, 20],
          [12, 78],
          [88, 78],
        ].map(([x, y], i) => (
          <path key={i} d={star4(x, y, 3.2)} fill={TECH} />
        ))}
      </g>,
    );
  if (level >= 20)
    items.push(
      <g key="crown">
        <path d={`M ${50 - 13} ${g.top - 8} L ${50 - 13} ${g.top - 18} L ${50 - 6} ${g.top - 12} L 50 ${g.top - 20} L ${50 + 6} ${g.top - 12} L ${50 + 13} ${g.top - 18} L ${50 + 13} ${g.top - 8} Z`} fill={GOLD} {...S} strokeWidth={2} />
        <circle cx={50} cy={g.top - 11.5} r={2.2} fill="#c0392b" />
        <circle cx={50 - 8.5} cy={g.top - 11.8} r={1.4} fill="#3e6dc0" />
        <circle cx={50 + 8.5} cy={g.top - 11.8} r={1.4} fill="#3e6dc0" />
      </g>,
    );
  return <>{items}</>;
}

const SPARKLE_SPOTS: [number, number, number][] = [
  [14, 28, 5],
  [88, 50, 4.2],
  [82, 14, 3.8],
  [10, 64, 3.8],
  [50, 97, 3.4],
  [92, 84, 3.4],
];

/* ---------- 메인 렌더러 ---------- */

export function PetVector({
  species,
  color,
  level,
  eye,
  mouth,
  levelProgressPct,
  size,
  label,
}: {
  species: TokenmonSpecies;
  color: TokenmonColor;
  level: number;
  eye: EyeStyle;
  mouth: "smile" | "flat" | "frown";
  levelProgressPct: number;
  size: number;
  label: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const info = getSpeciesInfo(species);
  const base = getColorInfo(color).base;

  /* Lv.1 — 인큐베이터 알 */
  if (level <= 1) {
    return (
      <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={label} style={{ overflow: "visible" }}>
        <defs>
          <radialGradient id={`${uid}e`} cx="38%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#fbf7ec" />
            <stop offset="60%" stopColor="#efe8d6" />
            <stop offset="100%" stopColor="#d6c9a8" />
          </radialGradient>
        </defs>
        <ellipse cx={50} cy={92} rx={26} ry={4} fill="#20201e" opacity={0.1} />
        <path d="M50 16 C68 16 78 38 78 57 C78 77 65 88 50 88 C35 88 22 77 22 57 C22 38 32 16 50 16 Z" fill={`url(#${uid}e)`} stroke={INK} strokeWidth={2.4} />
        <path d="M23.5 60 Q 50 66 76.5 60" fill="none" stroke={METAL_DARK} strokeWidth={4} opacity={0.75} />
        <circle cx={50} cy={62.6} r={2.6} fill={TECH} stroke={INK} strokeWidth={1.4} className="tm-twinkle" />
        <ellipse cx={42} cy={40} rx={4.4} ry={3.2} fill={base} opacity={0.85} />
        <ellipse cx={59} cy={48} rx={3.6} ry={2.7} fill={base} opacity={0.85} />
        {levelProgressPct >= 60 && (
          <path d="M 40 28 L 46 34 L 41 40 L 48 45" fill="none" stroke="#8f8060" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    );
  }

  const g: Geom = { ...GEOMS[info.body], ...(GEOM_TWEAKS[species] ?? {}) };
  const bodyFill = `url(#${uid}b)`;
  const ctx: Ctx = { g, base, dark: darken(base, 0.3), light: lighten(base, 0.45), fill: bodyFill };

  const behind: ReactNode[] = [];
  const front: ReactNode[] = [];
  let suppressMouth = false;
  info.parts.forEach(([family, kind], index) => {
    if (MOUTH_SUPPRESS.has(`${family}:${kind}`)) suppressMouth = true;
    const part = renderPart(family, kind, ctx);
    if (part.behind) behind.push(<g key={`b${index}`}>{part.behind}</g>);
    if (part.front) front.push(<g key={`f${index}`}>{part.front}</g>);
  });

  const sparkles = Math.max(0, Math.min(SPARKLE_SPOTS.length, level - 14));

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={label} style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id={`${uid}b`} cx="38%" cy="28%" r="85%">
          <stop offset="0%" stopColor={lighten(base, 0.26)} />
          <stop offset="55%" stopColor={base} />
          <stop offset="100%" stopColor={darken(base, 0.2)} />
        </radialGradient>
      </defs>
      <ellipse cx={50} cy={92} rx={g.rx + 3} ry={4.2} fill="#20201e" opacity={0.1} />
      {level >= 15 && (
        <g className="tm-aura">
          <circle cx={50} cy={54} r={46} fill={GOLD} opacity={0.09} />
          <circle cx={50} cy={54} r={37} fill={GOLD} opacity={0.07} />
        </g>
      )}
      {level >= 18 && (
        <g>
          <path d={`M 28 38 Q 50 30 72 38 L 84 88 Q 50 97 16 88 Z`} fill="#8e3438" {...S} />
          <path d={`M 33 40 Q 50 34 67 40 L 75 85 Q 50 92 25 85 Z`} fill="#a03e42" stroke="none" />
          <path d={`M 16 88 Q 50 97 84 88`} fill="none" stroke={GOLD} strokeWidth={3.2} strokeLinecap="round" />
        </g>
      )}
      {behind}
      {renderBody(info.body, g, bodyFill, base)}
      <Feet g={g} />
      <RobotLayer g={g} base={base} />
      <Eye cx={50 - g.eyeDx} cy={g.eyeY} eye={eye} r={g.eyeR} />
      <Eye cx={50 + g.eyeDx} cy={g.eyeY} eye={eye} r={g.eyeR} />
      {!suppressMouth && <Mouth cx={50} cy={g.mouthY} mood={mouth} />}
      {front}
      {levelGear(level, g)}
      {sparkles > 0 && (
        <g className="tm-twinkle">
          {SPARKLE_SPOTS.slice(0, sparkles).map(([cx, cy, r], index) => (
            <path key={index} d={star4(cx, cy, r)} fill={GOLD} stroke={INK} strokeWidth={0.8} />
          ))}
        </g>
      )}
    </svg>
  );
}
