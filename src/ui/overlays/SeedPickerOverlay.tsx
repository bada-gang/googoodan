/**
 * 씨앗이 두 종류 이상일 때 어떤 것을 심을지 고른다.
 * 고른 뒤에 Phaser 가 문제를 띄우고 실제 심기를 진행한다.
 */
import { useEffect, useState } from 'react';
import { TREE_LIST, seedIdOf } from '@/config/catalog';
import { gameEvents } from '@/bridge/eventBus';
import { useGameStore } from '@/state/gameStore';
import { seedIcon } from '../common/icons';
import { ItemCard, OverlayShell } from '../common/ui';

export function SeedPickerOverlay(): React.ReactElement | null {
  const [plotId, setPlotId] = useState<string | null>(null);
  const inventory = useGameStore((s) => s.inventory);

  useEffect(() => gameEvents.on('seedpicker:open', (payload) => setPlotId(payload.plotId)), []);

  if (!plotId) return null;

  const owned = TREE_LIST.filter((tree) => (inventory[seedIdOf(tree.id)] ?? 0) > 0);

  return (
    <OverlayShell title="어떤 씨앗을 심을까요?" onClose={() => setPlotId(null)}>
      <div className="grid grid-cols-4 gap-3">
        {owned.map((tree) => (
          <ItemCard
            key={tree.id}
            icon={seedIcon(tree.id)}
            name={tree.seedName}
            count={inventory[seedIdOf(tree.id)] ?? 0}
            sub={`열매 ${tree.fruitName}`}
            actionLabel="심기"
            onClick={() => {
              const targetPlot = plotId;
              setPlotId(null);
              gameEvents.emit('seedpicker:choose', { plotId: targetPlot, species: tree.id });
            }}
          />
        ))}
      </div>
    </OverlayShell>
  );
}
