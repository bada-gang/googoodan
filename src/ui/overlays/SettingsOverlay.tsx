/**
 * 설정. 배경음/효과음을 각각 끌 수 있어야 한다. (명세 61)
 * 오늘의 학습 상황도 여기서 가볍게 보여준다.
 */
import { useState } from 'react';
import { storageMode } from '@/data';
import { placeholderCount } from '@/game/placeholder';
import { useGameStore } from '@/state/gameStore';
import { flushSave, stopAutoSave } from '@/state/persistence';
import { useSettingsStore } from '@/state/settingsStore';
import { useUiStore } from '@/state/uiStore';
import { GameButton, OverlayShell } from '../common/ui';
import { audio } from '@/audio/sfx';
import { enterFullscreen, exitFullscreen, isFullscreenSupported } from '../fullscreen';

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
  const setScreen = useUiStore((s) => s.setScreen);
  const settings = useSettingsStore();
  const stats = useGameStore((s) => s.stats);
  const tables = useGameStore((s) => s.selectedTables);
  const level = useGameStore((s) => s.level);
  const [confirming, setConfirming] = useState(false);
  const [ending, setEnding] = useState(false);

  const accuracy =
    stats.totalAttempts > 0 ? Math.round((stats.totalCorrect / stats.totalAttempts) * 100) : 0;

  /**
   * 게임을 끝낸다. 순서가 중요하다.
   * 저장이 **끝날 때까지 기다린** 뒤에 화면을 넘겨야 마지막 수확·정답이 빠지지 않는다.
   * (기존 "다시 시작하기"는 새로고침이라 저장이 중간에 끊길 수 있다.)
   */
  const endGame = async () => {
    if (ending) return;
    setEnding(true);
    audio.setBgmEnabled(false);
    try {
      stopAutoSave();
      await flushSave();
    } catch (error) {
      console.error('[settings] 마지막 저장에 실패했습니다.', error);
    }
    // 수업이 끝났으니 전체화면에서도 나온다. 태블릿을 걷을 때 빠져나올 방법이 없으면 곤란하다.
    await exitFullscreen();
    closeOverlay();
    setScreen('ended');
  };

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

        {isFullscreenSupported() && (
          <Toggle
            label="전체화면"
            on={settings.fullscreen}
            onToggle={() => {
              const next = !settings.fullscreen;
              settings.set('fullscreen', next);
              // 이 탭 자체가 사용자 제스처라 지금 바로 전환할 수 있다
              void (next ? enterFullscreen() : exitFullscreen());
            }}
          />
        )}

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

        {/*
          맨 아래 종료 버튼. 한 번 더 묻는다 — 잘못 눌러서 판이 끝나면
          2학년에게는 되돌릴 방법이 없다.
        */}
        {confirming ? (
          <div className="panel-paper mt-1 flex flex-col items-center gap-3 px-5 py-4">
            <p className="font-game text-center text-[1.3rem] text-ink">
              게임을 끝낼까요? 지금까지 한 것은 저장돼요.
            </p>
            <div className="flex gap-3">
              <GameButton onClick={() => setConfirming(false)}>더 할래요</GameButton>
              <GameButton tone="berry" disabled={ending} onClick={() => void endGame()}>
                {ending ? '저장 중…' : '네, 끝낼래요'}
              </GameButton>
            </div>
          </div>
        ) : (
          <GameButton tone="berry" className="w-full" onClick={() => setConfirming(true)}>
            게임 종료
          </GameButton>
        )}
      </div>
    </OverlayShell>
  );
}
