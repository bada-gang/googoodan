/**
 * 농장 가게. "구매" 와 "판매" 를 한곳에서 한다.
 *
 * - 구매: 물·먹이 / 씨앗 / 동물
 * - 판매: 가방에 있는 열매와 동물 생산물
 *
 * 사고 파는 것은 "가치가 생기는 행동"이므로 문제를 푼다. (명세 78)
 */
import { useState } from 'react';
import {
  ANIMAL_LIST,
  SELLABLE_NAME,
  SELLABLE_ORDER,
  SELL_PRICE,
  SUPPLY_LIST,
  TREE_LIST,
} from '@/config/catalog';
import { CURRENCY } from '@/config/strings';
import { ASSETS } from '@/config/assets';
import { useGameStore } from '@/state/gameStore';
import { useUiStore } from '@/state/uiStore';
import type { SellableId, SupplyId } from '@/types/game';
import { animalIcon, cropIcon, iconUrl, seedIcon } from '../common/icons';
import { EmptyNote, GameButton, ItemCard, MoneyTag, OverlayShell } from '../common/ui';
import { askMath, awardCorrect } from '../mathFlow';
import { audio } from '@/audio/sfx';

type Tab = 'buy' | 'sell';

const SUPPLY_ICON: Record<SupplyId, string> = {
  water: ASSETS.ui.waterCan,
  feed: ASSETS.ui.feedBag,
};

