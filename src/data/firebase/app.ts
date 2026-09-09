/**
 * Firebase 초기화.
 *
 * - 익명 인증: 학생은 아무것도 하지 않는다. 앱이 자동으로 로그인해서
 *   보안 규칙이 "로그인한 기기만" 을 요구할 수 있게 한다.
 *   데이터는 이 익명 UID 가 아니라 playerId 로 저장하므로, 태블릿을 바꿔도
 *   이름만 고르면 이어서 할 수 있다.
 * - 오프라인 캐시: Wi-Fi 가 끊겨도 계속 플레이되고, 다시 연결되면 저절로 올라간다.
 */
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, type Auth } from 'firebase/auth';
import {
  collection,
  getDocs,
  initializeFirestore,
  limit,
  persistentLocalCache,
  persistentMultipleTabManager,
  query,
  type Firestore,
} from 'firebase/firestore';
import { readFirebaseConfig } from './config';

interface FirebaseHandles {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

let handles: FirebaseHandles | null = null;
let ready: Promise<FirebaseHandles> | null = null;

/**
 * 앱을 초기화하고 익명 로그인이 끝날 때까지 기다린다.
 * 설정이 없거나 로그인에 실패하면 예외를 던진다 — 호출한 쪽에서 로컬 저장으로 넘어간다.
 */
export function initFirebase(): Promise<FirebaseHandles> {
  if (ready) return ready;

  ready = (async () => {
    const config = readFirebaseConfig();
    if (!config) throw new Error('Firebase 설정이 없습니다.');

    const app = initializeApp(config);

    // 오프라인 캐시. 여러 탭을 열어도 안전하게 동작한다.
    const db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });

    const auth = getAuth(app);
    await signInAnonymously(auth);

    handles = { app, auth, db };
    return handles;
  })();

  return ready;
}

/** 초기화가 끝난 뒤에만 쓴다. */
export function firestore(): Firestore {
  if (!handles) throw new Error('Firebase 가 아직 준비되지 않았습니다.');
  return handles.db;
}

export function isFirebaseReady(): boolean {
  return handles !== null;
}

/**
 * 규칙이 실제로 읽기를 허용하는지 한 번 확인한다.
 *
 * 익명 로그인은 성공해도 Firestore 규칙이 기본값(전부 차단)이면 게임이 첫 화면에서 멈춘다.
 * 그 상황을 학생 앞이 아니라 시작 시점에 잡아서, 조용히 이 기기 저장으로 넘어가려는 것이다.
 * 오프라인이면 캐시에서 답이 오므로 여기서 걸리지 않는다.
 */
export async function probeFirestore(): Promise<void> {
  const db = firestore();
  await getDocs(query(collection(db, 'players'), limit(1)));
}
