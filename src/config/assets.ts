/**
 * 중앙 에셋 매니페스트. (명세 62, 63, 64)
 *
 * 게임 로직에서는 절대 파일 경로를 직접 쓰지 않고 ASSETS 의 키만 사용한다.
 * 실제 아트가 준비되면 public/assets/ 아래에 같은 경로로 파일을 넣고
 * public/assets/art-manifest.json 의 `ready` 배열에 키를 추가하면
 * placeholder 대신 실제 파일이 로드된다. (Phase 7 아트 패스)
 */
import { FURNITURE } from './catalog';
import type { AnimalSpeciesId, AvatarId, TreeSpeciesId, TreeStage } from '@/types/game';

export const ASSETS = {
  player: {
    idle: 'player_idle',
    walk: 'player_walk',
    interact: 'player_interact',
    happy: 'player_happy',
  },
  avatars: {
    rabbit: 'avatar_rabbit',
    bear: 'avatar_bear',
    cat: 'avatar_cat',
    fox: 'avatar_fox',
    bird: 'avatar_bird',
    frog: 'avatar_frog',
  },
  animals: {
    chicken: {
      idle: 'animal_chicken_idle',
      walk: 'animal_chicken_walk',
      eat: 'animal_chicken_eat',
      happy: 'animal_chicken_happy',
    },
    goat: {
      idle: 'animal_goat_idle',
      walk: 'animal_goat_walk',
      eat: 'animal_goat_eat',
      happy: 'animal_goat_happy',
    },
    sheep: {
      idle: 'animal_sheep_idle',
      walk: 'animal_sheep_walk',
      eat: 'animal_sheep_eat',
      happy: 'animal_sheep_happy',
    },
    cow: {
      idle: 'animal_cow_idle',
      walk: 'animal_cow_walk',
      eat: 'animal_cow_eat',
      happy: 'animal_cow_happy',
    },
  },
  trees: {
    apple: 'tree_apple',
    orange: 'tree_orange',
    peach: 'tree_peach',
    cherry: 'tree_cherry',
    grape: 'tree_grape',
    persimmon: 'tree_persimmon',
  },
  crops: {
    apple: 'crop_apple',
    orange: 'crop_orange',
    peach: 'crop_peach',
    cherry: 'crop_cherry',
    grape: 'crop_grape',
    persimmon: 'crop_persimmon',
    egg: 'crop_egg',
    goatMilk: 'crop_goat_milk',
    wool: 'crop_wool',
    milk: 'crop_milk',
  },
  seeds: {
    apple: 'seedbag_apple',
    orange: 'seedbag_orange',
    peach: 'seedbag_peach',
    cherry: 'seedbag_cherry',
    grape: 'seedbag_grape',
    persimmon: 'seedbag_persimmon',
  },
  buildings: {
    house: 'building_house',
    houseInterior: 'building_house_interior',
    seedShop: 'building_seed_shop',
    furnitureShop: 'building_furniture_shop',
    market: 'building_market',
    minigameStand: 'building_minigame_stand',
    pen: 'building_pen',
    barn: 'building_barn',
  },
  environment: {
    sky: 'env_sky',
    farHills: 'env_far_hills',
    farTrees: 'env_far_trees',
    midTrees: 'env_mid_trees',
    groundYard: 'env_ground_yard',
    groundTown: 'env_ground_town',
    foreGrass: 'env_fore_grass',
    cloudA: 'env_cloud_a',
    cloudB: 'env_cloud_b',
    bush: 'env_bush',
    flowerTuft: 'env_flower_tuft',
    soilPlot: 'env_soil_plot',
    roomWall: 'env_room_wall',
    roomWallStar: 'env_room_wall_star',
    roomFloor: 'env_room_floor',
    roomWindow: 'env_room_window',
    roomDoor: 'env_room_door',
    fenceRail: 'env_fence_rail',
    signpost: 'env_signpost',
  },
  /** 목록/상점에서 쓰는 단일 프레임 썸네일 */
  icons: {
    chicken: 'icon_chicken',
    goat: 'icon_goat',
    sheep: 'icon_sheep',
    cow: 'icon_cow',
  },
  ui: {
    coin: 'ui_coin',
    star: 'ui_star',
    basket: 'ui_basket',
    waterCan: 'ui_water_can',
    feedBag: 'ui_feed_bag',
    chest: 'ui_chest',
    chestOpen: 'ui_chest_open',
    marker: 'ui_marker',
  },
  particles: {
    star: 'particle_star',
    sparkle: 'particle_sparkle',
    soil: 'particle_soil',
    leaf: 'particle_leaf',
  },
  audio: {
    bgm: 'audio_bgm',
    step: 'audio_step',
    correct: 'audio_correct',
    wrong: 'audio_wrong',
    coin: 'audio_coin',
    harvest: 'audio_harvest',
    place: 'audio_place',
    door: 'audio_door',
    animal: 'audio_animal',
  },
} as const;

