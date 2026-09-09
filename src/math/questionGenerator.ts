/**
 * 곱셈구구 문제 출제기. (명세 13, 14, 17, 18)
 *
 * - 선택한 단 × 1~9 범위에서만 출제한다.
 * - 70% 균형 출제 / 30% 취약 문제 우선.
 * - 최근에 나온 문제는 연속으로 다시 내지 않는다.
 */
import {
  MASTERY_STREAK,
  QUESTION_KIND_WEIGHT,
  RECENT_MEMORY,
  WEAK_PROBLEM_RATIO,
} from '@/config/balance';
import { problemKey } from '@/types/learning';
import type { LearningStats, MathQuestion, QuestionKind } from '@/types/learning';
import {
  buildChoices,
  factorDistractorPool,
  productDistractorPool,
  shuffle,
} from './distractors';

export const RIGHT_FACTORS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

interface Candidate {
  left: number;
  right: number;
  key: string;
}

function buildPool(tables: number[]): Candidate[] {
  const pool: Candidate[] = [];
  for (const table of tables) {
    for (const right of RIGHT_FACTORS) {
      pool.push({ left: table, right, key: problemKey(table, right) });
    }
  }
  return pool;
}

/** 정답률이 낮거나 최근에 틀린 문제 */
function weakCandidates(pool: Candidate[], stats: LearningStats): Candidate[] {
  const wrongSet = new Set(stats.wrongQueue);
  return pool.filter((c) => {
    const record = stats.byProblem[c.key];
    if (!record) return false;
    // 연속으로 여러 번 맞혔으면 취약 목록에서 뺀다. (명세 18)
    if (record.streak >= MASTERY_STREAK) return false;
    if (wrongSet.has(c.key)) return true;
    if (record.attempts >= 2 && record.correct / record.attempts < 0.7) return true;
    return false;
  });
}

/** 아직 적게 풀어본 문제를 우선하는 균형 출제 */
function balancedPick(pool: Candidate[], stats: LearningStats): Candidate {
  const withCount = pool.map((c) => ({
    candidate: c,
    attempts: stats.byProblem[c.key]?.attempts ?? 0,
  }));
  const min = Math.min(...withCount.map((w) => w.attempts));
  const leastPracticed = withCount.filter((w) => w.attempts <= min).map((w) => w.candidate);
  return leastPracticed[Math.floor(Math.random() * leastPracticed.length)];
}

function pickKind(): QuestionKind {
  const roll = Math.random();
  if (roll < QUESTION_KIND_WEIGHT.basic) return 'basic';
  if (roll < QUESTION_KIND_WEIGHT.basic + QUESTION_KIND_WEIGHT.blankRight) return 'blankRight';
  return 'blankLeft';
}

let questionSeq = 0;

export interface GenerateOptions {
  tables: number[];
  stats: LearningStats;
  /** 최근에 출제된 문제 키 목록 (앞이 가장 최근) */
  recent: string[];
  /** 특정 유형으로 고정하고 싶을 때 */
  forceKind?: QuestionKind;
}

export function generateQuestion({
  tables,
  stats,
  recent,
  forceKind,
}: GenerateOptions): MathQuestion {
  const activeTables = tables.length > 0 ? tables : [2];
  const pool = buildPool(activeTables);

  const recentSet = new Set(recent.slice(0, RECENT_MEMORY));
  const fresh = pool.filter((c) => !recentSet.has(c.key));
  const usablePool = fresh.length > 0 ? fresh : pool;

  const weak = weakCandidates(usablePool, stats);
  const useWeak = weak.length > 0 && Math.random() < WEAK_PROBLEM_RATIO;
  const picked = useWeak
    ? shuffle(weak)[0]
    : balancedPick(usablePool, stats);

  const kind = forceKind ?? pickKind();
  return buildQuestion(picked.left, picked.right, kind);
}

export function buildQuestion(left: number, right: number, kind: QuestionKind): MathQuestion {
  const product = left * right;
  questionSeq += 1;
  const id = `q${questionSeq}_${left}x${right}`;

  if (kind === 'blankRight') {
    const answer = right;
    return {
      id,
      left,
      right,
      product,
      correctAnswer: answer,
      kind,
      prompt: `${left} × ? = ${product}`,
      choices: buildChoices(answer, factorDistractorPool(answer)),
      table: left,
    };
  }

  if (kind === 'blankLeft') {
    const answer = left;
    return {
      id,
      left,
      right,
      product,
      correctAnswer: answer,
      kind,
      prompt: `? × ${right} = ${product}`,
      choices: buildChoices(answer, factorDistractorPool(answer)),
      table: left,
    };
  }

  return {
    id,
    left,
    right,
    product,
    correctAnswer: product,
    kind: 'basic',
    prompt: `${left} × ${right} = ?`,
    choices: buildChoices(product, productDistractorPool(left, right)),
    table: left,
  };
}

/**
 * 오답일 때 보여줄 힌트. "6씩 7번 모으면 몇 개일까요?" (명세 19)
 */
export function hintFor(question: MathQuestion): string {
  const { left, right, kind } = question;
  if (kind === 'basic') {
    return `${left}씩 ${right}번 모으면 몇 개일까요?`;
  }
  if (kind === 'blankRight') {
    return `${left}씩 몇 번 모으면 ${question.product}이 될까요?`;
  }
  return `몇씩 ${right}번 모으면 ${question.product}이 될까요?`;
}
