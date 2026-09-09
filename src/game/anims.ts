/**
 * 애니메이션 등록. placeholder 든 실제 스프라이트시트든
 * 텍스처에 들어 있는 프레임 수를 읽어 동일하게 동작한다. (명세 45, 58)
 */
import type Phaser from 'phaser';
import { ASSETS } from '@/config/assets';
import { ANIMAL_LIST } from '@/config/catalog';
import type { AnimalSpeciesId } from '@/types/game';

export const ANIM = {
  playerIdle: 'anim_player_idle',
  playerWalk: 'anim_player_walk',
  playerInteract: 'anim_player_interact',
  playerHappy: 'anim_player_happy',
  animal: (species: AnimalSpeciesId, action: 'idle' | 'walk' | 'eat' | 'happy') =>
    `anim_${species}_${action}`,
} as const;

function frameCount(scene: Phaser.Scene, key: string): number {
  if (!scene.textures.exists(key)) return 1;
  const names = scene.textures.get(key).getFrameNames();
  return Math.max(1, names.length);
}

function register(
  scene: Phaser.Scene,
  animKey: string,
  textureKey: string,
  frameRate: number,
  repeat = -1,
): void {
  if (scene.anims.exists(animKey)) return;
  const total = frameCount(scene, textureKey);
  scene.anims.create({
    key: animKey,
    frames: scene.anims.generateFrameNumbers(textureKey, { start: 0, end: total - 1 }),
    frameRate,
    repeat,
  });
}

export function registerAnimations(scene: Phaser.Scene): void {
  register(scene, ANIM.playerIdle, ASSETS.player.idle, 4);
  // 초당 360px 로 움직이므로 다리도 그만큼 빨리 돌아야 발이 덜 미끄러진다.
  register(scene, ANIM.playerWalk, ASSETS.player.walk, 17);
  register(scene, ANIM.playerInteract, ASSETS.player.interact, 10, 0);
  register(scene, ANIM.playerHappy, ASSETS.player.happy, 9, 0);

  // 카탈로그에서 그대로 읽는다. 손으로 적어 두면 종을 늘렸을 때 빠뜨린다
  // (실제로 염소를 추가했을 때 여기 빠져서 애니메이션이 등록되지 않았다).
  for (const { id } of ANIMAL_LIST) {
    register(scene, ANIM.animal(id, 'idle'), ASSETS.animals[id].idle, 3.5);
    register(scene, ANIM.animal(id, 'walk'), ASSETS.animals[id].walk, 7);
    register(scene, ANIM.animal(id, 'eat'), ASSETS.animals[id].eat, 5, 2);
    register(scene, ANIM.animal(id, 'happy'), ASSETS.animals[id].happy, 8, 1);
  }
}
