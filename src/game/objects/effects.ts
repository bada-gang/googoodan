/**
 * 짧은 연출 모음. 화면 전체를 가리지 않는 선에서만 사용한다. (명세 56, 59, 60)
 */
import Phaser from 'phaser';
import { ASSETS } from '@/config/assets';
import { PALETTE } from '@/config/artTokens';

export const GAME_FONT = "'Jua', 'Noto Sans KR', 'Malgun Gothic', sans-serif";

/** 정답 · 보상용 별 파티클 */
export function burstStars(scene: Phaser.Scene, x: number, y: number, count = 10): void {
  const emitter = scene.add.particles(x, y, ASSETS.particles.star, {
    speed: { min: 90, max: 220 },
    angle: { min: 210, max: 330 },
    gravityY: 420,
    scale: { start: 0.9, end: 0.2 },
    alpha: { start: 1, end: 0 },
    rotate: { min: -180, max: 180 },
    lifespan: 700,
    quantity: count,
    emitting: false,
  });
  emitter.setDepth(900);
  emitter.explode(count);
  scene.time.delayedCall(900, () => emitter.destroy());
}

/**
 * 폭죽. 보상이 클수록 여러 번, 넓게 터뜨린다. (요청 9)
 * @param power 0(작게) ~ 1(크게)
 */
export function fireworks(scene: Phaser.Scene, x: number, y: number, power: number): void {
  const strength = Phaser.Math.Clamp(power, 0, 1);
  const bursts = 1 + Math.round(strength * 4);
  const spread = 60 + strength * 260;

  for (let i = 0; i < bursts; i += 1) {
    const delay = i * 170;
    const bx = x + (i === 0 ? 0 : Phaser.Math.Between(-spread, spread));
    const by = y - (i === 0 ? 0 : Phaser.Math.Between(0, 120));
    scene.time.delayedCall(delay, () => {
      const emitter = scene.add.particles(bx, by, ASSETS.particles.star, {
        speed: { min: 120, max: 200 + strength * 260 },
        angle: { min: 0, max: 360 },
        gravityY: 320,
        scale: { start: 0.7 + strength * 0.7, end: 0.15 },
        alpha: { start: 1, end: 0 },
        rotate: { min: -180, max: 180 },
        lifespan: 900 + strength * 500,
        quantity: 10 + Math.round(strength * 22),
        emitting: false,
      });
      emitter.setDepth(930);
      emitter.explode();
      scene.time.delayedCall(1600, () => emitter.destroy());

      const glow = scene.add.particles(bx, by, ASSETS.particles.sparkle, {
        speed: { min: 40, max: 140 },
        scale: { start: 0.9, end: 0 },
        alpha: { start: 0.9, end: 0 },
        lifespan: 620,
        quantity: 8,
        emitting: false,
      });
      glow.setDepth(929);
      glow.explode();
      scene.time.delayedCall(900, () => glow.destroy());
    });
  }
}

export function sparkleAt(scene: Phaser.Scene, x: number, y: number, count = 8): void {
  const emitter = scene.add.particles(x, y, ASSETS.particles.sparkle, {
    speed: { min: 30, max: 120 },
    scale: { start: 0.7, end: 0 },
    alpha: { start: 0.95, end: 0 },
    lifespan: 550,
    quantity: count,
    emitting: false,
  });
  emitter.setDepth(900);
  emitter.explode(count);
  scene.time.delayedCall(750, () => emitter.destroy());
}

/** 씨앗 심기 흙 효과 */
export function soilPuff(scene: Phaser.Scene, x: number, y: number): void {
  const emitter = scene.add.particles(x, y, ASSETS.particles.soil, {
    speed: { min: 60, max: 160 },
    angle: { min: 200, max: 340 },
    gravityY: 620,
    scale: { start: 0.8, end: 0.25 },
    alpha: { start: 0.9, end: 0 },
    lifespan: 520,
    quantity: 9,
    emitting: false,
  });
  emitter.setDepth(500);
  emitter.explode(9);
  scene.time.delayedCall(700, () => emitter.destroy());
}

export function leafPuff(scene: Phaser.Scene, x: number, y: number): void {
  const emitter = scene.add.particles(x, y, ASSETS.particles.leaf, {
    speed: { min: 40, max: 130 },
    gravityY: 180,
    scale: { start: 0.9, end: 0.4 },
    alpha: { start: 1, end: 0 },
    rotate: { min: -120, max: 120 },
    lifespan: 900,
    quantity: 7,
    emitting: false,
  });
  emitter.setDepth(500);
  emitter.explode(7);
  scene.time.delayedCall(1100, () => emitter.destroy());
}

/** 획득량 등을 위로 떠오르게 표시 */
export function floatText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  color: string = PALETTE.gold,
): void {
  const label = scene.add
    .text(x, y, text, {
      fontFamily: GAME_FONT,
      fontSize: '40px',
      color,
      stroke: PALETTE.outline,
      strokeThickness: 7,
    })
    .setOrigin(0.5)
    .setDepth(950);

  scene.tweens.add({
    targets: label,
    y: y - 76,
    alpha: { from: 1, to: 0 },
    duration: 950,
    ease: 'Cubic.easeOut',
    onComplete: () => label.destroy(),
  });
}

/** 수확물이 캐릭터(가방) 쪽으로 날아가는 연출 (명세 59) */
export function flyToBag(
  scene: Phaser.Scene,
  fromX: number,
  fromY: number,
  textureKey: string,
  targetX: number,
  targetY: number,
  index = 0,
): void {
  const icon = scene.add.image(fromX, fromY, textureKey).setDepth(940).setScale(0.9);
  scene.tweens.add({
    targets: icon,
    x: targetX,
    y: targetY,
    scale: 0.3,
    alpha: { from: 1, to: 0.4 },
    delay: index * 90,
    duration: 520,
    ease: 'Back.easeIn',
    onComplete: () => {
      sparkleAt(scene, targetX, targetY, 4);
      icon.destroy();
    },
  });
}

/** 상호작용 가능 표시(느낌표)를 오브젝트 위에 띄운다. */
export function createMarker(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Image {
  const marker = scene.add.image(x, y, ASSETS.ui.marker).setDepth(880).setScale(0.85);
  scene.tweens.add({
    targets: marker,
    y: y - 12,
    duration: 620,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });
  return marker;
}

/** 나무·풀이 살아 있어 보이도록 하는 작은 흔들림 (명세 58) */
export function idleSway(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite,
  amount = 0.02,
  duration = 2200,
): void {
  scene.tweens.add({
    targets: target,
    rotation: { from: -amount, to: amount },
    duration: duration + Math.random() * 700,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
    delay: Math.random() * 900,
  });
}