/** 나무는 성장 단계별로 프레임을 가진다. */
export const TREE_STAGE_FRAME: Record<TreeStage, number> = {
  seed: 0,
  sprout: 1,
  sapling: 2,
  mature: 3,
  fruiting: 4,
};

export function treeTextureKey(species: TreeSpeciesId): string {
  return ASSETS.trees[species];
}

export function animalTextureKey(species: AnimalSpeciesId, anim: 'idle' | 'walk' | 'eat' | 'happy'): string {
  return ASSETS.animals[species][anim];
}

export function avatarTextureKey(id: AvatarId): string {
  return ASSETS.avatars[id];
}

export function furnitureTextureKey(itemId: string): string {
  return `furniture_${itemId}`;
}

/* --------------------------- 실제 아트 파일 매니페스트 -------------------------- */

export type AssetType = 'image' | 'spritesheet' | 'audio';

export interface AssetSpec {
  key: string;
  /** public/assets/ 기준 상대 경로 */
  path: string;
  type: AssetType;
  frameWidth?: number;
  frameHeight?: number;
  frameCount?: number;
}

function img(key: string, path: string): AssetSpec {
  return { key, path, type: 'image' };
}

function sheet(
  key: string,
  path: string,
  frameWidth: number,
  frameHeight: number,
  frameCount: number,
): AssetSpec {
  return { key, path, type: 'spritesheet', frameWidth, frameHeight, frameCount };
}

const ANIMAL_SIZE: Record<AnimalSpeciesId, [number, number]> = {
  chicken: [96, 96],
  goat: [120, 112],
  sheep: [128, 112],
  cow: [160, 140],
};

/**
 * 최종 아트 파일이 놓일 위치와 규격.
 * 이 목록의 순서/경로는 ART_DIRECTION.md 와 일치해야 한다.
 */
export const ASSET_MANIFEST: AssetSpec[] = [
  // 캐릭터 (명세 42)
  sheet(ASSETS.player.idle, 'characters/player_idle.png', 120, 160, 4),
  sheet(ASSETS.player.walk, 'characters/player_walk.png', 120, 160, 6),
  sheet(ASSETS.player.interact, 'characters/player_interact.png', 120, 160, 4),
  sheet(ASSETS.player.happy, 'characters/player_happy.png', 120, 160, 4),
  ...(Object.keys(ASSETS.avatars) as AvatarId[]).map((id) =>
    img(ASSETS.avatars[id], `characters/avatar_${id}.png`),
  ),

  // 동물 (명세 44, 45)
  ...(Object.keys(ANIMAL_SIZE) as AnimalSpeciesId[]).flatMap((species) => {
    const [w, h] = ANIMAL_SIZE[species];
    return [
      sheet(ASSETS.animals[species].idle, `animals/${species}_idle.png`, w, h, 4),
      sheet(ASSETS.animals[species].walk, `animals/${species}_walk.png`, w, h, 4),
      sheet(ASSETS.animals[species].eat, `animals/${species}_eat.png`, w, h, 4),
      sheet(ASSETS.animals[species].happy, `animals/${species}_happy.png`, w, h, 4),
    ];
  }),

  // 나무: 5단계를 한 스프라이트시트로 (명세 46)
  ...(Object.keys(ASSETS.trees) as TreeSpeciesId[]).map((species) =>
    sheet(ASSETS.trees[species], `trees/${species}.png`, 260, 300, 5),
  ),

  // 수확물 / 씨앗
  ...Object.entries(ASSETS.crops).map(([id, key]) => img(key, `crops/${id}.png`)),
  ...Object.entries(ASSETS.seeds).map(([id, key]) => img(key, `crops/seedbag_${id}.png`)),

  // 건물
  ...Object.entries(ASSETS.buildings).map(([id, key]) => img(key, `buildings/${id}.png`)),

  // 환경 / 배경 레이어 (명세 47, 48)
  ...Object.entries(ASSETS.environment).map(([id, key]) => img(key, `environment/${id}.png`)),

  // 가구 · 장식 (명세 51)
  ...FURNITURE.map((f) =>
    img(furnitureTextureKey(f.id), `${f.area === 'yard' ? 'decorations' : 'furniture'}/${f.id}.png`),
  ),

  // UI / 파티클
  ...Object.entries(ASSETS.icons).map(([id, key]) => img(key, `ui/icon_${id}.png`)),
  ...Object.entries(ASSETS.ui).map(([id, key]) => img(key, `ui/${id}.png`)),
  ...Object.entries(ASSETS.particles).map(([id, key]) => img(key, `particles/${id}.png`)),
];

export const ASSET_SPEC_BY_KEY: Record<string, AssetSpec> = Object.fromEntries(
  ASSET_MANIFEST.map((a) => [a.key, a]),
);

/** public/assets/art-manifest.json 의 형태 */
export interface ArtManifestFile {
  /** 실제 아트가 준비되어 파일에서 로드해야 하는 에셋 키 목록 */
  ready: string[];
}

export const ART_MANIFEST_URL = 'assets/art-manifest.json';
export const ASSET_BASE_URL = 'assets/';
