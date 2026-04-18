import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Check, Edit2, Pencil } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import { cn, hexToRgbValues, rgbToHexValues, hexToHsl } from '../utils';
import { ColorPickerPopupProps } from '../types';

export const CharacterNameWithTooltip = ({ name }: { name: string }) => {
  const [isTruncated, setIsTruncated] = useState(false);
  const spanRef = useRef<HTMLSpanElement>(null);

  const checkTruncation = () => {
    if (spanRef.current) {
      setIsTruncated(spanRef.current.scrollWidth > spanRef.current.clientWidth);
    }
  };

  return (
    <div className="flex-1 min-w-0 relative group/tooltip">
      <span 
        ref={spanRef}
        onMouseEnter={checkTruncation}
        className="text-[10px] font-bold truncate block text-white cursor-default"
      >
        {name}
      </span>
      {isTruncated && (
        <div className="absolute left-0 bottom-full mb-1 px-2 py-1 bg-stone-800 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-all duration-200 pointer-events-none z-[100] shadow-xl border border-white/10">
          {name}
        </div>
      )}
    </div>
  );
};

const DEFAULT_COLORS = [
  '#212121', '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3',
  '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b',
  '#ffc107', '#ff9800', '#ff5722', '#795548', '#607d8b', '#9e9e9e', '#e0e0e0'
];

