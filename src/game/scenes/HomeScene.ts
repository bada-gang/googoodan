/**
 * 집 내부. 가구를 배치하고 랜덤 상자를 여는 공간.
 * 이동·구경·가구 재배치에는 문제를 내지 않는다. (명세 29, 78)
 */
import Phaser from 'phaser';
import { ASSETS, surfaceTextureKey } from '@/config/assets';
import { PALETTE } from '@/config/artTokens';
import { GAME_HEIGHT, GROUND_Y, HOME_EXIT_X, WORLD } from '@/config/layout';
import { SURFACE_BY_ID } from '@/config/catalog';
import { CHEST_REWARDS } from '@/config/balance';
import { AREA_NAME, MINIGAME_NAME, formatMoney } from '@/config/strings';
import type { InteractionPrompt, SceneKey } from '@/bridge/events';
import { useGameStore } from '@/state/gameStore';
import { audio } from '@/audio/sfx';
import { fireworks, floatText, idleSway } from '../objects/effects';
import { WorldScene } from './WorldScene';

const CHEST_X = 1520;

/** 상자에서 나올 수 있는 금액 범위. 폭죽 크기를 정하는 데 쓴다. */
const CHEST_MIN_REWARD = Math.min(...CHEST_REWARDS.map((r) => r.money));
const CHEST_MAX_REWARD = Math.max(...CHEST_REWARDS.map((r) => r.money));

/** 금액대별 축하 문구 */
function chestMessage(reward: number): string {
  if (reward >= CHEST_MAX_REWARD) return '우와, 대박이에요!';
  if (reward >= (CHEST_MIN_REWARD + CHEST_MAX_REWARD) / 2) return '많이 들어 있었어요!';
  return '상자를 열었어요.';
}

function hexToInt(hex: string): number {
  return Phaser.Display.Color.HexStringToColor(hex).color;
}

export class HomeScene extends WorldScene {
  private wall!: Phaser.GameObjects.TileSprite;
  private floor!: Phaser.GameObjects.TileSprite;
  private chest?: Phaser.GameObjects.Image;
  private surfaceKey = '';

  constructor() {
    super('HomeScene');
  }

  get sceneKey(): SceneKey {
    return 'HomeScene';
  }

  get worldWidth(): number {
    return WORLD.home.width;
  }

  protected get defaultSpawnX(): number {
    return HOME_EXIT_X + 190;
  }

  protected buildWorld(): void {
    this.placementArea = 'home';

    this.wall = this.add
      .tileSprite(0, 0, this.worldWidth, GROUND_Y + 20, ASSETS.environment.roomWall)
      .setOrigin(0)
      .setDepth(0);

    this.floor = this.add
      .tileSprite(0, GROUND_Y + 20, this.worldWidth, GAME_HEIGHT - GROUND_Y, ASSETS.environment.roomFloor)
      .setOrigin(0)
      .setDepth(2);

    // 걸레받이
    this.add
      .rectangle(0, GROUND_Y + 6, this.worldWidth, 22, hexToInt(PALETTE.woodLight))
      .setOrigin(0)
      .setDepth(3);
    this.add
      .rectangle(0, GROUND_Y + 24, this.worldWidth, 5, hexToInt(PALETTE.woodDark))
      .setOrigin(0)
      .setDepth(3);

    this.applySurfaces();

    // 창문 두 개
    for (const x of [560, 1120]) {
      const window = this.add.image(x, 250, ASSETS.environment.roomWindow).setDepth(4);
      idleSway(this, window, 0.004, 4200);
    }

    // 문
    this.add
      .image(HOME_EXIT_X, GROUND_Y + 20, ASSETS.environment.roomDoor)
      .setOrigin(0.5, 1)
      .setDepth(4);

    this.addInteractable({
      id: 'home_exit',
      getX: () => HOME_EXIT_X,
      range: 140,
      prompts: () => [{ id: 'exit', label: `${AREA_NAME.village}로 나가기`, enabled: true }],
      onAction: () => this.gotoScene('YardScene'),
      markerAt: () => null,
    });

    this.buildChest();

    this.track(
      useGameStore.subscribe(() => {
        this.applySurfaces();
        this.refreshChest();
      }),
    );
  }

