/**
 * 학생 이름 선택 / 만들기 화면. (명세 8, 9, 10)
 * 이메일·비밀번호 로그인은 쓰지 않고, 이름과 캐릭터로 구분한다.
 *
 * 캐릭터 바꾸기는 여기가 아니라 구구단 선택 화면에 있다 —
 * 이름을 고른 뒤라야 "누구 것을 바꾸는지" 물어볼 필요가 없다.
 */
import { useEffect, useState } from 'react';
import { ASSETS } from '@/config/assets';
import { GAME_TITLE } from '@/config/strings';
import { repositories } from '@/data';
import type { AvatarId, CharacterId, PlayerProfile } from '@/types/game';
import { AvatarGrid } from '../common/AvatarGrid';
import { CharacterPicker } from '../common/CharacterPicker';
import { avatarIcon, iconUrl } from '../common/icons';
import { EmptyNote, GameButton, Icon } from '../common/ui';
import { audio } from '@/audio/sfx';

export function ProfileSelectScreen({
  onReady,
}: {
  onReady: (profile: PlayerProfile) => void;
}): React.ReactElement {
  const [profiles, setProfiles] = useState<PlayerProfile[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<AvatarId>('rabbit');
  const [character, setCharacter] = useState<CharacterId>('boy');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void repositories()
      .player.listProfiles()
      .then((list) => {
        setProfiles(list);
        if (list.length === 0) setCreating(true);
      })
      // 목록을 못 불러와도 화면이 멈추면 안 된다. 새 이름부터 만들게 한다.
      .catch((error) => {
        console.error('[profile] 친구 목록을 불러오지 못했습니다.', error);
        setProfiles([]);
        setCreating(true);
      });
  }, []);

  const create = async () => {
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    audio.unlock();
    try {
      const profile = await repositories().player.createProfile(trimmed, avatar, character);
      onReady(profile);
    } catch (error) {
      console.error('[profile] 이름을 저장하지 못했습니다.', error);
      setBusy(false);
    }
  };

  return (
    <ScreenShell title={GAME_TITLE}>
      {profiles === null ? (
        <EmptyNote>친구들을 불러오는 중이에요…</EmptyNote>
      ) : creating ? (
        <div className="flex flex-col items-center gap-4">
          <p className="font-game text-[1.6rem] text-ink">이름을 적고 캐릭터를 골라 주세요</p>

          <input
            value={name}
            onChange={(event) => setName(event.target.value.slice(0, 8))}
            placeholder="이름"
            aria-label="이름"
            className="panel-paper font-game w-[380px] max-w-full px-6 py-4 text-center text-[2rem] text-ink outline-none focus:ring-4 focus:ring-gold"
          />

          {/* 마을을 걸어 다닐 내 모습 */}
          <CharacterPicker selected={character} onSelect={setCharacter} />

          {/* 이름 목록에서 나를 찾을 때 쓰는 표시 (명세 10) */}
          <p className="font-game text-[1.15rem] text-ink-soft">내 이름 옆에 붙일 그림</p>
          <AvatarGrid selected={avatar} onSelect={setAvatar} />

          <div className="mt-2 flex gap-4">
            {profiles.length > 0 && (
              <GameButton onClick={() => setCreating(false)}>돌아가기</GameButton>
            )}
            <GameButton tone="leaf" big disabled={!name.trim() || busy} onClick={() => void create()}>
              게임 시작
            </GameButton>
          </div>
        </div>
      ) : (
        <div className="flex w-full flex-col items-center gap-5">
          <p className="font-game text-[1.6rem] text-ink">내 이름을 선택하세요</p>

          <div className="no-scrollbar grid max-h-[336px] w-full grid-cols-3 gap-4 overflow-y-auto px-2 pb-2">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                type="button"
                onClick={() => {
                  audio.unlock();
                  audio.play('tap');
                  onReady(profile);
                }}
                className="panel-paper flex min-h-[124px] items-center gap-3 px-4 py-3 text-left transition active:translate-y-[3px]"
              >
                <Icon src={avatarIcon(profile.avatarId)} size={72} alt="" />
                <span className="font-game min-w-0 flex-1 truncate text-[1.6rem] text-ink">
                  {profile.displayName}
                </span>
              </button>
            ))}
          </div>

          <GameButton tone="gold" big onClick={() => setCreating(true)}>
            새 친구 만들기
          </GameButton>
        </div>
      )}
    </ScreenShell>
  );
}

/** 두 시작 화면이 공유하는 배경. 게임과 같은 아트를 쓴다. */
export function ScreenShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div
      className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center gap-4 overflow-hidden"
      style={{
        backgroundImage: `url(${iconUrl(ASSETS.environment.sky)})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%] bg-bottom bg-repeat-x"
        style={{
          backgroundImage: `url(${iconUrl(ASSETS.environment.farHills)})`,
          backgroundSize: 'auto 100%',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[86px] bg-bottom bg-repeat-x"
        style={{
          backgroundImage: `url(${iconUrl(ASSETS.environment.foreGrass)})`,
          backgroundSize: 'auto 100%',
        }}
      />

      <div className="panel-wood relative z-10 flex max-h-[700px] w-[900px] flex-col items-center gap-3 px-8 py-7">
        <h1 className="font-game text-[2.6rem] leading-none text-ink stroke-ink">{title}</h1>
        {subtitle && <p className="font-game text-[1.3rem] text-ink-soft">{subtitle}</p>}
        <div className="no-scrollbar w-full overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
