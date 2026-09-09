/**
 * Phaser ↔ React 통신 계약. (명세 71)
 *
 * Phaser Scene 은 React 컴포넌트를 직접 조작하지 않고 여기 정의된 이벤트만 주고받는다.
 */
import type { MathContext } from '@/types/learning';
import type { PlacementArea } from '@/types/game';

export type SceneKey = 'YardScene' | 'HomeScene' | 'TownScene' | 'FruitCatchScene';

/** 오른쪽 아래 행동 버튼에 표시할 상호작용 (명세 7) */
export interface InteractionPrompt {
  /** Phaser 가 다시 돌려받을 행동 식별자 */
  id: string;
  label: string;
  enabled: boolean;
  /** 비활성 이유. 예: "사과 씨앗이 없어요" */
  hint?: string;
  /** 강조 표시 (수확 가능 등) */
  highlight?: boolean;
}

export type ToastTone = 'info' | 'reward' | 'warn';

export interface ToastPayload {
  text: string;
  tone: ToastTone;
  /** 함께 보여줄 아이템 아이콘 키 (선택) */
  iconKey?: string;
  /** 표시 시간(ms). 기본 2400 */
  durationMs?: number;
}

/** 미니게임 진행 단계 */
export type MiniGamePhase = 'intro' | 'playing' | 'result';

export interface MiniGamePhasePayload {
  phase: MiniGamePhase;
  /** result 일 때만 */
  caught?: number;
  chestCount?: number;
  /** 이번 판의 등수. 기록에 못 들면 null */
  rank?: number | null;
  /** 오늘 상자를 받을 수 있는지 (하루 한 번) */
  canClaimReward?: boolean;
}

export interface MathRequestPayload {
  requestId: string;
  context: MathContext;
  /** 문제 팝업 위에 보여줄 상황 설명. 예: "사과 씨앗을 심어 볼까요?" */
  title: string;
}

export interface MathResultPayload {
  requestId: string;
  correct: boolean;
  /** 맞히기까지 틀린 횟수. 수확량·생산물 개수를 정하는 데 쓴다. */
  wrongAttempts: number;
}

export interface MiniGameResultPayload {
  caught: number;
  chestCount: number;
}

export interface DecoratePlacePayload {
  itemId: string;
  area: PlacementArea;
}

/** 꾸미기 도구. 드래그 없이 탭만으로도 모든 조작이 가능해야 한다. (명세 7) */
export type DecorateTool = 'move' | 'flip' | 'remove';

export type MoveDirection = 'left' | 'right';

/** 이벤트 이름 -> 페이로드 타입 */
export interface GameEventMap {
  /* ---- Phaser -> React ---- */
  'scene:changed': { sceneKey: SceneKey };
  'scene:ready': { sceneKey: SceneKey };
  'interaction:changed': { prompts: InteractionPrompt[] };
  'math:request': MathRequestPayload;
  'toast': ToastPayload;
  'minigame:ended': MiniGameResultPayload;
  /** 미니게임 단계가 바뀌었다 (시작 안내 / 진행 / 결과) */
  'minigame:phase': MiniGamePhasePayload;
  'level:up': { level: number };
  'decorate:placed': { instanceId: string };
  /** 물건을 손에 들고 있는 중인지 (놓을 자리를 고르는 중) */
  'decorate:holding': { holding: boolean };
  'decorate:exited': undefined;
  'shop:open': { shop: 'seed' | 'furniture' };

  /* ---- React -> Phaser ---- */
  'move:start': { direction: MoveDirection };
  'move:stop': undefined;
  'action:press': { actionId: string };
  'math:result': MathResultPayload;
  'scene:goto': { sceneKey: SceneKey; spawnAt?: number };
  'decorate:mode': { on: boolean; area: PlacementArea };
  'decorate:pick': DecoratePlacePayload;
  'decorate:tool': { tool: DecorateTool };
  'settings:changed': undefined;
  /** 시작 안내를 닫고 실제로 게임을 시작한다 */
  'minigame:start': undefined;
  /** 결과 안내를 닫고 다음(문제 풀이)으로 넘어간다 */
  'minigame:continue': undefined;
  /** 씨앗을 두 종류 이상 가지고 있을 때 고르게 한다 */
  'seedpicker:open': { plotId: string };
  'seedpicker:choose': { plotId: string; species: string };
}

export type GameEventName = keyof GameEventMap;
