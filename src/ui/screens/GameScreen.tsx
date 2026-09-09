/**
 * 게임 화면: Phaser Canvas 위에 React UI 를 오버레이한다. (명세 68)
 *
 * 캔버스는 선명도를 위해 Phaser 가 직접 크기를 맞추고(GameScreen.Canvas),
 * UI 는 논리 해상도 레이어 안에서 그린다.
 */
import { PhaserGame } from '@/game/PhaserGame';
import { useUiStore } from '@/state/uiStore';
import { GameHUD } from '../hud/GameHUD';
import { TouchControls } from '../hud/TouchControls';
import { DecorateOverlay } from '../overlays/DecorateOverlay';
import { FarmShopOverlay } from '../overlays/FarmShopOverlay';
import { FurnitureShopOverlay } from '../overlays/FurnitureShopOverlay';
import { InventoryOverlay } from '../overlays/InventoryOverlay';
import { LevelUpOverlay } from '../overlays/LevelUpOverlay';
import { MathQuestionOverlay } from '../overlays/MathQuestionOverlay';
import { MiniGameOverlay } from '../overlays/MiniGameOverlay';
import { SeedPickerOverlay } from '../overlays/SeedPickerOverlay';
import { SettingsOverlay } from '../overlays/SettingsOverlay';
import { ToastLayer } from '../overlays/ToastLayer';
import { useGameBridge } from '../useGameBridge';

export function GameScreen(): React.ReactElement {
  useGameBridge();
  const overlay = useUiStore((s) => s.overlay);
  const booting = useUiStore((s) => s.booting);
  const scene = useUiStore((s) => s.currentScene);

  // 미니게임에는 자체 정보 막대가 있어서 상단 HUD 와 겹친다. 그동안은 숨긴다. (요청 5)
  const inMiniGame = scene === 'FruitCatchScene';

  return (
    <div className="pointer-events-none absolute inset-0">
      {!booting && (
        <>
          {!inMiniGame && <GameHUD />}
          <TouchControls />
        </>
      )}

      <ToastLayer />

      {overlay === 'inventory' && <InventoryOverlay />}
      {overlay === 'shopSeed' && <FarmShopOverlay />}
      {overlay === 'shopFurniture' && <FurnitureShopOverlay />}
      {overlay === 'decorate' && <DecorateOverlay />}
      {overlay === 'settings' && <SettingsOverlay />}

      <SeedPickerOverlay />
      <MiniGameOverlay />
      <LevelUpOverlay />
      <MathQuestionOverlay />
    </div>
  );
}

/** Phaser 캔버스만 담는 레이어. 배율 조정 레이어 밖에 둔다. */
GameScreen.Canvas = function GameCanvas(): React.ReactElement {
  return <PhaserGame />;
};
