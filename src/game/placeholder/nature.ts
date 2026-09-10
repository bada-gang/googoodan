/**
 * placeholder 자연물 아트: 나무 5단계, 수확물, 배경 레이어. (임시 에셋)
 * 성장 단계는 크기만이 아니라 형태가 달라져야 한다. (명세 46)
 */
import { OUTLINE, PALETTE } from '@/config/artTokens';
import type { TreeSpeciesId, TreeStage } from '@/types/game';
import {
  alpha,
  circle,
  darken,
  ellipse,
  frame,
  grassBlade,
  groundShadow,
  leaf,
  lighten,
  makeSheet,
  paint,
  puffMass,
  roundRect,
  star,
  verticalGradient,
  type Ctx,
  type Sheet,
} from './draw';

export const TREE_FRAME = { width: 260, height: 300 };
export const ICON_SIZE = 72;

const FRUIT_COLOR: Record<TreeSpeciesId, { main: string; light: string }> = {
  apple: { main: PALETTE.apple, light: PALETTE.appleLight },
  orange: { main: PALETTE.orange, light: PALETTE.orangeLight },
  peach: { main: PALETTE.peach, light: PALETTE.peachLight },
  cherry: { main: PALETTE.cherry, light: PALETTE.cherryLight },
  grape: { main: '#8f6fc4', light: '#ab90d8' },
  persimmon: { main: '#ea8034', light: '#f7a865' },
};

/** 잎 색은 종류마다 확실히 다르게 둔다. 열매가 없어도 구분되어야 한다. (요청 8) */
const LEAF_TONE: Record<TreeSpeciesId, string> = {
  apple: '#6fbf6a',
  orange: '#9ac95a',
  peach: '#7fc9a0',
  cherry: '#4fa85f',
  grape: '#8aa84e',
  persimmon: '#4f9a55',
};

/**
 * 종류별 나무 형태. 잎 색만으로는 부족해서 실루엣도 다르게 만든다. (요청 8)
 * canopy 는 [줄기 중심에서의 x, 바닥에서의 y(위가 음수), 반지름].
 */
interface TreeForm {
  trunkHeight: number;
  trunkWidth: number;
  canopy: [number, number, number][];
}

const TREE_FORM: Record<TreeSpeciesId, TreeForm> = {
  // 둥글고 넉넉한 수관
  apple: {
    trunkHeight: 128,
    trunkWidth: 40,
    canopy: [[-4, -186, 62], [-62, -150, 46], [58, -156, 48], [-26, -128, 40], [30, -126, 38]],
  },
  // 위로 길쭉한 수관
  orange: {
    trunkHeight: 140,
    trunkWidth: 34,
    canopy: [[0, -212, 50], [-40, -172, 44], [40, -176, 44], [0, -142, 48], [0, -112, 38]],
  },
  // 옆으로 넓고 낮은 수관
  peach: {
    trunkHeight: 96,
    trunkWidth: 44,
    canopy: [[0, -160, 58], [-72, -138, 48], [72, -140, 48], [-36, -110, 40], [38, -108, 40]],
  },
  // 위로 솟은 두 갈래
  cherry: {
    trunkHeight: 118,
    trunkWidth: 32,
    canopy: [[-48, -202, 44], [48, -198, 44], [0, -158, 46], [-28, -128, 34], [30, -126, 34]],
  },
  // 낮게 퍼진 덩굴 시렁
  grape: {
    trunkHeight: 78,
    trunkWidth: 30,
    canopy: [[-24, -136, 50], [24, -136, 50], [-74, -114, 44], [74, -114, 44], [0, -100, 40]],
  },
  // 넓고 납작한 수관
  persimmon: {
    trunkHeight: 108,
    trunkWidth: 46,
    canopy: [[0, -168, 56], [-66, -150, 50], [66, -152, 50], [-30, -118, 42], [32, -116, 42]],
  },
};

function soilMound(ctx: Ctx, cx: number, baseY: number, w = 74): void {
  ellipse(ctx, cx, baseY, w / 2, w / 5, { fill: PALETTE.soil, lineWidth: OUTLINE.base });
  ctx.save();
  ctx.globalAlpha = 0.55;
  ellipse(ctx, cx - w * 0.12, baseY - 3, w * 0.28, w * 0.09, {
    fill: PALETTE.soilLight,
    lineWidth: 0,
  });
  ctx.restore();
}

