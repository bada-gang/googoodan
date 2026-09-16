/**
 * 교사 화면이 보여줄 숫자를 만드는 순수 함수들. (명세 73)
 *
 * 화면 컴포넌트에서 계산하지 않고 여기로 모은다.
 * 저장소도 React 도 모르는 코드라, 집계 규칙이 의심스러우면 여기만 보면 된다. (개발원칙 9)
 */
import { TABLES } from '@/config/curriculum';
import type { GameSaveData, PlayerProfile } from '@/types/game';
import type { LearningStats, ProblemRecord } from '@/types/learning';

/** 단 목록은 @/config/curriculum 한 곳에만 있다. 교사 화면 코드는 그대로 다시 내보낸다. */
export { TABLES };

export interface TableAccuracy {
  table: number;
  attempts: number;
  correct: number;
  /** 0~100. 아직 안 푼 단은 null — 0% 로 보이면 "다 틀렸다"로 오해한다. */
  accuracy: number | null;
}

export interface WeakProblem {
  key: string;
  left: number;
  right: number;
  attempts: number;
  wrong: number;
  accuracy: number;
}

/** 저장본에서 선생님 화면이 쓰는 부분만 */
export type SaveSummary = Pick<GameSaveData, 'level' | 'money'>;

export interface StudentRow {
  profile: PlayerProfile;
  /** 저장본이 없으면 null — 이름만 만들어 두고 아직 시작하지 않은 학생 */
  level: number | null;
  /** 가진 돈. 저장본이 없으면 null (아직 시작 안 함) */
  money: number | null;
  totalAttempts: number;
  totalCorrect: number;
  accuracy: number | null;
  byTable: TableAccuracy[];
  /** 틀린 횟수 순 전체 목록. 화면에서 필요한 만큼 잘라 쓴다. */
  weakProblems: WeakProblem[];
  /** 이 학생 데이터를 읽다가 실패했으면 그 사유 */
  loadError: string | null;
}

export interface ClassSummary {
  studentCount: number;
  /** 한 문제라도 푼 학생 수 */
  activeCount: number;
  totalAttempts: number;
  totalCorrect: number;
  accuracy: number | null;
  byTable: TableAccuracy[];
  weakProblems: WeakProblem[];
}

/** 0으로 나누지 않는 백분율. 시도가 없으면 null. */
export function percent(correct: number, attempts: number): number | null {
  if (attempts <= 0) return null;
  return Math.round((correct / attempts) * 100);
}

/**
 * 8개 단을 모두 돌려준다.
 * 아직 안 고른 단도 줄에 남아 있어야 "이 단은 아예 연습을 안 했다"가 보인다.
 */
export function tableAccuracies(byTable: LearningStats['byTable']): TableAccuracy[] {
  return TABLES.map((table) => {
    const row = byTable?.[table];
    const attempts = row?.attempts ?? 0;
    const correct = row?.correct ?? 0;
    return { table, attempts, correct, accuracy: percent(correct, attempts) };
  });
}

function toWeakProblem(record: ProblemRecord): WeakProblem {
  const wrong = Math.max(0, record.attempts - record.correct);
  return {
    key: record.key,
    left: record.left,
    right: record.right,
    attempts: record.attempts,
    wrong,
    accuracy: percent(record.correct, record.attempts) ?? 0,
  };
}

/**
 * 자주 틀리는 문제를 틀린 횟수 순으로 전부 돌려준다.
 * 틀린 횟수를 먼저 보는 이유: 정답률만 보면 한 번 풀고 틀린 문제가 맨 위로 올라온다.
 *
 * 여기서 자르지 않는다. 잘라 두면 반 전체를 합칠 때 학생마다 상위 몇 개만 더해져
 * 반 순위가 조용히 틀어진다. 화면에서 필요한 만큼 slice 한다.
 */
