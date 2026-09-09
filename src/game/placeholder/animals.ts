/**
 * placeholder 동물 아트. (임시 에셋 — Phase 7 에서 교체)
 * 실루엣을 뚜렷하게 구분하고, idle 에서도 반드시 움직인다. (명세 44, 45)
 */
import { OUTLINE, PALETTE } from '@/config/artTokens';
import type { AnimalSpeciesId } from '@/types/game';
import {
  circle,
  darken,
  ellipse,
  face,
  frame,
  groundShadow,
  lighten,
  makeSheet,
  paint,
  puffMass,
  roundRect,
  type Ctx,
  type Sheet,
} from './draw';

export type AnimalAnim = 'idle' | 'walk' | 'eat' | 'happy';

export const ANIMAL_FRAME: Record<AnimalSpeciesId, { width: number; height: number }> = {
  chicken: { width: 96, height: 96 },
  goat: { width: 120, height: 112 },
  sheep: { width: 128, height: 112 },
  cow: { width: 160, height: 140 },
};

/** 염소 색. 양(흰 털)과 확실히 구분되도록 갈색 계열로 둔다. */
const GOAT = {
  body: '#d8c6a8',
  shade: '#bda98a',
  horn: '#efe4d0',
  hoof: '#6a5445',
} as const;

interface AnimalPose {
  bob: number;
  legSwing: number;
  /** 고개 숙임 0~1 (먹이 먹기) */
  headDown: number;
  headTurn: number;
  blink: boolean;
  tail: number;
  joy: number;
}

/**
 * 다리 한 쌍. 끝에 발/발굽을 붙인다.
 *
 * 선만 그으면 끝이 뭉툭하게 잘려 다리가 아니라 젓가락으로 보인다.
 * 캐릭터에서 신발을 붙였을 때와 같은 이유다.
 */
function legPair(
  ctx: Ctx,
  x: number,
  y: number,
  length: number,
  swing: number,
  color: string,
  width = 6,
  foot: 'hoof' | 'claw' = 'hoof',
): void {
  for (const [index, sign] of [-1, 1].entries()) {
    const offset = sign * swing * 6;
    const startX = x + index * 12;
    const endX = startX + offset;
    const endY = y + length;
    const shade = index === 0 ? darken(color, 0.15) : color;

    ctx.strokeStyle = PALETTE.outline;
    ctx.lineWidth = width + 3;
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.strokeStyle = shade;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    if (foot === 'claw') {
      // 새 발: 앞으로 두 갈래, 뒤로 한 갈래
      ctx.strokeStyle = darken(color, 0.3);
      ctx.lineWidth = 3;
      for (const toe of [-3.5, 3.5, 7]) {
        ctx.beginPath();
        ctx.moveTo(endX, endY - 1);
        ctx.lineTo(endX + toe, endY + 2.5);
        ctx.stroke();
      }
    } else {
      ellipse(ctx, endX + 1, endY, width * 0.85, width * 0.55, {
        fill: darken(color, 0.38),
        lineWidth: OUTLINE.thin,
      });
    }
  }
}

/**
 * 뿔 하나. 뿌리가 굵고 끝이 뾰족하다.
 *
 * 굵기가 일정한 선으로 그으면 뿔이 아니라 깃털이나 더듬이처럼 보인다.
 * (bx, by) 가 뿌리, (bx+dx, by+dy) 가 끝, bow 는 위로 휘는 정도.
 */
function horn(
  ctx: Ctx,
  bx: number,
  by: number,
  dx: number,
  dy: number,
  thickness: number,
  color: string,
  bow = 14,
): void {
  const tipX = bx + dx;
  const tipY = by + dy;
  ctx.beginPath();
  ctx.moveTo(bx, by - thickness / 2);
  ctx.quadraticCurveTo(bx + dx * 0.5, by - bow - thickness * 0.4, tipX, tipY);
  ctx.quadraticCurveTo(bx + dx * 0.45, by - bow + thickness * 0.5, bx, by + thickness / 2);
  ctx.closePath();
  paint(ctx, { fill: color, lineWidth: OUTLINE.thin });
}

/* -------------------------------- 닭 -------------------------------- */