function trunk(ctx: Ctx, cx: number, baseY: number, height: number, width: number): void {
  ctx.beginPath();
  ctx.moveTo(cx - width / 2 - 5, baseY);
  ctx.quadraticCurveTo(cx - width / 2, baseY - height * 0.6, cx - width * 0.35, baseY - height);
  ctx.lineTo(cx + width * 0.35, baseY - height);
  ctx.quadraticCurveTo(cx + width / 2, baseY - height * 0.6, cx + width / 2 + 5, baseY);
  ctx.closePath();
  paint(ctx, { fill: PALETTE.trunk, lineWidth: OUTLINE.base });
  ctx.save();
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = PALETTE.trunkShade;
  ctx.beginPath();
  ctx.moveTo(cx + width * 0.06, baseY);
  ctx.quadraticCurveTo(cx + width * 0.3, baseY - height * 0.6, cx + width * 0.3, baseY - height);
  ctx.lineTo(cx + width * 0.35, baseY - height);
  ctx.quadraticCurveTo(cx + width / 2, baseY - height * 0.6, cx + width / 2 + 5, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function branch(ctx: Ctx, x: number, y: number, dx: number, dy: number): void {
  ctx.strokeStyle = PALETTE.outline;
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + dx * 0.5, y + dy * 0.2, x + dx, y + dy);
  ctx.stroke();
  ctx.strokeStyle = PALETTE.trunk;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + dx * 0.5, y + dy * 0.2, x + dx, y + dy);
  ctx.stroke();
}

function canopy(ctx: Ctx, puffs: [number, number, number][], base: string): void {
  puffMass(ctx, puffs, base, OUTLINE.bold);
}

function fruit(ctx: Ctx, x: number, y: number, species: TreeSpeciesId, r = 12): void {
  const color = FRUIT_COLOR[species];
  ctx.strokeStyle = PALETTE.outline;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x - 2, y - r - 7);
  ctx.stroke();
  if (species === 'cherry') {
    circle(ctx, x - 7, y, r * 0.72, { fill: color.main, lineWidth: OUTLINE.thin });
    circle(ctx, x + 7, y + 3, r * 0.72, { fill: color.main, lineWidth: OUTLINE.thin });
    circle(ctx, x - 9, y - 3, r * 0.22, { fill: color.light, lineWidth: 0 });
    return;
  }

  if (species === 'grape') {
    // 알이 모인 송이 모양
    const beads: [number, number][] = [
      [-r * 0.5, 0],
      [r * 0.5, 0],
      [0, r * 0.35],
      [-r * 0.28, r * 0.85],
      [r * 0.28, r * 0.85],
      [0, r * 1.35],
    ];
    for (const [dx, dy] of beads) {
      circle(ctx, x + dx, y + dy, r * 0.44, { fill: color.main, lineWidth: OUTLINE.thin });
    }
    circle(ctx, x - r * 0.55, y - r * 0.1, r * 0.16, { fill: color.light, lineWidth: 0 });
    return;
  }

  if (species === 'persimmon') {
    // 납작한 감 + 위쪽 꼭지
    ellipse(ctx, x, y + r * 0.1, r * 1.05, r * 0.85, { fill: color.main, lineWidth: OUTLINE.thin });
    ellipse(ctx, x - r * 0.35, y - r * 0.2, r * 0.3, r * 0.2, { fill: color.light, lineWidth: 0 });
    for (let i = 0; i < 4; i += 1) {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      leaf(ctx, x + Math.cos(angle) * r * 0.42, y - r * 0.6 + Math.sin(angle) * r * 0.18, r * 0.42, PALETTE.leafShade, angle);
    }
    return;
  }

  circle(ctx, x, y, r, { fill: color.main, lineWidth: OUTLINE.thin });
  ellipse(ctx, x - r * 0.32, y - r * 0.34, r * 0.28, r * 0.2, { fill: color.light, lineWidth: 0 });
}

