/**
 * 밤낮 순환. (요청 3)
 *
 * 한 바퀴 17분 — 아침~낮 10분, 노을 2분, 밤 5분.
 * 40분 수업이면 두 바퀴 조금 넘게 돌아간다.
 *
 * 시계는 **벽시계 시각**(Date.now)에서 나온다. 게임을 켠 시각부터 세면
 * 새로고침할 때마다 아침으로 되돌아가고, 옆자리 친구와 시간이 어긋난다.
 * 벽시계를 쓰면 반 전체가 같이 밤을 맞는다 — "어! 밤 됐다" 가 같이 나온다.
 * 대신 게임에 처음 들어온 순간이 밤일 수도 있다. 그게 더 자연스럽다고 봤다.
 *
 * 이 파일은 Phaser 를 모른다. 순수 계산만 하고, 화면에 얹는 일은 WorldScene 이 한다.
 */

/** 각 시간대의 길이(ms). */
export const DAY_PHASE_MS = {
  /** 아침~낮 */
  day: 10 * 60_000,
  /** 저녁 노을 */
  sunset: 2 * 60_000,
  /** 밤 */
  night: 5 * 60_000,
} as const;

export const CYCLE_MS = DAY_PHASE_MS.day + DAY_PHASE_MS.sunset + DAY_PHASE_MS.night;

const SUNSET_AT = DAY_PHASE_MS.day;
const NIGHT_AT = DAY_PHASE_MS.day + DAY_PHASE_MS.sunset;

export type DayPhase = 'day' | 'sunset' | 'night';

/** 학생에게 보여 줄 이름. */
export const PHASE_NAME: Record<DayPhase, string> = {
  day: '낮',
  sunset: '저녁',
  night: '밤',
};

/**
 * 시간대가 바뀔 때 한 번 띄우는 안내.
 * 화면이 어두워지는 이유를 말해 주지 않으면 고장난 줄 안다.
 */
export const PHASE_CHANGE_TEXT: Record<DayPhase, string> = {
  day: '아침이 되었어요!',
  sunset: '해가 지고 있어요',
  night: '밤이 되었어요. 별이 떴어요',
};

/**
 * 개발 중에만 듣는 배속.
 *
 * 주소 끝에 `?fastday=20` 을 붙이면 순환이 20배 빨라져 17분을 51초에 다 볼 수 있다.
 * 노을 한 번 보려고 10분을 기다릴 수는 없어서 둔 것이다.
 * 배포본에서는 import.meta.env.DEV 가 false 라 언제나 1배다.
 */
let speed: number | null = null;

function cycleSpeed(): number {
  if (speed !== null) return speed;
  speed = 1;
  if (import.meta.env.DEV && typeof location !== 'undefined') {
    const value = Number(new URLSearchParams(location.search).get('fastday'));
    if (Number.isFinite(value) && value > 0) speed = Math.min(value, 200);
  }
  return speed;
}

/** 지금 순환 안에서 몇 ms 지점인가. */
export function cycleNow(at: number = Date.now()): number {
  const t = at * cycleSpeed();
  return ((t % CYCLE_MS) + CYCLE_MS) % CYCLE_MS;
}

export function phaseAt(ms: number): DayPhase {
  if (ms < SUNSET_AT) return 'day';
  if (ms < NIGHT_AT) return 'sunset';
  return 'night';
}

/**
 * 구간별 값 사이를 이어서 섞는다.
 * 시간대 경계에서 색이 툭 바뀌면 화면이 고장난 것처럼 보인다.
 */
function lerpStops(stops: readonly (readonly [number, number])[], t: number): number {
  if (t <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i += 1) {
    const [t1, v1] = stops[i];
    if (t > t1) continue;
    const [t0, v0] = stops[i - 1];
    const k = t1 === t0 ? 1 : (t - t0) / (t1 - t0);
    return v0 + (v1 - v0) * k;
  }
  return stops[stops.length - 1][1];
}

