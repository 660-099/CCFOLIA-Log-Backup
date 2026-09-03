const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');
code = code.replace(
  'className="flex items-center gap-1.5 text-[11px] font-medium text-white/40 hover:text-white/80 transition-colors px-1 mb-4"',
  'className="flex items-center gap-1.5 text-[11px] font-medium text-white/40 hover:text-white/80 cursor-pointer px-1 mb-4"'
);
fs.writeFileSync('src/App.tsx', code);
