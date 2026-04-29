import React from 'react';
import { Plus, X, ImageIcon } from 'lucide-react';
import { cn } from '../utils';
import { SectionNameEditor } from './SectionNameEditor';

interface BoundaryEditorProps {
  id: string;
  theme: 'dark' | 'light';
  isTopLevel?: boolean;
  allowSplit?: boolean;
  onToggleSplit: () => void;
  onInsertImage: () => void;
}

export function BoundaryEditor({
  id,
  theme,
  isTopLevel,
  allowSplit = true,
  onToggleSplit,
  onInsertImage
}: BoundaryEditorProps) {
  return (
    <div className="boundary-trigger font-sans">
      {allowSplit && (
        <button 
          onClick={onToggleSplit}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all shadow-lg pointer-events-auto",
            theme === 'dark' ? "bg-white/90 text-stone-900 hover:bg-white" : "bg-stone-900 text-white hover:bg-stone-800"
          )}
        >
          <Plus className="w-3 h-3" />
          여기서 분할
        </button>
      )}
      <button 
        onClick={onInsertImage}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all shadow-lg pointer-events-auto",
          theme === 'dark' ? "bg-white/90 text-stone-900 hover:bg-white" : "bg-stone-900 text-white hover:bg-stone-800"
        )}
      >
        <ImageIcon className="w-3 h-3" />
        이미지 삽입
      </button>
    </div>
  );
}
