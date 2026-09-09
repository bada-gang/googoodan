/**
 * 저장소 안전망.
 *
 * 서버(Firestore)가 거부해도 수업이 멈추면 안 된다.
 * 되돌릴 수 없는 오류가 한 번 나면 그 세션은 통째로 이 기기 저장으로 내려가고,
 * 실패한 그 호출은 이 기기 저장으로 다시 실행된다. 학생 화면에는 아무 일도 일어나지 않는다.
 *
 * 잠깐 끊긴 것(unavailable 등)은 여기서 처리하지 않는다.
 * Firestore 오프라인 캐시가 읽기는 캐시로 주고 쓰기는 큐에 쌓아 두었다가 알아서 올린다.
 * 그런 오류까지 이 기기 저장으로 내려버리면 다시 연결돼도 서버로 올라가지 않는다.
 */
import type {
  GameStateRepository,
  LearningRepository,
  PlayerRepository,
  RepositoryBundle,
} from './repositories';

/** 기다린다고 나아지지 않는 오류들. 규칙·인증·설정 문제다. */
const FATAL_CODES = new Set([
  'permission-denied',
  'unauthenticated',
  'failed-precondition',
  'unimplemented',
  'invalid-argument',
]);

function isFatal(error: unknown): boolean {
  const code = (error as { code?: unknown })?.code;
  return typeof code === 'string' && FATAL_CODES.has(code);
}

/**
 * primary 를 감싸서, 치명적 오류가 나면 fallback 으로 갈아타고 같은 호출을 다시 한다.
 * 한 번 갈아타면 그 세션 동안 되돌아가지 않는다 — 데이터가 두 곳으로 갈리지 않게.
 */
export function createResilientBundle(
  primary: RepositoryBundle,
  makeFallback: () => RepositoryBundle,
  onDowngrade: (error: unknown) => void,
): RepositoryBundle {
  let fallback: RepositoryBundle | null = null;

  async function run<T>(pick: (bundle: RepositoryBundle) => Promise<T>): Promise<T> {
    if (fallback) return pick(fallback);
    try {
      return await pick(primary);
    } catch (error) {
      if (!isFatal(error)) throw error;
      fallback = makeFallback();
      onDowngrade(error);
      return pick(fallback);
    }
  }

  const player: PlayerRepository = {
    listProfiles: () => run((b) => b.player.listProfiles()),
    getProfile: (id) => run((b) => b.player.getProfile(id)),
    createProfile: (name, avatar) => run((b) => b.player.createProfile(name, avatar)),
    updateAvatar: (id, avatar) => run((b) => b.player.updateAvatar(id, avatar)),
    touchLastPlayed: (id) => run((b) => b.player.touchLastPlayed(id)),
    deleteProfile: (id) => run((b) => b.player.deleteProfile(id)),
  };

  const gameState: GameStateRepository = {
    load: (id) => run((b) => b.gameState.load(id)),
    save: (id, data) => run((b) => b.gameState.save(id, data)),
    reset: (id) => run((b) => b.gameState.reset(id)),
  };

  const learning: LearningRepository = {
    loadStats: (id) => run((b) => b.learning.loadStats(id)),
    saveStats: (id, stats) => run((b) => b.learning.saveStats(id, stats)),
  };

  return { player, gameState, learning };
}
