const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf-8');

code = code.replace(
  '  onClose: () => void;\n}',
  '  onClose: () => void;\n  onReset?: () => void;\n}'
);

fs.writeFileSync('src/types.ts', code);
