const fs = require('fs');
let code = fs.readFileSync('src/components/LogItem.tsx', 'utf-8');
code = code.replace(/disabled=\{isHoveringButton \|\| isAnyEditing\}/g, 'disabled={isAnyEditing}');
fs.writeFileSync('src/components/LogItem.tsx', code);
