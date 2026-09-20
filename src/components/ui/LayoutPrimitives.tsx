import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { cn } from '../../utils';

export const Section = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("space-y-4", className)}>
    {children}
  </div>
);

export const MenuHeaderWrapper = ({ 
  icon: Icon, 
  title, 
  tooltip,
  isSubHeader = false
}: { 
  icon?: any, 
  title: React.ReactNode, 
  tooltip?: React.ReactNode,
  isSubHeader?: boolean
}) => (
  <div className="flex items-center gap-1.5">
    {Icon && <Icon className={cn("w-3.5 h-3.5 shrink-0", isSubHeader ? "text-white/50" : "text-white/40")} />}
    <h2 className={cn("text-[10px] font-bold tracking-tight flex items-center pr-1 m-0 p-0 leading-none", isSubHeader ? "text-white/50" : "text-white/40")}>
      {title}
    </h2>
    {tooltip && (
      <Tooltip position="right" content={typeof tooltip === 'string' ? <div className="text-[11px] leading-relaxed w-[180px] text-center">{tooltip}</div> : tooltip}>
        <HelpCircle className="w-3.5 h-3.5 text-white/40 hover:text-white/70 cursor-help transition-colors shrink-0" />
      </Tooltip>
    )}
  </div>
);

export const SectionTitle = ({ icon: Icon, title, rightElement, tooltip }: { icon?: any, title: React.ReactNode, rightElement?: React.ReactNode, tooltip?: React.ReactNode }) => (
  <div className="flex items-center justify-between min-h-[20px]">
    <MenuHeaderWrapper icon={Icon} title={title} tooltip={tooltip} />
    {rightElement && <div className="flex items-center gap-1.5">{rightElement}</div>}
  </div>
);

