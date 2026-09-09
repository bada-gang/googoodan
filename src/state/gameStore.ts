/**
 * 게임 상태 스토어. Phaser 와 React 가 같은 상태를 본다. (명세 70)
 *
 * 규칙:
 *  - 여기에는 게임 규칙만 둔다. 저장은 persistence.ts 가 구독해서 처리한다. (명세 9번 원칙)
 *  - 문제 풀이 성공 여부는 UI 가 판단해 액션을 호출한다. 스토어는 문제를 모른다.
 */
import { create } from 'zustand';
import {
  EXP_BONUS,
  EXP_PER_CORRECT,
  MAX_LEVEL,
  NEXT_STAGE,
  START_INVENTORY,
  START_MONEY,
  MAX_HARVESTS_PER_TREE,
  MINIGAME_SCORE_KEEP,
  expToNextLevel,
  harvestAmount,
  produceAmount,
  rollChest,
} from '@/config/balance';
import {
  ANIMAL_SPECIES,
  FURNITURE_BY_ID,
  SELL_PRICE,
  SUPPLIES,
  SURFACE_BY_ID,
  TREE_SPECIES,
  seedIdOf,
  speciesOfSeed,
} from '@/config/catalog';
import { PLOT_COUNT } from '@/config/layout';
import type {
  AnimalInstance,
  AnimalSpeciesId,
  GameSaveData,
  HomeState,
  Inventory,
  MiniGameScore,
  PlacedItem,
  PlacementArea,
  PlayerProfile,
  FarmPlot,
  SellableId,
  SupplyId,
  TreeSpeciesId,
  YardState,
} from '@/types/game';
import type { LearningStats, MathContext, MathQuestion } from '@/types/learning';
import { createEmptyLearningStats, problemKey } from '@/types/learning';
import { RECENT_MEMORY, WRONG_REVIEW_MAX_GAP } from '@/config/balance';
import { repositories } from '@/data';

export const SCHEMA_VERSION = 1;

/* ------------------------------- 초기 상태 생성 ------------------------------ */

function createPlots(): FarmPlot[] {
  return Array.from({ length: PLOT_COUNT }, (_, index) => ({
    id: `plot_${index}`,
    index,
    species: null,
    stage: 'seed' as const,
    growthPoints: 0,
    fruitCount: 0,
    harvestCount: 0,
  }));
}

/** 오늘 날짜 (기기 시간 기준, YYYY-MM-DD) */
export function todayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function createInitialSave(profile: PlayerProfile): GameSaveData {
  return {
    schemaVersion: SCHEMA_VERSION,
    profile,
    money: START_MONEY,
    experience: 0,
    level: 1,
    unlocked: [],
    farm: { plots: createPlots() },
    animals: [],
    inventory: { ...START_INVENTORY },
    home: { wallpaperId: 'wall_cream', floorId: 'floor_wood', placed: [] },
    yard: { placed: [] },
    records: {},
    chests: 0,
    miniGameScores: [],
    lastMiniGameRewardDate: null,
  };
}

/** 지금 게임에 남아 있는 아이템인지 (없어진 씨앗·열매를 걸러낸다) */
function isKnownItem(itemId: string): boolean {
  if (itemId in SUPPLIES) return true;
  if (itemId in SELL_PRICE) return true;
  if (itemId in FURNITURE_BY_ID) return true;
  if (itemId.startsWith('seed_')) return speciesOfSeed(itemId) !== null;
  return false;
}

/**
 * 저장 데이터가 오래되었거나 손상된 경우를 메꾼다.
 *
 * - 밭 칸 수가 늘면 기존 밭은 두고 빈 밭만 추가한다 (키우던 나무를 잃지 않는다)
 * - 없어진 나무 종류가 심겨 있으면 그 밭만 비운다
 * - 없어진 아이템은 가방에서 뺀다
 */
