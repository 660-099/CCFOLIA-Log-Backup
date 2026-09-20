import { create } from 'zustand';

interface UIState {
  isAdvancedLayoutOpen: boolean;
  setIsAdvancedLayoutOpen: (val: boolean) => void;
  isEditingFontSize: boolean;
  setIsEditingFontSize: (val: boolean) => void;
  isBulkSettingsExpanded: boolean;
  setIsBulkSettingsExpanded: (val: boolean) => void;
  isNarrationDropdownOpen: boolean;
  setIsNarrationDropdownOpen: (val: boolean) => void;
  isNarrationDropdownOpen2: boolean;
  setIsNarrationDropdownOpen2: (val: boolean) => void;
  isFontDropdownOpen: boolean;
  setIsFontDropdownOpen: (val: boolean) => void;
  isFilterDropdownOpen: boolean;
  setIsFilterDropdownOpen: (val: boolean) => void;
  showSaveMenu: boolean;
  setShowSaveMenu: (val: boolean) => void;
  showDownloadMenu: boolean;
  setShowDownloadMenu: (val: boolean) => void;
  showCopyMenu: boolean;
  setShowCopyMenu: (val: boolean) => void;
  isLibraryAccordionOpen: boolean;
  setIsLibraryAccordionOpen: (val: boolean) => void;
  isLibraryEditMode: boolean;
  setIsLibraryEditMode: (val: boolean) => void;

  showJsonExtractor: boolean;
  setShowJsonExtractor: (val: boolean) => void;
  extractorFile: File | null;
  setExtractorFile: (file: File | null) => void;
  isConverting: boolean;
  setIsConverting: (val: boolean) => void;
  isBulkAllocatorOpen: boolean;
  setIsBulkAllocatorOpen: (val: boolean) => void;
  isDraggingFile: boolean;
  setIsDraggingFile: (val: boolean) => void;
  isDraggingIllustration: boolean;
  setIsDraggingIllustration: (val: boolean) => void;
  isTitleEditing: boolean;
  setIsTitleEditing: (val: boolean) => void;
  pageTitle: string;
  setPageTitle: (val: string) => void;
  tempTitle: string;
  setTempTitle: (val: string) => void;
  isSearchExpanded: boolean;
  setIsSearchExpanded: (val: boolean) => void;
  isMovingBlock: boolean;
  setIsMovingBlock: (val: boolean) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  isTocHovered: boolean;
  setIsTocHovered: (val: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isAdvancedLayoutOpen: false,
  setIsAdvancedLayoutOpen: (val) => set({ isAdvancedLayoutOpen: val }),
  isEditingFontSize: false,
  setIsEditingFontSize: (val) => set({ isEditingFontSize: val }),
  isBulkSettingsExpanded: false,
  setIsBulkSettingsExpanded: (val) => set({ isBulkSettingsExpanded: val }),
  isNarrationDropdownOpen: false,
  setIsNarrationDropdownOpen: (val) => set({ isNarrationDropdownOpen: val }),
  isNarrationDropdownOpen2: false,
  setIsNarrationDropdownOpen2: (val) => set({ isNarrationDropdownOpen2: val }),
  isFontDropdownOpen: false,
  setIsFontDropdownOpen: (val) => set({ isFontDropdownOpen: val }),
  isFilterDropdownOpen: false,
  setIsFilterDropdownOpen: (val) => set({ isFilterDropdownOpen: val }),
  showSaveMenu: false,
  setShowSaveMenu: (val) => set({ showSaveMenu: val }),
  showDownloadMenu: false,
  setShowDownloadMenu: (val) => set({ showDownloadMenu: val }),
  showCopyMenu: false,
  setShowCopyMenu: (val) => set({ showCopyMenu: val }),
  isLibraryAccordionOpen: false,
  setIsLibraryAccordionOpen: (val) => set({ isLibraryAccordionOpen: val }),
  isLibraryEditMode: false,
  setIsLibraryEditMode: (val) => set({ isLibraryEditMode: val }),

  showJsonExtractor: false,
  setShowJsonExtractor: (val) => set({ showJsonExtractor: val }),
  extractorFile: null,
  setExtractorFile: (val) => set({ extractorFile: val }),
  isConverting: false,
  setIsConverting: (val) => set({ isConverting: val }),
  isBulkAllocatorOpen: false,
  setIsBulkAllocatorOpen: (val) => set({ isBulkAllocatorOpen: val }),
  isDraggingFile: false,
  setIsDraggingFile: (val) => set({ isDraggingFile: val }),
  isDraggingIllustration: false,
  setIsDraggingIllustration: (val) => set({ isDraggingIllustration: val }),
  isTitleEditing: false,
  setIsTitleEditing: (val) => set({ isTitleEditing: val }),
  pageTitle: '',
  setPageTitle: (val) => set({ pageTitle: val, tempTitle: val }),
  tempTitle: '',
  setTempTitle: (val) => set({ tempTitle: val }),
  isSearchExpanded: false,
  setIsSearchExpanded: (val) => set({ isSearchExpanded: val }),
  isMovingBlock: false,
  setIsMovingBlock: (val) => set({ isMovingBlock: val }),
  searchQuery: '',
  setSearchQuery: (val) => set({ searchQuery: val }),
  isTocHovered: false,
  setIsTocHovered: (val) => set({ isTocHovered: val })
}));
