/**
 * 가구 가게. 테마 컬렉션으로 묶어서 보여준다. (명세 52)
 * 구입할 때만 문제를 풀고, 배치는 자유롭게 한다. (명세 29)
 */
import { useState } from 'react';
import {
  FLOORS,
  FURNITURE,
  THEME_NAME,
  WALLPAPERS,
  type FurnitureTheme,
  type SurfaceDef,
} from '@/config/catalog';
import { CURRENCY } from '@/config/strings';
import { useGameStore } from '@/state/gameStore';
import { useUiStore } from '@/state/uiStore';
import { furnitureIcon, surfaceIcon } from '../common/icons';
import { GameButton, ItemCard, MoneyTag, OverlayShell } from '../common/ui';
import { LockedList } from './FarmShopOverlay';
import { askMath, awardCorrect } from '../mathFlow';
import { audio } from '@/audio/sfx';

type Tab = 'home' | 'yard' | 'surface';

const TAB_LABEL: Record<Tab, string> = {
  home: '집 안 가구',
  yard: '마당 장식',
  surface: '벽지 · 바닥',
};

export function FurnitureShopOverlay(): React.ReactElement {
  const money = useGameStore((s) => s.money);
  const level = useGameStore((s) => s.level);
  const unlocked = useGameStore((s) => s.unlocked);
  const closeOverlay = useUiStore((s) => s.closeOverlay);
  const pushToast = useUiStore((s) => s.pushToast);
  const [tab, setTab] = useState<Tab>('home');

  const buyFurniture = async (itemId: string, name: string, price: number) => {
    if (money < price) {
      pushToast({ text: '돈이 모자라요', tone: 'warn' });
      return;
    }
    const { correct } = await askMath('SHOP', `${name}을(를) 사 볼까요?`);
    if (!correct) return;
    if (!useGameStore.getState().buyFurniture(itemId)) return;
    audio.play('coin');
    awardCorrect('SHOP');
    pushToast({ text: `${name}을(를) 샀어요. 꾸미기에서 놓아 보세요`, tone: 'reward' });
  };

  const buySurface = async (surfaceId: string, name: string, price: number) => {
    if (price > 0 && money < price) {
      pushToast({ text: '돈이 모자라요', tone: 'warn' });
      return;
    }
    if (price > 0) {
      const { correct } = await askMath('SHOP', `${name}을(를) 사 볼까요?`);
      if (!correct) return;
      awardCorrect('SHOP');
    }
    if (!useGameStore.getState().buySurface(surfaceId)) return;
    audio.play('coin');
    pushToast({ text: `${name}을(를) 얻었어요. 꾸미기에서 바꿀 수 있어요`, tone: 'reward' });
  };

  const items = FURNITURE.filter((item) => item.area === (tab === 'yard' ? 'yard' : 'home'));
  const available = items.filter((item) => item.unlockLevel <= level);
  const locked = items.filter((item) => item.unlockLevel > level);

  const byTheme = available.reduce<Record<string, typeof available>>((groups, item) => {
    (groups[item.theme] ??= []).push(item);
    return groups;
  }, {});

  return (
    <OverlayShell title="가구 가게" onClose={closeOverlay} wide footer={<MoneyTag amount={money} />}>
      <div className="mb-4 flex flex-wrap justify-center gap-3">
        {(Object.keys(TAB_LABEL) as Tab[]).map((key) => (
          <GameButton key={key} tone={tab === key ? 'gold' : 'plain'} onClick={() => setTab(key)}>
            {TAB_LABEL[key]}
          </GameButton>
        ))}
      </div>

      {tab === 'surface' ? (
        <div className="flex flex-col gap-5">
          <SurfaceGroup
            title="벽지"
            kind="wall"
            surfaces={WALLPAPERS}
            level={level}
            money={money}
            unlocked={unlocked}
            onBuy={buySurface}
          />
          <SurfaceGroup
            title="바닥"
            kind="floor"
            surfaces={FLOORS}
            level={level}
            money={money}
            unlocked={unlocked}
            onBuy={buySurface}
          />
        </div>
      ) : (
        <>
          {Object.entries(byTheme).map(([theme, list]) => (
            <div key={theme} className="mb-5">
              <p className="font-game mb-2 text-[1.25rem] text-ink">
                {THEME_NAME[theme as FurnitureTheme]}
              </p>
              <div className="grid grid-cols-4 gap-3">
                {list.map((item) => (
                  <ItemCard
                    key={item.id}
                    icon={furnitureIcon(item.id)}
                    name={item.name}
                    price={item.price}
                    disabled={money < item.price}
                    actionLabel="사기"
                    onClick={() => void buyFurniture(item.id, item.name, item.price)}
                  />
                ))}
              </div>
            </div>
          ))}
          <LockedList
            items={locked.map((item) => ({
              icon: furnitureIcon(item.id),
              name: item.name,
              level: item.unlockLevel,
            }))}
          />
        </>
      )}
    </OverlayShell>
  );
}

function SurfaceGroup({
  title,
  kind,
  surfaces,
  level,
  money,
  unlocked,
  onBuy,
}: {
  title: string;
  kind: 'wall' | 'floor';
  surfaces: SurfaceDef[];
  level: number;
  money: number;
  unlocked: string[];
  onBuy: (id: string, name: string, price: number) => Promise<void>;
}): React.ReactElement {
  return (
    <div>
      <p className="font-game mb-2 text-[1.25rem] text-ink">{title}</p>
      <div className="grid grid-cols-4 gap-3">
        {surfaces.map((surface) => {
          const owned = surface.price === 0 || unlocked.includes(`surface_${surface.id}`);
          const locked = surface.unlockLevel > level;
          return (
            <button
              key={surface.id}
              type="button"
              disabled={locked || (!owned && money < surface.price)}
              onClick={() => void onBuy(surface.id, surface.name, owned ? 0 : surface.price)}
              className={[
                'panel-paper flex min-h-[132px] flex-col items-center gap-2 p-3 transition',
                locked ? 'opacity-50 grayscale' : 'active:translate-y-[3px]',
              ].join(' ')}
            >
              {/* 방에 깔릴 그림 그대로 보여 준다 */}
              <img
                src={surfaceIcon(surface, kind)}
                alt=""
                className="block h-[54px] w-full rounded-xl border-4 border-ink object-cover"
              />
              <span className="font-game text-[1.1rem]">{surface.name}</span>
              <span className="font-game text-[1rem] text-ink-soft">
                {locked
                  ? `Lv.${surface.unlockLevel} 필요`
                  : owned
                    ? '가지고 있어요'
                    : `${surface.price}${CURRENCY}`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
