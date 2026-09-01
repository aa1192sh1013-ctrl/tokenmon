"use client";

import { useId, type ReactNode } from "react";
import type { TokenmonStage } from "@/lib/tokenmon";
import { GOLD, type Palette } from "./tokenmon-species";

/**
 * 벡터 캐릭터 렌더러 — 도트 대신 부드러운 곡선·그라데이션·글로시 눈의
 * 마스코트 스타일. 좌표계는 100×100, 바닥은 y≈92.
 * 종족의 몸 색(palette.B/D/L/A 등)과 형태 키(shape)로 60종을 전부 그린다.
 */

export type EyeStyle = "open" | "half" | "closed";

const INK = "#2b2b25";

/* ---------- 색 유틸 ---------- */
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

/* ---------- 공용 파츠 ---------- */

function Eye({ cx, cy, eye, r = 6 }: { cx: number; cy: number; eye: EyeStyle; r?: number }) {
  if (eye === "closed")
    return <path d={`M ${cx - r} ${cy} Q ${cx} ${cy + r * 0.8} ${cx + r} ${cy}`} fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />;
  if (eye === "half")
    return (
      <g>
        <ellipse cx={cx} cy={cy + 1} rx={r} ry={r * 0.55} fill={INK} />
        <circle cx={cx + r * 0.35} cy={cy - r * 0.05} r={r * 0.28} fill="#fff" opacity={0.9} />
      </g>
    );
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={INK} />
      <circle cx={cx + r * 0.34} cy={cy - r * 0.34} r={r * 0.36} fill="#fff" opacity={0.95} />
      <circle cx={cx - r * 0.4} cy={cy + r * 0.4} r={r * 0.16} fill="#fff" opacity={0.7} />
    </g>
  );
}

function Mouth({ cx, cy, mood }: { cx: number; cy: number; mood: "smile" | "flat" | "frown" }) {
  const d =
    mood === "smile"
      ? `M ${cx - 6} ${cy} Q ${cx} ${cy + 6} ${cx + 6} ${cy}`
      : mood === "frown"
        ? `M ${cx - 5} ${cy + 3} Q ${cx} ${cy - 2} ${cx + 5} ${cy + 3}`
        : `M ${cx - 4} ${cy + 1} L ${cx + 4} ${cy + 1}`;
  return <path d={d} fill="none" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />;
}

function star4(cx: number, cy: number, r: number): string {
  return `M ${cx} ${cy - r} Q ${cx} ${cy} ${cx + r} ${cy} Q ${cx} ${cy} ${cx} ${cy + r} Q ${cx} ${cy} ${cx - r} ${cy} Q ${cx} ${cy} ${cx} ${cy - r} Z`;
}

/* ---------- 형태별 지오메트리 ---------- */

interface Geom {
  cy: number;
  rx: number;
  ry: number;
  top: number;
  eyeY: number;
  eyeDx: number;
  eyeR: number;
  mouthY: number;
  bellyCy: number;
  bellyRx: number;
  bellyRy: number;
}

function geomFor(stage: TokenmonStage): Geom {
  if (stage === "baby")
    return { cy: 63, rx: 25, ry: 24, top: 39, eyeY: 57, eyeDx: 10.5, eyeR: 6, mouthY: 66, bellyCy: 73, bellyRx: 13, bellyRy: 9 };
  return { cy: 58, rx: 28, ry: 32, top: 26, eyeY: 50, eyeDx: 11, eyeR: 6.2, mouthY: 60, bellyCy: 70, bellyRx: 16, bellyRy: 13 };
}

/* ---------- 종족별 특징 (behind: 몸 뒤 / front: 얼굴 위) ---------- */

interface Parts {
  behind?: ReactNode;
  front?: ReactNode;
  /** true면 기본 몸을 그리지 않는다 (브라키오처럼 실루엣이 특수한 종). */
  customBody?: ReactNode;
  eyeY?: number;
  eyeDx?: number;
  eyeR?: number;
  mouthY?: number;
}

