"use client";

import { useId, type ReactNode } from "react";
import type { TokenmonColor, TokenmonSpecies } from "@/lib/tokenmon";
import { GOLD, TECH, getColorInfo, getSpeciesInfo, type SpeciesParams } from "./tokenmon-species";

/**
 * 측면 실루엣 메카 렌더러 — 동물의 실제 자세(사족보행·조류·어류·착석형 등)가
 * 그대로 보이는 프로필 뷰. 장갑 판넬·관절 조인트·발광 코어·앵귤러 렌즈 눈으로
 * 메탈가루몬st 메카 감성을 입힌다. 좌표계 100×100, 바닥 y≈88, 머리는 왼쪽.
 */

export type EyeStyle = "open" | "half" | "closed";

const INK = "#262a30";
const METAL = "#b3b9c3";
const METAL_DARK = "#7f8794";

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

interface Anchors {
  top: [number, number];
  back: [number, number];
  core: [number, number];
  eye: [number, number];
  feet: [number, number][];
}

interface Ctx {
  base: string;
  dark: string;
  light: string;
  fill: string;
  p: SpeciesParams;
  eye: EyeStyle;
}

/* ---------- 공용 메카 부품 ---------- */

function MechEye({ x, y, eye, s = 1 }: { x: number; y: number; eye: EyeStyle; s?: number }) {
  if (eye === "closed")
    return <path d={`M ${x - 5 * s} ${y + 1} L ${x + 5 * s} ${y - 1}`} stroke={INK} strokeWidth={2.6} strokeLinecap="round" fill="none" />;
  const h = eye === "half" ? 0.55 : 1;
  return (
    <g>
      <path d={`M ${x - 6 * s} ${y + 1 * s} L ${x - 3 * s} ${y - 3.6 * s * h} L ${x + 5 * s} ${y - 2.6 * s * h} L ${x + 6 * s} ${y + 1.4 * s} L ${x} ${y + 3.4 * s * h} Z`} fill={INK} />
      <path d={`M ${x - 3.6 * s} ${y + 0.6 * s} L ${x - 1.8 * s} ${y - 1.8 * s * h} L ${x + 3.6 * s} ${y - 1.2 * s * h} L ${x + 3.8 * s} ${y + 1 * s} Z`} fill={TECH} opacity={0.95} />
      <circle cx={x + 2 * s} cy={y - 1 * s * h} r={0.9 * s} fill="#fff" opacity={0.9} />
    </g>
  );
}

function Joint({ x, y, r = 2.6 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={METAL} stroke={INK} strokeWidth={1.6} />
      <circle cx={x} cy={y} r={r * 0.4} fill={METAL_DARK} />
    </g>
  );
}

function Leg({ x, topY, w = 7 }: { x: number; topY: number; w?: number }) {
  return (
    <g>
      <rect x={x - w / 2} y={topY} width={w} height={88 - topY} rx={w / 2 - 0.5} fill={METAL} stroke={INK} strokeWidth={2} />
      <Joint x={x} y={(topY + 86) / 2} />
      <rect x={x - w / 2 - 1.5} y={84.5} width={w + 3} height={4.5} rx={2} fill={METAL_DARK} stroke={INK} strokeWidth={1.8} />
    </g>
  );
}

function Core({ x, y, r = 4 }: { x: number; y: number; r?: number }) {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    return `${x + Math.cos(a) * (r + 2.6)},${y + Math.sin(a) * (r + 2.6)}`;
  }).join(" ");
  return (
    <g>
      <polygon points={pts} fill={METAL} stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
      <circle cx={x} cy={y} r={r * 0.75} fill={TECH} stroke={INK} strokeWidth={1.4} />
      <circle cx={x} cy={y} r={r * 0.28} fill="#fff" opacity={0.9} />
    </g>
  );
}

function HoverRing({ cx, cy, rx }: { cx: number; cy: number; rx: number }) {
  return (
    <g className="tm-aura">
      <ellipse cx={cx} cy={cy} rx={rx} ry={3.4} fill={TECH} opacity={0.28} />
      <ellipse cx={cx} cy={cy} rx={rx * 0.62} ry={2.1} fill={TECH} opacity={0.4} />
    </g>
  );
}

function star4(cx: number, cy: number, r: number): string {
  return `M ${cx} ${cy - r} Q ${cx} ${cy} ${cx + r} ${cy} Q ${cx} ${cy} ${cx} ${cy + r} Q ${cx} ${cy} ${cx - r} ${cy} Q ${cx} ${cy} ${cx} ${cy - r} Z`;
}

/* ---------- 머즐·귀·꼬리 (사족/착석 공용) ---------- */

function muzzleOf(kind: string, hx: number, hy: number, c: Ctx): ReactNode {
  switch (kind) {
    case "wolf":
      return (
        <g>
          <path d={`M ${hx + 2} ${hy - 6.5} L ${hx - 15} ${hy - 2.5} L ${hx - 15} ${hy + 3} L ${hx + 2} ${hy + 7} Z`} fill={c.fill} {...S} />
          <rect x={hx - 16.5} y={hy - 3} width={4} height={4} rx={1.4} fill={INK} />
          <path d={`M ${hx - 13} ${hy + 3.2} L ${hx + 1} ${hy + 4.6}`} stroke={INK} strokeWidth={1.6} fill="none" />
          {c.p.extras?.includes("fang") && <path d={`M ${hx - 9} ${hy + 4} l 1.8 3.4 l 1.8 -3.1 Z`} fill="#fff" stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />}
        </g>
      );
    case "dog":
      return (
        <g>
          <path d={`M ${hx + 2} ${hy - 5.5} Q ${hx - 12} ${hy - 6} ${hx - 12} ${hy} Q ${hx - 12} ${hy + 6} ${hx + 2} ${hy + 6.5} Z`} fill={c.fill} {...S} />
          <ellipse cx={hx - 10.5} cy={hy - 1.5} rx={2.4} ry={2} fill={INK} />
        </g>
      );
    case "cat":
      return (
        <g>
          <path d={`M ${hx + 2} ${hy - 4.5} Q ${hx - 8.5} ${hy - 5} ${hx - 8.5} ${hy + 0.5} Q ${hx - 8.5} ${hy + 5} ${hx + 2} ${hy + 5.5} Z`} fill={c.fill} {...S} />
          <path d={`M ${hx - 8.5} ${hy - 0.5} l -2.4 -0.8 M ${hx - 8.5} ${hy + 1.5} l -2.4 0.8`} stroke={INK} strokeWidth={1.4} strokeLinecap="round" />
          <path d={`M ${hx - 6.5} ${hy - 1.8} l 2.4 -1 l 2.4 1`} fill="none" stroke={INK} strokeWidth={1.4} />
        </g>
      );
    case "horse":
      return (
        <g>
          <path d={`M ${hx + 3} ${hy - 7} L ${hx - 12} ${hy + 1} Q ${hx - 14} ${hy + 4} ${hx - 10} ${hy + 6} L ${hx + 3} ${hy + 7} Z`} fill={c.fill} {...S} />
          <circle cx={hx - 9.5} cy={hy + 3} r={1.2} fill={INK} />
        </g>
      );
    case "block":
      return (
        <g>
          <rect x={hx - 13} y={hy - 5} width={15} height={11} rx={3.5} fill={c.fill} {...S} />
          <circle cx={hx - 9.5} cy={hy + 1} r={1.3} fill={INK} />
        </g>
      );
    case "pig":
      return (
        <g>
          <rect x={hx - 11} y={hy - 4.5} width={13} height={10} rx={3.5} fill={c.fill} {...S} />
          <ellipse cx={hx - 11} cy={hy + 0.5} rx={3.4} ry={4.2} fill={lighten(c.base, 0.25)} {...S} strokeWidth={1.8} />
          <circle cx={hx - 12} cy={hy - 0.8} r={1} fill={darken(c.base, 0.4)} />
          <circle cx={hx - 12} cy={hy + 1.8} r={1} fill={darken(c.base, 0.4)} />
        </g>
      );
    case "croc":
      return (
        <g>
          <rect x={hx - 22} y={hy - 3} width={25} height={9} rx={3.5} fill={c.fill} {...S} />
          <path d={`M ${hx - 20} ${hy + 6} l 2.4 -2.8 l 2.4 2.8 l 2.4 -2.8 l 2.4 2.8 l 2.4 -2.8 l 2.4 2.8`} fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={hx - 19} cy={hy - 0.8} r={1.2} fill={INK} />
        </g>
      );
    case "trunk":
      return (
        <path d={`M ${hx - 4} ${hy - 2} Q ${hx - 14} ${hy + 2} ${hx - 13} ${hy + 14} Q ${hx - 13} ${hy + 20} ${hx - 8} ${hy + 20} Q ${hx - 10} ${hy + 14} ${hx - 7} ${hy + 8} Q ${hx - 5} ${hy + 3} ${hx + 2} ${hy + 4} Z`} fill={c.fill} {...S} />
      );
    default:
      return null;
  }
}

