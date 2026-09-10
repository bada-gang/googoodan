/**
 * 아이들이 아는 캐릭터들 — 구구 마을 화풍(굵은 외곽선·단순 명암)으로 다시 그린 것.
 *
 * 선생님이 반 아이들이 고를 수 있게 요청한 캐릭터다. 비율·걸음걸이는
 * body.ts 의 자세 표를 그대로 쓰고, 몸통과 머리만 캐릭터마다 새로 그린다.
 * 그래서 넷 다 같은 마을을 같은 걸음으로 걸어 다닌다.
 *
 * 되돌리려면 이 파일을 지우고 CharacterId · CHARACTER_IDS · ASSETS.characters ·
 * CHARACTERS 에서 네 id 를 빼면 된다. 이미 고른 학생은 characterOf() 가 남자아이로 돌린다.
 *
 * 좌표 규칙: 프레임 120×160, 가로 중심 cx=60, 발바닥이 프레임 맨 아래(≈157)에 닿는다.
 * (스프라이트 origin 이 (0.5, 1) 이라 프레임 아래가 곧 땅이다.)
 */
import { OUTLINE, PALETTE } from '@/config/artTokens';
import {
  backLegAngle,
  frontLegAngle,
  liftedLength,
  limb,
  CHAR_CX as cx,
  type PlayerPose,
} from './body';
import { circle, darken, ellipse, groundShadow, paint, type Ctx } from './draw';

/** 캐릭터 고유색. 팔레트에 넣지 않는다 — 마을 전체가 쓰는 색이 아니다. */
const C = {
  puccaRed: '#d6353a',
  puccaRedShade: '#8f1f24',
  puccaGold: '#f6c453',
  puccaHair: '#2b241f',
  puccaSkin: '#f9dfc0',
  puccaShoe: '#2b241f',
  puccaCheek: '#f0868c',

  danbiPink: '#ef7fa8',
  danbiPinkShade: '#b8446a',
  danbiRibbon: '#f45b93',
  danbiHair: '#c1874f',
  danbiHairLine: 'rgba(122, 80, 42, 0.5)',
  danbiSkin: '#fbe0c4',
  danbiFace: '#fdead2',
  danbiCheek: '#f4736f',
  danbiIris: '#241f1c',
  danbiEyeWhite: '#fffdf7',
  danbiMouth: '#c8434a',

  doolyGreen: '#6cc36a',
  doolyGreenShade: '#3f8d45',
  doolyBelly: '#cfe8a8',
  doolyHorn: '#f6c453',

  marioRed: '#d63a3a',
  marioRedShade: '#b62c2c',
  marioCapShade: '#8f1f1f',
  marioBlue: '#2f5fae',
  marioBlueShade: '#1d3f78',
  marioShoe: '#7a4a28',
  marioHair: '#5a3a22',
  marioGlove: '#ffffff',
  marioIris: '#3f6fc4',
} as const;

/** 눈 하나. 흰자 + 색동자 + 검은자 + 왼쪽 위 반짝임. */
function pupilEye(ctx: Ctx, x: number, y: number, r: number, iris: string | null): void {
  ellipse(ctx, x, y, r, r * 1.06, { fill: '#ffffff', lineWidth: OUTLINE.thin });
  if (iris) circle(ctx, x, y + r * 0.06, r * 0.45, { fill: iris, lineWidth: 0 });
  circle(ctx, x, y + r * 0.06, r * 0.24, { fill: '#20242a', lineWidth: 0 });
  circle(ctx, x - r * 0.17, y - r * 0.28, r * 0.16, { fill: '#ffffff', lineWidth: 0 });
}

/** 감은 눈. depth 가 음수면 웃는 눈(위로 볼록)이 된다. */
function closedEye(ctx: Ctx, x: number, y: number, w: number, depth: number): void {
  ctx.strokeStyle = PALETTE.outline;
  ctx.lineWidth = OUTLINE.base;
  ctx.beginPath();
  ctx.moveTo(x - w, y);
  ctx.quadraticCurveTo(x, y + depth, x + w, y);
  ctx.stroke();
}

