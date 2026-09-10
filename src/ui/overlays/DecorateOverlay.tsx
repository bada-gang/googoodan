/**
 * 꾸미기 패널.
 *
 * 물건을 손에 들면 패널이 아래로 접혀서 집 안이 다 보인다.
 * 놓을 자리를 눌러 배치하고 나면 다시 펼쳐진다. (수정 요청 10)
 *
 * 배치·이동·회전·회수에는 문제를 내지 않는다. 창작 활동을 끊지 않기 위해서다. (명세 29)
 */
import { useEffect, useState } from 'react';
import type { SurfaceDef } from '@/config/catalog';
import { FLOORS, FURNITURE_BY_ID, WALLPAPERS } from '@/config/catalog';
import { gameEvents } from '@/bridge/eventBus';
import type { DecorateTool } from '@/bridge/events';
import { useGameStore } from '@/state/gameStore';
import { useUiStore } from '@/state/uiStore';
import type { PlacementArea } from '@/types/game';
import { furnitureIcon, surfaceIcon } from '../common/icons';
import { EmptyNote, GameButton, Icon } from '../common/ui';
import { audio } from '@/audio/sfx';

const TOOLS: { id: DecorateTool; label: string }[] = [
  { id: 'move', label: '옮기기' },
  { id: 'flip', label: '돌리기' },
  { id: 'remove', label: '치우기' },
];

const TOOL_HINT: Record<DecorateTool, string> = {
  move: '물건을 누르면 들 수 있어요',
  flip: '물건을 누르면 방향이 바뀌어요',
  remove: '물건을 누르면 가방으로 들어가요',
};

