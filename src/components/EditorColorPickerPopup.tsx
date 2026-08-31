import React, { useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Pipette, Check, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import { cn } from '../utils';

interface EditorColorPickerPopupProps {
  color: string;
  triggerRect: DOMRect | null;
  onClose: () => void;
  onChange: (color: string) => void;
  onChangeComplete?: (color: string) => void;
  title?: string;
}

// 8 Columns x 7 Rows Multi-Shade Grid
const COLOR_SHADE_GRID = [
  // Row 1: Grayscale / Mono
  ['#000000', '#2d2d2d', '#555555', '#777777', '#999999', '#bbbbbb', '#dddddd', '#ffffff'],
  // Row 2: Pure / Vivid Hues
  ['#ff3b30', '#ff9500', '#ffcc00', '#34c759', '#007aff', '#1d4ed8', '#af52de', '#ff2d55'],
  // Row 3: Very Light / Pastel Tints
  ['#ffe5e5', '#ffedd5', '#fef9c3', '#dcfce7', '#e0f2fe', '#dbeafe', '#f3e8ff', '#fce7f3'],
  // Row 4: Soft / Light
  ['#fca5a5', '#fdba74', '#fde047', '#86efac', '#7dd3fc', '#93c5fd', '#d8b4fe', '#f472b6'],
  // Row 5: Medium / Base
  ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7', '#ec4899'],
  // Row 6: Rich / Dark
  ['#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0891b2', '#2563eb', '#9333ea', '#db2777'],
  // Row 7: Deep / Very Dark
  ['#991b1b', '#9a3412', '#854d0e', '#166534', '#155e75', '#1e40af', '#6b21a8', '#9d174d']
];

const RECENT_COLORS_KEY = 'recent_text_format_colors';

const getInitialRecentColors = (): string[] => {
  try {
    const saved = localStorage.getItem(RECENT_COLORS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    // ignore
  }
  return []; // 이용자가 이전에 저장한 커스텀 색상이 없으면 빈 배열로 시작
};

export const EditorColorPickerPopup: React.FC<EditorColorPickerPopupProps> = ({
  color,
  triggerRect,
  onClose,
  onChange,
  onChangeComplete,
  title = '색상'
}) => {
  const [selectedColor, setSelectedColor] = useState(color || '#ff3b30');
  const [recentColors, setRecentColors] = useState<string[]>(getInitialRecentColors);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [position, setPosition] = useState({ top: -9999, left: -9999 });
  const [isPositioned, setIsPositioned] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (popupRef.current && triggerRect) {
      const popupRect = popupRef.current.getBoundingClientRect();
      const popupWidth = popupRect.width;
      const popupHeight = popupRect.height;

      let top = triggerRect.bottom + 4;
      let left = triggerRect.left;

      if (left + popupWidth > window.innerWidth - 8) {
        left = window.innerWidth - popupWidth - 8;
      }
      if (left < 8) left = 8;

      if (top + popupHeight > window.innerHeight - 8) {
        top = triggerRect.top - popupHeight - 4;
      }
      if (top < 8) top = 8;

      setPosition({ top, left });
      requestAnimationFrame(() => {
        setIsPositioned(true);
      });
    }
  }, [triggerRect, showCustomPicker, recentColors.length]);

  const saveRecentColor = (newColor: string) => {
    if (!newColor) return;
    const normalized = newColor.toLowerCase();
    const filtered = recentColors.filter(c => c.toLowerCase() !== normalized);
    const nextList = [normalized, ...filtered].slice(0, 23); // 최대 3줄(23개 + 1개 버튼 = 24슬롯)
    setRecentColors(nextList);
    try {
      localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(nextList));
    } catch (e) {
      // ignore
    }
  };

  const handleSelectColor = (chosenColor: string) => {
    setSelectedColor(chosenColor);
    saveRecentColor(chosenColor);
    onChange(chosenColor);
    if (onChangeComplete) onChangeComplete(chosenColor);
    onClose();
  };

  // 총 몇 칸의 그리드로 채울지 계산 (최소 1줄 8칸, 등록될 때마다 8, 16, 24... 단위로 늘어남)
  const totalSlots = Math.max(8, Math.ceil((recentColors.length + 1) / 8) * 8);
  const emptySlotsCount = totalSlots - (recentColors.length + 1);

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0" onClick={onClose} />
      <div
        ref={popupRef}
        className={cn(
          "absolute p-2.5 bg-[#1c1c22] text-white rounded-lg shadow-xl border border-white/15 w-[184px] select-none space-y-2",
          isPositioned ? "animate-in fade-in zoom-in-95 duration-100" : "invisible opacity-0"
        )}
        style={{ top: position.top, left: position.left }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between text-[10px] font-medium text-stone-300 border-b border-white/10 pb-1">
          <span>{title}</span>
          <div className="flex items-center gap-1">
            <span
              className="w-3 h-3 rounded-xs border border-white/30 shadow-2xs"
              style={{ backgroundColor: selectedColor }}
            />
            <span className="text-[9px] font-mono text-stone-400">{selectedColor.toUpperCase()}</span>
          </div>
        </div>

        {/* 1. Shade Palette (8열 x 7행) */}
        <div className="space-y-1">
          <div className="flex flex-col gap-1">
            {COLOR_SHADE_GRID.map((row, rIdx) => (
              <div key={`row-${rIdx}`} className="grid grid-cols-8 gap-1">
                {row.map((c) => {
                  const isSelected = selectedColor.toLowerCase() === c.toLowerCase();
                  const isLight = ['#ffffff', '#dddddd', '#bbbbbb', '#ffe5e5', '#ffedd5', '#fef9c3', '#dcfce7', '#e0f2fe', '#dbeafe', '#f3e8ff', '#fce7f3', '#fde047', '#86efac', '#7dd3fc', '#93c5fd', '#fca5a5', '#fdba74', '#ffcc00'].includes(c.toLowerCase());
                  return (
                    <button
                      key={`shade-${c}-${rIdx}`}
                      type="button"
                      onClick={() => handleSelectColor(c)}
                      className={cn(
                        "w-4 h-4 rounded-xs border transition-all flex items-center justify-center shrink-0 cursor-pointer hover:scale-110 active:scale-95",
                        isSelected
                          ? "border-white ring-1.5 ring-pink-500 scale-105 z-10 shadow-xs"
                          : "border-white/10 hover:border-white/50"
                      )}
                      style={{ backgroundColor: c }}
                      title={c}
                    >
                      {isSelected && (
                        <Check className={cn("w-2 h-2 font-black", isLight ? "text-black" : "text-white")} />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* 구분선 */}
        <hr className="border-t border-white/10 my-1" />

        {/* 2. 커스텀 색상 (첫 번째 칸은 피커 버튼, 없으면 빈칸, 많아지면 2~3줄로 자동 확장) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-stone-400">커스텀 색상</span>
            <button
              type="button"
              onClick={() => setShowCustomPicker(!showCustomPicker)}
              className="text-stone-400 hover:text-white transition-colors cursor-pointer p-0.5"
              title="컬러 피커 토글"
            >
              {showCustomPicker ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
            </button>
          </div>

          <div className="grid grid-cols-8 gap-1 items-center">
            {/* 1번째 칸: 심플한 커스텀 컬러 피커 (+) 버튼 */}
            <button
              type="button"
              onClick={() => setShowCustomPicker(!showCustomPicker)}
              className={cn(
                "w-4 h-4 rounded-xs border transition-all flex items-center justify-center cursor-pointer shrink-0 relative group hover:scale-110 active:scale-95",
                showCustomPicker
                  ? "bg-pink-600 border-white text-white ring-1.5 ring-pink-400"
                  : "bg-stone-800 border-white/25 text-stone-300 hover:border-white/60 hover:text-white"
              )}
              title="색상 직접 고르기"
            >
              <Pipette className="w-2.5 h-2.5" />
            </button>

            {/* 사용자가 사용한 커스텀 색상 목록 */}
            {recentColors.map((c, i) => {
              const isSelected = selectedColor.toLowerCase() === c.toLowerCase();
              return (
                <button
                  key={`recent-${c}-${i}`}
                  type="button"
                  onClick={() => handleSelectColor(c)}
                  className={cn(
                    "w-4 h-4 rounded-xs border transition-all flex items-center justify-center shrink-0 cursor-pointer hover:scale-110 active:scale-95",
                    isSelected
                      ? "border-white ring-1.5 ring-pink-500 scale-105 z-10"
                      : "border-white/20 hover:border-white/60"
                  )}
                  style={{ backgroundColor: c }}
                  title={c}
                >
                  {isSelected && (
                    <Check className="w-2 h-2 text-white drop-shadow-2xs" />
                  )}
                </button>
              );
            })}

            {/* 사용자가 사용한 커스텀 색상이 없거나 채워지지 않은 빈 스와치 칸들 */}
            {Array.from({ length: emptySlotsCount }).map((_, idx) => (
              <div
                key={`empty-slot-${idx}`}
                className="w-4 h-4 rounded-xs border border-dashed border-white/10 bg-white/2 shrink-0"
              />
            ))}
          </div>
        </div>

        {/* 3. 펼쳐지는 컴팩트 컬러 피커 */}
        {showCustomPicker && (
          <div className="pt-1.5 border-t border-white/10 space-y-1.5 animate-in fade-in duration-100">
            <div className="react-colorful-custom overflow-hidden rounded border border-white/10 scale-95 origin-top -my-1">
              <HexColorPicker
                color={selectedColor}
                onChange={(newColor) => {
                  setSelectedColor(newColor);
                  onChange(newColor);
                }}
              />
            </div>
            <div className="flex items-center gap-1 pt-1">
              <input
                type="text"
                value={selectedColor.toUpperCase()}
                onChange={(e) => {
                  let val = e.target.value.trim();
                  if (!val.startsWith('#')) val = '#' + val;
                  setSelectedColor(val);
                  if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                    onChange(val);
                  }
                }}
                className="flex-1 min-w-0 bg-stone-900 border border-white/20 rounded px-1 py-0.5 text-[9px] font-mono text-center text-white outline-none focus:border-pink-500"
              />
              <button
                type="button"
                onClick={() => handleSelectColor(selectedColor)}
                className="px-1.5 py-0.5 bg-stone-700 hover:bg-stone-600 text-white text-[9px] font-medium rounded cursor-pointer transition-colors shrink-0"
              >
                선택
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
