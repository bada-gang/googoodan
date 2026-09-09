/**
 * 논리 해상도와 월드 레이아웃. 실제 태블릿 해상도와 분리한다. (명세 67)
 */

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 800;

/** 4:3 아이패드에서도 잘리면 안 되는 안전 영역 (가로 기준) */
export const SAFE_WIDTH = 1066; // 800 * 4/3
export const SAFE_INSET_X = (GAME_WIDTH - SAFE_WIDTH) / 2;

/** 캐릭터가 서는 바닥 Y */
export const GROUND_Y = 660;

/** HUD가 덮는 상단 높이 (Phaser 쪽에서 중요한 오브젝트를 피하도록) */
export const HUD_TOP = 92;
export const HUD_BOTTOM = 132;

export const WORLD = {
  yard: { width: 3230 },
  home: { width: 1800 },
  town: { width: 2200 },
} as const;

/**
 * 마당 밭 칸 수와 간격.
 * 나무 한 그루가 260px 이라 220 이면 잎이 조금씩 겹친다 (과수원 느낌).
 * 밭 수나 간격을 바꾸면 아래 PEN·TOWN_GATE_X·WORLD.yard 도 함께 조정한다.
 */
export const PLOT_COUNT = 6;
export const PLOT_START_X = 760;
export const PLOT_GAP = 220;

export function plotX(index: number): number {
  return PLOT_START_X + index * PLOT_GAP;
}

/** 동물 우리 영역 (yard 월드 좌표). 마지막 밭 나무가 끝나는 지점 바로 뒤. */
export const PEN = {
  x: 2080,
  width: 744,
};

/** 집 문 위치 (yard) */
export const HOUSE_DOOR_X = 300;
/** 시장으로 나가는 문 위치 (yard 오른쪽 끝) */
export const TOWN_GATE_X = 3064;

/** 집 내부 문 위치 */
export const HOME_EXIT_X = 190;

/** 시장 건물 위치 (TownScene). 가게 사이 간격을 620 으로 일정하게 둔다. */
export const TOWN = {
  gateX: 140,
  seedShopX: 620,
  furnitureShopX: 1240,
  minigameX: 1860,
} as const;