export function weakProblems(byProblem: LearningStats['byProblem']): WeakProblem[] {
  return Object.values(byProblem ?? {})
    .map(toWeakProblem)
    .filter((p) => p.wrong > 0)
    .sort((a, b) => b.wrong - a.wrong || a.accuracy - b.accuracy || b.attempts - a.attempts);
}

export function buildStudentRow(
  profile: PlayerProfile,
  stats: LearningStats | null,
  save: SaveSummary | null,
  loadError: string | null = null,
): StudentRow {
  const totalAttempts = stats?.totalAttempts ?? 0;
  const totalCorrect = stats?.totalCorrect ?? 0;
  return {
    profile,
    level: save?.level ?? null,
    money: save?.money ?? null,
    totalAttempts,
    totalCorrect,
    accuracy: percent(totalCorrect, totalAttempts),
    byTable: tableAccuracies(stats?.byTable ?? {}),
    weakProblems: weakProblems(stats?.byProblem ?? {}),
    loadError,
  };
}

/**
 * 반 전체 합계.
 * 학생별 정답률의 평균이 아니라 문제 수로 합친다 — 두 문제 푼 학생이 반 평균을 흔들면 안 된다.
 */
export function summarizeClass(rows: StudentRow[]): ClassSummary {
  const byTable = TABLES.map((table) => ({ table, attempts: 0, correct: 0, accuracy: null as number | null }));
  const byProblem = new Map<string, WeakProblem>();

  let totalAttempts = 0;
  let totalCorrect = 0;
  let activeCount = 0;

  for (const row of rows) {
    totalAttempts += row.totalAttempts;
    totalCorrect += row.totalCorrect;
    if (row.totalAttempts > 0) activeCount += 1;

    row.byTable.forEach((t, index) => {
      byTable[index].attempts += t.attempts;
      byTable[index].correct += t.correct;
    });

    for (const problem of row.weakProblems) {
      const found = byProblem.get(problem.key);
      if (found) {
        found.attempts += problem.attempts;
        found.wrong += problem.wrong;
      } else {
        byProblem.set(problem.key, { ...problem });
      }
    }
  }

  for (const t of byTable) t.accuracy = percent(t.correct, t.attempts);

  const classWeak = [...byProblem.values()]
    .map((p) => ({ ...p, accuracy: percent(p.attempts - p.wrong, p.attempts) ?? 0 }))
    .sort((a, b) => b.wrong - a.wrong || a.accuracy - b.accuracy)
    .slice(0, 10);

  return {
    studentCount: rows.length,
    activeCount,
    totalAttempts,
    totalCorrect,
    accuracy: percent(totalCorrect, totalAttempts),
    byTable,
    weakProblems: classWeak,
  };
}

/* -------------------------------- 표시 형식 -------------------------------- */

export function formatAccuracy(value: number | null): string {
  return value === null ? '–' : `${value}%`;
}

/** "오늘 14:32" / "어제" / "3일 전" / "2026-08-14" */
export function formatLastPlayed(iso: string | null | undefined, now = new Date()): string {
  if (!iso) return '아직 안 함';
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return '알 수 없음';

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(then)) / 86_400_000);

  if (days <= 0) {
    const hh = String(then.getHours()).padStart(2, '0');
    const mm = String(then.getMinutes()).padStart(2, '0');
    return `오늘 ${hh}:${mm}`;
  }
  if (days === 1) return '어제';
  if (days < 7) return `${days}일 전`;
  return then.toLocaleDateString('ko-KR');
}

/**
 * 가장 약한 단.
 * 최소 시도 수를 두는 이유: 한 문제 풀고 틀린 단이 "제일 약한 단"으로 뜨면 오해한다.
 */
export function weakestTable(byTable: TableAccuracy[], minAttempts = 3): TableAccuracy | null {
  const candidates = byTable.filter((t) => t.attempts >= minAttempts && t.accuracy !== null);
  if (candidates.length === 0) return null;
  return candidates.reduce((worst, t) => ((t.accuracy ?? 100) < (worst.accuracy ?? 100) ? t : worst));
}
