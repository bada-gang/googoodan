/**
 * "연습 필요" 판단. (요청 2)
 *
 * 학생이 쌓아 둔 기록에서 **많이 틀리는 단**을 골라 준다.
 * 2학년이 여덟 개 단을 보고 스스로 약한 단을 고르기는 어렵고,
 * 대개 제일 쉬운 2단만 계속 누른다. 그래서 버튼 하나로 골라 준다.
 *
 * 저장소도 React 도 모르는 순수 함수다. 기준이 의심스러우면 이 파일만 보면 된다.
 */
import { TABLES } from '@/config/curriculum';
import type { LearningStats } from '@/types/learning';

/**
 * 오답률을 믿으려면 최소 이만큼은 풀어 봤어야 한다.
 * 두 번 풀고 한 번 틀린 단(오답률 50%)이 맨 위로 올라오면 안 된다.
 */
const MIN_SAMPLE = 4;

/** 한 번에 골라 주는 단 개수. 여덟 개를 다 고르면 "연습 필요"가 "전체 선택"과 같아진다. */
const PICK_COUNT = 3;

export interface PracticePick {
  /** 고른 단. 오름차순 */
  tables: number[];
  /** 학생에게 보여 줄 한 줄 설명 */
  reason: string;
}

interface Scored {
  table: number;
  attempts: number;
  wrongRate: number;
  /** 클수록 연습이 필요하다 */
  score: number;
}

function score(stats: LearningStats | null, table: number): Scored {
  const row = stats?.byTable?.[table];
  const attempts = row?.attempts ?? 0;
  const correct = row?.correct ?? 0;
  const wrongRate = attempts > 0 ? 1 - correct / attempts : 0;

  // 아직 거의 안 풀어 본 단도 연습이 필요하다. 다만 실제로 틀린 단보다는 뒤에 둔다.
  // 0.34 는 "세 번에 한 번 틀리는 단"과 같은 취급이라는 뜻이다.
  if (attempts < MIN_SAMPLE) {
    return { table, attempts, wrongRate, score: 0.34 + (MIN_SAMPLE - attempts) * 0.01 };
  }
  return { table, attempts, wrongRate, score: wrongRate };
}

/**
 * 연습이 필요한 단을 고른다.
 *
 * 기록이 아예 없으면 전체를 고른다 — 골라 줄 근거가 없는데 세 개만 집으면
 * 그 세 개가 특별한 이유가 있는 것처럼 보인다.
 */
export function pickPracticeTables(stats: LearningStats | null): PracticePick {
  const total = stats?.totalAttempts ?? 0;
  if (total < MIN_SAMPLE) {
    return {
      tables: [...TABLES],
      reason: '아직 기록이 적어서 전체를 골랐어요',
    };
  }

  const scored = TABLES.map((table) => score(stats, table))
    // 점수가 같으면 많이 풀어 본 단을 먼저 (기록이 더 믿을 만하다)
    .sort((a, b) => b.score - a.score || b.attempts - a.attempts || a.table - b.table);

  const picked = scored.slice(0, PICK_COUNT);
  const tables = picked.map((s) => s.table).sort((a, b) => a - b);

  // 왜 이 단을 골랐는지 말해 준다. 근거를 안 보여 주면 학생은 그냥 무작위로 여긴다.
  const label = tables.join('·');
  const enough = picked.filter((s) => s.attempts >= MIN_SAMPLE);
  const worst = Math.max(...enough.map((s) => s.wrongRate), 0);
  let reason: string;
  if (enough.length < picked.length) {
    reason =
      enough.length === 0
        ? `아직 많이 안 해 본 ${label}단을 골랐어요`
        : `틀리거나 아직 안 해 본 ${label}단을 골랐어요`;
  } else if (worst < 0.15) {
    // 다 잘하는 학생에게 "많이 틀린 단"이라고 하면 사실이 아니다.
    reason = `골고루 잘하고 있어요. 그중 아쉬운 ${label}단을 골랐어요`;
  } else {
    reason = `많이 틀린 ${label}단을 골랐어요`;
  }

  return { tables, reason };
}
