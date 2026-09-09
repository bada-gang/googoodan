/**
 * Phaser 게임 설정. 논리 해상도 1280x800 을 다양한 태블릿에 맞춘다. (명세 67)
 */
import Phaser from 'phaser';
import { PALETTE } from '@/config/artTokens';
import { GAME_HEIGHT, GAME_WIDTH } from '@/config/layout';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { YardScene } from './scenes/YardScene';
import { HomeScene } from './scenes/HomeScene';
import { TownScene } from './scenes/TownScene';
import { FruitCatchScene } from './scenes/FruitCatchScene';

export function createGameConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: PALETTE.skyBottom,
    // FIT: 어떤 비율에서도 중요한 오브젝트가 잘리지 않는다. (명세 67)
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    },
    render: {
      antialias: true,
      roundPixels: false,
      powerPreference: 'high-performance',
    },
    input: {
      activePointers: 3,
      touch: { capture: true },
    },
    dom: { createContainer: false },
    scene: [BootScene, PreloadScene, YardScene, HomeScene, TownScene, FruitCatchScene],
  };
}