function drawChicken(ctx: Ctx, pose: AnimalPose): void {
  const groundY = 88;
  groundShadow(ctx, 48, groundY, 24, 6);

  const bodyY = 58 + pose.bob;
  legPair(ctx, 42, bodyY + 12, groundY - bodyY - 12, pose.legSwing, PALETTE.beak, 5, 'claw');

  // 꼬리 — 프레임(96px) 왼쪽 밖으로 나가면 옆 프레임에 번져서
  // 닭 오른쪽에 정체불명의 조각이 붙어 보인다. 안쪽으로 붙여 둔다.
  ctx.save();
  ctx.translate(25, bodyY - 6);
  ctx.rotate(-0.3 + pose.tail * 0.25);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-16, -14, -22, 2);
  ctx.quadraticCurveTo(-12, 2, 0, 10);
  ctx.closePath();
  paint(ctx, { fill: PALETTE.chickenShade, lineWidth: OUTLINE.base });
  ctx.restore();

  // 몸
  ellipse(ctx, 46, bodyY, 26, 21, { fill: PALETTE.chicken, lineWidth: OUTLINE.base });
  ctx.save();
  ctx.globalAlpha = 0.5;
  ellipse(ctx, 54, bodyY + 6, 15, 12, { fill: PALETTE.chickenShade, lineWidth: 0 });
  ctx.restore();
  // 날개
  ellipse(ctx, 48, bodyY + 1, 13, 10, {
    fill: lighten(PALETTE.chickenShade, 0.25),
    lineWidth: OUTLINE.thin,
  });

  // 머리
  const headX = 66 + pose.headTurn * 3;
  const headY = bodyY - 20 + pose.headDown * 26;
  ctx.save();
  ctx.strokeStyle = PALETTE.outline;
  ctx.lineWidth = OUTLINE.base + 5;
  ctx.beginPath();
  ctx.moveTo(56, bodyY - 6);
  ctx.lineTo(headX - 3, headY + 8);
  ctx.stroke();
  ctx.strokeStyle = PALETTE.chicken;
  ctx.lineWidth = OUTLINE.base + 2;
  ctx.beginPath();
  ctx.moveTo(56, bodyY - 6);
  ctx.lineTo(headX - 3, headY + 8);
  ctx.stroke();
  ctx.restore();

  // 벼슬
  ctx.beginPath();
  ctx.moveTo(headX - 8, headY - 9);
  ctx.quadraticCurveTo(headX - 5, headY - 20, headX + 1, headY - 11);
  ctx.quadraticCurveTo(headX + 6, headY - 20, headX + 9, headY - 8);
  ctx.closePath();
  paint(ctx, { fill: PALETTE.chickenComb, lineWidth: OUTLINE.thin });

  circle(ctx, headX, headY, 13, { fill: PALETTE.chicken, lineWidth: OUTLINE.base });
  // 부리
  ctx.beginPath();
  ctx.moveTo(headX + 10, headY);
  ctx.lineTo(headX + 22, headY + 3);
  ctx.lineTo(headX + 10, headY + 7);
  ctx.closePath();
  paint(ctx, { fill: PALETTE.beak, lineWidth: OUTLINE.thin });

  ellipse(ctx, headX + 3, headY - 2, pose.blink ? 4 : 3.4, pose.blink ? 0.9 : 3.8, {
    fill: PALETTE.outline,
    lineWidth: 0,
  });
  if (pose.joy > 0) {
    ctx.save();
    ctx.globalAlpha = 0.6;
    ellipse(ctx, headX - 6, headY + 5, 5, 3, { fill: PALETTE.accentPink, lineWidth: 0 });
    ctx.restore();
  }
}

/* -------------------------------- 양 -------------------------------- */

function drawSheep(ctx: Ctx, pose: AnimalPose): void {
  const groundY = 102;
  groundShadow(ctx, 64, groundY, 36, 8);

  const bodyY = 58 + pose.bob;
  legPair(ctx, 48, bodyY + 22, groundY - bodyY - 22, pose.legSwing, PALETTE.sheepSkin, 8);
  legPair(ctx, 78, bodyY + 22, groundY - bodyY - 22, -pose.legSwing, PALETTE.sheepSkin, 8);

  // 털 뭉치 몸통
  const puffs: [number, number, number][] = [
    [44, bodyY + 2, 20],
    [62, bodyY - 8, 23],
    [82, bodyY + 0, 21],
    [72, bodyY + 14, 19],
    [50, bodyY + 16, 18],
  ];
  // 퍼프마다 칠하면 겹친 원 경계가 그대로 보인다 (나무 잎과 같은 문제)
  puffMass(ctx, puffs, PALETTE.sheep, OUTLINE.base, 0.16);

  // 머리
  const headX = 100;
  const headY = bodyY - 6 + pose.headDown * 30;
  ellipse(ctx, headX, headY, 16, 18, { fill: PALETTE.sheepSkin, lineWidth: OUTLINE.base });
  // 앞머리 털
  circle(ctx, headX - 4, headY - 15, 11, { fill: PALETTE.sheep, lineWidth: OUTLINE.base });
  // 귀
  ellipse(ctx, headX + 14, headY - 6, 8, 5, {
    fill: darken(PALETTE.sheepSkin, 0.12),
    lineWidth: OUTLINE.thin,
  });
  face(ctx, headX + 1, headY + 1, {
    eyeGap: 7,
    eyeR: 3.4,
    blink: pose.blink,
    smile: pose.joy > 0 ? 6 : 3,
    cheek: false,
  });
}

