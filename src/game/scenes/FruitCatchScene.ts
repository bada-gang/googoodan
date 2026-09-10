/**
 * 미니게임 "열매 받기 게임". (명세 30)
 *
 * 흐름:
 *   intro   — React 가 시작 안내 팝업을 띄운다. 게임은 아직 멈춰 있다.
 *   playing — 30초 동안 떨어지는 열매를 바구니로 받는다.
 *   result  — React 가 결과 팝업을 띄운다. 닫으면 문제를 풀고 상자를 받는다.
 *
 * 시작·결과 팝업은 React 가 그린다. 씬은 단계만 알린다. (명세 71)
 */
import Phaser from 'phaser';
import { characterOf } from '@/types/game';
import { ASSETS } from '@/config/assets';
import { PALETTE } from '@/config/artTokens';
import { MINIGAME } from '@/config/balance';
import { AREA_NAME } from '@/config/strings';
import { GAME_HEIGHT, GAME_WIDTH, GROUND_Y, TOWN } from '@/config/layout';
import { gameEvents } from '@/bridge/eventBus';
import { useGameStore } from '@/state/gameStore';
import { audio } from '@/audio/sfx';
import { GAME_FONT, burstStars, floatText, sparkleAt } from '../objects/effects';
import { Player } from '../objects/Player';

interface FallingFruit {
  sprite: Phaser.GameObjects.Image;
  speed: number;
}

const BASKET_OFFSET_Y = -96;
const CATCH_RADIUS = 78;
/** 정보 막대 위치. 상단 HUD 는 미니게임 동안 숨기므로 위쪽을 다 쓴다. (요청 5) */
const INFO_BAR_Y = 26;

