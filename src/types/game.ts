/**
 * 게임 도메인 타입.
 * 그래픽/저장소 구현과 무관한 순수 데이터 모델만 둔다. (개발원칙 8, 9)
 */

export type MultiplicationTable = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type AvatarId =
  | 'rabbit'
  | 'bear'
  | 'cat'
  | 'fox'
  | 'bird'
  | 'frog';

/** 게임 안에서 움직이는 내 캐릭터. 목록에서 고르는 아바타 아이콘과는 별개다. */
export type CharacterId = 'boy' | 'girl' | 'pucca' | 'danbi' | 'dooly' | 'mario';

export interface PlayerProfile {
  /** 내부 식별자. 이름을 DB 키로 쓰지 않는다. (명세 9) */
  id: string;
  displayName: string;
  avatarId: AvatarId;
  /**
   * 캐릭터가 하나뿐이던 시절에 만든 프로필에는 없다.
   * 직접 읽지 말고 characterOf() 를 쓴다.
   */
  characterId?: CharacterId;
  createdAt: string;
  /** 아직 한 번도 게임에 들어가지 않았으면 null. 교사가 미리 만든 이름이 그렇다. (명세 10, 73) */
  lastPlayedAt: string | null;
}

/** 예전 프로필에는 characterId 가 없다. 그때는 남자 캐릭터 하나뿐이었다. */
export function characterOf(profile: { characterId?: CharacterId } | null | undefined): CharacterId {
  return profile?.characterId ?? 'boy';
}

/** 현재 접속 세션에만 적용되는 설정. 저장하지 않는다. (명세 12) */
export interface GameSessionSettings {
  selectedMultiplicationTables: number[];
}

/* ---------------------------------- 농장 ---------------------------------- */

export type TreeSpeciesId = 'apple' | 'orange' | 'peach' | 'cherry' | 'grape' | 'persimmon';

/** 나무 성장 단계. (명세 20, 46) */
export type TreeStage = 'seed' | 'sprout' | 'sapling' | 'mature' | 'fruiting';

export const TREE_STAGE_ORDER: TreeStage[] = [
  'seed',
  'sprout',
  'sapling',
  'mature',
  'fruiting',
];

export interface FarmPlot {
  id: string;
  /** 마당의 몇 번째 밭인지. 월드 좌표 계산에 사용한다. */
  index: number;
  species: TreeSpeciesId | null;
  stage: TreeStage;
  /** 현재 단계에서 쌓은 성장 포인트 */
  growthPoints: number;
  /** 수확 가능한 열매 수 */
  fruitCount: number;
  /** 이 나무를 지금까지 몇 번 수확했는지. 한계에 닿으면 나무가 사라진다. */
  harvestCount: number;
}

/* ---------------------------------- 동물 ---------------------------------- */

export type AnimalSpeciesId = 'chicken' | 'goat' | 'sheep' | 'cow';

export interface AnimalInstance {
  id: string;
  species: AnimalSpeciesId;
  /** 돌봄 게이지 (0 ~ species.careGoal) */
  care: number;
  produceReady: boolean;
  /** 우리 안에서의 상대 위치(0~1). 배치 재현용. */
  spot: number;
}

/* -------------------------------- 아이템 --------------------------------- */

export type SeedId = `seed_${TreeSpeciesId}`;
export type FruitId = TreeSpeciesId;
export type ProduceId = 'egg' | 'wool' | 'milk' | 'goatMilk';
export type SellableId = FruitId | ProduceId;

/** 쓰면 없어지는 소모품. 농장 가게에서 산다. */
export type SupplyId = 'water' | 'feed';

export type FurnitureId = string;
export type ItemId = SeedId | SellableId | SupplyId | FurnitureId;

export type ItemCategory =
  | 'seed'
  | 'fruit'
  | 'produce'
  | 'supply'
  | 'furniture'
  | 'decoration'
  | 'outdoor';

/** 아이템 id -> 개수 */
export type Inventory = Record<string, number>;

/* -------------------------------- 집 꾸미기 -------------------------------- */

export type PlacementArea = 'home' | 'yard';

export interface PlacedItem {
  instanceId: string;
  itemId: FurnitureId;
  x: number;
  y: number;
  flipX: boolean;
}

export interface HomeState {
  wallpaperId: string;
  floorId: string;
  placed: PlacedItem[];
}

export interface YardState {
  placed: PlacedItem[];
}

/* -------------------------------- 저장 데이터 ------------------------------- */

/** 열매 받기 게임 기록 한 판 */
export interface MiniGameScore {
  score: number;
  playedAt: string;
}

export interface GameSaveData {
  schemaVersion: number;
  profile: PlayerProfile;
  money: number;
  experience: number;
  level: number;
  unlocked: string[];
  farm: { plots: FarmPlot[] };
  animals: AnimalInstance[];
  inventory: Inventory;
  home: HomeState;
  yard: YardState;
  /** 미니게임 최고 기록 */
  records: Record<string, number>;
  chests: number;
  /** 열매 받기 게임 기록 (점수 높은 순) */
  miniGameScores: MiniGameScore[];
  /**
   * 미니게임 상자 보상을 마지막으로 받은 날 (YYYY-MM-DD).
   * 게임은 몇 번이든 할 수 있지만 상자는 하루 한 번만 준다.
   */
  lastMiniGameRewardDate: string | null;
}
