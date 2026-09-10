/**
 * placeholder 캐릭터 아트. (임시 에셋 — Phase 7 에서 교체)
 * 머리 : 몸 = 1 : 1.5 비율, 측면 3/4 시점. (명세 41, 42)
 */
import { OUTLINE, PALETTE } from '@/config/artTokens';
import type { AvatarId, CharacterId } from '@/types/game';
import { LEG_SWING_RAD, PLAYER_FRAME, limb, type PlayerPose } from './body';
import { drawDanbi, drawDooly, drawMario, drawPucca } from './famousCharacters';
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
  roundRect,
  type Ctx,
  type Sheet,
} from './draw';

export { PLAYER_FRAME };

/**
 * 캐릭터별로 달라지는 부분.
 * 비율·자세·애니메이션은 모두 같고 머리와 옷만 바꾼다 — 같은 세계의 두 아이로 보여야 한다.
 */
interface CharacterLook {
  hair: 'short' | 'long';
  skirt: boolean;
  ribbon: boolean;
}

const LOOKS: Record<'boy' | 'girl', CharacterLook> = {
  boy: { hair: 'short', skirt: false, ribbon: false },
  girl: { hair: 'long', skirt: true, ribbon: true },
};

function drawPlayer(ctx: Ctx, pose: PlayerPose, look: CharacterLook): void {
  const cx = 60;
  const groundY = 152;
  const bob = pose.bob;

  groundShadow(ctx, cx, groundY + 2, 30, 8);

  const hipY = 112 + bob;
  const shoulderY = 78 + bob;
  const headCY = 50 + bob;

  // 뒷다리 · 뒷팔 (한 톤 어둡게)
  const backLeg = limb(
    ctx,
    cx - 5,
    hipY,
    34 * (1 - (pose.backLift ?? 0) * 0.3),
    Math.PI - pose.legSwing * LEG_SWING_RAD,
    13,
    PALETTE.pantsShade,
  );
  ellipse(ctx, backLeg.x + 3, backLeg.y + 2, 11, 7, {
    fill: darken(PALETTE.shoe, 0.15),
    lineWidth: OUTLINE.thin,
  });
  // 어깨 바깥쪽에서 시작한다. 몸통 안에서 시작하면 통째로 가려져 팔이 하나뿐인 것처럼 보인다.
  const backHand = limb(
    ctx,
    cx - 17,
    shoulderY + 6,
    28,
    Math.PI - pose.backArm,
    11,
    darken(PALETTE.shirt, 0.18),
  );
  circle(ctx, backHand.x, backHand.y, 6.5, {
    fill: darken(PALETTE.skin, 0.12),
    lineWidth: OUTLINE.thin,
  });

  // 앞다리
  const frontLeg = limb(
    ctx,
    cx + 6,
    hipY,
    36 * (1 - (pose.frontLift ?? 0) * 0.3),
    Math.PI + pose.legSwing * LEG_SWING_RAD,
    14,
    PALETTE.pants,
  );
  ellipse(ctx, frontLeg.x + 4, frontLeg.y + 2, 12, 7.5, {
    fill: PALETTE.shoe,
    lineWidth: OUTLINE.base,
  });

  // 뒷머리는 몸통보다 **먼저** 그린다. 머리 블록 안에서 그리면 상의를 덮어 버린다.
  // 실제로도 긴 머리는 어깨 뒤로 넘어간다.
  if (look.hair === 'long') {
    ctx.save();
    ctx.translate(cx, headCY);
    ctx.rotate(pose.tilt);
    ctx.beginPath();
    ctx.moveTo(-31, -8);
    ctx.quadraticCurveTo(-38, 16, -29, 38);
    ctx.quadraticCurveTo(-6, 44, 12, 38);
    ctx.quadraticCurveTo(32, 18, 31, -8);
    ctx.quadraticCurveTo(18, -30, -16, -28);
    ctx.closePath();
    paint(ctx, { fill: PALETTE.hair, lineWidth: OUTLINE.base });
    ctx.save();
    ctx.globalAlpha = 0.45;
    ellipse(ctx, -22, 12, 7, 16, { fill: PALETTE.hairLight, lineWidth: 0 });
    ctx.restore();
    ctx.restore();
  }

  // 치마 — 다리 위, 몸통 아래에 그려야 허리에서 자연스럽게 이어진다
  if (look.skirt) {
    ctx.beginPath();
    ctx.moveTo(cx - 19, hipY - 14);
    ctx.lineTo(cx + 19, hipY - 14);
    ctx.quadraticCurveTo(cx + 30, hipY + 12, cx + 26, hipY + 18);
    ctx.quadraticCurveTo(cx, hipY + 24, cx - 26, hipY + 18);
    ctx.quadraticCurveTo(cx - 30, hipY + 12, cx - 19, hipY - 14);
    ctx.closePath();
    paint(ctx, { fill: PALETTE.pants, lineWidth: OUTLINE.base });
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = PALETTE.pantsShade;
    ctx.beginPath();
    ctx.moveTo(cx + 6, hipY - 14);
    ctx.lineTo(cx + 19, hipY - 14);
    ctx.quadraticCurveTo(cx + 30, hipY + 12, cx + 26, hipY + 18);
    ctx.quadraticCurveTo(cx + 14, hipY + 21, cx + 8, hipY + 20);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 몸통
  roundRect(ctx, cx - 24, shoulderY - 4, 48, 46, 18, {
    fill: PALETTE.shirt,
    lineWidth: OUTLINE.base,
  });
  ctx.save();
  ctx.globalAlpha = 0.5;
  roundRect(ctx, cx + 4, shoulderY - 2, 18, 42, 14, { fill: PALETTE.shirtShade, lineWidth: 0 });
  ctx.restore();
  // 왼쪽 위 하이라이트
  ctx.save();
  ctx.globalAlpha = 0.45;
  ellipse(ctx, cx - 12, shoulderY + 8, 10, 13, { fill: lighten(PALETTE.shirt, 0.35), lineWidth: 0 });
  ctx.restore();

  // 앞팔
  const hand = limb(ctx, cx + 14, shoulderY + 8, 30, Math.PI + pose.frontArm, 12, PALETTE.shirt);
  // 상의가 밝은 색이면 손과 소매의 밝기 차가 작아 손이 묻힌다. 외곽선으로 갈라 준다.
  circle(ctx, hand.x, hand.y, 7.5, { fill: PALETTE.skin, lineWidth: OUTLINE.base });

  // 머리
  ctx.save();
  ctx.translate(cx, headCY);
  ctx.rotate(pose.tilt);

  ellipse(ctx, 0, 0, 33, 31, { fill: PALETTE.skin, lineWidth: OUTLINE.base });
  ctx.save();
  ctx.globalAlpha = 0.4;
  ellipse(ctx, 12, 6, 16, 18, { fill: PALETTE.skinShade, lineWidth: 0 });
  ctx.restore();

  // 앞머리: 위를 덮고 오른쪽으로 살짝 흐르는 형태
  ctx.beginPath();
  ctx.moveTo(-33, -3);
  ctx.quadraticCurveTo(-34, -34, -2, -33);
  ctx.quadraticCurveTo(30, -33, 33, -6);
  ctx.quadraticCurveTo(22, -16, 6, -13);
  ctx.quadraticCurveTo(-12, -11, -20, -2);
  ctx.closePath();
  paint(ctx, { fill: PALETTE.hair, lineWidth: OUTLINE.base });
  ctx.save();
  ctx.globalAlpha = 0.55;
  ellipse(ctx, -14, -22, 11, 6, { fill: PALETTE.hairLight, lineWidth: 0 });
  ctx.restore();

  if (look.ribbon) {
    // 옆머리 리본. 작은 화면에서도 여자 캐릭터임이 바로 읽히게 하는 표시다.
    const rx = 26;
    const ry = -22;
    for (const dx of [-9, 9]) {
      ellipse(ctx, rx + dx, ry, 8, 6.5, { fill: PALETTE.accentPink, lineWidth: OUTLINE.thin });
    }
    circle(ctx, rx, ry, 4, { fill: darken(PALETTE.accentPink, 0.25), lineWidth: OUTLINE.thin });
  }

  // 귀 (긴 머리에는 가려서 안 보인다)
  if (look.hair === 'short') {
    ellipse(ctx, -30, 4, 5.5, 7, { fill: PALETTE.skin, lineWidth: OUTLINE.thin });
  }

  face(ctx, 4, 4, {
    eyeGap: 12,
    eyeR: 5,
    blink: pose.blink,
    smile: pose.smile,
    cheekColor: PALETTE.accentPink,
  });
  ctx.restore();
}

/**
 * 캐릭터 id → 몸 그리는 함수.
 *
 * 남자아이·여자아이는 머리와 옷만 다른 같은 몸이라 drawPlayer 하나로 처리하고,
 * 아이들이 아는 캐릭터들은 몸 자체가 달라 각자 함수를 가진다.
 * 어느 쪽이든 받는 자세(PlayerPose)는 같아서 걸음걸이는 하나다.
 */
const BODY: Record<CharacterId, (ctx: Ctx, pose: PlayerPose) => void> = {
  boy: (ctx, pose) => drawPlayer(ctx, pose, LOOKS.boy),
  girl: (ctx, pose) => drawPlayer(ctx, pose, LOOKS.girl),
  pucca: drawPucca,
  danbi: drawDanbi,
  dooly: drawDooly,
  mario: drawMario,
};

export function buildPlayerIdleSheet(character: CharacterId): Sheet {
  const body = BODY[character];
  const sheet = makeSheet(PLAYER_FRAME.width, PLAYER_FRAME.height, 4);
  const bobs = [0, -2, -3, -1];
  for (let i = 0; i < 4; i += 1) {
    frame(sheet, i, (ctx) =>
      body(ctx, {
        bob: bobs[i],
        legSwing: 0,
        frontArm: 0.12 + i * 0.02,
        backArm: -0.1,
        blink: i === 3,
        smile: 6,
        tilt: i === 2 ? 0.03 : 0,
      }),
    );
  }
  return sheet;
}

/**
 * 걷기 6프레임. 사인 곡선을 그대로 샘플링하지 않고 자세를 직접 적는다.
 *
 * sin(i/6·2π) 로 뽑으면 값이 [0, .866, .866, 0, -.866, -.866] 이 되어
 * f1=f2, f4=f5 가 완전히 같은 그림이 된다 — 6프레임짜리가 실제로는 3포즈라 걸음이 튄다.
 *
 * 한 사이클 = 두 걸음. legSwing 이 양수면 가까운 쪽 다리가 뒤, 먼 쪽 다리가 앞이다.
 * 몸의 상하(bob, 양수가 아래)는 다리가 벌어진 접지에서 가장 낮다.
 *
 * 다리 각도만으로는 한 사이클에 같은 각도가 두 번 나온다(0.35 가 f1·f5 에).
 * 그래서 "지금 어느 다리가 공중에 있는가"를 lift 로 함께 적는다 — 이게 여섯 프레임을
 * 모두 다른 그림으로 만들고, 디딘 다리와 나가는 다리도 구분해 준다.
 */
const WALK_CYCLE: { legSwing: number; bob: number; frontLift: number; backLift: number }[] = [
  // legSwing 이 1 → -1 로 내려가는 동안 가까운 쪽 다리가 앞으로 나가고(들림),
  // -1 → 1 로 올라가는 동안 먼 쪽 다리가 나간다. 디딘 다리는 항상 lift 0 이다.
  { legSwing: 1.0, bob: 2, frontLift: 0, backLift: 0 }, // 접지 — 두 발이 다 땅에
  { legSwing: 0.35, bob: -1, frontLift: 0.4, backLift: 0 }, // 가까운 다리가 들려 지나간다
  { legSwing: -0.35, bob: -1, frontLift: 0.25, backLift: 0 }, // 내려놓기 직전
  { legSwing: -1.0, bob: 2, frontLift: 0, backLift: 0 }, // 반대쪽 접지
  { legSwing: -0.35, bob: -1, frontLift: 0, backLift: 0.4 }, // 먼 다리가 들려 지나간다
  { legSwing: 0.35, bob: -1, frontLift: 0, backLift: 0.25 },
];

export function buildPlayerWalkSheet(character: CharacterId): Sheet {
  const body = BODY[character];
  const sheet = makeSheet(PLAYER_FRAME.width, PLAYER_FRAME.height, 6);
  for (let i = 0; i < 6; i += 1) {
    const { legSwing, bob, frontLift, backLift } = WALK_CYCLE[i];
    frame(sheet, i, (ctx) =>
      body(ctx, {
        bob,
        legSwing,
        frontLift,
        backLift,
        // 팔은 같은 쪽 다리와 반대로 흔든다.
        // drawPlayer 가 앞팔에는 +, 뒷팔에는 - 를 적용하므로 두 값의 부호는 같아야 한다.
        // (전에는 뒷팔만 부호가 달라 뒷팔과 뒷다리가 함께 앞으로 나가는 걸음이 됐다.)
        frontArm: -legSwing * 0.55,
        backArm: -legSwing * 0.55,
        blink: false,
        smile: 6,
        tilt: legSwing * 0.02,
      }),
    );
  }
  return sheet;
}

export function buildPlayerInteractSheet(character: CharacterId): Sheet {
  const body = BODY[character];
  const sheet = makeSheet(PLAYER_FRAME.width, PLAYER_FRAME.height, 4);
  const reach = [0.2, 0.9, 1.15, 0.6];
  for (let i = 0; i < 4; i += 1) {
    frame(sheet, i, (ctx) =>
      body(ctx, {
        bob: i === 1 || i === 2 ? -2 : 0,
        legSwing: 0.15,
        frontArm: reach[i],
        backArm: -0.15,
        blink: false,
        smile: 5,
        tilt: 0.05,
      }),
    );
  }
  return sheet;
}

export function buildPlayerHappySheet(character: CharacterId): Sheet {
  const body = BODY[character];
  const sheet = makeSheet(PLAYER_FRAME.width, PLAYER_FRAME.height, 4);
  const jump = [0, -10, -16, -8];
  for (let i = 0; i < 4; i += 1) {
    frame(sheet, i, (ctx) =>
      body(ctx, {
        bob: jump[i],
        legSwing: 0.5,
        // 두 팔을 양옆으로 번쩍. 부호가 다르면 두 팔이 같은 쪽으로 모인다.
        frontArm: -1.9,
        backArm: -1.9,
        blink: i === 2,
        smile: 11,
        tilt: -0.05,
      }),
    );
  }
  return sheet;
}

/* -------------------------------- 아바타 -------------------------------- */

export const AVATAR_SIZE = 96;

type AvatarPainter = (ctx: Ctx) => void;

const AVATAR_PAINTERS: Record<AvatarId, AvatarPainter> = {
  rabbit: (ctx) => {
    ellipse(ctx, 34, 22, 8, 21, { fill: '#fdf6ec', lineWidth: OUTLINE.base });
    ellipse(ctx, 34, 24, 4, 14, { fill: PALETTE.accentPink, lineWidth: 0 });
    ellipse(ctx, 60, 20, 8, 22, { fill: '#fdf6ec', lineWidth: OUTLINE.base });
    ellipse(ctx, 60, 22, 4, 15, { fill: PALETTE.accentPink, lineWidth: 0 });
    ellipse(ctx, 48, 58, 30, 27, { fill: '#fdf6ec', lineWidth: OUTLINE.base });
    face(ctx, 48, 56, { eyeGap: 12, eyeR: 4.5, smile: 6 });
  },
  bear: (ctx) => {
    circle(ctx, 26, 30, 12, { fill: '#c9945f', lineWidth: OUTLINE.base });
    circle(ctx, 70, 30, 12, { fill: '#c9945f', lineWidth: OUTLINE.base });
    circle(ctx, 26, 30, 6, { fill: '#e0b183', lineWidth: 0 });
    circle(ctx, 70, 30, 6, { fill: '#e0b183', lineWidth: 0 });
    ellipse(ctx, 48, 55, 31, 28, { fill: '#c9945f', lineWidth: OUTLINE.base });
    ellipse(ctx, 48, 64, 15, 11, { fill: '#efd4b2', lineWidth: OUTLINE.thin });
    face(ctx, 48, 50, { eyeGap: 12, eyeR: 4.5, smile: 5, cheek: false });
    ellipse(ctx, 48, 60, 5, 4, { fill: PALETTE.outline, lineWidth: 0 });
  },
  cat: (ctx) => {
    for (const x of [26, 70]) {
      ctx.beginPath();
      ctx.moveTo(x - 12, 34);
      ctx.lineTo(x, 8);
      ctx.lineTo(x + 12, 34);
      ctx.closePath();
      paint(ctx, { fill: '#f2b46a', lineWidth: OUTLINE.base });
    }
    ellipse(ctx, 48, 56, 31, 27, { fill: '#f2b46a', lineWidth: OUTLINE.base });
    face(ctx, 48, 54, { eyeGap: 13, eyeR: 4.5, smile: 5 });
    ctx.strokeStyle = PALETTE.outline;
    ctx.lineWidth = 2;
    for (const dir of [-1, 1]) {
      for (const dy of [-4, 2]) {
        ctx.beginPath();
        ctx.moveTo(48 + dir * 22, 66 + dy);
        ctx.lineTo(48 + dir * 40, 62 + dy * 1.6);
        ctx.stroke();
      }
    }
  },
  fox: (ctx) => {
    for (const x of [24, 72]) {
      ctx.beginPath();
      ctx.moveTo(x - 11, 36);
      ctx.lineTo(x, 6);
      ctx.lineTo(x + 11, 36);
      ctx.closePath();
      paint(ctx, { fill: '#e2803f', lineWidth: OUTLINE.base });
    }
    ellipse(ctx, 48, 54, 31, 27, { fill: '#e2803f', lineWidth: OUTLINE.base });
    ctx.beginPath();
    ctx.moveTo(28, 58);
    ctx.quadraticCurveTo(48, 92, 68, 58);
    ctx.quadraticCurveTo(48, 70, 28, 58);
    ctx.closePath();
    paint(ctx, { fill: '#fdf6ec', lineWidth: OUTLINE.thin });
    face(ctx, 48, 50, { eyeGap: 13, eyeR: 4.5, smile: 4, cheek: false });
    ellipse(ctx, 48, 66, 5, 4, { fill: PALETTE.outline, lineWidth: 0 });
  },
  bird: (ctx) => {
    ellipse(ctx, 48, 30, 6, 12, { fill: '#7cc3e8', lineWidth: OUTLINE.thin });
    ellipse(ctx, 48, 58, 30, 28, { fill: '#7cc3e8', lineWidth: OUTLINE.base });
    ctx.beginPath();
    ctx.moveTo(46, 62);
    ctx.lineTo(70, 68);
    ctx.lineTo(46, 74);
    ctx.closePath();
    paint(ctx, { fill: PALETTE.beak, lineWidth: OUTLINE.thin });
    face(ctx, 44, 54, { eyeGap: 12, eyeR: 4.5, smile: 0 });
  },
  frog: (ctx) => {
    circle(ctx, 30, 30, 13, { fill: '#8ecf72', lineWidth: OUTLINE.base });
    circle(ctx, 66, 30, 13, { fill: '#8ecf72', lineWidth: OUTLINE.base });
    circle(ctx, 30, 30, 5.5, { fill: PALETTE.outline, lineWidth: 0 });
    circle(ctx, 66, 30, 5.5, { fill: PALETTE.outline, lineWidth: 0 });
    ellipse(ctx, 48, 60, 32, 25, { fill: '#8ecf72', lineWidth: OUTLINE.base });
    ctx.strokeStyle = PALETTE.outline;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(34, 62);
    ctx.quadraticCurveTo(48, 74, 62, 62);
    ctx.stroke();
    ctx.save();
    ctx.globalAlpha = 0.5;
    ellipse(ctx, 34, 70, 7, 4.5, { fill: PALETTE.accentPink, lineWidth: 0 });
    ellipse(ctx, 62, 70, 7, 4.5, { fill: PALETTE.accentPink, lineWidth: 0 });
    ctx.restore();
  },
};

export function buildAvatarSheet(id: AvatarId): Sheet {
  const sheet = makeSheet(AVATAR_SIZE, AVATAR_SIZE, 1);
  frame(sheet, 0, (ctx) => AVATAR_PAINTERS[id](ctx));
  return sheet;
}

/** React 프로필 화면에서 쓰는 아바타 데이터 URL (이모지 대신 사용) */
export function avatarDataUrl(id: AvatarId): string {
  return buildAvatarSheet(id).canvas.toDataURL('image/png');
}
