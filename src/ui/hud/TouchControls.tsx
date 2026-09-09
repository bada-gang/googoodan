/**
 * 하단 터치 조작. (명세 7, 37)
 * - 왼쪽 아래: 큰 이동 버튼
 * - 가운데: 가방 · 꾸미기
 * - 오른쪽 아래: 상황별 행동 버튼
 *
 * 멀티터치·길게 누르기·더블 탭을 필수로 쓰지 않는다.
 */
import { gameEvents } from '@/bridge/eventBus';
import type { MoveDirection } from '@/bridge/events';
import { useGameStore } from '@/state/gameStore';
import { useSettingsStore } from '@/state/settingsStore';
import { useUiStore } from '@/state/uiStore';
import { basketIcon } from '../common/icons';
import { Icon } from '../common/ui';
import { audio } from '@/audio/sfx';

function MoveButton({ direction }: { direction: MoveDirection }): React.ReactElement {
  const start = (event: React.PointerEvent<HTMLButtonElement>) => {
    try {
      // 손가락이 버튼 밖으로 나가도 계속 이동하도록 포인터를 잡아 둔다.
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* 일부 환경에서는 캡처가 안 될 수 있다. 이동 자체에는 영향이 없다. */
    }
    audio.unlock();
    gameEvents.emit('move:start', { direction });
  };
  const stop = () => gameEvents.emit('move:stop');

  return (
    <button
      type="button"
      aria-label={direction === 'left' ? '왼쪽으로 이동' : '오른쪽으로 이동'}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerCancel={stop}
      onPointerLeave={stop}
      onContextMenu={(event) => event.preventDefault()}
      className="btn-game h-[96px] w-[112px] px-0"
    >
      <ArrowGlyph flipped={direction === 'right'} />
    </button>
  );
}

function ArrowGlyph({ flipped }: { flipped?: boolean }): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      width="52"
      height="52"
      aria-hidden="true"
      style={{ transform: flipped ? 'scaleX(-1)' : undefined }}
    >
      <path d="M15.8 3.6 7.2 11.4a.8.8 0 0 0 0 1.2l8.6 7.8c.6.5 1.5.1 1.5-.7V4.3c0-.8-.9-1.2-1.5-.7Z" fill="#4a3a2f" />
    </svg>
  );
}

function BagGlyph(): React.ReactElement {
  return <Icon src={basketIcon()} size={44} alt="" />;
}

function BrushGlyph(): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" width="40" height="40" aria-hidden="true">
      <path
        d="M17.4 2.9a2.2 2.2 0 0 1 3.1 3.1l-8.2 8.2-3.9.8.8-3.9 8.2-8.2ZM6.6 15.2c1.6 0 2.9 1.3 2.9 2.9 0 1.9-1.6 3.3-4 3.3-1.4 0-2.6-.3-3.4-.7 1.1-.5 1.6-1.3 1.6-2.6 0-1.6 1.3-2.9 2.9-2.9Z"
        fill="#4a3a2f"
      />
    </svg>
  );
}

export function TouchControls(): React.ReactElement {
  const prompts = useUiStore((s) => s.prompts);
  const scene = useUiStore((s) => s.currentScene);
  const overlay = useUiStore((s) => s.overlay);
  const openOverlay = useUiStore((s) => s.openOverlay);
  const leftHanded = useSettingsStore((s) => s.leftHanded);
  const chests = useGameStore((s) => s.chests);

  const inMinigame = scene === 'FruitCatchScene';
  const canDecorate = scene === 'HomeScene' || scene === 'YardScene';

  const moveCluster = (
    <div className="pointer-events-auto flex gap-3">
      <MoveButton direction="left" />
      <MoveButton direction="right" />
    </div>
  );

  const actionCluster = (
    <div className="pointer-events-auto flex max-w-[46%] flex-wrap items-end justify-end gap-3">
      {prompts.map((prompt) => (
        <button
          key={prompt.id}
          type="button"
          disabled={!prompt.enabled}
          onClick={() => {
            audio.unlock();
            gameEvents.emit('action:press', { actionId: prompt.id });
          }}
          className={[
            'btn-game min-h-[76px] flex-col gap-0 px-7 text-[1.6rem]',
            prompt.highlight ? 'btn-gold animate-glow' : 'btn-leaf',
          ].join(' ')}
        >
          <span>{prompt.label}</span>
          {prompt.hint && (
            <span className="font-body text-[1rem] font-medium opacity-85">{prompt.hint}</span>
          )}
        </button>
      ))}
    </div>
  );

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-3 p-3">
      {leftHanded ? actionCluster : moveCluster}

      {!inMinigame && !overlay && (
        <div className="pointer-events-auto flex items-end gap-3">
          <button
            type="button"
            aria-label="가방"
            onClick={() => {
              audio.play('tap');
              openOverlay('inventory');
            }}
            className="btn-game relative h-[80px] w-[96px] flex-col gap-0 px-0 text-[1rem]"
          >
            <BagGlyph />
            <span>가방</span>
            {chests > 0 && (
              <span className="font-game absolute -top-2 -right-2 flex h-8 min-w-8 items-center justify-center rounded-full border-[3px] border-ink bg-gold px-1 text-[0.95rem]">
                {chests}
              </span>
            )}
          </button>

          {canDecorate && (
            <button
              type="button"
              aria-label="꾸미기"
              onClick={() => {
                audio.play('tap');
                openOverlay('decorate');
              }}
              className="btn-game h-[80px] w-[96px] flex-col gap-0 px-0 text-[1rem]"
            >
              <BrushGlyph />
              <span>꾸미기</span>
            </button>
          )}
        </div>
      )}

      {leftHanded ? moveCluster : actionCluster}
    </div>
  );
}