export const NumberAdjuster = ({ 
  label, value, min, max, step, onChange, onSave, unit = "", highlightDefault = null, icon: Icon, hideReset = false, rightElement, tooltip, isSubHeader = true
}: { 
  label?: string; value: number; min: number; max: number; step: number; 
  onChange: (val: number) => void; onSave?: (val: number) => void; unit?: string; highlightDefault?: number | null; icon?: any; hideReset?: boolean; rightElement?: React.ReactNode; tooltip?: React.ReactNode; isSubHeader?: boolean
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempVal, setTempVal] = useState(value.toString());

  const handleBlur = () => {
    let v = parseFloat(tempVal);
    if (!isNaN(v)) {
      v = Number(v.toFixed(1));
      onChange(v);
      if (onSave) onSave(v);
      setTempVal(v.toString());
    } else {
      setTempVal(value.toString());
    }
    setIsEditing(false);
  };

  const isChanged = highlightDefault !== null && value !== highlightDefault;
  const highlightColor = isChanged ? '#e6005c' : '#ffffff';

  let trackStyle = {};
  if (highlightDefault !== null && isChanged) {
    const defaultPct = ((highlightDefault - min) / (max - min)) * 100;
    const currentPct = ((value - min) / (max - min)) * 100;
    const startPct = Math.min(defaultPct, currentPct);
    const endPct = Math.max(defaultPct, currentPct);
    
    trackStyle = {
      background: `linear-gradient(to right, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.4) ${startPct}%, rgba(230, 0, 92, 0.4) ${startPct}%, rgba(230, 0, 92, 0.4) ${endPct}%, rgba(0, 0, 0, 0.4) ${endPct}%, rgba(0, 0, 0, 0.4) 100%)`
    };
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between min-h-[20px]">
        {label ? (
          <MenuHeaderWrapper icon={Icon} title={label} tooltip={tooltip} isSubHeader={isSubHeader} />
        ) : (
          <div /> /* For alignment when there's no label */
        )}
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1.5 bg-black/20 rounded-md p-0.5 border border-white/5">
            <button 
              onClick={(e) => { const v = Number(Math.max(min, value - step).toFixed(1)); onChange(v); if (onSave) onSave(v); }} 
              className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white transition-colors outline-none"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
            
            {isEditing ? (
              <input 
                type="text" 
                autoFocus 
                value={tempVal} 
                onChange={e => setTempVal(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={e => {
                  if (e.nativeEvent.isComposing) return;
                  if(e.key === 'Enter') e.currentTarget.blur();
                }}
                className="w-9 text-center text-[10px] font-bold py-0.5 bg-black/40 border border-white/20 rounded outline-none"
                style={{ color: highlightColor }}
              />
            ) : (
              <span 
                onClick={(e) => { setIsEditing(true); setTempVal(value.toString()); }} 
                className="text-[10px] font-bold py-0.5 cursor-pointer flex items-center justify-center hover:bg-white/5 rounded min-w-[28px] text-center shrink-0"
                style={{ color: highlightColor }}
              >
                {value > 0 && label === '자간' ? `+${value}` : value}{unit}
              </span>
            )}
            
            <button 
              onClick={(e) => { const v = Number(Math.min(max, value + step).toFixed(1)); onChange(v); if (onSave) onSave(v); }} 
              className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white transition-colors outline-none"
            >
              <ChevronUp className="w-3 h-3" />
            </button>
          </div>
          {highlightDefault !== null && !hideReset && (
            <button 
              onClick={(e) => { onChange(highlightDefault); if (onSave) onSave(highlightDefault); }}
              disabled={!isChanged}
              className={cn("p-1 rounded transition-colors outline-none shrink-0", isChanged ? "text-white/70 hover:text-white hover:bg-white/10" : "text-white/30")}
              title="기본값으로 초기화"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          {rightElement}
        </div>
      </div>
      <div className="relative flex items-center h-2 group">
        <input 
          type="range" min={min} max={max} step={step} value={value} 
          onChange={(e) => onChange(Number(parseFloat(e.target.value).toFixed(1)))}
          onMouseUp={(e) => { if (onSave) onSave(Number(parseFloat(e.currentTarget.value).toFixed(1))); }}
          onTouchEnd={(e) => { if (onSave) onSave(Number(parseFloat(e.currentTarget.value).toFixed(1))); }}
          onKeyUp={(e) => { if (onSave) onSave(Number(parseFloat(e.currentTarget.value).toFixed(1))); }}
          className={cn("w-full h-1 bg-black/40 rounded-lg appearance-none cursor-pointer relative z-10 focus:outline-none focus:ring-0", 
            isChanged ? "accent-[#e6005c]" : "accent-white/70"
          )}
          style={trackStyle}
        />
      </div>
    </div>
  );
};

export const Tooltip = ({ 
  children, 
  content, 
  position = 'top',
  className,
  unstyled = false
}: { 
  children: React.ReactNode; 
  content: React.ReactNode; 
  position?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
  unstyled?: boolean;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, opacity: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    let top = 0;
    let left = 0;
    const margin = 8;

    let finalPosition = position;

    // Flip logic
    if (position === 'top' && triggerRect.top - tooltipRect.height - margin < 0) finalPosition = 'bottom';
    if (position === 'bottom' && triggerRect.bottom + tooltipRect.height + margin > window.innerHeight) finalPosition = 'top';
    if (position === 'left' && triggerRect.left - tooltipRect.width - margin < 0) finalPosition = 'right';
    if (position === 'right' && triggerRect.right + tooltipRect.width + margin > window.innerWidth) finalPosition = 'left';

    switch (finalPosition) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - margin;
        left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'bottom':
        top = triggerRect.bottom + margin;
        left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
        left = triggerRect.left - tooltipRect.width - margin;
        break;
      case 'right':
        top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
        left = triggerRect.right + margin;
        break;
    }

    if (left < margin) left = margin;
    else if (left + tooltipRect.width > window.innerWidth - margin) {
      left = window.innerWidth - tooltipRect.width - margin;
    }
    
    if (top < margin) top = margin;
    else if (top + tooltipRect.height > window.innerHeight - margin) {
      top = window.innerHeight - tooltipRect.height - margin;
    }

    setCoords({ top, left, opacity: 1 });
  }, [position]);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        updatePosition();
      }, 0);
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    } else {
      setCoords(prev => ({ ...prev, opacity: 0 }));
    }
  }, [isVisible, updatePosition]);

  return (
    <>
      <div 
        ref={triggerRef}
        onMouseEnter={() => setIsVisible(true)}
        onFocus={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onBlur={() => setIsVisible(false)}
        className={cn("inline-flex", !unstyled && "cursor-help")}
      >
        {children}
      </div>
      {isVisible && createPortal(
        <div 
          ref={tooltipRef}
          style={{ 
            top: coords.top, 
            left: coords.left, 
            opacity: coords.opacity,
            transition: 'opacity 0.2s',
            visibility: coords.opacity === 0 ? 'hidden' : 'visible'
          }}
          className={unstyled ? `fixed z-[9999] pointer-events-none ${className || ''}` : cn("fixed z-[9999] bg-[#1a1a1a] border border-white/10 rounded-xl p-3 text-[11px] leading-relaxed text-white/70 shadow-2xl pointer-events-none w-max max-w-xs font-normal text-left break-keep", className)}
        >
          {content}
        </div>,
        document.body
      )}
    </>
  );
};

