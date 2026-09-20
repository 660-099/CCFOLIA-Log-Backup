import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, CheckCircle2, ChevronRight, Image as ImageIcon, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { cn } from '../utils';

interface BulkImageAllocatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  charSettings: Record<string, any>;
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
  const [loadedImages, setLoadedImages] = useState<{url: string, fileName: string}[]>([]);
  
  // charId -> assigned urls
  const [allocations, setAllocations] = useState<Record<string, string[]>>({});
  // charId -> representative url
  const [reps, setReps] = useState<Record<string, string>>({});
  
  const [activeCharId, setActiveCharId] = useState<string | null>(null);
  const [autoAssign, setAutoAssign] = useState(false);

  // Derive mapping of url -> charId
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
      
      // Auto-assign logic: first try to match by JSON hash (for High Quality mode)
      if (!(window as any)._jsonAutoMatches) (window as any)._jsonAutoMatches = {};

      newImages.forEach(img => {
        let nameToMatch = img.fileName;
        if (nameToMatch.includes('.')) nameToMatch = nameToMatch.substring(0, nameToMatch.lastIndexOf('.'));
        const normFile = normalize(nameToMatch);
        
        let matchedCharId = null;

        // 1. Try JSON Hash matching (the fileName is exactly the cImg.id)
        for (const charId of charIds) {
          const char = charSettings[charId];
          if (char.images) {
            for (const cImg of char.images) {
               if (cImg.id === nameToMatch) {
                  matchedCharId = charId;
                  // Store mapping so onSave can update the exact image
                  (window as any)._jsonAutoMatches[nameToMatch] = img.url;
                  
                  if (cImg.isRepresentative && !newReps[charId]) {
                     newReps[charId] = img.url;
                  }
                  break;
               }
            }
          }
          if (matchedCharId) break;
        }

        // 2. Fallback to Character Name matching
        if (!matchedCharId) {
          matchedCharId = charIds.find(id => normalize(charSettings[id].name) === normFile) || null;
          if (matchedCharId && !newReps[matchedCharId] && charSettings[matchedCharId].images?.length === 0) {
            newReps[matchedCharId] = img.url;
          }
        }

        if (matchedCharId) {
          if (!newAlloc[matchedCharId]) newAlloc[matchedCharId] = [];
          if (!newAlloc[matchedCharId].includes(img.url)) {
            newAlloc[matchedCharId].push(img.url);
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
      
      if (!next[activeCharId]) next[activeCharId] = [];
      if (!next[activeCharId].includes(url)) {
        next[activeCharId] = [...next[activeCharId], url];
      }
      return next;
    });
  };

  const unassignImage = (url: string) => {
    setAllocations(prev => {
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        next[k] = next[k].filter(u => u !== url);
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
              <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Body */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Sidebar: Character List */}
              <div className="w-[240px] border-r border-white/5 bg-black/20 flex flex-col">
                <div className="p-3 border-b border-white/5 text-xs font-bold text-white/40 uppercase tracking-wider">
                  등장 캐릭터 ({Object.keys(charSettings).length})
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                  {Object.values(charSettings).map((char: any) => {
                    const assignedCount = (allocations[char.id] || []).length;
                    return (
                      <button
                        key={char.id}
                        onClick={() => setActiveCharId(char.id)}
                        className={cn(
                          "w-full flex items-center justify-between p-2 rounded-lg transition-all text-left",
                          activeCharId === char.id 
                            ? "bg-white/10" 
                            : "hover:bg-white/5"
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: char.color || '#fff' }} />
                          <span className="text-[12px] font-medium text-white truncate">{char.name}</span>
                        </div>
                        {assignedCount > 0 && (
                          <span className="text-[10px] font-bold text-[#e6005c] bg-[#e6005c]/10 px-1.5 py-0.5 rounded-full shrink-0">
                            {assignedCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Main Area */}
              <div className="flex-1 flex flex-col bg-[#111111]">
                {/* Top: URL Input */}
                <div className="p-4 border-b border-white/5 shrink-0 space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input 
                        type="text"
                        value={urlInput}
                        onChange={e => setUrlInput(e.target.value)}
                        placeholder="Imgur 앨범 주소 (https://imgur.com/a/...) 또는 이미지 링크 여러 개"
                        className="w-full h-10 bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#e6005c] transition-colors"
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleFetch();
                        }}
                      />
                    </div>
                    <button 
                      onClick={handleFetch}
                      disabled={isLoading || !urlInput.trim()}
                      className="px-6 h-10 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? '불러오는 중...' : '불러오기'}
                    </button>
                  </div>
                  <p className="text-[10px] text-white/40 flex items-center gap-1 pl-1">
                    <AlertCircle className="w-3 h-3" />
                    Imgur 앨범 링크를 넣으면 자동으로 파일명을 분석해 캐릭터와 매칭합니다.
                  </p>
                </div>

                {/* Bottom: Image Grid Area */}
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="p-3 border-b border-white/5 bg-black/40 flex items-center justify-between shrink-0">
                    <div className="text-[12px] font-bold text-white/60">
                      불러온 이미지 ({loadedImages.length})
                    </div>
                    <div>
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
                                "relative aspect-square rounded-xl overflow-hidden cursor-pointer group border-2 transition-all",
                                isAssignedToActive ? "border-[#e6005c]" : 
                                isAssignedToOther ? "border-white/10 opacity-40" : 
                                "border-transparent hover:border-white/20 bg-white/5"
                              )}
                            >
                              <img src={img.url} alt="" className="w-full h-full object-contain p-2" />
                              
                              <div className="absolute top-1 left-1 bg-black/60 px-1.5 py-0.5 rounded text-[9px] text-white/70 truncate max-w-[80%]">
                                {img.fileName}
                              </div>

                              {isAssignedToActive && (
                                <div className="absolute top-2 right-2 w-5 h-5 bg-[#e6005c] rounded-full flex items-center justify-center shadow-lg">
                                  <CheckCircle2 className="w-3 h-3 text-white" />
                                </div>
                              )}

                              {isAssignedToActive && (
                                <div className="absolute bottom-2 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={(e) => setAsRep(e, img.url, activeCharId)}
                                    className="px-2 py-0.5 rounded-full text-[9px] font-bold border transition-colors shadow-sm bg-black/60 border-white/20 text-white/50 hover:bg-white/20 hover:text-white whitespace-nowrap"
                                  >
                                    대표
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
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
