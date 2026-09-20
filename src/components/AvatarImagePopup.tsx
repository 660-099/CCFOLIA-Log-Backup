import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';
import { CharImage } from '../types';

interface AvatarImagePopupProps {
  charId: string;
  charName: string;
  color: string;
  images: CharImage[];
  triggerRect: DOMRect | null;
  onClose: () => void;
  onSelectSingle: (imageId: string) => void;
  onSelectBatch: (imageId: string, startIdx: number, endIdx: number) => void;
  defaultStartIdx: number;
  defaultEndIdx: number;
}

export const AvatarImagePopup: React.FC<AvatarImagePopupProps> = ({
  charId,
  charName,
  color,
  images,
  triggerRect,
  onClose,
  onSelectSingle,
  onSelectBatch,
  defaultStartIdx,
  defaultEndIdx,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  
  const [startIdx, setStartIdx] = useState(defaultStartIdx.toString());
  const [endIdx, setEndIdx] = useState(defaultEndIdx.toString());
  const [selectedImgId, setSelectedImgId] = useState<string | null>(null);

    const selectedImgIdRef = useRef<string | null>(null);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (panelRef.current && !panelRef.current.contains(target)) {
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
        
        if (selectedImgIdRef.current) {
          onSelectSingle(selectedImgIdRef.current);
        } else {
          onClose();
        }
      }
    };
    
    setTimeout(() => {
      document.addEventListener('mousedown', handleGlobalClick);
    }, 10);
    return () => {
      document.removeEventListener('mousedown', handleGlobalClick);
    };
  }, [onClose, triggerRect, onSelectSingle]);

  if (!triggerRect) return null;

  const PANEL_WIDTH = 260;
  
      let left = triggerRect.right + 12;
  if (left + PANEL_WIDTH > window.innerWidth) {
    left = triggerRect.left - PANEL_WIDTH - 12;
  }
  if (left < 10) left = 10;
  
  const isBottomHalf = triggerRect.top > window.innerHeight / 2;
  const verticalStyle = isBottomHalf 
    ? { bottom: Math.max(12, window.innerHeight - triggerRect.bottom) }
    : { top: Math.max(12, triggerRect.top) };

  const handleBatchApply = () => {
    if (!selectedImgId) return;
    const startNum = parseInt(startIdx, 10);
    const endNum = parseInt(endIdx, 10);
    if (!isNaN(startNum) && !isNaN(endNum) && startNum <= endNum) {
      onSelectBatch(selectedImgId, startNum, endNum);
    }
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        ref={panelRef}
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.15 }}
        className="fixed z-[99999] bg-[#222] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col"
        style={{ left, ...verticalStyle, width: PANEL_WIDTH, maxHeight: '450px' }}
      >
        <div className="flex items-center gap-1.5 p-3 border-b border-white/5 bg-white/5 shrink-0">
          <span className="text-[11px] font-bold truncate" style={{ color }}>{charName}</span>
          <span className="text-[11px] font-bold text-white/40 mx-1">–</span> <span className="text-[11px] font-bold text-white/80 truncate">스탠딩 변경</span>
        </div>
        
        <div className="p-3 overflow-y-auto custom-scrollbar flex-1">
          <div className="grid grid-cols-3 gap-2">
            {images.map(img => (
              <button
                key={img.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (selectedImgId === img.id) {
                    onSelectSingle(img.id);
                  } else {
                    setSelectedImgId(img.id);
                    selectedImgIdRef.current = img.id;
                  }
                }}
                onDoubleClick={() => onSelectSingle(img.id)}
                title={img.name ? `${img.name}${img.isRepresentative ? ' (대표)' : ''}` : (img.isRepresentative ? '대표 스탠딩' : '스탠딩')}
                className={cn(
                  "relative aspect-square rounded-lg overflow-hidden border transition-all bg-black/40 flex items-center justify-center",
                  selectedImgId === img.id
                    ? "border-[#e6005c] ring-2 ring-[#e6005c]/30"
                    : "border-white/10 hover:border-white/30"
                )}
              >
                <img src={img.url} alt="" referrerPolicy="no-referrer" className="w-full h-full object-contain p-1" />
                {img.isRepresentative && (
                  <div className="absolute inset-0 border-2 border-white/40 rounded-lg pointer-events-none" />
                )}
                {img.name && (
                  <div className="absolute bottom-0 inset-x-0 bg-black/80 backdrop-blur-[2px] text-white text-[10px] font-medium text-center py-0.5 truncate px-1 border-t border-white/10">
                    {img.name}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 border-t border-white/5 bg-black/20 shrink-0">
          <div className="text-[10px] text-white/50 mb-2 font-bold px-1">블록 #으로 범위 지정</div>
          <div className="flex items-center gap-2 mb-3">
            <input 
              type="number"
              value={startIdx}
              onChange={e => setStartIdx(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-[11px] text-white outline-none focus:border-[#e6005c] text-center font-mono"
            />
            <span className="text-white/40 text-xs">~</span>
            <input 
              type="number"
              value={endIdx}
              onChange={e => setEndIdx(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-[11px] text-white outline-none focus:border-[#e6005c] text-center font-mono"
            />
            <button
              onClick={handleBatchApply}
              disabled={!selectedImgId || !startIdx || !endIdx || parseInt(startIdx,10) > parseInt(endIdx,10)}
              className="shrink-0 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 text-white rounded text-[11px] px-3 py-1.5 font-bold transition-colors whitespace-nowrap"
            >
              구간 적용
            </button>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (selectedImgId) onSelectSingle(selectedImgId);
              }}
              disabled={!selectedImgId}
              className="flex-1 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 text-white rounded text-[11px] py-2 font-bold transition-colors"
            >
              현재 블록만
            </button>
            <button
              onClick={() => {
                if (selectedImgId) onSelectBatch(selectedImgId, 1, 999999);
              }}
              disabled={!selectedImgId}
              className="flex-1 bg-[#e6005c] hover:bg-[#ff007f] disabled:opacity-30 disabled:hover:bg-[#e6005c] text-white rounded text-[11px] py-2 font-bold transition-colors"
            >
              전체 적용
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};