export function FarmShopOverlay(): React.ReactElement {
  const money = useGameStore((s) => s.money);
  const level = useGameStore((s) => s.level);
  const inventory = useGameStore((s) => s.inventory);
  const sellableTotal = useGameStore((s) => s.sellableTotal());
  const closeOverlay = useUiStore((s) => s.closeOverlay);
  const pushToast = useUiStore((s) => s.pushToast);
  const [tab, setTab] = useState<Tab>('buy');

  /* -------------------------------- 구매 -------------------------------- */

  const buySupply = async (supply: (typeof SUPPLY_LIST)[number]) => {
    if (money < supply.price) {
      pushToast({ text: '돈이 모자라요. 수확한 것을 팔아 볼까요?', tone: 'warn' });
      return;
    }
    const math = await askMath('SHOP', `${supply.packName}를 사 볼까요?`);
    if (!math.correct) return;
    if (!useGameStore.getState().buySupply(supply.id)) return;
    audio.play('coin');
    awardCorrect('SHOP', math);
    pushToast({ text: `${supply.packName}를 샀어요`, tone: 'reward' });
  };

  const buySeed = async (species: (typeof TREE_LIST)[number]) => {
    if (money < species.seedPrice) {
      pushToast({ text: '돈이 모자라요. 수확한 것을 팔아 볼까요?', tone: 'warn' });
      return;
    }
    const math = await askMath('SHOP', `${species.seedName}을 사 볼까요?`);
    if (!math.correct) return;
    if (!useGameStore.getState().buySeed(species.id)) return;
    audio.play('coin');
    awardCorrect('SHOP', math);
    pushToast({ text: `${species.seedName}을 샀어요`, tone: 'reward' });
  };

  const buyAnimal = async (animal: (typeof ANIMAL_LIST)[number]) => {
    if (money < animal.price) {
      pushToast({ text: '돈이 모자라요. 조금만 더 모아 볼까요?', tone: 'warn' });
      return;
    }
    const math = await askMath('SHOP', `${animal.name}을(를) 데려와 볼까요?`);
    if (!math.correct) return;
    if (!useGameStore.getState().buyAnimal(animal.id)) return;
    audio.play('coin');
    awardCorrect('SHOP', math);
    pushToast({ text: `${animal.name}이(가) 우리에 왔어요!`, tone: 'reward' });
  };

  /* -------------------------------- 판매 -------------------------------- */

  const sellOne = async (id: SellableId) => {
    const count = inventory[id] ?? 0;
    if (count <= 0) return;
    const math = await askMath('SELL', `${SELLABLE_NAME[id]} ${count}개를 팔아 볼까요?`);
    if (!math.correct) return;
    const gained = useGameStore.getState().sellItem(id, count);
    if (gained <= 0) return;
    audio.play('coin');
    awardCorrect('SELL', math);
    pushToast({ text: `${gained}${CURRENCY}을 받았어요`, tone: 'reward' });
  };

  const sellAll = async () => {
    if (sellableTotal <= 0) return;
    const math = await askMath('SELL', '가방에 있는 것을 모두 팔아 볼까요?');
    if (!math.correct) return;
    const store = useGameStore.getState();
    let gained = 0;
    for (const id of SELLABLE_ORDER) {
      gained += store.sellItem(id, store.itemCount(id));
    }
    if (gained <= 0) return;
    audio.play('coin');
    awardCorrect('SELL', math);
    pushToast({ text: `${gained}${CURRENCY}을 받았어요`, tone: 'reward' });
  };

  /* -------------------------------- 목록 -------------------------------- */

  const availableSeeds = TREE_LIST.filter((tree) => tree.unlockLevel <= level);
  const lockedSeeds = TREE_LIST.filter((tree) => tree.unlockLevel > level);
  const availableAnimals = ANIMAL_LIST.filter((animal) => animal.unlockLevel <= level);
  const lockedAnimals = ANIMAL_LIST.filter((animal) => animal.unlockLevel > level);
  const ownedSellables = SELLABLE_ORDER.filter((id) => (inventory[id] ?? 0) > 0);

  return (
    <OverlayShell
      title="농장 가게"
      onClose={closeOverlay}
      wide
      footer={
        <div className="flex flex-wrap items-center gap-3">
          <MoneyTag amount={money} />
          {tab === 'sell' && sellableTotal > 0 && (
            <GameButton tone="gold" onClick={() => void sellAll()}>
              모두 팔기 ({sellableTotal}
              {CURRENCY})
            </GameButton>
          )}
        </div>
      }
    >
      <div className="mb-4 flex justify-center gap-3">
        <GameButton tone={tab === 'buy' ? 'gold' : 'plain'} big onClick={() => setTab('buy')}>
          구매
        </GameButton>
        <GameButton tone={tab === 'sell' ? 'gold' : 'plain'} big onClick={() => setTab('sell')}>
          판매
        </GameButton>
      </div>

      {tab === 'buy' ? (
        <>
          <Section title="물 · 먹이">
            <div className="grid grid-cols-4 gap-3">
              {SUPPLY_LIST.map((supply) => (
                <ItemCard
                  key={supply.id}
                  icon={iconUrl(SUPPLY_ICON[supply.id])}
                  name={supply.packName}
                  sub={supply.usage}
                  price={supply.price}
                  count={inventory[supply.id] ?? 0}
                  disabled={money < supply.price}
                  actionLabel="사기"
                  onClick={() => void buySupply(supply)}
                />
              ))}
            </div>
          </Section>

          <Section title="씨앗">
            <div className="grid grid-cols-4 gap-3">
              {availableSeeds.map((tree) => (
                <ItemCard
                  key={tree.id}
                  icon={seedIcon(tree.id)}
                  name={tree.seedName}
                  sub={`열매 ${tree.fruitName} · 한 개 ${tree.fruitPrice}${CURRENCY}`}
                  price={tree.seedPrice}
                  count={inventory[`seed_${tree.id}`] ?? 0}
                  disabled={money < tree.seedPrice}
                  actionLabel="사기"
                  onClick={() => void buySeed(tree)}
                />
              ))}
            </div>
          </Section>

          <Section title="동물">
            {availableAnimals.length === 0 ? (
              <EmptyNote>아직 동물을 데려올 수 없어요. 레벨을 조금 더 올려 보세요.</EmptyNote>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {availableAnimals.map((animal) => (
                  <ItemCard
                    key={animal.id}
                    icon={animalIcon(animal.id)}
                    name={animal.name}
                    sub={`${animal.produceName} · 한 개 ${animal.producePrice}${CURRENCY}`}
                    price={animal.price}
                    disabled={money < animal.price}
                    actionLabel="데려오기"
                    onClick={() => void buyAnimal(animal)}
                  />
                ))}
              </div>
            )}
          </Section>

          <LockedList
            items={[
              ...lockedSeeds.map((tree) => ({
                icon: seedIcon(tree.id),
                name: tree.seedName,
                level: tree.unlockLevel,
              })),
              ...lockedAnimals.map((animal) => ({
                icon: animalIcon(animal.id),
                name: animal.name,
                level: animal.unlockLevel,
              })),
            ]}
          />
        </>
      ) : ownedSellables.length === 0 ? (
        <EmptyNote>팔 수 있는 것이 없어요. 농장에서 열매를 키워 보세요.</EmptyNote>
      ) : (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
          {ownedSellables.map((id) => {
            const count = inventory[id] ?? 0;
            return (
              <ItemCard
                key={id}
                icon={cropIcon(id)}
                name={SELLABLE_NAME[id]}
                count={count}
                sub={`한 개 ${SELL_PRICE[id]}${CURRENCY}`}
                price={SELL_PRICE[id] * count}
                actionLabel="팔기"
                onClick={() => void sellOne(id)}
              />
            );
          })}
        </div>
      )}
    </OverlayShell>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="mb-5">
      <p className="font-game mb-2 text-[1.25rem] text-ink">{title}</p>
      {children}
    </div>
  );
}

export function LockedList({
  items,
}: {
  items: { icon: string; name: string; level: number }[];
}): React.ReactElement | null {
  if (items.length === 0) return null;
  return (
    <div className="mt-5">
      <p className="font-game mb-2 text-[1.15rem] text-ink-soft">레벨을 올리면 만날 수 있어요</p>
      <div className="grid grid-cols-4 gap-3 opacity-60">
        {items.map((item) => (
          <ItemCard
            key={item.name}
            icon={item.icon}
            name={item.name}
            sub={`Lv.${item.level} 필요`}
            disabled
          />
        ))}
      </div>
    </div>
  );
}
