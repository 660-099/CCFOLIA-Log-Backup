import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  X, 
  Check, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Sparkles, 
  Star,
  LayoutGrid,
  Search,
  Plus
} from 'lucide-react';
import { cn } from '../utils';
import { 
  matchImagesToCharacters, 
  MatchCandidateCharacter, 
  ImageToMatch 
} from '../utils/characterMatcher';
import { fetchImgurImagesClient } from '../utils/imgurClient';

interface BulkImageAllocatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  charSettings: Record<string, any>;
  onSave: (
    allocations: Record<string, string[]>, 
    reps: Record<string, string>,
    targetImgIds: Record<string, string>,
    illustrationUrls: string[]
  ) => void;
  initialUrl?: string;
}

export const BulkImageAllocatorModal: React.FC<BulkImageAllocatorModalProps> = ({
  isOpen,
  onClose,
  charSettings,
  onSave,
  initialUrl = ''
}) => {
  const [urlInput, setUrlInput] = useState(initialUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [loadedImages, setLoadedImages] = useState<{ url: string; fileName: string; size?: number }[]>([]);
  
  // charId -> assigned urls
  const [allocations, setAllocations] = useState<Record<string, string[]>>({});
  // charId -> representative url
  const [reps, setReps] = useState<Record<string, string>>({});
  // url -> targetImgId
  const [targetImgIds, setTargetImgIds] = useState<Record<string, string>>({});
  
  // '__all__' or specific charId
  const [activeCharId, setActiveCharId] = useState<string>('__all__');
  const [charSearchQuery, setCharSearchQuery] = useState('');
  const [autoAssignIllustrations, setAutoAssignIllustrations] = useState(false);
  const [leftFilterMode, setLeftFilterMode] = useState<'all' | 'unassigned'>('all');
  const [showSummaryConfirm, setShowSummaryConfirm] = useState(false);

  // Initialize
  useEffect(() => {
    if (isOpen) {
      if (initialUrl && !urlInput) {
        setUrlInput(initialUrl);
      }
      setActiveCharId('__all__');
      setCharSearchQuery('');
      setShowSummaryConfirm(false);
    }
  }, [isOpen, initialUrl]);

  // url -> owner charId mapping
  const urlToOwnerId = useMemo(() => {
    const map: Record<string, string> = {};
    Object.entries(allocations).forEach(([charId, urls]: [string, string[]]) => {
      urls.forEach(url => {
        map[url] = charId;
      });
    });
    return map;
  }, [allocations]);

  // Fetch images from Imgur or direct URL
  const handleFetch = async () => {
    if (!urlInput.trim()) return;
    setIsLoading(true);
    
    try {
      let fetchedImages: { url: string; fileName: string; size?: number }[] = [];
      
      if (urlInput.includes('imgur.com') || /^[a-zA-Z0-9]{5,10}$/.test(urlInput.trim())) {
        fetchedImages = await fetchImgurImagesClient(urlInput.trim());
      } else {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const matches = urlInput.match(urlRegex) || [];
        fetchedImages = matches.map((url, i) => ({ 
          url, 
          fileName: `Image_${i + 1}` 
        }));
      }

      if (!fetchedImages || fetchedImages.length === 0) {
        throw new Error('불러올 수 있는 유효한 이미지를 찾지 못했습니다.');
      }
      
      setLoadedImages(fetchedImages);

      // Match with characters
      const candidateChars: MatchCandidateCharacter[] = Object.entries(charSettings).map(([cId, char]: [string, any]) => ({
        charId: cId,
        charName: (char.name || '').trim(),
        color: char.color,
        images: (char.images || []).map((ci: any) => ({
          id: ci.id,
          name: ci.name,
          url: ci.url,
          isRepresentative: ci.isRepresentative
        }))
      }));

      const matchCandidates: ImageToMatch[] = fetchedImages.map(img => ({
        url: img.url,
        fileName: img.fileName,
        size: img.size
      }));

      const matchResults = matchImagesToCharacters(matchCandidates, candidateChars);

      const newAlloc: Record<string, string[]> = {};
      const newReps: Record<string, string> = {};
      const newTargetIds: Record<string, string> = {};

      Object.entries(matchResults).forEach(([url, res]) => {
        if (res.charId) {
          if (!newAlloc[res.charId]) newAlloc[res.charId] = [];
          if (!newAlloc[res.charId].includes(url)) {
            newAlloc[res.charId].push(url);
          }
          if (res.targetImgId) {
            newTargetIds[url] = res.targetImgId;
          }
          if (!newReps[res.charId]) {
            newReps[res.charId] = url;
          }
        }
      });

      setAllocations(newAlloc);
      setReps(newReps);
      setTargetImgIds(newTargetIds);

    } catch (e: any) {
      alert(e.message || "이미지를 불러오는데 실패했습니다. 앨범 주소나 URL 형식을 확인해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  // Assign image to active character
  const assignImageToChar = (url: string, targetCharId: string) => {
    if (!targetCharId || targetCharId === '__all__') return;
    
    setAllocations(prev => {
      const next = { ...prev };
      // Remove from any previous owner
      for (const [k, urls] of Object.entries(next) as [string, string[]][]) {
        if (urls.includes(url)) {
          next[k] = urls.filter(u => u !== url);
        }
      }
      
      if (!next[targetCharId]) next[targetCharId] = [];
      if (!next[targetCharId].includes(url)) {
        next[targetCharId] = [...next[targetCharId], url];
      }
      return next;
    });

    // Auto-set as representative if it's the character's first image
    setReps(prev => {
      if (!prev[targetCharId]) {
        return { ...prev, [targetCharId]: url };
      }
      return prev;
    });
  };

  // Unassign image from character
  const unassignImage = (url: string) => {
    setAllocations(prev => {
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        next[k] = next[k].filter(u => u !== url);
      }
      return next;
    });

    // If representative was unassigned, pick another or clear
    setReps(prev => {
      const next = { ...prev };
      for (const [cId, repUrl] of Object.entries(next)) {
        if (repUrl === url) {
          const remaining = (allocations[cId] || []).filter(u => u !== url);
          next[cId] = remaining.length > 0 ? remaining[0] : '';
        }
      }
      return next;
    });
  };

  // Toggle Representative standing
  const toggleRep = (e: React.MouseEvent, url: string, charId: string) => {
    e.stopPropagation();
    if (!charId) return;
    setReps(prev => ({
      ...prev,
      [charId]: prev[charId] === url ? '' : url
    }));
  };

  // Stats calculation
  const totalLoaded = loadedImages.length;
  const assignedUrls = useMemo(() => {
    const set = new Set<string>();
    Object.values(allocations).forEach((urls: string[]) => urls.forEach(u => set.add(u)));
    return set;
  }, [allocations]);

  const assignedCount = assignedUrls.size;
  const unassignedCount = totalLoaded - assignedCount;

  const assignedCharCount = useMemo(() => {
    return Object.values(allocations).filter((urls: string[]) => urls && urls.length > 0).length;
  }, [allocations]);

  const illustrationCount = autoAssignIllustrations ? unassignedCount : 0;
  const excludedCount = autoAssignIllustrations ? 0 : unassignedCount;

  const handleFinalApply = () => {
    const illustrationUrls = autoAssignIllustrations 
      ? loadedImages.filter(img => !assignedUrls.has(img.url)).map(img => img.url)
      : [];
    onSave(allocations, reps, targetImgIds, illustrationUrls);
    setShowSummaryConfirm(false);
  };

  // Filtered characters list for sidebar
  const characterEntries = useMemo(() => {
    const list = Object.entries(charSettings);
    if (!charSearchQuery.trim()) return list;
    const q = charSearchQuery.toLowerCase().trim();
    return list.filter(([_, char]: [string, any]) => 
      (char.name || '').toLowerCase().includes(q)
    );
  }, [charSettings, charSearchQuery]);

  // Active character data
  const isAllView = activeCharId === '__all__';
  const activeChar = !isAllView && activeCharId ? charSettings[activeCharId] : null;

  // When activeCharId is selected, split into:
  // 1. Right: images assigned to active character
  // 2. Left: rest of the images (unassigned, or assigned to other characters)
  const activeCharAssignedImages = useMemo(() => {
    if (isAllView || !activeCharId) return [];
    const urls = allocations[activeCharId] || [];
    return loadedImages.filter(img => urls.includes(img.url));
  }, [isAllView, activeCharId, allocations, loadedImages]);

  const remainingImages = useMemo(() => {
    if (isAllView || !activeCharId) return [];
    const currentUrls = new Set(allocations[activeCharId] || []);
    const others = loadedImages.filter(img => !currentUrls.has(img.url));
    if (leftFilterMode === 'unassigned') {
      return others.filter(img => !assignedUrls.has(img.url));
    }
    return others;
  }, [isAllView, activeCharId, allocations, loadedImages, leftFilterMode, assignedUrls]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2000000] bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5"
        >
          <motion.div 
            initial={{ scale: 0.96, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 12 }}
            className="bg-[#141414] border border-white/10 rounded-2xl shadow-2xl w-full max-w-[1100px] h-[86vh] flex flex-col pointer-events-auto overflow-hidden text-white"
          >
            {/* Modal Header: Cleaned, Single Icon */}
            <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#e6005c]/10 border border-[#e6005c]/20 flex items-center justify-center text-[#e6005c]">
                  <Upload className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white leading-tight">
                    이미지 일괄 등록 - 스탠딩 선택
                  </h2>
                  <p className="text-[10px] text-white/40 mt-0.5">
                    캐릭터별 스탠딩을 확인하고 갤러리 이미지를 클릭하여 지정합니다.
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Modal Body: Split View */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Panel: Compact Characters List (~210px) */}
              <div className="w-[210px] border-r border-white/10 bg-black/25 flex flex-col shrink-0">
                <div className="p-2 border-b border-white/10 flex flex-col gap-1.5">
                  {/* "전체 보기" button placed at the top */}
                  <button
                    onClick={() => setActiveCharId('__all__')}
                    className={cn(
                      "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-all text-left border text-[11px] font-bold",
                      isAllView 
                        ? "bg-[#e6005c]/15 border-[#e6005c]/40 text-[#e6005c] shadow-sm" 
                        : "hover:bg-white/5 border-transparent text-white/80"
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>전체 보기</span>
                    </div>
                    <span className="text-[10px] font-mono text-white/40">
                      {totalLoaded}장
                    </span>
                  </button>

                  {/* Character Search if > 6 characters */}
                  {Object.keys(charSettings).length > 6 && (
                    <div className="relative mt-0.5">
                      <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-white/30" />
                      <input 
                        type="text"
                        value={charSearchQuery}
                        onChange={e => setCharSearchQuery(e.target.value)}
                        placeholder="캐릭터 검색..."
                        className="w-full bg-white/5 border border-white/10 rounded-md pl-6 pr-2 py-1 text-[10px] text-white placeholder-white/30 focus:outline-none focus:border-[#e6005c]/50"
                      />
                    </div>
                  )}
                </div>

                {/* Character list scroll container */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5 space-y-0.5">
                  {characterEntries.map(([cId, char]: [string, any]) => {
                    const assignedList = allocations[cId] || [];
                    const assignedTotal = assignedList.length;
                    const isSelected = activeCharId === cId;

                    return (
                      <button
                        key={cId}
                        onClick={() => setActiveCharId(cId)}
                        className={cn(
                          "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-all text-left group border",
                          isSelected 
                            ? "bg-[#e6005c]/15 border-[#e6005c]/40 shadow-sm" 
                            : "hover:bg-white/5 border-transparent"
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-1">
                          <div 
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm border border-white/20" 
                            style={{ backgroundColor: char.color || '#888' }} 
                          />
                          <span className={cn(
                            "text-[11px] truncate",
                            isSelected ? "font-bold text-white" : "text-white/80 group-hover:text-white"
                          )}>
                            {char.name || '무명'}
                          </span>
                        </div>

                        <div className="shrink-0">
                          {assignedTotal > 0 ? (
                            <span className={cn(
                              "text-[9px] font-bold px-1.5 py-0.2 rounded-full",
                              isSelected 
                                ? "bg-[#e6005c] text-white" 
                                : "bg-white/10 text-white/70"
                            )}>
                              {assignedTotal}장
                            </span>
                          ) : (
                            <span className="text-[9px] text-white/20 font-mono">0장</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main Content Area: URL Bar + Gallery */}
              <div className="flex-1 flex flex-col bg-[#111111] overflow-hidden">
                {/* Top: Compact URL Fetch Section */}
                <div className="p-3 border-b border-white/10 shrink-0 bg-white/[0.01] flex items-center gap-2">
                  <div className="flex-1 relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                    <input 
                      type="text"
                      value={urlInput}
                      onChange={e => setUrlInput(e.target.value)}
                      placeholder="Imgur 앨범 주소 (예: https://imgur.com/a/...) 또는 이미지 직접 링크"
                      className="w-full h-8 bg-black/40 border border-white/10 rounded-lg pl-8 pr-3 text-[11px] text-white placeholder-white/30 focus:outline-none focus:border-[#e6005c] transition-colors"
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleFetch();
                      }}
                    />
                  </div>
                  <button 
                    onClick={handleFetch}
                    disabled={isLoading || !urlInput.trim()}
                    className="px-3.5 h-8 bg-[#e6005c] hover:bg-[#ff0066] text-white text-[11px] font-bold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_12px_rgba(230,0,92,0.25)] flex items-center gap-1.5 shrink-0"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>불러오는 중...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        <span>불러오기</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Subheader: Mode & Status Note */}
                <div className="px-4 py-2 border-b border-white/10 bg-black/20 flex items-center justify-between shrink-0 text-[11px]">
                  {isAllView ? (
                    <div className="flex items-center gap-2 text-white/70">
                      <LayoutGrid className="w-3.5 h-3.5 text-white/40" />
                      <span>전체 매칭 현황을 확인하거나, 좌측에서 캐릭터를 선택하여 스탠딩을 배정하세요.</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" 
                          style={{ backgroundColor: activeChar?.color || '#fff' }} 
                        />
                        <span className="font-bold text-white">
                          {activeChar?.name}
                        </span>
                        <span className="text-[10px] text-[#e6005c] font-bold">
                          {activeCharAssignedImages.length}장 배정됨
                        </span>
                      </div>
                      <span className="text-white/40 text-[10px]">
                        왼쪽 이미지를 클릭하면 배정되고, 오른쪽 카드를 클릭하면 해제됩니다.
                      </span>
                    </div>
                  )}
                </div>

                {/* Gallery Content Area */}
                {totalLoaded === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-white/30 gap-2 p-6">
                    <ImageIcon className="w-9 h-9 opacity-30" />
                    <div className="text-[12px] font-medium">상단에 Imgur 앨범 주소를 입력하고 [불러오기]를 눌러주세요.</div>
                    <div className="text-[10px] text-white/20">파일명과 캐릭터명을 대조하여 각 캐릭터의 스탠딩이 자동 매칭됩니다.</div>
                  </div>
                ) : isAllView ? (
                  /* ================= MODE A: "전체 보기" (Overview Grid) ================= */
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {loadedImages.map((img, idx) => {
                        const ownerId = urlToOwnerId[img.url];
                        const isAssigned = !!ownerId;
                        const ownerChar = ownerId ? charSettings[ownerId] : null;
                        const isRep = ownerId ? reps[ownerId] === img.url : false;

                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              if (ownerId) {
                                setActiveCharId(ownerId);
                              }
                            }}
                            className={cn(
                              "relative aspect-[3/4] rounded-xl overflow-hidden group border transition-all flex flex-col bg-black/40",
                              isAssigned ? "border-white/10 hover:border-white/30 cursor-pointer" : "border-white/5 opacity-70"
                            )}
                          >
                            {/* Image Preview Container */}
                            <div className="flex-1 w-full relative flex items-center justify-center p-2 overflow-hidden bg-black/20">
                              {img.url?.trim() ? (
                                <img 
                                  src={img.url.trim()} 
                                  alt={img.fileName} 
                                  className="w-full h-full object-contain pointer-events-none select-none" 
                                  referrerPolicy="no-referrer"
                                />
                              ) : null}

                              {/* Top-left: Assigned Character Badge */}
                              <div className="absolute top-2 left-2 flex items-center gap-1 pointer-events-none">
                                {isAssigned ? (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/70 text-white font-bold border border-white/10 backdrop-blur-md shadow-sm flex items-center gap-1">
                                    <div 
                                      className="w-1.5 h-1.5 rounded-full shrink-0" 
                                      style={{ backgroundColor: ownerChar?.color || '#fff' }} 
                                    />
                                    <span className="truncate max-w-[85px]">{ownerChar?.name}</span>
                                  </span>
                                ) : (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/40 border border-white/10 font-medium backdrop-blur-md">
                                    미지정
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Card Footer: Filename (Left) & Star (Right, only if rep) */}
                            <div className="px-2.5 py-1.5 bg-black/70 border-t border-white/10 flex items-center justify-between gap-1">
                              <span className="text-[10px] font-medium text-white/90 truncate flex-1" title={img.fileName}>
                                {img.fileName}
                              </span>
                              {isRep && (
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" title="대표 스탠딩" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* ================= MODE B: "캐릭터별 보기" (Left / Right Split View) ================= */
                  <div className="flex-1 flex overflow-hidden">
                    {/* Left Split Pane: Remaining / Other Images (Available Pool) */}
                    <div className="flex-1 border-r border-white/10 flex flex-col overflow-hidden bg-black/10">
                      <div className="px-3 py-2 border-b border-white/10 bg-white/[0.02] flex items-center justify-between text-[11px] shrink-0">
                        <span className="text-white/70 font-bold">
                          남은 이미지 ({remainingImages.length})
                        </span>
                        <div className="flex items-center gap-1 text-[10px]">
                          <button
                            onClick={() => setLeftFilterMode('all')}
                            className={cn(
                              "px-2 py-0.5 rounded transition-colors",
                              leftFilterMode === 'all' ? "bg-white/15 text-white font-bold" : "text-white/40 hover:text-white"
                            )}
                          >
                            전체
                          </button>
                          <button
                            onClick={() => setLeftFilterMode('unassigned')}
                            className={cn(
                              "px-2 py-0.5 rounded transition-colors",
                              leftFilterMode === 'unassigned' ? "bg-white/15 text-white font-bold" : "text-white/40 hover:text-white"
                            )}
                          >
                            미배정만
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
                        {remainingImages.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-white/30 text-[11px]">
                            남은 이미지가 없습니다.
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                            {remainingImages.map((img, idx) => {
                              const otherOwnerId = urlToOwnerId[img.url];
                              const otherOwnerChar = otherOwnerId ? charSettings[otherOwnerId] : null;

                              return (
                                <div
                                  key={idx}
                                  onClick={() => assignImageToChar(img.url, activeCharId)}
                                  className="relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer group border border-white/10 hover:border-[#e6005c] hover:shadow-[0_0_12px_rgba(230,0,92,0.25)] transition-all flex flex-col bg-black/40"
                                  title="클릭하여 현재 캐릭터에게 배정"
                                >
                                  <div className="flex-1 w-full relative flex items-center justify-center p-2 bg-black/20">
                                    {img.url?.trim() ? (
                                      <img 
                                        src={img.url.trim()} 
                                        alt={img.fileName} 
                                        className="w-full h-full object-contain pointer-events-none select-none" 
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : null}
                                    {/* Hover prompt to assign */}
                                    <div className="absolute inset-0 bg-[#e6005c]/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <div className="w-7 h-7 rounded-full bg-[#e6005c] text-white flex items-center justify-center shadow-lg">
                                        <Plus className="w-4 h-4 stroke-[3px]" />
                                      </div>
                                    </div>
                                    {/* Subtle tag if currently belongs to another character */}
                                    {otherOwnerChar && (
                                      <div className="absolute top-1.5 left-1.5 pointer-events-none">
                                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-black/80 text-white/60 border border-white/10 backdrop-blur-md">
                                          {otherOwnerChar.name}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="px-2 py-1.5 bg-black/70 border-t border-white/10">
                                    <span className="text-[10px] font-medium text-white/80 truncate block">
                                      {img.fileName}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Split Pane: Currently Assigned Images */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-black/20">
                      <div className="px-3 py-2 border-b border-white/10 bg-[#e6005c]/5 flex items-center justify-between text-[11px] shrink-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-bold">
                            배정된 스탠딩 ({activeCharAssignedImages.length})
                          </span>
                        </div>
                        <span className="text-[10px] text-white/40">
                          카드를 클릭하면 해제됩니다
                        </span>
                      </div>

                      <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
                        {activeCharAssignedImages.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-white/30 text-[11px] gap-1.5">
                            <ImageIcon className="w-7 h-7 opacity-20" />
                            <span>배정된 스탠딩이 없습니다.</span>
                            <span className="text-[10px] text-white/20">왼쪽에서 이미지를 클릭하여 추가하세요.</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                            {activeCharAssignedImages.map((img, idx) => {
                              const isRep = reps[activeCharId] === img.url;

                              return (
                                <div
                                  key={idx}
                                  onClick={() => unassignImage(img.url)}
                                  className={cn(
                                    "relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer group border transition-all flex flex-col bg-black/40",
                                    isRep 
                                      ? "border-amber-500/80 ring-1 ring-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]" 
                                      : "border-white/10 hover:border-white/30"
                                  )}
                                  title="클릭하여 배정 해제"
                                >
                                  <div className="flex-1 w-full relative flex items-center justify-center p-2 bg-black/20">
                                    {img.url?.trim() ? (
                                      <img 
                                        src={img.url.trim()} 
                                        alt={img.fileName} 
                                        className="w-full h-full object-contain pointer-events-none select-none" 
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : null}
                                    {/* Hover prompt to remove */}
                                    <div className="absolute inset-0 bg-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <div className="w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg">
                                        <X className="w-4 h-4 stroke-[3px]" />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Card Footer: Filename (Left) & Star Button for Representative (Right) */}
                                  <div 
                                    className="px-2 py-1.5 bg-black/75 border-t border-white/10 flex items-center justify-between gap-1"
                                    onClick={e => e.stopPropagation()} // Prevent unassigning when clicking footer / star
                                  >
                                    <span className="text-[10px] font-medium text-white/90 truncate flex-1" title={img.fileName}>
                                      {img.fileName}
                                    </span>

                                    {/* Simple Star Icon Button for Representative Standing */}
                                    <button
                                      onClick={(e) => toggleRep(e, img.url, activeCharId)}
                                      className="p-1 rounded hover:bg-white/10 transition-colors shrink-0"
                                      title={isRep ? "대표 스탠딩 (클릭 시 해제)" : "대표 스탠딩으로 지정"}
                                    >
                                      <Star 
                                        className={cn(
                                          "w-3.5 h-3.5 transition-colors", 
                                          isRep 
                                            ? "fill-amber-400 text-amber-400" 
                                            : "text-white/20 hover:text-white/70"
                                        )} 
                                      />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Bottom Footer: Checkbox Moved to Right Next to Actions */}
            <div className="px-5 py-3 border-t border-white/10 bg-black/30 flex items-center justify-between gap-3 shrink-0">
              {/* Left: Single Unified Count */}
              <div className="text-[11px] text-white/50 flex items-center gap-1.5">
                <span>총 <b className="text-white">{totalLoaded}개</b> 이미지 중</span>
                <span className="text-white font-bold">배정 완료 {assignedCount}개</span>
                <span>·</span>
                <span className="text-white/40">미지정 {unassignedCount}개</span>
              </div>

              {/* Right: Checkbox + Action Buttons */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer select-none py-1 px-2 rounded-lg hover:bg-white/5 transition-colors">
                  <input
                    type="checkbox"
                    checked={autoAssignIllustrations}
                    onChange={(e) => setAutoAssignIllustrations(e.target.checked)}
                    className="rounded border-white/20 text-[#e6005c] focus:ring-0 w-3.5 h-3.5 accent-[#e6005c]"
                  />
                  <span className="text-[11px] text-white/80 font-medium">
                    미배정 이미지({unassignedCount}개)는 삽화로 등록하기
                  </span>
                </label>

                <div className="h-3.5 w-px bg-white/10" />

                <button 
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded-lg text-[11px] font-bold text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  취소
                </button>
                <button 
                  onClick={() => setShowSummaryConfirm(true)}
                  disabled={totalLoaded === 0 || assignedCount === 0}
                  className="px-4 py-1.5 rounded-lg text-[11px] font-bold bg-[#e6005c] hover:bg-[#ff0066] text-white disabled:bg-white/5 disabled:text-white/30 disabled:cursor-not-allowed shadow-[0_0_12px_rgba(230,0,92,0.3)] transition-all"
                >
                  완료 및 적용 ({assignedCount}개)
                </button>
              </div>
            </div>

            {/* Confirmation Summary Dialog */}
            <AnimatePresence>
              {showSummaryConfirm && (
                <div 
                  className="fixed inset-0 z-[2000010] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
                  onClick={() => setShowSummaryConfirm(false)}
                >
                  <div 
                    className="bg-[#1c1c1c] border border-white/10 rounded-2xl shadow-2xl w-full max-w-[380px] overflow-hidden flex flex-col pointer-events-auto animate-in zoom-in-95 duration-150"
                    onClick={e => e.stopPropagation()}
                  >
                    {/* Header */}
                    <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white">이미지 일괄 등록</h3>
                      <button 
                        onClick={() => setShowSummaryConfirm(false)}
                        className="p-1 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors outline-none"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex flex-col gap-4">
                      <div className="bg-black/40 border border-white/10 rounded-xl p-3.5 flex flex-col gap-2.5 text-[12px]">
                        <div className="flex items-center justify-between">
                          <span className="text-white/70">캐릭터 스탠딩 지정</span>
                          <span className="text-white font-bold">
                            {assignedCount}개 <span className="text-white/40 font-normal">({assignedCharCount}명)</span>
                          </span>
                        </div>
                        {illustrationCount > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-white/70">본문 삽화 등록</span>
                            <span className="font-bold text-[#e6005c]">
                              {illustrationCount}개
                            </span>
                          </div>
                        )}
                        {excludedCount > 0 && (
                          <div className={cn(
                            "flex items-center justify-between text-[11px]",
                            (illustrationCount > 0 || assignedCount > 0) && "pt-2 border-t border-white/5"
                          )}>
                            <span className="text-white/40">미배정 이미지</span>
                            <span className="text-white/40">{excludedCount}개</span>
                          </div>
                        )}
                      </div>

                      <p className="text-[11px] text-white/50 text-center">
                        위 설정대로 로그에 이미지를 적용하시겠습니까?
                      </p>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => setShowSummaryConfirm(false)}
                          className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/70 hover:text-white text-[12px] font-medium transition-colors"
                        >
                          편집
                        </button>
                        <button
                          onClick={handleFinalApply}
                          className="flex-1 py-2 rounded-xl bg-[#e6005c] hover:bg-[#ff0066] text-white text-[12px] font-bold transition-all shadow-md"
                        >
                          적용
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