function earOf(kind: string, hx: number, hy: number, r: number, c: Ctx): ReactNode {
  const top = hy - r;
  switch (kind) {
    case "point":
      return <path d={`M ${hx - 2} ${top + 3} L ${hx + 1} ${top - 8} L ${hx + 9} ${top + 4} Z`} fill={c.fill} {...S} />;
    case "bigpoint":
      return (
        <g>
          <path d={`M ${hx - 3} ${top + 3} L ${hx - 1} ${top - 12} L ${hx + 9} ${top + 4} Z`} fill={c.fill} {...S} />
          <path d={`M ${hx - 0.5} ${top + 1} L ${hx + 0.5} ${top - 6} L ${hx + 5.5} ${top + 2} Z`} fill={c.dark} stroke="none" />
        </g>
      );
    case "round":
      return (
        <g>
          <circle cx={hx + 3} cy={top - 1} r={5.5} fill={c.fill} {...S} />
          <circle cx={hx + 3} cy={top - 1} r={2.6} fill={c.dark} stroke="none" />
        </g>
      );
    case "floppy":
      return <ellipse cx={hx + 5} cy={top + 4} rx={4.5} ry={8} fill={c.fill} {...S} transform={`rotate(28 ${hx + 5} ${top + 4})`} />;
    case "long":
      return (
        <g>
          <rect x={hx - 2} y={top - 20} width={8} height={24} rx={4} fill={c.fill} {...S} transform={`rotate(6 ${hx + 2} ${top})`} />
          <rect x={hx} y={top - 16} width={4} height={17} rx={2} fill={c.dark} stroke="none" transform={`rotate(6 ${hx + 2} ${top})`} />
        </g>
      );
    case "side":
      return <ellipse cx={hx + 8} cy={top + 4} rx={5.5} ry={3.4} fill={c.fill} {...S} transform={`rotate(18 ${hx + 8} ${top + 4})`} />;
    case "huge":
      return (
        <g>
          <ellipse cx={hx + 10} cy={hy - 2} rx={10} ry={13} fill={c.fill} {...S} />
          <ellipse cx={hx + 10} cy={hy - 2} rx={5.5} ry={8} fill={c.dark} stroke="none" />
        </g>
      );
    case "tuft":
      return (
        <g>
          <path d={`M ${hx - 1} ${top + 3} L ${hx + 1} ${top - 6} L ${hx + 8} ${top + 3} Z`} fill={c.fill} {...S} />
          <path d={`M ${hx + 1} ${top - 5} q -1 -3 1 -5`} stroke={INK} strokeWidth={1.8} fill="none" strokeLinecap="round" />
        </g>
      );
    case "fluff":
      return (
        <g fill={c.fill}>
          <circle cx={hx + 2} cy={top} r={6} {...S} />
          <circle cx={hx + 7} cy={top + 2} r={4.5} {...S} />
        </g>
      );
    case "big":
      return (
        <g>
          <circle cx={hx + 3} cy={top - 3} r={7.5} fill={c.fill} {...S} />
          <circle cx={hx + 3} cy={top - 3} r={4} fill={c.dark} stroke="none" />
        </g>
      );
    default:
      return null;
  }
}

function tailOf(kind: string, tx: number, ty: number, c: Ctx): ReactNode {
  switch (kind) {
    case "bushy":
      return <path d={`M ${tx - 3} ${ty + 3} Q ${tx + 13} ${ty - 2} ${tx + 12} ${ty - 16} Q ${tx + 5} ${ty - 13} ${tx + 2} ${ty - 5} Q ${tx - 1} ${ty} ${tx - 3} ${ty + 3} Z`} fill={c.fill} {...S} />;
    case "tipped":
      return (
        <g>
          <path d={`M ${tx - 3} ${ty + 3} Q ${tx + 14} ${ty} ${tx + 13} ${ty - 16} Q ${tx + 5} ${ty - 13} ${tx + 2} ${ty - 5} Z`} fill={c.fill} {...S} />
          <path d={`M ${tx + 9} ${ty - 9} Q ${tx + 13} ${ty - 12} ${tx + 13} ${ty - 16} Q ${tx + 9} ${ty - 14} ${tx + 7} ${ty - 11} Z`} fill="#f4f5f8" stroke="none" />
        </g>
      );
    case "up":
      return <path d={`M ${tx} ${ty} Q ${tx + 9} ${ty - 6} ${tx + 7} ${ty - 17}`} fill="none" stroke={c.base} strokeWidth={4.6} strokeLinecap="round" />;
    case "flow":
      return <path d={`M ${tx} ${ty - 2} Q ${tx + 12} ${ty} ${tx + 10} ${ty + 16} Q ${tx + 7} ${ty + 22} ${tx + 3} ${ty + 22} Q ${tx + 6} ${ty + 12} ${tx + 2} ${ty + 4} Z`} fill={c.dark} {...S} />;
    case "stub":
      return <ellipse cx={tx + 2} cy={ty} rx={3.4} ry={4.4} fill={c.fill} {...S} />;
    case "thin":
      return <path d={`M ${tx} ${ty} Q ${tx + 12} ${ty + 2} ${tx + 15} ${ty + 12}`} fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />;
    case "curl":
      return <path d={`M ${tx} ${ty} q 6 -2 6 3 q 0 4 -4 3`} fill="none" stroke={c.base} strokeWidth={3} strokeLinecap="round" />;
    case "spade":
      return (
        <g>
          <path d={`M ${tx} ${ty} Q ${tx + 13} ${ty + 2} ${tx + 16} ${ty - 8}`} fill="none" stroke={c.base} strokeWidth={4} strokeLinecap="round" />
          <path d={`M ${tx + 13} ${ty - 12} l 6 2 l -4 6 Z`} fill={c.dark} {...S} strokeWidth={1.8} />
        </g>
      );
    case "spike":
      return (
        <g>
          <path d={`M ${tx - 2} ${ty - 3} Q ${tx + 16} ${ty - 1} ${tx + 19} ${ty + 7}`} fill="none" stroke={c.base} strokeWidth={6} strokeLinecap="round" />
          <path d={`M ${tx + 14} ${ty + 1} l 3 -5 l 2 5 Z M ${tx + 18} ${ty + 5} l 4 -4 l 1 5 Z`} fill={METAL} stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
        </g>
      );
    case "thick":
      return <path d={`M ${tx - 2} ${ty - 4} Q ${tx + 16} ${ty} ${tx + 20} ${ty + 10} L ${tx + 12} ${ty + 12} Q ${tx + 6} ${ty + 4} ${tx - 2} ${ty + 4} Z`} fill={c.fill} {...S} />;
    case "tuftTail":
      return (
        <g>
          <path d={`M ${tx} ${ty} Q ${tx + 10} ${ty - 4} ${tx + 9} ${ty - 14}`} fill="none" stroke={c.base} strokeWidth={2.8} strokeLinecap="round" />
          <circle cx={tx + 9} cy={ty - 16} r={3.4} fill={c.dark} {...S} strokeWidth={1.6} />
        </g>
      );
    case "ring":
      return (
        <g>
          <path d={`M ${tx - 2} ${ty + 2} Q ${tx + 14} ${ty} ${tx + 13} ${ty - 15}`} fill="none" stroke={c.base} strokeWidth={6} strokeLinecap="round" />
          <path d={`M ${tx + 7} ${ty - 4} l 6 -1 M ${tx + 9} ${ty - 9} l 5.5 -1`} stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
        </g>
      );
    case "flat":
      return <path d={`M ${tx - 2} ${ty} Q ${tx + 14} ${ty + 2} ${tx + 18} ${ty + 8} Q ${tx + 12} ${ty + 12} ${tx + 4} ${ty + 8} Z`} fill={c.dark} {...S} />;
    case "bigbush":
      return (
        <g>
          <path d={`M ${tx - 4} ${ty + 4} Q ${tx + 16} ${ty + 2} ${tx + 14} ${ty - 22} Q ${tx + 10} ${ty - 34} ${tx - 2} ${ty - 30} Q ${tx + 6} ${ty - 22} ${tx + 4} ${ty - 12} Q ${tx + 2} ${ty - 4} ${tx - 4} ${ty + 4} Z`} fill={c.fill} {...S} />
          <path d={`M ${tx + 7} ${ty - 8} Q ${tx + 10} ${ty - 16} ${tx + 6} ${ty - 24}`} fill="none" stroke={c.dark} strokeWidth={2} strokeLinecap="round" />
        </g>
      );
    case "puff":
      return <circle cx={tx + 3} cy={ty} r={4.4} fill="#f4f5f8" {...S} strokeWidth={1.8} />;
    case "spiral":
      return <path d={`M ${tx} ${ty} q 10 2 9 8 q -1 5 -6 4 q -4 -1 -3 -5`} fill="none" stroke={c.base} strokeWidth={3.4} strokeLinecap="round" />;
    default:
      return null;
  }
}

/* ---------- 부가 요소 ---------- */

