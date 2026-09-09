/**
 * 게임 콘텐츠 카탈로그. 가격/해금 레벨 등 밸런스 수치는 balance.ts 와 함께 조정한다.
 */
import type {
  AnimalSpeciesId,
  FurnitureId,
  PlacementArea,
  ProduceId,
  SellableId,
  SupplyId,
  TreeSpeciesId,
} from '@/types/game';

/* ---------------------------------- 나무 ---------------------------------- */

export interface TreeSpecies {
  id: TreeSpeciesId;
  name: string;
  seedName: string;
  seedPrice: number;
  fruitId: SellableId;
  fruitName: string;
  fruitPrice: number;
  /** 열매 맺을 때 한 번에 달리는 개수 */
  yield: number;
  unlockLevel: number;
  /** 단계 하나를 올리는 데 필요한 정답 수 */
  growthPerStage: number;
}

export const TREE_SPECIES: Record<TreeSpeciesId, TreeSpecies> = {
  apple: {
    id: 'apple',
    name: '사과나무',
    seedName: '사과 씨앗',
    seedPrice: 10,
    fruitId: 'apple',
    fruitName: '사과',
    fruitPrice: 6,
    yield: 3,
    unlockLevel: 1,
    growthPerStage: 1,
  },
  orange: {
    id: 'orange',
    name: '오렌지나무',
    seedName: '오렌지 씨앗',
    seedPrice: 20,
    fruitId: 'orange',
    fruitName: '오렌지',
    fruitPrice: 11,
    yield: 3,
    unlockLevel: 2,
    growthPerStage: 1,
  },
  peach: {
    id: 'peach',
    name: '복숭아나무',
    seedName: '복숭아 씨앗',
    seedPrice: 30,
    fruitId: 'peach',
    fruitName: '복숭아',
    // 오렌지보다 문제를 하나 더 풀어야 하므로 값도 그만큼 높다. (곡선 역전 방지)
    fruitPrice: 20,
    yield: 3,
    unlockLevel: 3,
    growthPerStage: 2,
  },
  cherry: {
    id: 'cherry',
    name: '체리나무',
    seedName: '체리 씨앗',
    seedPrice: 40,
    fruitId: 'cherry',
    fruitName: '체리',
    fruitPrice: 22,
    yield: 3,
    unlockLevel: 4,
    growthPerStage: 2,
  },
  grape: {
    id: 'grape',
    name: '포도나무',
    seedName: '포도 씨앗',
    seedPrice: 50,
    fruitId: 'grape',
    fruitName: '포도',
    fruitPrice: 27,
    yield: 3,
    unlockLevel: 5,
    growthPerStage: 2,
  },
  persimmon: {
    id: 'persimmon',
    name: '감나무',
    seedName: '감 씨앗',
    seedPrice: 75,
    fruitId: 'persimmon',
    fruitName: '감',
    fruitPrice: 40,
    yield: 3,
    unlockLevel: 6,
    growthPerStage: 3,
  },
};

export const TREE_LIST = Object.values(TREE_SPECIES);

export function seedIdOf(species: TreeSpeciesId) {
  return `seed_${species}` as const;
}

export function speciesOfSeed(seedId: string): TreeSpeciesId | null {
  const raw = seedId.replace('seed_', '');
  return raw in TREE_SPECIES ? (raw as TreeSpeciesId) : null;
}

/* ---------------------------------- 동물 ---------------------------------- */

export interface AnimalSpecies {
  id: AnimalSpeciesId;
  name: string;
  price: number;
  produceId: ProduceId;
  produceName: string;
  producePrice: number;
  /** 생산물이 나오기까지 필요한 먹이 주기 횟수 */
  careGoal: number;
  unlockLevel: number;
}

/**
 * 생산물 가격은 "같은 레벨 나무와 문제당 벌이가 비슷해지도록" 잡았다.
 *
 * 동물은 선투자(80~260원)가 크고 먹이도 물보다 비싸서, 예전 가격에서는
 * 나무보다 1.8~3.4배 불리했다. 그래서 아무도 동물을 살 이유가 없었다.
 * 지금은 나무와 비슷해서 취향대로 고를 수 있다.
 *
 *   문제당 벌이 = (생산물값 × 2 − 먹이값 × 돌봄횟수) / (돌봄횟수 + 1)
 */
