import Phaser from 'phaser';
import {
  ART_MANIFEST_URL,
  ASSET_BASE_URL,
  ASSET_SPEC_BY_KEY,
  type ArtManifestFile,
} from '@/config/assets';
import { PALETTE } from '@/config/artTokens';
import { GAME_HEIGHT, GAME_WIDTH } from '@/config/layout';
import { GAME_TITLE } from '@/config/strings';
import { registerAnimations } from '../anims';
import { registerPlaceholderTextures } from '../placeholder';
import { GAME_FONT } from '../objects/effects';

const MANIFEST_KEY = 'artManifest';

/**
 * 에셋 준비.
 *
 * public/assets/art-manifest.json 의 ready 목록에 있는 키만 실제 파일에서 읽고,
 * 나머지는 임시(placeholder) 아트를 생성한다. (명세 62, 64 · Phase 7)
 */
export class PreloadScene extends Phaser.Scene {
  private readyKeys = new Set<string>();

  constructor() {
    super('PreloadScene');
  }

  preload(): void {
    this.drawLoadingBar();

    this.load.json(MANIFEST_KEY, ART_MANIFEST_URL);
    this.load.once(`filecomplete-json-${MANIFEST_KEY}`, () => this.queueRealAssets());
    // 매니페스트가 없어도 게임은 임시 아트로 정상 동작해야 한다.
    this.load.once('loaderror', (file: Phaser.Loader.File) => {
      if (file.key === MANIFEST_KEY) {
        console.info('[preload] art-manifest.json 이 없어 전부 임시 아트로 시작합니다.');
      } else {
        console.warn(`[preload] "${file.key}" 로드 실패 — 임시 아트로 대체합니다.`);
        this.readyKeys.delete(file.key);
      }
    });
  }

  private queueRealAssets(): void {
    const manifest = this.cache.json.get(MANIFEST_KEY) as ArtManifestFile | undefined;
    const ready = manifest?.ready ?? [];
    for (const key of ready) {
      const spec = ASSET_SPEC_BY_KEY[key];
      if (!spec) {
        console.warn(`[preload] 매니페스트에 알 수 없는 키: ${key}`);
        continue;
      }
      const url = ASSET_BASE_URL + spec.path;
      if (spec.type === 'spritesheet' && spec.frameWidth && spec.frameHeight) {
        this.load.spritesheet(key, url, {
          frameWidth: spec.frameWidth,
          frameHeight: spec.frameHeight,
        });
      } else if (spec.type === 'audio') {
        this.load.audio(key, url);
      } else {
        this.load.image(key, url);
      }
      this.readyKeys.add(key);
    }
  }

  private drawLoadingBar(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    this.cameras.main.setBackgroundColor(PALETTE.skyBottom);

    const title = this.add
      .text(cx, cy - 90, GAME_TITLE, {
        fontFamily: GAME_FONT,
        fontSize: '72px',
        color: PALETTE.outline,
      })
      .setOrigin(0.5);

    const frame = this.add.graphics();
    frame.fillStyle(Phaser.Display.Color.HexStringToColor(PALETTE.cream).color, 1);
    frame.fillRoundedRect(cx - 220, cy - 6, 440, 40, 20);
    frame.lineStyle(4, Phaser.Display.Color.HexStringToColor(PALETTE.outline).color, 1);
    frame.strokeRoundedRect(cx - 220, cy - 6, 440, 40, 20);

    const bar = this.add.graphics();
    const hint = this.add
      .text(cx, cy + 68, '마을을 준비하고 있어요', {
        fontFamily: GAME_FONT,
        fontSize: '28px',
        color: PALETTE.outlineSoft,
      })
      .setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      bar.clear();
      bar.fillStyle(Phaser.Display.Color.HexStringToColor(PALETTE.gold).color, 1);
      bar.fillRoundedRect(cx - 212, cy + 2, Math.max(20, 424 * value), 26, 13);
    });

    this.load.once('complete', () => {
      bar.destroy();
      frame.destroy();
      hint.destroy();
      title.destroy();
    });
  }

  create(): void {
    registerPlaceholderTextures(this, this.readyKeys);
    registerAnimations(this);
    this.scene.start('YardScene');
  }
}