/* --------------------------------- 뿌까 ---------------------------------- */

export function drawPucca(ctx: Ctx, pose: PlayerPose): void {
  const bob = pose.bob;
  const hipY = 120 + bob;
  const shoulderY = 82 + bob;
  const headCY = 48 + bob;

  groundShadow(ctx, cx, 154, 28, 7);

  // 뒷다리 · 뒷팔
  const backLeg = limb(
    ctx,
    cx - 5,
    hipY,
    liftedLength(26, pose.backLift),
    backLegAngle(pose),
    10,
    darken(C.puccaSkin, 0.14),
  );
  ellipse(ctx, backLeg.x + 2, backLeg.y + 2, 10, 6.5, {
    fill: darken(C.puccaShoe, 0.2),
    lineWidth: OUTLINE.thin,
  });
  const backHand = limb(
    ctx,
    cx - 20,
    shoulderY + 4,
    18,
    Math.PI - pose.backArm,
    10,
    darken(C.puccaRed, 0.2),
  );
  circle(ctx, backHand.x, backHand.y, 6, {
    fill: darken(C.puccaSkin, 0.14),
    lineWidth: OUTLINE.thin,
  });

  // 앞다리
  const frontLeg = limb(
    ctx,
    cx + 6,
    hipY,
    liftedLength(28, pose.frontLift),
    frontLegAngle(pose),
    11,
    C.puccaSkin,
  );
  ellipse(ctx, frontLeg.x + 3, frontLeg.y + 2, 11, 7, {
    fill: C.puccaShoe,
    lineWidth: OUTLINE.base,
  });

  // 빨간 치파오 — 아래로 넓어지는 종 모양. 이게 뿌까의 몸통이다.
  const hemY = hipY + 12;
  ctx.beginPath();
  ctx.moveTo(cx - 21, shoulderY - 4);
  ctx.quadraticCurveTo(cx - 33, hipY - 8, cx - 29, hemY - 5);
  ctx.quadraticCurveTo(cx, hemY + 1, cx + 29, hemY - 5);
  ctx.quadraticCurveTo(cx + 33, hipY - 8, cx + 21, shoulderY - 4);
  ctx.closePath();
  paint(ctx, { fill: C.puccaRed, lineWidth: OUTLINE.bold });
  ctx.save();
  ctx.clip();
  ctx.globalAlpha = 0.26;
  ctx.fillStyle = C.puccaRedShade;
  ctx.fillRect(cx + 5, shoulderY - 4, 32, hemY - shoulderY + 8);
  ctx.restore();

  // 노란 옷단
  ctx.beginPath();
  ctx.moveTo(cx - 29, hemY - 10);
  ctx.quadraticCurveTo(cx, hemY - 4, cx + 29, hemY - 10);
  ctx.lineTo(cx + 29, hemY - 5);
  ctx.quadraticCurveTo(cx, hemY + 1, cx - 29, hemY - 5);
  ctx.closePath();
  paint(ctx, { fill: C.puccaGold, lineWidth: OUTLINE.thin });

  // 앞섶 노란 띠 + 매듭 두 개
  ctx.strokeStyle = C.puccaGold;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx - 15, shoulderY + 2);
  ctx.quadraticCurveTo(cx + 2, shoulderY + 10, cx + 17, shoulderY + 2);
  ctx.stroke();
  for (const ky of [17, 29]) {
    circle(ctx, cx + 1, shoulderY + ky, 4.5, { fill: C.puccaGold, lineWidth: OUTLINE.thin });
  }

  // 목 노란 깃
  ctx.beginPath();
  ctx.moveTo(cx - 13, shoulderY - 10);
  ctx.lineTo(cx + 13, shoulderY - 10);
  ctx.lineTo(cx + 11, shoulderY - 3);
  ctx.lineTo(cx - 11, shoulderY - 3);
  ctx.closePath();
  paint(ctx, { fill: C.puccaGold, lineWidth: OUTLINE.thin });

  // 앞팔
  const hand = limb(ctx, cx + 18, shoulderY + 4, 19, Math.PI + pose.frontArm, 11, C.puccaRed);
  circle(ctx, hand.x, hand.y, 6.5, { fill: C.puccaSkin, lineWidth: OUTLINE.base });

  // 머리
  ctx.save();
  ctx.translate(cx, headCY);
  ctx.rotate(pose.tilt);

  // 양옆 둥근 머리 뭉치 — 뿌까의 상징
  for (const bx of [-31, 31]) {
    circle(ctx, bx, -2, 16, { fill: C.puccaHair, lineWidth: OUTLINE.bold });
    ctx.save();
    ctx.globalAlpha = 0.32;
    ellipse(ctx, bx - 5, -8, 6, 4.5, { fill: '#8a7566', lineWidth: 0 });
    ctx.restore();
  }

  ellipse(ctx, 0, 0, 27, 26, { fill: C.puccaSkin, lineWidth: OUTLINE.bold });
  ctx.save();
  ctx.globalAlpha = 0.3;
  ellipse(ctx, 11, 6, 12, 13, { fill: PALETTE.skinShade, lineWidth: 0 });
  ctx.restore();

  // 검은 앞머리
  ctx.beginPath();
  ctx.moveTo(-27, -4);
  ctx.quadraticCurveTo(-27, -29, 0, -28);
  ctx.quadraticCurveTo(27, -29, 27, -4);
  ctx.quadraticCurveTo(13, -15, 0, -13);
  ctx.quadraticCurveTo(-13, -15, -27, -4);
  ctx.closePath();
  paint(ctx, { fill: C.puccaHair, lineWidth: OUTLINE.base });

  // 뿌까는 늘 웃어서 눈이 감겨 있다 — 그게 이 캐릭터의 표정이라 깜빡임을 따로 두지 않는다.
  for (const ex of [-11, 11]) closedEye(ctx, ex, 5, 6, -7);

  ctx.save();
  ctx.globalAlpha = 0.55;
  ellipse(ctx, -20, 12, 8, 5.5, { fill: C.puccaCheek, lineWidth: 0 });
  ellipse(ctx, 20, 12, 8, 5.5, { fill: C.puccaCheek, lineWidth: 0 });
  ctx.restore();

  ctx.strokeStyle = PALETTE.outline;
  ctx.lineWidth = OUTLINE.base;
  ctx.beginPath();
  ctx.moveTo(-6, 14);
  ctx.quadraticCurveTo(0, 14 + pose.smile, 6, 14);
  ctx.stroke();

  ctx.restore();
}

