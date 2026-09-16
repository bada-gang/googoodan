/**
 * 밸런스 수치. 학급 테스트 후 이 파일만 고쳐서 조정한다. (명세 21, 32, 33)
 */
import type { TreeStage } from '@/types/game';

/* --------------------------------- 시작 상태 -------------------------------- */

export const START_MONEY = 50;
/** 처음부터 바로 심고 키워볼 수 있게 씨앗 1개와 물·먹이를 조금 준다. */
export const START_INVENTORY: Record<string, number> = {
  seed_apple: 1,
  water: 10,
  feed: 5,
};

/* ------------------------------- 경험치 / 레벨 ------------------------------- */

/** 정답 1개 = 기본 경험치 1 (명세 32) */
export const EXP_PER_CORRECT = 1;

/** 큰 행동에는 약간의 추가 경험치를 준다. */
export const EXP_BONUS: Record<string, number> = {
  HARVEST: 1,
  ANIMAL: 1,
  MINIGAME: 2,
};

export const MAX_LEVEL = 12;

/** 해당 레벨에서 다음 레벨로 가는 데 필요한 경험치 */
export function expToNextLevel(level: number): number {
  if (level >= MAX_LEVEL) return Infinity;
  return 10 + (level - 1) * 10;
}

/* -------------------------------- 콘텐츠 해금 ------------------------------- */

export interface UnlockDef {
  level: number;
  /** 학생에게 보여줄 문구 */
  label: string;
}

export const UNLOCKS: UnlockDef[] = [
  { level: 1, label: '사과나무 · 기본 가구' },
  { level: 2, label: '오렌지나무 · 닭 · 포근한 방 세트' },
  { level: 3, label: '복숭아나무 · 염소 · 자연 숲 세트' },
  { level: 4, label: '체리나무 · 양 · 융단 바닥' },
  { level: 5, label: '포도나무 · 젖소 · 별빛 세트' },
  { level: 6, label: '감나무' },
];

export function unlocksAtLevel(level: number): UnlockDef | undefined {
  return UNLOCKS.find((u) => u.level === level);
}

/* --------------------------------- 나무 성장 -------------------------------- */

/**
 * 나무 한 그루에서 딸 수 있는 횟수. 다 따면 나무가 사라지고 밭이 빈다.
 * 씨앗을 한 번만 사면 영원히 쓰는 구조를 막아, 가끔 다시 심게 한다.
 */
export const MAX_HARVESTS_PER_TREE = 10;

/** 열매 받기 게임 기록을 몇 개까지 보관할지 */
export const MINIGAME_SCORE_KEEP = 10;
/** 순위표에 몇 등까지 보여줄지 */
export const MINIGAME_SCORE_SHOW = 5;

export const NEXT_STAGE: Record<TreeStage, TreeStage | null> = {
  seed: 'sprout',
  sprout: 'sapling',
  sapling: 'mature',
  mature: 'fruiting',
  fruiting: null,
};

export const STAGE_LABEL: Record<TreeStage, string> = {
  seed: '씨앗',
  sprout: '새싹',
  sapling: '어린 나무',
  mature: '큰 나무',
  fruiting: '열매 맺음',
};

/* ----------------------------- 정답까지 걸린 횟수 보상 ---------------------------- */

/**
 * 한 번에 맞힐수록 많이 얻는다.
 * 배열의 인덱스가 "틀린 횟수", 값이 "얻는 개수". 마지막 값이 그 이상일 때의 값이다.
 *
 * 한 문제에서 두 번 틀리면 그 문제는 끝나고 새 문제를 받으므로
 * (WRONG_LIMIT_PER_QUESTION), 틀린 횟수는 문제를 넘나들며 쌓인다.
 * 예: 두 번 틀려 답을 보고 → 새 문제를 한 번에 맞힘 = 2번 틀림.
 *
 * 다만 마지막 값도 0 이 아니다. 다 틀리고 마지막에 맞혀도 최소 1개는 받는다 —
 * 끝까지 풀었는데 빈손이면 문제를 푸는 일 자체가 벌처럼 느껴진다.
 *
 * 열매는 나무에 달린 개수(TreeSpecies.yield)로 한 번 더 잘린다.
 * 그래서 yield 가 HARVEST_BY_ATTEMPTS[0] 보다 작으면 무실수 수확이 깎인다.
 */
