/**
 * 게임 폰트 미리 불러오기.
 *
 * 왜 필요한가:
 * Google Fonts 는 한글 폰트를 unicode-range 로 잘게 나눠 배포한다. 브라우저는
 * "그 글자가 실제로 DOM 에 나타날 때" 해당 조각만 내려받는데, Phaser 의 텍스트는
 * 캔버스에 직접 그려지기 때문에 이 다운로드가 확실히 일어나지 않는다.
 * 그 결과 어떤 글자는 Jua 로, 어떤 글자는 시스템 대체 폰트로 그려져
 * 한 낱말 안에서 글씨체가 달라 보인다. ("밖으로" 의 "밖" 처럼)
 *
 * 그래서 게임이 그릴 글자들을 모아 document.fonts.load() 에 직접 넘겨
 * 필요한 조각을 미리 받아 둔다.
 */
import { STAGE_LABEL } from '@/config/balance';
import { ANIMAL_LIST, SELLABLE_NAME, SUPPLY_LIST, TREE_LIST } from '@/config/catalog';
import { AREA_NAME, CURRENCY, GAME_TITLE, MINIGAME_NAME } from '@/config/strings';

/** 데이터에서 오지 않는 고정 문구들 (씬·연출에 직접 적혀 있는 것) */
const FIXED_TEXT = [
  '마을을 준비하고 있어요',
  '집에 들어가기',
  '남은 시간',
  '받은 열매',
  '쑥쑥',
  '레벨',
  '개',
  '준비',
  '시작',
  '끝',
  '상자',
  '가나다라마바사아자차카타파하',
  '0123456789+×=?!·→←',
].join('');

/** 게임이 캔버스에 그릴 만한 글자를 모두 모은다. */
function sampleText(): string {
  const parts = [
    GAME_TITLE,
    MINIGAME_NAME,
    CURRENCY,
    ...Object.values(AREA_NAME),
    ...Object.values(STAGE_LABEL),
    ...Object.values(SELLABLE_NAME),
    ...TREE_LIST.flatMap((t) => [t.name, t.fruitName, t.seedName]),
    ...ANIMAL_LIST.flatMap((a) => [a.name, a.produceName]),
    ...SUPPLY_LIST.flatMap((s) => [s.name, s.packName]),
    FIXED_TEXT,
  ].join('');
  // 중복 글자는 빼서 요청을 가볍게 한다.
  return [...new Set(parts)].join('');
}

/**
 * 웹폰트를 준비한다. 네트워크가 느리거나 끊겨도 timeoutMs 안에 반드시 끝난다.
 * @returns 폰트가 실제로 준비됐으면 true
 */
export async function preloadGameFont(family = 'Jua', timeoutMs = 2500): Promise<boolean> {
  if (!document.fonts) return false;

  const work = (async () => {
    const text = sampleText();
    // 크기별로 따로 요청해야 하는 것은 아니지만, 실제로 쓰는 크기로 요청해 둔다.
    await Promise.all([
      document.fonts.load(`30px "${family}"`, text),
      document.fonts.load(`72px "${family}"`, text),
    ]);
    await document.fonts.ready;
    return true;
  })();

  const timeout = new Promise<boolean>((resolve) => {
    window.setTimeout(() => resolve(false), timeoutMs);
  });

  try {
    return await Promise.race([work, timeout]);
  } catch {
    // 폰트를 못 받아도 대체 폰트로 게임은 정상 동작한다.
    return false;
  }
}
