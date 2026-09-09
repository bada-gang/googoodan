/**
 * 상단 HUD. 항상 보이는 정보는 최소한으로. (명세 37, 54)
 */
import { expToNextLevel } from '@/config/balance';
import { formatMoney } from '@/config/strings';
import { useGameStore } from '@/state/gameStore';
import { useUiStore } from '@/state/uiStore';
import { ASSETS } from '@/config/assets';
import { avatarIcon, coinIcon, iconUrl, starIcon } from '../common/icons';
import { Icon } from '../common/ui';
import { audio } from '@/audio/sfx';

export function GameHUD(): React.ReactElement {
  const level = useGameStore((s) => s.level);
  const experience = useGameStore((s) => s.experience);
  const money = useGameStore((s) => s.money);
  const profile = useGameStore((s) => s.profile);
  const water = useGameStore((s) => s.inventory.water ?? 0);
  const feed = useGameStore((s) => s.inventory.feed ?? 0);
  const openOverlay = useUiStore((s) => s.openOverlay);

  const needed = expToNextLevel(level);
  const ratio = Number.isFinite(needed) ? Math.min(1, experience / needed) : 1;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-3">
      <div className="pointer-events-auto flex items-center gap-2">
        {profile && (
          <div className="hud-pill pr-4">
            <Icon src={avatarIcon(profile.avatarId)} size={40} alt="" />
            <span className="max-w-[7ch] truncate">{profile.displayName}</span>
          </div>
        )}

        <div className="hud-pill gap-3 pr-5">
          <Icon src={starIcon()} size={38} alt="레벨" />
          <span>Lv.{level}</span>
          <span
            className="relative h-[18px] w-[130px] overflow-hidden rounded-full border-[3px] border-ink bg-white/70"
            role="img"
            aria-label={`경험치 ${experience} / ${Number.isFinite(needed) ? needed : '최대'}`}
          >
            <span
              className="absolute inset-y-0 left-0 rounded-full bg-leaf transition-[width] duration-300"
              style={{ width: `${ratio * 100}%` }}
            />
          </span>
          <span className="text-[1.05rem] text-ink-soft">
            {Number.isFinite(needed) ? `${experience}/${needed}` : 'MAX'}
          </span>
        </div>
      </div>

      <div className="pointer-events-auto flex items-center gap-2">
        {/* 물·먹이 남은 양 (명세 요청 8) */}
        <div className="hud-pill gap-3 pr-5">
          <Icon src={iconUrl(ASSETS.ui.waterCan)} size={38} alt="물" />
          <span className={water === 0 ? 'text-berry' : undefined}>{water}</span>
          <Icon src={iconUrl(ASSETS.ui.feedBag)} size={36} alt="먹이" />
          <span className={feed === 0 ? 'text-berry' : undefined}>{feed}</span>
        </div>

        <div className="hud-pill">
          <Icon src={coinIcon()} size={40} alt="돈" />
          <span>{formatMoney(money)}</span>
        </div>

        <button
          type="button"
          aria-label="설정"
          onClick={() => {
            audio.play('tap');
            openOverlay('settings');
          }}
          className="btn-game h-[58px] w-[58px] rounded-full px-0"
        >
          <GearGlyph />
        </button>
      </div>
    </div>
  );
}

/** 설정 아이콘. 이모지 대신 SVG 로 그린다. (명세 5) */
function GearGlyph(): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
      <path
        d="M12 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8Zm8.3 3.4c0 .5 0 1-.1 1.4l2 1.5-1.9 3.3-2.4-.9c-.7.6-1.5 1-2.3 1.3l-.4 2.5h-3.8l-.4-2.5c-.8-.3-1.6-.7-2.3-1.3l-2.4 1-1.9-3.4 2-1.5a9 9 0 0 1 0-2.8l-2-1.5 1.9-3.3 2.4.9c.7-.6 1.5-1 2.3-1.3l.4-2.5h3.8l.4 2.5c.8.3 1.6.7 2.3 1.3l2.4-1 1.9 3.4-2 1.5c.1.4.1.9.1 1.4Z"
        fill="#4a3a2f"
      />
    </svg>
  );
}
