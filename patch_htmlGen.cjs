const fs = require('fs');
let code = fs.readFileSync('src/utils/htmlGenerator.ts', 'utf-8');

const target1 = `const widthVal = ill.width ? \`width: \${ill.width}px;\` : 'max-width: 100%;';`;
const replace1 = `let widthVal = 'max-width: 100%;';
        if (ill.width) {
          const wStr = String(ill.width);
          widthVal = wStr.endsWith('px') || wStr.endsWith('%') ? \`width: \${wStr};\` : \`width: \${wStr}px;\`;
        }`;

code = code.replace(target1, replace1);
fs.writeFileSync('src/utils/htmlGenerator.ts', code);
