import {
  SPECIES_FAMILY_KEYS,
  SPECIES_PALETTE_KEYS,
  parseSpeciesId,
  type TokenmonSpecies,
} from "@/lib/tokenmon";

/**
 * 종족 도트·색상 데이터 — 공통 10과(科) × 색상 변종 5 = 50종에
 * 레어 10종(공룡류 5 + 환수종 5)을 더해 총 60종.
 * 그리드는 12×12, '.'은 투명. 색상 문자: B몸 D윤곽 L밝음 E눈 K리벳 A포인트
 * W금속/수염 T화면 G코드/날개 O부리 P귀속 M갈기 Y등딱지/배.
 */

export type Palette = Record<string, string>;

/* ---------- 공통 부품색 ---------- */
const COMMON_PARTS: Palette = {
  E: "#20201e",
  K: "#9aa5a8",
  W: "#d5d9d5",
  T: "#26332e",
  G: "#58d08a",
  O: "#d97b2f",
  P: "#f0d0da",
  M: "#e88ab0",
  Y: "#d9a55a",
};

export const GOLD = "#dfae3c";

/* ---------- 색상 변종 팔레트 (이름 접두어 포함) ---------- */
const PALETTES: Record<string, { prefix: string; colors: Palette }> = {
  lemon: { prefix: "레몬", colors: { B: "#e3bd4a", D: "#96762a", L: "#f7ecc8", A: "#d95f5f" } },
  strawberry: { prefix: "딸기", colors: { B: "#d97d8c", D: "#99515e", L: "#f7dde2", A: "#58b0d0" } },
  mint: { prefix: "민트", colors: { B: "#6fbf9e", D: "#40806a", L: "#e2f4ec", A: "#d95f5f" } },
  sky: { prefix: "하늘", colors: { B: "#6da3cf", D: "#40658a", L: "#ddebf7", A: "#e0a03c" } },
  grape: { prefix: "포도", colors: { B: "#9a7ab8", D: "#64487e", L: "#ece2f4", A: "#dfae3c" } },
  cocoa: { prefix: "코코아", colors: { B: "#a5795a", D: "#6b4a34", L: "#efe2d8", A: "#58b0d0" } },
  lime: { prefix: "라임", colors: { B: "#97b856", D: "#5f7a30", L: "#ecf4d8", A: "#d95f5f" } },
  peach: { prefix: "복숭아", colors: { B: "#e8a06a", D: "#a6653a", L: "#f9e8da", A: "#4a9e8a" } },
  snow: { prefix: "눈꽃", colors: { B: "#e8eaee", D: "#9aa0ac", L: "#f8f9fb", A: "#d95f5f" } },
  charcoal: { prefix: "먹물", colors: { B: "#5a5f6a", D: "#33363e", L: "#c9cdd6", A: "#e0a03c" } },
};

