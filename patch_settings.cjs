const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const hideAllAvatarsBlock = `                    <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl shadow-sm h-11 relative">
                      <span className="text-[11px] font-bold text-white/80">스탠딩 숨김</span>
                      <Toggle 
                        enabled={hideAllAvatars} 
                        onChange={(val) => {
                          setHideAllAvatars(val);
                          saveToHistory({ hideAllAvatars: val });
                        }} 
                      />
                    </div>`;

const cropFaceTopBlock = `                    <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl shadow-sm h-11 relative">
                      <span className="text-[11px] font-bold text-white/80">얼굴 위주 크롭 (상단 1:1)</span>
                      <Toggle 
                        enabled={cropFaceTop} 
                        onChange={(val) => {
                          setCropFaceTop(val);
                          saveToHistory({ cropFaceTop: val });
                        }} 
                      />
                    </div>`;

const blockToRemove = hideAllAvatarsBlock + "\n" + cropFaceTopBlock;

// Because of spacing/newlines in original, let's use a regex to grab and remove it.
const regexToRemove = /<div className="flex items-center justify-between p-3 bg-white\/5 border border-white\/5 rounded-xl shadow-sm h-11 relative">\s*<span className="text-\[11px\] font-bold text-white\/80">스탠딩 숨김<\/span>[\s\S]*?saveToHistory\(\{ cropFaceTop: val \}\);\s*\}\}\s*\/>\s*<\/div>/;

if (regexToRemove.test(code)) {
    code = code.replace(regexToRemove, "");
    
    // Now insert it before "스탠딩 배경 숨김"
    const targetAnchor = `<div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl shadow-sm h-11 relative">
                      <span className="text-[11px] font-bold text-white/80">스탠딩 배경 숨김</span>`;
    
    const insertion = hideAllAvatarsBlock + "\n" + cropFaceTopBlock + "\n" + targetAnchor;
    
    code = code.replace(targetAnchor, insertion);
    
    fs.writeFileSync('src/App.tsx', code);
    console.log("Reordered successfully");
} else {
    console.log("Could not find block to remove");
}
