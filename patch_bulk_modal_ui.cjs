const fs = require('fs');
let code = fs.readFileSync('src/components/BulkImageAllocatorModal.tsx', 'utf-8');

// Update Prop types
code = code.replace(
  "onSave: (allocations: Record<string, string[]>, reps: Record<string, string>) => void;",
  "onSave: (allocations: Record<string, string[]>, reps: Record<string, string>, illustrations: string[]) => void;"
);

// Add illustrations state
const stateNew = `  const [activeCharId, setActiveCharId] = useState<string | null>(null);
  const [hideAssigned, setHideAssigned] = useState(false);
  const [illustrations, setIllustrations] = useState<string[]>([]);`;
code = code.replace("  const [activeCharId, setActiveCharId] = useState<string | null>(null);\n  const [hideAssigned, setHideAssigned] = useState(false);", stateNew);

// Update urlToCharId
const urlMapOld = `    Object.entries(allocations).forEach(([charId, urls]: [string, string[]]) => {
      urls.forEach(url => {
        map[url] = charId;
      });
    });
    return map;`;
const urlMapNew = `    Object.entries(allocations).forEach(([charId, urls]: [string, string[]]) => {
      urls.forEach(url => {
        map[url] = charId;
      });
    });
    illustrations.forEach(url => {
      map[url] = 'ILLUSTRATIONS';
    });
    return map;`;
code = code.replace(urlMapOld, urlMapNew);

// In handleToggleImage, add handling for ILLUSTRATIONS
const handleToggleStart = `  const handleToggleImage = (url: string) => {
    if (!activeCharId) return;

    if (activeCharId === 'ILLUSTRATIONS') {
      const existingOwnerId = urlToCharId[url];
      
      // Remove from previous character owner if needed
      if (existingOwnerId && existingOwnerId !== 'ILLUSTRATIONS') {
        setAllocations(prev => {
          const next = { ...prev };
          next[existingOwnerId] = next[existingOwnerId].filter(u => u !== url);
          if (reps[existingOwnerId] === url) {
             setReps(r => {
                const nextR = { ...r };
                if (next[existingOwnerId].length > 0) nextR[existingOwnerId] = next[existingOwnerId][0];
                else delete nextR[existingOwnerId];
                return nextR;
             });
          }
          return next;
        });
      }

      setIllustrations(prev => {
        if (prev.includes(url)) {
          return prev.filter(u => u !== url);
        } else {
          return [...prev, url];
        }
      });
      return;
    }

    setAllocations(prev => {`;
code = code.replace("  const handleToggleImage = (url: string) => {\n    if (!activeCharId) return;\n\n    setAllocations(prev => {", handleToggleStart);

// Handle when moving FROM illustrations to character
const removeFromPrev = `        // Add to active
        // First remove from previous owner if any
        if (existingOwnerId) {
          if (existingOwnerId === 'ILLUSTRATIONS') {
            setIllustrations(i => i.filter(u => u !== url));
          } else {
            next[existingOwnerId] = next[existingOwnerId].filter(u => u !== url);
            if (reps[existingOwnerId] === url) {
               setReps(r => {
                  const nextR = { ...r };
                  if (next[existingOwnerId].length > 0) nextR[existingOwnerId] = next[existingOwnerId][0];
                  else delete nextR[existingOwnerId];
                  return nextR;
               });
            }
          }
        }`;
code = code.replace("        // Add to active\n        // First remove from previous owner if any\n        if (existingOwnerId) {\n          next[existingOwnerId] = next[existingOwnerId].filter(u => u !== url);\n          if (reps[existingOwnerId] === url) {\n             setReps(r => {\n                const nextR = { ...r };\n                if (next[existingOwnerId].length > 0) nextR[existingOwnerId] = next[existingOwnerId][0];\n                else delete nextR[existingOwnerId];\n                return nextR;\n             });\n          }\n        }", removeFromPrev);

