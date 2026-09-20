import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TabFormat } from '../types';

interface SettingsState {
  rememberSettings: boolean;
  setRememberSettings: (val: boolean) => void;
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
  saveOptions: any;
  setSaveOptions: (val: any) => void;
  librarySortMode: 'newest' | 'oldest' | 'alphabetical';
  setLibrarySortMode: (val: 'newest' | 'oldest' | 'alphabetical') => void;
  mergeTabs: TabFormat[];
  setMergeTabs: (val: TabFormat[]) => void;
  showTabNames: TabFormat[];
  setShowTabNames: (val: TabFormat[]) => void;
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
  narrationCharacter: string;
  setNarrationCharacter: (val: string) => void;
  narrationCharacter2: string;
  setNarrationCharacter2: (val: string) => void;
  exportMode: 'html' | 'blog';
  setExportMode: (mode: 'html' | 'blog') => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      rememberSettings: true,
      setRememberSettings: (val) => set({ rememberSettings: val }),
      exportMode: 'blog',
      setExportMode: (val) => set({ exportMode: val }),
      cssFormat: 'internal',
      setCssFormat: (val) => set({ cssFormat: val }),
      fontSize: 14,
      setFontSize: (val) => set({ fontSize: val }),
      textFontSize: 14,
      setTextFontSize: (val) => set({ textFontSize: val }),
      lineHeight: 1.6,
      setLineHeight: (val) => set({ lineHeight: val }),
      letterSpacing: 0,
      setLetterSpacing: (val) => set({ letterSpacing: val }),
      blockSpacing: 2,
      setBlockSpacing: (val) => set({ blockSpacing: val }),
      contentPadding: 12,
      setContentPadding: (val) => set({ contentPadding: val }),
      avatarSizeValue: 46,
      setAvatarSizeValue: (val) => set({ avatarSizeValue: val }),
      fontFamily: 'Noto Sans KR',
      setFontFamily: (val) => set({ fontFamily: val }),
      theme: 'dark',
      setTheme: (val) => set({ theme: val }),
      darkBgColor: '#212121',
      setDarkBgColor: (val) => set({ darkBgColor: val }),
      lightBgColor: '#ffffff',
      setLightBgColor: (val) => set({ lightBgColor: val }),
      disableOtherColor: true,
      setDisableOtherColor: (val) => set({ disableOtherColor: val }),
      filterBarMode: 'none',
      setFilterBarMode: (val) => set({ filterBarMode: val }),
      defaultIllWidth: '100%',
      setDefaultIllWidth: (val) => set({ defaultIllWidth: val }),
      defaultIllAlign: 'center',
      setDefaultIllAlign: (val) => set({ defaultIllAlign: val }),
      saveOptions: {},
      setSaveOptions: (val) => set({ saveOptions: val }),
      librarySortMode: 'newest',
      setLibrarySortMode: (val) => set({ librarySortMode: val }),
      mergeTabs: [],
      setMergeTabs: (val) => set({ mergeTabs: val }),
      showTabNames: [],
      setShowTabNames: (val) => set({ showTabNames: val }),
      mergeTabStyles: [],
      setMergeTabStyles: (val) => set({ mergeTabStyles: val }),
      hideEmptyAvatars: false,
      setHideEmptyAvatars: (val) => set({ hideEmptyAvatars: val }),
      cropFaceTop: false,
      setCropFaceTop: (val) => set({ cropFaceTop: val }),
      hideAllAvatars: false,
      setHideAllAvatars: (val) => set({ hideAllAvatars: val }),
      enableSentenceSpacing: false,
      setEnableSentenceSpacing: (val) => set({ enableSentenceSpacing: val }),
      enableSentenceSpacing2: false,
      setEnableSentenceSpacing2: (val) => set({ enableSentenceSpacing2: val }),
      enableSecretNarration: false,
      setEnableSecretNarration: (val) => set({ enableSecretNarration: val }),
      enableSecretNarration2: false,
      setEnableSecretNarration2: (val) => set({ enableSecretNarration2: val }),
      narrationFormat: 'style1',
      setNarrationFormat: (val) => set({ narrationFormat: val }),
      narrationFormat2: 'style1',
      setNarrationFormat2: (val) => set({ narrationFormat2: val }),
      showLogDivider: false,
      setShowLogDivider: (val) => set({ showLogDivider: val }),
      narrationCharacter: '',
      setNarrationCharacter: (val) => set({ narrationCharacter: val }),
      narrationCharacter2: '',
      setNarrationCharacter2: (val) => set({ narrationCharacter2: val })
    }),
    {
      name: 'ccfolia_settings'
    }
  )
);
