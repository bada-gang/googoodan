/**
 * localStorage 접근 유틸. 브라우저 저장소가 막혀 있어도 게임이 죽지 않도록
 * 실패 시 메모리 폴백을 사용한다.
 */

/**
 * 저장소 키 접두사.
 *
 * ⚠ 게임 이름이 바뀌어도 이 값은 그대로 둔다.
 *   바꾸는 순간 학생들이 저장해 둔 데이터를 못 읽는다.
 *   화면에 보이는 이름은 `src/config/strings.ts` 의 GAME_TITLE 이 담당한다.
 */
const NS = 'googoo';

const memoryFallback = new Map<string, string>();
let useMemory = false;

function ensureStore(): void {
  if (useMemory) return;
  try {
    const probe = `__${NS}_probe__`;
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
  } catch {
    useMemory = true;
    console.warn('[storage] localStorage 를 쓸 수 없어 메모리에만 저장합니다.');
  }
}

export function readRaw(key: string): string | null {
  ensureStore();
  if (useMemory) return memoryFallback.get(key) ?? null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return memoryFallback.get(key) ?? null;
  }
}

export function writeRaw(key: string, value: string): void {
  ensureStore();
  if (useMemory) {
    memoryFallback.set(key, value);
    return;
  }
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    console.warn('[storage] 저장 실패, 메모리로 전환합니다.', error);
    useMemory = true;
    memoryFallback.set(key, value);
  }
}

export function removeRaw(key: string): void {
  ensureStore();
  memoryFallback.delete(key);
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* 무시 */
  }
}

export function readJson<T>(key: string, fallback: T): T {
  const raw = readRaw(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`[storage] "${key}" 파싱 실패`, error);
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): void {
  writeRaw(key, JSON.stringify(value));
}

export const KEYS = {
  profiles: `${NS}:profiles`,
  save: (playerId: string) => `${NS}:save:${playerId}`,
  stats: (playerId: string) => `${NS}:stats:${playerId}`,
  attempts: (playerId: string) => `${NS}:attempts:${playerId}`,
  settings: `${NS}:settings`,
} as const;
