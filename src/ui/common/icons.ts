/**
 * React UI 용 아이콘 소스.
 * Phaser 와 같은 에셋 키를 쓰므로, 실제 아트로 교체하면 UI 도 자동으로 따라간다.
 * 이모지는 쓰지 않는다. (명세 5, 75-1)
 */
import { ASSETS, avatarTextureKey, furnitureTextureKey, surfaceTextureKey } from '@/config/assets';
import { isArtReady, realAssetUrl } from '@/config/artReady';
import type { SurfaceDef } from '@/config/catalog';
import {
  FURNITURE_BY_ID,
  SELLABLE_NAME,
  SUPPLIES,
  TREE_SPECIES,
  speciesOfSeed,
} from '@/config/catalog';
import { buildPlaceholderSheet, buildCharacterPreview } from '@/game/placeholder';
import type {
  AnimalSpeciesId,
  AvatarId,
  CharacterId,
  SellableId,
  SupplyId,
  TreeSpeciesId,
} from '@/types/game';

const cache = new Map<string, string>();

/** 에셋 키 -> <img src> */
export function iconUrl(assetKey: string): string {
  const cached = cache.get(assetKey);
  if (cached) return cached;

  if (isArtReady(assetKey)) {
    const url = realAssetUrl(assetKey);
    if (url) {
      cache.set(assetKey, url);
      return url;
    }
  }

  const sheet = buildPlaceholderSheet(assetKey);
  const url = sheet ? sheet.canvas.toDataURL('image/png') : '';
  cache.set(assetKey, url);
  return url;
}

export function avatarIcon(id: AvatarId): string {
  return iconUrl(avatarTextureKey(id));
}

/**
 * 벽지·바닥 미리보기.
 *
 * Phaser 가 방에서 하는 것과 같은 계산(고른 색 × 흰 바탕 무늬 타일)을 캔버스에서 그대로 한다.
 * 상점 그림과 방에 깔았을 때가 다르면 아이가 사고 나서 "이거 아닌데" 하게 된다.
 */
export function surfaceIcon(surface: SurfaceDef, kind: 'wall' | 'floor'): string {
  const key = `surface_${kind}_${surface.id}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const sheet = buildPlaceholderSheet(surfaceTextureKey(surface, kind));
  // 바닥 타일 맨 위 15px 은 벽과 만나는 굽도리다. 견본에 넣으면 무늬가 아니라 테두리처럼 보인다.
  const skip = kind === 'floor' ? 16 : 0;
  const canvas = document.createElement('canvas');
  canvas.width = sheet?.frameWidth ?? 64;
  canvas.height = (sheet?.frameHeight ?? 64) - skip;
  const ctx = canvas.getContext('2d');
  let url = '';
  if (ctx) {
    ctx.fillStyle = surface.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (sheet) {
      // tint 와 같은 곱셈 합성. 흰 부분은 색 그대로, 어두운 무늬만 진해진다.
      ctx.globalCompositeOperation = 'multiply';
      ctx.drawImage(sheet.canvas, 0, -skip);
    }
    url = canvas.toDataURL('image/png');
  }
  cache.set(key, url);
  return url;
}

export function seedIcon(species: TreeSpeciesId): string {
  return iconUrl(ASSETS.seeds[species]);
}

export function cropIcon(id: SellableId): string {
  return iconUrl(ASSETS.crops[id]);
}

export function animalIcon(species: AnimalSpeciesId): string {
  return iconUrl(ASSETS.icons[species]);
}

export function furnitureIcon(itemId: string): string {
  return iconUrl(furnitureTextureKey(itemId));
}

export const coinIcon = () => iconUrl(ASSETS.ui.coin);
export const starIcon = () => iconUrl(ASSETS.ui.star);
export const basketIcon = () => iconUrl(ASSETS.ui.basket);
export const chestIcon = () => iconUrl(ASSETS.ui.chest);

const SUPPLY_ICON_KEY: Record<SupplyId, string> = {
  water: ASSETS.ui.waterCan,
  feed: ASSETS.ui.feedBag,
};

export function supplyIcon(id: SupplyId): string {
  return iconUrl(SUPPLY_ICON_KEY[id]);
}

/** 인벤토리에 들어 있는 임의의 아이템 id 에 대한 아이콘 */
export function itemIcon(itemId: string): string {
  const seedSpecies = itemId.startsWith('seed_') ? speciesOfSeed(itemId) : null;
  if (seedSpecies) return seedIcon(seedSpecies);
  if (itemId in SUPPLIES) return supplyIcon(itemId as SupplyId);
  if (itemId in ASSETS.crops) return iconUrl(ASSETS.crops[itemId as SellableId]);
  return furnitureIcon(itemId);
}

/** 인벤토리 아이템 이름 */
export function itemName(itemId: string): string {
  const seedSpecies = itemId.startsWith('seed_') ? speciesOfSeed(itemId) : null;
  if (seedSpecies) return TREE_SPECIES[seedSpecies].seedName;
  if (itemId in SUPPLIES) return SUPPLIES[itemId as SupplyId].name;
  if (itemId in SELLABLE_NAME) return SELLABLE_NAME[itemId as SellableId];
  return FURNITURE_BY_ID[itemId]?.name ?? itemId;
}

/** 인벤토리 아이템 분류 */
export function itemCategory(itemId: string): 'seed' | 'harvest' | 'supply' | 'furniture' {
  if (itemId.startsWith('seed_')) return 'seed';
  if (itemId in SUPPLIES) return 'supply';
  if (itemId in SELLABLE_NAME) return 'harvest';
  return 'furniture';
}

/** 캐릭터 고르기용 미리보기. 서 있는 자세 첫 프레임만 잘라 쓴다. */
export function characterIcon(id: CharacterId): string {
  const key = 'preview_character_' + id;
  const cached = cache.get(key);
  if (cached) return cached;
  const url = buildCharacterPreview(id).canvas.toDataURL('image/png');
  cache.set(key, url);
  return url;
}