function drawTreeStage(ctx: Ctx, species: TreeSpeciesId, stage: TreeStage): void {
  const cx = TREE_FRAME.width / 2;
  const baseY = TREE_FRAME.height - 16;
  const tone = LEAF_TONE[species];

  groundShadow(ctx, cx, baseY + 2, stage === 'seed' ? 30 : 58, 12);
  soilMound(ctx, cx, baseY, stage === 'seed' ? 70 : 88);

  if (stage === 'seed') {
    ellipse(ctx, cx + 2, baseY - 10, 11, 14, {
      fill: darken(FRUIT_COLOR[species].main, 0.25),
      lineWidth: OUTLINE.base,
    });
    ellipse(ctx, cx - 2, baseY - 15, 4, 5, {
      fill: lighten(FRUIT_COLOR[species].main, 0.3),
      lineWidth: 0,
    });
    return;
  }

  if (stage === 'sprout') {
    ctx.strokeStyle = PALETTE.outline;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(cx, baseY - 4);
    ctx.lineTo(cx, baseY - 48);
    ctx.stroke();
    ctx.strokeStyle = PALETTE.leafShade;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(cx, baseY - 4);
    ctx.lineTo(cx, baseY - 48);
    ctx.stroke();
    leaf(ctx, cx - 22, baseY - 44, 22, tone, -0.35);
    leaf(ctx, cx + 22, baseY - 52, 20, lighten(tone, 0.12), 0.3);
    return;
  }

  if (stage === 'sapling') {
    trunk(ctx, cx, baseY - 4, 96, 24);
    branch(ctx, cx - 4, baseY - 78, -30, -18);
    branch(ctx, cx + 4, baseY - 88, 28, -14);
    canopy(
      ctx,
      [
        [cx, baseY - 128, 40],
        [cx - 36, baseY - 108, 30],
        [cx + 36, baseY - 112, 31],
      ],
      tone,
    );
    return;
  }

  // mature / fruiting — 종류마다 줄기 높이와 수관 모양이 다르다. (요청 8)
  const form = TREE_FORM[species];
  trunk(ctx, cx, baseY - 4, form.trunkHeight, form.trunkWidth);
  branch(ctx, cx - 10, baseY - form.trunkHeight * 0.8, -48, -26);
  branch(ctx, cx + 10, baseY - form.trunkHeight * 0.9, 46, -20);

  const puffs = form.canopy.map(
    ([dx, dy, r]) => [cx + dx, baseY + dy, r] as [number, number, number],
  );
  canopy(ctx, puffs, tone);

  if (stage === 'fruiting') {
    // 열매는 각 잎 덩어리 아래쪽에 매단다. 수관 모양이 달라도 자연스럽게 붙는다.
    for (const [x, y, r] of puffs) {
      fruit(ctx, x + r * 0.12, y + r * 0.62, species);
    }
  }
}

export function buildTreeSheet(species: TreeSpeciesId): Sheet {
  const stages: TreeStage[] = ['seed', 'sprout', 'sapling', 'mature', 'fruiting'];
  const sheet = makeSheet(TREE_FRAME.width, TREE_FRAME.height, stages.length);
  stages.forEach((stage, index) => {
    frame(sheet, index, (ctx) => drawTreeStage(ctx, species, stage));
  });
  return sheet;
}

/* ------------------------------- 수확물 아이콘 ------------------------------ */

type CropKey = TreeSpeciesId | 'egg' | 'wool' | 'milk' | 'goatMilk';

function drawCrop(ctx: Ctx, key: CropKey): void {
  const cx = ICON_SIZE / 2;
  const cy = ICON_SIZE / 2 + 3;
  groundShadow(ctx, cx, ICON_SIZE - 8, 20, 5);

  if (key === 'egg') {
    ctx.beginPath();
    ctx.ellipse(cx, cy, 19, 24, 0, 0, Math.PI * 2);
    paint(ctx, { fill: PALETTE.cream, lineWidth: OUTLINE.base });
    ellipse(ctx, cx - 6, cy - 8, 6, 8, { fill: '#ffffff', lineWidth: 0 });
    return;
  }
  if (key === 'wool') {
    const puffs: [number, number, number][] = [
      [cx - 11, cy, 14],
      [cx + 2, cy - 10, 15],
      [cx + 13, cy + 2, 14],
      [cx - 1, cy + 10, 13],
    ];
    for (const [x, y, r] of puffs) circle(ctx, x, y, r, { fill: PALETTE.sheep, lineWidth: OUTLINE.base });
    for (const [x, y, r] of puffs) circle(ctx, x, y, r - 2, { fill: PALETTE.sheep, lineWidth: 0 });
    ctx.save();
    ctx.globalAlpha = 0.4;
    circle(ctx, cx + 8, cy + 8, 10, { fill: PALETTE.sheepShade, lineWidth: 0 });
    ctx.restore();
    return;
  }
  if (key === 'milk' || key === 'goatMilk') {
    // 염소젖은 조금 작은 병에 담아 우유와 구분한다.
    const goat = key === 'goatMilk';
    const w = goat ? 26 : 30;
    const h = goat ? 34 : 40;
    const cap = goat ? PALETTE.accentMint : PALETTE.windowLight;
    roundRect(ctx, cx - w / 2, cy - h / 2, w, h, 7, {
      fill: PALETTE.cream,
      lineWidth: OUTLINE.base,
    });
    roundRect(ctx, cx - w / 2, cy - 4, w, h / 2 + 4, 7, {
      fill: '#ffffff',
      lineWidth: OUTLINE.thin,
    });
    roundRect(ctx, cx - 8, cy - h / 2 - 7, 16, 10, 4, { fill: cap, lineWidth: OUTLINE.thin });
    ellipse(ctx, cx, cy + 6, 8, 6, {
      fill: goat ? PALETTE.accentMint : PALETTE.accentBlue,
      lineWidth: 0,
    });
    return;
  }
  fruit(ctx, cx, cy, key, 21);
}

