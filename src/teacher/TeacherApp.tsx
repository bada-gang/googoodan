/**
 * 선생님 화면. (명세 73, Phase 9)
 *
 * 학생 게임과 분리된 페이지다 (teacher.html). 그래서 Phaser 도 게임 스토어도 여기 없다.
 * 학생 데이터는 게임과 똑같은 저장소 인터페이스로만 읽는다.
 */
import { useState } from 'react';
import { GAME_TITLE } from '@/config/strings';
import { AddStudentForm } from './AddStudentForm';
import { PasscodeGate, useUnlocked } from './PasscodeGate';
import { StudentDetail } from './StudentDetail';
import { StudentTable } from './StudentTable';
import { formatAccuracy, type StudentRow } from './summary';
import { useClassData } from './useClassData';
import { AccuracyBar, Banner, Button, Card, EmptyNote } from './ui';

export function TeacherApp(): React.ReactElement {
  const [unlocked, unlock] = useUnlocked();
  const state = useClassData(unlocked);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  if (!unlocked) return <PasscodeGate onUnlock={unlock} />;

  const rows = state.data?.rows ?? [];
  const summary = state.data?.summary;
  const selected: StudentRow | undefined = rows.find((r) => r.profile.id === selectedId);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1100px] flex-col gap-5 px-5 py-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-game text-[1.9rem] text-ink">{GAME_TITLE} · 선생님 화면</h1>
          <p className="text-[0.9rem] text-ink-soft">
            학생들의 곱셈구구 기록을 봅니다. 이 화면은 학생 게임과 분리돼 있어요.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => void state.refresh()} disabled={state.loading}>
            {state.loading ? '읽는 중…' : '새로고침'}
          </Button>
          <Button tone="primary" onClick={() => setAdding(true)}>
            학생 추가
          </Button>
        </div>
      </header>

      {state.storage === 'local' && (
        <Banner tone="error">
          서버에 연결하지 못해 <strong>이 브라우저에 저장된 데이터만</strong> 보고 있어요. 학생
          태블릿의 기록은 여기 나타나지 않습니다. Firebase 설정(.env.local)과 Firestore 규칙을
          확인해 주세요.
        </Banner>
      )}

      {state.error && (
        <Banner tone="error">학생 목록을 읽지 못했어요 ({state.error}).</Banner>
      )}

      {summary && (
        <Card title="반 전체">
          <p className="text-[1rem] text-ink">
            학생 {summary.studentCount}명
            {summary.studentCount > 0 && ` (${summary.activeCount}명이 문제를 풀었어요)`} · 푼 문제{' '}
            {summary.totalAttempts}개 · 정답률 {formatAccuracy(summary.accuracy)}
          </p>

          <div className="mt-5 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="font-game text-[1.1rem] text-ink">단별 정답률</h3>
              <div className="mt-3 flex flex-col gap-2">
                {summary.byTable.map((table) => (
                  <AccuracyBar
                    key={table.table}
                    label={`${table.table}단`}
                    value={table.accuracy}
                    attempts={table.attempts}
                  />
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-game text-[1.1rem] text-ink">반에서 자주 틀리는 문제</h3>
              {summary.weakProblems.length === 0 ? (
                <EmptyNote>아직 틀린 문제가 없어요.</EmptyNote>
              ) : (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {summary.weakProblems.map((problem) => (
                    <li
                      key={problem.key}
                      className="rounded-lg border border-berry/30 bg-berry/10 px-3 py-2"
                    >
                      <span className="font-game block text-[1.15rem] leading-tight text-ink">
                        {problem.left} × {problem.right}
                      </span>
                      <span className="block text-[0.8rem] text-ink-soft tabular-nums">
                        {problem.wrong}번 틀림
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Card>
      )}

      <Card title="학생">
        {state.data === null && state.loading ? (
          <EmptyNote>불러오는 중이에요…</EmptyNote>
        ) : (
          <StudentTable rows={rows} onSelect={(row) => setSelectedId(row.profile.id)} />
        )}
      </Card>

      <p className="pb-4 text-center text-[0.8rem] text-ink-soft">
        학생 이름을 클릭하면 그 학생의 단별 정답률과 자주 틀리는 문제를 볼 수 있어요.
      </p>

      {selected && (
        <StudentDetail
          row={selected}
          onClose={() => setSelectedId(null)}
          onReset={state.resetStudent}
          onRemove={state.removeStudent}
          onSetMoney={state.setMoney}
        />
      )}

      {adding && (
        <AddStudentForm
          existing={rows.map((row) => row.profile)}
          onAdd={state.addStudents}
          onClose={() => setAdding(false)}
        />
      )}
    </div>
  );
}
