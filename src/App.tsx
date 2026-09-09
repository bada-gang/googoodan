/**
 * 앱 흐름: 이름 선택 -> 구구단 선택 -> 게임. (명세 8)
 *
 * 게임 셸은 항상 논리 해상도 비율(1280×800)을 유지하고,
 * React UI 는 LogicalLayer 로 같은 좌표계에서 그린 뒤 통째로 배율 조정한다.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { GAME_HEIGHT, GAME_WIDTH } from '@/config/layout';
import { useGameStore } from '@/state/gameStore';
import { startAutoSave, stopAutoSave } from '@/state/persistence';
import { useSettingsStore } from '@/state/settingsStore';
import { useUiStore } from '@/state/uiStore';
import type { PlayerProfile } from '@/types/game';
import { audio } from '@/audio/sfx';
import { LogicalLayer, useShellScale } from '@/ui/common/LogicalLayer';
import { GameScreen } from '@/ui/screens/GameScreen';
import { ProfileSelectScreen } from '@/ui/screens/ProfileSelectScreen';
import { TableSelectScreen } from '@/ui/screens/TableSelectScreen';

const ASPECT = GAME_WIDTH / GAME_HEIGHT;

export function App(): React.ReactElement {
  const screen = useUiStore((s) => s.screen);
  const setScreen = useUiStore((s) => s.setScreen);
  const beginSession = useGameStore((s) => s.beginSession);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [portrait, setPortrait] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const scale = useShellScale(shellRef);

  useEffect(() => {
    const check = () => setPortrait(window.innerHeight > window.innerWidth * 1.05);
    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);

  useEffect(() => () => stopAutoSave(), []);

  const start = useCallback(
    async (tables: number[]) => {
      if (!profile) return;
      audio.unlock();
      const { bgmOn, sfxOn } = useSettingsStore.getState();
      audio.setSfxEnabled(sfxOn);
      audio.setBgmEnabled(bgmOn);

      await beginSession(profile, tables);
      startAutoSave();
      setScreen('game');
    },
    [profile, beginSession, setScreen],
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#2b332d]">
      <div
        ref={shellRef}
        className="bg-sky-soft relative overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.45)]"
        style={{
          width: `min(100vw, calc(100vh * ${ASPECT}))`,
          height: `min(100vh, calc(100vw / ${ASPECT}))`,
        }}
      >
        {/* Phaser 캔버스는 Phaser 의 Scale Manager 가 직접 맞춘다 (선명도 유지) */}
        {screen === 'game' && <GameScreen.Canvas />}

        <LogicalLayer scale={scale}>
          {screen === 'profile' && (
            <ProfileSelectScreen
              onReady={(selected) => {
                setProfile(selected);
                setScreen('tables');
              }}
            />
          )}

          {screen === 'tables' && profile && (
            <TableSelectScreen
              profile={profile}
              onStart={(tables) => void start(tables)}
              onBack={() => {
                setProfile(null);
                setScreen('profile');
              }}
              // 바뀐 캐릭터로 세션을 시작해야 게임 안 캐릭터와 저장 데이터가 어긋나지 않는다
              onAvatarChanged={(avatarId) =>
                setProfile((current) => (current ? { ...current, avatarId } : current))
              }
            />
          )}

          {screen === 'game' && <GameScreen />}
        </LogicalLayer>
      </div>

      {portrait && <RotateHint />}
    </div>
  );
}

/** 가로 화면 최적화이므로 세로일 때는 안내한다. (명세 1) */
function RotateHint(): React.ReactElement {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-[#2b332d] p-8 text-center">
      <svg viewBox="0 0 24 24" width="96" height="96" aria-hidden="true">
        <path
          d="M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm0 3v14h10V5H7Z"
          fill="#fff6e2"
        />
        <path d="M12 17.2a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8Z" fill="#f6c453" />
      </svg>
      <p className="font-game text-cream text-[2rem]">태블릿을 가로로 돌려 주세요</p>
    </div>
  );
}
