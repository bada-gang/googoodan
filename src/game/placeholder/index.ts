/**
 * placeholder 텍스처 등록기.
 *
 * ⚠ 여기서 만드는 모든 텍스처는 임시 에셋이다. (명세 64)
 *    실제 아트가 준비되면 PreloadScene 이 파일에서 로드하므로 이 코드는 호출되지 않는다.
 *    어떤 키가 아직 임시인지 isPlaceholder() 로 확인할 수 있다.
 */
import type Phaser from 'phaser';
import { ASSETS, CHARACTER_IDS, furnitureTextureKey } from '@/config/assets';
import { FURNITURE } from '@/config/catalog';
import { GAME_HEIGHT, GAME_WIDTH } from '@/config/layout';
import { PALETTE } from '@/config/artTokens';
import type { AnimalSpeciesId, AvatarId, TreeSpeciesId } from '@/types/game';
import { cropFrame, type Sheet } from './draw';
import type { CharacterId } from '@/types/game';
import {
  buildAvatarSheet,
  buildPlayerHappySheet,
  buildPlayerIdleSheet,
  buildPlayerInteractSheet,
  buildPlayerWalkSheet,
} from './characters';
import { buildAnimalSheet, type AnimalAnim } from './animals';
import {
  buildBush,
  buildCloud,
  buildCropIcon,
  buildFarHills,
  buildFenceRail,
  buildFlowerTuft,
  buildForeGrass,
  buildGroundTile,
  buildRoomDoor,
  buildRoomFloor,
  buildRoomWall,
  buildRoomWindow,
  buildSeedBagIcon,
  buildSignpost,
  buildSky,
  buildSoilPlot,
  buildTreeLine,
  buildTreeSheet,
} from './nature';
import { buildBarn, buildHouse, buildPen, buildShop } from './buildings';
import { buildFurnitureIcon } from './furniture';
import { buildParticle, buildUiIcon } from './uiArt';

const placeholderKeys = new Set<string>();

export function isPlaceholder(key: string): boolean {
  return placeholderKeys.has(key);
}

export function placeholderCount(): number {
  return placeholderKeys.size;
}

function addSheet(scene: Phaser.Scene, key: string, sheet: Sheet): void {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const texture = scene.textures.addCanvas(key, sheet.canvas);
  if (!texture) {
    console.warn(`[placeholder] "${key}" 텍스처 등록 실패`);
    return;
  }
  if (sheet.frames > 1) {
    for (let i = 0; i < sheet.frames; i += 1) {
      texture.add(i, 0, i * sheet.frameWidth, 0, sheet.frameWidth, sheet.frameHeight);
    }
  }
  placeholderKeys.add(key);
}

type Builder = () => Sheet;

