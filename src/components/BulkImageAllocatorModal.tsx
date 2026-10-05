import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  X, 
  Check, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  AlertCircle, 
  Sparkles, 
  Filter,
  Star
} from 'lucide-react';
import { cn } from '../utils';
import { 
  matchImagesToCharacters, 
  MatchCandidateCharacter, 
  ImageToMatch 
} from '../utils/characterMatcher';

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
  // url -> targetImgId (기존 코코포리아 고유 id 예: img_001 연동용)
  const [targetImgIds, setTargetImgIds] = useState<Record<string, string>>({});
  
  const [activeCharId, setActiveCharId] = useState<string | null>(null);
  const [autoAssignIllustrations, setAutoAssignIllustrations] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'active' | 'assigned' | 'unassigned'>('all');

  // 첫 캐릭터 기본 활성화
  useEffect(() => {
    if (isOpen) {
      if (initialUrl && !urlInput) {
        setUrlInput(initialUrl);
      }
      const charIds = Object.keys(charSettings);
      if (charIds.length > 0 && !activeCharId) {
        setActiveCharId(charIds[0]);
      }
    }
  }, [isOpen, charSettings, initialUrl]);

  // Derive mapping: url -> owner charId
  const urlToOwnerId = useMemo(() => {
    const map: Record<string, string> = {};
    Object.entries(allocations).forEach(([charId, urls]: [string, string[]]) => {
      urls.forEach(url => {
        map[url] = charId;
      });
    });
    return map;
  }, [allocations]);

  // 이미지 및 앨범 불러오기 핸들러
  const handleFetch = async () => {
    if (!urlInput.trim()) return;
    setIsLoading(true);
    
    try {
      let fetchedImages: { url: string; fileName: string; size?: number }[] = [];
      
      if (urlInput.includes('imgur.com')) {
        const response = await fetch('/api/imgur', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: urlInput.trim() }),
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Imgur 앨범 정보를 불러올 수 없습니다. 링크를 확인해주세요.');
        }
        fetchedImages = await response.json();
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

      // 캐릭터 데이터 변환
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

      // 정밀 캐릭터명 매칭 엔진 구동
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

  // 사용자가 이미지를 현재 캐릭터에 할당
  const assignImage = (url: string) => {
    if (!activeCharId) return;
    
    setAllocations(prev => {
      const next = { ...prev };
      // 이전 소유자 제거
      for (const [k, urls] of Object.entries(next) as [string, string[]][]) {
        if (urls.includes(url)) {
          next[k] = urls.filter(u => u !== url);
        }
      }
      
      if (!next[activeCharId]) next[activeCharId] = [];
      if (!next[activeCharId].includes(url)) {
        next[activeCharId] = [...next[activeCharId], url];
      }
      return next;
    });

    // 첫 이미지인 경우 대표 스탠딩으로 자동 설정
    setReps(prev => {
      if (!prev[activeCharId]) {
        return { ...prev, [activeCharId]: url };
      }
      return prev;
    });
  };

  // 할당 해제
  const unassignImage = (url: string) => {
    setAllocations(prev => {
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        next[k] = next[k].filter(u => u !== url);
      }
      return next;
    });

    setTargetImgIds(prev => {
      const next = { ...prev };
      delete next[url];
      return next;
    });
  };

  // 대표 스탠딩 지정
  const toggleRep = (e: React.MouseEvent, url: string, charId: string) => {
    e.stopPropagation();
    setReps(prev => ({
      ...prev,
      [charId]: prev[charId] === url ? '' : url
    }));
  };

  // 통계 계산
  const totalLoaded = loadedImages.length;
  const assignedUrls = useMemo(() => {
    const set = new Set<string>();
    Object.values(allocations).forEach((urls: string[]) => urls.forEach(u => set.add(u)));
    return set;
  }, [allocations]);

  const assignedCount = assignedUrls.size;
  const unassignedCount = totalLoaded - assignedCount;

  // 필터링된 이미지 목록
  const displayedImages = useMemo(() => {
    if (filterMode === 'active') {
      if (!activeCharId) return [];
      const activeUrls = allocations[activeCharId] || [];
      return loadedImages.filter(img => activeUrls.includes(img.url));
    }
    if (filterMode === 'assigned') {
      return loadedImages.filter(img => assignedUrls.has(img.url));
    }
    if (filterMode === 'unassigned') {
      return loadedImages.filter(img => !assignedUrls.has(img.url));
    }
    return loadedImages;
  }, [loadedImages, filterMode, activeCharId, allocations, assignedUrls]);

  const activeChar = activeCharId ? charSettings[activeCharId] : null;

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
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.03]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#e6005c]/10 border border-[#e6005c]/20 flex items-center justify-center">
                  <Upload className="w-4 h-4 text-[#e6005c]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    이미지 일괄 등록 - 스탠딩 선택
                  </h2>
                  <p className="text-[11px] text-white/40">
                    캐릭터별로 스탠딩을 확인하고 갤러리에서 클릭하여 배분하거나 해제합니다.
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="p-1.5 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-colors outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Body: Split View */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Panel: Characters List */}
              <div className="w-[260px] border-r border-white/10 bg-black/30 flex flex-col shrink-0">
                <div className="p-3.5 border-b border-white/10 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white/60 tracking-wider">
                    등장 캐릭터 ({Object.keys(charSettings).length})
                  </span>
                  <span className="text-[10px] text-white/30">클릭하여 선택</span>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                  {Object.entries(charSettings).map(([cId, char]: [string, any]) => {
                    const assignedList = allocations[cId] || [];
                    const assignedTotal = assignedList.length;
                    const isSelected = activeCharId === cId;

                    return (
                      <button
                        key={cId}
                        onClick={() => setActiveCharId(cId)}
                        className={cn(
                          "w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left group border",
                          isSelected 
                            ? "bg-[#e6005c]/15 border-[#e6005c]/40 shadow-sm" 
                            : "hover:bg-white/5 border-transparent"
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-1">
                          <div 
                            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm border border-white/20" 
                            style={{ backgroundColor: char.color || '#888' }} 
                          />
                          <div className="min-w-0">
                            <div className="text-[12px] font-bold text-white truncate">
                              {char.name || '무명'}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {assignedTotal > 0 ? (
                            <span className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full",
                              isSelected 
                                ? "bg-[#e6005c] text-white" 
                                : "bg-white/10 text-white/70"
                            )}>
                              {assignedTotal}장
                            </span>
                          ) : (
                            <span className="text-[10px] text-white/20">0장</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Panel: URL Bar + Gallery */}
              <div className="flex-1 flex flex-col bg-[#111111] overflow-hidden">
                {/* Top: URL Fetch Section */}
                <div className="p-4 border-b border-white/10 shrink-0 bg-white/[0.01] space-y-2.5">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input 
                        type="text"
                        value={urlInput}
                        onChange={e => setUrlInput(e.target.value)}
                        placeholder="Imgur 앨범 주소 (예: https://imgur.com/a/...) 또는 이미지 직접 링크"
                        className="w-full h-10 bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 text-[12px] text-white placeholder-white/30 focus:outline-none focus:border-[#e6005c] transition-colors"
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleFetch();
                        }}
                      />
                    </div>
                    <button 
                      onClick={handleFetch}
                      disabled={isLoading || !urlInput.trim()}
                      className="px-5 h-10 bg-[#e6005c] hover:bg-[#ff0066] text-white text-[12px] font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(230,0,92,0.25)] flex items-center gap-1.5 shrink-0"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>불러오는 중...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>불러오기</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-white/40 px-1">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-white/30" />
                      <span>앨범을 불러오면 캐릭터 이름 및 파일명을 분석하여 자동으로 스탠딩이 배분됩니다.</span>
                    </div>
                    {totalLoaded > 0 && (
                      <div className="text-[11px] text-white/60">
                        총 <b className="text-white">{totalLoaded}개</b> 이미지 로드됨
                      </div>
                    )}
                  </div>
                </div>

                {/* Subheader: Active Character Status & Filter Tabs */}
                <div className="px-4 py-2.5 border-b border-white/10 bg-black/20 flex flex-wrap items-center justify-between gap-3 shrink-0">
                  {/* Current Character Active Banner */}
                  <div className="flex items-center gap-2 min-w-0">
                    {activeChar ? (
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full shrink-0 shadow-sm" 
                          style={{ backgroundColor: activeChar.color || '#fff' }} 
                        />
                        <span className="text-[12px] font-bold text-white truncate">
                          [{activeChar.name}] 스탠딩 선택 중
                        </span>
                        <span className="text-[11px] text-white/40">
                          (현재 {(allocations[activeCharId || ''] || []).length}개 배정됨)
                        </span>
                      </div>
                    ) : (
                      <span className="text-[12px] text-white/40">좌측에서 캐릭터를 선택하세요</span>
                    )}
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/10">
                    <button
                      onClick={() => setFilterMode('all')}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors",
                        filterMode === 'all' ? "bg-white/20 text-white" : "text-white/50 hover:text-white"
                      )}
                    >
                      전체 ({totalLoaded})
                    </button>
                    {activeCharId && (
                      <button
                        onClick={() => setFilterMode('active')}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors",
                          filterMode === 'active' ? "bg-[#e6005c] text-white" : "text-white/50 hover:text-white"
                        )}
                      >
                        현재 캐릭터 ({allocations[activeCharId]?.length || 0})
                      </button>
                    )}
                    <button
                      onClick={() => setFilterMode('assigned')}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors",
                        filterMode === 'assigned' ? "bg-white/20 text-white" : "text-white/50 hover:text-white"
                      )}
                    >
                      배정 완료 ({assignedCount})
                    </button>
                    <button
                      onClick={() => setFilterMode('unassigned')}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors",
                        filterMode === 'unassigned' ? "bg-white/20 text-white" : "text-white/50 hover:text-white"
                      )}
                    >
                      미지정 ({unassignedCount})
                    </button>
                  </div>
                </div>

                {/* Main Image Grid */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                  {totalLoaded === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-white/30 gap-2">
                      <ImageIcon className="w-10 h-10 opacity-30" />
                      <div className="text-[12px] font-medium">상단에 Imgur 앨범 주소를 입력하고 [불러오기]를 눌러주세요.</div>
                      <div className="text-[10px] text-white/20">파일명과 캐릭터명을 바탕으로 각 캐릭터의 스탠딩이 자동 매칭됩니다.</div>
                    </div>
                  ) : displayedImages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-white/30 gap-2">
                      <Filter className="w-8 h-8 opacity-30" />
                      <div className="text-[12px]">선택한 조건에 해당하는 이미지가 없습니다.</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {displayedImages.map((img, idx) => {
                        const ownerId = urlToOwnerId[img.url];
                        const isAssigned = !!ownerId;
                        const isAssignedToActive = ownerId === activeCharId;
                        const isAssignedToOther = isAssigned && !isAssignedToActive;
                        const ownerChar = ownerId ? charSettings[ownerId] : null;
                        const isRep = ownerId ? reps[ownerId] === img.url : false;

                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              if (!activeCharId) return;
                              if (isAssignedToActive) {
                                unassignImage(img.url);
                              } else {
                                assignImage(img.url);
                              }
                            }}
                            className={cn(
                              "relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer group border-2 transition-all flex flex-col bg-black/40",
                              isAssignedToActive 
                                ? "border-[#e6005c] ring-2 ring-[#e6005c]/30 shadow-[0_0_15px_rgba(230,0,92,0.25)]" 
                                : isAssignedToOther 
                                ? "border-white/10 opacity-60 hover:opacity-100 hover:border-white/30" 
                                : "border-white/10 hover:border-white/30 hover:scale-[1.02]"
                            )}
                          >
                            {/* Image Preview Container */}
                            <div className="flex-1 w-full relative flex items-center justify-center p-2 overflow-hidden bg-black/20">
                              <img 
                                src={img.url} 
                                alt={img.fileName} 
                                className="w-full h-full object-contain pointer-events-none select-none" 
                                referrerPolicy="no-referrer"
                              />

                              {/* Active Checkmark Badge */}
                              {isAssignedToActive && (
                                <div className="absolute top-2 right-2 w-6 h-6 bg-[#e6005c] rounded-full flex items-center justify-center shadow-lg border border-white/20 animate-in zoom-in duration-100">
                                  <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />
                                </div>
                              )}

                              {/* Status Badge */}
                              <div className="absolute top-2 left-2 flex flex-col gap-1 items-start pointer-events-none">
                                {isAssigned ? (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/60 text-white/90 border border-white/10 font-bold backdrop-blur-md shadow-sm flex items-center gap-1">
                                    <div 
                                      className="w-1.5 h-1.5 rounded-full shrink-0" 
                                      style={{ backgroundColor: ownerChar?.color || '#fff' }} 
                                    />
                                    <span className="truncate max-w-[80px]">{ownerChar?.name}</span>
                                  </span>
                                ) : (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/40 border border-white/10 font-medium backdrop-blur-md">
                                    미지정
                                  </span>
                                )}

                                {/* Representative Standing Badge */}
                                {isRep && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/25 text-amber-300 border border-amber-500/40 font-bold backdrop-blur-md flex items-center gap-0.5 shadow-sm">
                                    <Star className="w-2.5 h-2.5 fill-amber-300" />
                                    대표
                                  </span>
                                )}
                              </div>

                              {/* Action Overlay: Representative toggle button */}
                              {isAssigned && (
                                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={(e) => toggleRep(e, img.url, ownerId)}
                                    className={cn(
                                      "px-2 py-0.5 rounded-md text-[9px] font-bold border transition-colors shadow-md backdrop-blur-md",
                                      isRep 
                                        ? "bg-amber-500 text-black border-amber-400" 
                                        : "bg-black/70 border-white/20 text-white/70 hover:text-white hover:bg-black/90"
                                    )}
                                  >
                                    {isRep ? '대표 해제' : '대표 지정'}
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Card Footer: Filename & Assigned Character Indicator */}
                            <div className="p-2 bg-black/60 border-t border-white/10 flex flex-col gap-0.5">
                              <div className="text-[10px] font-bold text-white truncate" title={img.fileName}>
                                {img.fileName}
                              </div>
                              <div className="flex items-center justify-between gap-1">
                                {ownerChar ? (
                                  <div className="flex items-center gap-1 truncate">
                                    <div 
                                      className="w-2 h-2 rounded-full shrink-0" 
                                      style={{ backgroundColor: ownerChar.color || '#fff' }} 
                                    />
                                    <span className="text-[9px] text-white/70 truncate">
                                      {ownerChar.name}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[9px] text-white/30">미배정</span>
                                )}
                                <span className="text-[9px] text-white/30">
                                  {isAssignedToActive ? '클릭시 해제' : '클릭시 배분'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Bottom Footer */}
            <div className="px-5 py-3.5 border-t border-white/10 bg-black/30 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoAssignIllustrations}
                    onChange={(e) => setAutoAssignIllustrations(e.target.checked)}
                    className="rounded border-white/20 text-[#e6005c] focus:ring-0 w-3.5 h-3.5 accent-[#e6005c]"
                  />
                  <span className="text-[11px] text-white/70">
                    미지정 이미지({unassignedCount}개)는 삽화로 등록하기
                  </span>
                </label>

                <div className="h-3 w-px bg-white/10 hidden sm:block" />

                <div className="text-[11px] text-white/40 hidden sm:flex items-center gap-1.5">
                  <span>총 {totalLoaded}개 이미지 중</span>
                  <span className="text-white font-bold">배정 완료 {assignedCount}개</span>
                  <span>·</span>
                  <span className="text-white/40">미지정 {unassignedCount}개</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-[11px] font-bold text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  취소
                </button>
                <button 
                  onClick={() => {
                    const illustrationUrls = autoAssignIllustrations 
                      ? loadedImages.filter(img => !assignedUrls.has(img.url)).map(img => img.url)
                      : [];
                    onSave(allocations, reps, targetImgIds, illustrationUrls);
                  }}
                  disabled={totalLoaded === 0 || assignedCount === 0}
                  className="px-6 py-2 rounded-xl text-[11px] font-bold bg-[#e6005c] hover:bg-[#ff0066] text-white disabled:bg-white/5 disabled:text-white/30 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(230,0,92,0.3)] transition-all"
                >
                  완료 및 적용 ({assignedCount}개)
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