export const HARVEST_BY_ATTEMPTS = [4, 3, 2, 1];
export const PRODUCE_BY_ATTEMPTS = [3, 2, 1];

function amountFor(table: number[], wrongAttempts: number): number {
  return table[Math.min(wrongAttempts, table.length - 1)];
}

/** 열매 수확량 (요청 3) */
export function harvestAmount(wrongAttempts: number): number {
  return amountFor(HARVEST_BY_ATTEMPTS, wrongAttempts);
}

/** 동물 생산물 개수 (요청 6) */
export function produceAmount(wrongAttempts: number): number {
  return amountFor(PRODUCE_BY_ATTEMPTS, wrongAttempts);
}

/* --------------------------------- 랜덤 상자 -------------------------------- */

/** 소량의 돈만 들어간다. 과도한 확률형 보상을 만들지 않는다. (명세 31) */
export const CHEST_REWARDS: { money: number; weight: number }[] = [
  { money: 5, weight: 30 },
  { money: 10, weight: 30 },
  { money: 15, weight: 20 },
  { money: 20, weight: 15 },
  { money: 30, weight: 5 },
];

export function rollChest(): number {
  const total = CHEST_REWARDS.reduce((sum, r) => sum + r.weight, 0);
  let roll = Math.random() * total;
  for (const reward of CHEST_REWARDS) {
    roll -= reward.weight;
    if (roll <= 0) return reward.money;
  }
  return CHEST_REWARDS[0].money;
}

/* --------------------------------- 미니게임 -------------------------------- */

export const MINIGAME = {
  /** 열매 받기 제한 시간 (초) */
  fruitCatchSeconds: 30,
  /** 몇 개를 받으면 랜덤 상자를 1개 주는지 */
  fruitPerChest: 6,
  maxChests: 3,
  /**
   * 이 게임에서만 걷는 속도를 올리는 배수.
   * 떨어지는 열매를 쫓아다녀야 해서 마을에서와 같은 속도로는 답답하다.
   */
  moveSpeedScale: 1.1,
} as const;

/* -------------------------------- 출제 알고리즘 ------------------------------- */

/** 70% 일반 균형 출제 / 30% 취약 문제 우선 (명세 17) */
export const WEAK_PROBLEM_RATIO = 0.3;
/** 오답 문제를 다시 만나기까지의 최소/최대 간격 (명세 18) */
export const WRONG_REVIEW_MIN_GAP = 2;
export const WRONG_REVIEW_MAX_GAP = 10;
/** 연속 정답 이 횟수를 넘으면 취약 문제에서 제외 */
export const MASTERY_STREAK = 3;
/** 같은 문제가 연속으로 나오지 않도록 기억할 최근 문제 수 */
export const RECENT_MEMORY = 4;

/* ------------------------------ 한 문제의 기회 ------------------------------- */

/**
 * 한 문제에서 틀릴 수 있는 횟수. (요청 2)
 *
 * 보기가 네 개인데 무한히 고를 수 있으면 하나씩 지워 가는 것이 이기는 방법이 되고,
 * 곱셈구구를 떠올리지 않아도 결국 맞힌다. 두 번까지만 허용하고 그 뒤에는
 * 정답을 보여 준 다음 새 문제를 낸다 — 경험치는 그 문제에 대해 주지 않는다.
 *
 * 1 로 낮추면 한 번만 틀려도 끝난다. 2학년에게는 너무 빡빡하다고 보고 2 로 둔다.
 */
export const WRONG_LIMIT_PER_QUESTION = 2;

/* -------------------------------- 문제 유형 비율 ------------------------------ */

/**
 * 기본형과 빈칸형의 비율. (명세 14)
 *
 * 빈칸형("6 × ? = 42", "? × 7 = 42")은 곱셈구구를 거꾸로 떠올리게 해서 기본형보다 어렵다.
 * 0.2 / 0.1 로 시작해 몇 번 올렸고, 지금은 빈칸형이 합 40% 다.
 * 세 값의 합은 항상 1 이어야 한다 — pickKind() 가 누적 확률로 고른다.
 */
export const QUESTION_KIND_WEIGHT = {
  basic: 0.6,
  /** n × ? = m */
  blankRight: 0.25,
  /** ? × n = m */
  blankLeft: 0.15,
} as const;
