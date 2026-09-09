/**
 * placeholder UI 아이콘 · 파티클. (임시 에셋)
 * 이모지 대신 실제로 그린 아이콘을 사용한다. (명세 5, 75-1)
 */
import { OUTLINE, PALETTE } from '@/config/artTokens';
import {
  circle,
  darken,
  ellipse,
  frame,
  lighten,
  makeSheet,
  paint,
  roundRect,
  star,
  type Ctx,
  type Sheet,
} from './draw';

export const UI_ICON = 64;

function coin(ctx: Ctx): void {
  const c = UI_ICON / 2;
  circle(ctx, c, c, 25, { fill: PALETTE.goldShade, lineWidth: OUTLINE.base });
  circle(ctx, c - 1.5, c - 1.5, 23, { fill: PALETTE.gold, lineWidth: 0 });
  circle(ctx, c, c, 16, { fill: lighten(PALETTE.gold, 0.22), lineWidth: OUTLINE.thin });
  ctx.save();
  ctx.globalAlpha = 0.65;
  ellipse(ctx, c - 8, c - 10, 7, 4, { fill: '#ffffff', lineWidth: 0 });
  ctx.restore();
  // 리라의 'ㄹ' 느낌을 주는 단순 기호
  ctx.strokeStyle = PALETTE.goldShade;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(c - 7, c - 8);
  ctx.lineTo(c + 7, c - 8);
  ctx.lineTo(c - 7, c);
  ctx.lineTo(c + 7, c);
  ctx.lineTo(c - 7, c + 8);
  ctx.lineTo(c + 7, c + 8);
  ctx.stroke();
}