function extrasOf(extras: readonly string[] | undefined, layer: "behind" | "front", box: { hx: number; hy: number; hr: number; bx: number; by: number; bw: number }, c: Ctx): ReactNode {
  if (!extras?.length) return null;
  const { hx, hy, hr, bx, by, bw } = box;
  const out: ReactNode[] = [];
  for (const e of extras) {
    if (layer === "behind") {
      if (e === "mane")
        out.push(
          <g key={e} fill={c.dark}>
            {[0, 1, 2, 3].map((i) => (
              <path key={i} d={`M ${hx + 4 + i * 3} ${hy - hr + 2 + i * 4} L ${hx + 12 + i * 3} ${hy - hr - 6 + i * 4} L ${hx + 13 + i * 3} ${hy - hr + 6 + i * 4} Z`} {...S} strokeWidth={1.8} />
            ))}
          </g>,
        );
      if (e === "antler")
        out.push(
          <g key={e} fill="none" stroke="#9c8862" strokeWidth={3} strokeLinecap="round">
            <path d={`M ${hx + 2} ${hy - hr + 1} Q ${hx + 1} ${hy - hr - 12} ${hx + 8} ${hy - hr - 16} M ${hx + 2} ${hy - hr - 7} L ${hx - 4} ${hy - hr - 12}`} />
          </g>,
        );
      if (e === "hornsBack") out.push(<path key={e} d={`M ${hx + 3} ${hy - hr + 2} Q ${hx + 9} ${hy - hr - 10} ${hx + 16} ${hy - hr - 8} Q ${hx + 10} ${hy - hr - 2} ${hx + 8} ${hy - hr + 4} Z`} fill="#d8d2c2" {...S} />);
      if (e === "hornsSmall") out.push(<path key={e} d={`M ${hx + 2} ${hy - hr + 2} q -1 -7 4 -8 q 2 4 0 8 Z`} fill="#e8e2d2" {...S} strokeWidth={1.8} />);
      if (e === "horn3")
        out.push(
          <g key={e} fill="#eee7d8" {...S} strokeWidth={1.8}>
            <path d={`M ${hx - 2} ${hy - hr + 2} L ${hx} ${hy - hr - 9} L ${hx + 5} ${hy - hr + 2} Z`} />
            <path d={`M ${hx + 6} ${hy - hr + 3} L ${hx + 9} ${hy - hr - 6} L ${hx + 12} ${hy - hr + 4} Z`} />
          </g>,
        );
      if (e === "hornSpiral")
        out.push(
          <g key={e}>
            <path d={`M ${hx - 2} ${hy - hr + 2} L ${hx + 1} ${hy - hr - 13} L ${hx + 5} ${hy - hr + 2} Z`} fill={GOLD} {...S} strokeWidth={1.8} />
            <path d={`M ${hx - 0.5} ${hy - hr - 3} l 4 -1.4 M ${hx + 0.5} ${hy - hr - 7} l 3 -1`} stroke={darken(GOLD, 0.3)} strokeWidth={1.3} />
          </g>,
        );
      if (e === "frill") out.push(<path key={e} d={`M ${hx + 2} ${hy - hr - 4} Q ${hx + 16} ${hy - hr - 10} ${hx + 20} ${hy + 4} Q ${hx + 12} ${hy + 8} ${hx + 4} ${hy + 4} Z`} fill={c.dark} {...S} />);
      if (e === "wool")
        out.push(
          <g key={e} fill="#f2f0ea" {...S} strokeWidth={1.8}>
            {[0, 1, 2, 3].map((i) => (
              <circle key={i} cx={bx + 6 + i * 10} cy={by - 4 - (i % 2) * 3} r={6.5} />
            ))}
          </g>,
        );
      if (e === "plates")
        out.push(
          <g key={e} fill={c.dark} {...S} strokeWidth={1.8}>
            {[0, 1, 2, 3].map((i) => (
              <path key={i} d={`M ${bx + 4 + i * 11} ${by - 1} Q ${bx + 9 + i * 11} ${by - 14} ${bx + 14 + i * 11} ${by - 2} Z`} />
            ))}
          </g>,
        );
      if (e === "ridges")
        out.push(
          <g key={e} fill={c.dark} {...S} strokeWidth={1.6}>
            {[0, 1, 2, 3, 4].map((i) => (
              <path key={i} d={`M ${bx + 6 + i * 9} ${by} Q ${bx + 10 + i * 9} ${by - 6} ${bx + 14 + i * 9} ${by} Z`} />
            ))}
          </g>,
        );
      if (e === "wings")
        out.push(
          <path key={e} d={`M ${bx + bw * 0.35} ${by - 2} Q ${bx + bw * 0.15} ${by - 26} ${bx + bw * 0.7} ${by - 22} Q ${bx + bw * 0.95} ${by - 19} ${bx + bw * 0.8} ${by - 2} L ${bx + bw * 0.62} ${by - 8} Z`} fill={c.p.extras?.includes("mane") ? "#f4f5f8" : c.dark} {...S} />,
        );
      if (e === "ninetails")
        out.push(
          <g key={e}>
            {[0, 1, 2, 3, 4].map((i) => (
              <g key={i} transform={`rotate(${-10 + i * 16} ${bx + bw - 4} ${by + 10})`}>
                <path d={`M ${bx + bw - 6} ${by + 8} Q ${bx + bw + 12} ${by} ${bx + bw + 16} ${by - 18} Q ${bx + bw + 6} ${by - 14} ${bx + bw + 2} ${by - 2} Z`} fill={c.fill} {...S} strokeWidth={1.8} />
                <path d={`M ${bx + bw + 11} ${by - 11} Q ${bx + bw + 15} ${by - 15} ${bx + bw + 16} ${by - 18} Q ${bx + bw + 12} ${by - 17} ${bx + bw + 10} ${by - 14} Z`} fill="#f4f5f8" stroke="none" />
              </g>
            ))}
          </g>,
        );
    } else {
      if (e === "stripes")
        out.push(
          <g key={e} fill={darken(c.base, 0.45)} opacity={0.9}>
            {[0, 1, 2].map((i) => (
              <path key={i} d={`M ${bx + 10 + i * 12} ${by + 2} q 3 6 0 12 l 4 0 q 3 -6 0 -12 Z`} />
            ))}
          </g>,
        );
      if (e === "spots")
        out.push(
          <g key={e} fill={darken(c.base, 0.4)} opacity={0.8}>
            <ellipse cx={bx + 12} cy={by + 8} rx={3.6} ry={2.8} />
            <ellipse cx={bx + 26} cy={by + 13} rx={3} ry={2.4} />
            <ellipse cx={bx + 36} cy={by + 6} rx={2.6} ry={2} />
          </g>,
        );
      if (e === "tear") out.push(<path key={e} d={`M ${hx - 2} ${hy + 3} q -1 3 -3 5`} fill="none" stroke={darken(c.base, 0.45)} strokeWidth={1.8} strokeLinecap="round" />);
      if (e === "whiskers")
        out.push(
          <g key={e} stroke={INK} strokeWidth={1.2} strokeLinecap="round" opacity={0.75}>
            <path d={`M ${hx - 6} ${hy + 2} l -7 1 M ${hx - 6} ${hy + 4.5} l -6.5 3`} />
          </g>,
        );
      if (e === "beard") out.push(<path key={e} d={`M ${hx - 8} ${hy + 5} q 1 6 4 7 q 1 -4 0.5 -7 Z`} fill="#f2f0ea" {...S} strokeWidth={1.6} />);
    }
  }
  return <g>{out}</g>;
}

/* ---------- 리그들 ---------- */

interface RigOut {
  jsx: ReactNode;
  a: Anchors;
}

