import type { TokenmonColor, TokenmonSpecies } from "@/lib/tokenmon";

/**
 * 종 도감 — 60종 메카 동물(일러스트 스프라이트).
 * 스프라이트는 /public/species/<id>/<level>.jpg (Lv.1~20, 레벨마다 다른 모습).
 * 색상은 원본 일러스트(은빛 메탈 + 시안 발광) 위에 CSS 필터로 입힌다.
 */

export interface SpeciesInfo {
  label: string;
  cry: string;
  rare: boolean;
}

export const SPECIES_DEFS: Record<string, SpeciesInfo> = {
  /* ---------- 흔한 종 50 ---------- */
  wolf: { label: "늑대봇", cry: "아우~", rare: false },
  fox: { label: "여우봇", cry: "콘!", rare: false },
  dog: { label: "멍멍봇", cry: "멍!", rare: false },
  cat: { label: "냥냥봇", cry: "냐옹", rare: false },
  lion: { label: "사자봇", cry: "어흥!", rare: false },
  tiger: { label: "호랑이봇", cry: "크앙!", rare: false },
  leopard: { label: "표범봇", cry: "그르릉", rare: false },
  cheetah: { label: "치타봇", cry: "슈웅!", rare: false },
  bear: { label: "곰봇", cry: "크엉", rare: false },
  panda: { label: "판다봇", cry: "우물우물", rare: false },
  rabbit: { label: "토끼봇", cry: "깡총", rare: false },
  deer: { label: "사슴봇", cry: "타닥", rare: false },
  goat: { label: "염소봇", cry: "메에", rare: false },
  horse: { label: "말봇", cry: "히힝", rare: false },
  bison: { label: "들소봇", cry: "푸릉!", rare: false },
  elephant: { label: "코끼리봇", cry: "뿌우~", rare: false },
  rhino: { label: "코뿔소봇", cry: "쿵쿵", rare: false },
  gorilla: { label: "고릴라봇", cry: "우호!", rare: false },
  monkey: { label: "원숭이봇", cry: "우끼!", rare: false },
  otter: { label: "수달봇", cry: "찹찹", rare: false },
  raccoon: { label: "너구리봇", cry: "부스럭", rare: false },
  kangaroo: { label: "캥거루봇", cry: "폴짝!", rare: false },
  bat: { label: "박쥐봇", cry: "끼릭", rare: false },
  eagle: { label: "독수리봇", cry: "끼요오!", rare: false },
  owl: { label: "부엉이봇", cry: "부엉", rare: false },
  raven: { label: "까마귀봇", cry: "까악", rare: false },
  falcon: { label: "매봇", cry: "삐이익!", rare: false },
  penguin: { label: "펭귄봇", cry: "뒤뚱", rare: false },
  peacock: { label: "공작봇", cry: "촤르륵", rare: false },
  parrot: { label: "앵무봇", cry: "안녕!", rare: false },
  crane: { label: "두루미봇", cry: "뚜루루", rare: false },
  crocodile: { label: "악어봇", cry: "철컥!", rare: false },
  cobra: { label: "코브라봇", cry: "스스슥", rare: false },
  chameleon: { label: "카멜레온봇", cry: "늘름", rare: false },
  turtle: { label: "거북봇", cry: "느긋~", rare: false },
  frog: { label: "개굴봇", cry: "개굴!", rare: false },
  shark: { label: "상어봇", cry: "슈욱!", rare: false },
  orca: { label: "범고래봇", cry: "촤아!", rare: false },
  dolphin: { label: "돌고래봇", cry: "끼익끼익", rare: false },
  whale: { label: "고래봇", cry: "부우웅~", rare: false },
  octopus: { label: "문어봇", cry: "물컹", rare: false },
  squid: { label: "오징어봇", cry: "슉슉", rare: false },
  crab: { label: "게봇", cry: "집게집게", rare: false },
  manta: { label: "가오리봇", cry: "팔랑~", rare: false },
  seahorse: { label: "해마봇", cry: "동동", rare: false },
  stagbeetle: { label: "사슴벌레봇", cry: "집게발!", rare: false },
  mantis: { label: "사마귀봇", cry: "샥샥!", rare: false },
  scorpion: { label: "전갈봇", cry: "찌릿!", rare: false },
  spider: { label: "거미봇", cry: "스륵스륵", rare: false },
  butterfly: { label: "나비봇", cry: "팔랑팔랑", rare: false },
  /* ---------- 공룡류 (RARE) ---------- */
  tyranno: { label: "티라노봇", cry: "크르르릉!", rare: true },
  tricera: { label: "트리케라봇", cry: "두두둥", rare: true },
  raptor: { label: "랩터봇", cry: "캬악!", rare: true },
  anky: { label: "안킬로봇", cry: "텅텅!", rare: true },
  ptera: { label: "프테라봇", cry: "키에엑!", rare: true },
  /* ---------- 환수종 (RARE) ---------- */
  dragon: { label: "드래곤봇", cry: "화르륵!", rare: true },
  phoenix: { label: "불사조봇", cry: "파아앗!", rare: true },
  griffin: { label: "그리핀봇", cry: "키이잉!", rare: true },
  qilin: { label: "키린봇", cry: "딸랑~", rare: true },
  cerberus: { label: "케르베로스봇", cry: "왈!왈!왈!", rare: true },
};