function migrate(save: GameSaveData, profile: PlayerProfile): GameSaveData {
  const base = createInitialSave(profile);
  const saved = Array.isArray(save.farm?.plots) ? save.farm.plots : [];

  const plots = base.farm.plots.map((fresh, index) => {
    const old = saved[index];
    if (!old) return fresh;
    // 더 이상 없는 나무가 심겨 있으면 빈 밭으로 되돌린다.
    if (old.species && !(old.species in TREE_SPECIES)) return fresh;
    // harvestCount 가 없던 시절의 저장 데이터는 0 부터 센다.
    return { ...fresh, ...old, harvestCount: old.harvestCount ?? 0, id: fresh.id, index };
  });

  const inventory = Object.fromEntries(
    Object.entries(save.inventory ?? {}).filter(
      ([itemId, count]) => count > 0 && isKnownItem(itemId),
    ),
  );

  return {
    ...base,
    ...save,
    schemaVersion: SCHEMA_VERSION,
    profile,
    farm: { plots },
    home: { ...base.home, ...(save.home ?? {}) },
    yard: { ...base.yard, ...(save.yard ?? {}) },
    inventory,
    animals: Array.isArray(save.animals) ? save.animals : [],
    records: save.records ?? {},
    chests: save.chests ?? 0,
    miniGameScores: Array.isArray(save.miniGameScores) ? save.miniGameScores : [],
    lastMiniGameRewardDate: save.lastMiniGameRewardDate ?? null,
  };
}

/* --------------------------------- 스토어 --------------------------------- */

export interface HarvestResult {
  species: TreeSpeciesId;
  /** 실제로 딴 개수. 세 번 틀리면 0 일 수 있다. */
  count: number;
  /** 이 나무를 지금까지 딴 횟수 */
  harvestCount: number;
  /** 앞으로 더 딸 수 있는 횟수 */
  remaining: number;
  /** 다 따서 나무가 사라졌는지 */
  finished: boolean;
}

/** 열매 받기 게임 한 판을 기록한 결과 */
export interface MiniGameRecordResult {
  /** 보관 중인 기록 안에서의 등수 (1부터). 기록에 못 들면 null */
  rank: number | null;
  scores: MiniGameScore[];
}

export interface ProduceResult {
  produce: SellableId;
  /** 실제로 받은 개수. 세 번 틀리면 0 일 수 있다. */
  count: number;
}

export interface LevelUpResult {
  leveledUp: boolean;
  newLevel: number;
}

interface GameStoreState {
  status: 'empty' | 'loading' | 'ready';
  profile: PlayerProfile | null;
  selectedTables: number[];

  money: number;
  experience: number;
  level: number;
  unlocked: string[];
  plots: FarmPlot[];
  animals: AnimalInstance[];
  inventory: Inventory;
  home: HomeState;
  yard: YardState;
  records: Record<string, number>;
  chests: number;

  stats: LearningStats;
  /** 최근 출제된 문제 키 (앞이 최신) */
  recentQuestions: string[];
  /** 문제를 푼 횟수 — 오답 복습 간격 계산용 */
  questionCounter: number;
  /** 열매 받기 게임 기록 (점수 높은 순) */
  miniGameScores: MiniGameScore[];
  /** 상자 보상을 마지막으로 받은 날 (YYYY-MM-DD) */
  lastMiniGameRewardDate: string | null;
  /** 오늘 상자를 아직 안 받았는지. 게임 자체는 몇 번이든 할 수 있다. */
  canClaimMiniGameReward: () => boolean;
  /** 상자를 받았다고 표시한다 (오늘 하루 소진) */
  claimMiniGameReward: () => void;
  /** 한 판 결과를 기록하고 등수를 돌려준다 */
  recordMiniGameScore: (score: number) => MiniGameRecordResult;

  /* ---- 세션 ---- */
  beginSession: (profile: PlayerProfile, tables: number[]) => Promise<void>;
  leaveSession: () => void;
  toSaveData: () => GameSaveData | null;

  /* ---- 재화 ---- */
  addMoney: (amount: number) => void;
  spendMoney: (amount: number) => boolean;
  gainExperience: (context: MathContext) => LevelUpResult;

  /* ---- 인벤토리 ---- */
  itemCount: (itemId: string) => number;
  addItem: (itemId: string, count?: number) => void;
  consumeItem: (itemId: string, count?: number) => boolean;

  /* ---- 농장 ---- */
  plantSeed: (plotId: string, species: TreeSpeciesId) => boolean;
  /** 물을 하나 써서 나무를 키운다. 물이 없으면 false. */
  growPlot: (plotId: string) => boolean;
  /** @param wrongAttempts 정답까지 틀린 횟수. 적을수록 많이 딴다. */
  harvestPlot: (plotId: string, wrongAttempts?: number) => HarvestResult | null;

  /* ---- 동물 ---- */
  addAnimal: (species: AnimalSpeciesId) => AnimalInstance | null;
  feedAnimal: (animalId: string) => boolean;
  /** @param wrongAttempts 정답까지 틀린 횟수. 적을수록 많이 받는다. */
  collectProduce: (animalId: string, wrongAttempts?: number) => ProduceResult | null;

