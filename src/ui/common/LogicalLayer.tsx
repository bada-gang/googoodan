/**
 * React UI 를 게임과 같은 논리 해상도(1280×800)로 그리고, 셸 크기에 맞춰 통째로 확대/축소한다.
 *
 * 이렇게 하면 10인치 태블릿이든 큰 화면이든 버튼 크기와 글자 크기가 게임 월드와
 * 정확히 같은 비율로 보인다. (명세 67, 76)
 */
import { useEffect, useState, type ReactNode, type RefObject } from 'react';
import { GAME_HEIGHT, GAME_WIDTH } from '@/config/layout';

export function useShellScale(ref: RefObject<HTMLElement | null>): number {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => {
      const rect = element.getBoundingClientRect();
      if (rect.width > 0) setScale(rect.width / GAME_WIDTH);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return scale;
}

export function LogicalLayer({
  scale,
  children,
}: {
  scale: number;
  children: ReactNode;
}): React.ReactElement {
  // 이 레이어 자체는 터치를 받지 않는다. 그래야 빈 곳을 누른 터치가
  // 아래의 Phaser 캔버스까지 내려간다(가구 배치 등). 실제 UI 요소들은
  // 각자 pointer-events-auto 로 다시 켠다.
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        style={{
          width: GAME_WIDTH,
          height: GAME_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: '0 0',
        }}
        className="pointer-events-none relative"
      >
        {children}
      </div>
    </div>
  );
}
