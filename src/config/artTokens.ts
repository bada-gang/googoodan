/**
 * 아트 디렉션 토큰. ART_DIRECTION.md 의 규칙을 코드로 고정한 단일 소스.
 * placeholder 아트와 React UI가 같은 팔레트/규칙을 공유하도록 여기서만 색을 정의한다. (명세 39, 40, 49, 50, 66)
 */

/** 광원은 항상 왼쪽 위, 그림자는 오른쪽 아래. (명세 50) */
export const LIGHT_DIRECTION = { x: -0.55, y: -0.83 } as const;

/** 외곽선 규칙: 굵기는 오브젝트 크기와 무관하게 3단계만 사용한다. */
export const OUTLINE = {
  thin: 2,
  base: 3,
  bold: 4,
} as const;

/**
 * 기본 팔레트. 밝고 따뜻한 색만 사용하고, 강한 채도는 상호작용/보상에만 쓴다. (명세 49)
 */
export const PALETTE = {
  // 하늘 · 배경
  skyTop: '#bfe6f5',
  skyBottom: '#e8f6fb',
  cloud: '#ffffff',
  farHill: '#b9dcb2',
  farHillShade: '#a3cd9c',
  midHill: '#9ecf93',
  farTree: '#8bc48a',
  farTreeShade: '#77b177',

  // 땅
  grass: '#a8d66f',
  grassLight: '#bde184',
  grassShade: '#8bbd58',
  soil: '#a9764c',
  soilLight: '#bd8b5e',
  soilShade: '#8b5e3a',
  path: '#e3cfa4',
  pathShade: '#cbb488',

  // 나무
  trunk: '#a3714a',
  trunkShade: '#84593a',
  leaf: '#6fbf6a',
  leafLight: '#8ed486',
  leafShade: '#529c50',

  // 열매
  apple: '#e8524a',
  appleLight: '#f47c6f',
  orange: '#f2953a',
  orangeLight: '#ffb463',
  peach: '#f7a3a0',
  peachLight: '#ffc3bd',
  cherry: '#d1385c',
  cherryLight: '#e4577a',

  // 건물
  wall: '#f7e6cd',
  wallShade: '#e6cfae',
  roof: '#e07f63',
  roofShade: '#c26449',
  wood: '#c08a52',
  woodDark: '#9a6a3c',
  woodLight: '#d8a973',
  window: '#bfe4ef',
  windowLight: '#e2f4fa',

  // 동물
  chicken: '#fdfaf2',
  chickenShade: '#e8e0cd',
  chickenComb: '#e8524a',
  beak: '#f4b942',
  sheep: '#fbf7ef',
  sheepShade: '#e4ded0',
  sheepSkin: '#d8b79b',
  cow: '#fdfbf6',
  cowSpot: '#5c5148',
  cowUdder: '#f4b1ae',

  // 캐릭터
  skin: '#f6d3ae',
  skinShade: '#e0b78e',
  hair: '#6b4632',
  hairLight: '#835a41',
  shirt: '#f3c74f',
  shirtShade: '#d7a833',
  pants: '#c04a44',
  pantsShade: '#9d3a35',
  shoe: '#7a4f3a',

  // 공통
  outline: '#4a3a2f',
  outlineSoft: '#6a5445',
  shadow: 'rgba(74, 58, 47, 0.22)',
  cream: '#fff6e2',
  creamShade: '#f0e0c4',
  gold: '#f6c453',
  goldShade: '#dba63a',
  star: '#ffe07d',
  accentPink: '#f6a8bd',
  accentMint: '#8fd8c4',
  accentBlue: '#7fb8e6',
  accentPurple: '#b8a0e0',
} as const;

export type PaletteKey = keyof typeof PALETTE;

/**
 * 기준 크기 (논리 해상도 1280x800 기준, 픽셀). (명세 66, 67)
 * 가구는 실제 비율보다 약간 크게 만든다. (명세 51)
 */
export const BASE_SIZE = {
  playerHeight: 132,
  playerHeadRatio: 0.4, // 머리 : 몸 = 1 : 1.5 (명세 42)
  chicken: 62,
  sheep: 86,
  cow: 116,
  treeMature: 220,
  furnitureUnit: 96,
  houseWidth: 360,
} as const;

/** 단순 명암 2~3단계. (명세 50) */
export const SHADE_STEPS = 3;
