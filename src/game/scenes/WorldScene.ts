/**
 * 횡스크롤 월드의 공통 기반 Scene.
 *
 * - Parallax 배경 (명세 48)
 * - 캐릭터 이동 · 카메라 추적 (명세 6, 76)
 * - React 로부터 오는 조작 이벤트 처리 (명세 71)
 * - 상호작용 대상 탐지 및 행동 버튼 전달 (명세 7)
 * - 꾸미기 배치 (명세 29)
 */
import Phaser from 'phaser';
import { ASSETS, furnitureTextureKey } from '@/config/assets';
import { PALETTE } from '@/config/artTokens';
import { GAME_HEIGHT, GAME_WIDTH, GROUND_Y } from '@/config/layout';
import { gameEvents } from '@/bridge/eventBus';
import type {
  DecorateTool,
  InteractionPrompt,
  SceneKey,
  ToastTone,
} from '@/bridge/events';
import { useGameStore } from '@/state/gameStore';
import type { MathContext } from '@/types/learning';
import type { PlacementArea } from '@/types/game';
import { characterOf } from '@/types/game';
import { audio } from '@/audio/sfx';
import { Player } from '../objects/Player';
import { GAME_FONT, burstStars, createMarker, sparkleAt } from '../objects/effects';

export interface Interactable {
  id: string;
  /** 월드 x 좌표 */
  getX: () => number;
  /** 상호작용 가능 거리 */
  range?: number;
  prompts: () => InteractionPrompt[];
  onAction: (actionId: string) => void;
  /** 느낌표 표시 위치. 없으면 표시하지 않는다. */
  markerAt?: () => { x: number; y: number } | null;
}

export const INTERACT_RANGE = 165;
export const PLAYER_FOOT_Y = GROUND_Y + 22;

interface ParallaxLayer {
  sprite: Phaser.GameObjects.TileSprite;
  factor: number;
}

export abstract class WorldScene extends Phaser.Scene {
  protected player!: Player;
  protected interactables: Interactable[] = [];
  protected placementArea: PlacementArea | null = null;

  private parallax: ParallaxLayer[] = [];
  private moveDir = 0;
  private spawnX: number | null = null;
  private lastSignature = '';
  private active: Interactable | null = null;
  private markers = new Map<string, Phaser.GameObjects.Image>();
  private disposers: (() => void)[] = [];
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private stepTimer = 0;

  /* ---- 꾸미기 상태 ---- */
  private decorating = false;
  private decorateTool: DecorateTool = 'move';
  private pendingItemId: string | null = null;
  private movingInstanceId: string | null = null;
  private ghost: Phaser.GameObjects.Image | null = null;
  private placedSprites = new Map<string, Phaser.GameObjects.Image>();
  private pointerConsumed = false;

  abstract get sceneKey(): SceneKey;
  abstract get worldWidth(): number;
  protected abstract buildWorld(): void;
  protected abstract get defaultSpawnX(): number;

  init(data: { spawnX?: number }): void {
    this.spawnX = typeof data?.spawnX === 'number' ? data.spawnX : null;
  }

  create(): void {
    this.interactables = [];
    this.parallax = [];
    this.markers.clear();
    this.placedSprites.clear();
    this.lastSignature = '';
    this.active = null;
    this.moveDir = 0;

    this.cameras.main.setBackgroundColor(PALETTE.skyBottom);
    this.buildWorld();

    this.player = new Player(
      this,
      this.spawnX ?? this.defaultSpawnX,
      PLAYER_FOOT_Y,
      characterOf(useGameStore.getState().profile),
    );
    this.player.setDepth(40);

    this.cameras.main.setBounds(0, 0, this.worldWidth, GAME_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.14, 0.14);
    this.cameras.main.setDeadzone(220, GAME_HEIGHT);

    this.bindBridgeEvents();
    this.bindPointer();
    this.cursors = this.input.keyboard?.createCursorKeys();

    this.syncPlacedItems();
    const unsubscribe = useGameStore.subscribe(() => this.syncPlacedItems());
    this.disposers.push(unsubscribe);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
    // 마을 배경음으로 돌려놓는다 (미니게임에서 나왔을 때).
    audio.setBgmTrack('village');
    gameEvents.emit('scene:changed', { sceneKey: this.sceneKey });
  }

  /* ------------------------------ 배경 만들기 ------------------------------ */

