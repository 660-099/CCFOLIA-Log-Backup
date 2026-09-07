const fs = require('fs');
let code = fs.readFileSync('src/components/BulkImageAllocatorModal.tsx', 'utf-8');

// Title
code = code.replace("이미지 일괄 등록: 스탠딩 선택", "이미지 일괄 등록 - 스탠딩 선택");

// Toggle Button
const oldToggleRegex = /<button\s+onClick=\{\(\) => setAutoAssign\(\!autoAssign\)\}[\s\S]*?<\/button>/;
const newToggle = `<button
                        onClick={() => setAutoAssign(!autoAssign)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                          autoAssign 
                            ? "bg-[#e6005c] text-white shadow-[0_0_10px_rgba(230,0,92,0.3)]" 
                            : "bg-white/5 text-white/30 hover:bg-white/10 hover:text-white/60"
                        )}
                      >
                        미지정 이미지를 모두 삽화로 등록
                      </button>`;
code = code.replace(oldToggleRegex, newToggle);

// Right Gallery item container onClick removal & hover overlay change
const oldRightGalleryItemRegex = /<div\s*key=\{idx\}\s*onClick=\{\(\) => unassignImage\(url\)\}\s*className=\{cn\(\s*"relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all group",[\s\S]*?\}\)[\s\S]*?<\/div>\s*<\/div>/g;

// Instead of regex for the whole block, let's find the activeCharAssignedUrls.map
const rightGalleryMapStart = "activeCharAssignedUrls.map((url, idx) => (";
const rightGalleryMapIdx = code.indexOf(rightGalleryMapStart);
if (rightGalleryMapIdx > -1) {
    const sectionStr = code.substring(rightGalleryMapIdx, code.indexOf("</div>", code.indexOf("</div>", rightGalleryMapIdx) + 50) + 300); // just grab a chunk
    
    let newSection = sectionStr.replace(/onClick=\{\(\) => unassignImage\(url\)\}/, "");
    newSection = newSection.replace("cursor-pointer", "cursor-default"); // since container is not clickable anymore
    
    // Remove the old overlay
    newSection = newSection.replace(/<div className="absolute inset-0 bg-black\/0 group-hover:bg-black\/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">\s*<span className="text-\[10px\] font-bold text-white bg-black\/60 px-2 py-1 rounded-lg">제거<\/span>\s*<\/div>/, "");
    
    // Add new X button
    const xButtonStr = `
                              <button
                                onClick={(e) => { e.stopPropagation(); unassignImage(url); }}
                                className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/70 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-white/20 z-10"
                              >
                                <X className="w-3.5 h-3.5 text-white" />
                              </button>`;
                              
    // Insert X button after the image tag
    newSection = newSection.replace(/<img src=\{url\}.*?\/>/, match => match + xButtonStr);

    code = code.replace(sectionStr, newSection);
}

// Footer Buttons
code = code.replace(
  `className="px-4 py-1.5 rounded-lg text-[11px] font-bold text-white/70 hover:text-white hover:bg-white/5 transition-colors"
              >
                취소`,
  `className="px-5 py-2.5 rounded-xl text-[12px] font-bold text-white/70 hover:text-white hover:bg-white/5 transition-colors"
              >
                취소`
);

code = code.replace(
  `className="px-4 py-1.5 rounded-lg text-[11px] font-bold bg-[#e6005c] text-white hover:bg-[#ff007f] disabled:bg-white/5 disabled:text-white/30 disabled:cursor-not-allowed transition-colors"
              >
                적용 완료`,
  `className="px-6 py-2.5 rounded-xl text-[12px] font-bold bg-[#e6005c] text-white hover:bg-[#ff007f] disabled:bg-white/5 disabled:text-white/30 disabled:cursor-not-allowed transition-colors"
              >
                완료`
);

fs.writeFileSync('src/components/BulkImageAllocatorModal.tsx', code);
