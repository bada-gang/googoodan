/**
 * placeholder 건물 아트. (임시 에셋)
 * 약간 위에서 내려다보는 2.5D 측면 시점. (명세 41)
 */
import { OUTLINE, PALETTE } from '@/config/artTokens';
import {
  alpha,
  circle,
  darken,
  ellipse,
  frame,
  groundShadow,
  lighten,
  makeSheet,
  paint,
  roundRect,
  star,
  verticalGradient,
  type Ctx,
  type Sheet,
} from './draw';

/**
 * 창가 화분. (cx = 창문 중심, topY = 화분 윗면)
 *
 * 잎만 그리면 벽에 초록 얼룩이 떠 있는 것처럼 보인다.
 * 담는 그릇이 있어야 "화분"으로 읽힌다.
 */
function windowBox(ctx: Ctx, cx: number, topY: number): void {
  const w = 60;
  const h = 20;

  // 잎 — 화분 뒤쪽에서 먼저 그려 테두리 위로 넘치게 한다
  const clumps: [number, number, number][] = [
    [cx - 20, topY - 6, 12],
    [cx - 2, topY - 11, 14],
    [cx + 19, topY - 7, 12],
  ];
  for (const [x, y, r] of clumps) {
    ellipse(ctx, x, y, r, r * 0.78, { fill: PALETTE.leaf, lineWidth: OUTLINE.thin });
  }
  ctx.save();
  ctx.globalAlpha = 0.55;
  for (const [x, y, r] of clumps) {
    ellipse(ctx, x - r * 0.25, y - r * 0.3, r * 0.5, r * 0.32, {
      fill: PALETTE.leafLight,
      lineWidth: 0,
    });
  }
  ctx.restore();

  // 작은 꽃 두 송이
  circle(ctx, cx - 13, topY - 13, 4, { fill: PALETTE.accentPink, lineWidth: OUTLINE.thin });
  circle(ctx, cx + 11, topY - 15, 4, { fill: PALETTE.gold, lineWidth: OUTLINE.thin });

  // 나무 화분
  roundRect(ctx, cx - w / 2, topY, w, h, 5, {
    fill: PALETTE.wood,
    lineWidth: OUTLINE.base,
  });
  ctx.save();
  ctx.globalAlpha = 0.45;
  roundRect(ctx, cx - w / 2 + 2, topY + h * 0.5, w - 4, h * 0.45, 4, {
    fill: darken(PALETTE.wood, 0.3),
    lineWidth: 0,
  });
  ctx.restore();
}

/** 묶어 놓은 짚단. 그냥 타원이면 노란 얼룩으로만 보인다. */
function hayBale(ctx: Ctx, cx: number, baseY: number): void {
  const w = 84;
  const h = 52;
  roundRect(ctx, cx - w / 2, baseY - h, w, h, 16, {
    fill: PALETTE.gold,
    lineWidth: OUTLINE.base,
  });
  // 짚 결
  ctx.save();
  ctx.beginPath();
  roundRect(ctx, cx - w / 2, baseY - h, w, h, 16, { lineWidth: 0 });
  ctx.clip();
  ctx.strokeStyle = darken(PALETTE.gold, 0.2);
  ctx.lineWidth = 2;
  for (let i = -1; i < 7; i += 1) {
    const y = baseY - h + 7 + i * 8;
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, y);
    ctx.lineTo(cx + w / 2, y - 4);
    ctx.stroke();
  }
  ctx.fillStyle = alpha(PALETTE.goldShade, 0.35);
  ctx.fillRect(cx + w * 0.12, baseY - h, w * 0.4, h);
  ctx.restore();
  // 묶은 끈 두 줄
  ctx.strokeStyle = darken(PALETTE.wood, 0.15);
  ctx.lineWidth = 4;
  for (const dx of [-w * 0.2, w * 0.2]) {
    ctx.beginPath();
    ctx.moveTo(cx + dx, baseY - h + 3);
    ctx.lineTo(cx + dx, baseY - 3);
    ctx.stroke();
  }
}

