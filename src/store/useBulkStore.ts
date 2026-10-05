import { create } from 'zustand';

interface BulkImageState {
  isBulkImgurModalOpen: boolean;
  setIsBulkImgurModalOpen: (val: boolean) => void;
  bulkImgurUrl: string;
  setBulkImgurUrl: (val: string) => void;
  isBulkImgurLoading: boolean;
  setIsBulkImgurLoading: (val: boolean) => void;
  bulkImages: { url: string; fileName: string; ext: string }[];
  setBulkImages: (val: { url: string; fileName: string; ext: string }[]) => void;
  bulkImageMapping: Record<string, string>;
  setBulkImageMapping: (val: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  bulkImageTypeMapping: Record<string, 'character' | 'illustration' | 'none' | 'manual' | 'auto'>;
  setBulkImageTypeMapping: (val: Record<string, 'character' | 'illustration' | 'none' | 'manual' | 'auto'> | ((prev: Record<string, 'character' | 'illustration' | 'none' | 'manual' | 'auto'>) => Record<string, 'character' | 'illustration' | 'none' | 'manual' | 'auto'>)) => void;
  bulkImportStep: 1 | 2;
  setBulkImportStep: (val: 1 | 2) => void;
  bulkSelectedIllustrations: Record<string, boolean>;
  setBulkSelectedIllustrations: (val: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
}

export const useBulkImageStore = create<BulkImageState>((set) => ({
  isBulkImgurModalOpen: false,
  setIsBulkImgurModalOpen: (val) => set((state) => {
    if (!val) {
      return {
        isBulkImgurModalOpen: false,
        bulkImgurUrl: '',
        bulkImages: [],
        bulkImageMapping: {},
        bulkImageTypeMapping: {},
        bulkImportStep: 1,
        bulkSelectedIllustrations: {}
      };
    }
    return { isBulkImgurModalOpen: val };
  }),
  bulkImgurUrl: '',
  setBulkImgurUrl: (val) => set({ bulkImgurUrl: val }),
  isBulkImgurLoading: false,
  setIsBulkImgurLoading: (val) => set({ isBulkImgurLoading: val }),
  bulkImages: [],
  setBulkImages: (val) => set({ bulkImages: val }),
  bulkImageMapping: {},
  setBulkImageMapping: (val) => set((state) => ({ bulkImageMapping: typeof val === 'function' ? val(state.bulkImageMapping) : val })),
  bulkImageTypeMapping: {},
  setBulkImageTypeMapping: (val) => set((state) => ({ bulkImageTypeMapping: typeof val === 'function' ? val(state.bulkImageTypeMapping) : val })),
  bulkImportStep: 1,
  setBulkImportStep: (val) => set({ bulkImportStep: val }),
  bulkSelectedIllustrations: {},
  setBulkSelectedIllustrations: (val) => set((state) => ({ bulkSelectedIllustrations: typeof val === 'function' ? val(state.bulkSelectedIllustrations) : val })),
}));

interface IllustrationBulkState {
  isIllBulkModalOpen: boolean;
  setIsIllBulkModalOpen: (val: boolean) => void;
  illBulkUrl: string;
  setIllBulkUrl: (val: string) => void;
  isIllBulkLoading: boolean;
  setIsIllBulkLoading: (val: boolean) => void;
  illBulkImages: { url: string; fileName: string; ext: string }[];
  setIllBulkImages: (val: { url: string; fileName: string; ext: string }[]) => void;
  selectedIllBulkImages: Record<string, boolean>;
  setSelectedIllBulkImages: (val: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
}

export const useIllustrationBulkStore = create<IllustrationBulkState>((set) => ({
  isIllBulkModalOpen: false,
  setIsIllBulkModalOpen: (val) => set((state) => {
    if (!val) {
      return {
        isIllBulkModalOpen: false,
        illBulkUrl: '',
        illBulkImages: [],
        selectedIllBulkImages: {}
      };
    }
    return { isIllBulkModalOpen: val };
  }),
  illBulkUrl: '',
  setIllBulkUrl: (val) => set({ illBulkUrl: val }),
  isIllBulkLoading: false,
  setIsIllBulkLoading: (val) => set({ isIllBulkLoading: val }),
  illBulkImages: [],
  setIllBulkImages: (val) => set({ illBulkImages: val }),
  selectedIllBulkImages: {},
  setSelectedIllBulkImages: (val) => set((state) => ({ selectedIllBulkImages: typeof val === 'function' ? val(state.selectedIllBulkImages) : val }))
}));
