/**
 * 시장. 농장 가게 · 가구 가게 · 열매 받기 게임이 있다.
 * 가게에 들어가는 것 자체는 자유이고, 실제 구매/판매에서 문제를 낸다. (명세 78)
 */
import { ASSETS } from '@/config/assets';
import { GROUND_Y, TOWN, TOWN_GATE_X, WORLD } from '@/config/layout';
import { AREA_NAME, MINIGAME_NAME } from '@/config/strings';
import { gameEvents } from '@/bridge/eventBus';
import { useGameStore } from '@/state/gameStore';
import type { SceneKey } from '@/bridge/events';
import { idleSway } from '../objects/effects';
import { WorldScene } from './WorldScene';

export class TownScene extends WorldScene {
  constructor() {
    super('TownScene');
  }

  get sceneKey(): SceneKey {
    return 'TownScene';
  }

  get worldWidth(): number {
    return WORLD.town.width;
  }

  protected get defaultSpawnX(): number {
    return TOWN.gateX + 160;
  }

  protected buildWorld(): void {
    this.placementArea = null;

    this.addSky();
    this.addParallax(ASSETS.environment.farHills, 300, 320, 0.12, 1);
    this.addParallax(ASSETS.environment.farTrees, 430, 220, 0.28, 2);
    this.addClouds(3);
    this.addGround(ASSETS.environment.groundTown);
    this.addForeground();

    this.buildGate();
    this.buildShop(TOWN.seedShopX, ASSETS.buildings.seedShop, '농장 가게', 'seed');
    this.buildShop(TOWN.furnitureShopX, ASSETS.buildings.furnitureShop, '가구 가게', 'furniture');
    this.buildMinigameStand();
    this.scatterDecor();
  }

  private buildGate(): void {
    this.add
      .image(TOWN.gateX, GROUND_Y + 26, ASSETS.environment.signpost)
      .setOrigin(0.5, 1)
      .setDepth(22);
    this.addSignText(TOWN.gateX, GROUND_Y - 109, `← ${AREA_NAME.village}`);

    this.addInteractable({
      id: 'town_gate_home',
      getX: () => TOWN.gateX,
      range: 150,
      prompts: () => [{ id: 'go_home', label: `${AREA_NAME.village} 가기`, enabled: true }],
      onAction: () => this.gotoScene('YardScene', TOWN_GATE_X - 240),
      markerAt: () => null,
    });
  }

  private buildShop(
    x: number,
    textureKey: string,
    label: string,
    shop: 'seed' | 'furniture',
  ): void {
    const building = this.add.image(x, GROUND_Y + 28, textureKey).setOrigin(0.5, 1).setDepth(10);
    idleSway(this, building, 0.003, 5200);
    this.addSignLabel(x, GROUND_Y - 300, label);

    this.addInteractable({
      id: `shop_${shop}`,
      getX: () => x,
      range: 160,
      prompts: () => [{ id: 'open', label: `${label} 열기`, enabled: true }],
      onAction: () => gameEvents.emit('shop:open', { shop }),
      markerAt: () => null,
    });
  }

  private buildMinigameStand(): void {
    const x = TOWN.minigameX;
    const stand = this.add
      .image(x, GROUND_Y + 28, ASSETS.buildings.minigameStand)
      .setOrigin(0.5, 1)
      .setDepth(10);
    idleSway(this, stand, 0.004, 4600);
    this.addSignLabel(x, GROUND_Y - 300, MINIGAME_NAME);

    this.addInteractable({
      id: 'minigame_stand',
      getX: () => x,
      range: 160,
      prompts: () => {
        // 게임은 몇 번이든 할 수 있고, 상자만 하루 한 번 준다. (요청 1)
        const canClaim = useGameStore.getState().canClaimMiniGameReward();
        return [
          {
            id: 'play',
            label: '게임 시작',
            enabled: true,
            hint: canClaim ? '오늘 상자를 받을 수 있어요' : '오늘 상자는 이미 받았어요',
            highlight: canClaim,
          },
        ];
      },
      onAction: () => this.gotoScene('FruitCatchScene'),
      markerAt: () =>
        useGameStore.getState().canClaimMiniGameReward() ? { x, y: GROUND_Y - 340 } : null,
    });
  }

  private scatterDecor(): void {
    const spots = [340, 900, 1560, 2140];
    spots.forEach((x, i) => {
      const key = i % 2 === 0 ? ASSETS.environment.flowerTuft : ASSETS.environment.bush;
      const item = this.add.image(x, GROUND_Y + 30, key).setOrigin(0.5, 1).setDepth(18);
      idleSway(this, item, 0.012, 3000);
    });
  }
}