export function DecorateOverlay(): React.ReactElement {
  const scene = useUiStore((s) => s.currentScene);
  const closeOverlay = useUiStore((s) => s.closeOverlay);
  const inventory = useGameStore((s) => s.inventory);
  const unlocked = useGameStore((s) => s.unlocked);
  const home = useGameStore((s) => s.home);
  const [tool, setTool] = useState<DecorateTool>('move');
  const [tab, setTab] = useState<'items' | 'surface'>('items');
  /** 물건을 손에 들고 있는 중 — 이때는 패널을 접는다 */
  const [holding, setHolding] = useState(false);
  /** 학생이 직접 접어둔 상태 */
  const [minimized, setMinimized] = useState(false);

  const area: PlacementArea = scene === 'HomeScene' ? 'home' : 'yard';

  useEffect(() => {
    gameEvents.emit('decorate:mode', { on: true, area });
    return () => {
      gameEvents.emit('decorate:mode', { on: false, area });
    };
  }, [area]);

  useEffect(() => {
    gameEvents.emit('decorate:tool', { tool });
  }, [tool]);

  useEffect(() => gameEvents.on('decorate:holding', (p) => setHolding(p.holding)), []);

  const ownedItems = Object.entries(inventory)
    .filter(([itemId, count]) => count > 0 && FURNITURE_BY_ID[itemId]?.area === area)
    .map(([itemId, count]) => ({ def: FURNITURE_BY_ID[itemId], count }));

  const pick = (itemId: string) => {
    audio.play('tap');
    gameEvents.emit('decorate:pick', { itemId, area });
  };

  const cancelHold = () => {
    audio.play('tap');
    // 도구를 다시 보내면 Phaser 쪽에서 들고 있던 것을 내려놓는다.
    gameEvents.emit('decorate:tool', { tool });
  };

  const ownedSurface = (id: string, price: number) =>
    price === 0 || unlocked.includes(`surface_${id}`);

  /* ------------------------ 물건을 들고 있을 때: 얇은 띠 ----------------------- */

  if (holding) {
    // 이동 버튼(왼쪽 아래)을 가리지 않도록 오른쪽에만 띠를 둔다.
    return (
      <div className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-end">
        <div className="pointer-events-auto mr-2 mb-2 ml-auto flex items-center gap-4 rounded-3xl border-4 border-ink bg-cream/95 px-5 py-3 shadow-[0_6px_0_rgba(74,58,47,0.28)]">
          <p className="font-game text-[1.35rem] text-ink">놓고 싶은 자리를 눌러 주세요</p>
          <GameButton tone="berry" onClick={cancelHold}>
            취소
          </GameButton>
        </div>
      </div>
    );
  }

  /* ---------------------------- 접어둔 상태: 작은 버튼 --------------------------- */

  if (minimized) {
    return (
      <div className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-end">
        <div className="pointer-events-none flex justify-center pb-2">
          <p className="hud-pill animate-pop-in text-[1.15rem]">{TOOL_HINT[tool]}</p>
        </div>
        <div className="pointer-events-auto mr-2 mb-2 ml-auto flex items-center gap-3">
          <GameButton tone="gold" onClick={() => setMinimized(false)}>
            물건 고르기
          </GameButton>
          <GameButton tone="leaf" onClick={closeOverlay}>
            다 꾸몄어요
          </GameButton>
        </div>
      </div>
    );
  }

  /* -------------------------------- 펼친 상태 -------------------------------- */

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-end">
      <div className="pointer-events-none flex justify-center pb-2">
        <p className="hud-pill animate-pop-in text-[1.15rem]">{TOOL_HINT[tool]}</p>
      </div>

      <div className="panel-wood pointer-events-auto mx-2 mb-2 flex max-h-[280px] flex-col gap-3 rounded-3xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {area === 'home' && (
              <>
                <GameButton tone={tab === 'items' ? 'gold' : 'plain'} onClick={() => setTab('items')}>
                  가구
                </GameButton>
                <GameButton
                  tone={tab === 'surface' ? 'gold' : 'plain'}
                  onClick={() => setTab('surface')}
                >
                  벽지 · 바닥
                </GameButton>
              </>
            )}
            {TOOLS.map((item) => (
              <GameButton
                key={item.id}
                tone={tool === item.id ? 'sky' : 'plain'}
                onClick={() => {
                  // 도구를 고르면 창을 내려서 집 안의 물건을 바로 누를 수 있게 한다.
                  setTool(item.id);
                  setMinimized(true);
                }}
              >
                {item.label}
              </GameButton>
            ))}
          </div>

          <div className="flex gap-2">
            <GameButton onClick={() => setMinimized(true)}>창 내리기</GameButton>
            <GameButton tone="leaf" onClick={closeOverlay}>
              다 꾸몄어요
            </GameButton>
          </div>
        </div>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
          {tab === 'surface' && area === 'home' ? (
            <div className="flex flex-col gap-3">
              <SurfaceRow
                title="벽지"
                kind="wall"
                surfaces={WALLPAPERS}
                currentId={home.wallpaperId}
                isOwned={ownedSurface}
                onSelect={(id) => {
                  audio.play('place');
                  useGameStore.getState().setWallpaper(id);
                }}
              />
              <SurfaceRow
                title="바닥"
                kind="floor"
                surfaces={FLOORS}
                currentId={home.floorId}
                isOwned={ownedSurface}
                onSelect={(id) => {
                  audio.play('place');
                  useGameStore.getState().setFloor(id);
                }}
              />
            </div>
          ) : ownedItems.length === 0 ? (
            <EmptyNote>놓을 물건이 없어요. 시장의 가구 가게에서 사 올 수 있어요.</EmptyNote>
          ) : (
            <div className="flex flex-wrap gap-3">
              {ownedItems.map(({ def, count }) => (
                <button
                  key={def.id}
                  type="button"
                  onClick={() => pick(def.id)}
                  className="panel-paper relative flex h-[112px] w-[112px] flex-col items-center justify-center gap-1 p-2 transition active:translate-y-[3px]"
                >
                  <Icon src={furnitureIcon(def.id)} size={54} alt="" />
                  <span className="font-game text-[0.95rem] leading-tight">{def.name}</span>
                  <span className="font-game absolute -top-2 -right-2 flex h-8 min-w-8 items-center justify-center rounded-full border-[3px] border-ink bg-gold px-1 text-[0.95rem]">
                    {count}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SurfaceRow({
  title,
  kind,
  surfaces,
  currentId,
  isOwned,
  onSelect,
}: {
  title: string;
  kind: 'wall' | 'floor';
  surfaces: SurfaceDef[];
  currentId: string;
  isOwned: (id: string, price: number) => boolean;
  onSelect: (id: string) => void;
}): React.ReactElement {
  return (
    <div>
      <p className="font-game mb-1 text-[1.1rem] text-ink">{title}</p>
      <div className="flex flex-wrap gap-3">
        {surfaces.map((surface) => {
          const owned = isOwned(surface.id, surface.price);
          return (
            <button
              key={surface.id}
              type="button"
              disabled={!owned}
              onClick={() => onSelect(surface.id)}
              className={[
                'panel-paper flex h-[104px] w-[124px] flex-col items-center gap-1 p-2 transition',
                currentId === surface.id ? 'ring-4 ring-gold ring-offset-2' : '',
                owned ? '' : 'opacity-45 grayscale',
              ].join(' ')}
            >
              {/* 방에 깔릴 그림 그대로 보여 준다 */}
              <img
                src={surfaceIcon(surface, kind)}
                alt=""
                className="block h-[46px] w-full rounded-lg border-[3px] border-ink object-cover"
              />
              <span className="font-game text-[0.95rem]">{surface.name}</span>
              {!owned && <span className="font-game text-[0.85rem] text-ink-soft">가게에서 사기</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