function rigQuad(c: Ctx): RigOut {
  const low = !!c.p.low;
  const longNeck = !!c.p.longNeck;
  const by = low ? 56 : 46; // 몸 윗면
  const bh = low ? 18 : 24;
  const bx = low ? 26 : 30;
  const bw = low ? 54 : 48;
  const hx = longNeck ? 27 : 24;
  const hy = longNeck ? 20 : low ? 52 : 34;
  const hr = longNeck ? 8 : 11;
  const legTop = by + bh - 6;
  const eyePos: [number, number] = [hx + 2, hy - 1.5];

  const jsx = (
    <g>
      {tailOf(c.p.tail ?? "up", bx + bw - 2, by + 8, c)}
      {extrasOf(c.p.extras, "behind", { hx, hy, hr, bx, by, bw }, c)}
      <Leg x={bx + bw - 8} topY={legTop} />
      <Leg x={bx + 10} topY={legTop} />
      {/* 뒷다리 장갑 허벅지 */}
      <circle cx={bx + bw - 9} cy={by + bh - 5} r={11} fill={METAL} stroke={INK} strokeWidth={2.2} />
      <path d={`M ${bx + bw - 16} ${by + bh - 9} a 9 9 0 0 1 13 -2`} fill="none" stroke={METAL_DARK} strokeWidth={1.8} />
      <Leg x={bx + bw - 3} topY={legTop + 2} />
      <Leg x={bx + 17} topY={legTop + 2} />
      {/* 목 — 머리와 몸을 잇는 두꺼운 캡슐 (잉크 외곽 + 몸색) */}
      {longNeck ? (
        <rect x={hx - 4} y={hy} width={11} height={by - hy + 8} rx={5} fill={c.fill} {...S} strokeWidth={2.2} />
      ) : (
        <g>
          <line x1={hx + 3} y1={hy + 2} x2={bx + 13} y2={by + 10} stroke={INK} strokeWidth={17} strokeLinecap="round" />
          <line x1={hx + 3} y1={hy + 2} x2={bx + 13} y2={by + 10} stroke={c.base} strokeWidth={12.5} strokeLinecap="round" />
        </g>
      )}
      {/* 몸통 */}
      <rect x={bx} y={by} width={bw} height={bh} rx={low ? 9 : 12} fill={c.fill} {...S} strokeWidth={2.4} />
      {/* 등 장갑 밴드 + 심선 */}
      <path d={`M ${bx + 4} ${by + 5} Q ${bx + bw / 2} ${by - 1} ${bx + bw - 4} ${by + 5}`} fill="none" stroke={METAL_DARK} strokeWidth={2.4} opacity={0.8} />
      <path d={`M ${bx + 10} ${by + bh - 4} L ${bx + bw - 10} ${by + bh - 4}`} stroke={darken(c.base, 0.3)} strokeWidth={1.4} opacity={0.6} />
      {/* 어깨 장갑 */}
      <circle cx={bx + 11} cy={by + 9} r={8} fill={METAL} stroke={INK} strokeWidth={2} />
      <circle cx={bx + 11} cy={by + 9} r={3.2} fill={METAL_DARK} />
      {earOf(c.p.ear ?? "point", hx, hy, hr, c)}
      <circle cx={hx} cy={hy} r={hr} fill={c.fill} {...S} strokeWidth={2.4} />
      {muzzleOf(c.p.muzzle ?? "wolf", hx - hr + 3, hy + 1, c)}
      <MechEye x={eyePos[0]} y={eyePos[1]} eye={c.eye} />
      {extrasOf(c.p.extras, "front", { hx, hy, hr, bx, by, bw }, c)}
      <Core x={bx + bw / 2 + 2} y={by + bh / 2 + 1} />
    </g>
  );
  return {
    jsx,
    a: { top: [hx + 2, hy - hr - (c.p.ear && c.p.ear !== "none" ? 10 : 2)], back: [bx + bw / 2 + 6, by - 2], core: [bx + bw / 2 + 2, by + bh / 2 + 1], eye: eyePos, feet: [[bx + 13, 84], [bx + bw - 6, 84]] },
  };
}

function rigSit(c: Ctx): RigOut {
  const chunky = c.p.extras?.includes("chunky");
  const hx = 40;
  const hy = 34;
  const hr = chunky ? 13 : 12;
  const bx = 30;
  const by = 46;
  const bw = 34;
  const eyePos: [number, number] = [hx - 3, hy - 1];

  const jsx = (
    <g>
      {tailOf(c.p.tail ?? "stub", 62, 66, c)}
      {c.p.tail === "curlLong" && <path d={`M 62 66 Q 78 62 78 48 Q 78 40 71 41`} fill="none" stroke={c.base} strokeWidth={3.4} strokeLinecap="round" />}
      {extrasOf(c.p.extras, "behind", { hx, hy, hr, bx, by, bw }, c)}
      {c.p.extras?.includes("spikes") && (
        <g fill={METAL} stroke={INK} strokeWidth={1.8} strokeLinejoin="round">
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={i} d={`M ${42 + i * 7} ${44 - (i % 2) * 3} L ${48 + i * 7} ${30 - (i % 2) * 4} L ${52 + i * 7} ${46 - (i % 2) * 3} Z`} />
          ))}
        </g>
      )}
      {/* 엉덩이·몸 */}
      <circle cx={56} cy={66} r={chunky ? 17 : 15} fill={c.fill} {...S} strokeWidth={2.4} />
      <ellipse cx={44} cy={58} rx={chunky ? 17 : 15} ry={19} fill={c.fill} {...S} strokeWidth={2.4} />
      {/* 배 플레이트 */}
      <ellipse cx={42} cy={64} rx={9} ry={11} fill={lighten(c.base, 0.42)} stroke="none" />
      {/* 앞발 */}
      <rect x={31} y={68} width={6.5} height={18} rx={3.2} fill={METAL} stroke={INK} strokeWidth={1.8} />
      <rect x={40} y={70} width={6.5} height={16} rx={3.2} fill={METAL} stroke={INK} strokeWidth={1.8} />
      <Joint x={34} y={77} r={2.2} />
      <Joint x={43} y={78} r={2.2} />
      {/* 뒷발 패드 */}
      <ellipse cx={60} cy={85} rx={10} ry={3.8} fill={METAL_DARK} stroke={INK} strokeWidth={1.8} />
      {/* 머리 */}
      {earOf(c.p.ear ?? "round", hx - 4, hy, hr, c)}
      <circle cx={hx} cy={hy} r={hr} fill={c.fill} {...S} strokeWidth={2.4} />
      {c.p.extras?.includes("patch") && <ellipse cx={hx - 4} cy={hy - 1} rx={5.5} ry={6.5} fill={darken(c.base, 0.45)} opacity={0.85} transform={`rotate(-12 ${hx - 4} ${hy - 1})`} />}
      {c.p.extras?.includes("mask") && <path d={`M ${hx - hr + 1} ${hy - 4} Q ${hx} ${hy - 7} ${hx + hr - 1} ${hy - 4} L ${hx + hr - 2} ${hy + 3} Q ${hx} ${hy + 6} ${hx - hr + 2} ${hy + 3} Z`} fill={darken(c.base, 0.45)} opacity={0.85} />}
      {c.p.extras?.includes("facePatch") && <ellipse cx={hx - 3} cy={hy + 1} rx={7.5} ry={8.5} fill={lighten(c.base, 0.4)} stroke="none" />}
      {c.p.extras?.includes("frogEyes") && (
        <g>
          <circle cx={hx - 6} cy={hy - hr + 1} r={5.5} fill={c.fill} {...S} strokeWidth={2} />
        </g>
      )}
      {c.p.extras?.includes("coneEye") && <circle cx={eyePos[0]} cy={eyePos[1]} r={7} fill="none" stroke={darken(c.base, 0.3)} strokeWidth={2.2} />}
      {/* 주둥이·코 */}
      {c.p.extras?.includes("bignose") ? (
        <ellipse cx={hx - 8} cy={hy + 3} rx={4.4} ry={5.6} fill={INK} />
      ) : (
        <g>
          <ellipse cx={hx - 7} cy={hy + 4.5} rx={5} ry={4} fill={lighten(c.base, 0.42)} stroke="none" />
          <ellipse cx={hx - 9} cy={hy + 2.6} rx={2} ry={1.6} fill={INK} />
        </g>
      )}
      {c.p.extras?.includes("cheek") && <circle cx={hx + 2} cy={hy + 6} r={5} fill={lighten(c.base, 0.3)} stroke="none" opacity={0.95} />}
      {c.p.extras?.includes("teeth") && <rect x={hx - 8.5} y={hy + 7.5} width={4.4} height={4.2} rx={1.2} fill="#fff" stroke={INK} strokeWidth={1.4} />}
      <MechEye x={c.p.extras?.includes("frogEyes") ? hx - 6 : eyePos[0]} y={c.p.extras?.includes("frogEyes") ? hy - hr + 1 : eyePos[1]} eye={c.eye} s={0.95} />
      {extrasOf(c.p.extras, "front", { hx: hx - 4, hy, hr, bx, by, bw }, c)}
      <Core x={44} y={64} r={3.4} />
    </g>
  );
  return {
    jsx,
    a: { top: [hx - 2, hy - hr - (c.p.ear === "long" ? 20 : 8)], back: [56, 44], core: [44, 64], eye: eyePos, feet: [[36, 85], [58, 85]] },
  };
}

