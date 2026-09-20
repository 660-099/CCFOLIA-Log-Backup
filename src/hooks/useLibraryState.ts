import { useEffect } from 'react';
import { useLibraryStore } from '../store/useLibraryStore';
import { LogFile } from '../types';

export const useLibraryState = (files: LogFile[]) => {
  const store = useLibraryStore();

  useEffect(() => {
    if (files.length === 0) return;
    const seenChars = new Set<string>();
    const newCharOrder: string[] = [];
    const seenTabs = new Set<string>();
    const newTabOrder: string[] = [];
    
    files.forEach(file => {
      file.logs.forEach(log => {
        if (log.charId && !seenChars.has(log.charId) && store.charSettings[log.charId]) {
          seenChars.add(log.charId);
          newCharOrder.push(log.charId);
        }
        if (log.tabId && !seenTabs.has(log.tabId) && store.tabSettings[log.tabId]) {
          seenTabs.add(log.tabId);
          newTabOrder.push(log.tabId);
        }
      });
    });
    
    Object.keys(store.charSettings).forEach(id => {
      if (!seenChars.has(id)) {
        newCharOrder.push(id);
      }
    });
    
    Object.keys(store.tabSettings).forEach(id => {
      if (!seenTabs.has(id)) {
        newTabOrder.push(id);
      }
    });
    
    store.setCharOrder(prev => {
      if (JSON.stringify(prev) === JSON.stringify(newCharOrder)) return prev;
      return newCharOrder;
    });
    
    store.setTabOrder(prev => {
      if (JSON.stringify(prev) === JSON.stringify(newTabOrder)) return prev;
      return newTabOrder;
    });
  }, [files, store.charSettings, store.tabSettings]); // Careful with deps here, but keeping same logic

  return store;
};
