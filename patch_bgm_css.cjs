const fs = require('fs');
let code = fs.readFileSync('src/components/GlobalBgmPlayer.tsx', 'utf-8');

const target = `opacity: 0; pointer-events: none;`;
const replace = `opacity: 0; pointer-events: none; visibility: hidden;`;

const target2 = `opacity: 1; pointer-events: auto; transform: translateY(0);`;
const replace2 = `opacity: 1; pointer-events: auto; transform: translateY(0); visibility: visible;`;

code = code.replace(target, replace);
code = code.replace(target2, replace2);
fs.writeFileSync('src/components/GlobalBgmPlayer.tsx', code);
