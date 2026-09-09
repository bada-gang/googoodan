import Phaser from 'phaser';
import { PALETTE } from '@/config/artTokens';
import { GAME_HEIGHT, GAME_WIDTH } from '@/config/layout';
import { GAME_TITLE } from '@/config/strings';
import { preloadGameFont } from '../fonts';
import { GAME_FONT } from '../objects/effects';

/** 웹폰트를 최대 이만큼만 기다린다. 오프라인 교실에서도 게임이 시작되어야 한다. */
const FONT_WAIT_MS = 2500;

/**
 * 최소 부팅.
 * 게임이 그릴 한글 글자를 미리 받아 둔 뒤에 다음 씬으로 넘어간다.
 * 이렇게 하지 않으면 한 낱말 안에서 글씨체가 달라 보인다. (fonts.ts 참고)
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(PALETTE.skyBottom);
    const label = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_TITLE, {
        fontFamily: GAME_FONT,
        fontSize: '64px',
        color: PALETTE.outline,
      })
      .setOrigin(0.5);

    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      label.destroy();
      this.scene.start('PreloadScene');
    };

    // 폰트를 기다리되, 네트워크가 느리거나 끊겨도 게임은 반드시 시작한다.
    this.time.delayedCall(FONT_WAIT_MS + 500, start);
    void preloadGameFont('Jua', FONT_WAIT_MS).then((ready) => {
      if (!ready) {
        console.info('[fonts] 웹폰트를 못 받아 기본 글씨체로 시작합니다.');
      }
      // 폰트가 적용된 상태에서 제목을 다시 그리게 한다.
      label.setText(GAME_TITLE);
      start();
    });
  }
}
