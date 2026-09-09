/**
 * 활성 저장소 제공자.
 *
 * Firebase 설정이 있으면 서버 저장을, 없거나 연결에 실패하면 이 기기 저장을 쓴다.
 * 교실에서 서버가 말썽이어도 수업이 멈추지 않게 하려는 것이다.
 * 게임/UI 코드는 항상 repositories() 만 호출한다.
 */
import { createLocalRepositories } from './local/LocalRepositories';
import { hasFirebaseConfig } from './firebase/config';
import { createResilientBundle } from './resilient';
import type { RepositoryBundle } from './repositories';

export type StorageMode = 'firebase' | 'local';

/**
 * 서버 응답을 기다리는 한계. 붙긴 했는데 밖으로 못 나가는 교실 Wi-Fi 에서
 * 앱이 아예 안 뜨는 일을 막는다. 내려받기는 여기 포함되지 않는다 — 통신 단계에만 건다.
 */
const NETWORK_TIMEOUT_MS = 10_000;

function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      window.setTimeout(
        () => reject(new Error(`${label} 응답이 ${NETWORK_TIMEOUT_MS}ms 안에 오지 않았습니다.`)),
        NETWORK_TIMEOUT_MS,
      ),
    ),
  ]);
}

let active: RepositoryBundle = createLocalRepositories();
let mode: StorageMode = 'local';
let initialized: Promise<StorageMode> | null = null;

export function repositories(): RepositoryBundle {
  return active;
}

export function storageMode(): StorageMode {
  return mode;
}

export function setRepositories(bundle: RepositoryBundle, nextMode: StorageMode = 'local'): void {
  active = bundle;
  mode = nextMode;
}

/**
 * 앱 시작 시 한 번 호출한다.
 * Firebase 를 쓸 수 있으면 서버 저장으로 바꾸고, 아니면 이 기기 저장 그대로 둔다.
 */
export function initRepositories(): Promise<StorageMode> {
  if (initialized) return initialized;

  initialized = (async () => {
    if (!hasFirebaseConfig()) {
      console.info('[data] Firebase 설정이 없어 이 기기에만 저장합니다.');
      return 'local' as const;
    }

    try {
      const [{ initFirebase, probeFirestore }, { createFirebaseRepositories }] = await Promise.all([
        import('./firebase/app'),
        import('./firebase/FirebaseRepositories'),
      ]);
      await withTimeout(initFirebase(), '익명 로그인');

      // 로그인이 됐어도 규칙이 막고 있으면 게임이 첫 화면에서 멈춘다. 미리 확인한다.
      await withTimeout(probeFirestore(), '서버 확인');

      // 수업 도중 서버가 막히면 조용히 이 기기 저장으로 내려간다.
      setRepositories(
        createResilientBundle(createFirebaseRepositories(), createLocalRepositories, (error) => {
          mode = 'local';
          console.warn('[data] 서버 저장이 막혀 이 기기 저장으로 넘어갑니다.', error);
        }),
        'firebase',
      );
      console.info('[data] 서버 저장(Firebase)을 사용합니다.');
      return 'firebase' as const;
    } catch (error) {
      console.warn('[data] Firebase 연결 실패 — 이 기기에만 저장합니다.', error);
      return 'local' as const;
    }
  })();

  return initialized;
}

export type { RepositoryBundle } from './repositories';