function roof(ctx: Ctx, x: number, y: number, w: number, h: number, color: string): void {
  ctx.beginPath();
  ctx.moveTo(x - 18, y + h);
  ctx.lineTo(x + w * 0.5, y);
  ctx.lineTo(x + w + 18, y + h);
  ctx.closePath();
  paint(ctx, { fill: color, lineWidth: OUTLINE.bold });
  // 오른쪽 면 그늘
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = darken(color, 0.3);
  ctx.beginPath();
  ctx.moveTo(x + w * 0.5, y);
  ctx.lineTo(x + w + 18, y + h);
  ctx.lineTo(x + w * 0.5, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // 처마
  roundRect(ctx, x - 22, y + h - 6, w + 44, 16, 8, {
    fill: lighten(color, 0.18),
    lineWidth: OUTLINE.base,
  });
}

function window(ctx: Ctx, cx: number, cy: number, w: number, h: number): void {
  roundRect(ctx, cx - w / 2, cy - h / 2, w, h, 8, {
    fill: PALETTE.wood,
    lineWidth: OUTLINE.base,
  });
  roundRect(ctx, cx - w / 2 + 7, cy - h / 2 + 7, w - 14, h - 14, 5, {
    fill: verticalGradient(ctx, 0, cy - h / 2, cy + h / 2, PALETTE.windowLight, PALETTE.window),
    lineWidth: 0,
  });
  ctx.fillStyle = PALETTE.wood;
  ctx.fillRect(cx - 3, cy - h / 2 + 7, 6, h - 14);
  ctx.fillRect(cx - w / 2 + 7, cy - 3, w - 14, 6);
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(cx - w / 2 + 12, cy + h / 2 - 10);
  ctx.lineTo(cx - 2, cy - h / 2 + 10);
  ctx.lineTo(cx + 8, cy - h / 2 + 10);
  ctx.lineTo(cx - w / 2 + 22, cy + h / 2 - 10);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function door(ctx: Ctx, cx: number, baseY: number, w: number, h: number): void {
  roundRect(ctx, cx - w / 2, baseY - h, w, h, 14, {
    fill: PALETTE.woodDark,
    lineWidth: OUTLINE.bold,
  });
  roundRect(ctx, cx - w / 2 + 8, baseY - h + 8, w - 16, h - 8, 10, {
    fill: PALETTE.wood,
    lineWidth: 0,
  });
  circle(ctx, cx + w / 2 - 16, baseY - h / 2, 6, { fill: PALETTE.gold, lineWidth: OUTLINE.thin });
  // 문 앞 계단
  roundRect(ctx, cx - w / 2 - 12, baseY - 4, w + 24, 14, 6, {
    fill: PALETTE.path,
    lineWidth: OUTLINE.base,
  });
}

export const HOUSE_FRAME = { width: 420, height: 360 };

export function buildHouse(): Sheet {
  const sheet = makeSheet(HOUSE_FRAME.width, HOUSE_FRAME.height, 1);
  frame(sheet, 0, (ctx) => {
    const baseY = 344;
    groundShadow(ctx, 210, baseY + 4, 176, 20);
    // 굴뚝
    roundRect(ctx, 292, 44, 42, 78, 8, { fill: PALETTE.roofShade, lineWidth: OUTLINE.base });
    roundRect(ctx, 286, 36, 54, 20, 8, { fill: PALETTE.roof, lineWidth: OUTLINE.base });
    // 벽
    roundRect(ctx, 48, 150, 324, 194, 18, { fill: PALETTE.wall, lineWidth: OUTLINE.bold });
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = PALETTE.wallShade;
    ctx.fillRect(280, 156, 88, 186);
    ctx.restore();
    roof(ctx, 48, 40, 324, 116, PALETTE.roof);
    window(ctx, 122, 216, 84, 74);
    window(ctx, 300, 216, 84, 74);
    door(ctx, 210, baseY, 92, 130);
    windowBox(ctx, 122, 258);
    windowBox(ctx, 300, 258);
  });
  return sheet;
}

export type ShopKind = 'seed' | 'furniture' | 'market' | 'minigame';

const SHOP_STYLE: Record<ShopKind, { roof: string; wall: string; awning: string }> = {
  seed: { roof: '#7fbf70', wall: PALETTE.cream, awning: '#9fd48f' },
  furniture: { roof: '#d79a5c', wall: PALETTE.wall, awning: '#e8b982' },
  market: { roof: '#e0806a', wall: PALETTE.cream, awning: '#f2a58c' },
  minigame: { roof: '#8fa8e0', wall: PALETTE.wall, awning: '#aabcea' },
};

function shopIcon(ctx: Ctx, kind: ShopKind, cx: number, cy: number): void {
  switch (kind) {
    case 'seed': {
      ctx.strokeStyle = PALETTE.leafShade;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(cx, cy + 16);
      ctx.lineTo(cx, cy - 6);
      ctx.stroke();
      ellipse(ctx, cx - 13, cy - 8, 13, 8, { fill: PALETTE.leaf, lineWidth: OUTLINE.thin });
      ellipse(ctx, cx + 13, cy - 14, 12, 7, { fill: PALETTE.leafLight, lineWidth: OUTLINE.thin });
      break;
    }
    case 'furniture': {
      roundRect(ctx, cx - 18, cy - 4, 36, 20, 5, { fill: PALETTE.wood, lineWidth: OUTLINE.thin });
      roundRect(ctx, cx - 18, cy - 22, 10, 22, 4, { fill: PALETTE.woodDark, lineWidth: OUTLINE.thin });
      ctx.fillStyle = PALETTE.woodDark;
      ctx.fillRect(cx - 15, cy + 16, 6, 10);
      ctx.fillRect(cx + 9, cy + 16, 6, 10);
      break;
    }
    case 'market': {
      circle(ctx, cx, cy + 2, 18, { fill: PALETTE.gold, lineWidth: OUTLINE.base });
      circle(ctx, cx, cy + 2, 11, { fill: PALETTE.goldShade, lineWidth: OUTLINE.thin });
      break;
    }
    case 'minigame':
    default:
      star(ctx, cx, cy + 2, 20, PALETTE.star);
      break;
  }
}

export const SHOP_FRAME = { width: 340, height: 330 };

export function buildShop(kind: ShopKind): Sheet {
  const style = SHOP_STYLE[kind];
  const sheet = makeSheet(SHOP_FRAME.width, SHOP_FRAME.height, 1);
  frame(sheet, 0, (ctx) => {
    const baseY = 314;
    groundShadow(ctx, 170, baseY + 4, 148, 18);
    roundRect(ctx, 34, 130, 272, 184, 16, { fill: style.wall, lineWidth: OUTLINE.bold });
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = PALETTE.wallShade;
    ctx.fillRect(226, 136, 74, 176);
    ctx.restore();
    roof(ctx, 34, 34, 272, 100, style.roof);

    // 차양 (줄무늬)
    ctx.save();
    roundRect(ctx, 26, 150, 288, 40, 12, { fill: style.awning, lineWidth: OUTLINE.base });
    ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let x = 26; x < 314; x += 48) ctx.fillRect(x, 150, 24, 40);
    ctx.restore();
    roundRect(ctx, 26, 150, 288, 40, 12, { lineWidth: OUTLINE.base });

    // 간판 — 차양 위에 건다.
    // 예전에는 y196~258 에 있었는데 바로 뒤에 그리는 문(y196~314)이 한가운데를 덮어
    // 가게를 구분하는 아이콘이 아예 보이지 않았다. 네 가게가 지붕 색만 다른 같은 건물이었다.
    roundRect(ctx, 116, 142, 108, 54, 12, { fill: PALETTE.woodLight, lineWidth: OUTLINE.bold });
    roundRect(ctx, 124, 149, 92, 40, 8, { fill: PALETTE.cream, lineWidth: OUTLINE.thin });
    shopIcon(ctx, kind, 170, 169);

    door(ctx, 170, baseY, 88, 118);
    window(ctx, 72, 250, 56, 52);
    window(ctx, 268, 250, 56, 52);
  });
  return sheet;
}

export const BARN_FRAME = { width: 380, height: 330 };

export function buildBarn(): Sheet {
  const sheet = makeSheet(BARN_FRAME.width, BARN_FRAME.height, 1);
  frame(sheet, 0, (ctx) => {
    const baseY = 316;
    groundShadow(ctx, 190, baseY + 4, 160, 18);
    roundRect(ctx, 44, 150, 292, 166, 14, { fill: '#e79a7d', lineWidth: OUTLINE.bold });
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = darken('#e79a7d', 0.35);
    ctx.fillRect(258, 156, 76, 158);
    ctx.restore();
    roof(ctx, 44, 44, 292, 112, '#c9634c');

    // 큰 문
    roundRect(ctx, 118, 186, 144, 130, 12, { fill: PALETTE.woodDark, lineWidth: OUTLINE.bold });
    roundRect(ctx, 128, 196, 124, 120, 8, { fill: PALETTE.wood, lineWidth: 0 });
    // 문에 덧댄 나무. 흰색으로 그으면 판자가 아니라 스티커처럼 보인다.
    ctx.lineCap = 'butt';
    for (const [x1, y1, x2, y2] of [
      [130, 198, 250, 314],
      [250, 198, 130, 314],
    ] as const) {
      ctx.strokeStyle = PALETTE.woodDark;
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.strokeStyle = PALETTE.woodLight;
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.lineCap = 'round';
    // 세로 판자 이음선
    ctx.strokeStyle = darken(PALETTE.wood, 0.22);
    ctx.lineWidth = 2;
    for (let px = 156; px < 250; px += 31) {
      ctx.beginPath();
      ctx.moveTo(px, 198);
      ctx.lineTo(px, 314);
      ctx.stroke();
    }
    // 위쪽 창
    roundRect(ctx, 160, 112, 60, 46, 8, { fill: PALETTE.cream, lineWidth: OUTLINE.base });
    ctx.fillStyle = PALETTE.wood;
    ctx.fillRect(186, 116, 8, 38);
    hayBale(ctx, 322, 300);
  });
  return sheet;
}

export const PEN_FRAME = { width: 240, height: 140 };

/** 동물 먹이통 */
export function buildPen(): Sheet {
  const sheet = makeSheet(PEN_FRAME.width, PEN_FRAME.height, 1);
  frame(sheet, 0, (ctx) => {
    groundShadow(ctx, 120, 128, 88, 12);
    // 다리
    roundRect(ctx, 40, 92, 18, 34, 6, { fill: PALETTE.woodDark, lineWidth: OUTLINE.base });
    roundRect(ctx, 182, 92, 18, 34, 6, { fill: PALETTE.woodDark, lineWidth: OUTLINE.base });
    // 여물통
    ctx.beginPath();
    ctx.moveTo(22, 48);
    ctx.lineTo(218, 48);
    ctx.lineTo(196, 106);
    ctx.lineTo(44, 106);
    ctx.closePath();
    paint(ctx, { fill: PALETTE.wood, lineWidth: OUTLINE.bold });
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = PALETTE.woodDark;
    ctx.beginPath();
    ctx.moveTo(130, 48);
    ctx.lineTo(218, 48);
    ctx.lineTo(196, 106);
    ctx.lineTo(130, 106);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // 건초
    ellipse(ctx, 92, 50, 46, 16, { fill: PALETTE.gold, lineWidth: OUTLINE.base });
    ellipse(ctx, 146, 52, 34, 13, { fill: lighten(PALETTE.gold, 0.2), lineWidth: OUTLINE.thin });
  });
  return sheet;
}
