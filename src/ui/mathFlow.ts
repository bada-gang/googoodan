/**
 * 문제 풀이 흐름.
 *
 * Phaser 든 React 상점이든 "이 행동을 하려면 문제를 하나 풀어야 한다" 는 요구를
 * 모두 여기로 모은다. 문제 생성 · 정답 판정 · 학습 기록이 한곳에 있다.
 *
 * 한 문제에서 두 번 틀리면 그 문제는 끝이다. (요청 2)
 * 보기가 네 개인데 틀릴 때마다 계속 고를 수 있으면 찍어서 지워 나가는 게 이기는
 * 방법이 되어 버린다. 두 번까지만 허용하고, 정답을 보여 준 뒤 새 문제를 낸다.
 *
 * 몇 번 틀렸는지(wrongAttempts)와 통째로 놓친 문제 수(failedQuestions)를
 * 함께 돌려준다. 앞의 것은 수확량을, 뒤의 것은 경험치를 줄지 말지 정한다.
 */
import { WRONG_LIMIT_PER_QUESTION } from '@/config/balance';
import { generateQuestion } from '@/math/questionGenerator';
import { useGameStore } from '@/state/gameStore';
import { useUiStore } from '@/state/uiStore';
import type { MathContext } from '@/types/learning';
import { audio } from '@/audio/sfx';

export interface MathOutcome {
  /** 맞히고 끝났는지 (도중에 그만두면 false) */
  correct: boolean;
  /** 틀린 횟수 전체. 새 문제를 받은 것까지 합친다. 한 번에 맞히면 0 */
  wrongAttempts: number;
  /** 두 번 틀려서 답을 보고 넘어간 문제 수. 하나라도 있으면 경험치를 주지 않는다 */
  failedQuestions: number;
}

let resolver: ((outcome: MathOutcome) => void) | null = null;
/** 이번 행동에서 틀린 횟수 전체 */
let wrongAttempts = 0;
/** 지금 화면에 있는 문제에서 틀린 횟수. 새 문제를 낼 때 0 으로 돌아간다 */
let wrongThisQuestion = 0;
let failedQuestions = 0;
let sequence = 0;
/** 이번 행동이 쓰는 팝업 id. 새 문제를 내도 그대로 유지한다 */
let activeRequestId = '';
let activeContext: MathContext = 'SHOP';
let activeTitle = '';

function outcome(correct: boolean): MathOutcome {
  return { correct, wrongAttempts, failedQuestions };
}

/** 새 문제를 뽑아 팝업에 올린다. 기다리고 있는 약속(resolver)은 그대로 둔다. */
function serveQuestion(): void {
  const store = useGameStore.getState();
  const question = generateQuestion({
    tables: store.selectedTables,
    stats: store.stats,
    recent: store.recentQuestions,
  });
  store.noteQuestionAsked(question);
  wrongThisQuestion = 0;
  useUiStore.getState().setMath({
    requestId: activeRequestId,
    context: activeContext,
    title: activeTitle,
    question,
  });
}

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
  resolver?.(outcome(false));
  resolver = null;
  wrongAttempts = 0;
  wrongThisQuestion = 0;
  failedQuestions = 0;

  sequence += 1;
  activeRequestId = requestId ?? `ui_${sequence}`;
  activeContext = context;
  activeTitle = title;
  serveQuestion();

  return new Promise<MathOutcome>((resolve) => {
    resolver = resolve;
  });
}

export type AnswerResult = 'correct' | 'wrong' | 'failed';

/**
 * 선택지를 눌렀을 때 호출.
 * - `correct`  정답. 흐름이 이어진다.
 * - `wrong`    아직 기회가 남았다.
 * - `failed`   두 번 틀렸다. 이 문제는 끝이고 새 문제를 받아야 한다.
 */
export function submitAnswer(value: number): AnswerResult {
  const active = useUiStore.getState().math;
  if (!active) return 'wrong';

  const isCorrect = value === active.question.correctAnswer;
  useGameStore.getState().recordAttempt(active.question, isCorrect);

  if (isCorrect) {
    audio.play('correct');
    return 'correct';
  }

  wrongAttempts += 1;
  wrongThisQuestion += 1;
  audio.play('wrong');

  if (wrongThisQuestion >= WRONG_LIMIT_PER_QUESTION) {
    failedQuestions += 1;
    return 'failed';
  }
  return 'wrong';
}

/** 두 번 틀린 문제의 정답을 보고 난 뒤, 새 문제를 받는다. (요청 2) */
export function retryWithNewQuestion(): void {
  if (!resolver) return;
  serveQuestion();
}

/** 정답 연출이 끝난 뒤 팝업을 닫고 행동을 실행시킨다. */
export function completeMath(): void {
  useUiStore.getState().setMath(null);
  const resolve = resolver;
  resolver = null;
  resolve?.(outcome(true));
}

/**
 * React 쪽(상점·시장)에서 정답 보상을 줄 때 사용.
 * Phaser 쪽은 WorldScene.awardExperience 가 같은 일을 한다.
 */
export function awardCorrect(context: MathContext, result?: { failedQuestions: number }): void {
  // 두 번 틀려 답을 보고 넘어간 문제가 있으면 경험치가 없다. (요청 2)
  if (result && result.failedQuestions > 0) return;
  const gain = useGameStore.getState().gainExperience(context);
  if (!gain.leveledUp) return;
  audio.play('levelUp');
  useUiStore.getState().showLevelUp(gain.newLevel);
}

/** 학생이 문제를 그만둘 때. 아무것도 잃지 않는다. */
export function cancelMath(): void {
  useUiStore.getState().setMath(null);
  const resolve = resolver;
  resolver = null;
  resolve?.(outcome(false));
}
