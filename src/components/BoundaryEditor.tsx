import React, { useState } from 'react';
import { Plus, X, ImageIcon } from 'lucide-react';
import { cn } from '../utils';
import { SectionNameEditor } from './SectionNameEditor';
import { useSettings } from '../contexts/SettingsContext';

interface BoundaryEditorProps {
  id: string;
  isTopLevel?: boolean;
  allowSplit?: boolean;
  onToggleSplit: () => void;
  onInsertImage: () => void;
}

export const BoundaryEditor = React.memo(({
  id,
  isTopLevel,
  allowSplit = true,
  onToggleSplit,
  onInsertImage
}: BoundaryEditorProps) => {
  const { theme } = useSettings();
  const isDark = theme === 'dark';
  const [isClicked, setIsClicked] = useState(false);
  
  const handleClick = (action: () => void) => {
    setIsClicked(true);
    action();
  };
  
  return (
    <div 
      className={cn("boundary-wrapper", isTopLevel && "is-top-level", isDark ? "dark" : "", isClicked && "opacity-0")}
      onMouseLeave={() => setIsClicked(false)}
    >
      <div className="boundary-line" />
      <div className={cn("boundary-content", isDark ? "bg-[#252525]" : "bg-stone-50")}>
        {allowSplit && (
          <button 
            disabled={isClicked}
            onClick={() => handleClick(onToggleSplit)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all shadow-sm border pointer-events-auto",
              isDark ? "bg-[#222] border-white/10 text-white/80 hover:bg-white/10 hover:text-white" : "bg-white border-stone-200 text-stone-600 hover:bg-stone-100 hover:text-stone-900",
              isClicked && "cursor-default"
            )}
            title="이곳을 기준으로 새로운 단위(분할) 생성"
          >
            <Plus className="w-3 h-3" />
            <span>분할</span>
          </button>
        )}
        <button 
          disabled={isClicked}
          onClick={() => handleClick(onInsertImage)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all shadow-sm border pointer-events-auto",
            isDark ? "bg-[#222] border-white/10 text-white/80 hover:bg-white/10 hover:text-white" : "bg-white border-stone-200 text-stone-600 hover:bg-stone-100 hover:text-stone-900",
            isClicked && "cursor-default"
          )}
          title="이미지 삽입"
        >
          <ImageIcon className="w-3 h-3" />
          <span>이미지</span>
        </button>
      </div>
    </div>
  );
});
