/**
 * Firebase 설정.
 *
 * 키는 .env.local 에 넣는다 (.env.example 참고).
 * 설정이 없으면 게임은 localStorage 로만 동작한다 — 그래서 프로젝트를 만들기 전에도
 * 개발과 수업이 그대로 가능하다.
 */

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const env = import.meta.env;

/** 하나라도 비어 있으면 설정이 없는 것으로 본다. */
export function readFirebaseConfig(): FirebaseConfig | null {
  const config = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  };

  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) return null;
  return config as FirebaseConfig;
}

export function hasFirebaseConfig(): boolean {
  return readFirebaseConfig() !== null;
}
