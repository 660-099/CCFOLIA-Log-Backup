const fs = require('fs');

// src/components/BgmItem.tsx
let bgm = fs.readFileSync('src/components/BgmItem.tsx', 'utf-8');
bgm = bgm.replace(
  '<svg className="icon w-3 h-3 fill-current" viewBox="0 0 24 24">',
  '<svg className="icon w-3 h-3 fill-current mt-[3px] shrink-0" viewBox="0 0 24 24">'
);
bgm = bgm.replace(
  '<svg className="icon w-3 h-3 fill-current" viewBox="0 0 24 24">',
  '<svg className="icon w-3 h-3 fill-current mt-[3px] shrink-0" viewBox="0 0 24 24">'
);
fs.writeFileSync('src/components/BgmItem.tsx', bgm);

// src/utils/htmlGenerator.ts
let htmlGen = fs.readFileSync('src/utils/htmlGenerator.ts', 'utf-8');
htmlGen = htmlGen.replace(
  '.custom-bgm { cursor: pointer; display: inline-flex; align-items: center;',
  '.custom-bgm { cursor: pointer; display: inline-flex; align-items: flex-start;'
);
if (!htmlGen.includes('.custom-bgm svg { width: 12px; height: 12px; fill: currentColor; margin-top: 3px; flex-shrink: 0; }')) {
    htmlGen = htmlGen.replace(
        '.custom-bgm svg { width: 12px; height: 12px; fill: currentColor; }',
        '.custom-bgm svg { width: 12px; height: 12px; fill: currentColor; margin-top: 3px; flex-shrink: 0; }'
    );
}

// In htmlGenerator, the SVG is injected:
// <svg class="icon" viewBox="0 0 24 24">
// This matches the css rule above.
fs.writeFileSync('src/utils/htmlGenerator.ts', htmlGen);