function rigBird(c: Ctx): RigOut {
  const upright = c.p.extras?.includes("upright");
  const longNeck = !!c.p.longNeck;
  const hx = longNeck ? 28 : upright ? 44 : 36;
  const hy = longNeck ? 22 : upright ? 32 : 36;
  const hr = longNeck ? 7 : upright ? 11 : 9;
  const bcx = upright ? 46 : 50;
  const bcy = upright ? 58 : 58;
  const eyePos: [number, number] = [hx - 1, hy - 1];

  const jsx = (
    <g>
      {/* 꼬리깃 */}
      {c.p.extras?.includes("fanTail") ? (
        <g>
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i} transform={`rotate(${-34 + i * 15} ${bcx + 12} ${bcy})`}>
              <ellipse cx={bcx + 26} cy={bcy - 2} rx={13} ry={4.4} fill={c.dark} {...S} strokeWidth={1.8} />
              <circle cx={bcx + 32} cy={bcy - 2} r={2.6} fill={TECH} stroke={INK} strokeWidth={1.4} />
            </g>
          ))}
        </g>
      ) : c.p.extras?.includes("flameTail") ? (
        <g fill="#d96a3c" {...S} strokeWidth={1.8}>
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M ${bcx + 12} ${bcy + i * 4 - 2} Q ${bcx + 30} ${bcy + i * 6 - 6} ${bcx + 34} ${bcy + i * 8 + 2} Q ${bcx + 24} ${bcy + i * 6 + 4} ${bcx + 12} ${bcy + i * 4 + 3} Z`} fill={i === 1 ? GOLD : "#d96a3c"} />
          ))}
        </g>
      ) : (
        <g fill={c.dark} {...S} strokeWidth={1.8}>
          <path d={`M ${bcx + 10} ${bcy - 2} L ${bcx + 26} ${bcy + 2} L ${bcx + 24} ${bcy + 8} L ${bcx + 10} ${bcy + 6} Z`} />
          <path d={`M ${bcx + 10} ${bcy + 2} L ${bcx + 23} ${bcy + 10} L ${bcx + 10} ${bcy + 9} Z`} />
        </g>
      )}
      {/* 다리 */}
      {!c.p.extras?.includes("oneLeg") && (
        <g>
          <line x1={bcx - 2} y1={bcy + 12} x2={bcx - 2} y2={86} stroke={INK} strokeWidth={3} strokeLinecap="round" />
          <Joint x={bcx - 2} y={78} r={2} />
        </g>
      )}
      <line x1={bcx + 6} y1={bcy + 12} x2={bcx + 6} y2={86} stroke={INK} strokeWidth={3} strokeLinecap="round" />
      <Joint x={bcx + 6} y={78} r={2} />
      <path d={`M ${bcx - 7} 86 L ${bcx + 12} 86`} stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
      {/* 몸 */}
      {upright ? (
        <ellipse cx={bcx} cy={bcy} rx={14} ry={19} fill={c.fill} {...S} strokeWidth={2.4} />
      ) : (
        <ellipse cx={bcx} cy={bcy} rx={17} ry={13} fill={c.fill} {...S} strokeWidth={2.4} transform={`rotate(-12 ${bcx} ${bcy})`} />
      )}
      {c.p.extras?.includes("belly") && <ellipse cx={bcx - 2} cy={bcy + 3} rx={8.5} ry={13} fill="#f4f5f8" stroke="none" />}
      {/* 접힌 날개 장갑 패널 */}
      <path d={`M ${bcx - 8} ${bcy - 6} Q ${bcx + 12} ${bcy - 10} ${bcx + 14} ${bcy + 2} Q ${bcx + 4} ${bcy + 8} ${bcx - 6} ${bcy + 3} Z`} fill={METAL} stroke={INK} strokeWidth={2} />
      <path d={`M ${bcx - 3} ${bcy - 3} Q ${bcx + 7} ${bcy - 5} ${bcx + 10} ${bcy + 1} M ${bcx - 4} ${bcy + 1} Q ${bcx + 4} ${bcy - 1} ${bcx + 8} ${bcy + 3}`} fill="none" stroke={METAL_DARK} strokeWidth={1.4} />
      {/* 목·머리 */}
      {longNeck && <path d={`M ${hx - 3} ${hy + 4} Q ${hx - 5} ${hy + 18} ${bcx - 10} ${bcy - 4} L ${bcx - 2} ${bcy + 4} Q ${hx + 5} ${hy + 20} ${hx + 4} ${hy + 5} Z`} fill={c.fill} {...S} strokeWidth={2.2} />}
      {!longNeck && !upright && (
        <g>
          <line x1={hx + 2} y1={hy + 3} x2={bcx - 4} y2={bcy - 2} stroke={INK} strokeWidth={13} strokeLinecap="round" />
          <line x1={hx + 2} y1={hy + 3} x2={bcx - 4} y2={bcy - 2} stroke={c.base} strokeWidth={9} strokeLinecap="round" />
        </g>
      )}
      <circle cx={hx} cy={hy} r={hr} fill={c.fill} {...S} strokeWidth={2.4} />
      {c.p.extras?.includes("discs") && <circle cx={eyePos[0]} cy={eyePos[1]} r={hr * 0.7} fill={lighten(c.base, 0.42)} stroke={darken(c.base, 0.2)} strokeWidth={1.6} />}
      {c.p.extras?.includes("tufts") && <path d={`M ${hx - 6} ${hy - hr + 2} L ${hx - 8} ${hy - hr - 6} L ${hx - 1} ${hy - hr + 1} Z`} fill={c.fill} {...S} strokeWidth={1.8} />}
      {c.p.extras?.includes("crest3") && (
        <g fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round">
          <path d={`M ${hx - 3} ${hy - hr} q -2 -5 1 -7 M ${hx + 1} ${hy - hr - 1} q 0 -6 3 -7 M ${hx + 4} ${hy - hr} q 3 -4 6 -3`} />
        </g>
      )}
      {c.p.extras?.includes("crestTall") && <path d={`M ${hx - 2} ${hy - hr + 1} Q ${hx - 4} ${hy - hr - 12} ${hx + 5} ${hy - hr - 10} Q ${hx + 8} ${hy - hr - 2} ${hx + 4} ${hy - hr + 2} Z`} fill={c.dark} {...S} strokeWidth={1.8} />}
      {c.p.extras?.includes("tuftHead") && <path d={`M ${hx - 2} ${hy - hr} q -3 -5 1 -8 M ${hx + 2} ${hy - hr} q 2 -5 5 -5`} fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />}
      {c.p.extras?.includes("flameCrest") && (
        <g fill="#d96a3c" {...S} strokeWidth={1.6}>
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M ${hx - 4 + i * 4} ${hy - hr + 2} Q ${hx - 6 + i * 4} ${hy - hr - 8 - (i === 1 ? 4 : 0)} ${hx - 1 + i * 4} ${hy - hr - 10 - (i === 1 ? 4 : 0)} Q ${hx + 1 + i * 4} ${hy - hr - 4} ${hx + i * 4} ${hy - hr + 2} Z`} fill={i === 1 ? GOLD : "#d96a3c"} />
          ))}
        </g>
      )}
      {c.p.extras?.includes("curl") && <path d={`M ${hx - 1} ${hy - hr} Q ${hx + 2} ${hy - hr - 7} ${hx + 7} ${hy - hr - 4}`} fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />}
      {c.p.extras?.includes("brow") && <line x1={hx - 6} y1={hy - hr + 2} x2={hx + 3} y2={hy - hr + 4.5} stroke={INK} strokeWidth={2.4} strokeLinecap="round" />}
      {/* 부리 */}
      {c.p.beak === "flat" && (
        <g>
          <ellipse cx={hx - hr - 3} cy={hy + 1} rx={6} ry={3.2} fill="#d98a3a" {...S} strokeWidth={1.8} />
          <ellipse cx={hx - hr - 2} cy={hy + 3.6} rx={4} ry={2} fill="#b56d24" {...S} strokeWidth={1.6} />
        </g>
      )}
      {c.p.beak === "tiny" && <path d={`M ${hx - hr + 1} ${hy - 1} L ${hx - hr - 5} ${hy + 1} L ${hx - hr + 1} ${hy + 3} Z`} fill="#d98a3a" {...S} strokeWidth={1.6} />}
      {c.p.beak === "tri" && <path d={`M ${hx - hr + 2} ${hy - 2} L ${hx - hr - 6} ${hy + 1.5} L ${hx - hr + 2} ${hy + 5} Z`} fill="#d98a3a" {...S} strokeWidth={1.8} />}
      {c.p.beak === "hook" && <path d={`M ${hx - hr + 2} ${hy - 3} Q ${hx - hr - 7} ${hy - 3} ${hx - hr - 6} ${hy + 2} Q ${hx - hr - 6} ${hy + 5} ${hx - hr - 2} ${hy + 4} L ${hx - hr + 2} ${hy + 4} Z`} fill="#c8872f" {...S} strokeWidth={1.8} />}
      {c.p.beak === "sharp" && <path d={`M ${hx - hr + 2} ${hy - 2.5} L ${hx - hr - 9} ${hy + 1} L ${hx - hr + 2} ${hy + 4} Z`} fill="#3f434c" {...S} strokeWidth={1.8} />}
      {c.p.beak === "bent" && <path d={`M ${hx - hr + 2} ${hy - 2} Q ${hx - hr - 6} ${hy - 2} ${hx - hr - 6} ${hy + 3} Q ${hx - hr - 6} ${hy + 7} ${hx - hr - 2} ${hy + 7} L ${hx - hr - 2} ${hy + 3} Z`} fill="#e8a0a8" {...S} strokeWidth={1.8} />}
      <MechEye x={eyePos[0]} y={eyePos[1]} eye={c.eye} s={0.85} />
      <Core x={bcx + 1} y={bcy + (upright ? 8 : 4)} r={3.2} />
    </g>
  );
  return {
    jsx,
    a: { top: [hx, hy - hr - 6], back: [bcx + 4, bcy - (upright ? 18 : 12)], core: [bcx + 1, bcy + (upright ? 8 : 4)], eye: eyePos, feet: [[bcx - 2, 86], [bcx + 6, 86]] },
  };
}

