/**
 * 캐릭터 골격 — 여러 캐릭터가 함께 쓰는 자세 타입과 팔다리 하나.
 *
 * 캐릭터마다 몸통·머리는 전혀 다르지만 걸음걸이는 하나뿐이어야
 * 같은 마을에 사는 것처럼 보인다. 그래서 자세 표(WALK_CYCLE 등)와
 * 팔다리를 뻗는 규칙은 여기 한 곳에 두고, 캐릭터별 파일은 색과 길이만 넘긴다.
 */
import { OUTLINE, PALETTE } from '@/config/artTokens';
import type { Ctx } from './draw';

export const PLAYER_FRAME = { width: 120, height: 160 };

/** 캐릭터가 서는 x 중심과 발이 닿는 y. 모든 캐릭터가 같은 자리에 서야 한다. */
export const CHAR_CX = 60;
export const CHAR_GROUND_Y = 152;

/**
 * 다리를 최대로 벌렸을 때의 각도(라디안).
 * 크게 할수록 보폭이 넓어지지만 접지에서 다리가 짧아져 몸이 주저앉는다.
 */
export const LEG_SWING_RAD = 0.55;

export interface PlayerPose {
  /** 몸 전체 상하 흔들림 */
  bob: number;
  /** 다리 스윙 (-1 ~ 1) */
  legSwing: number;
  /**
   * 흔드는 쪽 다리를 접어 드는 정도 (0~1). 디딘 다리는 0 이다.
   * 막대 다리로 각도만 바꾸면 한 걸음 안에서 같은 그림이 두 번 나온다.
   * 무릎이 접혀야 "나가는 다리"와 "디딘 다리"가 구분된다.
   */
  frontLift?: number;
  backLift?: number;
  /** 앞팔 각도 (라디안) */
  frontArm: number;
  backArm: number;
  blink: boolean;
  /** 입 크기 */
  smile: number;
  /** 머리 기울기 */
  tilt: number;
}

/**
 * 어깨/엉덩이에서 뻗는 팔다리 하나.
 *
 * 각도 규칙: **π 가 똑바로 아래**, 0 이 똑바로 위다. 호출부가 `Math.PI ± 흔들림` 으로 쓴다.
 * (cos 부호를 뒤집는 이유가 이것이다. 안 뒤집으면 π 가 위를 가리켜
 *  팔다리가 전부 몸통 안으로 접혀 들어가 화면에서 사라진다.)
 */
export function limb(
  ctx: Ctx,
  x: number,
  y: number,
  length: number,
  angle: number,
  width: number,
  color: string,
): { x: number; y: number } {
  const endX = x + Math.sin(angle) * length;
  const endY = y - Math.cos(angle) * length;
  ctx.strokeStyle = PALETTE.outline;
  ctx.lineWidth = width + OUTLINE.base;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  return { x: endX, y: endY };
}

/** 뒷다리 각도. legSwing 이 양수면 가까운 쪽 다리가 뒤로 간다. */
export function backLegAngle(pose: PlayerPose): number {
  return Math.PI - pose.legSwing * LEG_SWING_RAD;
}

export function frontLegAngle(pose: PlayerPose): number {
  return Math.PI + pose.legSwing * LEG_SWING_RAD;
}

/** 들린 다리는 무릎이 접혀 짧아 보인다. */
export function liftedLength(length: number, lift: number | undefined): number {
  return length * (1 - (lift ?? 0) * 0.3);
}
