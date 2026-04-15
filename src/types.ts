export type TabFormat = 'main' | 'other' | 'info' | 'secret';

export interface LogEntry {
  id: string;
  color: string;
  tab: string;
  name: string;
  content: string;
  isCommand: boolean;
  isContinuation?: boolean;
}

export interface CharSetting {
  name: string;
  color: string;
  imageUrl: string;
  visible: boolean;
}

export interface TabSetting {
  name: string;
  format: TabFormat;
  visible: boolean;
  color?: string; // For secret format
}
