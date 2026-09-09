/**
 * 곱셈 문제 팝업. (명세 15, 19, 55, 56, 57)
 *
 * - 시험지가 아니라 게임 세계의 종이 카드처럼 보이게 한다.
 * - 문제는 아주 크게, 선택지는 2×2 큰 버튼.
 * - 오답이어도 잃는 것은 없고, 다시 고를 수 있다.
 */
import { useEffect, useMemo, useState } from 'react';
import { hintFor } from '@/math/questionGenerator';
import { useUiStore } from '@/state/uiStore';
import { cancelMath, completeMath, submitAnswer } from '../mathFlow';
import { starIcon } from '../common/icons';
import { Icon } from '../common/ui';

type Phase = 'asking' | 'correct';

export function MathQuestionOverlay(): React.ReactElement | null {
  const request = useUiStore((s) => s.math);
  const [phase, setPhase] = useState<Phase>('asking');
  const [wrongChoices, setWrongChoices] = useState<number[]>([]);
  const [shaking, setShaking] = useState<number | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);

  const questionId = request?.question.id;

  useEffect(() => {
    setPhase('asking');
    setWrongChoices([]);
    setShaking(null);
    setChosen(null);
  }, [questionId]);

  const hint = useMemo(() => (request ? hintFor(request.question) : ''), [request]);

  if (!request) return null;
  const { question, title } = request;

  const pick = (value: number) => {
    if (phase !== 'asking' || wrongChoices.includes(value)) return;
    const result = submitAnswer(value);
    if (result === 'correct') {
      setChosen(value);
      setPhase('correct');
      // 짧게 유지한다 (0.5~1초). (명세 56)
      window.setTimeout(() => completeMath(), 820);
      return;
    }
    setWrongChoices((prev) => [...prev, value]);
    setShaking(value);
    window.setTimeout(() => setShaking(null), 430);
  };

  const solved = `${question.left} × ${question.right} = ${question.product}`;

  return (
    <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center p-[2%]">
      <div className="absolute inset-0 bg-[rgba(48,38,30,0.5)]" />

      <div className="panel-wood animate-pop-in relative flex w-[760px] flex-col items-center gap-3 px-7 pt-9 pb-6">
        {/* 상황 안내 (게임 행동과 이어져 있음을 보여준다) */}
        <p className="font-game text-center text-[1.35rem] leading-tight text-ink-soft">{title}</p>

        {/* 문제 */}
        <div className="panel-paper relative flex w-full items-center justify-center px-6 py-6">
          <p className="font-game text-center text-[4.4rem] leading-none text-ink stroke-ink">
            {phase === 'correct' ? solved : question.prompt}
          </p>
          {phase === 'correct' && <StarBurst />}
        </div>

        {phase === 'correct' ? (
          <p className="font-game animate-pop-in text-[2rem] text-leaf-dark">정답이에요!</p>
        ) : (
          <div className="grid w-full grid-cols-2 gap-4">
            {question.choices.map((choice) => {
              const isWrong = wrongChoices.includes(choice);
              return (
                <button
                  key={choice}
                  type="button"
                  disabled={isWrong}
                  onClick={() => pick(choice)}
                  className={[
                    'btn-game min-h-[104px] text-[2.8rem]',
                    isWrong ? 'opacity-45' : 'btn-sky',
                    shaking === choice ? 'animate-shake-soft' : '',
                  ].join(' ')}
                >
                  {choice}
                </button>
              );
            })}
          </div>
        )}

        {/* 오답 안내: 붉은 번쩍임 없이 부드럽게 (명세 57) */}
        {phase === 'asking' && wrongChoices.length > 0 && (
          <p className="font-game animate-pop-in text-center text-[1.35rem] text-ink-soft">
            한 번 더 생각해 볼까요? {hint}
          </p>
        )}

        {phase === 'asking' && (
          <button
            type="button"
            onClick={cancelMath}
            className="font-game mt-1 text-[1.1rem] text-ink-soft underline underline-offset-4"
          >
            나중에 할래요
          </button>
        )}
      </div>

      {phase === 'correct' && chosen !== null && <span className="sr-only">{solved}</span>}
    </div>
  );
}

/** 정답 순간의 작은 별 반짝임 */
function StarBurst(): React.ReactElement {
  const spots = [
    { left: '6%', top: '12%', size: 40, delay: 0 },
    { left: '86%', top: '18%', size: 32, delay: 90 },
    { left: '18%', top: '68%', size: 28, delay: 150 },
    { left: '76%', top: '70%', size: 36, delay: 60 },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {spots.map((spot, index) => (
        <span
          key={index}
          className="animate-pop-in absolute"
          style={{ left: spot.left, top: spot.top, animationDelay: `${spot.delay}ms` }}
        >
          <Icon src={starIcon()} size={spot.size} alt="" />
        </span>
      ))}
    </div>
  );
}
