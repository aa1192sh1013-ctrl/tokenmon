import type { TokenmonColor, TokenmonSpecies } from "@/lib/tokenmon";

/**
 * 종족 레지스트리 — 서로 다른 동물 50종 + 공룡류 5종 + 환수종 5종.
 * 각 종은 측면 실루엣 리그(rig)와 파라미터(p)로 정의된다 — 사족보행 메카,
 * 새, 어류, 소형 착석형 등 실제 동물 자세가 그대로 보이는 방식.
 * 색(12종)은 종과 별개로 프로젝트마다 랜덤 배정된다.
 */

export const GOLD = "#d4a842";
/** 코어·글로우 등 로봇 부품 공통 발광색. */
export const TECH = "#5fd8cc";

export interface ColorDef {
  label: string;
  base: string;
}

export const COLOR_DEFS: Record<TokenmonColor, ColorDef> = {
  red: { label: "빨강", base: "#c9504e" },
  orange: { label: "주황", base: "#d97e35" },
  yellow: { label: "노랑", base: "#d9b440" },
  green: { label: "초록", base: "#55a065" },
  blue: { label: "파랑", base: "#4d86c6" },
  indigo: { label: "남색", base: "#4a5b9e" },
  violet: { label: "보라", base: "#8a5fae" },
  white: { label: "하양", base: "#e6e9ee" },
  black: { label: "까망", base: "#3c4049" },
  gold: { label: "금", base: "#c9a23f" },
  silver: { label: "은", base: "#aeb6c2" },
  bronze: { label: "동", base: "#a67a4a" },
};

export type RigKind =
  | "quad" // 사족보행 (늑대·호랑이·말 등)
  | "sit" // 앉은 소형 (토끼·햄스터·곰 등)
  | "bird" // 조류 (서 있는 측면)
  | "fish" // 어류 (호버링)
  | "trex" // 이족 공룡
  | "snake"
  | "turtle"
  | "bat"
  | "crab"
  | "octo"
  | "jelly";

export interface SpeciesParams {
  /** 주둥이: wolf | cat | dog | horse | block | pig | croc | trunk | none */
  muzzle?: string;
  /** 귀: point | bigpoint | round | floppy | long | side | huge | tuft | fluff | none */
  ear?: string;
  /** 꼬리: bushy | tipped | up | flow | stub | thin | curl | spade | spike | puff | ring | flat | none */
  tail?: string;
  /** 부리(조류): flat | tiny | tri | hook | sharp | bent */
  beak?: string;
  /** 추가 요소들 */
  extras?: readonly string[];
  /** 목이 긴 변형(quad: 브라키오, bird: 플라밍고·백조) */
  longNeck?: boolean;
  /** 낮고 긴 몸 (악어) */
  low?: boolean;
}

export interface SpeciesDef {
  label: string;
  cry: string;
  rig: RigKind;
  p: SpeciesParams;
  rare?: boolean;
  rareKind?: "dino" | "mythic";
}

