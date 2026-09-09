/**
 * 레벨업 안내. 새로 열린 콘텐츠를 알려 준다. (명세 33)
 */
import { unlocksAtLevel } from '@/config/balance';
import { useUiStore } from '@/state/uiStore';
import { starIcon } from '../common/icons';
import { GameButton, Icon } from '../common/ui';

export function LevelUpOverlay(): React.ReactElement | null {
  const level = useUiStore((s) => s.levelUpTo);
  const showLevelUp = useUiStore((s) => s.showLevelUp);

  if (level === null) return null;
  const unlock = unlocksAtLevel(level);

  return (
    <div className="pointer-events-auto absolute inset-0 z-[45] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-[rgba(48,38,30,0.45)]" />
      <div className="panel-wood animate-pop-in relative flex w-[560px] flex-col items-center gap-3 px-8 py-8">
        <div className="flex gap-2">
          <Icon src={starIcon()} size={48} alt="" />
          <Icon src={starIcon()} size={64} alt="" />
          <Icon src={starIcon()} size={48} alt="" />
        </div>
        <p className="font-game text-[2.6rem] leading-none text-ink stroke-ink">
          레벨 {level}이 되었어요!
        </p>
        {unlock && (
          <p className="font-game text-center text-[1.4rem] text-ink-soft">
            새로 열렸어요 — {unlock.label}
          </p>
        )}
        <GameButton tone="gold" big onClick={() => showLevelUp(null)}>
          좋아요!
        </GameButton>
      </div>
    </div>
  );
}
