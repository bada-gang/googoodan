/**
 * 문제 풀이 흐름.
 *
 * Phaser 든 React 상점이든 "이 행동을 하려면 문제를 하나 풀어야 한다" 는 요구를
 * 모두 여기로 모은다. 문제 생성 · 정답 판정 · 학습 기록이 한곳에 있다.
 *
 * 몇 번 틀리고 맞혔는지(wrongAttempts)도 함께 돌려준다.
 * 수확량·생산물 개수를 정답까지 걸린 횟수로 정하는 데 쓴다.
 */
import { generateQuestion } from '@/math/questionGenerator';
import { useGameStore } from '@/state/gameStore';
import { useUiStore } from '@/state/uiStore';
import type { MathContext } from '@/types/learning';
import { audio } from '@/audio/sfx';

export interface MathOutcome {
  /** 맞히고 끝났는지 (도중에 그만두면 false) */
  correct: boolean;
  /** 맞히기까지 틀린 횟수. 한 번에 맞히면 0 */
  wrongAttempts: number;
}

let resolver: ((outcome: MathOutcome) => void) | null = null;
let wrongAttempts = 0;
let sequence = 0;

/**
 * 문제를 띄우고, 학생이 맞힐 때까지 기다린다.
 * 학생이 그만두면 correct=false 로 끝난다. 오답으로 잃는 것은 없다. (명세 18, 19)
 */
export function askMath(
  context: MathContext,
  title: string,
  requestId?: string,
): Promise<MathOutcome> {
  // 이전 요청이 남아 있으면 취소 처리한다.
  resolver?.({ correct: false, wrongAttempts });
  resolver = null;
  wrongAttempts = 0;

  const store = useGameStore.getState();
  const question = generateQuestion({
    tables: store.selectedTables,
    stats: store.stats,
    recent: store.recentQuestions,
  });
  store.noteQuestionAsked(question);

  sequence += 1;
  useUiStore.getState().setMath({
    requestId: requestId ?? `ui_${sequence}`,
    context,
    title,
    question,
  });

  return new Promise<MathOutcome>((resolve) => {
    resolver = resolve;
  });
}

export type AnswerResult = 'correct' | 'wrong';

/** 선택지를 눌렀을 때 호출. 정답이면 흐름이 이어진다. */
export function submitAnswer(value: number): AnswerResult {
  const active = useUiStore.getState().math;
  if (!active) return 'wrong';

  const isCorrect = value === active.question.correctAnswer;
  useGameStore.getState().recordAttempt(active.question, isCorrect);

  if (!isCorrect) {
    wrongAttempts += 1;
    audio.play('wrong');
    return 'wrong';
  }

  audio.play('correct');
  return 'correct';
}

/** 지금까지 틀린 횟수. 문제 팝업이 보상 미리보기를 보여줄 때 쓴다. */
export function currentWrongAttempts(): number {
  return wrongAttempts;
}

/** 정답 연출이 끝난 뒤 팝업을 닫고 행동을 실행시킨다. */
export function completeMath(): void {
  useUiStore.getState().setMath(null);
  const resolve = resolver;
  resolver = null;
  resolve?.({ correct: true, wrongAttempts });
}

/**
 * React 쪽(상점·시장)에서 정답 보상을 줄 때 사용.
 * Phaser 쪽은 WorldScene.awardExperience 가 같은 일을 한다.
 */
export function awardCorrect(context: MathContext): void {
  const result = useGameStore.getState().gainExperience(context);
  if (!result.leveledUp) return;
  audio.play('levelUp');
  useUiStore.getState().showLevelUp(result.newLevel);
}

/** 학생이 문제를 그만둘 때. 아무것도 잃지 않는다. */
export function cancelMath(): void {
  useUiStore.getState().setMath(null);
  const resolve = resolver;
  resolver = null;
  resolve?.({ correct: false, wrongAttempts });
}