export const SPECIES_DEFS: Record<string, SpeciesDef> = {
  /* ---- 사족보행 포유류 ---- */
  dog: { label: "강아지봇", cry: "멍!", rig: "quad", p: { muzzle: "dog", ear: "floppy", tail: "up" } },
  cat: { label: "고양이봇", cry: "냐옹", rig: "quad", p: { muzzle: "cat", ear: "point", tail: "up", extras: ["whiskers"] } },
  wolf: { label: "늑대봇", cry: "아우~", rig: "quad", p: { muzzle: "wolf", ear: "point", tail: "bushy", extras: ["fang"] } },
  fox: { label: "여우봇", cry: "콘!", rig: "quad", p: { muzzle: "wolf", ear: "bigpoint", tail: "tipped" } },
  tiger: { label: "호랑이봇", cry: "어흥", rig: "quad", p: { muzzle: "cat", ear: "round", tail: "up", extras: ["stripes", "fang"] } },
  lion: { label: "사자봇", cry: "크앙", rig: "quad", p: { muzzle: "cat", ear: "round", tail: "tuftTail", extras: ["mane", "fang"] } },
  cheetah: { label: "치타봇", cry: "슝!", rig: "quad", p: { muzzle: "cat", ear: "round", tail: "thin", extras: ["spots", "tear"] } },
  deer: { label: "사슴봇", cry: "총총", rig: "quad", p: { muzzle: "horse", ear: "side", tail: "stub", extras: ["antler"] } },
  horse: { label: "말봇", cry: "히힝", rig: "quad", p: { muzzle: "horse", ear: "point", tail: "flow", extras: ["mane"] } },
  sheep: { label: "양봇", cry: "메에", rig: "quad", p: { muzzle: "block", ear: "side", tail: "stub", extras: ["wool"] } },
  goat: { label: "염소봇", cry: "매애", rig: "quad", p: { muzzle: "block", ear: "side", tail: "stub", extras: ["hornsBack", "beard"] } },
  cow: { label: "젖소봇", cry: "음머", rig: "quad", p: { muzzle: "block", ear: "side", tail: "tuftTail", extras: ["hornsSmall", "spots"] } },
  pig: { label: "돼지봇", cry: "꿀꿀", rig: "quad", p: { muzzle: "pig", ear: "point", tail: "curl" } },
  elephant: { label: "코끼리봇", cry: "뿌우", rig: "quad", p: { muzzle: "trunk", ear: "huge", tail: "thin" } },
  croc: { label: "악어봇", cry: "덥석", rig: "quad", p: { muzzle: "croc", ear: "none", tail: "spike", low: true, extras: ["ridges"] } },
  /* ---- 앉은 소형 ---- */
  bunny: { label: "토끼봇", cry: "촐랑", rig: "sit", p: { ear: "long", tail: "puff", extras: ["teeth"] } },
  hamster: { label: "햄스터봇", cry: "오물", rig: "sit", p: { ear: "round", tail: "stub", extras: ["cheek", "teeth"] } },
  mouse: { label: "생쥐봇", cry: "찍!", rig: "sit", p: { ear: "big", tail: "thin", extras: ["whiskers"] } },
  squirrel: { label: "다람쥐봇", cry: "탁탁", rig: "sit", p: { ear: "tuft", tail: "bigbush", extras: ["teeth"] } },
  hedgehog: { label: "고슴도치봇", cry: "콕콕", rig: "sit", p: { ear: "none", tail: "none", extras: ["spikes"] } },
  koala: { label: "코알라봇", cry: "쿨…", rig: "sit", p: { ear: "fluff", tail: "none", extras: ["bignose"] } },
  panda: { label: "판다봇", cry: "우물", rig: "sit", p: { ear: "round", tail: "stub", extras: ["patch"] } },
  bear: { label: "곰봇", cry: "크릉", rig: "sit", p: { ear: "round", tail: "stub", extras: ["chunky"] } },
  monkey: { label: "원숭이봇", cry: "우끼", rig: "sit", p: { ear: "side", tail: "curlLong", extras: ["facePatch"] } },
  otter: { label: "수달봇", cry: "뽀글", rig: "sit", p: { ear: "round", tail: "flat", extras: ["whiskers"] } },
  raccoon: { label: "너구리봇", cry: "부스럭", rig: "sit", p: { ear: "point", tail: "ring", extras: ["mask"] } },
  frog: { label: "개구리봇", cry: "개굴", rig: "sit", p: { ear: "none", tail: "none", extras: ["frogEyes", "crouch"] } },
  chameleon: { label: "카멜레온봇", cry: "쓱…", rig: "sit", p: { ear: "none", tail: "spiral", extras: ["crest", "coneEye"] } },
  /* ---- 조류 ---- */
  duck: { label: "오리봇", cry: "꽥!", rig: "bird", p: { beak: "flat", extras: ["curl"] } },
  chick: { label: "병아리봇", cry: "삐약", rig: "bird", p: { beak: "tiny", extras: ["crest3"] } },
  penguin: { label: "펭귄봇", cry: "펭!", rig: "bird", p: { beak: "tri", extras: ["upright", "belly"] } },
  owl: { label: "부엉이봇", cry: "부엉", rig: "bird", p: { beak: "tri", extras: ["upright", "discs", "tufts"] } },
  parrot: { label: "앵무봇", cry: "안녕!", rig: "bird", p: { beak: "hook", extras: ["crestTall"] } },
  crow: { label: "까마귀봇", cry: "까악", rig: "bird", p: { beak: "sharp", extras: ["tuftHead"] } },
  hawk: { label: "매봇", cry: "휘익", rig: "bird", p: { beak: "hook", extras: ["brow"] } },
  peacock: { label: "공작봇", cry: "화락", rig: "bird", p: { beak: "tiny", extras: ["fanTail", "pins"] } },
  flamingo: { label: "플라밍고봇", cry: "훌쩍", rig: "bird", p: { beak: "bent", longNeck: true, extras: ["oneLeg"] } },
  swan: { label: "백조봇", cry: "스르륵", rig: "bird", p: { beak: "flat", longNeck: true } },
  /* ---- 어류·수중 ---- */
  shark: { label: "상어봇", cry: "철컥", rig: "fish", p: { extras: ["dorsalBig", "teeth", "gills", "sharpNose"] } },
  orca: { label: "범고래봇", cry: "쏴아", rig: "fish", p: { extras: ["dorsalBig", "orcaPatch", "belly"] } },
  goldfish: { label: "금붕어봇", cry: "뻐끔", rig: "fish", p: { extras: ["flowTail", "lips"] } },
  puffer: { label: "복어봇", cry: "빵!", rig: "fish", p: { extras: ["roundBody", "spikes", "lips"] } },
  ray: { label: "가오리봇", cry: "팔랑", rig: "fish", p: { extras: ["wide", "whipTail"] } },
  seahorse: { label: "해마봇", cry: "말랑", rig: "fish", p: { extras: ["upright", "tube", "finBack"] } },
  turtle: { label: "거북봇", cry: "엉금", rig: "turtle", p: {} },
  snake: { label: "뱀봇", cry: "스륵", rig: "snake", p: {} },
  bat: { label: "박쥐봇", cry: "끼익", rig: "bat", p: {} },
  crab: { label: "게봇", cry: "집게!", rig: "crab", p: {} },
  octopus: { label: "문어봇", cry: "꾸물", rig: "octo", p: {} },
  jellyfish: { label: "해파리봇", cry: "둥둥", rig: "jelly", p: {} },
  /* ---- 공룡류 (레어) ---- */
  tyranno: { label: "티라노봇", cry: "쿠앙!", rig: "trex", p: {}, rare: true, rareKind: "dino" },
  tricera: { label: "트리케라봇", cry: "푸릉!", rig: "quad", p: { muzzle: "block", ear: "none", tail: "thick", extras: ["frill", "horn3"] }, rare: true, rareKind: "dino" },
  stego: { label: "스테고봇", cry: "우걱!", rig: "quad", p: { muzzle: "block", ear: "none", tail: "spike", extras: ["plates"] }, rare: true, rareKind: "dino" },
  brachio: { label: "브라키오봇", cry: "뿌우!", rig: "quad", p: { muzzle: "block", ear: "none", tail: "thick", longNeck: true }, rare: true, rareKind: "dino" },
  ptera: { label: "프테라봇", cry: "끼에엑!", rig: "bat", p: { extras: ["pteraCrest", "beak"] }, rare: true, rareKind: "dino" },
  /* ---- 환수종 (레어) ---- */
  unicorn: { label: "유니콘봇", cry: "뿅!", rig: "quad", p: { muzzle: "horse", ear: "point", tail: "flow", extras: ["mane", "hornSpiral"] }, rare: true, rareKind: "mythic" },
  dragonet: { label: "드래곤봇", cry: "크앙!", rig: "quad", p: { muzzle: "wolf", ear: "none", tail: "spade", extras: ["hornsBack", "wings", "fang"] }, rare: true, rareKind: "mythic" },
  phoenix: { label: "불사조봇", cry: "화르륵!", rig: "bird", p: { beak: "tiny", extras: ["flameCrest", "flameTail"] }, rare: true, rareKind: "mythic" },
  gumiho: { label: "구미호봇", cry: "콘…", rig: "quad", p: { muzzle: "wolf", ear: "bigpoint", tail: "none", extras: ["ninetails"] }, rare: true, rareKind: "mythic" },
  pegasus: { label: "페가수스봇", cry: "히힝!", rig: "quad", p: { muzzle: "horse", ear: "point", tail: "flow", extras: ["mane", "wings"] }, rare: true, rareKind: "mythic" },
};

const FALLBACK: SpeciesDef = { label: "미확인봇", cry: "…?", rig: "sit", p: {} };

export function getSpeciesInfo(species: TokenmonSpecies): SpeciesDef {
  return SPECIES_DEFS[species] ?? FALLBACK;
}

export function getColorInfo(color: TokenmonColor): ColorDef {
  return COLOR_DEFS[color] ?? COLOR_DEFS.silver;
}
