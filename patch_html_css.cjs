const fs = require('fs');
let htmlGen = fs.readFileSync('src/utils/htmlGenerator.ts', 'utf-8');

const targetStr = `.custom-bgm { cursor: pointer; display: inline-flex; align-items: center; gap: 10px; font-size: 13px; background: rgba(255, 255, 255, 0.05); padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.1); color: #AAAAAA; user-select: none; transition: 0.2s; }`;

const replaceStr = `.custom-bgm { cursor: pointer; display: inline-flex; align-items: center; gap: 10px; font-size: 13px; background: rgba(255, 255, 255, 0.05); padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.1); color: #AAAAAA; user-select: none; transition: 0.2s; max-width: 90%; }
    .custom-bgm span { text-align: center; word-break: keep-all; overflow-wrap: break-word; line-height: 1.4; max-width: 250px; }`;

htmlGen = htmlGen.replace(targetStr, replaceStr);
fs.writeFileSync('src/utils/htmlGenerator.ts', htmlGen);
