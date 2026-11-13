import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TabFormat, ProjectSaveOptions } from '../types';

export const DEFAULT_PROJECT_SAVE_OPTIONS: ProjectSaveOptions = {
  chars: {
    enabled: true,
    charNames: true,
    narration: true,
    charColors: true,
    charImages: true,
  },
  tabs: {
    enabled: true,
    tabMergeSettings: true,
    tabNames: true,
    tabIndividualSettings: true,
  },
  design: {
    enabled: true,
    themeBg: true,
    logDisplay: true,
    fontAndSpacing: true,
    cssFormat: true,
  },
  dialogue: {
    enabled: true,
    dialogueEdits: true,
    bgm: true,
    illustrations: true,
    splits: true,
  },
};

export const DEFAULT_SETTINGS_VALUES = {
  exportMode: 'blog' as const,
  cssFormat: 'internal' as const,
  fontSize: 14,
  textFontSize: 14,
  lineHeight: 1.6,
  letterSpacing: 0,
  blockSpacing: 2,
  contentPadding: 12,
  avatarSizeValue: 46,
  fontFamily: 'Noto Sans KR',
  theme: 'dark' as const,
  darkBgColor: '#212121',
  lightBgColor: '#ffffff',
  disableOtherColor: true,
  filterBarMode: 'none' as const,
  defaultIllWidth: '100%',
  defaultIllAlign: 'center' as const,
  saveOptions: DEFAULT_PROJECT_SAVE_OPTIONS,
  librarySortMode: 'newest' as const,
  mergeTabs: ['main', 'secret', 'other'] as TabFormat[],
  showTabNames: ['secret'] as TabFormat[],
  usePerTabNameDisplay: false,
  mergeTabStyles: ['secret'] as TabFormat[],
  hideEmptyAvatars: false,
  cropFaceTop: false,
  hideAllAvatars: false,
  enableSentenceSpacing: false,
  enableSentenceSpacing2: false,
  enableSecretNarration: false,
  enableSecretNarration2: false,
  narrationFormat: 'style1' as const,
  narrationFormat2: 'style1' as const,
  showLogDivider: false,
  narrationCharacter: null as string | null,
  narrationCharacter2: null as string | null,
  standingZoomed: false,
  tabSortMode: 'appearance' as const,
  charSortMode: 'appearance' as const,
  illustrationSortMode: 'appearance' as const,
};