const FALLBACK: SpeciesInfo = { label: "멍멍봇", cry: "멍!", rare: false };

export function getSpeciesInfo(species: TokenmonSpecies): SpeciesInfo {
  return SPECIES_DEFS[species] ?? FALLBACK;
}

/** 색상 12종 — 원본(은빛+시안) 일러스트에 입히는 CSS 필터. */
export interface ColorInfo {
  label: string;
  /** 스프라이트 <img>에 적용할 filter 값. */
  filter: string;
  /** 색 견본용 대표색 (UI 장식용). */
  swatch: string;
}

export const COLOR_DEFS: Record<TokenmonColor, ColorInfo> = {
  red: { label: "빨강", filter: "hue-rotate(170deg) saturate(1.15)", swatch: "#c8483f" },
  orange: { label: "주황", filter: "hue-rotate(200deg) saturate(1.2) brightness(1.03)", swatch: "#d07030" },
  yellow: { label: "노랑", filter: "hue-rotate(230deg) saturate(1.2) brightness(1.06)", swatch: "#c9a227" },
  green: { label: "초록", filter: "hue-rotate(-60deg) saturate(1.1)", swatch: "#3f9a52" },
  blue: { label: "파랑", filter: "hue-rotate(35deg) saturate(1.15)", swatch: "#3d6fc4" },
  indigo: { label: "남색", filter: "hue-rotate(75deg) saturate(1.1) brightness(0.97)", swatch: "#44519e" },
  violet: { label: "보라", filter: "hue-rotate(100deg) saturate(1.15)", swatch: "#8a4fae" },
  white: { label: "하양", filter: "saturate(0.25) brightness(1.1) contrast(0.96)", swatch: "#e8e6e0" },
  black: { label: "검정", filter: "saturate(0.55) brightness(0.72) contrast(1.18)", swatch: "#3d3a38" },
  gold: { label: "금", filter: "sepia(0.5) saturate(1.5) hue-rotate(-15deg) brightness(1.05)", swatch: "#d4a842" },
  silver: { label: "은", filter: "saturate(0.2) brightness(1.02)", swatch: "#b9bcc2" },
  bronze: { label: "동", filter: "sepia(0.6) saturate(1.35) hue-rotate(-20deg) brightness(0.92)", swatch: "#a5713c" },
};

export function getColorInfo(color: TokenmonColor): ColorInfo {
  return COLOR_DEFS[color] ?? COLOR_DEFS.silver;
}