function rigFish(c: Ctx): RigOut {
  const round = c.p.extras?.includes("roundBody");
  const wide = c.p.extras?.includes("wide");
  const upright = c.p.extras?.includes("upright");
  const eyePos: [number, number] = upright ? [42, 34] : [31, 52];

  if (upright) {
    /* 해마 */
    const jsx = (
      <g>
        <HoverRing cx={50} cy={84} rx={16} />
        <path d={`M 44 26 Q 58 28 58 44 Q 58 58 50 64 Q 44 68 46 74 Q 48 80 44 82 Q 36 84 38 74 Q 40 66 44 60 Q 48 54 46 44 Q 45 36 40 34 Q 38 28 44 26 Z`} fill={c.fill} {...S} strokeWidth={2.4} />
        {c.p.extras?.includes("finBack") && <path d={`M 56 40 Q 66 42 64 52 Q 58 52 55 48 Z`} fill={c.dark} {...S} strokeWidth={1.8} />}
        <g stroke={darken(c.base, 0.3)} strokeWidth={1.4} opacity={0.7}>
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d={`M ${45 - i} ${46 + i * 7} q 4 1.5 7 0`} fill="none" />
          ))}
        </g>
        {c.p.extras?.includes("tube") && <rect x={26} y={31} width={14} height={5} rx={2.5} fill={darken(c.base, 0.15)} {...S} strokeWidth={1.8} />}
        <circle cx={44} cy={33} r={8} fill={c.fill} {...S} strokeWidth={2.2} />
        <MechEye x={eyePos[0]} y={eyePos[1]} eye={c.eye} s={0.8} />
        <Core x={50} y={52} r={3} />
      </g>
    );
    return { jsx, a: { top: [44, 22], back: [58, 40], core: [50, 52], eye: eyePos, feet: [] } };
  }

  const rx = round ? 19 : wide ? 30 : 26;
  const ry = round ? 17 : wide ? 11 : 14;
  const bcy = wide ? 60 : 55;
  const jsx = (
    <g>
      <HoverRing cx={50} cy={84} rx={24} />
      {/* 꼬리 */}
      {c.p.extras?.includes("flowTail") ? (
        <g fill={lighten(c.base, 0.2)} {...S} strokeWidth={1.8}>
          <path d={`M ${48 + rx - 4} ${bcy - 2} Q ${86} ${bcy - 14} ${88} ${bcy - 2} Q ${80} ${bcy + 2} ${48 + rx} ${bcy + 2} Z`} />
          <path d={`M ${48 + rx - 4} ${bcy + 2} Q ${86} ${bcy + 10} ${84} ${bcy + 16} Q ${74} ${bcy + 12} ${48 + rx - 2} ${bcy + 6} Z`} />
        </g>
      ) : c.p.extras?.includes("whipTail") ? (
        <path d={`M ${48 + rx - 2} ${bcy} Q 90 ${bcy + 4} 94 ${bcy + 14}`} fill="none" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
      ) : (
        <path d={`M ${48 + rx - 3} ${bcy} L ${48 + rx + 12} ${bcy - 10} L ${48 + rx + 9} ${bcy} L ${48 + rx + 12} ${bcy + 10} Z`} fill={c.fill} {...S} strokeWidth={2.2} />
      )}
      {/* 몸 */}
      {c.p.extras?.includes("sharpNose") ? (
        <path d={`M ${48 - rx - 6} ${bcy + 1} Q ${48 - rx + 4} ${bcy - ry - 2} ${52} ${bcy - ry} Q ${48 + rx} ${bcy - ry + 4} ${48 + rx} ${bcy} Q ${48 + rx} ${bcy + ry - 2} ${50} ${bcy + ry} Q ${48 - rx + 6} ${bcy + ry - 2} ${48 - rx - 6} ${bcy + 1} Z`} fill={c.fill} {...S} strokeWidth={2.4} />
      ) : (
        <ellipse cx={48} cy={bcy} rx={rx} ry={ry} fill={c.fill} {...S} strokeWidth={2.4} />
      )}
      {c.p.extras?.includes("belly") && <path d={`M ${48 - rx + 4} ${bcy + 3} Q 48 ${bcy + ry + 1} ${48 + rx - 6} ${bcy + 4} Q 48 ${bcy + ry - 1} ${48 - rx + 4} ${bcy + 3} Z`} fill="#f4f5f8" stroke="none" />}
      {c.p.extras?.includes("orcaPatch") && <ellipse cx={36} cy={bcy - 7} rx={4.6} ry={2.8} fill="#f4f5f8" transform={`rotate(-16 36 ${bcy - 7})`} />}
      {/* 등지느러미 장갑 */}
      {c.p.extras?.includes("dorsalBig") ? (
        <path d={`M 42 ${bcy - ry + 2} Q 46 ${bcy - ry - 15} 58 ${bcy - ry - 11} Q 52 ${bcy - ry - 3} 54 ${bcy - ry + 3} Z`} fill={METAL} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      ) : (
        !round && !wide && <path d={`M 44 ${bcy - ry + 2} Q 48 ${bcy - ry - 8} 56 ${bcy - ry - 5} Q 52 ${bcy - ry} 54 ${bcy - ry + 3} Z`} fill={METAL} stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
      )}
      {/* 가슴지느러미 */}
      <path d={`M 40 ${bcy + ry - 5} Q 34 ${bcy + ry + 6} 28 ${bcy + ry + 4} Q 33 ${bcy + ry - 2} 36 ${bcy + ry - 6} Z`} fill={c.dark} {...S} strokeWidth={1.8} />
      {c.p.extras?.includes("gills") && (
        <g stroke={darken(c.base, 0.3)} strokeWidth={1.6} opacity={0.8} fill="none">
          <path d={`M 38 ${bcy - 5} q 2.6 5 0 10 M 42.5 ${bcy - 5} q 2.6 5 0 10`} />
        </g>
      )}
      {c.p.extras?.includes("spikes") && (
        <g fill={METAL} stroke={INK} strokeWidth={1.4} strokeLinejoin="round">
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * Math.PI * 2 + 0.4;
            const sx = 48 + Math.cos(a) * rx;
            const sy = bcy + Math.sin(a) * ry;
            const txx = 48 + Math.cos(a) * (rx + 7);
            const tyy = bcy + Math.sin(a) * (ry + 7);
            return <path key={i} d={`M ${sx - 2} ${sy} L ${txx} ${tyy} L ${sx + 2} ${sy} Z`} />;
          })}
        </g>
      )}
      {/* 입 */}
      {c.p.extras?.includes("teeth") ? (
        <path d={`M ${48 - rx + 2} ${bcy + 4} l 2.6 3 l 2.6 -3 l 2.6 3 l 2.6 -3`} fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      ) : c.p.extras?.includes("lips") ? (
        <ellipse cx={48 - rx + 2} cy={bcy + 3} rx={2.8} ry={2} fill={darken(c.base, 0.3)} {...S} strokeWidth={1.4} />
      ) : (
        <path d={`M ${48 - rx + 2} ${bcy + 4} q 4 2.5 8 1`} fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />
      )}
      <MechEye x={eyePos[0]} y={eyePos[1]} eye={c.eye} s={0.9} />
      <Core x={52} y={bcy + 2} r={3.4} />
    </g>
  );
  return { jsx, a: { top: [48, bcy - ry - (c.p.extras?.includes("dorsalBig") ? 16 : 8)], back: [58, bcy - ry - 2], core: [52, bcy + 2], eye: eyePos, feet: [] } };
}

function rigTrex(c: Ctx): RigOut {
  const eyePos: [number, number] = [30, 32];
  const jsx = (
    <g>
      <path d={`M 64 52 Q 84 56 92 66 L 84 70 Q 72 62 62 62 Z`} fill={c.fill} {...S} strokeWidth={2.2} />
      <g fill={METAL} stroke={INK} strokeWidth={1.8} strokeLinejoin="round">
        <path d={`M 40 26 L 46 14 L 50 26 Z M 52 28 L 58 18 L 61 30 Z`} />
      </g>
      <Leg x={52} topY={62} w={9} />
      <circle cx={56} cy={58} r={13} fill={METAL} stroke={INK} strokeWidth={2.2} />
      <Leg x={64} topY={64} w={9} />
      {/* 몸통(기울어짐) */}
      <ellipse cx={48} cy={46} rx={21} ry={16} fill={c.fill} {...S} strokeWidth={2.4} transform="rotate(-18 48 46)" />
      {/* 머리 + 큰 턱 */}
      <circle cx={32} cy={30} r={12} fill={c.fill} {...S} strokeWidth={2.4} />
      <path d={`M 36 22 L 10 28 L 10 36 L 36 42 Z`} fill={c.fill} {...S} strokeWidth={2.2} />
      <path d={`M 12 36 l 3 3.4 l 3 -3.4 l 3 3.4 l 3 -3.4 l 3 3.4 l 3 -3.4`} fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      <rect x={10.5} y={29} width={3.6} height={3.6} rx={1.2} fill={INK} />
      <line x1={24} y1={24} x2={33} y2={26} stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
      {/* 티니 암 */}
      <path d={`M 40 48 q -6 2 -5 7`} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
      <MechEye x={eyePos[0]} y={eyePos[1]} eye={c.eye} />
      <Core x={50} y={48} />
    </g>
  );
  return { jsx, a: { top: [32, 16], back: [56, 30], core: [50, 48], eye: eyePos, feet: [[52, 84], [64, 84]] } };
}

