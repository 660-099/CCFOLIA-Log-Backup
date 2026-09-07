const fs = require('fs');
let code = fs.readFileSync('src/components/BulkImageAllocatorModal.tsx', 'utf-8');

const rightGalleryMapStart = "                          {activeCharAssignedUrls.map((url, idx) => (";
const rightGalleryMapIdx = code.indexOf(rightGalleryMapStart);
if (rightGalleryMapIdx > -1) {
    const endStr = "                            </div>\n                          ))}";
    const endIdx = code.indexOf(endStr, rightGalleryMapIdx) + endStr.length;
    const oldSection = code.substring(rightGalleryMapIdx, endIdx);
    
    const newSection = `                          {activeCharAssignedUrls.map((url, idx) => (
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
                                    className="px-2 py-0.5 rounded-full text-[9px] font-bold border transition-colors shadow-sm bg-black/80 border-white/20 text-white/90 hover:bg-white hover:text-black whitespace-nowrap"
                                  >
                                    대표 지정
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}`;
    code = code.replace(oldSection, newSection);
    fs.writeFileSync('src/components/BulkImageAllocatorModal.tsx', code);
}
