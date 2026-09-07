import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Pin, ImageIcon, Plus, Check } from 'lucide-react';
import { cn } from '../utils';
import { CharImage } from '../types';

interface CharImagePanelPopupProps {
  charName: string;
  images: CharImage[];
  triggerRect: DOMRect | null;
  onClose: () => void;
  onAddImage: (url: string) => void;
  onRemoveImage: (id: string) => void;
  onSetRepresentative: (id: string) => void;
  isPinned: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onThumbnailHover?: (url: string | null, rect: DOMRect | null) => void;
  onTogglePin: () => void;
  color: string;
}

export const CharImagePanelPopup: React.FC<CharImagePanelPopupProps> = ({
  charName,
  images,
  triggerRect,
  onClose,
  onAddImage,
  onRemoveImage,
  onSetRepresentative,
  isPinned,
  onTogglePin,
  color,
  onMouseEnter,
  onMouseLeave,
  onThumbnailHover
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Create a list of inputs: existing images + one empty slot at the end
  const inputs = [...(images || []), { id: 'new-input', url: '', isNew: true }];

  // Auto-focus on typing
  const handleInputChange = (id: string, value: string) => {
    if (id === 'new-input' && value.trim() !== '') {
      onAddImage(value);
    }
  };

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (isPinned) return; // Don't close if pinned
      
      const target = e.target as HTMLElement;
      if (panelRef.current && !panelRef.current.contains(target)) {
        // Also check if clicking on the trigger to prevent instant reopen/close conflicts
        if (triggerRect) {
          const triggerBox = new DOMRect(triggerRect.x, triggerRect.y, triggerRect.width, triggerRect.height);
          if (
            e.clientX >= triggerBox.left &&
            e.clientX <= triggerBox.right &&
            e.clientY >= triggerBox.top &&
            e.clientY <= triggerBox.bottom
          ) {
            return;
          }
        }
        onClose();
      }
    };

    const handleGlobalMouseLeave = (e: MouseEvent) => {
      if (!isPinned) {
        // Optional: close on leaving the panel if not pinned, 
        // but App.tsx handles onMouseLeave for the trigger.
      }
    };

    document.addEventListener('mousedown', handleGlobalClick);
    return () => {
      document.removeEventListener('mousedown', handleGlobalClick);
    };
  }, [onClose, triggerRect, isPinned]);

  if (!triggerRect) return null;

  const PANEL_WIDTH = 280;
  
      let left = triggerRect.right + 12;
  if (left + PANEL_WIDTH > window.innerWidth) {
    left = triggerRect.left - PANEL_WIDTH - 12;
  }
  if (left < 12) left = 12;
  
  const isBottomHalf = triggerRect.top > window.innerHeight / 2;
  const verticalStyle = isBottomHalf 
    ? { bottom: Math.max(12, window.innerHeight - triggerRect.bottom) }
    : { top: Math.max(12, triggerRect.top) };

  return createPortal(
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, scale: 0.95, x: -10 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95, x: -10 }}
      transition={{ duration: 0.15 }}
      className="fixed z-[9999] bg-[#222] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col"
      style={{ left, ...verticalStyle, width: PANEL_WIDTH, maxHeight: '400px' }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={() => {
        if (onMouseLeave) onMouseLeave();
        if (!isPinned) onClose();
      }}
    >
      <div className="flex items-center gap-1.5 p-2.5 border-b border-white/5 bg-white/5">
        <button
          onClick={onTogglePin}
          className={cn(
            "p-1.5 rounded-md transition-colors shrink-0",
            isPinned ? "text-[#e6005c] hover:bg-[#e6005c]/10" : "text-white/40 hover:bg-white/10 hover:text-white"
          )}
          title={isPinned ? "고정 해제" : "패널 고정"}
        >
          <Pin className={cn("w-3.5 h-3.5", isPinned && "fill-current")} />
        </button>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[11px] font-bold truncate" style={{ color }}>{charName}</span>
          <span className="text-[11px] font-bold text-white/80 truncate">스탠딩 변경</span>
        </div>
      </div>
      
      <div className="overflow-y-auto custom-scrollbar p-2 space-y-2">
        <AnimatePresence mode="popLayout">
          {inputs.map((item: any, index) => {
            const isNew = item.id === 'new-input';
            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                key={item.id}
                className={cn(
                  "flex items-center gap-2 p-1.5 rounded-lg border transition-all",
                  item.isRepresentative 
                    ? "bg-[#e6005c]/10 border-[#e6005c]/30" 
                    : isNew 
                      ? "bg-transparent border-dashed border-white/20" 
                      : "bg-black/20 border-white/5 hover:border-white/10"
                )}
              >
                <button
                  onClick={() => {
                    if (!isNew && !item.isRepresentative) {
                      onSetRepresentative(item.id);
                    }
                  }}
                  onMouseEnter={(e) => {
                    if (!isNew && onThumbnailHover) {
                      onThumbnailHover(item.url, e.currentTarget.getBoundingClientRect());
                    }
                  }}
                  onMouseLeave={() => {
                    if (!isNew && onThumbnailHover) {
                      onThumbnailHover(null, null);
                    }
                  }}
                  className={cn(
                    "w-6 h-6 shrink-0 rounded overflow-hidden flex items-center justify-center transition-all",
                    item.isRepresentative
                      ? "ring-1 ring-[#e6005c] ring-offset-1 ring-offset-[#222]"
                      : isNew
                        ? "bg-white/5 text-white/30 cursor-default"
                        : "bg-white/5 text-white/30 hover:bg-white/10 hover:text-white"
                  )}
                  disabled={isNew}
                  title={isNew ? "" : item.isRepresentative ? "대표 이미지" : "대표 이미지로 설정"}
                >
                  {isNew ? (
                    <ImageIcon className="w-3.5 h-3.5" />
                  ) : (
                    <img src={item.url} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  )}
                </button>
                
                <input
                  type="text"
                  placeholder={isNew ? "새로운 이미지 URL 추가..." : "이미지 URL"}
                  value={isNew ? "" : item.url}
                  onChange={(e) => {
                    if (isNew) {
                      handleInputChange(item.id, e.target.value);
                    } else {
                      // We don't support direct editing for simplicity, or we can just ignore it
                      // Because adding a new one is easy. 
                    }
                  }}
                  readOnly={!isNew}
                  className="flex-1 min-w-0 bg-transparent text-[10px] outline-none text-white/80 placeholder:text-white/30"
                />
                
                {!isNew && (
                  <button
                    onClick={() => onRemoveImage(item.id)}
                    className="w-6 h-6 shrink-0 rounded flex items-center justify-center text-white/30 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>,
    document.body
  );
};
