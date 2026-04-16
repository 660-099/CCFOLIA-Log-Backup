import React, { useState, useEffect } from 'react';
import { AlignLeft, AlignCenter, AlignRight, Trash2, Image as ImageIcon } from 'lucide-react';
import { cn, r } from '../utils';

export const LogImage = React.memo(({ url, width, align = 'center', onDelete, onUpdateWidth, onUpdateAlign, paddingSize }: any) => {
  const [hasError, setHasError] = useState(false);
  const [widthInput, setWidthInput] = useState(width || '');

  useEffect(() => {
    setWidthInput(width || '');
  }, [width]);

  return (
    <div style={{ 
      margin: `10px ${r(paddingSize * 1.3)}px`, 
      position: 'relative',
      display: 'flex',
      justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'
    }} className="group/img">
      {hasError ? (
        <div className="flex flex-col items-center justify-center p-8 bg-red-500/10 border border-red-500/20 rounded-xl gap-2 w-full">
          <div className="text-red-400/40">
            <ImageIcon className="w-8 h-8" />
          </div>
          <div className="text-[11px] font-bold text-red-400">잘못된 URL입니다</div>
          <div className="text-[9px] text-red-400/60 break-all px-4 text-center">{url}</div>
        </div>
      ) : (
        <img 
          src={url} 
          alt="" 
          style={{ 
            maxWidth: '100%', 
            width: width ? `${width}px` : 'auto',
            height: 'auto',
            borderRadius: '8px',
            display: 'block'
          }} 
          onError={() => setHasError(true)}
          referrerPolicy="no-referrer"
        />
      )}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/img:opacity-100 transition-opacity z-10">
        <div className="flex items-center bg-stone-900/90 backdrop-blur-sm rounded-lg overflow-hidden border border-white/20 shadow-xl">
          <div className="flex border-r border-white/10">
            <button 
              onClick={() => onUpdateAlign('left')} 
              className={cn("p-1.5 hover:bg-white/10 transition-colors", align === 'left' ? "text-[#e6005c]" : "text-white/40")}
              title="좌측 정렬"
            >
              <AlignLeft className="w-3 h-3" />
            </button>
            <button 
              onClick={() => onUpdateAlign('center')} 
              className={cn("p-1.5 hover:bg-white/10 transition-colors", align === 'center' ? "text-[#e6005c]" : "text-white/40")}
              title="중앙 정렬"
            >
              <AlignCenter className="w-3 h-3" />
            </button>
            <button 
              onClick={() => onUpdateAlign('right')} 
              className={cn("p-1.5 hover:bg-white/10 transition-colors", align === 'right' ? "text-[#e6005c]" : "text-white/40")}
              title="우측 정렬"
            >
              <AlignRight className="w-3 h-3" />
            </button>
          </div>
          <input 
            type="text"
            value={widthInput}
            onChange={(e) => setWidthInput(e.target.value)}
            onBlur={() => onUpdateWidth(widthInput)}
            onKeyDown={(e) => e.key === 'Enter' && onUpdateWidth(widthInput)}
            placeholder="너비(px)"
            className="w-16 bg-transparent text-[10px] text-white px-2 py-1.5 outline-none placeholder:text-white/30"
          />
          <div className="px-1.5 py-1.5 bg-white/10 text-[9px] text-white/50 border-l border-white/10">px</div>
        </div>
        <button 
          onClick={onDelete}
          className="w-7 h-7 flex items-center justify-center bg-red-500 text-white rounded hover:bg-red-600 transition-colors shadow-xl"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
});