export function buildCropIcon(key: CropKey): Sheet {
  const sheet = makeSheet(ICON_SIZE, ICON_SIZE, 1);
  frame(sheet, 0, (ctx) => drawCrop(ctx, key));
  return sheet;
}

export function buildSeedBagIcon(species: TreeSpeciesId): Sheet {
  const sheet = makeSheet(ICON_SIZE, ICON_SIZE, 1);
  frame(sheet, 0, (ctx) => {
    const cx = ICON_SIZE / 2;
    groundShadow(ctx, cx, ICON_SIZE - 8, 20, 5);
    ctx.beginPath();
    ctx.moveTo(cx - 20, ICON_SIZE - 12);
    ctx.quadraticCurveTo(cx - 24, 26, cx - 10, 20);
    ctx.lineTo(cx + 10, 20);
    ctx.quadraticCurveTo(cx + 24, 26, cx + 20, ICON_SIZE - 12);
    ctx.closePath();
    paint(ctx, { fill: '#dcc39a', lineWidth: OUTLINE.base });
    ctx.save();
    ctx.globalAlpha = 0.4;
    ellipse(ctx, cx + 9, 46, 9, 16, { fill: darken('#dcc39a', 0.3), lineWidth: 0 });
    ctx.restore();
    roundRect(ctx, cx - 13, 14, 26, 10, 5, { fill: '#c0a77e', lineWidth: OUTLINE.thin });
    circle(ctx, cx, 46, 9, {
      fill: FRUIT_COLOR[species].main,
      lineWidth: OUTLINE.thin,
    });
  });
  return sheet;
}

/* -------------------------------- 배경 레이어 ------------------------------- */

export function buildSky(width: number, height: number): Sheet {
  const sheet = makeSheet(width, height, 1);
  frame(sheet, 0, (ctx) => {
    ctx.fillStyle = verticalGradient(ctx, 0, 0, height, PALETTE.skyTop, PALETTE.skyBottom);
    ctx.fillRect(0, 0, width, height);
  });
  return sheet;
}

/** 좌우가 이어지도록 주기 함수로 그린 언덕 (parallax 타일링용) */
export function buildFarHills(width: number, height: number): Sheet {
  const sheet = makeSheet(width, height, 1);
  frame(sheet, 0, (ctx) => {
    const drawBand = (baseY: number, amp: number, periods: number, color: string) => {
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x += 4) {
        const t = (x / width) * Math.PI * 2 * periods;
        ctx.lineTo(x, baseY - Math.sin(t) * amp - Math.sin(t * 2.3) * amp * 0.3);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    };
    drawBand(height * 0.55, 26, 2, PALETTE.farHillShade);
    drawBand(height * 0.72, 20, 3, PALETTE.farHill);
  });
  return sheet;
}