function rigSnake(c: Ctx): RigOut {
  const eyePos: [number, number] = [30, 40];
  const jsx = (
    <g>
      <ellipse cx={52} cy={80} rx={26} ry={8.5} fill={c.fill} {...S} strokeWidth={2.4} />
      <ellipse cx={52} cy={70} rx={20} ry={7.5} fill={c.fill} {...S} strokeWidth={2.4} />
      <path d={`M 40 66 Q 30 60 30 48 L 40 46 Q 42 58 48 64 Z`} fill={c.fill} {...S} strokeWidth={2.4} />
      <g stroke={darken(c.base, 0.3)} strokeWidth={1.6} opacity={0.7} fill="none">
        <path d={`M 34 78 q 8 3 16 0 M 38 69 q 7 2.6 13 0`} />
      </g>
      <ellipse cx={33} cy={42} rx={11} ry={8.5} fill={c.fill} {...S} strokeWidth={2.4} />
      <path d={`M 22.5 44 l -7 1.5 M 15.5 45.5 l -3 -2 M 15.5 45.5 l -2.6 2.6`} fill="none" stroke="#d95f6e" strokeWidth={2} strokeLinecap="round" />
      <MechEye x={eyePos[0]} y={eyePos[1]} eye={c.eye} s={0.9} />
      <Core x={52} y={70} r={3} />
    </g>
  );
  return { jsx, a: { top: [33, 32], back: [64, 66], core: [52, 70], eye: eyePos, feet: [] } };
}

function rigTurtle(c: Ctx): RigOut {
  const eyePos: [number, number] = [21, 55];
  const jsx = (
    <g>
      <path d={`M 28 66 Q 28 40 52 40 Q 76 40 76 66 Z`} fill={c.fill} {...S} strokeWidth={2.4} />
      <g stroke={darken(c.base, 0.3)} strokeWidth={1.6} fill="none" opacity={0.85}>
        <path d={`M 38 66 Q 40 48 52 44 M 66 66 Q 64 48 52 44 M 32 56 H 72`} />
      </g>
      <rect x={26} y={64} width={52} height={7} rx={3.4} fill={METAL} stroke={INK} strokeWidth={2} />
      <Leg x={36} topY={70} w={6.5} />
      <Leg x={64} topY={70} w={6.5} />
      <circle cx={22} cy={57} r={8} fill={c.fill} {...S} strokeWidth={2.2} />
      <path d={`M 80 68 l 8 3 l -7 4 Z`} fill={c.fill} {...S} strokeWidth={1.8} />
      <MechEye x={eyePos[0]} y={eyePos[1]} eye={c.eye} s={0.8} />
      <Core x={52} y={56} r={3.4} />
    </g>
  );
  return { jsx, a: { top: [52, 38], back: [62, 42], core: [52, 56], eye: eyePos, feet: [[36, 84], [64, 84]] } };
}

function rigBat(c: Ctx): RigOut {
  const ptera = c.p.extras?.includes("pteraCrest");
  const eyePos: [number, number] = [46, 42];
  const jsx = (
    <g>
      <path d={`M 40 46 Q 24 30 6 34 Q 12 44 8 56 Q 20 50 26 58 Q 32 52 40 58 Z`} fill={ptera ? c.fill : darken(c.base, 0.2)} {...S} strokeWidth={2.2} />
      <path d={`M 60 46 Q 76 30 94 34 Q 88 44 92 56 Q 80 50 74 58 Q 68 52 60 58 Z`} fill={ptera ? c.fill : darken(c.base, 0.2)} {...S} strokeWidth={2.2} />
      <ellipse cx={50} cy={56} rx={11} ry={14} fill={c.fill} {...S} strokeWidth={2.4} />
      <circle cx={50} cy={40} r={10.5} fill={c.fill} {...S} strokeWidth={2.4} />
      {ptera ? (
        <g>
          <path d={`M 54 34 Q 64 28 68 30 Q 62 36 56 38 Z`} fill={c.dark} {...S} strokeWidth={1.8} />
          <path d={`M 42 42 L 30 46 L 42 49 Z`} fill="#3f434c" {...S} strokeWidth={1.8} />
        </g>
      ) : (
        <g>
          <path d={`M 42 34 L 40 22 L 50 30 Z M 58 34 L 60 22 L 50 30 Z`} fill={c.fill} {...S} strokeWidth={2} />
          <path d={`M 46 49 l 1.6 3 l 1.6 -2.8 Z M 51 49.2 l 1.6 2.8 l 1.6 -3 Z`} fill="#fff" stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
        </g>
      )}
      <path d={`M 46 70 q 0 6 -3 8 M 54 70 q 0 6 3 8`} fill="none" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
      <MechEye x={eyePos[0]} y={eyePos[1]} eye={c.eye} s={0.85} />
      <Core x={50} y={58} r={3.2} />
    </g>
  );
  return { jsx, a: { top: [50, ptera ? 26 : 20], back: [60, 34], core: [50, 58], eye: eyePos, feet: [] } };
}

function rigCrab(c: Ctx): RigOut {
  const eyePos: [number, number] = [43, 52];
  const jsx = (
    <g>
      {[0, 1, 2].map((i) => (
        <g key={i} stroke={INK} strokeWidth={2.6} strokeLinecap="round" fill="none">
          <path d={`M ${34 - i * 2} ${62 + i * 5} Q ${20 - i * 4} ${66 + i * 6} ${14 - i * 3} ${80}`} />
          <path d={`M ${66 + i * 2} ${62 + i * 5} Q ${80 + i * 4} ${66 + i * 6} ${86 + i * 3} ${80}`} />
        </g>
      ))}
      <path d={`M 34 50 Q 20 42 18 30 Q 12 34 14 40 Q 8 38 8 32 Q 14 22 24 28 Q 32 34 38 44 Z`} fill={c.fill} {...S} strokeWidth={2.2} />
      <path d={`M 66 50 Q 80 42 82 30 Q 88 34 86 40 Q 92 38 92 32 Q 86 22 76 28 Q 68 34 62 44 Z`} fill={c.fill} {...S} strokeWidth={2.2} />
      <ellipse cx={50} cy={60} rx={21} ry={13} fill={c.fill} {...S} strokeWidth={2.4} />
      <line x1={44} y1={49} x2={41} y2={40} stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
      <line x1={56} y1={49} x2={59} y2={40} stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
      <circle cx={41} cy={38} r={2.8} fill={TECH} stroke={INK} strokeWidth={1.6} />
      <circle cx={59} cy={38} r={2.8} fill={TECH} stroke={INK} strokeWidth={1.6} />
      <MechEye x={eyePos[0]} y={eyePos[1]} eye={c.eye} s={0.8} />
      <path d={`M 46 66 q 4 2.6 8 0`} fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />
      <Core x={53} y={58} r={3.2} />
    </g>
  );
  return { jsx, a: { top: [50, 34], back: [62, 48], core: [53, 58], eye: eyePos, feet: [[20, 82], [80, 82]] } };
}

function rigOcto(c: Ctx): RigOut {
  const eyePos: [number, number] = [46, 48];
  const jsx = (
    <g>
      <HoverRing cx={50} cy={86} rx={22} />
      <g fill={c.fill} {...S} strokeWidth={2}>
        {[-16, -8, 0, 8, 16].map((dx, i) => (
          <path key={i} d={`M ${47 + dx} 62 Q ${44 + dx + (i % 2 ? 8 : -8)} 74 ${50 + dx} 80 Q ${54 + dx} 74 ${53 + dx} 62 Z`} />
        ))}
      </g>
      <path d={`M 28 56 Q 28 30 50 30 Q 72 30 72 56 Q 72 66 50 66 Q 28 66 28 56 Z`} fill={c.fill} {...S} strokeWidth={2.4} />
      <path d={`M 34 40 Q 42 34 52 35`} fill="none" stroke={lighten(c.base, 0.3)} strokeWidth={2.2} strokeLinecap="round" opacity={0.8} />
      <MechEye x={eyePos[0]} y={eyePos[1]} eye={c.eye} s={1.15} />
      <Core x={58} y={54} r={3} />
    </g>
  );
  return { jsx, a: { top: [50, 28], back: [66, 38], core: [58, 54], eye: eyePos, feet: [] } };
}

