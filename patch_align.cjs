const fs = require('fs');

// 1. Fix src/index.css
let css = fs.readFileSync('src/index.css', 'utf-8');
css = css.replace(
  '.custom-bgm span {\n  text-align: center;\n  word-break: keep-all;\n  overflow-wrap: break-word;\n  line-height: 1.4;\n}',
  '.custom-bgm span {\n  text-align: left;\n  word-break: keep-all;\n  overflow-wrap: break-word;\n  line-height: 1.4;\n}'
);
fs.writeFileSync('src/index.css', css);

// 2. Fix htmlGenerator.ts
let htmlGen = fs.readFileSync('src/utils/htmlGenerator.ts', 'utf-8');
htmlGen = htmlGen.replace(
  '.custom-bgm span { text-align: center; word-break: keep-all; overflow-wrap: break-word; line-height: 1.4; }',
  '.custom-bgm span { text-align: left; word-break: keep-all; overflow-wrap: break-word; line-height: 1.4; }'
);
fs.writeFileSync('src/utils/htmlGenerator.ts', htmlGen);