/* --------------------------------- 단비 ---------------------------------- */

export function drawDanbi(ctx: Ctx, pose: PlayerPose): void {
  const bob = pose.bob;
  const hipY = 132 + bob;
  const shoulderY = 100 + bob;
  const headCY = 72 + bob;

  groundShadow(ctx, cx, 154, 25, 6.5);

  // 뒷다리 — 세 살배기라 아주 짧다. 신발은 안 신었다.
  const backLeg = limb(
    ctx,
    cx - 5,
    hipY,
    liftedLength(14, pose.backLift),
    backLegAngle(pose),
    9,
    darken(C.danbiSkin, 0.14),
  );
  ellipse(ctx, backLeg.x + 2, backLeg.y + 3, 9, 6, {
    fill: darken(C.danbiSkin, 0.14),
    lineWidth: OUTLINE.thin,
  });

  // 앞다리
  const frontLeg = limb(
    ctx,
    cx + 6,
    hipY,
    liftedLength(15, pose.frontLift),
    frontLegAngle(pose),
    10,
    C.danbiSkin,
  );
  ellipse(ctx, frontLeg.x + 3, frontLeg.y + 3, 10, 6.5, {
    fill: C.danbiSkin,
    lineWidth: OUTLINE.base,
  });

  // 분홍 원피스 — 목이 안 보일 만큼 짧고 아래로 퍼진다
  const hemY = shoulderY + 38;
  ctx.beginPath();
  ctx.moveTo(cx - 20, shoulderY);
  ctx.quadraticCurveTo(cx - 31, shoulderY + 18, cx - 27, hemY - 8);
  ctx.quadraticCurveTo(cx, hemY, cx + 27, hemY - 8);
  ctx.quadraticCurveTo(cx + 31, shoulderY + 18, cx + 20, shoulderY);
  ctx.closePath();
  paint(ctx, { fill: C.danbiPink, lineWidth: OUTLINE.bold });
  ctx.save();
  ctx.clip();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = C.danbiPinkShade;
  ctx.fillRect(cx + 9, shoulderY, 30, 42);
  ctx.restore();

  // 두 팔 — 원피스보다 **나중에** 그린다.
  // 원피스가 종처럼 퍼져서 팔을 몸통 뒤에 두면 프레임 절반에서 팔이 통째로 사라진다.
  // 아기라 팔이 짧고 통통해 몸 앞으로 나와 있는 게 원작 그림에도 맞다.
  for (const side of [-1, 1] as const) {
    const dark = side < 0;
    const skin = dark ? darken(C.danbiSkin, 0.16) : C.danbiSkin;
    const sleeve = dark ? darken(C.danbiPink, 0.18) : C.danbiPink;
    const angle = side < 0 ? Math.PI - pose.backArm : Math.PI + pose.frontArm;
    const hand = limb(ctx, cx + side * 22, shoulderY + 6, side < 0 ? 15 : 16, angle, 9, skin);
    circle(ctx, hand.x, hand.y, 6.5, { fill: skin, lineWidth: OUTLINE.base });
    ellipse(ctx, cx + side * 22, shoulderY + 4, 9, 8, { fill: sleeve, lineWidth: OUTLINE.base });
  }

  // 머리 — 몸보다 크다
  ctx.save();
  ctx.translate(cx, headCY);
  ctx.rotate(pose.tilt);

  ellipse(ctx, 0, 0, 33, 31, { fill: C.danbiFace, lineWidth: OUTLINE.bold });
  ctx.save();
  ctx.globalAlpha = 0.24;
  ellipse(ctx, 16, 9, 11, 12, { fill: PALETTE.skinShade, lineWidth: 0 });
  ctx.restore();

  for (const ex of [-33, 33]) {
    ellipse(ctx, ex, 7, 6, 8, { fill: C.danbiFace, lineWidth: OUTLINE.base });
  }

  // 정수리로 올려 묶은 갈색 머리
  ctx.beginPath();
  ctx.moveTo(-32, -4);
  ctx.quadraticCurveTo(-30, -26, -6, -32);
  ctx.lineTo(12, -32);
  ctx.quadraticCurveTo(31, -25, 32, -4);
  ctx.quadraticCurveTo(26, -15, 14, -18);
  ctx.quadraticCurveTo(0, -21, -14, -18);
  ctx.quadraticCurveTo(-26, -15, -32, -4);
  ctx.closePath();
  paint(ctx, { fill: C.danbiHair, lineWidth: OUTLINE.base });

  // 위로 쓸어 올린 머릿결
  ctx.strokeStyle = C.danbiHairLine;
  ctx.lineWidth = 1.5;
  for (const sx of [-20, -10, 1, 11, 21]) {
    ctx.beginPath();
    ctx.moveTo(sx, -15);
    ctx.quadraticCurveTo(sx * 0.55, -25, sx * 0.22, -31);
    ctx.stroke();
  }

  // 묶음 다발
  ellipse(ctx, 2, -42, 14, 12, { fill: C.danbiHair, lineWidth: OUTLINE.base });
  ctx.strokeStyle = C.danbiHairLine;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-6, -36);
  ctx.quadraticCurveTo(-1, -45, 7, -49);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(4, -34);
  ctx.quadraticCurveTo(9, -42, 14, -44);
  ctx.stroke();

  // 분홍 리본 — 고양이 귀처럼 위로 선 두 갈래
  for (const rs of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(2, -43);
    ctx.quadraticCurveTo(rs * 21, -49, rs * 18, -62);
    ctx.quadraticCurveTo(rs * 6, -54, 2, -43);
    ctx.closePath();
    paint(ctx, { fill: C.danbiRibbon, lineWidth: OUTLINE.base });
  }
  ellipse(ctx, 2, -44, 5.5, 5, { fill: C.danbiRibbon, lineWidth: OUTLINE.thin });

  // 삐친 머리 한 올 — 리본보다 나중에 그려야 가려지지 않는다
  ctx.strokeStyle = PALETTE.outline;
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(13, -40);
  ctx.quadraticCurveTo(26, -46, 23, -54);
  ctx.stroke();

  // 얼굴을 반이나 차지하는 눈
  if (pose.blink) {
    for (const ex of [-13, 13]) closedEye(ctx, ex, 1, 9, 5);
  } else {
    for (const ex of [-13, 13]) {
      ellipse(ctx, ex, 1, 11, 11.5, { fill: C.danbiEyeWhite, lineWidth: OUTLINE.base });
      ellipse(ctx, ex, 2, 8.6, 9.2, { fill: C.danbiIris, lineWidth: 0 });
      // 눈동자 왼쪽 위에 작은 네모 반짝임
      const hx = ex - 3.4;
      const hy = -2.4;
      const r = 2.6;
      ctx.beginPath();
      ctx.moveTo(hx, hy - r);
      ctx.quadraticCurveTo(hx + r * 0.35, hy - r * 0.35, hx + r, hy);
      ctx.quadraticCurveTo(hx + r * 0.35, hy + r * 0.35, hx, hy + r);
      ctx.quadraticCurveTo(hx - r * 0.35, hy + r * 0.35, hx - r, hy);
      ctx.quadraticCurveTo(hx - r * 0.35, hy - r * 0.35, hx, hy - r);
      ctx.closePath();
      ctx.fillStyle = C.danbiEyeWhite;
      ctx.fill();
    }
  }

  // 가느다란 눈썹
  ctx.strokeStyle = 'rgba(122, 80, 42, 0.7)';
  ctx.lineWidth = 1.5;
  for (const bs of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(bs * 20, -14);
    ctx.quadraticCurveTo(bs * 13, -16.5, bs * 7, -14);
    ctx.stroke();
  }

  // 커다란 붉은 볼 — 얼굴 밖으로 넘치지 않게 얼굴에 가둔다
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, 0, 31, 29, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.globalAlpha = 0.85;
  ellipse(ctx, -20, 14, 9.5, 8, { fill: C.danbiCheek, lineWidth: 0 });
  ellipse(ctx, 20, 14, 9.5, 8, { fill: C.danbiCheek, lineWidth: 0 });
  ctx.restore();

  // 오므린 작은 입. 기뻐하면 크게 벌어진다.
  const mouthR = 3.2 + pose.smile * 0.22;
  ellipse(ctx, 0, 20, mouthR, mouthR * 1.15, { fill: C.danbiMouth, lineWidth: OUTLINE.thin });

  ctx.restore();
}