export function buildTreeLine(width: number, height: number, color: string, count: number): Sheet {
  const sheet = makeSheet(width, height, 1);
  frame(sheet, 0, (ctx) => {
    const baseY = height - 14; // 나무가 서 있는 땅 높이
    const step = width / count;

    for (let i = 0; i <= count; i += 1) {
      const x = i * step;
      // 크기가 같으면 울타리처럼 늘어서 보인다. 높이와 폭을 조금씩 흔든다.
      const wobble = ((i * 37) % 10) / 10;
      const crownR = step * (0.36 + wobble * 0.16);
      const crownCY = baseY - height * (0.40 + wobble * 0.20);

      // 줄기는 잎 아래에서 땅까지만. 예전에는 시트 바닥까지 내려가 기둥처럼 보였다.
      const trunkTop = crownCY + crownR * 0.4;
      ctx.fillStyle = darken(color, 0.24);
      ctx.beginPath();
      ctx.moveTo(x - 4, trunkTop);
      ctx.lineTo(x + 4, trunkTop);
      ctx.lineTo(x + 7, baseY);
      ctx.lineTo(x - 7, baseY);
      ctx.closePath();
      ctx.fill();

      // 아래쪽 퍼프를 한 톤 어둡게 해서 덩어리에 깊이를 준다
      circle(ctx, x - crownR * 0.62, crownCY + crownR * 0.5, crownR * 0.78, {
        fill: darken(color, 0.1),
        lineWidth: 0,
      });
      circle(ctx, x + crownR * 0.62, crownCY + crownR * 0.5, crownR * 0.78, {
        fill: darken(color, 0.1),
        lineWidth: 0,
      });
      circle(ctx, x, crownCY, crownR, { fill: color, lineWidth: 0 });
      // 원 경계가 그대로 보이지 않게 반투명으로 얹는다
      ctx.save();
      ctx.globalAlpha = 0.55;
      ellipse(ctx, x - crownR * 0.26, crownCY - crownR * 0.32, crownR * 0.54, crownR * 0.42, {
        fill: lighten(color, 0.2),
        lineWidth: 0,
      });
      ctx.restore();
    }

    ctx.fillStyle = darken(color, 0.08);
    ctx.fillRect(0, baseY, width, height - baseY);
  });
  return sheet;
}

/** 2.5D 느낌: 윗면(잔디)과 옆면(흙)이 함께 보이는 바닥 타일. (명세 41) */
export function buildGroundTile(width: number, height: number, withPath: boolean): Sheet {
  const sheet = makeSheet(width, height, 1);
  frame(sheet, 0, (ctx) => {
    // 윗면
    ctx.fillStyle = PALETTE.grass;
    ctx.fillRect(0, 0, width, 34);
    ctx.fillStyle = PALETTE.grassLight;
    ctx.fillRect(0, 0, width, 12);
    ctx.fillStyle = PALETTE.grassShade;
    ctx.fillRect(0, 30, width, 6);
    // 옆면(흙)
    ctx.fillStyle = PALETTE.soil;
    ctx.fillRect(0, 36, width, height - 36);
    // 흙 알갱이. 같은 크기 사각형을 규칙적으로 놓으면 눈금자처럼 보인다.
    // 나머지 연산으로 자리를 잡으면 가로 줄로 뭉치므로 해시로 흩뿌린다.
    const scatter = (n: number): number => {
      const s = Math.sin(n * 127.1) * 43758.5453;
      return s - Math.floor(s);
    };
    for (let i = 0; i < 30; i += 1) {
      const px = scatter(i) * width;
      const py = 44 + scatter(i + 100) * (height - 56);
      const r = 3 + scatter(i + 200) * 4;
      ellipse(ctx, px, py, r, r * 0.7, {
        fill: i % 3 === 0 ? PALETTE.soilLight : PALETTE.soilShade,
        lineWidth: 0,
      });
    }
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = PALETTE.soilLight;
    ctx.fillRect(0, 36, width, 7);
    ctx.restore();

    if (withPath) {
      ctx.fillStyle = PALETTE.path;
      ctx.fillRect(0, 0, width, 26);
      ctx.fillStyle = PALETTE.pathShade;
      for (let x = 0; x < width; x += 38) {
        ellipse(ctx, x + 19, 13, 13, 7, { fill: PALETTE.pathShade, lineWidth: 0 });
      }
    } else {
      for (let x = 0; x < width; x += 26) {
        grassBlade(ctx, x + 6, 4, 10, PALETTE.grassShade);
      }
    }
  });
  return sheet;
}

