/**
 * 게임 HUD 스타일의 공통 UI 부품.
 * 웹 대시보드/모달이 아니라 나무 간판·종이 메모 느낌을 목표로 한다. (명세 53)
 */
import type { ReactNode } from 'react';
import { coinIcon } from './icons';
import { formatMoney } from '@/config/strings';
import { audio } from '@/audio/sfx';

type ButtonTone = 'plain' | 'gold' | 'leaf' | 'sky' | 'berry';

const TONE_CLASS: Record<ButtonTone, string> = {
  plain: '',
  gold: 'btn-gold',
  leaf: 'btn-leaf',
  sky: 'btn-sky',
  berry: 'btn-berry',
};

export interface GameButtonProps {
  children: ReactNode;
  onClick?: () => void;
  tone?: ButtonTone;
  disabled?: boolean;
  /** 큰 주요 행동 버튼 */
  big?: boolean;
  glow?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function GameButton({
  children,
  onClick,
  tone = 'plain',
  disabled,
  big,
  glow,
  className = '',
  ariaLabel,
}: GameButtonProps): React.ReactElement {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        audio.play('tap');
        onClick?.();
      }}
      className={[
        'btn-game',
        TONE_CLASS[tone],
        big ? 'min-h-[76px] px-8 text-[1.75rem]' : '',
        glow ? 'animate-glow' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </button>
  );
}

export function Icon({
  src,
  size = 40,
  alt = '',
  className = '',
}: {
  src: string;
  size?: number;
  alt?: string;
  className?: string;
}): React.ReactElement {
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      draggable={false}
      className={`select-none object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export function MoneyTag({ amount, size = 30 }: { amount: number; size?: number }): React.ReactElement {
  return (
    <span className="text-game inline-flex items-center gap-1.5 whitespace-nowrap">
      <Icon src={coinIcon()} size={size} alt="돈" />
      {formatMoney(amount)}
    </span>
  );
}

/** 물·먹이처럼 개수를 세는 소모품 표시 */
export function SupplyTag({
  icon,
  count,
  label,
  size = 30,
}: {
  icon: string;
  count: number;
  label: string;
  size?: number;
}): React.ReactElement {
  return (
    <span className="text-game inline-flex items-center gap-1.5 whitespace-nowrap">
      <Icon src={icon} size={size} alt={label} />
      {count}
    </span>
  );
}

/** 나무 간판 형태의 제목 띠 */
export function SignTitle({ children }: { children: ReactNode }): React.ReactElement {
  return (
    <div className="relative -mt-9 mb-1 flex justify-center">
      <div
        className="text-game rounded-2xl border-4 border-ink px-7 py-2 text-[1.7rem] text-ink"
        style={{
          background: 'linear-gradient(180deg, #ffe9b8 0%, #f6c453 100%)',
          boxShadow: '0 6px 0 rgba(74,58,47,0.3)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

export interface OverlayShellProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** 넓은 목록형 오버레이 */
  wide?: boolean;
  footer?: ReactNode;
}

/** 게임 세계 안의 안내판처럼 보이는 오버레이 (명세 53, 55) */
export function OverlayShell({
  title,
  onClose,
  children,
  wide,
  footer,
}: OverlayShellProps): React.ReactElement {
  return (
    <div className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center p-[2%]">
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(48,38,30,0.45)]"
      />
      <div
        className={`panel-wood animate-pop-in relative flex max-h-full w-full flex-col p-5 pt-8 ${
          wide ? 'max-w-[1080px]' : 'max-w-[720px]'
        }`}
      >
        <SignTitle>{title}</SignTitle>
        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-1 py-2">{children}</div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex-1">{footer}</div>
          <GameButton tone="berry" onClick={onClose}>
            닫기
          </GameButton>
        </div>
      </div>
    </div>
  );
}

/** 상점·가방에서 쓰는 아이템 카드 */
export function ItemCard({
  icon,
  name,
  sub,
  price,
  count,
  disabled,
  selected,
  onClick,
  actionLabel,
}: {
  icon: string;
  name: string;
  sub?: string;
  price?: number;
  count?: number;
  disabled?: boolean;
  selected?: boolean;
  onClick?: () => void;
  actionLabel?: string;
}): React.ReactElement {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        audio.play('tap');
        onClick?.();
      }}
      className={[
        'panel-paper relative flex min-h-[132px] w-full flex-col items-center justify-center gap-1 px-2 py-3 text-center transition',
        selected ? 'ring-4 ring-gold ring-offset-2' : '',
        disabled ? 'opacity-55 grayscale' : 'active:translate-y-[3px]',
      ].join(' ')}
    >
      <Icon src={icon} size={62} alt="" />
      <span className="text-game text-[1.15rem] leading-tight">{name}</span>
      {sub && <span className="text-[0.9rem] text-ink-soft">{sub}</span>}
      {price !== undefined && (
        <span className="text-game text-[1.05rem]">
          <MoneyTag amount={price} size={22} />
        </span>
      )}
      {count !== undefined && count > 0 && (
        <span className="text-game absolute -top-2 -right-2 flex h-9 min-w-9 items-center justify-center rounded-full border-4 border-ink bg-gold px-1 text-[1.05rem]">
          {count}
        </span>
      )}
      {actionLabel && (
        <span className="text-game mt-1 rounded-xl border-2 border-ink bg-white/70 px-2 py-0.5 text-[0.95rem]">
          {actionLabel}
        </span>
      )}
    </button>
  );
}

export function EmptyNote({ children }: { children: ReactNode }): React.ReactElement {
  return (
    <p className="text-game py-10 text-center text-[1.25rem] text-ink-soft">{children}</p>
  );
}