/* --------------------------------- 둘리 ---------------------------------- */

export function drawDooly(ctx: Ctx, pose: PlayerPose): void {
  const bob = pose.bob;
  const hipY = 128 + bob;
  const bodyCY = 108 + bob;
  const shoulderY = 96 + bob;
  const headCY = 58 + bob;

  groundShadow(ctx, cx, 154, 30, 7.5);

  // 꼬리 — 몸통보다 먼저 그려 뒤로 넘긴다
  ctx.beginPath();
  ctx.moveTo(cx - 26, bodyCY + 8);
  ctx.quadraticCurveTo(cx - 48, bodyCY + 10, cx - 44, bodyCY + 24);
  ctx.quadraticCurveTo(cx - 34, bodyCY + 18, cx - 22, bodyCY + 18);
  ctx.closePath();
  paint(ctx, { fill: C.doolyGreen, lineWidth: OUTLINE.base });

  // 뒷다리 · 뒷지느러미.
  // 지느러미가 짧아 걸음에 따라 몸통에 묻히기도 하는데, 같은 초록이라 사라진 티가 안 난다.
  const backLeg = limb(
    ctx,
    cx - 6,
    hipY,
    liftedLength(18, pose.backLift),
    backLegAngle(pose),
    12,
    darken(C.doolyGreen, 0.16),
  );
  doolyFoot(ctx, backLeg.x + 2, backLeg.y + 2, 12, 7.5, darken(C.doolyGreen, 0.16));
  const backFin = limb(
    ctx,
    cx - 28,
    shoulderY + 6,
    16,
    Math.PI - pose.backArm,
    11,
    darken(C.doolyGreen, 0.18),
  );
  ellipse(ctx, backFin.x, backFin.y, 8, 6.5, {
    fill: darken(C.doolyGreen, 0.18),
    lineWidth: OUTLINE.thin,
  });

  // 앞다리
  const frontLeg = limb(
    ctx,
    cx + 7,
    hipY,
    liftedLength(20, pose.frontLift),
    frontLegAngle(pose),
    13,
    C.doolyGreen,
  );
  doolyFoot(ctx, frontLeg.x + 3, frontLeg.y + 2, 13, 8, C.doolyGreen);

  // 둥근 몸통 + 연한 배
  ellipse(ctx, cx, bodyCY, 32, 30, { fill: C.doolyGreen, lineWidth: OUTLINE.bold });
  ellipse(ctx, cx - 2, bodyCY + 6, 20, 18, { fill: C.doolyBelly, lineWidth: OUTLINE.thin });

  // 앞지느러미
  const frontFin = limb(ctx, cx + 26, shoulderY + 8, 17, Math.PI + pose.frontArm, 12, C.doolyGreen);
  ellipse(ctx, frontFin.x, frontFin.y, 8.5, 7, { fill: C.doolyGreen, lineWidth: OUTLINE.base });

  // 머리
  ctx.save();
  ctx.translate(cx, headCY);
  ctx.rotate(pose.tilt);

  ellipse(ctx, 0, 0, 34, 31, { fill: C.doolyGreen, lineWidth: OUTLINE.bold });
  ctx.save();
  ctx.globalAlpha = 0.3;
  ellipse(ctx, 13, 6, 14, 16, { fill: C.doolyGreenShade, lineWidth: 0 });
  ctx.restore();

  // 노란 뿔 세 개 — 둘리를 한눈에 알아보게 하는 표시
  for (const [hx, hh] of [
    [-13, 13],
    [0, 17],
    [13, 13],
  ]) {
    ctx.beginPath();
    ctx.moveTo(hx - 6, -26);
    ctx.quadraticCurveTo(hx, -26 - hh, hx + 6, -26);
    ctx.closePath();
    paint(ctx, { fill: C.doolyHorn, lineWidth: OUTLINE.thin });
  }

  if (pose.blink) {
    for (const ex of [-12, 12]) closedEye(ctx, ex, -4, 10, 5);
  } else {
    pupilEye(ctx, -12, -4, 12, null);
    pupilEye(ctx, 12, -4, 12, null);
  }

  for (const nx of [-4, 4]) ellipse(ctx, nx, 10, 2, 1.6, { fill: PALETTE.outline, lineWidth: 0 });

  ctx.strokeStyle = PALETTE.outline;
  ctx.lineWidth = OUTLINE.base;
  ctx.beginPath();
  ctx.moveTo(-13, 16);
  ctx.quadraticCurveTo(0, 16 + pose.smile * 1.6, 13, 16);
  ctx.stroke();

  ctx.save();
  ctx.globalAlpha = 0.45;
  ellipse(ctx, -27, 12, 6, 4, { fill: PALETTE.accentPink, lineWidth: 0 });
  ellipse(ctx, 27, 12, 6, 4, { fill: PALETTE.accentPink, lineWidth: 0 });
  ctx.restore();

  ctx.restore();
}