// Texts
code = code.replace("이미지 일괄 분배", "스탠딩 선택");
code = code.replace("이미지 불러오기", "앨범 불러오기");
code = code.replace("클릭하여 활성화 후 우측에서 이미지 할당", "클릭하여 활성화 후 우측에서 이미지 선택");
code = code.replace("총 {loadedImages.length}개 이미지 중 {Object.values(allocations).reduce((acc: number, arr: string[]) => acc + arr.length, 0)}개 할당됨", "총 {loadedImages.length}개 이미지 중 {Object.values(allocations).reduce((acc: number, arr: string[]) => acc + arr.length, 0) + illustrations.length}개 할당됨");

// Add Illustrations button to left panel
const charListEnd = `                })}
              </div>
              <div className="p-3 border-y border-white/5 bg-[#1a1a1a] mt-2 shrink-0">
                <div className="text-[10px] font-bold text-white/50 mb-1">기타</div>
              </div>
              <div className="p-2 shrink-0">
                <button
                  onClick={() => setActiveCharId('ILLUSTRATIONS')}
                  className={cn(
                    "w-full flex items-center gap-2 p-2 rounded-lg transition-all text-left group",
                    activeCharId === 'ILLUSTRATIONS' 
                      ? "bg-[#e6005c]/10 border border-[#e6005c]/30" 
                      : "hover:bg-white/5 border border-transparent"
                  )}
                >
                  <div className="w-6 h-6 rounded-full shrink-0 border border-white/10 flex items-center justify-center bg-blue-500/20 text-blue-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold text-white truncate">삽화 (배경/CG 등)</div>
                    <div className="text-[9px] text-white/40">{illustrations.length}개 할당됨</div>
                  </div>
                </button>
              </div>
            </div>`;
code = code.replace("                })}\n              </div>\n            </div>", charListEnd);

// Add "Assign all remaining to illustrations" button in right panel
const galleryControlsEnd = `                  {hideAssigned ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  할당된 이미지 숨기기
                </button>
              </div>
              
              <div className="px-4 py-2 border-b border-white/5 bg-black/40 flex justify-end shrink-0">
                 <button
                  onClick={() => {
                     const unassignedUrls = loadedImages.filter(img => !urlToCharId[img.url]).map(img => img.url);
                     setIllustrations(prev => [...prev, ...unassignedUrls]);
                  }}
                  className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors bg-white/10 hover:bg-white/20 text-white"
                 >
                   미지정 이미지를 모두 삽화로 등록
                 </button>
              </div>`;
code = code.replace("                  {hideAssigned ? <EyeOff className=\"w-3 h-3\" /> : <Eye className=\"w-3 h-3\" />}\n                  할당된 이미지 숨기기\n                </button>\n              </div>", galleryControlsEnd);

// Represent badge
const repBtnRegex = /\{\/\* Representative button for active owner \*\/\}([\s\S]*?)<\/div>\s*\}\)/;
const newRepBtn = `{/* Always visible representative badge if it is representative */}
                          {isActiveOwner && reps[activeCharId] === img.url && (
                            <div className="absolute top-1.5 left-1.5 bg-[#e6005c] text-white px-1.5 py-0.5 rounded text-[8px] font-bold border border-white/20 shadow-md">
                              대표
                            </div>
                          )}
                          
                          {/* Representative button for active owner on hover */}
                          {isActiveOwner && reps[activeCharId] !== img.url && activeCharId !== 'ILLUSTRATIONS' && (
                            <div className="absolute inset-x-0 bottom-0 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex justify-center bg-gradient-to-t from-black/80 to-transparent">
                              <button
                                onClick={(e) => setAsRep(e, img.url, activeCharId)}
                                className="px-2 py-0.5 rounded text-[9px] font-bold border transition-colors shadow-sm bg-black/60 border-white/20 text-white/70 hover:bg-white hover:text-black"
                              >
                                대표 지정
                              </button>
                            </div>
                          )}`;
code = code.replace(repBtnRegex, newRepBtn + "\n                        </div>\n                      );");

// Save button
code = code.replace("onClick={() => onSave(allocations, reps)}", "onClick={() => onSave(allocations, reps, illustrations)}");

fs.writeFileSync('src/components/BulkImageAllocatorModal.tsx', code);
