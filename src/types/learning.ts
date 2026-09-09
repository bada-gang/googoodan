/**
 * 곱셈구구 학습 관련 타입. (명세 35)
 */

/** 문제 풀이가 요청된 게임 맥락 */
export type MathContext =
  | 'PLANT'
  | 'GROW'
  | 'HARVEST'
  | 'ANIMAL'
  | 'SHOP'
  | 'SELL'
  | 'MINIGAME'
  | 'CHEST';

export type QuestionKind = 'basic' | 'blankRight' | 'blankLeft';

export interface MathQuestion {
  id: string;
  left: number;
  right: number;
  /** 정답 (blank 유형에서는 빈칸에 들어갈 값) */
  correctAnswer: number;
  product: number;
  kind: QuestionKind;
  /** 화면에 보여줄 식. 예: "6 × 7 = ?" 또는 "3 × ? = 12" */
  prompt: string;
  choices: number[];
  table: number;
}


/** 문제(단×곱하는 수)별 누적 기록 */
export interface ProblemRecord {
  /** "6x7" */
  key: string;
  left: number;
  right: number;
  attempts: number;
  correct: number;
  /** 연속 정답 수. 오답 우선순위를 낮추는 데 사용. (명세 18) */
  streak: number;
  lastAttemptedAt: string | null;
}

export interface LearningStats {
  totalAttempts: number;
  totalCorrect: number;
  totalWrong: number;
  /** 단 -> {attempts, correct} */
  byTable: Record<number, { attempts: number; correct: number }>;
  /** "6x7" -> ProblemRecord */
  byProblem: Record<string, ProblemRecord>;
  /** 최근 오답 큐. 5~10문제 이내에 다시 등장시킨다. (명세 18) */
  wrongQueue: string[];
}

export function createEmptyLearningStats(): LearningStats {
  return {
    totalAttempts: 0,
    totalCorrect: 0,
    totalWrong: 0,
    byTable: {},
    byProblem: {},
    wrongQueue: [],
  };
}

export function problemKey(left: number, right: number): string {
  return `${left}x${right}`;
}
