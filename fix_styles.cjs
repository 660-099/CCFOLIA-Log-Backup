const fs = require('fs');

// 1. Fix LogItem.tsx
let logItem = fs.readFileSync('src/components/LogItem.tsx', 'utf-8');
logItem = logItem.replace("narrationFormat === 'style1' ? 'italic' : 'normal'", "narrationFormat === 'style2' ? 'italic' : 'normal'");
fs.writeFileSync('src/components/LogItem.tsx', logItem);

// 2. Fix htmlGenerator.ts
let htmlGen = fs.readFileSync('src/utils/htmlGenerator.ts', 'utf-8');

htmlGen = htmlGen.replace(
  "if ((hideAllAvatars || narrationFormat === 'style2') && typeof document !== 'undefined') {",
  "if ((hideAllAvatars || narrationFormat === 'style3') && typeof document !== 'undefined') {"
);

htmlGen = htmlGen.replace(
  "if (hideAllAvatars || (isNarration && narrationFormat === 'style2')) {",
  "if (hideAllAvatars || (isNarration && narrationFormat === 'style3')) {"
);

htmlGen = htmlGen.replace(
  "if (isNarration && narrationFormat === 'style2') {\n        html += `<div${fullFilterAttrs} style=\"position:relative;margin-bottom:${itemMarginBottom};margin-top:${itemMarginTop};\">`;",
  "if (isNarration && narrationFormat === 'style3') {\n        html += `<div${fullFilterAttrs} style=\"position:relative;margin-bottom:${itemMarginBottom};margin-top:${itemMarginTop};\">`;"
);

htmlGen = htmlGen.replace(
  "} else if (isNarration && narrationFormat === 'style2') {\n        const flatPieces = finalHtmlContentPieces.flat();",
  "} else if (isNarration && narrationFormat === 'style3') {\n        const flatPieces = finalHtmlContentPieces.flat();"
);

htmlGen = htmlGen.replace(
  "if (isNarration && narrationFormat === 'style2') {\n          const flatPieces = finalHtmlContentPieces.flat();",
  "if (isNarration && narrationFormat === 'style3') {\n          const flatPieces = finalHtmlContentPieces.flat();"
);

fs.writeFileSync('src/utils/htmlGenerator.ts', htmlGen);