export function buildForeGrass(width: number, height: number): Sheet {
  const sheet = makeSheet(width, height, 1);
  frame(sheet, 0, (ctx) => {
    // 잎 하나하나를 휜 잎사귀로 그린다.
    // 좌우 대칭 삼각형으로 그리면 잔디가 아니라 톱날처럼 보인다.
    const tones = [darken(PALETTE.grass, 0.18), PALETTE.grassShade, darken(PALETTE.grass, 0.04)];

    // 잎이 떠 보이지 않게 뿌리 쪽에 얕은 띠를 깔아 준다
    ctx.fillStyle = PALETTE.grassShade;
    ctx.fillRect(0, height - 7, width, 7);

    for (let i = 0, x = -8; x < width + 12; i += 1, x += 6) {
      const noise = ((i * 37) % 11) / 11; // 0 ~ 0.91
      const h = height * (0.45 + noise * 0.5);
      const lean = (((i * 53) % 7) / 7 - 0.5) * h * 0.55; // 좌우로 눕는 정도
      const base = 5 + noise * 2.5;

      ctx.fillStyle = tones[i % tones.length];
      ctx.beginPath();
      ctx.moveTo(x, height);
      // 바깥쪽 곡선 → 끝점
      ctx.quadraticCurveTo(x + lean * 0.35, height - h * 0.6, x + lean, height - h);
      // 끝점 → 안쪽 곡선으로 되돌아오며 뿌리로
      ctx.quadraticCurveTo(x + lean * 0.5 + base * 0.7, height - h * 0.5, x + base, height);
      ctx.closePath();
      ctx.fill();
    }
  });
  return sheet;
}

export function buildCloud(width: number, height: number, puffs: number): Sheet {
  const sheet = makeSheet(width, height, 1);
  frame(sheet, 0, (ctx) => {
    const cy = height * 0.62;
    for (let i = 0; i < puffs; i += 1) {
      const t = i / (puffs - 1);
      const r = height * (0.3 + Math.sin(t * Math.PI) * 0.22);
      circle(ctx, width * (0.14 + t * 0.72), cy - Math.sin(t * Math.PI) * height * 0.16, r, {
        fill: PALETTE.cloud,
        lineWidth: 0,
      });
    }
    ctx.save();
    ctx.globalAlpha = 0.5;
    ellipse(ctx, width * 0.5, cy + height * 0.2, width * 0.36, height * 0.16, {
      fill: '#e4f1f7',
      lineWidth: 0,
    });
    ctx.restore();
  });
  return sheet;
}

export function buildBush(): Sheet {
  const sheet = makeSheet(140, 96, 1);
  frame(sheet, 0, (ctx) => {
    groundShadow(ctx, 70, 88, 44, 9);
    canopy(
      ctx,
      [
        [56, 56, 30],
        [88, 60, 26],
        [70, 44, 24],
      ],
      PALETTE.leaf,
    );
  });
  return sheet;
}

export function buildFlowerTuft(): Sheet {
  const sheet = makeSheet(120, 80, 1);
  frame(sheet, 0, (ctx) => {
    groundShadow(ctx, 60, 74, 34, 7);
    const colors = [PALETTE.accentPink, PALETTE.gold, '#ffffff'];
    const xs = [30, 60, 90];
    xs.forEach((x, i) => {
      ctx.strokeStyle = PALETTE.leafShade;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x, 72);
      ctx.quadraticCurveTo(x - 4, 56, x, 40 + i * 4);
      ctx.stroke();
      leaf(ctx, x - 9, 58, 9, PALETTE.leaf, -0.4);
      for (let p = 0; p < 5; p += 1) {
        const angle = (p / 5) * Math.PI * 2;
        circle(ctx, x + Math.cos(angle) * 8, 38 + i * 4 + Math.sin(angle) * 8, 6.5, {
          fill: colors[i],
          lineWidth: OUTLINE.thin,
        });
      }
      circle(ctx, x, 38 + i * 4, 5, { fill: PALETTE.gold, lineWidth: OUTLINE.thin });
    });
  });
  return sheet;
}

/** 밭 (씨앗을 심을 자리) */
export function buildSoilPlot(): Sheet {
  const sheet = makeSheet(220, 90, 1);
  frame(sheet, 0, (ctx) => {
    groundShadow(ctx, 110, 76, 88, 12);
    ellipse(ctx, 110, 56, 96, 30, { fill: PALETTE.soil, lineWidth: OUTLINE.bold });
    ctx.save();
    ctx.globalAlpha = 0.45;
    ellipse(ctx, 100, 48, 72, 18, { fill: PALETTE.soilLight, lineWidth: 0 });
    ctx.restore();
    ctx.strokeStyle = alpha(PALETTE.soilShade, 0.7);
    ctx.lineWidth = 5;
    for (const dy of [-8, 2, 12]) {
      ctx.beginPath();
      ctx.moveTo(38, 56 + dy);
      ctx.quadraticCurveTo(110, 50 + dy, 182, 56 + dy);
      ctx.stroke();
    }
  });
  return sheet;
}