export const ANIMAL_SPECIES: Record<AnimalSpeciesId, AnimalSpecies> = {
  chicken: {
    id: 'chicken',
    name: '닭',
    price: 80,
    produceId: 'egg',
    produceName: '달걀',
    producePrice: 26,
    careGoal: 2,
    unlockLevel: 2,
  },
  goat: {
    id: 'goat',
    name: '염소',
    price: 120,
    produceId: 'goatMilk',
    produceName: '염소젖',
    producePrice: 31,
    careGoal: 2,
    unlockLevel: 3,
  },
  sheep: {
    id: 'sheep',
    name: '양',
    price: 160,
    produceId: 'wool',
    produceName: '양털',
    producePrice: 45,
    careGoal: 3,
    unlockLevel: 4,
  },
  cow: {
    id: 'cow',
    name: '젖소',
    price: 260,
    produceId: 'milk',
    produceName: '우유',
    producePrice: 56,
    careGoal: 3,
    unlockLevel: 5,
  },
};

export const ANIMAL_LIST = Object.values(ANIMAL_SPECIES);

/* -------------------------------- 판매 가격 -------------------------------- */

export const SELL_PRICE: Record<SellableId, number> = {
  apple: TREE_SPECIES.apple.fruitPrice,
  orange: TREE_SPECIES.orange.fruitPrice,
  peach: TREE_SPECIES.peach.fruitPrice,
  cherry: TREE_SPECIES.cherry.fruitPrice,
  grape: TREE_SPECIES.grape.fruitPrice,
  persimmon: TREE_SPECIES.persimmon.fruitPrice,
  egg: ANIMAL_SPECIES.chicken.producePrice,
  goatMilk: ANIMAL_SPECIES.goat.producePrice,
  wool: ANIMAL_SPECIES.sheep.producePrice,
  milk: ANIMAL_SPECIES.cow.producePrice,
};

export const SELLABLE_NAME: Record<SellableId, string> = {
  apple: '사과',
  orange: '오렌지',
  peach: '복숭아',
  cherry: '체리',
  grape: '포도',
  persimmon: '감',
  egg: '달걀',
  goatMilk: '염소젖',
  wool: '양털',
  milk: '우유',
};

export const SELLABLE_ORDER: SellableId[] = [
  'apple',
  'orange',
  'peach',
  'cherry',
  'grape',
  'persimmon',
  'egg',
  'goatMilk',
  'wool',
  'milk',
];

/* -------------------------------- 물 · 먹이 -------------------------------- */

/**
 * 소모품. 나무에 물을 주거나 동물에게 먹이를 줄 때 하나씩 쓴다.
 * 가격은 한 묶음 기준이며, 한 번 사면 packSize 개가 들어온다.
 */
export interface SupplyDef {
  id: SupplyId;
  name: string;
  /** 한 묶음 이름. 예: "물 10개" */
  packName: string;
  packSize: number;
  price: number;
  /** 무엇에 쓰는지 설명 */
  usage: string;
}

export const SUPPLIES: Record<SupplyId, SupplyDef> = {
  water: {
    id: 'water',
    name: '물',
    packName: '물 10개',
    packSize: 10,
    price: 10,
    usage: '나무에 물을 줄 때 하나씩 써요',
  },
  feed: {
    id: 'feed',
    name: '먹이',
    packName: '먹이 10개',
    packSize: 10,
    price: 20,
    usage: '동물에게 먹이를 줄 때 하나씩 써요',
  },
};

export const SUPPLY_LIST = Object.values(SUPPLIES);

/* -------------------------------- 가구/장식 -------------------------------- */

/** 희귀도 대신 테마 컬렉션으로 묶는다. (명세 52) */
export type FurnitureTheme = 'basic' | 'cozy' | 'nature' | 'colorful' | 'starlight';