/**
 * 하늘색 덮개. 세계 위에 이 색을 이 진하기로 덮는다.
 *
 * 노을은 주황, 밤은 짙은 남색이다. 밤 알파를 0.5 넘게 올리면
 * 나무 종류와 동물이 구별되지 않아 수확할 것을 못 찾는다 — 0.46 이 한계였다.
 */
export interface SkyTint {
  /** 0xRRGGBB */
  color: number;
  /** 0~1 */
  alpha: number;
}

/** [순환 안 시각(ms), 값] 구간표. 마지막은 처음과 같아야 매끄럽게 이어진다. */
const R = [
  [0, 0xff],
  [SUNSET_AT * 0.86, 0xff],
  [SUNSET_AT, 0xf0],
  [SUNSET_AT + DAY_PHASE_MS.sunset * 0.5, 0xe2],
  [NIGHT_AT, 0x4a],
  [NIGHT_AT + DAY_PHASE_MS.night * 0.2, 0x22],
  [NIGHT_AT + DAY_PHASE_MS.night * 0.8, 0x22],
  [CYCLE_MS, 0xff],
] as const;

const G = [
  [0, 0xff],
  [SUNSET_AT * 0.86, 0xff],
  [SUNSET_AT, 0xb4],
  [SUNSET_AT + DAY_PHASE_MS.sunset * 0.5, 0x6c],
  [NIGHT_AT, 0x52],
  [NIGHT_AT + DAY_PHASE_MS.night * 0.2, 0x30],
  [NIGHT_AT + DAY_PHASE_MS.night * 0.8, 0x30],
  [CYCLE_MS, 0xff],
] as const;

const B = [
  [0, 0xff],
  [SUNSET_AT * 0.86, 0xff],
  [SUNSET_AT, 0x5a],
  [SUNSET_AT + DAY_PHASE_MS.sunset * 0.5, 0x42],
  [NIGHT_AT, 0x96],
  [NIGHT_AT + DAY_PHASE_MS.night * 0.2, 0x72],
  [NIGHT_AT + DAY_PHASE_MS.night * 0.8, 0x72],
  [CYCLE_MS, 0xff],
] as const;

const ALPHA = [
  [0, 0],
  [SUNSET_AT * 0.86, 0],
  [SUNSET_AT, 0.12],
  [SUNSET_AT + DAY_PHASE_MS.sunset * 0.5, 0.32],
  [NIGHT_AT, 0.4],
  [NIGHT_AT + DAY_PHASE_MS.night * 0.2, 0.46],
  [NIGHT_AT + DAY_PHASE_MS.night * 0.8, 0.46],
  [CYCLE_MS, 0],
] as const;

export function tintAt(ms: number): SkyTint {
  const r = Math.round(lerpStops(R, ms));
  const g = Math.round(lerpStops(G, ms));
  const b = Math.round(lerpStops(B, ms));
  return { color: (r << 16) | (g << 8) | b, alpha: lerpStops(ALPHA, ms) };
}

/**
 * 별의 진하기(0~1). 노을 후반부터 떠서 밤에 가장 밝고 새벽에 진다.
 * 어두워진 이유를 알려 주는 표시이기도 하다 — 별이 뜨면 밤이다.
 */
const STAR_ALPHA = [
  [0, 0],
  [SUNSET_AT + DAY_PHASE_MS.sunset * 0.45, 0],
  [NIGHT_AT, 0.7],
  [NIGHT_AT + DAY_PHASE_MS.night * 0.2, 1],
  [NIGHT_AT + DAY_PHASE_MS.night * 0.82, 1],
  [CYCLE_MS, 0],
] as const;

export function starAlphaAt(ms: number): number {
  return lerpStops(STAR_ALPHA, ms);
}

/** 이 시간대가 끝나기까지 남은 ms. 안내 문구에 쓴다. */
export function msLeftInPhase(ms: number): number {
  if (ms < SUNSET_AT) return SUNSET_AT - ms;
  if (ms < NIGHT_AT) return NIGHT_AT - ms;
  return CYCLE_MS - ms;
}
