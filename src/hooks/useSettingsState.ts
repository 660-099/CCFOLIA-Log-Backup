import { useSettingsStore } from '../store/useSettingsStore';
import { TabFormat } from '../types';

export const useSettingsState = () => {
  const store = useSettingsStore();

  return {
    ...store,
    mergeTabs: new Set(store.mergeTabs),
    setMergeTabs: (val: Set<TabFormat>) => store.setMergeTabs(Array.from(val)),
    showTabNames: new Set(store.showTabNames),
    setShowTabNames: (val: Set<TabFormat>) => store.setShowTabNames(Array.from(val)),
    mergeTabStyles: new Set(store.mergeTabStyles),
    setMergeTabStyles: (val: Set<TabFormat>) => store.setMergeTabStyles(Array.from(val))
  };
};
