const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Restore Narration Style Labels
app = app.replace('스타일 1 (이탤릭)', '스타일 1 (기본)');
app = app.replace('스타일 2 (기본)', '스타일 2 (이탤릭)');

// 2. Extract toggles
const cropBlockPattern = /([ \t]*<div className="flex items-center justify-between p-3 bg-white\/5 border border-white\/5 rounded-xl shadow-sm h-11 relative">\s*<span className="text-\[11px\] font-bold text-white\/70">얼굴 위주 크롭 \(상단 1:1\)<\/span>\s*<Toggle\s*enabled={cropFaceTop}\s*onChange={\(val\) => {\s*setCropFaceTop\(val\);\s*saveToHistory\({ cropFaceTop: val }\);\s*}\}\s*\/>\s*<\/div>)/;

const hideBlockPattern = /([ \t]*<div className="flex items-center justify-between p-3 bg-white\/5 border border-white\/5 rounded-xl shadow-sm h-11 relative">\s*<span className="text-\[11px\] font-bold text-white\/70">스탠딩 숨김<\/span>\s*<Toggle\s*enabled={hideAllAvatars}\s*onChange={\(val\) => {\s*setHideAllAvatars\(val\);\s*saveToHistory\({ hideAllAvatars: val }\);\s*}\}\s*\/>\s*<\/div>)/;

const cropMatch = app.match(cropBlockPattern);
const hideMatch = app.match(hideBlockPattern);

if (cropMatch && hideMatch) {
  // Remove them
  app = app.replace(cropMatch[1], '');
  app = app.replace(hideMatch[1], '');
  
  // Find where to insert
  const targetSplit = app.split(/([ \t]*\{narrationCharacter && \(\s*<>\s*<div className="flex flex-col gap-2 mt-2 p-3 bg-white\/5 border border-white\/5 rounded-xl shadow-sm">)/);
  if (targetSplit.length > 1) {
    app = targetSplit[0] + hideMatch[1] + '\n' + cropMatch[1] + '\n' + targetSplit[1] + targetSplit[2];
  } else {
    console.log("Could not find insertion point!");
  }
} else {
  console.log("Could not find blocks!");
}

fs.writeFileSync('src/App.tsx', app);
