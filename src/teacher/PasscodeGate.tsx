/**
 * 교사 화면 앞의 암호 한 겹.
 *
 * ⚠ 이건 보안이 아니다. 암호는 브라우저로 내려간 파일 안에 들어 있고,
 *   Firestore 규칙은 여전히 "익명 로그인한 기기"면 통과시킨다.
 *   2학년 학생이 주소를 눌러 우연히 들어오는 것을 막는 정도로만 쓴다.
 */
import { useState, type FormEvent } from 'react';
import { GAME_TITLE } from '@/config/strings';

const PASSCODE = (import.meta.env.VITE_TEACHER_PASSCODE ?? '').trim();
const SESSION_KEY = 'googoo:teacher-unlocked';

export function passcodeRequired(): boolean {
  return PASSCODE.length > 0;
}

/** 새로고침해도 다시 묻지 않는다. 탭을 닫으면 풀린다. */
function remembered(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function PasscodeGate({ onUnlock }: { onUnlock: () => void }): React.ReactElement | null {
  const [value, setValue] = useState('');
  const [wrong, setWrong] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (value.trim() !== PASSCODE) {
      setWrong(true);
      setValue('');
      return;
    }
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      // 저장이 막힌 브라우저여도 이번 세션은 그냥 들어간다
    }
    onUnlock();
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-ink/15 bg-white/90 p-7 shadow-sm"
      >
        <h1 className="font-game text-center text-[1.6rem] text-ink">{GAME_TITLE}</h1>
        <p className="mt-1 text-center text-[0.95rem] text-ink-soft">선생님 화면</p>

        <input
          type="password"
          value={value}
          autoFocus
          onChange={(event) => {
            setValue(event.target.value);
            setWrong(false);
          }}
          placeholder="암호"
          aria-label="암호"
          aria-invalid={wrong}
          className="mt-5 w-full rounded-lg border border-ink/25 px-4 py-3 text-center text-[1.1rem] outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/40"
        />

        {wrong && (
          <p role="alert" className="mt-2 text-center text-[0.9rem] text-berry">
            암호가 맞지 않아요.
          </p>
        )}

        <button
          type="submit"
          className="font-body mt-4 w-full rounded-lg border border-leaf-dark bg-leaf py-3 text-[1rem] font-medium text-white transition hover:bg-leaf-dark"
        >
          들어가기
        </button>
      </form>
    </div>
  );
}

export function useUnlocked(): [boolean, () => void] {
  const [unlocked, setUnlocked] = useState(() => !passcodeRequired() || remembered());
  return [unlocked, () => setUnlocked(true)];
}
