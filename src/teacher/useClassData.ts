/**
 * 교사 화면이 쓰는 데이터 로딩. (명세 73)
 *
 * 학생 게임과 같은 저장소 인터페이스만 쓴다 — 교사 화면 전용 쿼리를 따로 만들지 않는다.
 * 한 학급(스무 명 남짓)이므로 학생마다 진행도·통계를 한 번씩 읽어도 부담이 없다.
 */
import { useCallback, useEffect, useState } from 'react';
import { repositories, storageMode, type StorageMode } from '@/data';
import type { AvatarId, PlayerProfile } from '@/types/game';
import { createEmptyLearningStats } from '@/types/learning';
import { buildStudentRow, summarizeClass, type ClassSummary, type StudentRow } from './summary';

export interface ClassData {
  rows: StudentRow[];
  summary: ClassSummary;
}

export interface UseClassData {
  data: ClassData | null;
  loading: boolean;
  /** 목록 자체를 못 읽은 경우 */
  error: string | null;
  storage: StorageMode;
  refresh: () => Promise<void>;
  /** 명단을 한 번에 등록한다. 다 끝난 뒤 한 번만 다시 읽는다. */
  addStudents: (entries: { displayName: string; avatarId: AvatarId }[]) => Promise<void>;
  /** 이름은 남기고 진행도·학습 기록만 지운다 */
  resetStudent: (playerId: string) => Promise<void>;
  /** 학생을 통째로 지운다 */
  removeStudent: (playerId: string) => Promise<void>;
  /** 학생이 가진 돈을 바꾼다. 저장본이 없는(아직 시작 안 한) 학생은 바꿀 수 없다. */
  setMoney: (playerId: string, money: number) => Promise<void>;
}

function message(error: unknown): string {
  if (error && typeof error === 'object') {
    const e = error as { code?: string; message?: string };
    return e.code ?? e.message ?? String(error);
  }
  return String(error);
}

async function loadStudent(profile: PlayerProfile): Promise<StudentRow> {
  const repos = repositories();
  const [stats, save] = await Promise.all([
    repos.learning.loadStats(profile.id),
    repos.gameState.load(profile.id),
  ]);
  return buildStudentRow(profile, stats, save);
}

export function useClassData(enabled: boolean): UseClassData {
  const [data, setData] = useState<ClassData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const profiles = await repositories().player.listProfiles();

      // 한 학생을 못 읽어도 나머지는 보여준다. 그 학생 줄에만 사유를 남긴다.
      const rows = await Promise.all(
        profiles.map((profile) =>
          loadStudent(profile).catch((e) =>
            buildStudentRow(profile, null, null, message(e)),
          ),
        ),
      );

      setData({ rows, summary: summarizeClass(rows) });
    } catch (e) {
      setError(message(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) void refresh();
  }, [enabled, refresh]);

  const addStudents = useCallback(
    async (entries: { displayName: string; avatarId: AvatarId }[]) => {
      const repos = repositories();
      // 순서대로 만든다. 한꺼번에 던지면 실패한 이름이 어느 것인지 알기 어렵다.
      for (const entry of entries) {
        await repos.player.createProfile(entry.displayName, entry.avatarId);
      }
      await refresh();
    },
    [refresh],
  );

  const resetStudent = useCallback(
    async (playerId: string) => {
      const repos = repositories();
      await Promise.all([
        repos.gameState.reset(playerId),
        repos.learning.saveStats(playerId, createEmptyLearningStats()),
      ]);
      await refresh();
    },
    [refresh],
  );

  const setMoney = useCallback(
    async (playerId: string, money: number) => {
      const repos = repositories();
      const save = await repos.gameState.load(playerId);
      // 저장본이 없으면 만들지 않는다. 빈 저장본을 새로 쓰면 학생이 처음 들어올 때
      // 시작 아이템 없이 시작하게 된다.
      if (!save) throw new Error('아직 게임을 시작하지 않은 학생이에요');
      await repos.gameState.save(playerId, { ...save, money: Math.max(0, Math.round(money)) });
      await refresh();
    },
    [refresh],
  );

  const removeStudent = useCallback(
    async (playerId: string) => {
      await repositories().player.deleteProfile(playerId);
      await refresh();
    },
    [refresh],
  );

  return {
    data,
    loading,
    error,
    storage: storageMode(),
    refresh,
    addStudents,
    resetStudent,
    removeStudent,
    setMoney,
  };
}
