import React from 'react';
import { X } from 'lucide-react';
import { MultiColorCharInfo } from '../parser';

interface UnifyCharactersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnify: () => void;
  onKeepSeparate: () => void;
  characters?: MultiColorCharInfo[];
}

export const UnifyCharactersModal: React.FC<UnifyCharactersModalProps> = ({
  isOpen,
  onClose,
  onUnify,
  onKeepSeparate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div 
        className="bg-[#1e1e1e] border border-white/10 rounded-2xl shadow-2xl w-full max-w-[460px] overflow-hidden flex flex-col pointer-events-auto animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">
            캐릭터 색상 통일
          </h2>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors outline-none"
            title="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-5">
          <p className="text-[12px] text-white/90 leading-normal whitespace-normal">
            하나의 이름이 여러 색상으로 등록된 캐릭터가 존재합니다. 마지막 색상을 기준으로 하나의 캐릭터로 통일하시겠습니까?
          </p>

          {/* Action Buttons: Left (Pink) & Right (Gray), pure text with no icons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onUnify}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#e6005c] hover:bg-[#ff1a75] text-white text-[12px] font-bold text-center transition-colors shadow-sm"
            >
              마지막 색상으로 통일
            </button>
            <button
              onClick={onKeepSeparate}
              className="flex-1 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 hover:text-white text-[12px] font-medium text-center transition-colors"
            >
              색상별 분리
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