/* ------------------------------- 염소 ------------------------------- */

function drawGoat(ctx: Ctx, pose: AnimalPose): void {
  const groundY = 102;
  groundShadow(ctx, 58, groundY, 32, 7);

  const bodyY = 58 + pose.bob;
  legPair(ctx, 40, bodyY + 18, groundY - bodyY - 18, pose.legSwing, GOAT.hoof, 7);
  legPair(ctx, 68, bodyY + 18, groundY - bodyY - 18, -pose.legSwing, GOAT.hoof, 7);

  // 짧게 선 꼬리
  ctx.save();
  ctx.translate(26, bodyY - 12);
  ctx.rotate(-0.6 + pose.tail * 0.3);
  roundRect(ctx, -5, -14, 10, 18, 5, { fill: GOAT.body, lineWidth: OUTLINE.thin });
  ctx.restore();

  // 몸통 — 양보다 갸름하다
  ellipse(ctx, 56, bodyY, 32, 21, { fill: GOAT.body, lineWidth: OUTLINE.base });
  ctx.save();
  ctx.globalAlpha = 0.45;
  ellipse(ctx, 66, bodyY + 8, 20, 12, { fill: GOAT.shade, lineWidth: 0 });
  ctx.restore();

  // 머리
  const headX = 92;
  const headY = bodyY - 16 + pose.headDown * 34;
  // 목
  ctx.strokeStyle = PALETTE.outline;
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.moveTo(76, bodyY - 6);
  ctx.lineTo(headX - 6, headY + 8);
  ctx.stroke();
  ctx.strokeStyle = GOAT.body;
  ctx.lineWidth = 13;
  ctx.beginPath();
  ctx.moveTo(76, bodyY - 6);
  ctx.lineTo(headX - 6, headY + 8);
  ctx.stroke();

  // 뒤로 휜 뿔. 먼 쪽을 한 톤 어둡게 해서 두 개로 읽히게 한다.
  horn(ctx, headX - 4, headY - 9, -26, -3, 9, darken(GOAT.horn, 0.22), 15);
  horn(ctx, headX - 4, headY - 14, -28, -4, 10, GOAT.horn, 17);

  ellipse(ctx, headX, headY, 17, 15, { fill: GOAT.body, lineWidth: OUTLINE.base });
  // 주둥이
  ellipse(ctx, headX + 12, headY + 5, 11, 9, {
    fill: lighten(GOAT.body, 0.22),
    lineWidth: OUTLINE.thin,
  });
  circle(ctx, headX + 17, headY + 3, 2.2, { fill: PALETTE.outline, lineWidth: 0 });
  // 늘어진 귀
  ellipse(ctx, headX - 12, headY + 2, 11, 6, { fill: GOAT.shade, lineWidth: OUTLINE.thin });
  // 턱수염
  ctx.beginPath();
  ctx.moveTo(headX + 6, headY + 13);
  ctx.quadraticCurveTo(headX + 4, headY + 26, headX + 10, headY + 24);
  ctx.quadraticCurveTo(headX + 12, headY + 16, headX + 12, headY + 12);
  ctx.closePath();
  paint(ctx, { fill: lighten(GOAT.body, 0.3), lineWidth: OUTLINE.thin });

  face(ctx, headX + 1, headY - 2, {
    eyeGap: 7,
    eyeR: 3.2,
    blink: pose.blink,
    smile: pose.joy > 0 ? 5 : 0,
    cheek: pose.joy > 0,
  });
}

/* -------------------------------- 소 -------------------------------- */

