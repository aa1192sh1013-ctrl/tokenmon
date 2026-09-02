import type { TokenmonColor, TokenmonLang, TokenmonSpecies } from "@/lib/tokenmon";

/**
 * 종 도감 — 60종 메카 동물(일러스트 스프라이트), 영어/한국어 이름·울음소리.
 * 스프라이트는 /public/species/<id>/<level>.webp (Lv.1~20, 레벨마다 다른 모습).
 * 색상은 원본 일러스트(은빛 메탈 + 시안 발광) 위에 CSS 필터로 입힌다.
 */

interface SpeciesDef {
  label: { en: string; ko: string };
  cry: { en: string; ko: string };
  rare: boolean;
}

export interface SpeciesInfo {
  label: string;
  cry: string;
  rare: boolean;
}

export const SPECIES_DEFS: Record<string, SpeciesDef> = {
  /* ---------- 흔한 종 50 ---------- */
  wolf: { label: { en: "WolfBot", ko: "늑대봇" }, cry: { en: "Awoo~", ko: "아우~" }, rare: false },
  fox: { label: { en: "FoxBot", ko: "여우봇" }, cry: { en: "Yip!", ko: "콘!" }, rare: false },
  dog: { label: { en: "PupBot", ko: "멍멍봇" }, cry: { en: "Woof!", ko: "멍!" }, rare: false },
  cat: { label: { en: "CatBot", ko: "냥냥봇" }, cry: { en: "Meow", ko: "냐옹" }, rare: false },
  lion: { label: { en: "LionBot", ko: "사자봇" }, cry: { en: "Roar!", ko: "어흥!" }, rare: false },
  tiger: { label: { en: "TigerBot", ko: "호랑이봇" }, cry: { en: "Grrar!", ko: "크앙!" }, rare: false },
  leopard: { label: { en: "LeopardBot", ko: "표범봇" }, cry: { en: "Prrrl", ko: "그르릉" }, rare: false },
  cheetah: { label: { en: "CheetahBot", ko: "치타봇" }, cry: { en: "Zoom!", ko: "슈웅!" }, rare: false },
  bear: { label: { en: "BearBot", ko: "곰봇" }, cry: { en: "Growl", ko: "크엉" }, rare: false },
  panda: { label: { en: "PandaBot", ko: "판다봇" }, cry: { en: "Munch munch", ko: "우물우물" }, rare: false },
  rabbit: { label: { en: "BunBot", ko: "토끼봇" }, cry: { en: "Hop!", ko: "깡총" }, rare: false },
  deer: { label: { en: "DeerBot", ko: "사슴봇" }, cry: { en: "Tak-tak", ko: "타닥" }, rare: false },
  goat: { label: { en: "GoatBot", ko: "염소봇" }, cry: { en: "Baa", ko: "메에" }, rare: false },
  horse: { label: { en: "HorseBot", ko: "말봇" }, cry: { en: "Neigh!", ko: "히힝" }, rare: false },
  bison: { label: { en: "BisonBot", ko: "들소봇" }, cry: { en: "Snort!", ko: "푸릉!" }, rare: false },
  elephant: { label: { en: "ElephantBot", ko: "코끼리봇" }, cry: { en: "Pawoo~", ko: "뿌우~" }, rare: false },
  rhino: { label: { en: "RhinoBot", ko: "코뿔소봇" }, cry: { en: "Stomp stomp", ko: "쿵쿵" }, rare: false },
  gorilla: { label: { en: "GorillaBot", ko: "고릴라봇" }, cry: { en: "Ooh-ooh!", ko: "우호!" }, rare: false },
  monkey: { label: { en: "MonkeyBot", ko: "원숭이봇" }, cry: { en: "Ee-ee!", ko: "우끼!" }, rare: false },
  otter: { label: { en: "OtterBot", ko: "수달봇" }, cry: { en: "Nom nom", ko: "찹찹" }, rare: false },
  raccoon: { label: { en: "RaccoonBot", ko: "너구리봇" }, cry: { en: "Rustle rustle", ko: "부스럭" }, rare: false },
  kangaroo: { label: { en: "RooBot", ko: "캥거루봇" }, cry: { en: "Boing!", ko: "폴짝!" }, rare: false },
  bat: { label: { en: "BatBot", ko: "박쥐봇" }, cry: { en: "Screee", ko: "끼릭" }, rare: false },
  eagle: { label: { en: "EagleBot", ko: "독수리봇" }, cry: { en: "Screech!", ko: "끼요오!" }, rare: false },
  owl: { label: { en: "OwlBot", ko: "부엉이봇" }, cry: { en: "Hoot", ko: "부엉" }, rare: false },
  raven: { label: { en: "RavenBot", ko: "까마귀봇" }, cry: { en: "Caw!", ko: "까악" }, rare: false },
  falcon: { label: { en: "FalconBot", ko: "매봇" }, cry: { en: "Kree!", ko: "삐이익!" }, rare: false },
  penguin: { label: { en: "PenguinBot", ko: "펭귄봇" }, cry: { en: "Waddle waddle", ko: "뒤뚱" }, rare: false },
  peacock: { label: { en: "PeacockBot", ko: "공작봇" }, cry: { en: "Flourish~", ko: "촤르륵" }, rare: false },
  parrot: { label: { en: "ParrotBot", ko: "앵무봇" }, cry: { en: "Hello!", ko: "안녕!" }, rare: false },
  crane: { label: { en: "CraneBot", ko: "두루미봇" }, cry: { en: "Kruu~", ko: "뚜루루" }, rare: false },
  crocodile: { label: { en: "CrocBot", ko: "악어봇" }, cry: { en: "Snap!", ko: "철컥!" }, rare: false },
  cobra: { label: { en: "CobraBot", ko: "코브라봇" }, cry: { en: "Sss...", ko: "스스슥" }, rare: false },
  chameleon: { label: { en: "ChamBot", ko: "카멜레온봇" }, cry: { en: "Slurp", ko: "늘름" }, rare: false },
  turtle: { label: { en: "TurtleBot", ko: "거북봇" }, cry: { en: "Slow & steady~", ko: "느긋~" }, rare: false },
  frog: { label: { en: "FrogBot", ko: "개굴봇" }, cry: { en: "Ribbit!", ko: "개굴!" }, rare: false },
  shark: { label: { en: "SharkBot", ko: "상어봇" }, cry: { en: "Swoosh!", ko: "슈욱!" }, rare: false },
  orca: { label: { en: "OrcaBot", ko: "범고래봇" }, cry: { en: "Splash!", ko: "촤아!" }, rare: false },
  dolphin: { label: { en: "DolphinBot", ko: "돌고래봇" }, cry: { en: "Click-click", ko: "끼익끼익" }, rare: false },
  whale: { label: { en: "WhaleBot", ko: "고래봇" }, cry: { en: "Wooong~", ko: "부우웅~" }, rare: false },
  octopus: { label: { en: "OctoBot", ko: "문어봇" }, cry: { en: "Squish", ko: "물컹" }, rare: false },
  squid: { label: { en: "SquidBot", ko: "오징어봇" }, cry: { en: "Jet-jet", ko: "슉슉" }, rare: false },
  crab: { label: { en: "CrabBot", ko: "게봇" }, cry: { en: "Snip snip", ko: "집게집게" }, rare: false },
  manta: { label: { en: "MantaBot", ko: "가오리봇" }, cry: { en: "Glide~", ko: "팔랑~" }, rare: false },
  seahorse: { label: { en: "SeahorseBot", ko: "해마봇" }, cry: { en: "Bob bob", ko: "동동" }, rare: false },
  stagbeetle: { label: { en: "StagBot", ko: "사슴벌레봇" }, cry: { en: "Clamp!", ko: "집게발!" }, rare: false },
  mantis: { label: { en: "MantisBot", ko: "사마귀봇" }, cry: { en: "Slash!", ko: "샥샥!" }, rare: false },
  scorpion: { label: { en: "ScorpionBot", ko: "전갈봇" }, cry: { en: "Zap!", ko: "찌릿!" }, rare: false },
  spider: { label: { en: "SpiderBot", ko: "거미봇" }, cry: { en: "Skitter skitter", ko: "스륵스륵" }, rare: false },
  butterfly: { label: { en: "FlutterBot", ko: "나비봇" }, cry: { en: "Flutter flutter", ko: "팔랑팔랑" }, rare: false },
  /* ---------- 공룡류 (RARE) ---------- */
  tyranno: { label: { en: "TyrannoBot", ko: "티라노봇" }, cry: { en: "RAWR!", ko: "크르르릉!" }, rare: true },
  tricera: { label: { en: "TriceraBot", ko: "트리케라봇" }, cry: { en: "Rumble rumble", ko: "두두둥" }, rare: true },
  raptor: { label: { en: "RaptorBot", ko: "랩터봇" }, cry: { en: "Screee!", ko: "캬악!" }, rare: true },
  anky: { label: { en: "AnkyloBot", ko: "안킬로봇" }, cry: { en: "Clang!", ko: "텅텅!" }, rare: true },
  ptera: { label: { en: "PteraBot", ko: "프테라봇" }, cry: { en: "Skreek!", ko: "키에엑!" }, rare: true },
  /* ---------- 환수종 (RARE) ---------- */
  dragon: { label: { en: "DragonBot", ko: "드래곤봇" }, cry: { en: "Fwoosh!", ko: "화르륵!" }, rare: true },
  phoenix: { label: { en: "PhoenixBot", ko: "불사조봇" }, cry: { en: "Flare!", ko: "파아앗!" }, rare: true },
  griffin: { label: { en: "GriffinBot", ko: "그리핀봇" }, cry: { en: "Kreee!", ko: "키이잉!" }, rare: true },
  qilin: { label: { en: "QilinBot", ko: "키린봇" }, cry: { en: "Ting-a-ling~", ko: "딸랑~" }, rare: true },
  cerberus: { label: { en: "CerberusBot", ko: "케르베로스봇" }, cry: { en: "Woof! Woof! Woof!", ko: "왈!왈!왈!" }, rare: true },
};