  /**
   * 벽지/바닥은 흰색 텍스처에 tint 를 입혀 표현한다.
   * 무늬가 있는 것은 tint 로 안 되므로 타일 그림 자체를 갈아 끼운다.
   */
  private applySurfaces(): void {
    const { wallpaperId, floorId } = useGameStore.getState().home;
    const key = `${wallpaperId}|${floorId}`;
    if (key === this.surfaceKey) return;
    this.surfaceKey = key;
    const wall = SURFACE_BY_ID[wallpaperId];
    const floor = SURFACE_BY_ID[floorId];
    if (wall) {
      // 색만 입히면 벽지 네 종류가 같은 무늬가 된다. 무늬가 있는 벽지는 타일 자체를 바꾼다.
      this.wall.setTexture(surfaceTextureKey(wall, 'wall'));
      this.wall.setTint(hexToInt(wall.color));
    }
    if (floor) {
      // 벽지와 같은 이유다. 색만 바꾸면 "체크 바닥"이 나무 판자 무늬로 나온다.
      this.floor.setTexture(surfaceTextureKey(floor, 'floor'));
      this.floor.setTint(hexToInt(floor.color));
    }
  }

  /* ------------------------------ 랜덤 상자 ------------------------------ */

  private buildChest(): void {
    this.chest = this.add
      .image(CHEST_X, GROUND_Y + 24, ASSETS.ui.chest)
      .setOrigin(0.5, 1)
      .setScale(2.1)
      .setDepth(24);
    this.refreshChest();

    this.addInteractable({
      id: 'chest',
      getX: () => CHEST_X,
      range: 150,
      prompts: (): InteractionPrompt[] => {
        const chests = useGameStore.getState().chests;
        return [
          {
            id: 'open_chest',
            label: '상자 열기',
            enabled: chests > 0,
            hint:
              chests > 0
                ? `상자 ${chests}개`
                : `${AREA_NAME.market}의 ${MINIGAME_NAME}에서 받아 오세요`,
            highlight: chests > 0,
          },
        ];
      },
      onAction: () => this.openChest(),
      markerAt: () =>
        useGameStore.getState().chests > 0 ? { x: CHEST_X, y: GROUND_Y - 90 } : null,
    });
  }

  private refreshChest(): void {
    if (!this.chest) return;
    const has = useGameStore.getState().chests > 0;
    this.chest.setAlpha(has ? 1 : 0.72);
  }

  private openChest(): void {
    this.askMath('CHEST', '상자를 열어 볼까요?', () => {
      const reward = useGameStore.getState().openChest();
      if (reward === null) return;
      audio.play('coin');
      this.chest?.setTexture(ASSETS.ui.chestOpen);
      this.time.delayedCall(900, () => this.chest?.setTexture(ASSETS.ui.chest));

      // 금액이 클수록 크게 터뜨린다. (요청 9)
      const power = Phaser.Math.Clamp(
        (reward - CHEST_MIN_REWARD) / Math.max(1, CHEST_MAX_REWARD - CHEST_MIN_REWARD),
        0,
        1,
      );
      fireworks(this, CHEST_X, GROUND_Y - 140, power);
      if (power >= 0.6) {
        audio.play('levelUp');
        this.time.delayedCall(260, () => fireworks(this, CHEST_X, GROUND_Y - 220, power));
      }

      floatText(this, CHEST_X, GROUND_Y - 120, `+${formatMoney(reward)}`, PALETTE.gold);
      this.toast(`${chestMessage(reward)} ${formatMoney(reward)}을 받았어요!`, 'reward');
      this.awardExperience('CHEST');
    });
  }

  /* ------------------------------ 배치 영역 ------------------------------ */

  protected placementBounds(): { minX: number; maxX: number; minY: number; maxY: number } {
    return {
      minX: 120,
      maxX: this.worldWidth - 120,
      minY: GROUND_Y - 6,
      maxY: GAME_HEIGHT - 40,
    };
  }
}