export const PortalDropdown = ({ isOpen, onClose, triggerRef, children, position = 'bottom-right' }: { isOpen: boolean, onClose: () => void, triggerRef: React.RefObject<HTMLElement>, children: React.ReactNode, position?: 'bottom-right' | 'right' }) => {
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isCalculated, setIsCalculated] = useState(false);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !dropdownRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const dropdownRect = dropdownRef.current.getBoundingClientRect();
    
    let top = triggerRect.top;
    let left = triggerRect.right + 4;

    if (position === 'bottom-right') {
      top = triggerRect.bottom + 4;
      if (top + dropdownRect.height > window.innerHeight - 10) {
        top = triggerRect.top - dropdownRect.height - 4;
      }
      left = triggerRect.right - dropdownRect.width;
    } else if (position === 'right') {
      top = triggerRect.top;
      if (top + dropdownRect.height > window.innerHeight - 10) {
        top = window.innerHeight - dropdownRect.height - 10;
      }
      if (left + dropdownRect.width > window.innerWidth - 10) {
        left = triggerRect.left - dropdownRect.width - 4;
      }
    }

    setCoords({
      top,
      left
    });
    setIsCalculated(true);
  }, [triggerRef, position]);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const timer = setTimeout(updatePosition, 0);
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    } else {
      setIsCalculated(false);
    }
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      // Find the library dropdown ref element by looking through the path
      const target = e.target as Node;
      if (
        dropdownRef.current && !dropdownRef.current.contains(target) &&
        triggerRef.current && !triggerRef.current.contains(target)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, onClose, triggerRef]);

  // Instead of completely unmounting, we keep it mounted but hidden initially, 
  // or return null only when isOpen is entirely false and animation not needed.
  if (!isOpen) return null;

  return createPortal(
    <div
      ref={dropdownRef}
      style={{ 
        top: coords.top, 
        left: coords.left,
        visibility: isCalculated ? 'visible' : 'hidden',
        opacity: isCalculated ? 1 : 0
      }}
      className="fixed z-[9999]"
      onClick={e => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  );
};

export const SizeControl = ({ value, onChange }: { value: string; onChange: (val: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const numericMatch = (value || '100%').match(/^(\d+)(%|px)$/);
  const numVal = numericMatch ? numericMatch[1] : (value || '100').replace(/\D/g, '') || '100';
  const unitVal = (value || '%').includes('px') ? 'px' : '%';

  const presets = unitVal === '%' ? ['100%', '80%', '50%'] : ['400px', '300px', '200px'];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUnitChange = (newUnit: '%' | 'px') => {
    if (newUnit === unitVal) return;
    if (newUnit === '%') {
      const num = Number(numVal);
      const nextNum = num > 100 ? 100 : num;
      onChange(`${nextNum}%`);
    } else {
      const num = Number(numVal);
      const nextNum = num <= 100 ? (num === 100 ? 400 : num * 4) : num;
      onChange(`${nextNum}px`);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      {/* Combobox: Input + Dropdown Arrow */}
      <div ref={ref} className="relative flex items-center bg-black/20 rounded-lg h-7 border border-white/10 focus-within:border-[#e6005c] transition-colors">
        <input
          type="text"
          value={numVal}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, '');
            onChange(raw ? `${raw}${unitVal}` : `100${unitVal}`);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-12 h-full text-center text-[10px] font-mono font-bold bg-transparent border-none outline-none text-white px-1 placeholder:text-white/40"
          placeholder="100"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="h-full px-1.5 flex items-center justify-center text-white/50 hover:text-white border-l border-white/5 transition-colors"
          title="프리셋 목록"
        >
          <ChevronDown className="w-3 h-3" />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-24 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-2 py-0.5 text-[8px] font-bold text-white/40 uppercase tracking-wider">프리셋</div>
            {presets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={(e) => {
                  onChange(preset);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full text-left px-2.5 py-1 text-[10px] font-mono font-bold hover:bg-white/10 transition-colors flex items-center justify-between",
                  value === preset ? "text-[#e6005c] bg-white/5" : "text-white/90"
                )}
              >
                {preset}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Dropdown 우측 단위 선택 버튼 (% / px) */}
      <div className="flex bg-black/20 p-0.5 rounded-lg border border-white/5 h-7 items-center">
        <button
          type="button"
          onClick={() => handleUnitChange('%')}
          className={cn(
            "h-6 px-2 text-[9px] font-mono font-bold rounded transition-all flex items-center justify-center",
            unitVal === '%' 
              ? "bg-white/10 text-white font-bold shadow-sm" 
              : "text-white/40 hover:text-white/70"
          )}
        >
          %
        </button>
        <button
          type="button"
          onClick={() => handleUnitChange('px')}
          className={cn(
            "h-6 px-2 text-[9px] font-mono font-bold rounded transition-all flex items-center justify-center",
            unitVal === 'px' 
              ? "bg-white/10 text-white font-bold shadow-sm" 
              : "text-white/40 hover:text-white/70"
          )}
        >
          px
        </button>
      </div>
    </div>
  );
};

