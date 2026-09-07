import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';
import { CharSetting } from '../types';
import { Upload, X, Check, Image as ImageIcon } from 'lucide-react';

interface BulkImageAllocatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  charSettings: Record<string, CharSetting>;
  onSave: (allocations: Record<string, string[]>, reps: Record<string, string>) => void;
}

export const BulkImageAllocatorModal: React.FC<BulkImageAllocatorModalProps> = ({
  isOpen,
  onClose,
  charSettings,
  onSave
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadedImages, setLoadedImages] = useState<{ url: string; fileName: string }[]>([]);
  
  const [allocations, setAllocations] = useState<Record<string, string[]>>({});
  const [reps, setReps] = useState<Record<string, string>>({});
  
  const [activeCharId, setActiveCharId] = useState<string | null>(null);
  const [autoAssign, setAutoAssign] = useState(false);

  const urlToOwnerId = useMemo(() => {
    const map: Record<string, string> = {};
    Object.entries(allocations).forEach(([charId, urls]: [string, string[]]) => {
      urls.forEach(url => {
        map[url] = charId;
      });
    });
    return map;
  }, [allocations]);

  const handleFetch = async () => {
    if (!urlInput.trim()) return;
    setIsLoading(true);
    
    try {
      let newImages: { url: string; fileName: string }[] = [];
      
      if (urlInput.includes('imgur.com/a/')) {
        const response = await fetch('/api/imgur', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: urlInput }),
        });
        if (!response.ok) throw new Error('Imgur fetch failed');
        newImages = await response.json();
      } else {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const matches = urlInput.match(urlRegex) || [];
        newImages = matches.map((url, i) => ({ url, fileName: `Image_${i+1}` }));
      }
      
      setLoadedImages(newImages);
      setAllocations({});
      setReps({});
      
      const newAlloc: Record<string, string[]> = {};
      const newReps: Record<string, string> = {};
      const normalize = (str: string) => str.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();
      
      const charIds = Object.keys(charSettings);
      newImages.forEach(img => {
        let nameToMatch = img.fileName;
        if (nameToMatch.includes('.')) nameToMatch = nameToMatch.substring(0, nameToMatch.lastIndexOf('.'));
        const normFile = normalize(nameToMatch);
        
        const matchedCharId = charIds.find(id => normalize(charSettings[id].name) === normFile);
        if (matchedCharId) {
          if (!newAlloc[matchedCharId]) newAlloc[matchedCharId] = [];
          newAlloc[matchedCharId].push(img.url);
          
          if (!newReps[matchedCharId] && charSettings[matchedCharId].images?.length === 0) {
            newReps[matchedCharId] = img.url;
          }
        }
      });
      
      setAllocations(newAlloc);
      setReps(newReps);
      
    } catch (e) {
      alert("이미지를 불러오는데 실패했습니다. 앨범 주소나 URL 형식을 확인해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const assignImage = (url: string) => {
    if (!activeCharId) return;
    
    setAllocations(prev => {
      const next = { ...prev };
      let oldOwner: string | null = null;
      for (const [k, urls] of Object.entries(next) as [string, string[]][]) {
        if (urls.includes(url)) {
          oldOwner = k;
          next[k] = urls.filter(u => u !== url);
          break;
        }
      }
      
      next[activeCharId] = [...(next[activeCharId] || []), url];
      
      setReps(prevReps => {
        const nextReps = { ...prevReps };
        if (oldOwner && nextReps[oldOwner] === url) {
          delete nextReps[oldOwner];
          if (next[oldOwner] && next[oldOwner].length > 0) {
            nextReps[oldOwner] = next[oldOwner][0];
          }
        }
        if (!nextReps[activeCharId] && activeCharId !== 'ILLUSTRATIONS') {
          const char = charSettings[activeCharId];
          if (!char?.images?.length) {
            nextReps[activeCharId] = url;
          }
        }
        return nextReps;
      });
      
      return next;
    });
  };

  const unassignImage = (url: string) => {
    if (!activeCharId) return;
    setAllocations(prev => {
      const next = { ...prev };
      if (next[activeCharId]) {
        next[activeCharId] = next[activeCharId].filter(u => u !== url);
      }
      
      setReps(prevReps => {
        const nextReps = { ...prevReps };
        if (nextReps[activeCharId] === url) {
          delete nextReps[activeCharId];
          if (next[activeCharId] && next[activeCharId].length > 0) {
            nextReps[activeCharId] = next[activeCharId][0];
          }
        }
        return nextReps;
      });

      return next;
    });
  };

  const handleAssignRemainingToIllustrations = () => {
    setAllocations(prev => {
      const next = { ...prev };
      const assignedUrls = new Set();
      Object.values(next).forEach((urls: any) => urls.forEach((u: string) => assignedUrls.add(u)));
      
      const unassigned = loadedImages.filter(img => !assignedUrls.has(img.url)).map(img => img.url);
      if (unassigned.length > 0) {
        next['ILLUSTRATIONS'] = [...(next['ILLUSTRATIONS'] || []), ...unassigned];
      }
      return next;
    });
  };

  const setAsRep = (e: React.MouseEvent, url: string, charId: string) => {
    e.stopPropagation();
    setReps(prev => ({ ...prev, [charId]: url }));
  };

  const activeCharAssignedUrls = activeCharId ? (allocations[activeCharId] || []) : [];
  
  const totalAssignedCount = useMemo(() => {
    let count = 0;
    Object.values(allocations).forEach((arr: any) => count += arr.length);
    return count;
  }, [allocations]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2000000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-[1000px] h-[80vh] flex flex-col pointer-events-auto overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/5">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#e6005c]" />
                이미지 일괄 등록 - 스탠딩 선택
              </h2>
              <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-1 min-h-0 overflow-hidden">
              {/* Left Panel: Characters */}
              <div className="w-[180px] border-r border-white/5 bg-black/20 flex flex-col shrink-0">
                <div className="p-3 border-b border-white/5 shrink-0 bg-[#1a1a1a]">
                  <div className="text-[10px] font-bold text-white/50 mb-1">캐릭터 목록</div>
                  <div className="text-[9px] text-white/40">클릭하여 활성화 후<br/>우측에서 이미지 선택</div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5 space-y-0.5">
                  {Object.values(charSettings).map((char: CharSetting) => {
                    const isActive = activeCharId === char.id;
                    const assignedCount = allocations[char.id]?.length || 0;
                    
                    return (
                      <button
                        key={char.id}
                        onClick={() => setActiveCharId(char.id)}
                        className={cn(
                          "w-full flex items-center justify-between px-2 py-1.5 rounded-lg transition-all text-left group",
                          isActive 
                            ? "bg-[#e6005c]/10 border border-[#e6005c]/30 text-[#e6005c]" 
                            : "hover:bg-white/5 border border-transparent text-white/80 hover:text-white"
                        )}
                        title={char.name}
                      >
                        <span className="text-[11px] font-bold truncate flex-1 pr-2">{char.name}</span>
                        <span className="text-[9px] opacity-50 shrink-0">{assignedCount}개</span>
                      </button>
                    );
                  })}
                </div>
                <div className="p-1.5 border-t border-white/5 bg-black/40 shrink-0">
                  <button
                    onClick={() => setActiveCharId('ILLUSTRATIONS')}
                    className={cn(
                      "w-full flex items-center justify-between px-2 py-1.5 rounded-lg transition-all text-left group",
                      activeCharId === 'ILLUSTRATIONS' 
                        ? "bg-[#e6005c]/10 border border-[#e6005c]/30 text-[#e6005c]" 
                        : "hover:bg-white/5 border border-transparent text-white/80 hover:text-white"
                    )}
                  >
                    <span className="text-[11px] font-bold truncate flex-1 pr-2">삽화</span>
                    <span className="text-[9px] opacity-50 shrink-0">{allocations['ILLUSTRATIONS']?.length || 0}개</span>
                  </button>
                </div>
              </div>

              {/* Right Panel: Gallery (Split into All vs Assigned) */}
              <div className="flex-1 flex flex-col min-w-0 bg-[#141414]">
                {/* URL Input Area */}
                <div className="p-3 border-b border-white/5 bg-[#1a1a1a] flex gap-2 shrink-0">
                  <input
                    type="text"
                    placeholder="Imgur 앨범 링크 또는 이미지 직접 링크(URL)들"
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    className="flex-1 text-[11px] px-3 py-1.5 bg-black/40 border border-white/10 rounded-xl outline-none focus:border-[#e6005c] text-white/90"
                  />
                  <button
                    onClick={handleFetch}
                    disabled={isLoading || !urlInput.trim()}
                    className="px-4 py-1.5 bg-[#e6005c] hover:bg-[#ff007f] disabled:bg-white/10 disabled:text-white/30 text-white text-[11px] font-bold rounded-xl transition-colors shrink-0"
                  >
                    {isLoading ? '불러오는 중...' : '불러오기'}
                  </button>
                </div>

                <div className="flex flex-1 min-h-0 overflow-hidden">
                  {/* Left sub-panel: All Images */}
                  <div className="flex-[3] flex flex-col min-w-0 border-r border-white/5">
                    <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between shrink-0 bg-black/20">
                      <div className="text-[10px] text-white/50">
                        전체 이미지 (총 {loadedImages.length}개 중 {totalAssignedCount}개 할당 완료)
                      </div>
                      <button
                        onClick={() => setAutoAssign(!autoAssign)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                          autoAssign 
                            ? "bg-[#e6005c] text-white shadow-[0_0_10px_rgba(230,0,92,0.3)]" 
                            : "bg-white/5 text-white/30 hover:bg-white/10 hover:text-white/60"
                        )}
                      >
                        미지정 이미지를 모두 삽화로 등록
                      </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
                      {loadedImages.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-white/20 text-xs text-center px-4">
                          상단에 URL을 입력하고 불러오기를 클릭하세요.
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {loadedImages.map((img, idx) => {
                            const ownerId = urlToOwnerId[img.url];
                            const isAssigned = !!ownerId;
                            const isAssignedToOther = isAssigned && ownerId !== activeCharId;
                            const isAssignedToActive = ownerId === activeCharId;
                            return (
                              <div
                                key={idx}
                                onClick={() => {
                                  if (isAssignedToActive) {
                                    unassignImage(img.url);
                                  } else {
                                    assignImage(img.url);
                                  }
                                }}
                                className={cn(
                                  "relative aspect-square rounded-xl overflow-hidden border cursor-pointer transition-all group",
                                  isAssigned 
                                    ? "border-transparent opacity-30 hover:opacity-50"
                                    : "border-white/10 hover:border-white/40"
                                )}
                              >
                                <img src={img.url} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover select-none pointer-events-none" />
                                {isAssigned && (
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                                    <span className="text-[9px] font-bold text-white/70 bg-black/60 px-1.5 py-0.5 rounded">
                                      {ownerId === 'ILLUSTRATIONS' ? '삽화' : (charSettings[ownerId]?.name || '할당됨')}
                                    </span>
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-[#e6005c]/0 group-hover:bg-[#e6005c]/10 transition-colors pointer-events-none" />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right sub-panel: Active Character's Images */}
                  <div className="flex-[2] flex flex-col min-w-0 bg-[#1a1a1a]/30">
                    <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between shrink-0 bg-black/20">
                      <div className="text-[11px] font-bold text-[#e6005c]">
                        {activeCharId === 'ILLUSTRATIONS' 
                          ? '삽화' 
                          : activeCharId ? charSettings[activeCharId]?.name : '선택 안 됨'}
                      </div>
                      <div className="text-[10px] text-white/50">
                        {activeCharAssignedUrls.length}개
                      </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
                      {!activeCharId ? (
                        <div className="h-full flex items-center justify-center text-white/20 text-xs text-center px-4">
                          좌측에서 캐릭터를 선택해주세요.
                        </div>
                      ) : activeCharAssignedUrls.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center gap-2 text-white/20 text-xs text-center px-4">
                          <ImageIcon className="w-8 h-8 opacity-20" />
                          좌측 갤러리에서<br/>이미지를 클릭하여 추가하세요.
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {activeCharAssignedUrls.map((url, idx) => (
                            <div
                              key={idx}
                              className={cn(
                                "relative aspect-square rounded-xl cursor-default group",
                                reps[activeCharId] === url && activeCharId !== 'ILLUSTRATIONS'
                                  ? ""
                                  : ""
                              )}
                            >
                              <div className={cn(
                                "absolute inset-0 rounded-xl overflow-hidden border-2 transition-all",
                                reps[activeCharId] === url && activeCharId !== 'ILLUSTRATIONS'
                                  ? "border-[#e6005c] ring-2 ring-[#e6005c]/30"
                                  : "border-white/10 group-hover:border-white/40"
                              )}>
                                <img src={url} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover select-none pointer-events-none" />
                              </div>

                              <button
                                onClick={(e) => { e.stopPropagation(); unassignImage(url); }}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-black border border-white/20 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-20 shadow-lg"
                                title="제거"
                              >
                                <X className="w-3 h-3 text-white" />
                              </button>
                                 
                              {reps[activeCharId] === url && activeCharId !== 'ILLUSTRATIONS' && (
                                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 bg-[#e6005c] text-white px-2 py-0.5 rounded-full text-[9px] font-bold shadow-md pointer-events-none z-10">
                                  대표
                                </div>
                              )}
                                 
                              {reps[activeCharId] !== url && activeCharId !== 'ILLUSTRATIONS' && (
                                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex justify-center z-10">
                                  <button
                                    onClick={(e) => setAsRep(e, url, activeCharId)}
                                    className="px-2 py-0.5 rounded-full text-[9px] font-bold border transition-colors shadow-sm bg-black/60 border-white/20 text-white/50 hover:bg-white/20 hover:text-white whitespace-nowrap"
                                  >
                                    대표
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-3 border-t border-white/5 bg-[#1a1a1a] flex justify-end gap-2 shrink-0">
              <button 
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-[12px] font-bold text-white/70 hover:text-white hover:bg-white/5 transition-colors"
              >
                취소
              </button>
              <button 
                onClick={() => {
                  let finalAllocations = { ...allocations };
                  if (autoAssign) {
                     const assignedUrls = new Set();
                     Object.values(finalAllocations).forEach((urls: any) => urls.forEach((u: string) => assignedUrls.add(u)));
                     const unassigned = loadedImages.filter(img => !assignedUrls.has(img.url)).map(img => img.url);
                     if (unassigned.length > 0) {
                       finalAllocations['ILLUSTRATIONS'] = [...(finalAllocations['ILLUSTRATIONS'] || []), ...unassigned];
                     }
                  }
                  onSave(finalAllocations, reps);
                }}
                disabled={totalAssignedCount === 0}
                className="px-6 py-2.5 rounded-xl text-[12px] font-bold bg-[#e6005c] text-white hover:bg-[#ff007f] disabled:bg-white/5 disabled:text-white/30 disabled:cursor-not-allowed transition-colors"
              >
                완료
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