export const ColorPickerPopup = ({ color, extractedColors, triggerRect, onClose, onChange }: ColorPickerPopupProps) => {
  const [mode, setMode] = useState<'hex' | 'rgb' | 'hsl'>('hex');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedColor, setSelectedColor] = useState(color);
  const [tempColorInput, setTempColorInput] = useState(color);
  const [position, setPosition] = useState({ top: -9999, left: -9999 });
  const [isPositioned, setIsPositioned] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (popupRef.current && triggerRect) {
      const popupRect = popupRef.current.getBoundingClientRect();
      const popupWidth = popupRect.width;
      const popupHeight = popupRect.height;
      
      let top = triggerRect.bottom + 8;
      let left = triggerRect.left;

      // Check right edge
      if (left + popupWidth > window.innerWidth) {
        left = triggerRect.right - popupWidth;
      }
      
      // Check left edge
      if (left < 0) {
        left = 8;
      }

      // Check bottom edge
      if (top + popupHeight > window.innerHeight) {
        top = triggerRect.top - popupHeight - 8;
      }
      
      // Check top edge
      if (top < 0) {
        top = 8;
      }

      setPosition({ top, left });
      
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsPositioned(true);
        });
      });
    }
  }, [triggerRect]);

  const rgb = hexToRgbValues(selectedColor);
  const normalizedDefaultColors = DEFAULT_COLORS.map(c => c.toLowerCase());
  const usedColors = extractedColors.filter(c => !normalizedDefaultColors.includes(c.toLowerCase()));

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0" onClick={onClose} />
      <div 
        ref={popupRef}
        className={cn(
          "absolute p-4 bg-[#222] rounded-2xl shadow-2xl border border-white/10 w-[240px] space-y-4",
          isPositioned ? "animate-in fade-in zoom-in-95 duration-200" : "invisible opacity-0"
        )}
        style={{ 
          top: position.top, 
          left: position.left,
          transition: isPositioned ? undefined : 'none'
        }}
      >
        <div className="overflow-hidden rounded-lg">
          {mode === 'hex' && (
            <div className="react-colorful-custom">
              <HexColorPicker
                color={selectedColor}
                onChange={(newColor) => {
                  setSelectedColor(newColor);
                  onChange(newColor);
                }}
              />
            </div>
          )}
          {mode === 'rgb' && (
            <div className="h-full bg-black/20 p-4 space-y-3">
              {(['r', 'g', 'b'] as const).map((channel, i) => (
                <div key={channel} className="flex items-center gap-3">
                  <span className="w-4 text-[10px] font-bold text-white/50 uppercase">{channel}</span>
                  <input
                    type="range"
                    min="0"
                    max="255"
                    value={Object.values(rgb)[i] as number}
                    onChange={(e) => {
                      const newRgb = { ...rgb, [channel]: parseInt(e.target.value) };
                      const hex = '#' + Object.values(newRgb).map(x => (x as number).toString(16).padStart(2, '0')).join('');
                      setSelectedColor(hex);
                      onChange(hex);
                    }}
                    className="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#e6005c]"
                  />
                  <span className="w-6 text-right text-[10px] text-white/80 font-mono">{Object.values(rgb)[i]}</span>
                </div>
              ))}
            </div>
          )}
          {mode === 'hsl' && (
            <div className="h-full bg-black/20 p-4 space-y-3">
              {(['h', 's', 'l'] as const).map((channel, i) => {
                const hsl = hexToHsl(selectedColor);
                const maxVal = channel === 'h' ? 360 : 100;
                return (
                  <div key={channel} className="flex items-center gap-3">
                    <span className="w-4 text-[10px] font-bold text-white/50 uppercase">{channel}</span>
                    <input
                      type="range"
                      min="0"
                      max={maxVal}
                      value={hsl[channel]}
                      onChange={(e) => {
                        const newHsl = { ...hsl, [channel]: parseInt(e.target.value) };
                        // Convert HSL back to Hex
                        let { h, s, l } = newHsl;
                        s /= 100;
                        l /= 100;
                        const k = (n: number) => (n + h / 30) % 12;
                        const a = s * Math.min(l, 1 - l);
                        const f = (n: number) =>
                          l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
                        const hex = rgbToHexValues({ r: Math.round(255 * f(0)), g: Math.round(255 * f(8)), b: Math.round(255 * f(4)) });
                        setSelectedColor(hex);
                        onChange(hex);
                      }}
                      className="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#e6005c]"
                    />
                    <span className="w-6 text-right text-[10px] text-white/80 font-mono">{hsl[channel]}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setMode('hex')}
            className={cn(
              "flex-1 py-1.5 text-[10px] font-bold rounded-lg border transition-all",
              mode === 'hex' 
                ? "bg-[#e6005c] border-[#e6005c] text-white" 
                : "bg-transparent border-white/10 text-white/40 hover:text-white"
            )}
          >
            HEX
          </button>
          <button
            onClick={() => setMode('rgb')}
            className={cn(
              "flex-1 py-1.5 text-[10px] font-bold rounded-lg border transition-all",
              mode === 'rgb' 
                ? "bg-[#e6005c] border-[#e6005c] text-white" 
                : "bg-transparent border-white/10 text-white/40 hover:text-white"
            )}
          >
            RGB
          </button>
          <button
            onClick={() => setMode('hsl')}
            className={cn(
              "flex-1 py-1.5 text-[10px] font-bold rounded-lg border transition-all",
              mode === 'hsl' 
                ? "bg-[#e6005c] border-[#e6005c] text-white" 
                : "bg-transparent border-white/10 text-white/40 hover:text-white"
            )}
          >
            HSL
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div 
            className="w-6 h-6 rounded border border-white/10 shadow-sm shrink-0" 
            style={{ backgroundColor: selectedColor }} 
          />
          {isEditing ? (
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <input
                type="text"
                value={tempColorInput}
                onChange={(e) => setTempColorInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (/^#[0-9A-Fa-f]{6}$/.test(tempColorInput)) {
                      setSelectedColor(tempColorInput);
                      onChange(tempColorInput);
                      setIsEditing(false);
                    }
                  }
                  if (e.key === 'Escape') {
                    setIsEditing(false);
                    setTempColorInput(selectedColor);
                  }
                }}
                className="w-full text-xs font-mono px-2 py-1 bg-black/40 border border-[#e6005c] rounded text-white outline-none"
                autoFocus
              />
              <button 
                onClick={() => {
                  if (/^#[0-9A-Fa-f]{6}$/.test(tempColorInput)) {
                    setSelectedColor(tempColorInput);
                    onChange(tempColorInput);
                    setIsEditing(false);
                  }
                }}
                className="p-1 bg-[#e6005c] text-white rounded shrink-0"
              >
                <Check className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div 
              className="flex-1 px-2 py-1 bg-white/5 border border-white/10 rounded cursor-pointer group hover:border-white/20 transition-colors flex items-center justify-between"
              onClick={() => {
                setTempColorInput(selectedColor);
                setIsEditing(true);
              }}
            >
              <span className="text-xs font-mono text-white/80">{selectedColor.toUpperCase()}</span>
              <Edit2 className="w-3 h-3 text-white/20 group-hover:text-white/40" />
            </div>
          )}
        </div>

        {(usedColors.length > 0 || extractedColors.length > 0) && (
          <div className="space-y-3 pt-3 border-t border-white/10">
            {usedColors.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider block">사용중인 색상</span>
                <div className="flex flex-wrap gap-1.5">
                  {usedColors.map(c => (
                    <button
                      key={`used-${c}`}
                      onClick={() => {
                        setSelectedColor(c);
                        onChange(c);
                      }}
                      className="w-5 h-5 rounded-full border border-white/20 hover:scale-110 active:scale-95 transition-all shadow-sm"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            )}
            
            <div className="space-y-1.5">
              <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider block">기본 색상</span>
              <div className="flex flex-wrap gap-1.5">
                {DEFAULT_COLORS.map(c => (
                  <button
                    key={`default-${c}`}
                    onClick={() => {
                      setSelectedColor(c);
                      onChange(c);
                    }}
                    className="w-5 h-5 rounded-full border border-white/10 hover:scale-110 active:scale-95 transition-all shadow-sm"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