function rigJelly(c: Ctx): RigOut {
  const eyePos: [number, number] = [46, 48];
  const jsx = (
    <g>
      <HoverRing cx={50} cy={86} rx={20} />
      <g fill="none" stroke={lighten(c.base, 0.15)} strokeWidth={3} strokeLinecap="round">
        {[-12, -4, 4, 12].map((dx, i) => (
          <path key={i} d={`M ${50 + dx} 60 Q ${50 + dx + (i % 2 ? 5 : -5)} 70 ${50 + dx} 80`} />
        ))}
      </g>
      <path d={`M 27 54 A 23 23 0 0 1 73 54 L 73 57 Q 67 61 61 57 Q 56 61 50 57 Q 44 61 39 57 Q 33 61 27 57 Z`} fill={c.fill} opacity={0.92} {...S} strokeWidth={2.4} />
      <circle cx={54} cy={44} r={5} fill={lighten(c.base, 0.35)} opacity={0.7} />
      <MechEye x={eyePos[0]} y={eyePos[1]} eye={c.eye} s={1} />
      <Core x={50} y={38} r={3} />
    </g>
  );
  return { jsx, a: { top: [50, 30], back: [64, 40], core: [50, 38], eye: eyePos, feet: [] } };
}

/* ---------- 레벨 장비 (앵커 기반 로봇 업그레이드) ---------- */

function levelGear(level: number, a: Anchors): ReactNode {
  const items: ReactNode[] = [];
  const [tx, ty] = a.top;
  const [bx2, by2] = a.back;
  const [cx2, cy2] = a.core;
  const [ex, ey] = a.eye;
  if (level >= 3)
    items.push(<rect key="chip" x={tx + 6} y={ty + 5} width={4.6} height={7} rx={2} fill={METAL} stroke={INK} strokeWidth={1.5} />);
  if (level >= 4)
    items.push(
      <g key="ant">
        <line x1={tx} y1={ty + 2} x2={tx} y2={ty - 8} stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
        <circle cx={tx} cy={ty - 10} r={3.4} fill={TECH} stroke={INK} strokeWidth={1.6} />
      </g>,
    );
  if (level >= 5) items.push(<circle key="ring" cx={cx2} cy={cy2} r={7.4} fill="none" stroke={GOLD} strokeWidth={1.8} />);
  if (level >= 6)
    items.push(
      a.feet.length > 0 ? (
        <g key="boost">
          {a.feet.map(([fx, fy], i) => (
            <g key={i}>
              <rect x={fx - 6} y={fy + 3.4} width={12} height={4.6} rx={2} fill={METAL_DARK} stroke={INK} strokeWidth={1.6} />
              <path d={`M ${fx - 2.6} ${fy + 8.4} l 2.6 4 l 2.6 -4 Z`} fill={TECH} opacity={0.9} />
            </g>
          ))}
        </g>
      ) : (
        <g key="boost" className="tm-aura">
          <ellipse cx={50} cy={86} rx={26} ry={4} fill={TECH} opacity={0.35} />
        </g>
      ),
    );
  if (level >= 7)
    items.push(
      <rect key="pad" x={bx2 - 12} y={by2 - 5} width={16} height={7} rx={3} fill={METAL} stroke={INK} strokeWidth={1.8} transform={`rotate(-10 ${bx2 - 4} ${by2})`} />,
    );
  if (level >= 9)
    items.push(
      <g key="pack">
        <rect x={bx2 + 2} y={by2 - 8} width={9} height={13} rx={2.5} fill={METAL_DARK} stroke={INK} strokeWidth={1.8} />
        <line x1={bx2 + 4.5} y1={by2 - 6} x2={bx2 + 4.5} y2={by2 + 2} stroke={INK} strokeWidth={1.2} opacity={0.6} />
      </g>,
    );
  if (level >= 10) items.push(<circle key="over" className="tm-twinkle" cx={cx2} cy={cy2} r={5} fill={TECH} opacity={0.5} />);
  if (level >= 11)
    items.push(
      <rect key="visor" x={ex - 9} y={ey - 7.5} width={18} height={4.4} rx={2.2} fill={TECH} opacity={0.45} stroke={INK} strokeWidth={1.3} transform={`rotate(-6 ${ex} ${ey})`} />,
    );
  if (level >= 12)
    items.push(
      <g key="jets">
        <path d={`M ${bx2 + 4} ${by2 - 4} L ${bx2 + 18} ${by2 - 14} L ${bx2 + 10} ${by2} Z`} fill={METAL} stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
        <path d={`M ${bx2 + 2} ${by2} L ${bx2 + 16} ${by2 - 4} L ${bx2 + 8} ${by2 + 5} Z`} fill={METAL_DARK} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
      </g>,
    );
  if (level >= 13) items.push(<path key="emblem" d={star4(cx2 + 11, cy2 - 5, 5)} fill={GOLD} stroke={INK} strokeWidth={1.3} />);
  if (level >= 14)
    items.push(
      <g key="particles" className="tm-twinkle">
        {[
          [14, 22],
          [88, 24],
          [10, 74],
          [90, 72],
        ].map(([x, y], i) => (
          <path key={i} d={star4(x, y, 3)} fill={TECH} />
        ))}
      </g>,
    );
  if (level >= 20)
    items.push(
      <g key="crown">
        <path d={`M ${tx - 9} ${ty - 8} L ${tx - 9} ${ty - 16} L ${tx - 4} ${ty - 11} L ${tx} ${ty - 18} L ${tx + 4} ${ty - 11} L ${tx + 9} ${ty - 16} L ${tx + 9} ${ty - 8} Z`} fill={GOLD} {...S} strokeWidth={1.8} />
        <circle cx={tx} cy={ty - 11} r={1.8} fill="#c0392b" />
      </g>,
    );
  return <>{items}</>;
}

const SPARKLE_SPOTS: [number, number, number][] = [
  [12, 34, 4.6],
  [90, 44, 4],
  [80, 12, 3.6],
  [16, 60, 3.4],
  [50, 12, 3.2],
  [92, 78, 3.2],
];

const RIGS: Record<string, (c: Ctx) => RigOut> = {
  quad: rigQuad,
  sit: rigSit,
  bird: rigBird,
  fish: rigFish,
  trex: rigTrex,
  snake: rigSnake,
  turtle: rigTurtle,
  bat: rigBat,
  crab: rigCrab,
  octo: rigOcto,
  jelly: rigJelly,
};

/* ---------- 메인 ---------- */

export function PetVector({
  species,
  color,
  level,
  eye,
  mouth: _mouth,
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
        <ellipse cx={50} cy={90} rx={25} ry={3.6} fill="#20201e" opacity={0.1} />
        <path d="M50 18 C67 18 77 39 77 57 C77 76 64 87 50 87 C36 87 23 76 23 57 C23 39 33 18 50 18 Z" fill={`url(#${uid}e)`} stroke={INK} strokeWidth={2.4} />
        <path d="M24.5 60 Q 50 66 75.5 60" fill="none" stroke={METAL_DARK} strokeWidth={4} opacity={0.75} />
        <circle cx={50} cy={62.4} r={2.5} fill={TECH} stroke={INK} strokeWidth={1.4} className="tm-twinkle" />
        <ellipse cx={42} cy={40} rx={4.2} ry={3} fill={base} opacity={0.85} />
        <ellipse cx={59} cy={48} rx={3.4} ry={2.6} fill={base} opacity={0.85} />
        {levelProgressPct >= 60 && (
          <path d="M 40 28 L 46 34 L 41 40 L 48 45" fill="none" stroke="#8f8060" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    );
  }

  const ctx: Ctx = {
    base,
    dark: darken(base, 0.28),
    light: lighten(base, 0.45),
    fill: `url(#${uid}b)`,
    p: info.p,
    eye,
  };
  const rig = (RIGS[info.rig] ?? rigSit)(ctx);
  const sparkles = Math.max(0, Math.min(SPARKLE_SPOTS.length, level - 14));

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={label} style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id={`${uid}b`} cx="38%" cy="28%" r="85%">
          <stop offset="0%" stopColor={lighten(base, 0.24)} />
          <stop offset="55%" stopColor={base} />
          <stop offset="100%" stopColor={darken(base, 0.2)} />
        </radialGradient>
      </defs>
      <ellipse cx={50} cy={90} rx={34} ry={4} fill="#20201e" opacity={0.1} />
      {level >= 15 && (
        <g className="tm-aura">
          <circle cx={50} cy={52} r={46} fill={GOLD} opacity={0.08} />
          <circle cx={50} cy={52} r={37} fill={GOLD} opacity={0.06} />
        </g>
      )}
      {level >= 18 && (
        <path
          d={`M ${rig.a.back[0] - 4} ${rig.a.back[1]} Q ${rig.a.back[0] + 26} ${rig.a.back[1] - 6} ${rig.a.back[0] + 40} ${rig.a.back[1] + 26} Q ${rig.a.back[0] + 22} ${rig.a.back[1] + 22} ${rig.a.back[0] + 6} ${rig.a.back[1] + 14} Z`}
          fill="#8e3438"
          {...S}
        />
      )}
      {rig.jsx}
      {levelGear(level, rig.a)}
      {sparkles > 0 && (
        <g className="tm-twinkle">
          {SPARKLE_SPOTS.slice(0, sparkles).map(([cx3, cy3, r], index) => (
            <path key={index} d={star4(cx3, cy3, r)} fill={GOLD} stroke={INK} strokeWidth={0.8} />
          ))}
        </g>
      )}
    </svg>
  );
}