const FALLBACK: SpeciesDef = SPECIES_DEFS.dog;

export function getSpeciesInfo(species: TokenmonSpecies, lang: TokenmonLang = "en"): SpeciesInfo {
  const def = SPECIES_DEFS[species] ?? FALLBACK;
  return { label: def.label[lang], cry: def.cry[lang], rare: def.rare };
}

/** 색상 12종 — 원본(은빛+시안) 일러스트에 입히는 CSS 필터. */
export interface ColorInfo {
  label: string;
  /** 스프라이트 <img>에 적용할 filter 값. */
  filter: string;
  /** 색 견본용 대표색 (UI 장식용). */
  swatch: string;
}

interface ColorDef {
  label: { en: string; ko: string };
  filter: string;
  swatch: string;
}

export const COLOR_DEFS: Record<TokenmonColor, ColorDef> = {
  red: { label: { en: "Red", ko: "빨강" }, filter: "hue-rotate(170deg) saturate(1.15)", swatch: "#c8483f" },
  orange: { label: { en: "Orange", ko: "주황" }, filter: "hue-rotate(200deg) saturate(1.2) brightness(1.03)", swatch: "#d07030" },
  yellow: { label: { en: "Yellow", ko: "노랑" }, filter: "hue-rotate(230deg) saturate(1.2) brightness(1.06)", swatch: "#c9a227" },
  green: { label: { en: "Green", ko: "초록" }, filter: "hue-rotate(-60deg) saturate(1.1)", swatch: "#3f9a52" },
  blue: { label: { en: "Blue", ko: "파랑" }, filter: "hue-rotate(35deg) saturate(1.15)", swatch: "#3d6fc4" },
  indigo: { label: { en: "Indigo", ko: "남색" }, filter: "hue-rotate(75deg) saturate(1.1) brightness(0.97)", swatch: "#44519e" },
  violet: { label: { en: "Violet", ko: "보라" }, filter: "hue-rotate(100deg) saturate(1.15)", swatch: "#8a4fae" },
  white: { label: { en: "White", ko: "하양" }, filter: "saturate(0.25) brightness(1.1) contrast(0.96)", swatch: "#e8e6e0" },
  black: { label: { en: "Black", ko: "검정" }, filter: "saturate(0.55) brightness(0.72) contrast(1.18)", swatch: "#3d3a38" },
  gold: { label: { en: "Gold", ko: "금" }, filter: "sepia(0.5) saturate(1.5) hue-rotate(-15deg) brightness(1.05)", swatch: "#d4a842" },
  silver: { label: { en: "Silver", ko: "은" }, filter: "saturate(0.2) brightness(1.02)", swatch: "#b9bcc2" },
  bronze: { label: { en: "Bronze", ko: "동" }, filter: "sepia(0.6) saturate(1.35) hue-rotate(-20deg) brightness(0.92)", swatch: "#a5713c" },
};

export function getColorInfo(color: TokenmonColor, lang: TokenmonLang = "en"): ColorInfo {
  const def = COLOR_DEFS[color] ?? COLOR_DEFS.silver;
  return { label: def.label[lang], filter: def.filter, swatch: def.swatch };
}
