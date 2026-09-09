/**
 * 열매 받기 게임의 시작 · 결과 팝업. (요청 5)
 * 화면 가운데 크게 띄워서, 지금 무엇을 해야 하는지 바로 보이게 한다.
 */
import { useEffect, useState } from 'react';
import { MINIGAME, MINIGAME_SCORE_SHOW } from '@/config/balance';
import { ASSETS } from '@/config/assets';
import { MINIGAME_NAME } from '@/config/strings';
import { gameEvents } from '@/bridge/eventBus';
import type { MiniGamePhase } from '@/bridge/events';
import { useGameStore } from '@/state/gameStore';
import { basketIcon, chestIcon, iconUrl } from '../common/icons';
import { GameButton, Icon } from '../common/ui';

/** "9월 8일" 처럼 짧게 */
function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

interface Result {
  caught: number;
  chestCount: number;
  rank: number | null;
  canClaimReward: boolean;
}

export function MiniGameOverlay(): React.ReactElement | null {
  const [phase, setPhase] = useState<MiniGamePhase | null>(null);
  const [result, setResult] = useState<Result>({
    caught: 0,
    chestCount: 0,
    rank: null,
    canClaimReward: true,
  });
  const scores = useGameStore((s) => s.miniGameScores);

  useEffect(
    () =>
      gameEvents.on('minigame:phase', (payload) => {
        setPhase(payload.phase);
        if (payload.phase === 'result') {
          setResult({
            caught: payload.caught ?? 0,
            chestCount: payload.chestCount ?? 0,
            rank: payload.rank ?? null,
            canClaimReward: payload.canClaimReward ?? false,
          });
        }
      }),
    [],
  );

  // 씬을 벗어나면 팝업도 정리한다.
  useEffect(() => gameEvents.on('minigame:ended', () => setPhase(null)), []);

  if (phase === 'intro') {
    return (
      <Popup>
        <div className="flex gap-3">
          <Icon src={iconUrl(ASSETS.crops.apple)} size={56} alt="" />
          <Icon src={basketIcon()} size={72} alt="" />
          <Icon src={iconUrl(ASSETS.crops.cherry)} size={56} alt="" />
        </div>
        <h2 className="font-game text-ink stroke-ink text-[3rem] leading-none">{MINIGAME_NAME}</h2>
        <p className="font-game text-ink-soft text-center text-[1.5rem] leading-snug">
          {MINIGAME.fruitCatchSeconds}초 동안 떨어지는 열매를
          <br />
          아래 화살표로 움직여서 바구니에 받으세요!
        </p>
        <GameButton
          tone="leaf"
          big
          glow
          onClick={() => {
            setPhase('playing');
            gameEvents.emit('minigame:start');
          }}
        >
          시작하기
        </GameButton>
      </Popup>
    );
  }

  if (phase === 'result') {
    const top = scores.slice(0, MINIGAME_SCORE_SHOW);
    return (
      <Popup>
        <Icon src={basketIcon()} size={72} alt="" />
        <h2 className="font-game text-ink stroke-ink text-[2.8rem] leading-none">
          열매 {result.caught}개!
        </h2>
        {result.rank !== null && (
          <p className="font-game text-leaf-dark text-[1.6rem]">
            내 기록 {result.rank}등이에요
          </p>
        )}

        {/* 순위표 (요청 2) */}
        <div className="panel-paper w-full px-6 py-4">
          <p className="font-game text-ink-soft mb-2 text-center text-[1.15rem]">내 최고 기록</p>
          <ol className="flex flex-col gap-1">
            {top.map((entry, index) => {
              const isCurrent = index + 1 === result.rank;
              return (
                <li
                  key={`${entry.playedAt}-${index}`}
                  className={[
                    'font-game flex items-center justify-between rounded-xl px-4 py-1.5 text-[1.3rem]',
                    isCurrent ? 'border-ink bg-gold border-4' : 'text-ink-soft',
                  ].join(' ')}
                >
                  <span>{index + 1}등</span>
                  <span className={isCurrent ? 'text-ink' : ''}>{entry.score}개</span>
                  <span className="text-[1rem] opacity-70">{shortDate(entry.playedAt)}</span>
                </li>
              );
            })}
          </ol>
        </div>

        {result.canClaimReward ? (
          <>
            <div className="panel-paper flex items-center gap-3 px-6 py-2.5">
              <Icon src={chestIcon()} size={44} alt="" />
              <p className="font-game text-ink text-[1.35rem]">
                문제를 맞히면 상자 {result.chestCount}개를 받아요
              </p>
            </div>
            <GameButton
              tone="gold"
              big
              glow
              onClick={() => {
                setPhase(null);
                gameEvents.emit('minigame:continue');
              }}
            >
              문제 풀러 가기
            </GameButton>
          </>
        ) : (
          <>
            <p className="font-game text-ink-soft text-center text-[1.2rem]">
              오늘 상자는 이미 받았어요.
              <br />
              내일 다시 오면 또 받을 수 있어요!
            </p>
            <GameButton
              tone="leaf"
              big
              onClick={() => {
                setPhase(null);
                gameEvents.emit('minigame:continue');
              }}
            >
              돌아가기
            </GameButton>
          </>
        )}
      </Popup>
    );
  }

  return null;
}

function Popup({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="pointer-events-auto absolute inset-0 z-[46] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-[rgba(48,38,30,0.5)]" />
      <div className="panel-wood animate-pop-in relative flex w-[680px] flex-col items-center gap-4 px-10 py-9">
        {children}
      </div>
    </div>
  );
}
