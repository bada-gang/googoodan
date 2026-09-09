/**
 * 사운드 등 기기 설정. 학생 계정이 아니라 기기에 저장한다. (명세 61)
 */
import { create } from 'zustand';
import { KEYS, readJson, writeJson } from '@/data/local/storage';

export interface DeviceSettings {
  bgmOn: boolean;
  sfxOn: boolean;
  /** 이동 버튼을 왼손잡이용으로 좌우 반전 */
  leftHanded: boolean;
}

const DEFAULTS: DeviceSettings = { bgmOn: true, sfxOn: true, leftHanded: false };

interface SettingsState extends DeviceSettings {
  toggle: (key: keyof DeviceSettings) => void;
  set: (key: keyof DeviceSettings, value: boolean) => void;
}

function persist(state: DeviceSettings): void {
  writeJson(KEYS.settings, state);
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  ...DEFAULTS,
  ...readJson<Partial<DeviceSettings>>(KEYS.settings, {}),

  toggle: (key) => {
    const next = !get()[key];
    set({ [key]: next } as Partial<SettingsState>);
    const { bgmOn, sfxOn, leftHanded } = get();
    persist({ bgmOn, sfxOn, leftHanded });
  },

  set: (key, value) => {
    set({ [key]: value } as Partial<SettingsState>);
    const { bgmOn, sfxOn, leftHanded } = get();
    persist({ bgmOn, sfxOn, leftHanded });
  },
}));
