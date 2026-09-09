/**
 * 설정. 배경음/효과음을 각각 끌 수 있어야 한다. (명세 61)
 * 오늘의 학습 상황도 여기서 가볍게 보여준다.
 */
import { storageMode } from '@/data';
import { placeholderCount } from '@/game/placeholder';
import { useGameStore } from '@/state/gameStore';
import { useSettingsStore } from '@/state/settingsStore';
import { useUiStore } from '@/state/uiStore';
import { GameButton, OverlayShell } from '../common/ui';
import { audio } from '@/audio/sfx';

function Toggle({
  label,
  on,
  onToggle,
}: {
  label: string;
  on: boolean;
  onToggle: () => void;
}): React.ReactElement {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => {
        audio.play('tap');
        onToggle();
      }}
      className="panel-paper flex min-h-[68px] w-full items-center justify-between px-5 py-3"
    >
      <span className="font-game text-[1.35rem]">{label}</span>
      <span
        className={[
          'relative h-[38px] w-[76px] rounded-full border-4 border-ink transition-colors',
          on ? 'bg-leaf' : 'bg-white',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-[1px] h-[26px] w-[26px] rounded-full border-[3px] border-ink bg-cream transition-all',
            on ? 'left-[38px]' : 'left-[2px]',
          ].join(' ')}
        />
      </span>
    </button>
  );
}

export function SettingsOverlay(): React.ReactElement {
  const closeOverlay = useUiStore((s) => s.closeOverlay);
  const settings = useSettingsStore();
  const stats = useGameStore((s) => s.stats);
  const tables = useGameStore((s) => s.selectedTables);
  const level = useGameStore((s) => s.level);

  const accuracy =
    stats.totalAttempts > 0 ? Math.round((stats.totalCorrect / stats.totalAttempts) * 100) : 0;

  return (
    <OverlayShell title="설정" onClose={closeOverlay}>
      <div className="flex flex-col gap-3">
        <Toggle
          label="배경음"
          on={settings.bgmOn}
          onToggle={() => {
            settings.toggle('bgmOn');
            audio.setBgmEnabled(!settings.bgmOn);
          }}
        />
        <Toggle
          label="효과음"
          on={settings.sfxOn}
          onToggle={() => {
            settings.toggle('sfxOn');
            audio.setSfxEnabled(!settings.sfxOn);
          }}
        />
        <Toggle
          label="왼손잡이 버튼 배치"
          on={settings.leftHanded}
          onToggle={() => settings.toggle('leftHanded')}
        />

        <div className="panel-paper mt-2 flex flex-col gap-1 px-5 py-4">
          <p className="font-game text-[1.35rem]">오늘까지의 기록</p>
          <p className="font-game text-[1.15rem] text-ink-soft">
            푼 문제 {stats.totalAttempts}개 · 맞힌 문제 {stats.totalCorrect}개 · 정답률 {accuracy}%
          </p>
          <p className="font-game text-[1.15rem] text-ink-soft">
            지금 연습하는 단: {tables.length > 0 ? `${tables.join(', ')}단` : '없음'} · 레벨 {level}
          </p>
        </div>

        <div className="panel-paper flex items-center justify-between gap-3 px-5 py-3">
          <p className="font-game text-[1.2rem]">저장 위치</p>
          <p className="font-game text-[1.15rem] text-ink-soft">
            {storageMode() === 'firebase' ? '서버에 저장 중' : '이 기기에만 저장'}
          </p>
        </div>

        {placeholderCount() > 0 && (
          <p className="font-game px-2 text-center text-[1rem] text-ink-soft">
            지금 화면의 그림은 임시(placeholder) 아트예요. 실제 게임 아트로 교체할 수 있어요.
          </p>
        )}

        <GameButton
          className="mt-1 w-full"
          onClick={() => {
            audio.setBgmEnabled(false);
            window.location.reload();
          }}
        >
          다른 이름으로 다시 시작하기
        </GameButton>
      </div>
    </OverlayShell>
  );
}
