/**
 * 교사 화면 공용 부품.
 *
 * 학생 게임의 두꺼운 나무 버튼(.btn-game)을 쓰지 않는다.
 * 여기는 표를 읽는 화면이라 글자가 작고 정보 밀도가 높아야 한다.
 */
import type { ReactNode } from 'react';
import { formatAccuracy } from './summary';

export function Card({
  title,
  right,
  children,
}: {
  title?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
}): React.ReactElement {
  return (
    <section className="rounded-2xl border border-ink/15 bg-white/80 shadow-sm">
      {(title || right) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-5 py-3">
          <h2 className="font-game text-[1.35rem] text-ink">{title}</h2>
          {right}
        </header>
      )}
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

type Tone = 'plain' | 'primary' | 'danger';

const TONE: Record<Tone, string> = {
  plain: 'border-ink/25 bg-white text-ink hover:bg-cream',
  primary: 'border-leaf-dark bg-leaf text-white hover:bg-leaf-dark',
  danger: 'border-berry bg-white text-berry hover:bg-berry hover:text-white',
};

export function Button({
  tone = 'plain',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone }): React.ReactElement {
  return (
    <button
      type="button"
      {...props}
      className={[
        'font-body min-h-[38px] rounded-lg border px-3 py-1.5 text-[0.95rem] font-medium transition',
        'disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-white',
        TONE[tone],
        className,
      ].join(' ')}
    />
  );
}

/** 90% 이상 초록, 70% 이상 노랑, 그 아래 빨강. 아직 안 푼 것은 회색. */
function accuracyColor(value: number | null): string {
  if (value === null) return 'bg-ink/15';
  if (value >= 90) return 'bg-leaf';
  if (value >= 70) return 'bg-gold';
  return 'bg-berry';
}

export function AccuracyBar({
  value,
  attempts,
  label,
}: {
  value: number | null;
  attempts: number;
  label: ReactNode;
}): React.ReactElement {
  return (
    <div className="flex items-center gap-3">
      <span className="font-game w-12 shrink-0 text-[1.05rem] text-ink">{label}</span>
      <div className="relative h-5 flex-1 overflow-hidden rounded-full bg-ink/10">
        <div
          className={['h-full rounded-full transition-all', accuracyColor(value)].join(' ')}
          style={{ width: `${value ?? 0}%` }}
        />
      </div>
      <span className="w-12 shrink-0 text-right text-[0.9rem] tabular-nums text-ink">
        {formatAccuracy(value)}
      </span>
      <span className="w-16 shrink-0 text-right text-[0.85rem] tabular-nums text-ink-soft">
        {attempts > 0 ? `${attempts}문제` : '–'}
      </span>
    </div>
  );
}

export function AccuracyPill({ value }: { value: number | null }): React.ReactElement {
  if (value === null) return <span className="text-ink-soft">–</span>;
  const tone =
    value >= 90
      ? 'bg-leaf/20 text-leaf-dark'
      : value >= 70
        ? 'bg-gold/25 text-[#8a6410]'
        : 'bg-berry/15 text-berry';
  return (
    <span className={['rounded-md px-2 py-0.5 text-[0.9rem] font-semibold tabular-nums', tone].join(' ')}>
      {value}%
    </span>
  );
}

export function EmptyNote({ children }: { children: ReactNode }): React.ReactElement {
  return <p className="py-6 text-center text-[0.95rem] text-ink-soft">{children}</p>;
}

export function Banner({
  tone = 'warn',
  children,
}: {
  tone?: 'warn' | 'error';
  children: ReactNode;
}): React.ReactElement {
  return (
    <div
      role="status"
      className={[
        'rounded-xl border px-4 py-3 text-[0.95rem]',
        tone === 'error'
          ? 'border-berry/40 bg-berry/10 text-berry'
          : 'border-gold-dark/40 bg-gold/15 text-[#7a5a10]',
      ].join(' ')}
    >
      {children}
    </div>
  );
}
