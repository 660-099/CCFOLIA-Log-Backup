const fs = require('fs');

// 1. Fix src/index.css
let css = fs.readFileSync('src/index.css', 'utf-8');
css = css.replace(
  '  transition: all 0.2s ease;\n  max-width: 80%;\n}',
  '  transition: all 0.2s ease;\n  max-width: calc(100% - 32px);\n  box-sizing: border-box;\n}'
);
fs.writeFileSync('src/index.css', css);

// 2. Fix htmlGenerator.ts
let htmlGen = fs.readFileSync('src/utils/htmlGenerator.ts', 'utf-8');
htmlGen = htmlGen.replace(
  '.custom-bgm { cursor: pointer; display: inline-flex; align-items: center; gap: 10px; font-size: 13px; background: rgba(255, 255, 255, 0.05); padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.1); color: #AAAAAA; user-select: none; transition: 0.2s; max-width: 80%; }',
  '.custom-bgm { cursor: pointer; display: inline-flex; align-items: center; gap: 10px; font-size: 13px; background: rgba(255, 255, 255, 0.05); padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.1); color: #AAAAAA; user-select: none; transition: 0.2s; max-width: calc(100% - 32px); box-sizing: border-box; }'
);
fs.writeFileSync('src/utils/htmlGenerator.ts', htmlGen);