function drawCow(ctx: Ctx, pose: AnimalPose): void {
  const groundY = 128;
  groundShadow(ctx, 80, groundY, 46, 10);

  const bodyY = 66 + pose.bob;
  legPair(ctx, 52, bodyY + 26, groundY - bodyY - 26, pose.legSwing, PALETTE.cowSpot, 10);
  legPair(ctx, 96, bodyY + 26, groundY - bodyY - 26, -pose.legSwing, PALETTE.cowSpot, 10);

  // 꼬리
  ctx.save();
  ctx.translate(38, bodyY - 12);
  ctx.rotate(pose.tail * 0.4);
  ctx.strokeStyle = PALETTE.outline;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-14, 12, -10, 32);
  ctx.stroke();
  ctx.strokeStyle = PALETTE.cow;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-14, 12, -10, 32);
  ctx.stroke();
  circle(ctx, -10, 34, 6, { fill: PALETTE.cowSpot, lineWidth: OUTLINE.thin });
  ctx.restore();

  // 몸
  ellipse(ctx, 78, bodyY, 46, 32, { fill: PALETTE.cow, lineWidth: OUTLINE.bold });
  ctx.save();
  ctx.globalAlpha = 0.35;
  ellipse(ctx, 92, bodyY + 12, 28, 18, { fill: darken(PALETTE.cow, 0.2), lineWidth: 0 });
  ctx.restore();
  // 얼룩
  ellipse(ctx, 62, bodyY - 8, 15, 11, { fill: PALETTE.cowSpot, lineWidth: 0 });
  ellipse(ctx, 96, bodyY + 6, 12, 9, { fill: PALETTE.cowSpot, lineWidth: 0 });
  // 젖
  ellipse(ctx, 88, bodyY + 28, 13, 9, { fill: PALETTE.cowUdder, lineWidth: OUTLINE.thin });

  // 머리
  const headX = 126;
  const headY = bodyY - 12 + pose.headDown * 36;
  // 뿔
  for (const dir of [-1, 1]) {
    horn(ctx, headX + dir * 9, headY - 15, dir * 15, -6, 8, PALETTE.cream, 10);
  }
  ellipse(ctx, headX, headY, 22, 21, { fill: PALETTE.cow, lineWidth: OUTLINE.base });
  ellipse(ctx, headX - 12, headY - 8, 9, 7, { fill: PALETTE.cowSpot, lineWidth: 0 });
  // 귀
  ellipse(ctx, headX - 20, headY - 2, 9, 6, { fill: PALETTE.cow, lineWidth: OUTLINE.thin });
  ellipse(ctx, headX + 20, headY - 2, 9, 6, { fill: PALETTE.cow, lineWidth: OUTLINE.thin });
  // 주둥이
  ellipse(ctx, headX + 6, headY + 12, 16, 11, { fill: PALETTE.cowUdder, lineWidth: OUTLINE.thin });
  circle(ctx, headX + 1, headY + 12, 2.6, { fill: PALETTE.outline, lineWidth: 0 });
  circle(ctx, headX + 12, headY + 12, 2.6, { fill: PALETTE.outline, lineWidth: 0 });

  face(ctx, headX + 2, headY - 4, {
    eyeGap: 10,
    eyeR: 4,
    blink: pose.blink,
    smile: 0,
    cheek: pose.joy > 0,
  });
}

const PAINTERS: Record<AnimalSpeciesId, (ctx: Ctx, pose: AnimalPose) => void> = {
  chicken: drawChicken,
  goat: drawGoat,
  sheep: drawSheep,
  cow: drawCow,
};

function poseFor(anim: AnimalAnim, index: number, total: number): AnimalPose {
  const phase = (index / total) * Math.PI * 2;
  switch (anim) {
    case 'walk':
      return {
        bob: Math.abs(Math.sin(phase)) * -2,
        legSwing: Math.sin(phase),
        headDown: 0,
        headTurn: Math.sin(phase) * 0.5,
        blink: false,
        tail: Math.sin(phase),
        joy: 0,
      };
    case 'eat':
      return {
        bob: 0,
        legSwing: 0,
        headDown: index === 0 ? 0.2 : index === 3 ? 0.5 : 1,
        headTurn: 0,
        blink: index === 2,
        tail: Math.sin(phase) * 0.6,
        joy: 0,
      };
    case 'happy':
      return {
        bob: [-2, -8, -12, -6][index] ?? 0,
        legSwing: 0.4,
        headDown: 0,
        headTurn: 0.4,
        blink: index === 2,
        tail: 1,
        joy: 1,
      };
    case 'idle':
    default:
      return {
        bob: [0, -1, -2, -1][index] ?? 0,
        legSwing: 0,
        headDown: 0,
        headTurn: index === 1 ? 0.6 : index === 3 ? -0.4 : 0,
        blink: index === 2,
        tail: Math.sin(phase) * 0.5,
        joy: 0,
      };
  }
}

export function buildAnimalSheet(species: AnimalSpeciesId, anim: AnimalAnim): Sheet {
  const size = ANIMAL_FRAME[species];
  const frames = 4;
  const sheet = makeSheet(size.width, size.height, frames);
  const painter = PAINTERS[species];
  for (let i = 0; i < frames; i += 1) {
    frame(sheet, i, (ctx) => painter(ctx, poseFor(anim, i, frames)));
  }
  return sheet;
}