function basket(ctx: Ctx): void {
  const c = UI_ICON / 2;
  ctx.strokeStyle = PALETTE.woodDark;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(c, c + 2, 18, Math.PI, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(c - 24, c + 4);
  ctx.lineTo(c + 24, c + 4);
  ctx.lineTo(c + 17, c + 26);
  ctx.lineTo(c - 17, c + 26);
  ctx.closePath();
  paint(ctx, { fill: PALETTE.wood, lineWidth: OUTLINE.base });
  ctx.strokeStyle = PALETTE.woodDark;
  ctx.lineWidth = 3;
  for (const dx of [-10, 0, 10]) {
    ctx.beginPath();
    ctx.moveTo(c + dx, c + 5);
    ctx.lineTo(c + dx * 0.72, c + 25);
    ctx.stroke();
  }
  circle(ctx, c - 8, c + 2, 8, { fill: PALETTE.apple, lineWidth: OUTLINE.thin });
  circle(ctx, c + 8, c + 3, 7, { fill: PALETTE.orange, lineWidth: OUTLINE.thin });
}

function waterCan(ctx: Ctx): void {
  const c = UI_ICON / 2;
  roundRect(ctx, c - 18, c - 8, 30, 28, 8, { fill: PALETTE.accentBlue, lineWidth: OUTLINE.base });
  ctx.strokeStyle = PALETTE.outline;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(c - 4, c - 10, 10, Math.PI, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = darken(PALETTE.accentBlue, 0.2);
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(c - 4, c - 10, 10, Math.PI, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(c + 12, c - 2);
  ctx.lineTo(c + 26, c - 16);
  ctx.lineTo(c + 30, c - 10);
  ctx.lineTo(c + 14, c + 6);
  ctx.closePath();
  paint(ctx, { fill: PALETTE.accentBlue, lineWidth: OUTLINE.thin });
  for (let i = 0; i < 3; i += 1) {
    ellipse(ctx, c + 26 + i * 3, c - 4 + i * 8, 3, 4, { fill: PALETTE.window, lineWidth: 0 });
  }
}

function feedBag(ctx: Ctx): void {
  const c = UI_ICON / 2;
  ctx.beginPath();
  ctx.moveTo(c - 19, c + 24);
  ctx.quadraticCurveTo(c - 23, c - 10, c - 10, c - 14);
  ctx.lineTo(c + 10, c - 14);
  ctx.quadraticCurveTo(c + 23, c - 10, c + 19, c + 24);
  ctx.closePath();
  paint(ctx, { fill: '#dcc39a', lineWidth: OUTLINE.base });
  roundRect(ctx, c - 12, c - 20, 24, 10, 5, { fill: '#c0a77e', lineWidth: OUTLINE.thin });
  for (const [dx, dy] of [
    [-6, 4],
    [4, 0],
    [0, 12],
    [8, 10],
  ]) {
    ellipse(ctx, c + dx, c + dy, 4, 3, { fill: PALETTE.gold, lineWidth: OUTLINE.thin });
  }
}

function chest(ctx: Ctx, open: boolean): void {
  const c = UI_ICON / 2;
  if (open) {
    ctx.save();
    ctx.globalAlpha = 0.85;
    star(ctx, c, c - 20, 12, PALETTE.star);
    star(ctx, c - 16, c - 12, 7, PALETTE.star);
    star(ctx, c + 16, c - 14, 8, PALETTE.star);
    ctx.restore();
  }
  roundRect(ctx, c - 24, c - 2, 48, 26, 7, { fill: PALETTE.wood, lineWidth: OUTLINE.bold });
  ctx.save();
  ctx.globalAlpha = 0.35;
  roundRect(ctx, c + 4, c, 18, 22, 5, { fill: PALETTE.woodDark, lineWidth: 0 });
  ctx.restore();
  ctx.save();
  ctx.translate(c, c - 2);
  if (open) ctx.rotate(-0.55);
  ctx.beginPath();
  ctx.moveTo(-24, 0);
  ctx.quadraticCurveTo(0, -24, 24, 0);
  ctx.closePath();
  paint(ctx, { fill: PALETTE.woodLight, lineWidth: OUTLINE.bold });
  ctx.restore();
  roundRect(ctx, c - 6, c - 4, 12, 16, 4, { fill: PALETTE.gold, lineWidth: OUTLINE.thin });
}

/** 상호작용 가능한 대상 위에 뜨는 표시 */
function marker(ctx: Ctx): void {
  const c = UI_ICON / 2;
  ctx.beginPath();
  ctx.moveTo(c, c + 22);
  ctx.lineTo(c - 15, c - 2);
  ctx.lineTo(c + 15, c - 2);
  ctx.closePath();
  paint(ctx, { fill: PALETTE.gold, lineWidth: OUTLINE.base });
  roundRect(ctx, c - 16, c - 24, 32, 24, 9, { fill: PALETTE.gold, lineWidth: OUTLINE.base });
  ctx.save();
  ctx.globalAlpha = 0.5;
  roundRect(ctx, c - 12, c - 21, 24, 8, 4, { fill: '#ffffff', lineWidth: 0 });
  ctx.restore();
  ctx.fillStyle = PALETTE.outline;
  ctx.fillRect(c - 3, c - 20, 6, 11);
  ctx.fillRect(c - 3, c - 6, 6, 5);
}

const UI_PAINTERS: Record<string, (ctx: Ctx) => void> = {
  coin,
  basket,
  waterCan,
  feedBag,
  chest: (ctx) => chest(ctx, false),
  chestOpen: (ctx) => chest(ctx, true),
  marker,
  star: (ctx) => star(ctx, UI_ICON / 2, UI_ICON / 2, 26, PALETTE.star),
};

export function buildUiIcon(name: keyof typeof UI_PAINTERS | string): Sheet {
  const sheet = makeSheet(UI_ICON, UI_ICON, 1);
  const painter = UI_PAINTERS[name] ?? UI_PAINTERS.star;
  frame(sheet, 0, painter);
  return sheet;
}

/* -------------------------------- 파티클 -------------------------------- */

export const PARTICLE_SIZE = 24;

const PARTICLE_PAINTERS: Record<string, (ctx: Ctx) => void> = {
  star: (ctx) => star(ctx, 12, 12, 11, PALETTE.star),
  sparkle: (ctx) => {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.quadraticCurveTo(13.5, 10.5, 24, 12);
    ctx.quadraticCurveTo(13.5, 13.5, 12, 24);
    ctx.quadraticCurveTo(10.5, 13.5, 0, 12);
    ctx.quadraticCurveTo(10.5, 10.5, 12, 0);
    ctx.closePath();
    ctx.fill();
  },
  soil: (ctx) => circle(ctx, 12, 12, 7, { fill: PALETTE.soilShade, lineWidth: 0 }),
  leaf: (ctx) => {
    ctx.save();
    ctx.translate(12, 12);
    ctx.rotate(0.4);
    ctx.beginPath();
    ctx.moveTo(-9, 0);
    ctx.quadraticCurveTo(0, -8, 9, 0);
    ctx.quadraticCurveTo(0, 8, -9, 0);
    ctx.closePath();
    paint(ctx, { fill: PALETTE.leaf, lineWidth: 0 });
    ctx.restore();
  },
};

export function buildParticle(name: string): Sheet {
  const sheet = makeSheet(PARTICLE_SIZE, PARTICLE_SIZE, 1);
  frame(sheet, 0, PARTICLE_PAINTERS[name] ?? PARTICLE_PAINTERS.sparkle);
  return sheet;
}
