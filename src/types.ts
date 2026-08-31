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
  sectionId?: string;

  // Illustration fields
  isIllustration?: boolean;
  isUnplaced?: boolean;
  tabOverride?: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  imageName?: string;
  illustration?: Illustration;
  isBgmBlock?: boolean;
  bgmData?: {
    id?: string;
    title?: string;
    url: string;
    videoId?: string;
    startTime?: number;
    useTimestamp?: boolean;
  };
}

export interface CharSetting {
  id: string;
  name: string;
  color: string;
  imageUrl: string;
  imageName?: string;
  visible: boolean;
}

export interface TabSetting {
  id: string;
  name: string;
  format: TabFormat;
  visible: boolean;
  color?: string; // For secret format
  textColor?: string;
  isBold?: boolean;
  isItalic?: boolean;
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
  onChangeComplete?: (newColor: string) => void;
  onClose: () => void;
}

export interface Illustration {
  id: string;
  url: string;
  imageName?: string;
  afterLogIndex: number | null;
  tabOverride: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface LogFile {
  id: string;
  name: string;
  logs: LogEntry[];
  insertedBlocks?: Record<number | string, { type: 'split' | 'image'; name?: string; src?: string }>;
}