/* --------------------------------- 실내 --------------------------------- */

/** 벽지/바닥은 흰색으로 그려서 Phaser tint 로 색을 입힌다. */
/**
 * 벽지 타일.
 *
 * 벽지는 흰 타일에 색(tint)을 곱해 표현하므로, 무늬는 회색으로 그려야 한다.
 * 흰색보다 밝게는 만들 수 없어서 무늬는 항상 바탕보다 어두운 같은 계열로 나온다
 * (카탈로그의 accent 색이 바로 그 관계다).
 */
export function buildRoomWall(pattern: 'plain' | 'star' = 'plain'): Sheet {
  const sheet = makeSheet(256, 256, 1);
  frame(sheet, 0, (ctx) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    for (let x = 0; x < 256; x += 64) ctx.fillRect(x, 0, 3, 256);
    ctx.fillStyle = 'rgba(0,0,0,0.03)';
    for (let y = 0; y < 256; y += 64) ctx.fillRect(0, y, 256, 3);

    if (pattern === 'star') {
      // 타일이 이어 붙으므로 좌표를 256 격자 안에서 고르게 흩는다.
      const spots: [number, number, number][] = [
        [34, 40, 13], [150, 26, 9], [214, 74, 11],
        [78, 108, 10], [188, 150, 13], [30, 176, 9],
        [116, 208, 11], [232, 216, 8], [96, 62, 6],
        [166, 108, 6], [58, 240, 7], [206, 8, 6],
      ];
      for (const [x, y, r] of spots) {
        ctx.save();
        ctx.globalAlpha = 0.13;
        star(ctx, x, y, r, '#000000');
        ctx.restore();
      }
    }
  });
  return sheet;
}

/**
 * 방 바닥 타일. 흰 바탕에 검정/흰색 반투명만 얹는다 —
 * Phaser 가 색을 tint 로 입히므로 여기서 색을 칠하면 두 번 곱해져 탁해진다.
 *
 * 세 바닥이 이름값을 하려면 무늬가 서로 달라야 한다.
 * 색만 바꾸면 "체크 바닥"도 "융단 바닥"도 나무 판자 무늬로 나온다.
 */
/**
 * 타일 높이. 화면에 보이는 바닥(GAME_HEIGHT - GROUND_Y = 140px)보다 커야 한다.
 * 작으면 세로로 한 번 더 이어 붙으면서 윗변 굽도리가 바닥 한가운데에 다시 그어진다.
 */
const FLOOR_TILE_H = 160;

export function buildRoomFloor(pattern: 'plank' | 'check' | 'carpet' = 'plank'): Sheet {
  const h = FLOOR_TILE_H;
  const sheet = makeSheet(256, h, 1);
  frame(sheet, 0, (ctx) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 256, h);

    if (pattern === 'check') {
      // 가로로는 계속 이어 붙으므로 256 이 칸 크기의 배수여야 체크가 어긋나지 않는다.
      const cell = 64;
      ctx.fillStyle = 'rgba(0,0,0,0.13)';
      for (let gy = 0; gy * cell < h; gy += 1) {
        for (let gx = 0; gx < 256 / cell; gx += 1) {
          if ((gx + gy) % 2 === 1) ctx.fillRect(gx * cell, gy * cell, cell, cell);
        }
      }
      // 칸 사이 줄눈
      ctx.fillStyle = 'rgba(0,0,0,0.07)';
      for (let x = 0; x <= 256; x += cell) ctx.fillRect(x - 1, 0, 2, h);
      for (let y = 0; y <= h; y += cell) ctx.fillRect(0, y - 1, 256, 2);
    } else if (pattern === 'carpet') {
      // 촘촘한 씨실·날실. 8px 격자에서 가로실과 세로실을 엇갈리게 놓으면 융단 결처럼 보인다.
      for (let y = 0; y < h; y += 8) {
        for (let x = 0; x < 256; x += 8) {
          const weft = (x / 8 + y / 8) % 2 === 0;
          ctx.fillStyle = weft ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.45)';
          if (weft) ctx.fillRect(x + 1, y + 2, 6, 4);
          else ctx.fillRect(x + 2, y + 1, 4, 6);
        }
      }
    } else {
      // 나무 판자
      ctx.fillStyle = 'rgba(0,0,0,0.09)';
      for (let x = 0; x < 256; x += 52) ctx.fillRect(x, 0, 4, h);
    }

    // 벽과 만나는 윗변 — 세 무늬 모두 같은 자리에 그림자와 굽도리를 둔다
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    ctx.fillRect(0, 0, 256, 5);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(0, 5, 256, 10);
  });
  return sheet;
}

