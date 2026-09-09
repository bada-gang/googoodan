/**
 * 반 명단을 한 번에 등록하기 위한 순수 함수. (명세 10, 73)
 *
 * 선생님이 스무 명 넘는 이름을 하나씩 타자하고 캐릭터를 고르는 건 수업 준비로 너무 느리다.
 * 명단을 붙여 넣으면 캐릭터는 자동으로 배정하되, **이름이 겹치면 서로 다른 캐릭터를 준다** —
 * 학생이 자기 이름을 찾을 때 구별되는 건 이름과 캐릭터 조합뿐이기 때문이다. (명세 10)
 */
import { AVATARS } from '@/config/strings';
import type { AvatarId, PlayerProfile } from '@/types/game';

/** 학생 이름 입력 칸과 같은 한도 (ProfileSelectScreen) */
export const MAX_NAME_LENGTH = 8;

export interface PlannedStudent {
  displayName: string;
  avatarId: AvatarId;
  /** 이 이름이 이미 있는 학생 또는 이 명단 안의 다른 줄과 겹치는 경우 */
  sharesName: boolean;
}

/** 줄바꿈 또는 쉼표로 나눈다. 번호 매김("1. 민준")은 앞부분을 떼어 낸다. */
export function parseNames(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((line) => line.replace(/^\s*\d+\s*[.)]\s*/, '').trim())
    .filter((name) => name.length > 0)
    .map((name) => name.slice(0, MAX_NAME_LENGTH));
}

/**
 * 등록할 학생 목록을 만든다.
 * 이미 있는 학생과 이름이 같으면 그 학생이 쓰지 않는 캐릭터를 골라 준다.
 */
export function planNewStudents(raw: string, existing: PlayerProfile[]): PlannedStudent[] {
  const usedByName = new Map<string, Set<AvatarId>>();
  for (const profile of existing) {
    const set = usedByName.get(profile.displayName) ?? new Set<AvatarId>();
    set.add(profile.avatarId);
    usedByName.set(profile.displayName, set);
  }

  return parseNames(raw).map((displayName, index) => {
    const used = usedByName.get(displayName) ?? new Set<AvatarId>();
    const sharesName = used.size > 0;

    // 기본은 순서대로 돌려 준다 — 전부 같은 캐릭터면 이름 고르는 화면이 토끼 벽이 된다.
    // 이름이 겹칠 때만 그 이름이 아직 안 쓴 캐릭터로 비켜 준다. (명세 10)
    const preferred = AVATARS[index % AVATARS.length];
    const avatarId = used.has(preferred.id)
      ? (AVATARS.find((avatar) => !used.has(avatar.id)) ?? preferred).id
      : preferred.id;

    used.add(avatarId);
    usedByName.set(displayName, used);

    return { displayName, avatarId, sharesName };
  });
}
