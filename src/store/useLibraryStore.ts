import { create } from 'zustand';
import { CharSetting, TabSetting } from '../types';

interface LibraryState {
  charSettings: Record<string, CharSetting>;
  setCharSettings: (val: Record<string, CharSetting> | ((prev: Record<string, CharSetting>) => Record<string, CharSetting>)) => void;
  charOrder: string[];
  setCharOrder: (val: string[] | ((prev: string[]) => string[])) => void;
  tabOrder: string[];
  setTabOrder: (val: string[] | ((prev: string[]) => string[])) => void;
  extractedColors: string[];
  setExtractedColors: (val: string[] | ((prev: string[]) => string[])) => void;
  tabSettings: Record<string, TabSetting>;
  setTabSettings: (val: Record<string, TabSetting> | ((prev: Record<string, TabSetting>) => Record<string, TabSetting>)) => void;
}

export const useLibraryStore = create<LibraryState>((set) => ({
  charSettings: {},
  setCharSettings: (val) => set((state) => ({ charSettings: typeof val === 'function' ? val(state.charSettings) : val })),
  charOrder: [],
  setCharOrder: (val) => set((state) => ({ charOrder: typeof val === 'function' ? val(state.charOrder) : val })),
  tabOrder: [],
  setTabOrder: (val) => set((state) => ({ tabOrder: typeof val === 'function' ? val(state.tabOrder) : val })),
  extractedColors: [],
  setExtractedColors: (val) => set((state) => ({ extractedColors: typeof val === 'function' ? val(state.extractedColors) : val })),
  tabSettings: {},
  setTabSettings: (val) => set((state) => ({ tabSettings: typeof val === 'function' ? val(state.tabSettings) : val }))
}));
