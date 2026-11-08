import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Scissors, Loader2 } from 'lucide-react';
import { BlogHtmlChunk } from '../utils/htmlGenerator';

interface ChunkCopyModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  totalLogsCount: number;
  onGenerateChunks: (chunkSize: number) => Promise<BlogHtmlChunk[]>;
  onCopyAllAtOnce: () => Promise<void>;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
};

const getSavedChunkSize = (): number => {
  try {
    const saved = localStorage.getItem('ccfolia_chunk_size');
    if (saved) {
      const val = parseInt(saved, 10);
      if (!isNaN(val) && val >= 1) return val;
    }
  } catch {}
  return 1500;
};

export const ChunkCopyModal: React.FC<ChunkCopyModalProps> = ({
  isOpen,
  onClose,
  title,
  totalLogsCount,
  onGenerateChunks,
  onCopyAllAtOnce,
}) => {
  const [sliderValue, setSliderValue] = useState<number>(() => getSavedChunkSize());
  const [appliedChunkSize, setAppliedChunkSize] = useState<number>(() => getSavedChunkSize());
  const [hasApplied, setHasApplied] = useState<boolean>(false);
  const [chunks, setChunks] = useState<BlogHtmlChunk[]>([]);
  const [copiedIndices, setCopiedIndices] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastCopiedPart, setLastCopiedPart] = useState<number | null>(null);

  // Reset state when modal opens, restoring previously saved chunk size
  useEffect(() => {
    if (isOpen) {
      setCopiedIndices(new Set());
      setLastCopiedPart(null);
      setChunks([]);
      setHasApplied(false);
      const saved = getSavedChunkSize();
      setSliderValue(saved);
      setAppliedChunkSize(saved);
    }
  }, [isOpen]);

  const loadChunks = async (size: number) => {
    setIsLoading(true);
    // Yield a frame to the browser event loop so the spinning animation paints and starts immediately
    await new Promise((resolve) => setTimeout(resolve, 50));
    try {
      const generated = await onGenerateChunks(size);
      setChunks(generated);
      setAppliedChunkSize(size);
      setHasApplied(true);
    } catch (err: any) {
      console.error('Error generating chunks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    const validSize = Math.max(1, sliderValue || 1500);
    try {
      localStorage.setItem('ccfolia_chunk_size', String(validSize));
    } catch {}
    setSliderValue(validSize);
    loadChunks(validSize);
  };

  const handleCopyChunk = async (chunk: BlogHtmlChunk) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(chunk.html);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = chunk.html;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedIndices(prev => {
        const next = new Set(prev);
        next.add(chunk.partIndex);
        return next;
      });
      setLastCopiedPart(chunk.partNumber);
    } catch (err) {
      console.error('Failed to copy chunk:', err);
    }
  };

  if (!isOpen) return null;

  const effectiveValue = sliderValue || 1500;
  const isPendingApply = !hasApplied || sliderValue !== appliedChunkSize;

  // Realistic estimation factoring in header code capacity reduction in Part 1 (~350-450 equivalent blocks)
  const headerDeduction = Math.min(Math.floor(effectiveValue * 0.35), 450);
  const part1Capacity = Math.max(100, effectiveValue - headerDeduction);
  const estimatedParts = totalLogsCount <= 0
    ? 1
    : totalLogsCount <= part1Capacity
      ? 1
      : 1 + Math.ceil((totalLogsCount - part1Capacity) / effectiveValue);

  return (
    <div 
      className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-[420px] bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10 shrink-0 bg-white/[0.02]">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-[#e6005c]/20 text-[#e6005c] shrink-0">
              <Scissors className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate">분할 복사</h3>
              <p className="text-[10px] text-white/50 truncate">{title} (총 {totalLogsCount.toLocaleString()}개 블록)</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Instructions Guide */}
        <div className="px-4 py-2 bg-[#e6005c]/10 border-b border-[#e6005c]/20 text-[11px] text-pink-200 flex items-center justify-between">
          <span className="truncate">💡 <b>1파트부터 순서대로</b> 이어서 붙여넣으세요.</span>
          {lastCopiedPart !== null && (
            <span className="text-[10px] bg-zinc-800 border border-zinc-600 text-zinc-200 px-2 py-0.5 rounded-full font-bold ml-2 shrink-0">
              {lastCopiedPart}파트 복사됨
            </span>
          )}
        </div>

        {/* Controls: Compact Single-Row Layout */}
        <div className="p-4 border-b border-white/10 bg-white/[0.01] shrink-0 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-white/50">
            <span>분할 단위 설정</span>
            <span>
              {hasApplied && chunks.length > 0 ? (
                <>총 <b className="text-white/90">{chunks.length}파트</b></>
              ) : (
                <>예상 약 <b className="text-white/90">{estimatedParts}파트</b></>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Slider with 1500 Steps up to 7500 */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <input
                type="range"
                min="1500"
                max="7500"
                step="1500"
                value={Math.min(7500, Math.max(1500, sliderValue || 1500))}
                onChange={(e) => setSliderValue(Number(e.target.value))}
                className="w-full accent-[#e6005c] cursor-pointer h-1.5 bg-white/10 hover:bg-white/15 rounded-lg appearance-none transition-all"
              />
              <div className="flex justify-between text-[9px] text-white/30 font-medium px-0.5 mt-1 select-none">
                <span>1500</span>
                <span>3000</span>
                <span>4500</span>
                <span>6000</span>
                <span>7500</span>
              </div>
            </div>

            {/* Direct Number Input */}
            <div className="flex items-center bg-[#121214] border border-white/15 focus-within:border-[#e6005c] rounded-lg px-2 py-1 shrink-0 transition-all">
              <input
                type="number"
                min="1"
                max="50000"
                value={sliderValue || ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setSliderValue(isNaN(val) ? 0 : val);
                }}
                onBlur={() => {
                  if (!sliderValue || sliderValue < 1) {
                    setSliderValue(1500);
                  }
                }}
                className="w-13 bg-transparent text-right font-mono font-bold text-xs text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="1500"
              />
              <span className="text-[10px] text-white/40 ml-1 select-none">블록</span>
            </div>

            {/* Confirm Button */}
            <button
              type="button"
              onClick={handleApply}
              disabled={isLoading}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center justify-center gap-1 ${
                isPendingApply
                  ? 'bg-[#e6005c] hover:bg-[#d10053] text-white shadow-sm'
                  : 'bg-white/10 hover:bg-white/15 text-white/80'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>확인</span>
            </button>
          </div>
        </div>

        {/* Chunks List */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2 custom-scrollbar min-h-[200px]">
          {isLoading ? (
            <div className="h-40 flex flex-col items-center justify-center gap-2.5 text-white/50">
              <Loader2 className="w-6 h-6 animate-spin text-[#e6005c]" />
              <span className="text-xs font-medium">분할 코드를 생성하고 있습니다...</span>
            </div>
          ) : !hasApplied ? (
            <div className="h-40 flex flex-col items-center justify-center gap-2 text-white/40 text-center px-4">
              <Scissors className="w-5 h-5 text-white/20" />
              <p className="text-xs font-medium text-white/60">분할 단위를 설정한 후 [확인] 버튼을 눌러주세요.</p>
              <p className="text-[10px] text-white/30">현재 설정: {effectiveValue.toLocaleString()}블록 단위 (예상 약 {estimatedParts}파트)</p>
            </div>
          ) : chunks.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-white/40 text-xs">
              분할할 블록이 없습니다.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-1 pb-0.5 text-[10px] text-white/40 font-medium">
                <span>분할된 파트 ({chunks.length}개)</span>
                <span>복사 완료: {copiedIndices.size} / {chunks.length}</span>
              </div>

              {chunks.map((chunk) => {
                const isCopied = copiedIndices.has(chunk.partIndex);

                return (
                  <div
                    key={chunk.partIndex}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                      isCopied
                        ? 'bg-zinc-800/80 border-zinc-500/50 shadow-sm'
                        : 'bg-white/[0.02] border-white/5 hover:border-white/15 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className={`px-2.5 py-1 rounded-md text-xs font-bold shrink-0 transition-colors ${
                        isCopied ? 'bg-zinc-700 text-zinc-100 border border-zinc-500/40' : 'bg-white/10 text-white/80'
                      }`}>
                        {chunk.partNumber}파트
                      </div>
                      <span className="text-[11px] text-white/50 font-mono truncate">
                        {formatBytes(chunk.byteSize)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyChunk(chunk)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
                        isCopied
                          ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-100 border border-zinc-500/50'
                          : 'bg-white/10 hover:bg-white/20 text-white border border-transparent'
                      }`}
                      title={`${chunk.partNumber}파트 복사`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-zinc-200" />
                          <span>복사됨</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>복사</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-between shrink-0 gap-2">
          <button
            type="button"
            onClick={async () => {
              await onCopyAllAtOnce();
              onClose();
            }}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/15 hover:border-white/30 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <Copy className="w-3.5 h-3.5 text-[#e6005c]" />
            <span>한 번에 전체 복사하기</span>
          </button>
          
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white/5 hover:bg-white/15 text-white/70 hover:text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