export function buildRoomWindow(): Sheet {
  const sheet = makeSheet(200, 180, 1);
  frame(sheet, 0, (ctx) => {
    roundRect(ctx, 8, 8, 184, 150, 14, { fill: PALETTE.wood, lineWidth: OUTLINE.bold });
    roundRect(ctx, 22, 22, 156, 122, 8, {
      fill: verticalGradient(ctx, 0, 22, 144, PALETTE.windowLight, PALETTE.window),
      lineWidth: OUTLINE.thin,
    });
    ctx.fillStyle = PALETTE.wood;
    ctx.fillRect(96, 22, 10, 122);
    ctx.fillRect(22, 78, 156, 10);
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(36, 138);
    ctx.lineTo(78, 30);
    ctx.lineTo(96, 30);
    ctx.lineTo(54, 138);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // 창틀 아래 선반
    roundRect(ctx, 0, 152, 200, 18, 8, { fill: PALETTE.woodLight, lineWidth: OUTLINE.base });
  });
  return sheet;
}

export function buildRoomDoor(): Sheet {
  const sheet = makeSheet(150, 240, 1);
  frame(sheet, 0, (ctx) => {
    roundRect(ctx, 6, 10, 138, 226, 16, { fill: PALETTE.woodDark, lineWidth: OUTLINE.bold });
    roundRect(ctx, 18, 22, 114, 206, 12, { fill: PALETTE.wood, lineWidth: OUTLINE.thin });
    roundRect(ctx, 34, 40, 82, 74, 8, { fill: darken(PALETTE.wood, 0.1), lineWidth: OUTLINE.thin });
    roundRect(ctx, 34, 128, 82, 74, 8, { fill: darken(PALETTE.wood, 0.1), lineWidth: OUTLINE.thin });
    circle(ctx, 118, 132, 8, { fill: PALETTE.gold, lineWidth: OUTLINE.thin });
  });
  return sheet;
}

export function buildFenceRail(): Sheet {
  const sheet = makeSheet(160, 130, 1);
  frame(sheet, 0, (ctx) => {
    groundShadow(ctx, 80, 122, 62, 8);
    for (const x of [22, 138]) {
      roundRect(ctx, x - 11, 24, 22, 92, 7, { fill: PALETTE.wood, lineWidth: OUTLINE.base });
      ctx.save();
      ctx.globalAlpha = 0.4;
      roundRect(ctx, x + 1, 26, 9, 88, 5, { fill: PALETTE.woodDark, lineWidth: 0 });
      ctx.restore();
    }
    for (const y of [46, 84]) {
      roundRect(ctx, 0, y, 160, 17, 7, { fill: PALETTE.woodLight, lineWidth: OUTLINE.base });
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = PALETTE.woodDark;
      ctx.fillRect(0, y + 11, 160, 6);
      ctx.restore();
    }
  });
  return sheet;
}

export function buildSignpost(): Sheet {
  const sheet = makeSheet(170, 190, 1);
  frame(sheet, 0, (ctx) => {
    groundShadow(ctx, 85, 182, 40, 8);
    roundRect(ctx, 76, 60, 18, 122, 8, { fill: PALETTE.woodDark, lineWidth: OUTLINE.base });
    roundRect(ctx, 10, 22, 150, 66, 14, { fill: PALETTE.woodLight, lineWidth: OUTLINE.bold });
    roundRect(ctx, 22, 33, 126, 44, 9, { fill: PALETTE.cream, lineWidth: OUTLINE.thin });
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = PALETTE.woodDark;
    ctx.fillRect(10, 74, 150, 14);
    ctx.restore();
    // 판은 비워 둔다 — 씬에서 글자를 얹는다 (addSignText)
  });
  return sheet;
}