export const THEME_NAME: Record<FurnitureTheme, string> = {
  basic: '기본 세트',
  cozy: '포근한 방 세트',
  nature: '자연 숲 세트',
  colorful: '알록달록 세트',
  starlight: '별빛 세트',
};

/** placeholder 아트가 어떤 형태로 그릴지 정하는 키 */
export type FurnitureShape =
  | 'bed'
  | 'desk'
  | 'chair'
  | 'sofa'
  | 'bookshelf'
  | 'table'
  | 'lamp'
  | 'drawer'
  | 'plant'
  | 'frame'
  | 'doll'
  | 'clock'
  | 'carpet'
  | 'cushion'
  | 'fence'
  | 'bench'
  | 'flower'
  | 'streetlamp'
  | 'stonepath'
  | 'fountain';

export interface FurnitureDef {
  id: FurnitureId;
  name: string;
  theme: FurnitureTheme;
  shape: FurnitureShape;
  area: PlacementArea;
  price: number;
  unlockLevel: number;
  width: number;
  height: number;
  /** 주 색상 (placeholder 채색용) */
  tint: string;
}

export const FURNITURE: FurnitureDef[] = [
  // --- 기본 세트 (집) ---
  { id: 'bed_basic', name: '나무 침대', theme: 'basic', shape: 'bed', area: 'home', price: 60, unlockLevel: 1, width: 210, height: 120, tint: '#c08a52' },
  { id: 'desk_basic', name: '나무 책상', theme: 'basic', shape: 'desk', area: 'home', price: 45, unlockLevel: 1, width: 160, height: 112, tint: '#c08a52' },
  { id: 'chair_basic', name: '나무 의자', theme: 'basic', shape: 'chair', area: 'home', price: 25, unlockLevel: 1, width: 84, height: 116, tint: '#b57f4a' },
  { id: 'table_basic', name: '둥근 탁자', theme: 'basic', shape: 'table', area: 'home', price: 40, unlockLevel: 1, width: 150, height: 100, tint: '#c9955f' },
  { id: 'drawer_basic', name: '서랍장', theme: 'basic', shape: 'drawer', area: 'home', price: 55, unlockLevel: 1, width: 130, height: 130, tint: '#b8834f' },

  // --- 포근한 방 세트 ---
  { id: 'sofa_cozy', name: '포근한 소파', theme: 'cozy', shape: 'sofa', area: 'home', price: 95, unlockLevel: 2, width: 220, height: 128, tint: '#f0a6a0' },
  { id: 'cushion_cozy', name: '포근한 쿠션', theme: 'cozy', shape: 'cushion', area: 'home', price: 20, unlockLevel: 2, width: 84, height: 70, tint: '#f6c453' },
  { id: 'carpet_cozy', name: '포근한 카펫', theme: 'cozy', shape: 'carpet', area: 'home', price: 50, unlockLevel: 2, width: 240, height: 62, tint: '#e8998f' },
  { id: 'lamp_cozy', name: '포근한 조명', theme: 'cozy', shape: 'lamp', area: 'home', price: 65, unlockLevel: 3, width: 92, height: 190, tint: '#f6d78a' },

  // --- 자연 숲 세트 ---
  { id: 'bookshelf_nature', name: '숲 책장', theme: 'nature', shape: 'bookshelf', area: 'home', price: 110, unlockLevel: 3, width: 150, height: 210, tint: '#8aa86a' },
  { id: 'plant_nature', name: '큰 화분', theme: 'nature', shape: 'plant', area: 'home', price: 35, unlockLevel: 1, width: 96, height: 150, tint: '#6fbf6a' },
  { id: 'frame_nature', name: '숲 액자', theme: 'nature', shape: 'frame', area: 'home', price: 30, unlockLevel: 2, width: 104, height: 92, tint: '#a3714a' },

  // --- 알록달록 세트 ---
  { id: 'doll_colorful', name: '토끼 인형', theme: 'colorful', shape: 'doll', area: 'home', price: 40, unlockLevel: 2, width: 76, height: 100, tint: '#f6a8bd' },
  { id: 'clock_colorful', name: '알록달록 시계', theme: 'colorful', shape: 'clock', area: 'home', price: 45, unlockLevel: 3, width: 84, height: 84, tint: '#7fb8e6' },
  { id: 'carpet_colorful', name: '알록달록 카펫', theme: 'colorful', shape: 'carpet', area: 'home', price: 60, unlockLevel: 3, width: 240, height: 62, tint: '#8fd8c4' },

  // --- 별빛 세트 ---
  { id: 'bed_starlight', name: '별빛 침대', theme: 'starlight', shape: 'bed', area: 'home', price: 180, unlockLevel: 5, width: 215, height: 124, tint: '#b8a0e0' },
  { id: 'lamp_starlight', name: '별빛 조명', theme: 'starlight', shape: 'lamp', area: 'home', price: 130, unlockLevel: 5, width: 92, height: 190, tint: '#cbb6ef' },

  // --- 야외 ---
  { id: 'fence_wood', name: '나무 울타리', theme: 'basic', shape: 'fence', area: 'yard', price: 18, unlockLevel: 1, width: 130, height: 92, tint: '#c08a52' },
  { id: 'flower_bed', name: '꽃밭', theme: 'nature', shape: 'flower', area: 'yard', price: 22, unlockLevel: 1, width: 110, height: 76, tint: '#f6a8bd' },
  { id: 'bench_wood', name: '마당 벤치', theme: 'basic', shape: 'bench', area: 'yard', price: 55, unlockLevel: 2, width: 170, height: 104, tint: '#b57f4a' },
  { id: 'stonepath', name: '돌길', theme: 'nature', shape: 'stonepath', area: 'yard', price: 15, unlockLevel: 1, width: 140, height: 44, tint: '#cfc6b4' },
  { id: 'streetlamp', name: '가로등', theme: 'basic', shape: 'streetlamp', area: 'yard', price: 90, unlockLevel: 3, width: 80, height: 230, tint: '#6a5445' },
  { id: 'fountain', name: '작은 분수', theme: 'starlight', shape: 'fountain', area: 'yard', price: 220, unlockLevel: 5, width: 200, height: 150, tint: '#9ed4ea' },
];

