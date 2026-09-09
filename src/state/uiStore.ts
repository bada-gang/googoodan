/**
 * 화면 흐름과 오버레이 상태. 게임 데이터와 분리한다.
 */
import { create } from 'zustand';
import type { InteractionPrompt, SceneKey, ToastPayload } from '@/bridge/events';
import type { MathContext, MathQuestion } from '@/types/learning';
import type { PlacementArea } from '@/types/game';

export type AppScreen = 'profile' | 'tables' | 'game';

export type OverlayKind =
  | null
  | 'inventory'
  | 'shopSeed'
  | 'shopFurniture'
  | 'decorate'
  | 'settings'
  | 'chest'
  | 'levelUp';

export interface ActiveMathRequest {
  requestId: string;
  context: MathContext;
  title: string;
  question: MathQuestion;
}

export interface ToastItem extends ToastPayload {
  id: number;
}

interface UiState {
  screen: AppScreen;
  currentScene: SceneKey;
  overlay: OverlayKind;
  prompts: InteractionPrompt[];
  math: ActiveMathRequest | null;
  toasts: ToastItem[];
  decorateArea: PlacementArea | null;
  levelUpTo: number | null;
  /** 로딩 중 표시 */
  booting: boolean;

  setScreen: (screen: AppScreen) => void;
  setScene: (scene: SceneKey) => void;
  openOverlay: (overlay: OverlayKind) => void;
  closeOverlay: () => void;
  setPrompts: (prompts: InteractionPrompt[]) => void;
  setMath: (request: ActiveMathRequest | null) => void;
  pushToast: (toast: ToastPayload) => void;
  dismissToast: (id: number) => void;
  setDecorateArea: (area: PlacementArea | null) => void;
  showLevelUp: (level: number | null) => void;
  setBooting: (booting: boolean) => void;
}

let toastSeq = 0;

export const useUiStore = create<UiState>()((set) => ({
  screen: 'profile',
  currentScene: 'YardScene',
  overlay: null,
  prompts: [],
  math: null,
  toasts: [],
  decorateArea: null,
  levelUpTo: null,
  booting: true,

  setScreen: (screen) => set({ screen }),
  setScene: (currentScene) => set({ currentScene }),
  openOverlay: (overlay) => set({ overlay }),
  closeOverlay: () => set({ overlay: null }),
  setPrompts: (prompts) => set({ prompts }),
  setMath: (math) => set({ math }),

  pushToast: (toast) =>
    set((s) => {
      toastSeq += 1;
      const item: ToastItem = { ...toast, id: toastSeq };
      return { toasts: [...s.toasts, item].slice(-3) };
    }),

  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  setDecorateArea: (decorateArea) => set({ decorateArea }),
  showLevelUp: (levelUpTo) => set({ levelUpTo }),
  setBooting: (booting) => set({ booting }),
}));