/* ---------- 알 (전 종족 공용, 반점만 종족색) ---------- */
export const EGG_GRID = [
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

export const EGG_CRACKED_GRID = [
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

/* ---------- 공통 10과 도트 ---------- */

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

const BEAR_BABY = [
  "..DD....DD..",
  ".DBBD..DBBD.",
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
const BEAR_ADULT = [
  "..DD....DD..",
  ".DBBD..DBBD.",
  ".DBBDDDDBBD.",
  ".DBBBBBBBBD.",
  ".DBEBBBBEBD.",
  ".DBBBTTBBBD.",
  ".DKBBBBBBKD.",
  ".DBLTGGTLBD.",
  ".DBBLLLLBBD.",
  "..DDDDDDDD..",
  ".DDD....DDD.",
  "............",
];

const CHICK_BABY = [
  ".....A......",
  "...DDDDDD...",
  "..DBBBBBBD..",
  ".DBEBBBBEBD.",
  ".DBBBOOBBBD.",
  ".DKBBBBBBKD.",
  ".DBBLLLLBBD.",
  "..DBBBBBBD..",
  "...DDDDDD...",
  "..OO....OO..",
  "............",
  "............",
];
const CHICK_ADULT = [
  "....A.A.....",
  "...DDDDDD...",
  "..DBBBBBBD..",
  ".DBEBBBBEBD.",
  ".DBBBOOBBBD.",
  "BDKBBBBBBKDB",
  ".DBLTGGTLBD.",
  ".DBBLLLLBBD.",
  "..DBBBBBBD..",
  "..DDDDDDDD..",
  "..OO....OO..",
  "............",
];

const PIG_BABY = [
  ".DD......DD.",
  ".DBD....DBD.",
  ".DBBDDDDBBD.",
  ".DBBBBBBBBD.",
  ".DBEBBBBEBD.",
  ".DBBOOOOBBD.",
  ".DKBOTTOBKD.",
  ".DBBLLLLBBD.",
  "..DBBBBBBD..",
  "...DDDDDD...",
  "..DD....DD..",
  "............",
];
const PIG_ADULT = [
  ".DD......DD.",
  ".DBD....DBD.",
  ".DBBDDDDBBD.",
  ".DBBBBBBBBD.",
  ".DBEBBBBEBD.",
  ".DBBOOOOBBD.",
  ".DKBOTTOBKD.",
  ".DBLTGGTLBD.",
  ".DBBLLLLBBD.",
  "..DDDDDDDD..",
  ".DDD....DDD.",
  "............",
];

const OWL_BABY = [
  ".D........D.",
  ".DD......DD.",
  ".DBBDDDDBBD.",
  ".DBBBBBBBBD.",
  ".DBWEBBWEBD.",
  ".DBBBOOBBBD.",
  ".DKBBBBBBKD.",
  ".DBLLLLLLBD.",
  "..DBLLLLBD..",
  "..DDDDDDDD..",
  "..OO....OO..",
  "............",
];
const OWL_ADULT = [
  ".D........D.",
  ".DD......DD.",
  ".DBBDDDDBBD.",
  ".DBBBBBBBBD.",
  ".DBWEBBWEBD.",
  ".DBBBOOBBBD.",
  "BDKBBBBBBKDB",
  ".DBLTGGTLBD.",
  ".DBLLLLLLBD.",
  "..DDDDDDDD..",
  "..OO....OO..",
  "............",
];

const TURTLE_BABY = [
  "....DDDD....",
  "..DDBBBBDD..",
  ".DBBBBBBBBD.",
  ".DBEBBBBEBD.",
  ".DBBBBBBBBD.",
  ".DYYDYYDYYD.",
  ".DYYDYYDYYD.",
  ".DBBYYYYBBD.",
  "..DBBBBBBD..",
  "..DD....DD..",
  "............",
  "............",
];
const TURTLE_ADULT = [
  "....DDDD....",
  "..DDBBBBDD..",
  ".DBBBBBBBBD.",
  ".DBEBBBBEBD.",
  ".DKBBBBBBKD.",
  ".DYYDYYDYYD.",
  ".DYYDYYDYYD.",
  ".DYYDYYDYYD.",
  ".DBBYYYYBBD.",
  "..DDDDDDDD..",
  ".DD......DD.",
  "............",
];

/* ---------- 레어: 공룡류 5종 ---------- */

const TYRANNO_BABY = [
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
const TYRANNO_ADULT = [
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

const TRICERA_BABY = [
  ".A...AA...A.",
  "..DDDDDDDD..",
  ".DBBBBBBBBD.",
  ".DBEBBBBEBD.",
  ".DBBBBBBBBD.",
  ".DKBBBBBBKD.",
  ".DBBLLLLBBD.",
  "..DBBBBBBD..",
  "..DDDDDDDD..",
  ".DDD....DDD.",
  "............",
  "............",
];
const TRICERA_ADULT = [
  ".A...AA...A.",
  "..DDDDDDDD..",
  ".DBBBBBBBBD.",
  ".DBEBBBBEBD.",
  ".DBBBBBBBBD.",
  ".DKBBBBBBKD.",
  "DDBBLLLLBBDD",
  ".DBLLLLLLBD.",
  ".DBLLGGLLBD.",
  "..DBBBBBBD..",
  "..DDDDDDDD..",
  ".DDD....DDD.",
];

const STEGO_BABY = [
  ".A.A.A.A.A..",
  "..DDDDDDDD..",
  ".DBBBBBBBBD.",
  ".DBEBBBBEBD.",
  ".DBBBBBBBBD.",
  ".DKBBBBBBKD.",
  ".DBBLLLLBBD.",
  "..DBBBBBBD..",
  "..DDDDDDDD..",
  ".DDD....DDD.",
  "............",
  "............",
];
const STEGO_ADULT = [
  ".A.A.A.A.A..",
  "..DDDDDDDD..",
  ".DBBBBBBBBD.",
  ".DBEBBBBEBD.",
  ".DBBBBBBBBD.",
  ".DKBBBBBBKD.",
  "DDBBLLLLBBDD",
  ".DBLLLLLLBD.",
  ".DBLLGGLLBD.",
  "..DBBBBBBD..",
  "..DDDDDDDD..",
  ".DDD....DDD.",
];

const BRACHIO_BABY = [
  "....DDDD....",
  "...DBEEBD...",
  "...DBBBBD...",
  "...DBBBBD...",
  "..DDBBBBDD..",
  ".DBBBBBBBBD.",
  ".DKBBLLBBKD.",
  ".DBBLLLLBBD.",
  "..DBBBBBBD..",
  "..DD....DD..",
  "............",
  "............",
];
const BRACHIO_ADULT = [
  "....DDDD....",
  "...DBEEBD...",
  "...DBBBBD...",
  "...DBBBBD...",
  "...DBBBBD...",
  "..DDBBBBDD..",
  ".DBBBBBBBBD.",
  ".DKBBLLBBKD.",
  ".DBLTGGTLBD.",
  ".DBBLLLLBBD.",
  "..DDDDDDDD..",
  ".DDD....DDD.",
];

const PTERA_BABY = [
  "....DDDD....",
  "...DBBBBD...",
  "..DBEBBEBD..",
  "..DBBOOBBD..",
  "G.DBBBBBBD.G",
  "GGDKBBBBKDGG",
  ".GDBLLLLBDG.",
  "..DBBBBBBD..",
  "..DD....DD..",
  "............",
  "............",
  "............",
];
const PTERA_ADULT = [
  "....DDDD....",
  "...DBBBBD...",
  "..DBEBBEBD..",
  "..DBBOOBBD..",
  "G.DDBBBBDD.G",
  "GGDBBBBBBDGG",
  "GGDKBBBBKDGG",
  ".GDBLLLLBDG.",
  "..DBBBBBBD..",
  "..DDDDDDDD..",
  "..DD....DD..",
  "............",
];

/* ---------- 레어: 환수종 5종 ---------- */

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

const PHOENIX_BABY = [
  ".....AA.....",
  "...DDDDDD...",
  "..DBBBBBBD..",
  ".DBEBBBBEBD.",
  ".DBBBOOBBBD.",
  ".DKBBBBBBKD.",
  ".DBLYYYYLBD.",
  "..DBBBBBBD..",
  "..OO....OO..",
  "............",
  "............",
  "............",
];
const PHOENIX_ADULT = [
  ".A..AA..A...",
  "...DDDDDD...",
  "..DBBBBBBD..",
  ".DBEBBBBEBD.",
  ".DBBBOOBBBD.",
  "ADKBBBBBBKDA",
  "ADBLYYYYLBDA",
  ".DBLYYYYLBD.",
  "..DBBBBBBD..",
  "..DDDDDDDD..",
  "..OO....OO..",
  "............",
];

const GUMIHO_BABY = [
  "..D......D..",
  ".DPD....DPD.",
  ".DBBDDDDBBD.",
  ".DBBBBBBBBD.",
  ".DBEBBBBEBD.",
  ".DBBBTTBBBD.",
  ".DKBBBBBBKD.",
  ".DBBLLLLBBD.",
  "..DBBBBBBD..",
  "..DD....DLL.",
  "............",
  "............",
];
const GUMIHO_ADULT = [
  "..D......D..",
  ".DPD....DPD.",
  ".DBBDDDDBBD.",
  ".DBBBBBBBBD.",
  ".DBEBBBBEBD.",
  ".DBWBBBBWBD.",
  ".DKBBTTBBKD.",
  ".DBBLLLLBBD.",
  "..DBBBBBBD..",
  ".LL.LL.LL.LL",
  "............",
  "............",
];

const PEGASUS_BABY = [
  "..MDDDDDD...",
  ".MDBBBBBBD..",
  ".MDBEBBEBD..",
  "..DBBBBBBD..",
  "BDKBBBBBBKDB",
  ".DBBLLLLBBD.",
  "..DBBBBBBD..",
  "...DDDDDD...",
  "..DD....DD..",
  "............",
  "............",
  "............",
];
const PEGASUS_ADULT = [
  "..MDDDDDD...",
  ".MDBBBBBBD..",
  ".MDBEBBEBD..",
  "..DBBBBBBD..",
  "BDBBBTTBBBDB",
  "BDKBBBBBBKDB",
  ".DBBLLLLBBD.",
  "..DBBBBBBD..",
  "...DDDDDD...",
  "..DD....DD..",
  "............",
  "............",
];

/* ---------- 과(科) 정의 ---------- */

interface FamilyDef {
  label: string;
  cry: string;
  baby: string[];
  adult: string[];
}

const FAMILIES: Record<(typeof SPECIES_FAMILY_KEYS)[number], FamilyDef> = {
  duck: { label: "꽥꽥", cry: "꽥!", baby: DUCK_BABY, adult: DUCK_ADULT },
  cat: { label: "냥냥", cry: "냥!", baby: CAT_BABY, adult: CAT_ADULT },
  penguin: { label: "펭펭", cry: "펭!", baby: PENGUIN_BABY, adult: PENGUIN_ADULT },
  bunny: { label: "깡총", cry: "깡총!", baby: BUNNY_BABY, adult: BUNNY_ADULT },
  frog: { label: "개굴", cry: "개굴!", baby: FROG_BABY, adult: FROG_ADULT },
  bear: { label: "곰곰", cry: "쿠웅!", baby: BEAR_BABY, adult: BEAR_ADULT },
  chick: { label: "삐약", cry: "삐약!", baby: CHICK_BABY, adult: CHICK_ADULT },
  pig: { label: "꿀꿀", cry: "꿀꿀!", baby: PIG_BABY, adult: PIG_ADULT },
  owl: { label: "부엉", cry: "부엉!", baby: OWL_BABY, adult: OWL_ADULT },
  turtle: { label: "엉금", cry: "엉금!", baby: TURTLE_BABY, adult: TURTLE_ADULT },
};

/* ---------- 레어 정의 (고정 팔레트) ---------- */

export interface SpeciesDef {
  label: string;
  cry: string;
  baby: string[];
  adult: string[];
  colors: Palette;
  /** 벡터 렌더러가 쓰는 형태 키 — 흔한 종은 과(科) 키, 레어는 자기 ID. */
  shape: string;
  /** 알 반점 색 — 몸색이 너무 연한 종족용 힌트 색. */
  hint?: string;
  rare?: boolean;
  rareKind?: "dino" | "mythic";
}

const RARE_DEFS: Record<string, Omit<SpeciesDef, "shape">> = {
  tyranno: {
    label: "티라노봇",
    cry: "쿠앙!",
    rare: true,
    rareKind: "dino",
    baby: TYRANNO_BABY,
    adult: TYRANNO_ADULT,
    colors: { B: "#4f9e8a", D: "#2f6355", L: "#d8ede5", A: "#d97b2f" },
  },
  tricera: {
    label: "트리케라봇",
    cry: "푸릉!",
    rare: true,
    rareKind: "dino",
    baby: TRICERA_BABY,
    adult: TRICERA_ADULT,
    colors: { B: "#7a9e4f", D: "#4c6630", L: "#e4efd4", A: "#dfae3c" },
  },
  stego: {
    label: "스테고봇",
    cry: "우걱!",
    rare: true,
    rareKind: "dino",
    baby: STEGO_BABY,
    adult: STEGO_ADULT,
    colors: { B: "#5a8ab0", D: "#375a78", L: "#dcebf5", A: "#d97b2f" },
  },
  brachio: {
    label: "브라키오봇",
    cry: "뿌우!",
    rare: true,
    rareKind: "dino",
    baby: BRACHIO_BABY,
    adult: BRACHIO_ADULT,
    colors: { B: "#b0a04f", D: "#786c2e", L: "#f2edd2", A: "#d95f5f" },
  },
  ptera: {
    label: "프테라봇",
    cry: "끼에엑!",
    rare: true,
    rareKind: "dino",
    baby: PTERA_BABY,
    adult: PTERA_ADULT,
    colors: { B: "#8a6ab0", D: "#5a4278", L: "#e8e0f2", A: "#e0a03c", G: "#5a4278" },
  },
  unicorn: {
    label: "유니뿅",
    cry: "뿅!",
    rare: true,
    rareKind: "mythic",
    baby: UNICORN_BABY,
    adult: UNICORN_ADULT,
    hint: "#e88ab0",
    colors: { B: "#eef0f4", D: "#8a90a5", L: "#fce8ef", T: "#b58aa5", A: "#dfae3c" },
  },
  dragonet: {
    label: "용용봇",
    cry: "크앙!",
    rare: true,
    rareKind: "mythic",
    baby: DRAGONET_BABY,
    adult: DRAGONET_ADULT,
    colors: { B: "#c56a5a", D: "#7e4238", L: "#f2ded8", Y: "#e8c078", G: "#8a4a3e", A: "#dfae3c" },
  },
  phoenix: {
    label: "불사삐약",
    cry: "화르륵!",
    rare: true,
    rareKind: "mythic",
    baby: PHOENIX_BABY,
    adult: PHOENIX_ADULT,
    colors: { B: "#d96a3c", D: "#8a3c1e", L: "#f7d8c8", Y: "#e8c078", A: "#e0a03c" },
  },
  gumiho: {
    label: "구미호봇",
    cry: "콘!",
    rare: true,
    rareKind: "mythic",
    baby: GUMIHO_BABY,
    adult: GUMIHO_ADULT,
    colors: { B: "#e8c89a", D: "#a08050", L: "#faf0e0", W: "#f8f4ea", A: "#d95f5f" },
  },
  pegasus: {
    label: "페가봇",
    cry: "히힝!",
    rare: true,
    rareKind: "mythic",
    baby: PEGASUS_BABY,
    adult: PEGASUS_ADULT,
    hint: "#8ab8e0",
    colors: { B: "#eef0f4", D: "#8a90a5", L: "#fce8ef", M: "#8ab8e0", T: "#b58aa5", A: "#dfae3c" },
  },
};

/* ---------- 조회 ---------- */

const FALLBACK: SpeciesDef = {
  label: "미확인몬",
  cry: "…?",
  baby: CAT_BABY,
  adult: CAT_ADULT,
  colors: PALETTES.charcoal.colors,
  shape: "cat",
};

const cache = new Map<string, SpeciesDef>();

export function getSpeciesInfo(species: TokenmonSpecies): SpeciesDef {
  const cached = cache.get(species);
  if (cached) return cached;

  let def: SpeciesDef;
  const rare = RARE_DEFS[species];
  if (rare) {
    def = { ...rare, shape: species };
  } else {
    const parsed = parseSpeciesId(species);
    const family = parsed ? FAMILIES[parsed.family as keyof typeof FAMILIES] : undefined;
    const palette = parsed ? PALETTES[parsed.palette] : undefined;
    def =
      family && palette
        ? {
            label: `${palette.prefix}${family.label}봇`,
            cry: family.cry,
            baby: family.baby,
            adult: family.adult,
            colors: palette.colors,
            shape: parsed ? parsed.family : "cat",
          }
        : FALLBACK;
  }
  cache.set(species, def);
  return def;
}

export function paletteFor(species: TokenmonSpecies, stage: "egg" | "baby" | "pet" | "dragon"): Palette {
  const info = getSpeciesInfo(species);
  if (stage === "egg") return { B: "#f0e7d4", S: info.hint ?? info.colors.B, D: "#b8a87e", C: "#8f8060" }; // 껍질 반점이 종족색 힌트
  const base = { ...COMMON_PARTS, ...info.colors };
  if (stage === "dragon") return { ...base, A: GOLD, G: info.colors.G ?? GOLD, K: GOLD }; // 황금킹 — 금장 트림
  return base;
}

export function gridFor(species: TokenmonSpecies, stage: "egg" | "baby" | "pet" | "dragon", levelProgressPct: number): string[] {
  if (stage === "egg") return levelProgressPct >= 60 ? EGG_CRACKED_GRID : EGG_GRID;
  const info = getSpeciesInfo(species);
  return stage === "baby" ? info.baby : info.adult;
}

export { SPECIES_FAMILY_KEYS, SPECIES_PALETTE_KEYS };
