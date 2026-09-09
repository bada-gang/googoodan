import type { AvatarId } from '@/types/game';

/**
 * 게임에서 자주 바뀌는 이름들을 한곳에 모은다.
 * 마을 이름이나 화폐 단위를 바꿀 때 이 파일만 고치면 된다.
 */

/** 게임 제목 겸 마을 이름 */
export const GAME_TITLE = '구구 마을';

/** 게임 화폐 단위 */
export const CURRENCY = '원';

/** 금액 표기. 예: "245원" */
export function formatMoney(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}${CURRENCY}`;
}

/** 공간 이름 */
export const AREA_NAME = {
  /** 집과 농장, 동물 우리가 있는 곳 */
  village: '우리 마을',
  /** 가게들이 모여 있는 곳 */
  market: '시장',
  home: '우리 집',
  farm: '농장',
  pen: '동물 우리',
} as const;

/** 미니게임 이름 */
export const MINIGAME_NAME = '열매 받기 게임';

/**
 * 캐릭터 이름. 학생 이름이 겹칠 때 이걸로 구분한다. (명세 10)
 * 학생 화면과 선생님 화면이 같은 목록을 봐야 하므로 여기에 둔다.
 */
export const AVATARS = [
  { id: 'rabbit', name: '토끼' },
  { id: 'bear', name: '곰' },
  { id: 'cat', name: '고양이' },
  { id: 'fox', name: '여우' },
  { id: 'bird', name: '파랑새' },
  { id: 'frog', name: '개구리' },
] as const satisfies readonly { id: AvatarId; name: string }[];

export function avatarName(id: AvatarId): string {
  return AVATARS.find((a) => a.id === id)?.name ?? '?';
}