/** 키 -> 임시 그림 생성기 */
function builders(): Record<string, Builder> {
  const map: Record<string, Builder> = {
    // 캐릭터
    ...Object.fromEntries(
      CHARACTER_IDS.flatMap((c) => [
        [ASSETS.characters[c].idle, () => buildPlayerIdleSheet(c)],
        [ASSETS.characters[c].walk, () => buildPlayerWalkSheet(c)],
        [ASSETS.characters[c].interact, () => buildPlayerInteractSheet(c)],
        [ASSETS.characters[c].happy, () => buildPlayerHappySheet(c)],
      ]),
    ),

    // 건물
    [ASSETS.buildings.house]: buildHouse,
    [ASSETS.buildings.seedShop]: () => buildShop('seed'),
    [ASSETS.buildings.furnitureShop]: () => buildShop('furniture'),
    [ASSETS.buildings.market]: () => buildShop('market'),
    [ASSETS.buildings.minigameStand]: () => buildShop('minigame'),
    [ASSETS.buildings.barn]: buildBarn,
    [ASSETS.buildings.pen]: buildPen,
    [ASSETS.buildings.houseInterior]: () => buildRoomWall('plain'),

    // 환경
    [ASSETS.environment.sky]: () => buildSky(GAME_WIDTH, GAME_HEIGHT),
    [ASSETS.environment.farHills]: () => buildFarHills(GAME_WIDTH, 320),
    [ASSETS.environment.farTrees]: () => buildTreeLine(GAME_WIDTH, 220, PALETTE.farTreeShade, 14),
    [ASSETS.environment.midTrees]: () => buildTreeLine(800, 250, PALETTE.farTree, 7),
    [ASSETS.environment.groundYard]: () => buildGroundTile(256, 190, false),
    [ASSETS.environment.groundTown]: () => buildGroundTile(256, 190, true),
    [ASSETS.environment.foreGrass]: () => buildForeGrass(320, 80),
    [ASSETS.environment.cloudA]: () => buildCloud(280, 120, 5),
    [ASSETS.environment.cloudB]: () => buildCloud(190, 92, 4),
    [ASSETS.environment.bush]: buildBush,
    [ASSETS.environment.flowerTuft]: buildFlowerTuft,
    [ASSETS.environment.soilPlot]: buildSoilPlot,
    [ASSETS.environment.roomWall]: () => buildRoomWall('plain'),
    [ASSETS.environment.roomWallStar]: () => buildRoomWall('star'),
    [ASSETS.environment.roomFloor]: () => buildRoomFloor('plank'),
    [ASSETS.environment.roomFloorCheck]: () => buildRoomFloor('check'),
    [ASSETS.environment.roomFloorCarpet]: () => buildRoomFloor('carpet'),
    [ASSETS.environment.roomWindow]: buildRoomWindow,
    [ASSETS.environment.roomDoor]: buildRoomDoor,
    [ASSETS.environment.fenceRail]: buildFenceRail,
    [ASSETS.environment.signpost]: buildSignpost,
  };

  // 아바타
  for (const id of Object.keys(ASSETS.avatars) as AvatarId[]) {
    map[ASSETS.avatars[id]] = () => buildAvatarSheet(id);
  }

  // 동물
  const anims: AnimalAnim[] = ['idle', 'walk', 'eat', 'happy'];
  for (const species of Object.keys(ASSETS.animals) as AnimalSpeciesId[]) {
    for (const anim of anims) {
      map[ASSETS.animals[species][anim]] = () => buildAnimalSheet(species, anim);
    }
  }

  // 나무 · 수확물 · 씨앗
  for (const species of Object.keys(ASSETS.trees) as TreeSpeciesId[]) {
    map[ASSETS.trees[species]] = () => buildTreeSheet(species);
    map[ASSETS.seeds[species]] = () => buildSeedBagIcon(species);
  }
  for (const [id, key] of Object.entries(ASSETS.crops)) {
    map[key] = () => buildCropIcon(id as Parameters<typeof buildCropIcon>[0]);
  }

  // 가구 · 장식
  for (const def of FURNITURE) {
    map[furnitureTextureKey(def.id)] = () => buildFurnitureIcon(def);
  }

  // 목록용 동물 썸네일
  for (const species of Object.keys(ASSETS.icons) as AnimalSpeciesId[]) {
    map[ASSETS.icons[species]] = () => cropFrame(buildAnimalSheet(species, 'idle'), 0);
  }

  // UI · 파티클
  for (const [id, key] of Object.entries(ASSETS.ui)) {
    map[key] = () => buildUiIcon(id);
  }
  for (const [id, key] of Object.entries(ASSETS.particles)) {
    map[key] = () => buildParticle(id);
  }

  return map;
}

let cachedBuilders: Record<string, Builder> | null = null;

function allBuilders(): Record<string, Builder> {
  cachedBuilders ??= builders();
  return cachedBuilders;
}

/**
 * React UI(상점·가방 등)에서도 같은 임시 그림을 쓰기 위한 진입점.
 * Phaser 없이 순수 Canvas 로만 동작한다.
 */
export function buildPlaceholderSheet(key: string): Sheet | null {
  const build = allBuilders()[key];
  if (!build) return null;
  try {
    return build();
  } catch (error) {
    console.error(`[placeholder] "${key}" 생성 실패`, error);
    return null;
  }
}

/**
 * 실제 아트가 없는 키에 대해서만 임시 텍스처를 만든다.
 * @param readyKeys 실제 파일로 이미 로드된 키 목록
 */
export function registerPlaceholderTextures(scene: Phaser.Scene, readyKeys: Set<string>): void {
  const map = allBuilders();
  for (const [key, build] of Object.entries(map)) {
    if (readyKeys.has(key)) continue;
    try {
      addSheet(scene, key, build());
    } catch (error) {
      console.error(`[placeholder] "${key}" 생성 실패`, error);
    }
  }
  if (placeholderKeys.size > 0) {
    console.info(
      `[placeholder] 임시 아트 ${placeholderKeys.size}종을 생성했습니다. ` +
        'Phase 7 아트 패스에서 public/assets/ 의 실제 파일로 교체하세요.',
    );
  }
}

/** 캐릭터 고르기 화면에서 쓰는 한 프레임짜리 그림 */
export function buildCharacterPreview(character: CharacterId): Sheet {
  return cropFrame(buildPlayerIdleSheet(character), 0);
}
