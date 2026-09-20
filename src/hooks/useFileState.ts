import { useMemo } from 'react';
import { useFileStore } from '../store/useFileStore';

export const useFileState = () => {
  const store = useFileStore();

  const activeFile = useMemo(() => {
    if (!store.files || store.files.length === 0) return null;
    return store.files.find(f => f.id === store.activeFileId) || store.files[0];
  }, [store.files, store.activeFileId]);

  const logs = useMemo(() => activeFile ? activeFile.logs : [], [activeFile]);
  const originalFileName = activeFile ? activeFile.name : '';

  return {
    ...store,
    activeFile,
    logs,
    originalFileName
  };
};
