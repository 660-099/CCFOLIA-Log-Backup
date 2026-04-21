export type TabFormat = 'main' | 'other' | 'info' | 'secret';

export interface LogEntry {
  id: string;
  color: string;
  tabId: string;
  tab: string; // The original name
  charId: string;
  name: string; // The original name
  content: string;
  isCommand: boolean;
  isContinuation?: boolean;
  isHiddenContent?: boolean;
}

export interface CharSetting {
  id: string;
  name: string;
  color: string;
  imageUrl: string;
  visible: boolean;
}

export interface TabSetting {
  id: string;
  name: string;
  format: TabFormat;
  visible: boolean;
  color?: string; // For secret format
}

export interface CharacterLibraryItem {
  id: string;
  name: string;
  characters: {
    name: string;
    color: string;
    imageUrl: string;
  }[];
}

export interface ColorPickerPopupProps {
  color: string;
  extractedColors: string[];
  triggerRect: DOMRect;
  onChange: (newColor: string) => void;
  onClose: () => void;
}