/** 발가락 선이 있는 공룡 발. */
function doolyFoot(ctx: Ctx, x: number, y: number, rx: number, ry: number, fill: string): void {
  ellipse(ctx, x, y, rx, ry, { fill, lineWidth: OUTLINE.base });
  ctx.strokeStyle = PALETTE.outline;
  ctx.lineWidth = 1.8;
  for (const t of [-5, 0, 5]) {
    ctx.beginPath();
    ctx.moveTo(x + t, y - ry * 0.45);
    ctx.lineTo(x + t, y + ry * 0.45);
    ctx.stroke();
  }
}

/* -------------------------------- 마리오 --------------------------------- */

export function drawMario(ctx: Ctx, pose: PlayerPose): void {
  const bob = pose.bob;
  const hipY = 118 + bob;
  const shoulderY = 76 + bob;
  const headCY = 46 + bob;

  groundShadow(ctx, cx, 154, 28, 7);

  // 뒷다리 · 뒷팔
  const backLeg = limb(
    ctx,
    cx - 5,
    hipY,
    liftedLength(28, pose.backLift),
    backLegAngle(pose),
    12,
    darken(C.marioBlue, 0.16),
  );
  ellipse(ctx, backLeg.x + 3, backLeg.y + 2, 12.5, 7.5, {
    fill: darken(C.marioShoe, 0.16),
    lineWidth: OUTLINE.thin,
  });
  const backHand = limb(
    ctx,
    cx - 22,
    shoulderY - 2,
    23,
    Math.PI - pose.backArm,
    10,
    darken(C.marioRed, 0.18),
  );
  circle(ctx, backHand.x, backHand.y, 7.5, {
    fill: darken(C.marioGlove, 0.14),
    lineWidth: OUTLINE.thin,
  });

  // 앞다리
  const frontLeg = limb(
    ctx,
    cx + 6,
    hipY,
    liftedLength(30, pose.frontLift),
    frontLegAngle(pose),
    13,
    C.marioBlue,
  );
  ellipse(ctx, frontLeg.x + 4, frontLeg.y + 2, 13.5, 8, {
    fill: C.marioShoe,
    lineWidth: OUTLINE.base,
  });

  // 빨간 셔츠
  ctx.beginPath();
  ctx.moveTo(cx - 24, shoulderY - 8);
  ctx.lineTo(cx + 24, shoulderY - 8);
  ctx.lineTo(cx + 25, shoulderY + 18);
  ctx.lineTo(cx - 25, shoulderY + 18);
  ctx.closePath();
  paint(ctx, { fill: C.marioRed, lineWidth: OUTLINE.bold });

  // 파란 멜빵바지
  ctx.beginPath();
  ctx.moveTo(cx - 24, shoulderY + 10);
  ctx.lineTo(cx + 24, shoulderY + 10);
  ctx.lineTo(cx + 23, hipY + 4);
  ctx.lineTo(cx - 23, hipY + 4);
  ctx.closePath();
  paint(ctx, { fill: C.marioBlue, lineWidth: OUTLINE.bold });
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = C.marioBlueShade;
  ctx.fillRect(cx + 6, shoulderY + 10, 18, hipY - shoulderY - 6);
  ctx.restore();

  // 멜빵 끈 + 노란 단추
  for (const sx of [-13, 13]) {
    ctx.beginPath();
    ctx.moveTo(cx + sx - 4, shoulderY - 8);
    ctx.lineTo(cx + sx + 4, shoulderY - 8);
    ctx.lineTo(cx + sx + 4, shoulderY + 14);
    ctx.lineTo(cx + sx - 4, shoulderY + 14);
    ctx.closePath();
    paint(ctx, { fill: C.marioBlue, lineWidth: OUTLINE.thin });
    circle(ctx, cx + sx, shoulderY + 12, 4.5, { fill: C.puccaGold, lineWidth: OUTLINE.thin });
  }

  // 앞팔 + 흰 장갑
  const hand = limb(ctx, cx + 22, shoulderY - 2, 24, Math.PI + pose.frontArm, 11, C.marioRed);
  circle(ctx, hand.x, hand.y, 8, { fill: C.marioGlove, lineWidth: OUTLINE.base });

  // 머리
  ctx.save();
  ctx.translate(cx, headCY);
  ctx.rotate(pose.tilt);

  ellipse(ctx, 0, 0, 31, 29, { fill: PALETTE.skin, lineWidth: OUTLINE.bold });
  ctx.save();
  ctx.globalAlpha = 0.35;
  ellipse(ctx, 12, 6, 13, 15, { fill: PALETTE.skinShade, lineWidth: 0 });
  ctx.restore();

  ellipse(ctx, -30, 4, 5.5, 7, { fill: PALETTE.skin, lineWidth: OUTLINE.thin });
  ellipse(ctx, 2, 8, 10, 8.5, { fill: PALETTE.skin, lineWidth: OUTLINE.base });

  if (pose.blink) {
    for (const ex of [-11, 11]) closedEye(ctx, ex, 0, 7, 4);
  } else {
    pupilEye(ctx, -11, 0, 8, C.marioIris);
    pupilEye(ctx, 11, 0, 8, C.marioIris);
  }

  // 콧수염 — 마리오를 알아보게 하는 첫 번째 표시
  ctx.beginPath();
  ctx.moveTo(-18, 16);
  ctx.quadraticCurveTo(0, 11, 18, 16);
  ctx.quadraticCurveTo(14, 24, 5, 19);
  ctx.quadraticCurveTo(0, 17, -5, 19);
  ctx.quadraticCurveTo(-14, 24, -18, 16);
  ctx.closePath();
  paint(ctx, { fill: C.marioHair, lineWidth: OUTLINE.thin });

  // 모자 — 챙은 오른쪽으로만 뻗는다. 눈 위로 덮으면 표정이 사라진다.
  ctx.beginPath();
  ctx.moveTo(20, -16);
  ctx.quadraticCurveTo(44, -19, 45, -12);
  ctx.quadraticCurveTo(34, -8, 18, -10);
  ctx.closePath();
  paint(ctx, { fill: C.marioRedShade, lineWidth: OUTLINE.thin });

  ctx.beginPath();
  ctx.moveTo(-31, -15);
  ctx.quadraticCurveTo(-30, -40, 0, -41);
  ctx.quadraticCurveTo(30, -40, 31, -15);
  ctx.closePath();
  paint(ctx, { fill: C.marioRed, lineWidth: OUTLINE.bold });
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = C.marioCapShade;
  ctx.beginPath();
  ctx.moveTo(8, -38);
  ctx.quadraticCurveTo(30, -38, 31, -15);
  ctx.lineTo(8, -15);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ellipse(ctx, -2, -27, 10, 9.5, { fill: C.marioGlove, lineWidth: OUTLINE.thin });
  ctx.fillStyle = C.marioRed;
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('M', -2, -26);

  ctx.restore();
}
