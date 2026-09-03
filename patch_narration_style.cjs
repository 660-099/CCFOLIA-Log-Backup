const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf-8');
app = app.replace('스타일 1 (이탤릭)', '스타일 1 (기본)');
app = app.replace('스타일 2 (기본)', '스타일 2 (이탤릭)');
fs.writeFileSync('src/App.tsx', app);

let htmlGen = fs.readFileSync('src/utils/htmlGenerator.ts', 'utf-8');
htmlGen = htmlGen.replace(/narrationFormat === 'style1'/g, "narrationFormat === 'style2'");
fs.writeFileSync('src/utils/htmlGenerator.ts', htmlGen);
