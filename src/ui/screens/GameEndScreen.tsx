/**
 * 게임을 끝낸 화면. 설정의 "게임 종료"로만 들어온다.
 *
 * 브라우저 탭은 코드로 닫을 수 없다(window.close 는 스크립트가 연 창만 닫힌다).
 * 그래서 "종료"는 저장을 끝내고 전체화면을 빠져나온 뒤 이 화면에서 멈추는 것으로 한다.
 * 태블릿을 걷어 가는 동안 게임이 계속 돌아가고 있으면 안 된다.
 *
 * 막다른 길로 두지 않는다 — "처음으로"가 있어서 다음 학생이 바로 시작할 수 있다.
 */
import { CURRENCY } from '@/config/strings';
import { useGameStore } from '@/state/gameStore';
import { GameButton } from '../common/ui';
import { ScreenShell } from './ProfileSelectScreen';

export function GameEndScreen(): React.ReactElement {
  const profile = useGameStore((s) => s.profile);
  const stats = useGameStore((s) => s.stats);
  const level = useGameStore((s) => s.level);
  const money = useGameStore((s) => s.money);

  const accuracy =
    stats.totalAttempts > 0 ? Math.round((stats.totalCorrect / stats.totalAttempts) * 100) : null;

  return (
    <ScreenShell title="오늘 학습이 끝났어요">
      <div className="flex flex-col items-center gap-4 pt-1">
        <p className="font-game text-[1.6rem] text-ink">
          {profile ? `${profile.displayName}, 수고했어요!` : '수고했어요!'}
        </p>

        <div className="panel-paper flex w-full max-w-[560px] flex-col gap-2 px-6 py-5 text-center">
          <p className="font-game text-[1.5rem] text-ink">
            푼 문제 {stats.totalAttempts}개 · 맞힌 문제 {stats.totalCorrect}개
          </p>
          {accuracy !== null && (
            <p className="font-game text-[1.5rem] text-ink">정답률 {accuracy}%</p>
          )}
          <p className="font-game text-[1.35rem] text-ink-soft">
            레벨 {level} · {money}
            {CURRENCY}
          </p>
        </div>

        <p className="font-game text-center text-[1.3rem] text-leaf-dark">
          저장했어요. 태블릿을 선생님께 돌려주세요.
        </p>

        {/* 새로고침으로 완전히 새 판을 시작한다. 이전 학생의 상태가 조금도 남지 않아야 한다. */}
        <GameButton tone="gold" big onClick={() => window.location.reload()}>
          처음으로
        </GameButton>
      </div>
    </ScreenShell>
  );
}