function familyParts(shape: string, g: Geom, c: Palette, bodyFill: string): Parts {
  const B = c.B ?? "#888";
  const D = c.D ?? darken(B, 0.35);
  const L = c.L ?? lighten(B, 0.55);
  const A = c.A ?? "#d95f5f";
  const O = c.O ?? "#e8913c";
  const P = c.P ?? "#f2b8c6";
  const M = c.M ?? "#e88ab0";
  const Y = c.Y ?? "#e0b26a";
  const stroke = { stroke: INK, strokeWidth: 2.2 } as const;

  switch (shape) {
    case "duck":
      return {
        behind: (
          <>
            <ellipse cx={50 - g.rx + 3} cy={g.cy + 2} rx={7} ry={12} fill={bodyFill} {...stroke} transform={`rotate(14 ${50 - g.rx + 3} ${g.cy})`} />
            <ellipse cx={50 + g.rx - 3} cy={g.cy + 2} rx={7} ry={12} fill={bodyFill} {...stroke} transform={`rotate(-14 ${50 + g.rx - 3} ${g.cy})`} />
            <path d={`M 47 ${g.top - 2} Q 50 ${g.top - 9} 56 ${g.top - 5}`} fill="none" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
          </>
        ),
        front: (
          <>
            <ellipse cx={50} cy={g.mouthY - 1} rx={9.5} ry={5} fill={O} {...stroke} />
            <ellipse cx={50} cy={g.mouthY + 2.5} rx={6.5} ry={3.2} fill={darken(O, 0.15)} {...stroke} />
          </>
        ),
        mouthY: -100,
      };
    case "cat":
      return {
        behind: (
          <>
            <path d={`M ${50 - g.rx + 4} ${g.top + 8} L ${50 - g.rx - 2} ${g.top - 12} L ${50 - g.rx + 16} ${g.top + 1} Z`} fill={bodyFill} {...stroke} strokeLinejoin="round" />
            <path d={`M ${50 + g.rx - 4} ${g.top + 8} L ${50 + g.rx + 2} ${g.top - 12} L ${50 + g.rx - 16} ${g.top + 1} Z`} fill={bodyFill} {...stroke} strokeLinejoin="round" />
            <path d={`M ${50 - g.rx + 5} ${g.top + 4} L ${50 - g.rx + 2} ${g.top - 6} L ${50 - g.rx + 12} ${g.top + 1} Z`} fill={P} stroke="none" />
            <path d={`M ${50 + g.rx - 5} ${g.top + 4} L ${50 + g.rx - 2} ${g.top - 6} L ${50 + g.rx - 12} ${g.top + 1} Z`} fill={P} stroke="none" />
          </>
        ),
        front: (
          <>
            <path d={`M 47 ${g.mouthY - 2} L 53 ${g.mouthY - 2} L 50 ${g.mouthY + 1} Z`} fill={darken(P, 0.25)} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
            {[-1, 1].map((side) => (
              <g key={side} stroke={INK} strokeWidth={1.4} strokeLinecap="round" opacity={0.75}>
                <line x1={50 + side * 16} y1={g.mouthY - 4} x2={50 + side * 27} y2={g.mouthY - 7} />
                <line x1={50 + side * 16} y1={g.mouthY} x2={50 + side * 28} y2={g.mouthY} />
              </g>
            ))}
          </>
        ),
      };
    case "penguin":
      return {
        behind: (
          <>
            <ellipse cx={50 - g.rx + 1} cy={g.cy + 4} rx={6} ry={13} fill={bodyFill} {...stroke} transform={`rotate(18 ${50 - g.rx + 1} ${g.cy + 4})`} />
            <ellipse cx={50 + g.rx - 1} cy={g.cy + 4} rx={6} ry={13} fill={bodyFill} {...stroke} transform={`rotate(-18 ${50 + g.rx - 1} ${g.cy + 4})`} />
          </>
        ),
        front: (
          <>
            <ellipse cx={50} cy={g.cy + 6} rx={g.rx * 0.62} ry={g.ry * 0.68} fill={L} stroke="none" />
            <circle cx={50 - g.eyeDx} cy={g.eyeY} r={g.eyeR + 3.4} fill={L} stroke="none" />
            <circle cx={50 + g.eyeDx} cy={g.eyeY} r={g.eyeR + 3.4} fill={L} stroke="none" />
            <path d={`M 46 ${g.eyeY + 7} L 54 ${g.eyeY + 7} L 50 ${g.eyeY + 12} Z`} fill={O} stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
          </>
        ),
        mouthY: -100,
      };
    case "bunny":
      return {
        behind: (
          <>
            <rect x={50 - g.rx + 6} y={g.top - 24} width={11} height={30} rx={5.5} fill={bodyFill} {...stroke} transform={`rotate(-8 ${50 - g.rx + 11} ${g.top})`} />
            <rect x={50 + g.rx - 17} y={g.top - 24} width={11} height={30} rx={5.5} fill={bodyFill} {...stroke} transform={`rotate(8 ${50 + g.rx - 11} ${g.top})`} />
            <rect x={50 - g.rx + 9} y={g.top - 19} width={5} height={20} rx={2.5} fill={P} stroke="none" transform={`rotate(-8 ${50 - g.rx + 11} ${g.top})`} />
            <rect x={50 + g.rx - 14} y={g.top - 19} width={5} height={20} rx={2.5} fill={P} stroke="none" transform={`rotate(8 ${50 + g.rx - 11} ${g.top})`} />
          </>
        ),
        front: (
          <>
            <ellipse cx={50} cy={g.mouthY - 3} rx={2.6} ry={1.8} fill={darken(P, 0.3)} />
            <rect x={47.4} y={g.mouthY - 1} width={5.2} height={4.6} rx={1.4} fill="#fff" stroke={INK} strokeWidth={1.6} />
            <line x1={50} y1={g.mouthY - 1} x2={50} y2={g.mouthY + 3.4} stroke={INK} strokeWidth={1.2} />
          </>
        ),
        mouthY: -100,
      };
    case "frog":
      return {
        behind: (
          <>
            <circle cx={50 - g.eyeDx - 1} cy={g.top + 1} r={8.5} fill={bodyFill} {...stroke} />
            <circle cx={50 + g.eyeDx + 1} cy={g.top + 1} r={8.5} fill={bodyFill} {...stroke} />
          </>
        ),
        front: <path d={`M 38 ${g.mouthY - 2} Q 50 ${g.mouthY + 7} 62 ${g.mouthY - 2}`} fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />,
        eyeY: g.top + 0,
        eyeDx: g.eyeDx + 1,
        eyeR: 4.6,
        mouthY: -100,
      };
    case "bear":
      return {
        behind: (
          <>
            <circle cx={50 - g.rx + 6} cy={g.top + 2} r={8} fill={bodyFill} {...stroke} />
            <circle cx={50 + g.rx - 6} cy={g.top + 2} r={8} fill={bodyFill} {...stroke} />
            <circle cx={50 - g.rx + 6} cy={g.top + 2} r={4} fill={L} stroke="none" />
            <circle cx={50 + g.rx - 6} cy={g.top + 2} r={4} fill={L} stroke="none" />
          </>
        ),
        front: (
          <>
            <ellipse cx={50} cy={g.mouthY - 1} rx={8.5} ry={6} fill={L} stroke="none" />
            <ellipse cx={50} cy={g.mouthY - 3.5} rx={3} ry={2.2} fill={INK} />
            <path d={`M 50 ${g.mouthY - 1} Q 50 ${g.mouthY + 2} 47 ${g.mouthY + 2.5} M 50 ${g.mouthY - 1} Q 50 ${g.mouthY + 2} 53 ${g.mouthY + 2.5}`} fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />
          </>
        ),
        mouthY: -100,
      };
    case "chick":
      return {
        behind: (
          <>
            {[-6, 0, 6].map((dx, i) => (
              <path key={i} d={`M ${50 + dx} ${g.top + 2} Q ${50 + dx - 2} ${g.top - 9 - (i === 1 ? 3 : 0)} ${50 + dx + 3} ${g.top - 6 - (i === 1 ? 3 : 0)}`} fill="none" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
            ))}
            <ellipse cx={50 - g.rx + 3} cy={g.cy + 3} rx={6} ry={10} fill={darken(B, 0.08)} {...stroke} transform={`rotate(16 ${50 - g.rx + 3} ${g.cy})`} />
            <ellipse cx={50 + g.rx - 3} cy={g.cy + 3} rx={6} ry={10} fill={darken(B, 0.08)} {...stroke} transform={`rotate(-16 ${50 + g.rx - 3} ${g.cy})`} />
          </>
        ),
        front: <path d={`M 46 ${g.mouthY - 3} L 54 ${g.mouthY - 3} L 50 ${g.mouthY + 3} Z`} fill={O} stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />,
        mouthY: -100,
      };
    case "pig":
      return {
        behind: (
          <>
            <path d={`M ${50 - g.rx + 3} ${g.top + 7} L ${50 - g.rx - 3} ${g.top - 7} L ${50 - g.rx + 14} ${g.top} Z`} fill={bodyFill} {...stroke} strokeLinejoin="round" />
            <path d={`M ${50 + g.rx - 3} ${g.top + 7} L ${50 + g.rx + 3} ${g.top - 7} L ${50 + g.rx - 14} ${g.top} Z`} fill={bodyFill} {...stroke} strokeLinejoin="round" />
          </>
        ),
        front: (
          <>
            <ellipse cx={50} cy={g.mouthY - 2} rx={9} ry={6.5} fill={P} {...stroke} />
            <ellipse cx={46.5} cy={g.mouthY - 2} rx={1.7} ry={2.6} fill={darken(P, 0.4)} />
            <ellipse cx={53.5} cy={g.mouthY - 2} rx={1.7} ry={2.6} fill={darken(P, 0.4)} />
          </>
        ),
        mouthY: -100,
      };
    case "owl":
      return {
        behind: (
          <>
            <path d={`M ${50 - g.rx + 6} ${g.top + 4} L ${50 - g.rx + 1} ${g.top - 8} L ${50 - g.rx + 15} ${g.top - 1} Z`} fill={bodyFill} {...stroke} strokeLinejoin="round" />
            <path d={`M ${50 + g.rx - 6} ${g.top + 4} L ${50 + g.rx - 1} ${g.top - 8} L ${50 + g.rx - 15} ${g.top - 1} Z`} fill={bodyFill} {...stroke} strokeLinejoin="round" />
          </>
        ),
        front: (
          <>
            <circle cx={50 - g.eyeDx} cy={g.eyeY} r={g.eyeR + 4} fill={L} stroke={darken(B, 0.2)} strokeWidth={1.6} />
            <circle cx={50 + g.eyeDx} cy={g.eyeY} r={g.eyeR + 4} fill={L} stroke={darken(B, 0.2)} strokeWidth={1.6} />
            <path d={`M 46 ${g.eyeY + 8} L 54 ${g.eyeY + 8} L 50 ${g.eyeY + 14} Z`} fill={O} stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
            <path d={`M 34 ${g.bellyCy} q 4 4 8 0 q 4 4 8 0 q 4 4 8 0 q 4 4 8 0`} fill="none" stroke={darken(B, 0.18)} strokeWidth={1.6} opacity={0.8} />
          </>
        ),
        mouthY: -100,
      };
    case "turtle":
      return {
        front: (
          <>
            <ellipse cx={50} cy={g.bellyCy} rx={g.bellyRx + 4} ry={g.bellyRy + 3} fill={Y} {...stroke} />
            <path
              d={`M ${50 - g.bellyRx - 2} ${g.bellyCy} H ${50 + g.bellyRx + 2} M 50 ${g.bellyCy - g.bellyRy - 1} V ${g.bellyCy + g.bellyRy + 1} M ${50 - g.bellyRx + 1} ${g.bellyCy - g.bellyRy + 1} L ${50 + g.bellyRx - 1} ${g.bellyCy + g.bellyRy - 1} M ${50 + g.bellyRx - 1} ${g.bellyCy - g.bellyRy + 1} L ${50 - g.bellyRx + 1} ${g.bellyCy + g.bellyRy - 1}`}
              stroke={darken(Y, 0.28)}
              strokeWidth={1.6}
              fill="none"
              opacity={0.85}
            />
          </>
        ),
      };
    /* ---- 공룡류 ---- */
    case "tyranno":
      return {
        behind: (
          <>
            {[-10, 0, 10].map((dx, i) => (
              <path key={i} d={`M ${50 + dx - 5} ${g.top + 3} L ${50 + dx} ${g.top - 9} L ${50 + dx + 5} ${g.top + 3} Z`} fill={A} {...stroke} strokeLinejoin="round" />
            ))}
          </>
        ),
        front: (
          <path d={`M 41 ${g.mouthY} h 18 l -3 4 l -3 -4 l -3 4 l -3 -4 l -3 4 Z`} fill="#fff" stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
        ),
        mouthY: -100,
      };
    case "tricera":
      return {
        behind: (
          <>
            <path d={`M 26 ${g.top + 10} Q 50 ${g.top - 16} 74 ${g.top + 10} Q 62 ${g.top + 16} 50 ${g.top + 14} Q 38 ${g.top + 16} 26 ${g.top + 10} Z`} fill={darken(B, 0.12)} {...stroke} strokeLinejoin="round" />
            <path d={`M 38 ${g.top + 6} L 34 ${g.top - 8} L 43 ${g.top + 2} Z`} fill="#f3ede0" {...stroke} strokeLinejoin="round" />
            <path d={`M 62 ${g.top + 6} L 66 ${g.top - 8} L 57 ${g.top + 2} Z`} fill="#f3ede0" {...stroke} strokeLinejoin="round" />
          </>
        ),
        front: <path d={`M 47 ${g.mouthY - 6} L 50 ${g.mouthY - 13} L 53 ${g.mouthY - 6} Z`} fill="#f3ede0" stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />,
      };
    case "stego":
      return {
        behind: (
          <>
            {[-14, -5, 4, 13].map((dx, i) => (
              <path key={i} d={`M ${50 + dx} ${g.top + 6} Q ${50 + dx + 2} ${g.top - 10} ${50 + dx + 9} ${g.top + 4} Z`} fill={A} {...stroke} strokeLinejoin="round" />
            ))}
          </>
        ),
      };
    case "brachio": {
      const bodyCy = 74;
      return {
        customBody: (
          <>
            <ellipse cx={50} cy={bodyCy} rx={26} ry={17} fill={bodyFill} {...stroke} />
            <rect x={42} y={22} width={16} height={46} rx={8} fill={bodyFill} {...stroke} />
            <circle cx={50} cy={22} r={12} fill={bodyFill} {...stroke} />
            <ellipse cx={50} cy={78} rx={14} ry={9} fill={c.L ?? "#eee"} stroke="none" />
            <ellipse cx={36} cy={89} rx={7} ry={3.5} fill={darken(B, 0.25)} stroke="none" />
            <ellipse cx={64} cy={89} rx={7} ry={3.5} fill={darken(B, 0.25)} stroke="none" />
          </>
        ),
        eyeY: 21,
        eyeDx: 5.5,
        eyeR: 3.6,
        mouthY: 28,
      };
    }
    case "ptera":
      return {
        behind: (
          <>
            <path d={`M 30 ${g.cy - 6} Q 4 ${g.cy - 22} 8 ${g.cy + 16} Q 20 ${g.cy + 10} 32 ${g.cy + 4} Z`} fill={darken(B, 0.15)} {...stroke} strokeLinejoin="round" />
            <path d={`M 70 ${g.cy - 6} Q 96 ${g.cy - 22} 92 ${g.cy + 16} Q 80 ${g.cy + 10} 68 ${g.cy + 4} Z`} fill={darken(B, 0.15)} {...stroke} strokeLinejoin="round" />
            <path d={`M 50 ${g.top + 2} Q 62 ${g.top - 10} 70 ${g.top - 2} Q 60 ${g.top + 2} 52 ${g.top + 6} Z`} fill={A} {...stroke} strokeLinejoin="round" />
          </>
        ),
        front: <path d={`M 44 ${g.mouthY - 4} L 56 ${g.mouthY - 4} L 50 ${g.mouthY + 4} Z`} fill={c.O ?? "#e8913c"} stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />,
        mouthY: -100,
      };
    /* ---- 환수종 ---- */
    case "unicorn":
      return {
        behind: (
          <>
            <path d={`M 50 ${g.top + 2} L 46.5 ${g.top - 16} L 53.5 ${g.top - 16} Z`} fill={GOLD} {...stroke} strokeLinejoin="round" transform={`rotate(180 50 ${g.top - 7})`} />
            <path d={`M ${50 - g.rx + 8} ${g.top + 2} Q ${50 - g.rx - 6} ${g.top + 10} ${50 - g.rx + 2} ${g.top + 26} Q ${50 - g.rx + 10} ${g.top + 18} ${50 - g.rx + 10} ${g.top + 6} Z`} fill={M} {...stroke} strokeLinejoin="round" />
            <path d={`M ${50 - g.rx + 12} ${g.top - 2} Q ${50 - g.rx + 2} ${g.top + 8} ${50 - g.rx + 8} ${g.top + 20}`} fill="none" stroke={darken(M, 0.2)} strokeWidth={2} strokeLinecap="round" />
          </>
        ),
      };
    case "pegasus":
      return {
        behind: (
          <>
            <path d={`M 28 ${g.cy - 8} Q 2 ${g.cy - 26} 10 ${g.cy + 10} Q 20 ${g.cy + 4} 30 ${g.cy} Z`} fill="#fff" {...stroke} strokeLinejoin="round" />
            <path d={`M 72 ${g.cy - 8} Q 98 ${g.cy - 26} 90 ${g.cy + 10} Q 80 ${g.cy + 4} 70 ${g.cy} Z`} fill="#fff" {...stroke} strokeLinejoin="round" />
            <path d={`M 12 ${g.cy - 8} Q 18 ${g.cy - 4} 26 ${g.cy - 4} M 10 ${g.cy + 2} Q 18 ${g.cy + 2} 26 ${g.cy + 2}`} fill="none" stroke="#c9cdd6" strokeWidth={1.8} />
            <path d={`M 88 ${g.cy - 8} Q 82 ${g.cy - 4} 74 ${g.cy - 4} M 90 ${g.cy + 2} Q 82 ${g.cy + 2} 74 ${g.cy + 2}`} fill="none" stroke="#c9cdd6" strokeWidth={1.8} />
            <path d={`M ${50 - g.rx + 8} ${g.top + 2} Q ${50 - g.rx - 6} ${g.top + 10} ${50 - g.rx + 2} ${g.top + 26} Q ${50 - g.rx + 10} ${g.top + 18} ${50 - g.rx + 10} ${g.top + 6} Z`} fill={M} {...stroke} strokeLinejoin="round" />
          </>
        ),
      };
    case "dragonet":
      return {
        behind: (
          <>
            <path d={`M 40 ${g.top + 2} Q 36 ${g.top - 12} 30 ${g.top - 8} Q 34 ${g.top - 2} 40 ${g.top + 4} Z`} fill={GOLD} {...stroke} strokeLinejoin="round" />
            <path d={`M 60 ${g.top + 2} Q 64 ${g.top - 12} 70 ${g.top - 8} Q 66 ${g.top - 2} 60 ${g.top + 4} Z`} fill={GOLD} {...stroke} strokeLinejoin="round" />
            <path d={`M 28 ${g.cy - 4} Q 8 ${g.cy - 16} 12 ${g.cy + 12} L 30 ${g.cy + 4} Z`} fill={c.G ?? darken(B, 0.25)} {...stroke} strokeLinejoin="round" />
            <path d={`M 72 ${g.cy - 4} Q 92 ${g.cy - 16} 88 ${g.cy + 12} L 70 ${g.cy + 4} Z`} fill={c.G ?? darken(B, 0.25)} {...stroke} strokeLinejoin="round" />
          </>
        ),
        front: (
          <g stroke={darken(Y, 0.25)} strokeWidth={1.6} fill="none" opacity={0.9}>
            <path d={`M 42 ${g.bellyCy - 6} Q 50 ${g.bellyCy - 2} 58 ${g.bellyCy - 6}`} />
            <path d={`M 42 ${g.bellyCy} Q 50 ${g.bellyCy + 4} 58 ${g.bellyCy}`} />
            <path d={`M 43 ${g.bellyCy + 6} Q 50 ${g.bellyCy + 10} 57 ${g.bellyCy + 6}`} />
          </g>
        ),
      };
    case "phoenix":
      return {
        behind: (
          <>
            {[-8, 0, 8].map((dx, i) => (
              <path key={i} d={`M ${50 + dx} ${g.top + 4} Q ${50 + dx - 4} ${g.top - 10 - (i === 1 ? 5 : 0)} ${50 + dx + 2} ${g.top - 13 - (i === 1 ? 5 : 0)} Q ${50 + dx + 5} ${g.top - 6} ${50 + dx + 3} ${g.top + 4} Z`} fill={i === 1 ? GOLD : A} {...stroke} strokeLinejoin="round" />
            ))}
            <path d={`M 28 ${g.cy - 2} Q 10 ${g.cy - 14} 14 ${g.cy + 14} Q 22 ${g.cy + 8} 30 ${g.cy + 4} Z`} fill={A} {...stroke} strokeLinejoin="round" />
            <path d={`M 72 ${g.cy - 2} Q 90 ${g.cy - 14} 86 ${g.cy + 14} Q 78 ${g.cy + 8} 70 ${g.cy + 4} Z`} fill={A} {...stroke} strokeLinejoin="round" />
          </>
        ),
        front: <path d={`M 46 ${g.mouthY - 3} L 54 ${g.mouthY - 3} L 50 ${g.mouthY + 3} Z`} fill={GOLD} stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />,
        mouthY: -100,
      };
    case "gumiho":
      return {
        behind: (
          <>
            {[-2, -1, 0, 1, 2].map((i) => (
              <ellipse
                key={i}
                cx={50}
                cy={g.cy + g.ry - 26}
                rx={7}
                ry={20}
                fill={i === 0 ? B : lighten(B, 0.12)}
                {...stroke}
                transform={`rotate(${i * 26} 50 ${g.cy + g.ry - 6})`}
              />
            ))}
            {[-2, -1, 0, 1, 2].map((i) => (
              <ellipse key={`t${i}`} cx={50} cy={g.cy + g.ry - 40} rx={4} ry={7} fill="#fff" stroke="none" transform={`rotate(${i * 26} 50 ${g.cy + g.ry - 6})`} />
            ))}
            <path d={`M ${50 - g.rx + 4} ${g.top + 8} L ${50 - g.rx - 2} ${g.top - 12} L ${50 - g.rx + 17} ${g.top} Z`} fill={bodyFill} {...stroke} strokeLinejoin="round" />
            <path d={`M ${50 + g.rx - 4} ${g.top + 8} L ${50 + g.rx + 2} ${g.top - 12} L ${50 + g.rx - 17} ${g.top} Z`} fill={bodyFill} {...stroke} strokeLinejoin="round" />
          </>
        ),
        front: (
          <>
            <ellipse cx={50} cy={g.mouthY - 2} rx={7.5} ry={5} fill="#fff" stroke="none" opacity={0.9} />
            <ellipse cx={50} cy={g.mouthY - 4} rx={2.6} ry={1.9} fill={INK} />
          </>
        ),
        mouthY: -100,
      };
    default:
      return {};
  }
}

