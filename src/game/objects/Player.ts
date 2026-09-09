/**
 * 플레이어 캐릭터. 물리 엔진 없이 단순 좌우 이동만 한다.
 * (평지 횡스크롤이라 중력/충돌이 필요 없고, 태블릿에서 더 가볍다.)
 */
import Phaser from 'phaser';
import { ASSETS } from '@/config/assets';
import { ANIM } from '../anims';

/** 초당 이동 픽셀 (논리 해상도 1280×800 기준) */
export const PLAYER_SPEED = 360;

export class Player extends Phaser.GameObjects.Sprite {
  private moveDir = 0;
  private facing: 1 | -1 = 1;
  private busyUntil = 0;
  /** 장면별 이동 속도 배수. 기본은 마을과 같은 속도. */
  private speedScale = 1;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, ASSETS.player.idle, 0);
    scene.add.existing(this);
    this.setOrigin(0.5, 1);
    this.play(ANIM.playerIdle);
  }

  setMoveDirection(dir: number): void {
    this.moveDir = Phaser.Math.Clamp(dir, -1, 1);
    if (this.moveDir !== 0) {
      this.facing = this.moveDir > 0 ? 1 : -1;
      this.setFlipX(this.facing === -1);
    }
  }

  get direction(): number {
    return this.moveDir;
  }

  get facingSign(): 1 | -1 {
    return this.facing;
  }

  /** 상호작용 동작. 잠깐 이동을 막고 애니메이션을 재생한다. */
  playInteract(): void {
    this.busyUntil = this.scene.time.now + 380;
    this.setTexture(ASSETS.player.interact);
    this.play(ANIM.playerInteract, true);
  }

  playHappy(): void {
    this.busyUntil = this.scene.time.now + 520;
    this.setTexture(ASSETS.player.happy);
    this.play(ANIM.playerHappy, true);
  }

  get isBusy(): boolean {
    return this.scene.time.now < this.busyUntil;
  }

  /** 한 장면에서만 더 빠르게/느리게 움직이고 싶을 때 쓴다. (미니게임) */
  setSpeedScale(scale: number): void {
    this.speedScale = scale;
  }

  tick(deltaMs: number, minX: number, maxX: number): void {
    if (this.isBusy) return;

    if (this.moveDir !== 0) {
      this.x = Phaser.Math.Clamp(
        this.x + this.moveDir * PLAYER_SPEED * this.speedScale * (deltaMs / 1000),
        minX,
        maxX,
      );
      if (this.anims.getName() !== ANIM.playerWalk) {
        this.setTexture(ASSETS.player.walk);
        this.play(ANIM.playerWalk, true);
      }
    } else if (this.anims.getName() !== ANIM.playerIdle) {
      this.setTexture(ASSETS.player.idle);
      this.play(ANIM.playerIdle, true);
    }
  }
}