  /* ---- 상점 / 판매 ---- */
  buySeed: (species: TreeSpeciesId) => boolean;
  buyFurniture: (itemId: string) => boolean;
  buyAnimal: (species: AnimalSpeciesId) => boolean;
  buySurface: (surfaceId: string) => boolean;
  /** 물·먹이를 한 묶음 산다. */
  buySupply: (supplyId: SupplyId) => boolean;
  sellItem: (itemId: SellableId, count: number) => number;
  sellableTotal: () => number;

  /* ---- 꾸미기 ---- */
  placeItem: (area: PlacementArea, itemId: string, x: number, y: number) => PlacedItem | null;
  moveItem: (area: PlacementArea, instanceId: string, x: number, y: number) => void;
  flipItem: (area: PlacementArea, instanceId: string) => void;
  retrieveItem: (area: PlacementArea, instanceId: string) => void;
  setWallpaper: (surfaceId: string) => void;
  setFloor: (surfaceId: string) => void;

  /* ---- 보상 ---- */
  addChest: (count?: number) => void;
  openChest: () => number | null;
  setRecord: (key: string, value: number) => void;

  /* ---- 학습 ---- */
  recordAttempt: (question: MathQuestion, isCorrect: boolean) => void;
  noteQuestionAsked: (question: MathQuestion) => void;
}

/**
 * 이번 세션에서 자동 저장을 막을지. 저장본을 못 읽은 채로 시작한 판이 여기 해당한다.
 * 그대로 저장하면 학생의 기존 진행도를 새 게임으로 덮어쓰게 된다.
 */
let savingBlocked = false;

export function isSavingBlocked(): boolean {
  return savingBlocked;
}

