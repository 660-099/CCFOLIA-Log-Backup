import { create } from 'zustand';
import { LogFile, LogEntry } from '../types';

interface FileState {
  files: LogFile[];
  setFiles: (files: LogFile[] | ((prev: LogFile[]) => LogFile[])) => void;
  activeFileId: string | null;
  setActiveFileId: (id: string | null) => void;
  setLogs: (newLogs: LogEntry[] | ((prev: LogEntry[]) => LogEntry[])) => void;
  setOriginalFileName: (newName: string) => void;
}

export const useFileStore = create<FileState>((set, get) => ({
  files: [],
  setFiles: (val) => set((state) => ({ files: typeof val === 'function' ? val(state.files) : val })),
  activeFileId: null,
  setActiveFileId: (id) => set({ activeFileId: id }),
  setLogs: (newLogs) => set((state) => {
    if (state.files.length === 0) return state;
    const targetId = state.activeFileId || state.files[0].id;
    const newFiles = state.files.map(f => {
      if (f.id === targetId) {
        const nextLogs = typeof newLogs === 'function' ? newLogs(f.logs) : newLogs;
        return { ...f, logs: nextLogs };
      }
      return f;
    });
    return { files: newFiles };
  }),
  setOriginalFileName: (newName) => set((state) => {
    if (state.files.length === 0) return state;
    const targetId = state.activeFileId || state.files[0].id;
    const newFiles = state.files.map(f => f.id === targetId ? { ...f, name: newName } : f);
    return { files: newFiles };
  })
}));