  protected addSky(): void {
    const sky = this.add
      .tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, ASSETS.environment.sky)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(0);
    void sky;
  }

  protected addParallax(textureKey: string, y: number, height: number, factor: number, depth: number): void {
    const sprite = this.add
      .tileSprite(0, y, GAME_WIDTH, height, textureKey)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(depth);
    this.parallax.push({ sprite, factor });
  }

  /** 하늘에 천천히 흐르는 구름 (명세 58) */
  protected addClouds(count = 4): void {
    for (let i = 0; i < count; i += 1) {
      const key = i % 2 === 0 ? ASSETS.environment.cloudA : ASSETS.environment.cloudB;
      const cloud = this.add
        .image(Math.random() * GAME_WIDTH, 70 + Math.random() * 150, key)
        .setScrollFactor(0.08)
        .setDepth(1)
        .setAlpha(0.9)
        .setScale(0.8 + Math.random() * 0.5);
      this.tweens.add({
        targets: cloud,
        x: cloud.x + GAME_WIDTH + 300,
        duration: 60000 + Math.random() * 30000,
        repeat: -1,
        onRepeat: () => cloud.setX(-320),
      });
    }
  }

  protected addGround(textureKey: string, tint?: number): void {
    const ground = this.add
      .tileSprite(0, GROUND_Y, this.worldWidth, GAME_HEIGHT - GROUND_Y + 40, textureKey)
      .setOrigin(0)
      .setDepth(5);
    if (tint !== undefined) ground.setTint(tint);
  }

  /** 화면 맨 앞 풀. 카메라보다 빠르게 움직여 깊이감을 준다. */
  protected addForeground(): void {
    this.add
      .tileSprite(0, GAME_HEIGHT - 66, GAME_WIDTH, 80, ASSETS.environment.foreGrass)
      .setOrigin(0)
      .setScrollFactor(1.25)
      .setDepth(60)
      .setAlpha(0.95);
  }

  /**
   * 월드 안의 나무 간판. 글자만 하늘에 떠 있지 않도록 판을 함께 그린다. (명세 53)
   */
  /**
   * 표지판 그림 위에 글자만 얹는다.
   *
   * addSignLabel 은 글자 크기에 맞춰 판까지 그린다. env_signpost 에는 이미 판이 있어서
   * 둘을 겹치면 판이 두 겹으로 보인다. 그림에 판이 있는 자리에는 이 함수를 쓴다.
   */
  protected addSignText(
    x: number,
    y: number,
    text: string,
    maxWidth = 118,
  ): Phaser.GameObjects.Text {
    const label = this.add
      .text(x, y, text, {
        fontFamily: GAME_FONT,
        fontSize: '26px',
        color: PALETTE.outline,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(30);
    // 판 밖으로 넘치면 줄인다 ("← 우리 마을" 처럼 긴 글자)
    if (label.width > maxWidth) label.setScale(maxWidth / label.width);
    return label;
  }

  protected addSignLabel(x: number, y: number, text: string): Phaser.GameObjects.Container {
    const label = this.add
      .text(0, 0, text, {
        fontFamily: GAME_FONT,
        fontSize: '30px',
        color: PALETTE.outline,
        align: 'center',
      })
      .setOrigin(0.5);

    const padX = 22;
    const padY = 12;
    const width = label.width + padX * 2;
    const height = label.height + padY * 2;

    const board = this.add.graphics();
    board.fillStyle(Phaser.Display.Color.HexStringToColor(PALETTE.woodLight).color, 1);
    board.fillRoundedRect(-width / 2, -height / 2, width, height, 14);
    board.fillStyle(Phaser.Display.Color.HexStringToColor(PALETTE.cream).color, 1);
    board.fillRoundedRect(-width / 2 + 6, -height / 2 + 6, width - 12, height - 14, 10);
    board.lineStyle(4, Phaser.Display.Color.HexStringToColor(PALETTE.outline).color, 1);
    board.strokeRoundedRect(-width / 2, -height / 2, width, height, 14);
    // 판을 매다는 짧은 나무 기둥
    board.fillStyle(Phaser.Display.Color.HexStringToColor(PALETTE.woodDark).color, 1);
    board.fillRoundedRect(-6, -height / 2 - 16, 12, 18, 4);

    const container = this.add.container(x, y, [board, label]).setDepth(30);
    this.tweens.add({
      targets: container,
      angle: { from: -1.1, to: 1.1 },
      duration: 3200 + Math.random() * 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    return container;
  }

  /* ------------------------------ 이벤트 배선 ------------------------------ */

  private bindBridgeEvents(): void {
    this.disposers.push(
      gameEvents.on('move:start', ({ direction }) => {
        this.moveDir = direction === 'left' ? -1 : 1;
      }),
      gameEvents.on('move:stop', () => {
        this.moveDir = 0;
      }),
      gameEvents.on('action:press', ({ actionId }) => this.handleAction(actionId)),
      gameEvents.on('scene:goto', ({ sceneKey, spawnAt }) => {
        if (sceneKey === this.sceneKey) return;
        this.gotoScene(sceneKey, spawnAt);
      }),
      gameEvents.on('decorate:mode', ({ on, area }) => this.setDecorating(on, area)),
      gameEvents.on('decorate:pick', ({ itemId, area }) => {
        if (area !== this.placementArea) return;
        this.beginPlacement(itemId);
      }),
      gameEvents.on('decorate:tool', ({ tool }) => {
        this.decorateTool = tool;
        this.cancelPending();
      }),
    );
  }

  private bindPointer(): void {
    const onGameObjectDown = (
      _pointer: Phaser.Input.Pointer,
      obj: Phaser.GameObjects.GameObject,
    ) => {
      if (!this.decorating) return;
      const instanceId = obj.getData('instanceId') as string | undefined;
      if (!instanceId) return;
      this.pointerConsumed = true;
      this.handlePlacedTap(instanceId);
    };

    const onPointerDown = (pointer: Phaser.Input.Pointer) => {
      if (this.pointerConsumed) {
        this.pointerConsumed = false;
        return;
      }
      if (!this.decorating) return;
      this.commitPlacement(pointer.worldX, pointer.worldY);
    };

    const onPointerMove = (pointer: Phaser.Input.Pointer) => {
      if (!this.ghost) return;
      const { x, y } = this.clampToPlacement(pointer.worldX, pointer.worldY);
      this.ghost.setPosition(x, y);
      this.ghost.setDepth(20 + y * 0.01);
    };

    this.input.on(Phaser.Input.Events.GAMEOBJECT_DOWN, onGameObjectDown);
    this.input.on(Phaser.Input.Events.POINTER_DOWN, onPointerDown);
    this.input.on(Phaser.Input.Events.POINTER_MOVE, onPointerMove);

    this.disposers.push(() => {
      this.input.off(Phaser.Input.Events.GAMEOBJECT_DOWN, onGameObjectDown);
      this.input.off(Phaser.Input.Events.POINTER_DOWN, onPointerDown);
      this.input.off(Phaser.Input.Events.POINTER_MOVE, onPointerMove);
    });
  }

  private cleanup(): void {
    for (const dispose of this.disposers) dispose();
    this.disposers = [];
    this.markers.clear();
    this.placedSprites.clear();
    this.ghost?.destroy();
    this.ghost = null;
  }

  /* -------------------------------- 이동 -------------------------------- */

  update(_time: number, delta: number): void {
    let dir = this.moveDir;
    if (this.cursors) {
      if (this.cursors.left?.isDown) dir = -1;
      else if (this.cursors.right?.isDown) dir = 1;
    }
    this.player.setMoveDirection(dir);
    this.player.tick(delta, 60, this.worldWidth - 60);
    this.player.setDepth(40);

    if (dir !== 0) {
      this.stepTimer += delta;
      if (this.stepTimer > 280) {
        this.stepTimer = 0;
        audio.play('step');
      }
    } else {
      this.stepTimer = 200;
    }

    const scrollX = this.cameras.main.scrollX;
    for (const layer of this.parallax) {
      layer.sprite.tilePositionX = scrollX * layer.factor;
    }

    this.refreshInteractions();
  }

  protected gotoScene(sceneKey: SceneKey, spawnAt?: number): void {
    audio.play('door');
    this.cameras.main.fadeOut(220, 255, 246, 226);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      gameEvents.emit('interaction:changed', { prompts: [] });
      this.scene.start(sceneKey, { spawnX: spawnAt });
    });
  }

  /* ----------------------------- 상호작용 처리 ---------------------------- */

  protected addInteractable(item: Interactable): void {
    this.interactables.push(item);
  }

  private refreshInteractions(): void {
    let nearest: Interactable | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const item of this.interactables) {
      const distance = Math.abs(item.getX() - this.player.x);
      const range = item.range ?? INTERACT_RANGE;
      if (distance <= range && distance < nearestDistance) {
        nearest = item;
        nearestDistance = distance;
      }
      this.updateMarker(item, distance <= range * 2.4);
    }

    this.active = nearest;
    const prompts = this.decorating ? [] : (nearest?.prompts() ?? []);
    const signature = JSON.stringify(prompts);
    if (signature !== this.lastSignature) {
      this.lastSignature = signature;
      gameEvents.emit('interaction:changed', { prompts });
    }
  }

  private updateMarker(item: Interactable, nearby: boolean): void {
    const spot = item.markerAt?.() ?? null;
    const existing = this.markers.get(item.id);
    if (!spot || this.decorating) {
      if (existing) {
        existing.destroy();
        this.markers.delete(item.id);
      }
      return;
    }
    if (!existing) {
      const marker = createMarker(this, spot.x, spot.y);
      this.markers.set(item.id, marker);
      return;
    }
    existing.setVisible(true);
    existing.setAlpha(nearby ? 1 : 0.65);
    if (Math.abs(existing.x - spot.x) > 1) existing.setX(spot.x);
  }

  private handleAction(actionId: string): void {
    if (!this.active) return;
    const prompt = this.active.prompts().find((p) => p.id === actionId);
    if (!prompt || !prompt.enabled) return;
    audio.play('tap');
    this.active.onAction(actionId);
  }

  /* ------------------------------ 문제 풀이 요청 ----------------------------- */

  /**
   * 곱셈 문제를 요청하고, 정답일 때만 행동을 실행한다. (명세 71)
   * 문제 생성과 화면 표시는 React 쪽이 담당한다.
   */
  protected askMath(
    context: MathContext,
    title: string,
    /** @param wrongAttempts 맞히기까지 틀린 횟수 (한 번에 맞히면 0) */
    onCorrect: (wrongAttempts: number) => void,
  ): void {
    const requestId = `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const off = gameEvents.on('math:result', (payload) => {
      if (payload.requestId !== requestId) return;
      off();
      if (!payload.correct) return;
      this.player.playHappy();
      onCorrect(payload.wrongAttempts);
    });
    this.disposers.push(off);
    this.player.playInteract();
    gameEvents.emit('math:request', { requestId, context, title });
  }

  protected toast(text: string, tone: ToastTone = 'info'): void {
    gameEvents.emit('toast', { text, tone });
  }

  /** Scene 이 끝날 때 함께 정리할 해제 함수를 등록한다. */
  protected track(dispose: () => void): void {
    this.disposers.push(dispose);
  }

  /**
   * 정답 보상으로 경험치를 준다. 레벨이 오르면 짧은 연출과 안내를 띄운다. (명세 32, 33)
   */
  protected awardExperience(context: MathContext): void {
    const result = useGameStore.getState().gainExperience(context);
    if (!result.leveledUp) return;
    audio.play('levelUp');
    burstStars(this, this.player.x, this.player.y - 170, 16);
    gameEvents.emit('level:up', { level: result.newLevel });
  }

  /* -------------------------------- 꾸미기 -------------------------------- */

  private setDecorating(on: boolean, area: PlacementArea): void {
    if (area !== this.placementArea) return;
    this.decorating = on;
    if (!on) {
      this.cancelPending();
      this.lastSignature = '';
    } else {
      gameEvents.emit('interaction:changed', { prompts: [] });
    }
    for (const sprite of this.placedSprites.values()) {
      sprite.setAlpha(1);
      if (on) sprite.setInteractive({ useHandCursor: true });
      else sprite.disableInteractive();
    }
  }

  private beginPlacement(itemId: string): void {
    this.cancelPending();
    this.pendingItemId = itemId;
    gameEvents.emit('decorate:holding', { holding: true });
    const spot = this.clampToPlacement(this.player.x + 90, PLAYER_FOOT_Y);
    this.ghost = this.add
      .image(spot.x, spot.y, furnitureTextureKey(itemId))
      .setOrigin(0.5, 1)
      .setAlpha(0.6)
      .setDepth(20 + spot.y * 0.01);
    this.tweens.add({
      targets: this.ghost,
      alpha: { from: 0.35, to: 0.75 },
      duration: 620,
      yoyo: true,
      repeat: -1,
    });
  }

  private handlePlacedTap(instanceId: string): void {
    const store = useGameStore.getState();
    const area = this.placementArea;
    if (!area) return;

    if (this.decorateTool === 'remove') {
      const sprite = this.placedSprites.get(instanceId);
      if (sprite) sparkleAt(this, sprite.x, sprite.y - 20, 5);
      store.retrieveItem(area, instanceId);
      audio.play('place');
      this.toast('가방에 넣었어요', 'info');
      return;
    }
    if (this.decorateTool === 'flip') {
      store.flipItem(area, instanceId);
      audio.play('tap');
      return;
    }
    // move: 한 번 탭해서 들고, 다시 탭해서 놓는다 (드래그 없이도 가능)
    if (this.movingInstanceId === instanceId) {
      this.movingInstanceId = null;
      this.placedSprites.get(instanceId)?.setAlpha(1);
      gameEvents.emit('decorate:holding', { holding: false });
      return;
    }
    this.cancelPending();
    this.movingInstanceId = instanceId;
    this.placedSprites.get(instanceId)?.setAlpha(0.55);
    // 꾸미기 패널을 접어서 방이 보이게 한다.
    gameEvents.emit('decorate:holding', { holding: true });
  }

  private commitPlacement(worldX: number, worldY: number): void {
    const area = this.placementArea;
    if (!area) return;
    const store = useGameStore.getState();
    const { x, y } = this.clampToPlacement(worldX, worldY);

    if (this.pendingItemId) {
      const placed = store.placeItem(area, this.pendingItemId, x, y);
      if (placed) {
        audio.play('place');
        sparkleAt(this, x, y - 30, 6);
        gameEvents.emit('decorate:placed', { instanceId: placed.instanceId });
      }
      this.cancelPending();
      return;
    }

    if (this.movingInstanceId) {
      store.moveItem(area, this.movingInstanceId, x, y);
      this.placedSprites.get(this.movingInstanceId)?.setAlpha(1);
      this.movingInstanceId = null;
      audio.play('place');
      gameEvents.emit('decorate:holding', { holding: false });
    }
  }

  private cancelPending(): void {
    const wasHolding = this.pendingItemId !== null || this.movingInstanceId !== null;
    this.pendingItemId = null;
    if (this.movingInstanceId) {
      this.placedSprites.get(this.movingInstanceId)?.setAlpha(1);
      this.movingInstanceId = null;
    }
    this.ghost?.destroy();
    this.ghost = null;
    if (wasHolding) gameEvents.emit('decorate:holding', { holding: false });
  }

  /** 배치 가능한 영역. Scene 별로 다르다. */
  protected placementBounds(): { minX: number; maxX: number; minY: number; maxY: number } {
    return {
      minX: 80,
      maxX: this.worldWidth - 80,
      minY: PLAYER_FOOT_Y - 10,
      maxY: PLAYER_FOOT_Y + 60,
    };
  }

  private clampToPlacement(x: number, y: number): { x: number; y: number } {
    const bounds = this.placementBounds();
    return {
      x: Phaser.Math.Clamp(x, bounds.minX, bounds.maxX),
      y: Phaser.Math.Clamp(y, bounds.minY, bounds.maxY),
    };
  }

  private syncPlacedItems(): void {
    const area = this.placementArea;
    if (!area) return;
    const state = useGameStore.getState();
    const list = area === 'home' ? state.home.placed : state.yard.placed;
    const seen = new Set<string>();

    for (const item of list) {
      seen.add(item.instanceId);
      let sprite = this.placedSprites.get(item.instanceId);
      if (!sprite) {
        sprite = this.add
          .image(item.x, item.y, furnitureTextureKey(item.itemId))
          .setOrigin(0.5, 1);
        sprite.setData('instanceId', item.instanceId);
        if (this.decorating) sprite.setInteractive({ useHandCursor: true });
        this.placedSprites.set(item.instanceId, sprite);
        this.tweens.add({
          targets: sprite,
          scaleX: { from: 0.7, to: 1 },
          scaleY: { from: 0.7, to: 1 },
          duration: 260,
          ease: 'Back.easeOut',
        });
      }
      sprite.setPosition(item.x, item.y);
      sprite.setFlipX(item.flipX);
      sprite.setDepth(20 + item.y * 0.01);
    }

    for (const [id, sprite] of [...this.placedSprites]) {
      if (!seen.has(id)) {
        sprite.destroy();
        this.placedSprites.delete(id);
      }
    }
  }
}