export const FURNITURE_BY_ID: Record<string, FurnitureDef> = Object.fromEntries(
  FURNITURE.map((f) => [f.id, f]),
);

/* ------------------------------- 벽지 / 바닥 ------------------------------- */

export interface SurfaceDef {
  id: string;
  name: string;
  price: number;
  unlockLevel: number;
  color: string;
  accent: string;
  /** 색만으로 부족한 벽지는 무늬 타일을 따로 쓴다 */
  pattern?: 'star';
}

export const WALLPAPERS: SurfaceDef[] = [
  { id: 'wall_cream', name: '크림 벽지', price: 0, unlockLevel: 1, color: '#f7e6cd', accent: '#ecd7b6' },
  { id: 'wall_mint', name: '민트 벽지', price: 70, unlockLevel: 2, color: '#dff1e6', accent: '#c6e3d2' },
  { id: 'wall_sky', name: '하늘 벽지', price: 70, unlockLevel: 3, color: '#deeefb', accent: '#c4dff3' },
  { id: 'wall_star', name: '별빛 벽지', price: 150, unlockLevel: 5, color: '#e4dcf6', accent: '#cdc0ec', pattern: 'star' },
];

export const FLOORS: SurfaceDef[] = [
  { id: 'floor_wood', name: '나무 바닥', price: 0, unlockLevel: 1, color: '#d8a973', accent: '#c08a52' },
  { id: 'floor_tile', name: '체크 바닥', price: 70, unlockLevel: 2, color: '#f0e0c4', accent: '#dcc7a2' },
  { id: 'floor_carpet', name: '융단 바닥', price: 120, unlockLevel: 4, color: '#e6b3a6', accent: '#d0968a' },
];

export const SURFACE_BY_ID: Record<string, SurfaceDef> = Object.fromEntries(
  [...WALLPAPERS, ...FLOORS].map((s) => [s.id, s]),
);