/* ---------- 레벨 장비 (부드러운 버전) ---------- */

function levelGear(level: number): ReactNode {
  const items: ReactNode[] = [];
  if (level >= 4)
    items.push(
      <g key="antenna">
        <line x1={50} y1={20} x2={50} y2={9} stroke="#33363e" strokeWidth={2.6} strokeLinecap="round" />
        <circle cx={50} cy={7} r={4.6} fill="#d95f5f" stroke={INK} strokeWidth={1.8} />
        <circle cx={51.6} cy={5.4} r={1.4} fill="#fff" opacity={0.85} />
      </g>,
    );
  if (level >= 5) items.push(<path key="star" d={star4(50, 74, 6)} fill={GOLD} stroke={INK} strokeWidth={1.4} />);
  if (level >= 6)
    items.push(
      <g key="shoes">
        <rect x={30} y={85} width={16} height={8} rx={4} fill="#33363e" stroke={INK} strokeWidth={1.6} />
        <rect x={54} y={85} width={16} height={8} rx={4} fill="#33363e" stroke={INK} strokeWidth={1.6} />
        <rect x={32} y={86.4} width={12} height={2.2} rx={1.1} fill="#f0f0ea" />
        <rect x={56} y={86.4} width={12} height={2.2} rx={1.1} fill="#f0f0ea" />
      </g>,
    );
  if (level >= 7)
    items.push(
      <g key="scarf">
        <rect x={31} y={63} width={38} height={8} rx={4} fill="#d95f5f" stroke={INK} strokeWidth={1.8} />
        <path d={`M 58 70 q 3 8 -1 14 l 7 0 q 3 -8 0 -14 Z`} fill="#d95f5f" stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
      </g>,
    );
  if (level >= 9)
    items.push(
      <g key="bolts">
        <circle cx={17} cy={60} r={3.6} fill="#9aa5a8" stroke={INK} strokeWidth={1.4} />
        <circle cx={83} cy={60} r={3.6} fill="#9aa5a8" stroke={INK} strokeWidth={1.4} />
        <line x1={15} y1={60} x2={19} y2={60} stroke="#5a646a" strokeWidth={1.4} />
        <line x1={81} y1={60} x2={85} y2={60} stroke="#5a646a" strokeWidth={1.4} />
      </g>,
    );
  if (level >= 10)
    items.push(
      <g key="led" className="tm-twinkle">
        <circle cx={50} cy={80} r={3.8} fill="#2f4a3a" />
        <circle cx={50} cy={80} r={2.2} fill="#58d08a" />
      </g>,
    );
  if (level >= 11)
    items.push(
      <g key="band">
        <rect x={27} y={31} width={46} height={6.5} rx={3.2} fill="#58b0d0" stroke={INK} strokeWidth={1.6} />
        <circle cx={50} cy={34.2} r={3.6} fill={GOLD} stroke={INK} strokeWidth={1.4} />
      </g>,
    );
  if (level >= 12)
    items.push(
      <g key="bow">
        <path d={`M 30 26 q -8 -5 -9 2 q -1 6 7 4 Z`} fill="#e87b9d" stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
        <path d={`M 30 26 q 8 -5 9 2 q 1 6 -7 4 Z`} fill="#e87b9d" stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
        <circle cx={30} cy={28} r={2.6} fill="#d96a8c" stroke={INK} strokeWidth={1.4} />
      </g>,
    );
  if (level >= 13)
    items.push(
      <g key="goldstar">
        <path d={star4(63, 73, 7)} fill={GOLD} stroke={INK} strokeWidth={1.4} />
        <circle cx={63} cy={73} r={1.8} fill="#c0392b" />
      </g>,
    );
  if (level >= 14)
    items.push(
      <g key="aura" className="tm-twinkle">
        {[
          [12, 16],
          [88, 16],
          [10, 84],
          [90, 84],
        ].map(([x, y], i) => (
          <path key={i} d={star4(x, y, 3.4)} fill={GOLD} />
        ))}
      </g>,
    );
  if (level >= 20)
    items.push(
      <g key="crown">
        <path d={`M 36 12 L 36 2 L 43 8 L 50 0 L 57 8 L 64 2 L 64 12 Z`} fill={GOLD} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
        <circle cx={50} cy={8.6} r={2.2} fill="#c0392b" />
        <circle cx={41} cy={9.4} r={1.4} fill="#3e6dc0" />
        <circle cx={59} cy={9.4} r={1.4} fill="#3e6dc0" />
      </g>,
    );
  return <>{items}</>;
}

