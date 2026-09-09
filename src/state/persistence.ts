/**
 * 자동 저장. 학생에게 저장 버튼을 요구하지 않는다. (명세 36)
 *
 * 게임 로직(gameStore)과 저장 코드를 분리하기 위해 스토어를 구독만 한다. (개발원칙 9)
 */
import { repositories } from '@/data';
import { isSavingBlocked, useGameStore } from './gameStore';

const SAVE_DEBOUNCE_MS = 500;

let timer: number | null = null;
let unsubscribe: (() => void) | null = null;
let pending = false;

/** 저장 대상이 실제로 바뀌었는지 확인할 때 쓰는 얕은 스냅숏 */
function snapshot(state: ReturnType<typeof useGameStore.getState>) {
  return [
    state.money,
    state.experience,
    state.level,
    state.chests,
    state.plots,
    state.animals,
    state.inventory,
    state.home,
    state.yard,
    state.unlocked,
    state.records,
    state.miniGameScores,
    state.lastMiniGameRewardDate,
    state.stats,
  ];
}

function changed(a: unknown[], b: unknown[]): boolean {
  return a.some((value, index) => value !== b[index]);
}

export async function flushSave(): Promise<void> {
  if (timer !== null) {
    window.clearTimeout(timer);
    timer = null;
  }
  if (!pending) return;
  pending = false;

  if (isSavingBlocked()) return;

  const state = useGameStore.getState();
  const save = state.toSaveData();
  if (!save || !state.profile) return;
  const repos = repositories();
  try {
    await Promise.all([
      repos.gameState.save(state.profile.id, save),
      repos.learning.saveStats(state.profile.id, state.stats),
    ]);
  } catch (error) {
    console.error('[persistence] 저장 실패', error);
  }
}

function scheduleSave(): void {
  pending = true;
  if (timer !== null) window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    timer = null;
    void flushSave();
  }, SAVE_DEBOUNCE_MS);
}

function onVisibilityChange(): void {
  if (document.visibilityState === 'hidden') void flushSave();
}

/** 세션 시작 후 호출. 상태가 바뀔 때마다 자동 저장한다. */
export function startAutoSave(): () => void {
  stopAutoSave();
  let previous = snapshot(useGameStore.getState());

  unsubscribe = useGameStore.subscribe((state) => {
    if (state.status !== 'ready') return;
    const next = snapshot(state);
    if (changed(previous, next)) {
      previous = next;
      scheduleSave();
    }
  });

  window.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('pagehide', onVisibilityChange);
  return stopAutoSave;
}

export function stopAutoSave(): void {
  unsubscribe?.();
  unsubscribe = null;
  window.removeEventListener('visibilitychange', onVisibilityChange);
  window.removeEventListener('pagehide', onVisibilityChange);
  void flushSave();
}
