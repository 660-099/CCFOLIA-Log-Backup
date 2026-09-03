const fs = require('fs');

// 1. src/index.css
let css = fs.readFileSync('src/index.css', 'utf-8');
css = css.replace(
  '  transition: all 0.2s ease;\n  max-width: calc(100% - 32px);\n  box-sizing: border-box;\n}',
  '  transition: all 0.2s ease;\n}'
);
fs.writeFileSync('src/index.css', css);

// 2. src/utils/htmlGenerator.ts
let htmlGen = fs.readFileSync('src/utils/htmlGenerator.ts', 'utf-8');
htmlGen = htmlGen.replace(
  '.custom-bgm { cursor: pointer; display: inline-flex; align-items: flex-start; gap: 10px; font-size: 13px; background: rgba(255, 255, 255, 0.05); padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.1); color: #AAAAAA; user-select: none; transition: 0.2s; max-width: calc(100% - 32px); box-sizing: border-box; }',
  '.custom-bgm { cursor: pointer; display: inline-flex; align-items: center; gap: 10px; font-size: 13px; background: rgba(255, 255, 255, 0.05); padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.1); color: #AAAAAA; user-select: none; transition: 0.2s; }'
);
htmlGen = htmlGen.replace(
  '.custom-bgm svg { width: 12px; height: 12px; fill: currentColor; margin-top: 3px; flex-shrink: 0; }',
  '.custom-bgm svg { width: 12px; height: 12px; fill: currentColor; flex-shrink: 0; }'
);
fs.writeFileSync('src/utils/htmlGenerator.ts', htmlGen);

// 3. src/components/BgmItem.tsx
let bgm = fs.readFileSync('src/components/BgmItem.tsx', 'utf-8');
bgm = bgm.replace(
  '<svg className="icon w-3 h-3 fill-current mt-[3px] shrink-0" viewBox="0 0 24 24">',
  '<svg className="icon w-3 h-3 fill-current shrink-0" viewBox="0 0 24 24">'
);
bgm = bgm.replace(
  '<svg className="icon w-3 h-3 fill-current mt-[3px] shrink-0" viewBox="0 0 24 24">',
  '<svg className="icon w-3 h-3 fill-current shrink-0" viewBox="0 0 24 24">'
);
fs.writeFileSync('src/components/BgmItem.tsx', bgm);