const SPARKLE_SPOTS: [number, number, number][] = [
  [14, 26, 5],
  [88, 52, 4.2],
  [84, 18, 3.8],
  [10, 66, 3.8],
  [50, 95, 3.4],
  [92, 84, 3.4],
];

/* ---------- 메인 렌더러 ---------- */

export function PetVector({
  shape,
  colors,
  hint,
  stage,
  level,
  eye,
  mouth,
  levelProgressPct,
  size,
  label,
}: {
  shape: string;
  colors: Palette;
  hint?: string;
  stage: TokenmonStage;
  level: number;
  eye: EyeStyle;
  mouth: "smile" | "flat" | "frown";
  levelProgressPct: number;
  size: number;
  label: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const B = colors.B ?? "#8a93a8";

  /* 알 — 매끈한 달걀 + 종족색 반점 */
  if (stage === "egg") {
    const speck = hint ?? B;
    return (
      <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={label} style={{ overflow: "visible" }}>
        <defs>
          <radialGradient id={`${uid}e`} cx="38%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#fbf6e8" />
            <stop offset="60%" stopColor="#f0e7d4" />
            <stop offset="100%" stopColor="#d9cba8" />
          </radialGradient>
        </defs>
        <ellipse cx={50} cy={92} rx={26} ry={4} fill="#20201e" opacity={0.1} />
        <path
          d="M50 16 C68 16 78 38 78 57 C78 77 65 88 50 88 C35 88 22 77 22 57 C22 38 32 16 50 16 Z"
          fill={`url(#${uid}e)`}
          stroke={INK}
          strokeWidth={2.4}
        />
        <ellipse cx={42} cy={42} rx={4.4} ry={3.2} fill={speck} opacity={0.85} />
        <ellipse cx={59} cy={52} rx={3.6} ry={2.7} fill={speck} opacity={0.85} />
        <ellipse cx={46} cy={66} rx={3} ry={2.3} fill={speck} opacity={0.85} />
        {levelProgressPct >= 60 && (
          <path d="M 40 30 L 46 36 L 41 42 L 48 47" fill="none" stroke="#8f8060" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    );
  }

  const golden = stage === "dragon";
  const g = geomFor(stage);
  const bodyFill = `url(#${uid}b)`;
  const parts = familyParts(shape, g, colors, bodyFill);
  const eyeY = parts.eyeY ?? g.eyeY;
  const eyeDx = parts.eyeDx ?? g.eyeDx;
  const eyeR = parts.eyeR ?? g.eyeR;
  const mouthY = parts.mouthY ?? g.mouthY;
  const sparkles = golden ? Math.max(0, Math.min(SPARKLE_SPOTS.length, level - 14)) : 0;

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={label} style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id={`${uid}b`} cx="38%" cy="28%" r="85%">
          <stop offset="0%" stopColor={lighten(B, 0.28)} />
          <stop offset="55%" stopColor={B} />
          <stop offset="100%" stopColor={darken(B, 0.18)} />
        </radialGradient>
      </defs>
      <ellipse cx={50} cy={92} rx={g.rx + 2} ry={4.2} fill="#20201e" opacity={0.1} />
      {golden && (
        <g className="tm-aura">
          <circle cx={50} cy={54} r={46} fill={GOLD} opacity={0.1} />
          <circle cx={50} cy={54} r={37} fill={GOLD} opacity={0.08} />
        </g>
      )}
      {golden && (
        <g>
          <path d={`M 28 40 Q 50 32 72 40 L 84 88 Q 50 97 16 88 Z`} fill="#a53434" stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
          <path d={`M 33 42 Q 50 36 67 42 L 75 85 Q 50 92 25 85 Z`} fill="#b74040" stroke="none" />
          <path d={`M 16 88 Q 50 97 84 88`} fill="none" stroke={GOLD} strokeWidth={3.4} strokeLinecap="round" />
        </g>
      )}
      {parts.behind}
      {parts.customBody ?? (
        <>
          <ellipse cx={50} cy={g.cy} rx={g.rx} ry={g.ry} fill={bodyFill} stroke={INK} strokeWidth={2.4} />
          {shape !== "penguin" && shape !== "turtle" && (
            <ellipse cx={50} cy={g.bellyCy} rx={g.bellyRx} ry={g.bellyRy} fill={colors.L ?? lighten(B, 0.5)} stroke="none" opacity={0.9} />
          )}
          <ellipse cx={38} cy={g.top + 10} rx={9} ry={5.5} fill="#fff" opacity={0.22} transform={`rotate(-18 38 ${g.top + 10})`} />
          <ellipse cx={36} cy={92 - 3.4} rx={7} ry={3.4} fill={darken(B, 0.2)} stroke={INK} strokeWidth={1.8} />
          <ellipse cx={64} cy={92 - 3.4} rx={7} ry={3.4} fill={darken(B, 0.2)} stroke={INK} strokeWidth={1.8} />
        </>
      )}
      {golden && !parts.customBody && (
        <ellipse cx={50} cy={g.cy} rx={g.rx} ry={g.ry} fill="none" stroke={GOLD} strokeWidth={2.2} opacity={0.9} />
      )}
      <Eye cx={50 - eyeDx} cy={eyeY} eye={eye} r={eyeR} />
      <Eye cx={50 + eyeDx} cy={eyeY} eye={eye} r={eyeR} />
      {level >= 3 ? (
        <g>
          <path d={star4(50 - eyeDx - 9, eyeY + 8, 3.4)} fill="#f0a0b4" opacity={0.9} />
          <path d={star4(50 + eyeDx + 9, eyeY + 8, 3.4)} fill="#f0a0b4" opacity={0.9} />
        </g>
      ) : (
        <g>
          <ellipse cx={50 - eyeDx - 8} cy={eyeY + 8} rx={4.2} ry={2.6} fill="#f0a0b4" opacity={0.55} />
          <ellipse cx={50 + eyeDx + 8} cy={eyeY + 8} rx={4.2} ry={2.6} fill="#f0a0b4" opacity={0.55} />
        </g>
      )}
      {mouthY > -50 && <Mouth cx={50} cy={mouthY} mood={mouth} />}
      {parts.front}
      {levelGear(level)}
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
