/**
 * 가방. 가지고 있는 것을 보여주기만 한다. 문제를 내지 않는다. (명세 78)
 */
import { useState } from 'react';
import { SELLABLE_ORDER, SELL_PRICE } from '@/config/catalog';
import { CURRENCY } from '@/config/strings';
import { useGameStore } from '@/state/gameStore';
import { useUiStore } from '@/state/uiStore';
import type { SellableId } from '@/types/game';
import { chestIcon, itemCategory, itemIcon, itemName } from '../common/icons';
import { EmptyNote, GameButton, Icon, ItemCard, MoneyTag, OverlayShell } from '../common/ui';

type Tab = 'harvest' | 'seed' | 'supply' | 'furniture';

const TAB_LABEL: Record<Tab, string> = {
  harvest: '수확물',
  seed: '씨앗',
  supply: '물 · 먹이',
  furniture: '가구 · 장식',
};

export function InventoryOverlay(): React.ReactElement {
  const inventory = useGameStore((s) => s.inventory);
  const chests = useGameStore((s) => s.chests);
  const sellableTotal = useGameStore((s) => s.sellableTotal());
  const closeOverlay = useUiStore((s) => s.closeOverlay);
  const openOverlay = useUiStore((s) => s.openOverlay);
  const scene = useUiStore((s) => s.currentScene);
  const [tab, setTab] = useState<Tab>('harvest');

  const entries = Object.entries(inventory).filter(([, count]) => count > 0);
  const shown = entries.filter(([itemId]) => itemCategory(itemId) === tab);

  return (
    <OverlayShell
      title="가방"
      onClose={closeOverlay}
      wide
      footer={
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-game text-[1.2rem] text-ink-soft">
            팔 수 있는 물건 값어치
          </span>
          <MoneyTag amount={sellableTotal} size={26} />
          {scene === 'TownScene' && sellableTotal > 0 && (
            <GameButton tone="gold" onClick={() => openOverlay('shopSeed')}>
              농장 가게에서 팔기
            </GameButton>
          )}
        </div>
      }
    >
      <div className="mb-3 flex flex-wrap justify-center gap-3">
        {(Object.keys(TAB_LABEL) as Tab[]).map((key) => (
          <GameButton key={key} tone={tab === key ? 'gold' : 'plain'} onClick={() => setTab(key)}>
            {TAB_LABEL[key]}
          </GameButton>
        ))}
      </div>

      {chests > 0 && (
        <div className="panel-paper mb-3 flex items-center gap-3 px-4 py-3">
          <Icon src={chestIcon()} size={52} alt="" />
          <p className="font-game text-[1.25rem]">
            랜덤 상자 {chests}개 — 집 안에서 열 수 있어요
          </p>
        </div>
      )}

      {shown.length === 0 ? (
        <EmptyNote>
          {tab === 'harvest'
            ? '아직 수확한 것이 없어요. 농장에서 열매를 키워 보세요.'
            : tab === 'seed'
              ? '씨앗이 없어요. 시장의 농장 가게에 가 보세요.'
              : tab === 'supply'
                ? '물과 먹이가 없어요. 시장의 농장 가게에서 살 수 있어요.'
                : '가구가 없어요. 시장의 가구 가게에 가 보세요.'}
        </EmptyNote>
      ) : (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
          {shown.map(([itemId, count]) => (
            <ItemCard
              key={itemId}
              icon={itemIcon(itemId)}
              name={itemName(itemId)}
              count={count}
              sub={
                SELLABLE_ORDER.includes(itemId as SellableId)
                  ? `한 개 ${SELL_PRICE[itemId as SellableId]}${CURRENCY}`
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </OverlayShell>
  );
}
