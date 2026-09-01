import type { TokenmonColor, TokenmonSpecies } from "@/lib/tokenmon";

/**
 * 종족 레지스트리 — 서로 다른 동물 50종 + 공룡류 5종 + 환수종 5종.
 * 형태는 파츠 조합 레시피로 정의하고, 색(12종)은 프로젝트마다 랜덤 배정된다.
 * 실제 드로잉은 tokenmon-vector.tsx가 담당한다.
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

export type BodyKind = "round" | "wide" | "fish" | "neck" | "snake" | "jelly";
/** [파츠 계열, 변형] — 벡터 렌더러의 파츠 스위치와 1:1. */
export type Part = readonly [string, string];

export interface SpeciesDef {
  label: string;
  cry: string;
  body: BodyKind;
  parts: readonly Part[];
  rare?: boolean;
  rareKind?: "dino" | "mythic";
}

export const SPECIES_DEFS: Record<string, SpeciesDef> = {
  /* ---- 포유류 ---- */
  dog: { label: "강아지봇", cry: "멍!", body: "round", parts: [["ear", "floppy"], ["snout", "dog"]] },
  cat: { label: "고양이봇", cry: "냐옹", body: "round", parts: [["ear", "pointy"], ["face", "whiskers"], ["snout", "tri"]] },
  bunny: { label: "토끼봇", cry: "촐랑", body: "round", parts: [["ear", "long"], ["face", "teeth"]] },
  bear: { label: "곰봇", cry: "크릉", body: "round", parts: [["ear", "round"], ["snout", "muzzle"]] },
  panda: { label: "판다봇", cry: "우물", body: "round", parts: [["ear", "round"], ["face", "patch"], ["snout", "muzzle"]] },
  koala: { label: "코알라봇", cry: "쿨…", body: "round", parts: [["ear", "big"], ["snout", "nose"]] },
  hamster: { label: "햄스터봇", cry: "오물", body: "round", parts: [["ear", "round"], ["face", "pouch"], ["face", "teeth"]] },
  mouse: { label: "생쥐봇", cry: "찍!", body: "round", parts: [["ear", "big"], ["face", "whiskers"], ["snout", "tri"]] },
  squirrel: { label: "다람쥐봇", cry: "탁탁", body: "round", parts: [["ear", "tuft"], ["tail", "bushy"], ["face", "teeth"]] },
  hedgehog: { label: "고슴도치봇", cry: "콕콕", body: "round", parts: [["back", "spikesCrown"], ["snout", "nose"]] },
  deer: { label: "사슴봇", cry: "총총", body: "round", parts: [["horns", "antler"], ["ear", "floppy"], ["snout", "nose"]] },
  horse: { label: "말봇", cry: "히힝", body: "round", parts: [["ear", "pointy"], ["mane", "top"]] },
  sheep: { label: "양봇", cry: "메에", body: "round", parts: [["mane", "wool"], ["ear", "floppy"]] },
  goat: { label: "염소봇", cry: "매애", body: "round", parts: [["horns", "back"], ["mane", "beard"], ["ear", "floppy"]] },
  cow: { label: "젖소봇", cry: "음머", body: "round", parts: [["horns", "small"], ["face", "spots"], ["snout", "cow"]] },
  pig: { label: "돼지봇", cry: "꿀꿀", body: "round", parts: [["ear", "pointy"], ["snout", "pig"]] },
  elephant: { label: "코끼리봇", cry: "뿌우", body: "round", parts: [["ear", "huge"], ["snout", "trunk"]] },
  monkey: { label: "원숭이봇", cry: "우끼", body: "round", parts: [["ear", "side"], ["face", "monkey"]] },
  otter: { label: "수달봇", cry: "뽀글", body: "round", parts: [["ear", "round"], ["snout", "muzzle"], ["face", "whiskers"]] },
  raccoon: { label: "너구리봇", cry: "부스럭", body: "round", parts: [["ear", "pointy"], ["face", "mask"], ["snout", "nose"]] },
  /* ---- 육식 ---- */
  wolf: { label: "늑대봇", cry: "아우~", body: "round", parts: [["ear", "tall"], ["snout", "dog"], ["face", "fangs"], ["face", "brow"]] },
  fox: { label: "여우봇", cry: "콘!", body: "round", parts: [["ear", "tall"], ["snout", "tri"], ["tail", "fox"]] },
  tiger: { label: "호랑이봇", cry: "어흥", body: "round", parts: [["ear", "round"], ["face", "stripes"], ["face", "fangs"], ["face", "brow"]] },
  lion: { label: "사자봇", cry: "크앙", body: "round", parts: [["mane", "ruff"], ["ear", "round"], ["snout", "tri"], ["face", "brow"]] },
  cheetah: { label: "치타봇", cry: "슝!", body: "round", parts: [["ear", "round"], ["face", "tear"], ["face", "brow"]] },
  croc: { label: "악어봇", cry: "덥석", body: "round", parts: [["snout", "croc"], ["back", "ridges"], ["face", "brow"]] },
  snake: { label: "뱀봇", cry: "스륵", body: "snake", parts: [["face", "tongue"]] },
  bat: { label: "박쥐봇", cry: "끼익", body: "round", parts: [["ear", "tall"], ["wings", "bat"], ["face", "fangs"]] },
  hawk: { label: "매봇", cry: "휘익", body: "round", parts: [["beak", "hook"], ["face", "brow"], ["wings", "side"]] },
  crow: { label: "까마귀봇", cry: "까악", body: "round", parts: [["beak", "sharp"], ["crest", "tuft"]] },
  /* ---- 조류·양서·파충 ---- */
  duck: { label: "오리봇", cry: "꽥!", body: "round", parts: [["beak", "flat"], ["crest", "curl"], ["wings", "small"]] },
  chick: { label: "병아리봇", cry: "삐약", body: "round", parts: [["crest", "three"], ["beak", "tiny"], ["wings", "small"]] },
  penguin: { label: "펭귄봇", cry: "펭!", body: "round", parts: [["face", "belly"], ["beak", "tri"], ["wings", "flippers"]] },
  owl: { label: "부엉이봇", cry: "부엉", body: "round", parts: [["face", "discs"], ["ear", "tufts"], ["beak", "tri"]] },
  parrot: { label: "앵무봇", cry: "안녕!", body: "round", parts: [["beak", "hookBig"], ["crest", "tall"]] },
  peacock: { label: "공작봇", cry: "화락", body: "round", parts: [["back", "peacock"], ["crest", "pins"], ["beak", "tiny"]] },
  flamingo: { label: "플라밍고봇", cry: "훌쩍", body: "neck", parts: [["beak", "bent"]] },
  swan: { label: "백조봇", cry: "스르륵", body: "neck", parts: [["beak", "flat"]] },
  frog: { label: "개구리봇", cry: "개굴", body: "round", parts: [["face", "mounts"], ["face", "wide"]] },
  turtle: { label: "거북봇", cry: "엉금", body: "round", parts: [["face", "shell"], ["back", "shellRim"]] },
  /* ---- 어류·수중 ---- */
  shark: { label: "상어봇", cry: "철컥", body: "fish", parts: [["back", "dorsal"], ["face", "grin"], ["face", "gills"]] },
  orca: { label: "범고래봇", cry: "쏴아", body: "fish", parts: [["face", "orca"], ["back", "dorsal"], ["tail", "fluke"]] },
  goldfish: { label: "금붕어봇", cry: "뻐끔", body: "fish", parts: [["tail", "fan"], ["wings", "flowfins"], ["face", "lips"]] },
  puffer: { label: "복어봇", cry: "빵!", body: "fish", parts: [["back", "spikesAround"], ["face", "lips"]] },
  octopus: { label: "문어봇", cry: "꾸물", body: "jelly", parts: [["tail", "tentacles"]] },
  jellyfish: { label: "해파리봇", cry: "둥둥", body: "jelly", parts: [["tail", "strips"]] },
  crab: { label: "게봇", cry: "집게!", body: "wide", parts: [["wings", "claws"], ["ear", "stalks"]] },
  ray: { label: "가오리봇", cry: "팔랑", body: "wide", parts: [["wings", "flat"], ["tail", "thin"]] },
  seahorse: { label: "해마봇", cry: "말랑", body: "neck", parts: [["beak", "tube"], ["crest", "ridge"]] },
  chameleon: { label: "카멜레온봇", cry: "쓱…", body: "round", parts: [["face", "cones"], ["tail", "curl"], ["crest", "ridge"]] },
  /* ---- 공룡류 (레어) ---- */
  tyranno: { label: "티라노봇", cry: "쿠앙!", body: "round", rare: true, rareKind: "dino", parts: [["back", "spikes"], ["face", "grin"], ["wings", "tinyArms"], ["face", "brow"]] },
  tricera: { label: "트리케라봇", cry: "푸릉!", body: "round", rare: true, rareKind: "dino", parts: [["back", "frill"], ["horns", "three"]] },
  stego: { label: "스테고봇", cry: "우걱!", body: "round", rare: true, rareKind: "dino", parts: [["back", "plates"]] },
  brachio: { label: "브라키오봇", cry: "뿌우!", body: "neck", rare: true, rareKind: "dino", parts: [] },
  ptera: { label: "프테라봇", cry: "끼에엑!", body: "round", rare: true, rareKind: "dino", parts: [["wings", "ptera"], ["crest", "back"], ["beak", "sharp"]] },
  /* ---- 환수종 (레어) ---- */
  unicorn: { label: "유니콘봇", cry: "뿅!", body: "round", rare: true, rareKind: "mythic", parts: [["horns", "spiral"], ["mane", "flow"]] },
  dragonet: { label: "드래곤봇", cry: "크앙!", body: "round", rare: true, rareKind: "mythic", parts: [["horns", "curved"], ["wings", "batBig"], ["face", "scales"]] },
  phoenix: { label: "불사조봇", cry: "화르륵!", body: "round", rare: true, rareKind: "mythic", parts: [["crest", "flame"], ["wings", "flame"], ["beak", "tiny"]] },
  gumiho: { label: "구미호봇", cry: "콘…", body: "round", rare: true, rareKind: "mythic", parts: [["ear", "tall"], ["tail", "nine"], ["snout", "tri"]] },
  pegasus: { label: "페가수스봇", cry: "히힝!", body: "round", rare: true, rareKind: "mythic", parts: [["wings", "feather"], ["mane", "flow"]] },
};

const FALLBACK: SpeciesDef = { label: "미확인봇", cry: "…?", body: "round", parts: [] };

export function getSpeciesInfo(species: TokenmonSpecies): SpeciesDef {
  return SPECIES_DEFS[species] ?? FALLBACK;
}

export function getColorInfo(color: TokenmonColor): ColorDef {
  return COLOR_DEFS[color] ?? COLOR_DEFS.silver;
}