export class FruitCatchScene extends Phaser.Scene {
  private player!: Player;
  private basket!: Phaser.GameObjects.Image;
  private fruits: FallingFruit[] = [];
  private moveDir = 0;
  private caught = 0;
  private remaining = MINIGAME.fruitCatchSeconds;
  private timerLabel!: Phaser.GameObjects.Text;
  private scoreLabel!: Phaser.GameObjects.Text;
  private spawnEvent?: Phaser.Time.TimerEvent;
  private countdownEvent?: Phaser.Time.TimerEvent;
  private disposers: (() => void)[] = [];
  private playing = false;
  private finished = false;
  /** 이번 판에서 상자를 받을 수 있는지 (하루 한 번) */
  private canClaim = true;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super('FruitCatchScene');
  }

  create(): void {
    this.fruits = [];
    this.caught = 0;
    this.remaining = MINIGAME.fruitCatchSeconds;
    this.playing = false;
    this.finished = false;
    this.moveDir = 0;

    this.add
      .tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, ASSETS.environment.sky)
      .setOrigin(0)
      .setScrollFactor(0);
    this.add
      .tileSprite(0, 300, GAME_WIDTH, 320, ASSETS.environment.farHills)
      .setOrigin(0)
      .setScrollFactor(0);
    this.add
      .tileSprite(0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y + 40, ASSETS.environment.groundYard)
      .setOrigin(0);

    this.player = new Player(
      this,
      GAME_WIDTH / 2,
      GROUND_Y + 22,
      characterOf(useGameStore.getState().profile),
    );
    this.player.setDepth(40);
    // 떨어지는 열매를 쫓아다녀야 하므로 이 장면에서만 조금 더 빠르게 움직인다
    this.player.setSpeedScale(MINIGAME.moveSpeedScale);
    this.basket = this.add
      .image(this.player.x, this.player.y + BASKET_OFFSET_Y, ASSETS.ui.basket)
      .setScale(1.6)
      .setDepth(41);

    this.buildHud();
    this.bindEvents();
    this.cursors = this.input.keyboard?.createCursorKeys();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const dispose of this.disposers) dispose();
      this.disposers = [];
      audio.setBgmTrack('village');
    });

    // 조금 긴박한 배경음으로 바꾼다. (요청 5)
    audio.setBgmTrack('minigame');

    gameEvents.emit('scene:changed', { sceneKey: 'FruitCatchScene' });
    gameEvents.emit('interaction:changed', { prompts: [] });
    // 시작 안내 팝업을 띄운다. 누를 때까지 게임은 멈춰 있다.
    gameEvents.emit('minigame:phase', { phase: 'intro' });
  }

  /* --------------------------------- HUD --------------------------------- */

  private buildHud(): void {
    const panel = this.add.graphics().setScrollFactor(0).setDepth(90);
    panel.fillStyle(Phaser.Display.Color.HexStringToColor(PALETTE.cream).color, 0.94);
    panel.fillRoundedRect(GAME_WIDTH / 2 - 250, INFO_BAR_Y, 500, 74, 26);
    panel.lineStyle(4, Phaser.Display.Color.HexStringToColor(PALETTE.outline).color, 1);
    panel.strokeRoundedRect(GAME_WIDTH / 2 - 250, INFO_BAR_Y, 500, 74, 26);

    this.timerLabel = this.add
      .text(GAME_WIDTH / 2 - 110, INFO_BAR_Y + 37, '', {
        fontFamily: GAME_FONT,
        fontSize: '38px',
        color: PALETTE.outline,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(91);

    this.scoreLabel = this.add
      .text(GAME_WIDTH / 2 + 110, INFO_BAR_Y + 37, '', {
        fontFamily: GAME_FONT,
        fontSize: '38px',
        color: PALETTE.outline,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(91);

    this.updateHud();
  }

  private updateHud(): void {
    this.timerLabel.setText(`남은 시간 ${this.remaining}`);
    this.scoreLabel.setText(`받은 열매 ${this.caught}`);
    // 시간이 얼마 없으면 빨간 기운을 살짝 준다.
    this.timerLabel.setColor(this.remaining <= 5 ? PALETTE.apple : PALETTE.outline);
  }

  /* -------------------------------- 이벤트 -------------------------------- */

  private bindEvents(): void {
    this.disposers.push(
      gameEvents.on('move:start', ({ direction }) => {
        this.moveDir = direction === 'left' ? -1 : 1;
      }),
      gameEvents.on('move:stop', () => {
        this.moveDir = 0;
      }),
      gameEvents.on('minigame:start', () => this.beginPlay()),
      gameEvents.on('minigame:continue', () => this.askForChest()),
      gameEvents.on('scene:goto', ({ sceneKey }) => {
        if (sceneKey === 'FruitCatchScene') return;
        this.scene.start(sceneKey);
      }),
    );
  }

  /* -------------------------------- 진행 --------------------------------- */

  private beginPlay(): void {
    if (this.playing || this.finished) return;
    this.playing = true;
    gameEvents.emit('minigame:phase', { phase: 'playing' });

    this.spawnEvent = this.time.addEvent({
      delay: 620,
      loop: true,
      callback: () => this.spawnFruit(),
    });
    this.countdownEvent = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => this.tickCountdown(),
    });
  }

  private spawnFruit(): void {
    if (!this.playing || this.finished) return;
    const keys = [
      ASSETS.crops.apple,
      ASSETS.crops.orange,
      ASSETS.crops.peach,
      ASSETS.crops.cherry,
    ];
    const key = Phaser.Utils.Array.GetRandom(keys);
    const sprite = this.add
      .image(Phaser.Math.Between(140, GAME_WIDTH - 140), -60, key)
      .setDepth(35)
      .setScale(1.2);
    this.tweens.add({
      targets: sprite,
      angle: Phaser.Math.Between(-25, 25),
      duration: 900,
      yoyo: true,
      repeat: -1,
    });
    this.fruits.push({ sprite, speed: Phaser.Math.Between(230, 340) });
  }

  private tickCountdown(): void {
    if (!this.playing || this.finished) return;
    this.remaining -= 1;
    this.updateHud();
    if (this.remaining <= 3 && this.remaining > 0) audio.play('tap');
    if (this.remaining <= 0) this.finish();
  }

  update(_time: number, delta: number): void {
    if (this.finished) return;

    let dir = this.moveDir;
    if (this.cursors) {
      if (this.cursors.left?.isDown) dir = -1;
      else if (this.cursors.right?.isDown) dir = 1;
    }
    this.player.setMoveDirection(dir);
    this.player.tick(delta, 90, GAME_WIDTH - 90);
    this.basket.setPosition(this.player.x, this.player.y + BASKET_OFFSET_Y);

    if (!this.playing) return;

    const dt = delta / 1000;
    for (const fruit of [...this.fruits]) {
      fruit.sprite.y += fruit.speed * dt;

      const dx = Math.abs(fruit.sprite.x - this.basket.x);
      const dy = Math.abs(fruit.sprite.y - this.basket.y);
      if (dx < CATCH_RADIUS && dy < 46) {
        this.collect(fruit);
        continue;
      }
      if (fruit.sprite.y > GROUND_Y + 40) {
        this.drop(fruit);
      }
    }
  }

  private collect(fruit: FallingFruit): void {
    this.caught += 1;
    audio.play('harvest');
    sparkleAt(this, fruit.sprite.x, fruit.sprite.y, 5);
    this.remove(fruit);
    this.updateHud();
    this.tweens.add({
      targets: this.basket,
      scaleY: { from: 1.35, to: 1.6 },
      duration: 160,
      ease: 'Back.easeOut',
    });
  }

  private drop(fruit: FallingFruit): void {
    const { x } = fruit.sprite;
    this.remove(fruit);
    const splash = this.add.image(x, GROUND_Y + 30, ASSETS.particles.leaf).setDepth(30);
    this.tweens.add({
      targets: splash,
      alpha: 0,
      y: GROUND_Y + 10,
      duration: 400,
      onComplete: () => splash.destroy(),
    });
  }

  private remove(fruit: FallingFruit): void {
    fruit.sprite.destroy();
    this.fruits = this.fruits.filter((f) => f !== fruit);
  }

  /* -------------------------------- 마무리 -------------------------------- */

  private chestCount(): number {
    return Math.min(
      MINIGAME.maxChests,
      Math.max(1, Math.floor(this.caught / MINIGAME.fruitPerChest)),
    );
  }

  private finish(): void {
    this.finished = true;
    this.playing = false;
    const store = useGameStore.getState();
    store.setRecord('fruitCatch', this.caught);
    // 한 판 결과를 기록하고 등수를 받는다. (요청 2)
    const { rank } = store.recordMiniGameScore(this.caught);
    // 상자는 하루 한 번만. 게임 자체는 몇 번이든 할 수 있다. (요청 1)
    this.canClaim = store.canClaimMiniGameReward();

    this.spawnEvent?.remove();
    this.countdownEvent?.remove();
    for (const fruit of [...this.fruits]) this.remove(fruit);

    burstStars(this, this.player.x, this.player.y - 140, 18);
    floatText(this, this.player.x, this.player.y - 190, `열매 ${this.caught}개!`, PALETTE.gold);

    // 결과·순위표 팝업은 React 가 크게 띄운다.
    gameEvents.emit('minigame:phase', {
      phase: 'result',
      caught: this.caught,
      chestCount: this.chestCount(),
      rank,
      canClaimReward: this.canClaim,
    });
  }

  /** 결과 팝업을 닫은 뒤. 오늘 상자를 받을 수 있으면 문제를 낸다. (명세 30) */
  private askForChest(): void {
    if (!this.canClaim) {
      // 오늘 보상은 이미 받았다. 기록만 남기고 돌아간다.
      gameEvents.emit('minigame:ended', { caught: this.caught, chestCount: 0 });
      this.leaveToTown();
      return;
    }

    const chestCount = this.chestCount();
    const requestId = `mini_${Date.now().toString(36)}`;

    const off = gameEvents.on('math:result', (payload) => {
      if (payload.requestId !== requestId) return;
      off();
      if (payload.correct) {
        const store = useGameStore.getState();
        store.addChest(chestCount);
        store.claimMiniGameReward();
        const levelUp = store.gainExperience('MINIGAME');
        if (levelUp.leveledUp) gameEvents.emit('level:up', { level: levelUp.newLevel });
        audio.play('coin');
        // 어디로 가야 하는지 3초 동안 안내한다.
        gameEvents.emit('toast', {
          text: `랜덤 상자 ${chestCount}개를 받았어요! ${AREA_NAME.home}에 가서 열어 보세요`,
          tone: 'reward',
          durationMs: 3000,
        });
      }
      gameEvents.emit('minigame:ended', { caught: this.caught, chestCount });
      this.leaveToTown();
    });
    this.disposers.push(off);

    gameEvents.emit('math:request', {
      requestId,
      context: 'MINIGAME',
      title: `열매 ${this.caught}개를 받았어요! 상자를 열 준비를 해 볼까요?`,
    });
  }

  private leaveToTown(): void {
    this.time.delayedCall(600, () => this.scene.start('TownScene', { spawnX: TOWN.minigameX - 80 }));
  }
}
