/**
 * 게임 안에서 움직일 내 캐릭터 고르기. (명세 9)
 *
 * 목록에서 이름을 구분하는 아바타 아이콘(토끼·곰…)과는 다른 것이다.
 * 이건 마을을 걸어 다니는 몸이라 서 있는 모습 그대로 보여 준다.
 */
import { CHARACTERS } from '@/config/strings';
import type { CharacterId } from '@/types/game';
import { characterIcon } from './icons';
import { Icon } from './ui';
import { audio } from '@/audio/sfx';

export function CharacterPicker({
  selected,
  onSelect,
}: {
  selected: CharacterId;
  onSelect: (id: CharacterId) => void;
}): React.ReactElement {
  return (
    <div className="flex gap-4">
      {CHARACTERS.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => {
            audio.play('tap');
            onSelect(item.id);
          }}
          aria-label={item.name}
          aria-pressed={selected === item.id}
          className={[
            'panel-paper flex h-[150px] w-[124px] items-end justify-center pb-1 transition',
            selected === item.id ? 'ring-4 ring-gold ring-offset-2' : 'opacity-80',
          ].join(' ')}
        >
          {/* 그림만으로 충분히 구분된다. 이름은 aria-label 로만 남긴다. */}
          <Icon src={characterIcon(item.id)} size={126} alt="" />
        </button>
      ))}
    </div>
  );
}
