/**
 * Phaser Canvas 를 React 안에 올린다.
 * React 는 절대 Scene 내부를 직접 만지지 않는다. (명세 68, 71)
 */
import { useEffect, useRef } from 'react';
import type Phaser from 'phaser';

export function PhaserGame(): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || gameRef.current) return;

    let cancelled = false;

    // Phaser 와 Scene 은 무거우므로 게임 화면에 들어올 때 불러온다.
    void Promise.all([import('phaser'), import('./gameConfig')]).then(
      ([phaserModule, configModule]) => {
        if (cancelled) return;
        const game = new phaserModule.default.Game(configModule.createGameConfig(container));
        gameRef.current = game;
        if (import.meta.env.DEV) {
          // 개발 중 콘솔에서 월드를 들여다볼 수 있게 해 둔다.
          (window as unknown as { __googooGame?: Phaser.Game }).__googooGame = game;
        }
      },
    );

    return () => {
      cancelled = true;
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0" aria-hidden="true" />;
}
