/**
 * 아주 작은 타입 안전 이벤트 버스.
 * React 번들이 Phaser 를 import 하지 않도록 자체 구현을 쓴다.
 */
import type { GameEventMap, GameEventName } from './events';

type Handler<K extends GameEventName> = (payload: GameEventMap[K]) => void;

class EventBus {
  private handlers = new Map<GameEventName, Set<(payload: never) => void>>();

  on<K extends GameEventName>(event: K, handler: Handler<K>): () => void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(handler as (payload: never) => void);
    return () => this.off(event, handler);
  }

  once<K extends GameEventName>(event: K, handler: Handler<K>): () => void {
    const off = this.on(event, ((payload: GameEventMap[K]) => {
      off();
      handler(payload);
    }) as Handler<K>);
    return off;
  }

  off<K extends GameEventName>(event: K, handler: Handler<K>): void {
    this.handlers.get(event)?.delete(handler as (payload: never) => void);
  }

  emit<K extends GameEventName>(
    event: K,
    ...args: GameEventMap[K] extends undefined ? [] : [GameEventMap[K]]
  ): void {
    const set = this.handlers.get(event);
    if (!set) return;
    const payload = args[0] as never;
    // 핸들러 안에서 off 를 호출해도 안전하도록 복사본을 순회한다.
    for (const handler of [...set]) {
      try {
        handler(payload);
      } catch (error) {
        console.error(`[eventBus] "${event}" 핸들러 오류`, error);
      }
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}

export const gameEvents = new EventBus();