export const useGameStore = create<GameStoreState>()((set, get) => ({
  status: 'empty',
  profile: null,
  selectedTables: [],

  money: 0,
  experience: 0,
  level: 1,
  unlocked: [],
  plots: createPlots(),
  animals: [],
  inventory: {},
  home: { wallpaperId: 'wall_cream', floorId: 'floor_wood', placed: [] },
  yard: { placed: [] },
  records: {},
  chests: 0,

  stats: createEmptyLearningStats(),
  recentQuestions: [],
  questionCounter: 0,
  miniGameScores: [],
  lastMiniGameRewardDate: null,

  canClaimMiniGameReward: () => get().lastMiniGameRewardDate !== todayKey(),

  claimMiniGameReward: () => set({ lastMiniGameRewardDate: todayKey() }),

  recordMiniGameScore: (score) => {
    const entry: MiniGameScore = { score, playedAt: new Date().toISOString() };
    const kept = [...get().miniGameScores, entry]
      .sort((a, b) => b.score - a.score || a.playedAt.localeCompare(b.playedAt))
      .slice(0, MINIGAME_SCORE_KEEP);
    set({ miniGameScores: kept });

    const index = kept.findIndex((s) => s.playedAt === entry.playedAt && s.score === entry.score);
    return { rank: index >= 0 ? index + 1 : null, scores: kept };
  },

  /* -------------------------------- 세션 -------------------------------- */

  beginSession: async (profile, tables) => {
    set({ status: 'loading' });
    const repos = repositories();

    // 저장본을 못 읽었을 때 시작 화면에 학생을 가둬 두지 않는다.
    // 대신 그 세션은 저장하지 않는다 — 새 게임으로 기존 진행도를 덮어쓰면 안 되니까.
    let loadFailed = false;
    const [saved, savedStats] = await Promise.all([
      repos.gameState.load(profile.id).catch((error) => {
        loadFailed = true;
        console.error('[gameStore] 저장본을 불러오지 못해 이번 판은 저장하지 않습니다.', error);
        return null;
      }),
      repos.learning.loadStats(profile.id).catch(() => null),
    ]);
    savingBlocked = loadFailed;

    const save = saved ? migrate(saved, profile) : createInitialSave(profile);
    await repos.player.touchLastPlayed(profile.id).catch(() => undefined);

    set({
      status: 'ready',
      profile,
      selectedTables: [...tables].sort((a, b) => a - b),
      money: save.money,
      experience: save.experience,
      level: save.level,
      unlocked: save.unlocked,
      plots: save.farm.plots,
      animals: save.animals,
      inventory: save.inventory,
      home: save.home,
      yard: save.yard,
      records: save.records,
      chests: save.chests,
      miniGameScores: save.miniGameScores,
      lastMiniGameRewardDate: save.lastMiniGameRewardDate,
      stats: savedStats ?? createEmptyLearningStats(),
      recentQuestions: [],
      questionCounter: 0,
    });
  },

  leaveSession: () => {
    set({ status: 'empty', profile: null, selectedTables: [] });
  },

  toSaveData: () => {
    const s = get();
    if (!s.profile) return null;
    return {
      schemaVersion: SCHEMA_VERSION,
      profile: s.profile,
      money: s.money,
      experience: s.experience,
      level: s.level,
      unlocked: s.unlocked,
      farm: { plots: s.plots },
      animals: s.animals,
      inventory: s.inventory,
      home: s.home,
      yard: s.yard,
      records: s.records,
      chests: s.chests,
      miniGameScores: s.miniGameScores,
      lastMiniGameRewardDate: s.lastMiniGameRewardDate,
    };
  },

  /* -------------------------------- 재화 -------------------------------- */

  addMoney: (amount) => set((s) => ({ money: Math.max(0, s.money + amount) })),

  spendMoney: (amount) => {
    if (get().money < amount) return false;
    set((s) => ({ money: s.money - amount }));
    return true;
  },

  gainExperience: (context) => {
    const gain = EXP_PER_CORRECT + (EXP_BONUS[context] ?? 0);
    let { level, experience } = get();
    experience += gain;
    let leveledUp = false;
    const gained: string[] = [];
    while (level < MAX_LEVEL && experience >= expToNextLevel(level)) {
      experience -= expToNextLevel(level);
      level += 1;
      leveledUp = true;
      gained.push(`level_${level}`);
    }
    set((s) => ({
      level,
      experience,
      unlocked: gained.length ? [...new Set([...s.unlocked, ...gained])] : s.unlocked,
    }));
    return { leveledUp, newLevel: level };
  },

  /* ------------------------------ 인벤토리 ------------------------------ */

  itemCount: (itemId) => get().inventory[itemId] ?? 0,

  addItem: (itemId, count = 1) =>
    set((s) => ({
      inventory: { ...s.inventory, [itemId]: (s.inventory[itemId] ?? 0) + count },
    })),

  consumeItem: (itemId, count = 1) => {
    const have = get().inventory[itemId] ?? 0;
    if (have < count) return false;
    set((s) => {
      const next = { ...s.inventory };
      const left = (next[itemId] ?? 0) - count;
      if (left > 0) next[itemId] = left;
      else delete next[itemId];
      return { inventory: next };
    });
    return true;
  },

  /* -------------------------------- 농장 -------------------------------- */

  plantSeed: (plotId, species) => {
    const plot = get().plots.find((p) => p.id === plotId);
    if (!plot || plot.species) return false;
    if (!get().consumeItem(seedIdOf(species))) return false;
    set((s) => ({
      plots: s.plots.map((p) =>
        p.id === plotId
          ? { ...p, species, stage: 'seed', growthPoints: 0, fruitCount: 0 }
          : p,
      ),
    }));
    return true;
  },

  growPlot: (plotId) => {
    const plot = get().plots.find((p) => p.id === plotId);
    if (!plot?.species) return false;
    // 물을 하나 쓴다. 없으면 키울 수 없다.
    if (!get().consumeItem('water')) return false;
    const species = TREE_SPECIES[plot.species];
    const needed = species.growthPerStage;
    const nextPoints = plot.growthPoints + 1;

    if (nextPoints < needed) {
      set((s) => ({
        plots: s.plots.map((p) => (p.id === plotId ? { ...p, growthPoints: nextPoints } : p)),
      }));
      return true;
    }

    const nextStage = NEXT_STAGE[plot.stage];
    if (!nextStage) return false;
    set((s) => ({
      plots: s.plots.map((p) =>
        p.id === plotId
          ? {
              ...p,
              stage: nextStage,
              growthPoints: 0,
              fruitCount: nextStage === 'fruiting' ? species.yield : p.fruitCount,
            }
          : p,
      ),
    }));
    return true;
  },

  harvestPlot: (plotId, wrongAttempts = 0) => {
    const plot = get().plots.find((p) => p.id === plotId);
    if (!plot?.species || plot.stage !== 'fruiting' || plot.fruitCount <= 0) return null;
    const species = TREE_SPECIES[plot.species];
    // 한 번에 맞힐수록 많이 딴다. 나무에 달린 것보다 많이 딸 수는 없다.
    const count = Math.min(plot.fruitCount, harvestAmount(wrongAttempts));
    if (count > 0) get().addItem(species.fruitId, count);

    const harvestCount = plot.harvestCount + 1;
    // 다 딴 나무는 밭에서 사라진다. 그 밖에는 큰 나무로 돌아가 다시 열매를 맺는다.
    const finished = harvestCount >= MAX_HARVESTS_PER_TREE;

    set((s) => ({
      plots: s.plots.map((p) =>
        p.id !== plotId
          ? p
          : finished
            ? { ...p, species: null, stage: 'seed', growthPoints: 0, fruitCount: 0, harvestCount: 0 }
            : { ...p, stage: 'mature', growthPoints: 0, fruitCount: 0, harvestCount },
      ),
    }));

    return {
      species: plot.species,
      count,
      harvestCount,
      remaining: finished ? 0 : MAX_HARVESTS_PER_TREE - harvestCount,
      finished,
    };
  },

  /* -------------------------------- 동물 -------------------------------- */

  addAnimal: (species) => {
    const animal: AnimalInstance = {
      id: `animal_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      species,
      care: 0,
      produceReady: false,
      spot: Math.random(),
    };
    set((s) => ({ animals: [...s.animals, animal] }));
    return animal;
  },

  feedAnimal: (animalId) => {
    const animal = get().animals.find((a) => a.id === animalId);
    if (!animal || animal.produceReady) return false;
    // 먹이를 하나 쓴다. 없으면 줄 수 없다.
    if (!get().consumeItem('feed')) return false;
    const goal = ANIMAL_SPECIES[animal.species].careGoal;
    const care = animal.care + 1;
    set((s) => ({
      animals: s.animals.map((a) =>
        a.id === animalId
          ? { ...a, care: care >= goal ? 0 : care, produceReady: care >= goal }
          : a,
      ),
    }));
    return true;
  },

  collectProduce: (animalId, wrongAttempts = 0) => {
    const animal = get().animals.find((a) => a.id === animalId);
    if (!animal?.produceReady) return null;
    const produce = ANIMAL_SPECIES[animal.species].produceId;
    // 한 번에 맞힐수록 많이 받는다. (요청 6)
    const count = produceAmount(wrongAttempts);
    if (count > 0) get().addItem(produce, count);
    set((s) => ({
      animals: s.animals.map((a) => (a.id === animalId ? { ...a, produceReady: false } : a)),
    }));
    return { produce, count };
  },

  /* ------------------------------ 상점 / 판매 ----------------------------- */

  buySeed: (species) => {
    const def = TREE_SPECIES[species];
    if (!get().spendMoney(def.seedPrice)) return false;
    get().addItem(seedIdOf(species));
    return true;
  },

  buyFurniture: (itemId) => {
    const def = FURNITURE_BY_ID[itemId];
    if (!def) return false;
    if (!get().spendMoney(def.price)) return false;
    get().addItem(itemId);
    return true;
  },

  buyAnimal: (species) => {
    const def = ANIMAL_SPECIES[species];
    if (!get().spendMoney(def.price)) return false;
    get().addAnimal(species);
    return true;
  },

  buySupply: (supplyId) => {
    const def = SUPPLIES[supplyId];
    if (!def) return false;
    if (!get().spendMoney(def.price)) return false;
    get().addItem(supplyId, def.packSize);
    return true;
  },

  buySurface: (surfaceId) => {
    const def = SURFACE_BY_ID[surfaceId];
    if (!def) return false;
    if (get().unlocked.includes(`surface_${surfaceId}`)) return true;
    if (def.price > 0 && !get().spendMoney(def.price)) return false;
    set((s) => ({ unlocked: [...new Set([...s.unlocked, `surface_${surfaceId}`])] }));
    return true;
  },

  sellItem: (itemId, count) => {
    const available = get().itemCount(itemId);
    const amount = Math.min(available, count);
    if (amount <= 0) return 0;
    get().consumeItem(itemId, amount);
    const gain = SELL_PRICE[itemId] * amount;
    get().addMoney(gain);
    return gain;
  },

  sellableTotal: () => {
    const inv = get().inventory;
    return (Object.keys(SELL_PRICE) as SellableId[]).reduce(
      (sum, id) => sum + (inv[id] ?? 0) * SELL_PRICE[id],
      0,
    );
  },

  /* ------------------------------- 꾸미기 ------------------------------- */

  placeItem: (area, itemId, x, y) => {
    if (!get().consumeItem(itemId)) return null;
    const placed: PlacedItem = {
      instanceId: `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      itemId,
      x,
      y,
      flipX: false,
    };
    set((s) =>
      area === 'home'
        ? { home: { ...s.home, placed: [...s.home.placed, placed] } }
        : { yard: { ...s.yard, placed: [...s.yard.placed, placed] } },
    );
    return placed;
  },

  moveItem: (area, instanceId, x, y) =>
    set((s) => {
      const update = (items: PlacedItem[]) =>
        items.map((p) => (p.instanceId === instanceId ? { ...p, x, y } : p));
      return area === 'home'
        ? { home: { ...s.home, placed: update(s.home.placed) } }
        : { yard: { ...s.yard, placed: update(s.yard.placed) } };
    }),

  flipItem: (area, instanceId) =>
    set((s) => {
      const update = (items: PlacedItem[]) =>
        items.map((p) => (p.instanceId === instanceId ? { ...p, flipX: !p.flipX } : p));
      return area === 'home'
        ? { home: { ...s.home, placed: update(s.home.placed) } }
        : { yard: { ...s.yard, placed: update(s.yard.placed) } };
    }),

  retrieveItem: (area, instanceId) => {
    const list = area === 'home' ? get().home.placed : get().yard.placed;
    const target = list.find((p) => p.instanceId === instanceId);
    if (!target) return;
    get().addItem(target.itemId);
    set((s) => {
      const remove = (items: PlacedItem[]) => items.filter((p) => p.instanceId !== instanceId);
      return area === 'home'
        ? { home: { ...s.home, placed: remove(s.home.placed) } }
        : { yard: { ...s.yard, placed: remove(s.yard.placed) } };
    });
  },

  setWallpaper: (surfaceId) => set((s) => ({ home: { ...s.home, wallpaperId: surfaceId } })),
  setFloor: (surfaceId) => set((s) => ({ home: { ...s.home, floorId: surfaceId } })),

  /* -------------------------------- 보상 -------------------------------- */

  addChest: (count = 1) => set((s) => ({ chests: s.chests + count })),

  openChest: () => {
    if (get().chests <= 0) return null;
    const reward = rollChest();
    set((s) => ({ chests: s.chests - 1, money: s.money + reward }));
    return reward;
  },

  setRecord: (key, value) =>
    set((s) => ({
      records: { ...s.records, [key]: Math.max(s.records[key] ?? 0, value) },
    })),

  /* -------------------------------- 학습 -------------------------------- */

  noteQuestionAsked: (question) =>
    set((s) => ({
      recentQuestions: [problemKey(question.left, question.right), ...s.recentQuestions].slice(
        0,
        RECENT_MEMORY * 2,
      ),
      questionCounter: s.questionCounter + 1,
    })),

  recordAttempt: (question, isCorrect) => {
    const profile = get().profile;
    if (!profile) return;
    const key = problemKey(question.left, question.right);
    const now = new Date().toISOString();

    set((s) => {
      const stats = s.stats;
      const prev = stats.byProblem[key] ?? {
        key,
        left: question.left,
        right: question.right,
        attempts: 0,
        correct: 0,
        streak: 0,
        lastAttemptedAt: null,
      };
      const record = {
        ...prev,
        attempts: prev.attempts + 1,
        correct: prev.correct + (isCorrect ? 1 : 0),
        streak: isCorrect ? prev.streak + 1 : 0,
        lastAttemptedAt: now,
      };

      const table = stats.byTable[question.table] ?? { attempts: 0, correct: 0 };
      const wrongQueue = isCorrect
        ? stats.wrongQueue.filter((k) => k !== key)
        : [key, ...stats.wrongQueue.filter((k) => k !== key)].slice(0, WRONG_REVIEW_MAX_GAP);

      return {
        stats: {
          totalAttempts: stats.totalAttempts + 1,
          totalCorrect: stats.totalCorrect + (isCorrect ? 1 : 0),
          totalWrong: stats.totalWrong + (isCorrect ? 0 : 1),
          byTable: {
            ...stats.byTable,
            [question.table]: {
              attempts: table.attempts + 1,
              correct: table.correct + (isCorrect ? 1 : 0),
            },
          },
          byProblem: { ...stats.byProblem, [key]: record },
          wrongQueue,
        },
      };
    });
  },
}));

/* -------------------------------- 파생 셀렉터 ------------------------------- */

export const selectExpToNext = (s: { level: number }) => expToNextLevel(s.level);

export function isUnlocked(level: number, requiredLevel: number): boolean {
  return level >= requiredLevel;
}
