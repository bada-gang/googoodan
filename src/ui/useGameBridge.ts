/**
 * Phaser -> React 이벤트를 UI 상태로 옮긴다. (명세 71)
 */
import { useEffect } from 'react';
import { gameEvents } from '@/bridge/eventBus';
import { useUiStore } from '@/state/uiStore';
import { askMath } from './mathFlow';

export function useGameBridge(): void {
  useEffect(() => {
    const disposers = [
      gameEvents.on('scene:changed', ({ sceneKey }) => {
        useUiStore.getState().setScene(sceneKey);
        useUiStore.getState().setBooting(false);
        // 장면이 바뀌면 열려 있던 오버레이는 닫는다.
        if (useUiStore.getState().overlay !== null) useUiStore.getState().closeOverlay();
      }),

      gameEvents.on('interaction:changed', ({ prompts }) => {
        useUiStore.getState().setPrompts(prompts);
      }),

      gameEvents.on('toast', (payload) => {
        useUiStore.getState().pushToast(payload);
      }),

      gameEvents.on('level:up', ({ level }) => {
        useUiStore.getState().showLevelUp(level);
      }),

      gameEvents.on('shop:open', ({ shop }) => {
        const overlay =
          shop === 'seed' ? 'shopSeed' : 'shopFurniture';
        useUiStore.getState().openOverlay(overlay);
      }),

      // Phaser 가 문제를 요청하면 여기서 문제를 만들어 보여주고 결과를 돌려준다.
      gameEvents.on('math:request', ({ requestId, context, title }) => {
        void askMath(context, title, requestId).then(({ correct, wrongAttempts }) => {
          gameEvents.emit('math:result', { requestId, correct, wrongAttempts });
        });
      }),
    ];

    return () => {
      for (const dispose of disposers) dispose();
    };
  }, []);
}
