import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';
import { CharImage } from '../types';
import { useSettingsStore } from '../store/useSettingsStore';

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

interface StandingThumbnailButtonProps {
  img: CharImage;
  isSelected: boolean;
  isZoomed: boolean;
  onSelect: () => void;
  onDoubleClick: () => void;
}

const StandingThumbnailButton: React.FC<StandingThumbnailButtonProps> = ({
  img,
  isSelected,
  isZoomed,
  onSelect,
  onDoubleClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  const calculatePan = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return { x: 0, y: 0 };
    // Normalized cursor position from center (-0.5 to 0.5)
    const rawX = (e.clientX - rect.left) / rect.width - 0.5;
    const rawY = (e.clientY - rect.top) / rect.height - 0.5;
    const clampedX = Math.max(-0.5, Math.min(0.5, rawX));
    const clampedY = Math.max(-0.5, Math.min(0.5, rawY));
    
    if (isZoomed) {
      // Zoomed mode (scale 1.8, origin 50% 15%):
      // X pans +/-22%, Y pans from +8% (when looking at top) to -30% (when looking down)
      const panX = -clampedX * 44; 
      const panY = clampedY < 0 ? -clampedY * 18 : -clampedY * 50;
      return { x: panX, y: panY };
    } else {
      // Standard mode (scale 2.0 on hover, origin 50% 50%):
      // Full pan coverage across character height and width
      const panX = -clampedX * 50;
      const panY = -clampedY * 50;
      return { x: panX, y: panY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    setPanOffset(calculatePan(e));
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsHovered(true);
    setPanOffset(calculatePan(e));
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setPanOffset({ x: 0, y: 0 });
  };

  const transformStyle: React.CSSProperties = isZoomed
    ? {
        transform: isHovered 
          ? `scale(1.8) translate3d(${panOffset.x.toFixed(1)}%, ${panOffset.y.toFixed(1)}%, 0)` 
          : 'scale(1.3) translate3d(0, 0, 0)',
        transformOrigin: '50% 15%',
        objectFit: 'cover',
        objectPosition: 'top',
        padding: 0,
        transition: isHovered 
          ? 'transform 0.16s cubic-bezier(0.2, 0.8, 0.3, 1)' 
          : 'transform 0.22s cubic-bezier(0.2, 0.8, 0.3, 1)',
      }
    : {
        transform: isHovered 
          ? `scale(2.0) translate3d(${panOffset.x.toFixed(1)}%, ${panOffset.y.toFixed(1)}%, 0)` 
          : 'scale(1) translate3d(0, 0, 0)',
        transformOrigin: '50% 50%',
        objectFit: 'contain',
        objectPosition: 'center',
        padding: '6px',
        transition: isHovered 
          ? 'transform 0.16s cubic-bezier(0.2, 0.8, 0.3, 1)' 
          : 'transform 0.22s cubic-bezier(0.2, 0.8, 0.3, 1)',
      };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onDoubleClick={onDoubleClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      title={img.name ? `${img.name}${img.isRepresentative ? ' (대표)' : ''}` : (img.isRepresentative ? '대표 스탠딩' : '스탠딩')}
      className={cn(
        "relative aspect-square rounded-xl overflow-hidden border transition-all bg-black/40 flex items-center justify-center cursor-pointer group",
        isSelected
          ? "border-[#e6005c] ring-2 ring-[#e6005c]/40"
          : "border-white/10 hover:border-white/30"
      )}
    >
      {img.url?.trim() ? (
        <img 
          src={img.url.trim()} 
          alt="" 
          referrerPolicy="no-referrer" 
          style={transformStyle}
          className="w-full h-full pointer-events-none select-none" 
        />
      ) : null}
      {img.isRepresentative && (
        <div className="absolute inset-0 border-2 border-white/40 rounded-xl pointer-events-none" />
      )}
      {img.name && (
        <div className="absolute bottom-0 inset-x-0 bg-black/85 backdrop-blur-[2px] text-white text-[10px] font-medium text-center py-1 truncate px-1.5 border-t border-white/10 pointer-events-none select-none">
          {img.name}
        </div>
      )}
    </button>
  );
};

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
  const { standingZoomed: isZoomed, setStandingZoomed: setIsZoomed } = useSettingsStore();

  const selectedImgIdRef = useRef<string | null>(null);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (panelRef.current && !panelRef.current.contains(target)) {
        onClose();
      }
    };
    
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleGlobalClick);
    }, 10);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleGlobalClick);
    };
  }, [onClose]);

  const PANEL_WIDTH = 340;
  const MARGIN = 12;

  const [adjustedPos, setAdjustedPos] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    if (!triggerRect) return;
    const panel = panelRef.current;
    const panelWidth = panel?.offsetWidth || PANEL_WIDTH;
    const panelHeight = panel?.offsetHeight || 480;

    let targetLeft = triggerRect.right + MARGIN;
    if (targetLeft + panelWidth > window.innerWidth - MARGIN) {
      targetLeft = triggerRect.left - panelWidth - MARGIN;
    }
    targetLeft = Math.max(MARGIN, Math.min(targetLeft, window.innerWidth - panelWidth - MARGIN));

    let targetTop = triggerRect.top;
    if (targetTop + panelHeight > window.innerHeight - MARGIN) {
      targetTop = Math.max(MARGIN, window.innerHeight - panelHeight - MARGIN);
    }
    if (targetTop < MARGIN) {
      targetTop = MARGIN;
    }

    setAdjustedPos({ left: targetLeft, top: targetTop });
  }, [triggerRect, images.length, isZoomed]);

  if (!triggerRect) return null;

  let initialLeft = triggerRect.right + MARGIN;
  if (initialLeft + PANEL_WIDTH > window.innerWidth - MARGIN) {
    initialLeft = triggerRect.left - PANEL_WIDTH - MARGIN;
  }
  initialLeft = Math.max(MARGIN, Math.min(initialLeft, window.innerWidth - PANEL_WIDTH - MARGIN));
  const initialTop = Math.max(MARGIN, Math.min(triggerRect.top, window.innerHeight - 500 - MARGIN));

  const left = adjustedPos ? adjustedPos.left : initialLeft;
  const top = adjustedPos ? adjustedPos.top : initialTop;

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
        style={{ left, top, width: PANEL_WIDTH, maxHeight: `calc(100vh - ${MARGIN * 2}px)` }}
      >
        <div className="flex items-center justify-between p-3 border-b border-white/5 bg-white/5 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0 pr-2">
            <span className="text-[11px] font-bold truncate" style={{ color }}>{charName}</span>
            <span className="text-[11px] font-bold text-white/40 mx-0.5">–</span>
            <span className="text-[11px] font-bold text-white/80 shrink-0">스탠딩 변경</span>
          </div>
          <button
            type="button"
            onClick={() => setIsZoomed(!isZoomed)}
            className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-all shrink-0 border select-none cursor-pointer",
              isZoomed
                ? "bg-[#e6005c] border-[#e6005c] text-white shadow-sm"
                : "bg-white/5 hover:bg-white/10 border-white/10 text-white/60 hover:text-white"
            )}
            title="상단 부분을 확대하여 표정을 크게 봅니다"
          >
            <span>크게 보기</span>
          </button>
        </div>
        
        <div className="p-3 overflow-y-auto max-h-[360px] custom-scrollbar flex-1">
          <div className="grid grid-cols-2 gap-2.5">
            {images.map(img => (
              <StandingThumbnailButton
                key={img.id}
                img={img}
                isSelected={selectedImgId === img.id}
                isZoomed={isZoomed}
                onSelect={() => {
                  if (selectedImgId === img.id) {
                    onSelectSingle(img.id);
                  } else {
                    setSelectedImgId(img.id);
                    selectedImgIdRef.current = img.id;
                  }
                }}
                onDoubleClick={() => onSelectSingle(img.id)}
              />
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
