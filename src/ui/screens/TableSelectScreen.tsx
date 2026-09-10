/**
 * 구구단 선택 화면. 게임에 들어갈 때마다 반드시 표시한다. (명세 11, 12)
 * 이 선택은 현재 세션에만 적용되고 저장하지 않는다.
 *
 * 캐릭터 바꾸기도 여기 둔다. 이름을 이미 고른 뒤라 "누구 것을 바꿀까요"를 물을 필요가 없고,
 * 이름 카드가 "게임 시작"과 "캐릭터 바꾸기" 두 가지를 겸하지 않아도 된다.
 */
import { useState } from 'react';
import { repositories } from '@/data';
import type { AvatarId, CharacterId, PlayerProfile } from '@/types/game';
import { characterOf } from '@/types/game';
import { AvatarGrid } from '../common/AvatarGrid';
import { CharacterPicker } from '../common/CharacterPicker';
import { avatarIcon } from '../common/icons';
import { GameButton, Icon } from '../common/ui';
import { ScreenShell } from './ProfileSelectScreen';
import { audio } from '@/audio/sfx';

const TABLES = [2, 3, 4, 5, 6, 7, 8, 9];

export function TableSelectScreen({
  profile,
  onStart,
  onBack,
  onLookChanged,
}: {
  profile: PlayerProfile;
  onStart: (tables: number[]) => void;
  onBack: () => void;
  /** 바뀐 모습을 위(App)에도 알린다 — 게임 안 캐릭터와 저장 데이터가 같이 바뀌어야 한다. */
  onLookChanged: (look: { avatarId: AvatarId; characterId: CharacterId }) => void;
}): React.ReactElement {
  const [selected, setSelected] = useState<number[]>([]);
  const [picking, setPicking] = useState(false);
  const [avatar, setAvatar] = useState<AvatarId>(profile.avatarId);
  const [character, setCharacter] = useState<CharacterId>(characterOf(profile));
  const [busy, setBusy] = useState(false);

  const toggle = (table: number) => {
    audio.play('tap');
    setSelected((prev) =>
      prev.includes(table) ? prev.filter((t) => t !== table) : [...prev, table],
    );
  };

  const saveLook = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await repositories().player.updateLook(profile.id, { avatarId: avatar, characterId: character });
      onLookChanged({ avatarId: avatar, characterId: character });
      setPicking(false);
    } catch (error) {
      console.error('[profile] 캐릭터를 바꾸지 못했습니다.', error);
    } finally {
      setBusy(false);
    }
  };

  if (picking) {
    return (
      <ScreenShell title={`${profile.displayName}의 캐릭터를 골라 주세요`}>
        <div className="flex flex-col items-center gap-4 pt-1">
          <p className="font-game text-[1.15rem] text-ink-soft">마을에서 걸어 다닐 내 모습</p>
          <CharacterPicker selected={character} onSelect={setCharacter} />

          <p className="font-game text-[1.15rem] text-ink-soft">내 이름 옆에 붙일 그림</p>
          <AvatarGrid selected={avatar} onSelect={setAvatar} />

          <div className="flex gap-4">
            <GameButton
              onClick={() => {
                setAvatar(profile.avatarId);
                setCharacter(characterOf(profile));
                setPicking(false);
              }}
            >
              돌아가기
            </GameButton>
            <GameButton tone="leaf" big disabled={busy} onClick={() => void saveLook()}>
              이걸로 할래요
            </GameButton>
          </div>
        </div>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title="오늘은 어떤 구구단을 연습할까요?">
      <div className="flex flex-col items-center gap-5 pt-1">
        <div className="flex items-center gap-3">
          <div className="hud-pill">
            <Icon src={avatarIcon(profile.avatarId)} size={38} alt="" />
            {profile.displayName}
          </div>
          <GameButton
            onClick={() => {
              audio.play('tap');
              setAvatar(profile.avatarId);
              setCharacter(characterOf(profile));
              setPicking(true);
            }}
          >
            캐릭터 바꾸기
          </GameButton>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {TABLES.map((table) => {
            const on = selected.includes(table);
            return (
              <button
                key={table}
                type="button"
                onClick={() => toggle(table)}
                aria-pressed={on}
                className={[
                  'btn-game h-[104px] w-[128px] text-[2.1rem]',
                  on ? 'btn-gold ring-4 ring-white/70' : '',
                ].join(' ')}
              >
                {table}단
              </button>
            );
          })}
        </div>

        <p className="font-game min-h-[2rem] text-[1.2rem] text-ink-soft">
          {selected.length === 0
            ? '연습할 단을 하나 이상 골라 주세요'
            : `${[...selected].sort((a, b) => a - b).join('단, ')}단을 연습해요`}
        </p>

        <div className="flex gap-4">
          <GameButton onClick={onBack}>이름 다시 고르기</GameButton>
          <GameButton
            tone="leaf"
            big
            glow={selected.length > 0}
            disabled={selected.length === 0}
            onClick={() => onStart([...selected].sort((a, b) => a - b))}
          >
            마을로 출발!
          </GameButton>
        </div>
      </div>
    </ScreenShell>
  );
}