interface SettingsState {
  rememberSettings: boolean;
  setRememberSettings: (val: boolean) => void;
  resetAllSettingsToDefaults: () => void;
  cssFormat: 'inline' | 'internal';
  setCssFormat: (val: 'inline' | 'internal') => void;
  fontSize: number;
  setFontSize: (val: number) => void;
  textFontSize: number;
  setTextFontSize: (val: number) => void;
  lineHeight: number;
  setLineHeight: (val: number) => void;
  letterSpacing: number;
  setLetterSpacing: (val: number) => void;
  blockSpacing: number;
  setBlockSpacing: (val: number) => void;
  contentPadding: number;
  setContentPadding: (val: number) => void;
  avatarSizeValue: number;
  setAvatarSizeValue: (val: number) => void;
  fontFamily: string;
  setFontFamily: (val: string) => void;
  theme: 'dark' | 'light';
  setTheme: (val: 'dark' | 'light') => void;
  darkBgColor: string;
  setDarkBgColor: (val: string) => void;
  lightBgColor: string;
  setLightBgColor: (val: string) => void;
  disableOtherColor: boolean;
  setDisableOtherColor: (val: boolean) => void;
  filterBarMode: 'none' | 'floating' | 'fixed';
  setFilterBarMode: (val: 'none' | 'floating' | 'fixed') => void;
  defaultIllWidth: string;
  setDefaultIllWidth: (val: string) => void;
  defaultIllAlign: 'left' | 'center' | 'right';
  setDefaultIllAlign: (val: 'left' | 'center' | 'right') => void;
  saveOptions: ProjectSaveOptions;
  setSaveOptions: (val: ProjectSaveOptions | ((prev: ProjectSaveOptions) => ProjectSaveOptions)) => void;
  librarySortMode: 'newest' | 'oldest' | 'alphabetical';
  setLibrarySortMode: (val: 'newest' | 'oldest' | 'alphabetical') => void;
  mergeTabs: TabFormat[];
  setMergeTabs: (val: TabFormat[]) => void;
  showTabNames: TabFormat[];
  setShowTabNames: (val: TabFormat[]) => void;
  usePerTabNameDisplay: boolean;
  setUsePerTabNameDisplay: (val: boolean) => void;
  mergeTabStyles: TabFormat[];
  setMergeTabStyles: (val: TabFormat[]) => void;
  hideEmptyAvatars: boolean;
  setHideEmptyAvatars: (val: boolean) => void;
  cropFaceTop: boolean;
  setCropFaceTop: (val: boolean) => void;
  hideAllAvatars: boolean;
  setHideAllAvatars: (val: boolean) => void;
  enableSentenceSpacing: boolean;
  setEnableSentenceSpacing: (val: boolean) => void;
  enableSentenceSpacing2: boolean;
  setEnableSentenceSpacing2: (val: boolean) => void;
  enableSecretNarration: boolean;
  setEnableSecretNarration: (val: boolean) => void;
  enableSecretNarration2: boolean;
  setEnableSecretNarration2: (val: boolean) => void;
  narrationFormat: 'style1' | 'style2' | 'style3';
  setNarrationFormat: (val: 'style1' | 'style2' | 'style3') => void;
  narrationFormat2: 'style1' | 'style2' | 'style3';
  setNarrationFormat2: (val: 'style1' | 'style2' | 'style3') => void;
  showLogDivider: boolean;
  setShowLogDivider: (val: boolean) => void;
  narrationCharacter: string | null;
  setNarrationCharacter: (val: string | null) => void;
  narrationCharacter2: string | null;
  setNarrationCharacter2: (val: string | null) => void;
  exportMode: 'html' | 'blog';
  setExportMode: (mode: 'html' | 'blog') => void;
  standingZoomed: boolean;
  setStandingZoomed: (val: boolean) => void;
  tabSortMode: 'appearance' | 'alphabetical';
  setTabSortMode: (val: 'appearance' | 'alphabetical' | ((prev: 'appearance' | 'alphabetical') => 'appearance' | 'alphabetical')) => void;
  charSortMode: 'appearance' | 'alphabetical';
  setCharSortMode: (val: 'appearance' | 'alphabetical' | ((prev: 'appearance' | 'alphabetical') => 'appearance' | 'alphabetical')) => void;
  illustrationSortMode: 'appearance' | 'alphabetical';
  setIllustrationSortMode: (val: 'appearance' | 'alphabetical' | ((prev: 'appearance' | 'alphabetical') => 'appearance' | 'alphabetical')) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      rememberSettings: true,
      setRememberSettings: (val) => set({ rememberSettings: val }),
      resetAllSettingsToDefaults: () => set((state) => ({
        ...DEFAULT_SETTINGS_VALUES,
        rememberSettings: state.rememberSettings,
      })),
      ...DEFAULT_SETTINGS_VALUES,
      setExportMode: (val) => set({ exportMode: val }),
      setCssFormat: (val) => set({ cssFormat: val }),
      setFontSize: (val) => set({ fontSize: val }),
      setTextFontSize: (val) => set({ textFontSize: val }),
      setLineHeight: (val) => set({ lineHeight: val }),
      setLetterSpacing: (val) => set({ letterSpacing: val }),
      setBlockSpacing: (val) => set({ blockSpacing: val }),
      setContentPadding: (val) => set({ contentPadding: val }),
      setAvatarSizeValue: (val) => set({ avatarSizeValue: val }),
      setFontFamily: (val) => set({ fontFamily: val }),
      setTheme: (val) => set({ theme: val }),
      setDarkBgColor: (val) => set({ darkBgColor: val }),
      setLightBgColor: (val) => set({ lightBgColor: val }),
      setDisableOtherColor: (val) => set({ disableOtherColor: val }),
      setFilterBarMode: (val) => set({ filterBarMode: val }),
      setDefaultIllWidth: (val) => set({ defaultIllWidth: val }),
      setDefaultIllAlign: (val) => set({ defaultIllAlign: val }),
      setSaveOptions: (val) => set((state) => ({ saveOptions: typeof val === 'function' ? val(state.saveOptions || DEFAULT_PROJECT_SAVE_OPTIONS) : val })),
      setLibrarySortMode: (val) => set({ librarySortMode: val }),
      setMergeTabs: (val) => set({ mergeTabs: val }),
      setShowTabNames: (val) => set({ showTabNames: val }),
      setUsePerTabNameDisplay: (val) => set({ usePerTabNameDisplay: val }),
      setMergeTabStyles: (val) => set({ mergeTabStyles: val }),
      setHideEmptyAvatars: (val) => set({ hideEmptyAvatars: val }),
      setCropFaceTop: (val) => set({ cropFaceTop: val }),
      setHideAllAvatars: (val) => set({ hideAllAvatars: val }),
      setEnableSentenceSpacing: (val) => set({ enableSentenceSpacing: val }),
      setEnableSentenceSpacing2: (val) => set({ enableSentenceSpacing2: val }),
      setEnableSecretNarration: (val) => set({ enableSecretNarration: val }),
      setEnableSecretNarration2: (val) => set({ enableSecretNarration2: val }),
      setNarrationFormat: (val) => set({ narrationFormat: val }),
      setNarrationFormat2: (val) => set({ narrationFormat2: val }),
      setShowLogDivider: (val) => set({ showLogDivider: val }),
      setNarrationCharacter: (val) => set({ narrationCharacter: val }),
      setNarrationCharacter2: (val) => set({ narrationCharacter2: val }),
      setStandingZoomed: (val) => set({ standingZoomed: val }),
      setTabSortMode: (val) => set((state) => ({ tabSortMode: typeof val === 'function' ? val(state.tabSortMode) : val })),
      setCharSortMode: (val) => set((state) => ({ charSortMode: typeof val === 'function' ? val(state.charSortMode) : val })),
      setIllustrationSortMode: (val) => set((state) => ({ illustrationSortMode: typeof val === 'function' ? val(state.illustrationSortMode) : val }))
    }),
    {
      name: 'ccfolia_settings',
      partialize: (state) => {
        if (!state.rememberSettings) {
          return { rememberSettings: false } as unknown as SettingsState;
        }
        const { narrationCharacter, narrationCharacter2, ...rest } = state;
        return rest;
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (!state.rememberSettings) {
            Object.assign(state, DEFAULT_SETTINGS_VALUES, { rememberSettings: false });
            return;
          }
          state.narrationCharacter = null;
          state.narrationCharacter2 = null;
          if (!state.saveOptions || !state.saveOptions.chars || typeof state.saveOptions.chars !== 'object') {
            state.saveOptions = DEFAULT_PROJECT_SAVE_OPTIONS;
          }
        }
      }
    }
  )
);
