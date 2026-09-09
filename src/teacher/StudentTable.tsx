/**
 * 학생 목록 표. (명세 73)
 * 한 줄에 담는 것: 이름 · 레벨 · 문제 풀이 수 · 전체 정답률 · 가장 약한 단 · 마지막 플레이.
 * 단별 정답률과 자주 틀리는 문제는 줄을 눌러 상세에서 본다.
 *
 * 캐릭터 이름은 평소에 감춘다. 선생님에게는 군더더기다.
 * 같은 이름이 둘 이상일 때만 보여 준다 — 그때는 이름만으로 누가 누군지 알 수 없다. (명세 10)
 */
import { useMemo, useState } from 'react';
import { avatarName } from '@/config/strings';
import { formatLastPlayed, weakestTable, type StudentRow } from './summary';
import { AccuracyPill, EmptyNote } from './ui';

type SortKey = 'name' | 'level' | 'attempts' | 'accuracy' | 'lastPlayed';

const COLUMNS: { key: SortKey; label: string; align: 'left' | 'right' | 'center' }[] = [
  { key: 'name', label: '이름', align: 'left' },
  { key: 'level', label: '레벨', align: 'right' },
  { key: 'attempts', label: '푼 문제', align: 'right' },
  { key: 'accuracy', label: '정답률', align: 'right' },
  { key: 'lastPlayed', label: '마지막 플레이', align: 'right' },
];

/** 정렬 기준별 비교값. 아직 안 한 학생은 항상 아래로 내린다. */
function compare(a: StudentRow, b: StudentRow, key: SortKey): number {
  switch (key) {
    case 'level':
      return (b.level ?? -1) - (a.level ?? -1);
    case 'attempts':
      return b.totalAttempts - a.totalAttempts;
    case 'accuracy':
      return (b.accuracy ?? -1) - (a.accuracy ?? -1);
    case 'lastPlayed':
      return (b.profile.lastPlayedAt ?? '').localeCompare(a.profile.lastPlayedAt ?? '');
    default:
      return a.profile.displayName.localeCompare(b.profile.displayName, 'ko-KR');
  }
}

/** 두 번 이상 나오는 이름 */
function duplicatedNames(rows: StudentRow[]): Set<string> {
  const seen = new Set<string>();
  const twice = new Set<string>();
  for (const row of rows) {
    const name = row.profile.displayName;
    if (seen.has(name)) twice.add(name);
    seen.add(name);
  }
  return twice;
}

export function StudentTable({
  rows,
  onSelect,
}: {
  rows: StudentRow[];
  onSelect: (row: StudentRow) => void;
}): React.ReactElement {
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const duplicated = useMemo(() => duplicatedNames(rows), [rows]);

  const sorted = useMemo(
    () => [...rows].sort((a, b) => compare(a, b, sortKey)),
    [rows, sortKey],
  );

  if (rows.length === 0) {
    return <EmptyNote>아직 등록된 학생이 없어요. “학생 추가”로 이름을 만들어 두세요.</EmptyNote>;
  }

  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <table className="w-full min-w-[720px] border-collapse text-[0.95rem]">
        <thead>
          <tr className="border-b border-ink/15 text-ink-soft">
            {COLUMNS.map((column) => (
              <th
                key={column.key}
                scope="col"
                aria-sort={sortKey === column.key ? 'descending' : 'none'}
                className={[
                  'px-3 py-2 font-medium',
                  column.align === 'right' ? 'text-right' : 'text-left',
                ].join(' ')}
              >
                <button
                  type="button"
                  onClick={() => setSortKey(column.key)}
                  className={[
                    'font-body rounded px-1 py-0.5 transition hover:text-ink',
                    sortKey === column.key ? 'text-ink underline decoration-gold decoration-2 underline-offset-4' : '',
                  ].join(' ')}
                >
                  {column.label}
                </button>
              </th>
            ))}
            <th scope="col" className="px-3 py-2 text-left font-medium">
              가장 약한 단
            </th>
          </tr>
        </thead>

        <tbody>
          {sorted.map((row) => {
            const weakest = weakestTable(row.byTable);
            return (
              <tr
                key={row.profile.id}
                onClick={() => onSelect(row)}
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelect(row);
                  }
                }}
                className="cursor-pointer border-b border-ink/8 transition hover:bg-cream/70 focus:bg-cream focus:outline-none"
              >
                <td className="px-3 py-2.5">
                  <span className="font-game text-[1.1rem] text-ink">{row.profile.displayName}</span>
                  {duplicated.has(row.profile.displayName) && (
                    <span className="ml-2 text-[0.85rem] text-ink-soft">
                      {avatarName(row.profile.avatarId)}
                    </span>
                  )}
                  {row.loadError && (
                    <span className="ml-2 text-[0.8rem] text-berry">읽기 실패</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {row.level === null ? <span className="text-ink-soft">–</span> : `Lv.${row.level}`}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {row.totalAttempts > 0 ? row.totalAttempts : <span className="text-ink-soft">–</span>}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <AccuracyPill value={row.accuracy} />
                </td>
                <td className="px-3 py-2.5 text-right text-ink-soft tabular-nums">
                  {formatLastPlayed(row.profile.lastPlayedAt)}
                </td>
                <td className="px-3 py-2.5">
                  {weakest ? (
                    <span className="font-game text-[1.05rem]">
                      {weakest.table}단{' '}
                      <span className="font-body text-[0.85rem] text-ink-soft">
                        {weakest.accuracy}%
                      </span>
                    </span>
                  ) : (
                    <span className="text-[0.85rem] text-ink-soft">아직 판단하기 일러요</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
