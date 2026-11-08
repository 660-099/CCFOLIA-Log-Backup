import React, { useState, useEffect, useMemo } from 'react';
import { X, Copy, Check, Scissors, AlertCircle, RefreshCw, FileText } from 'lucide-react';
import { BlogHtmlChunk } from '../utils/htmlGenerator';

interface ChunkCopyModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  totalLogsCount: number;
  onGenerateChunks: (chunkSize: number) => Promise<BlogHtmlChunk[]>;
  onCopyAllAtOnce: () => Promise<void>;
}

const PRESETS = [500, 1000, 2000, 3000, 5000];

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
};

export const ChunkCopyModal: React.FC<ChunkCopyModalProps> = ({
  isOpen,
  onClose,
  title,
  totalLogsCount,
  onGenerateChunks,
  onCopyAllAtOnce,
}) => {
  const [sliderValue, setSliderValue] = useState<number>(1000);
  const [appliedChunkSize, setAppliedChunkSize] = useState<number>(1000);
  const [chunks, setChunks] = useState<BlogHtmlChunk[]>([]);
  const [copiedIndices, setCopiedIndices] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastCopiedPart, setLastCopiedPart] = useState<number | null>(null);

  // Initial load when modal opens
  useEffect(() => {
    if (isOpen) {
      setCopiedIndices(new Set());
      setLastCopiedPart(null);
      loadChunks(appliedChunkSize);
    }
  }, [isOpen]);

  const loadChunks = async (size: number) => {
    setIsLoading(true);
    try {
      const generated = await onGenerateChunks(size);
      setChunks(generated);
      setAppliedChunkSize(size);
    } catch (err: any) {
      console.error('Error generating chunks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    loadChunks(sliderValue);
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

  const isPendingApply = sliderValue !== appliedChunkSize;
  const estimatedParts = Math.max(1, Math.ceil(totalLogsCount / sliderValue));

  return (
    <div 
      className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] text-white animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0 bg-white/[0.02]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-[#e6005c]/20 text-[#e6005c] shrink-0">
              <Scissors className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate">블로그 분할 복사</h3>
              <p className="text-[11px] text-white/50 truncate">{title} (총 {totalLogsCount.toLocaleString()}개 블록)</p>
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
        <div className="px-5 py-2.5 bg-[#e6005c]/10 border-b border-[#e6005c]/20 text-[11px] text-pink-200 flex items-center justify-between">
          <span>💡 블로그 HTML 편집기에 <b>1파트부터 순서대로</b> 이어서 붙여넣으세요.</span>
          {lastCopiedPart !== null && (
            <span className="text-[10px] bg-[#e6005c] text-white px-2 py-0.5 rounded-full font-bold ml-2 shrink-0">
              {lastCopiedPart}파트 복사됨!
            </span>
          )}
        </div>

        {/* Controls: Presets, Slider & Confirm Button */}
        <div className="p-5 border-b border-white/10 bg-white/[0.01] shrink-0 space-y-3.5">
          {/* Quick Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-white/60">분할 프리셋</span>
              <span className="text-[11px] text-white/40">
                선택 단위: <b className="text-[#e6005c]">{sliderValue.toLocaleString()}개</b> (예상 {estimatedParts}파트)
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {PRESETS.map((val) => {
                const isSelected = sliderValue === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setSliderValue(val)}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer text-center ${
                      isSelected
                        ? 'bg-[#e6005c] text-white shadow-[0_0_12px_rgba(230,0,92,0.4)]'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {val.toLocaleString()}개
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slider & Confirm Button Row */}
          <div className="flex items-center gap-3 pt-1">
            <div className="flex-1">
              <input
                type="range"
                min="500"
                max="5000"
                step="250"
                value={sliderValue}
                onChange={(e) => setSliderValue(Number(e.target.value))}
                className="w-full accent-[#e6005c] cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[9px] text-white/30 mt-1">
                <span>500개 (안전)</span>
                <span>2,500개</span>
                <span>5,000개 (고사양)</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleApply}
              disabled={isLoading}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                isPendingApply
                  ? 'bg-[#e6005c] hover:bg-[#ff1a75] text-white shadow-[0_0_15px_rgba(230,0,92,0.4)] animate-pulse'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              {isLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>{isPendingApply ? '확인 (분할 적용)' : '확인'}</span>
            </button>
          </div>
        </div>

        {/* Chunks List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar min-h-[220px]">
          {isLoading ? (
            <div className="h-44 flex flex-col items-center justify-center gap-2 text-white/40">
              <RefreshCw className="w-5 h-5 animate-spin text-[#e6005c]" />
              <span className="text-xs">분할 코드를 생성하고 있습니다...</span>
            </div>
          ) : chunks.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-white/40 text-xs">
              분할할 블록이 없습니다.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-1 pb-1 text-[11px] text-white/40 font-medium">
                <span>분할된 파트 ({chunks.length}개)</span>
                <span>복사 완료: {copiedIndices.size} / {chunks.length}</span>
              </div>

              {chunks.map((chunk) => {
                const isCopied = copiedIndices.has(chunk.partIndex);
                let rangeLabel = `${chunk.startBlock.toLocaleString()} ~ ${chunk.endBlock.toLocaleString()}번`;
                if (chunk.totalParts === 1) {
                  rangeLabel = `전체 (${chunk.startBlock.toLocaleString()} ~ ${chunk.endBlock.toLocaleString()}번)`;
                } else if (chunk.isFirst) {
                  rangeLabel = `머리말 + 1 ~ ${chunk.endBlock.toLocaleString()}번`;
                } else if (chunk.isLast) {
                  rangeLabel = `${chunk.startBlock.toLocaleString()} ~ ${chunk.endBlock.toLocaleString()}번 + 꼬리말`;
                }

                return (
                  <div
                    key={chunk.partIndex}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                      isCopied
                        ? 'bg-emerald-500/[0.06] border-emerald-500/30'
                        : 'bg-white/[0.03] border-white/5 hover:border-white/15 hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className={`px-2 py-1 rounded-md text-[11px] font-bold shrink-0 ${
                        isCopied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/90'
                      }`}>
                        {chunk.partNumber}파트
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white/90 truncate">{rangeLabel}</p>
                        <p className="text-[10px] text-white/40">{formatBytes(chunk.byteSize)}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyChunk(chunk)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                        isCopied
                          ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                          : 'bg-white/10 hover:bg-white/20 text-white hover:border-white/30 border border-transparent'
                      }`}
                      title={`${chunk.partNumber}파트 복사`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>복사됨 ✓</span>
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
        <div className="px-5 py-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={async () => {
              await onCopyAllAtOnce();
              onClose();
            }}
            className="text-[11px] text-white/40 hover:text-white/80 transition-colors underline cursor-pointer"
          >
            한 번에 전체 복사하기 (단일 클립보드)
          </button>
          
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
