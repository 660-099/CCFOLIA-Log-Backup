const fs = require('fs');
let code = fs.readFileSync('src/components/BulkImageAllocatorModal.tsx', 'utf-8');

code = code.replace(
  /className="px-2 py-0\.5 rounded-full text-\[9px\] font-bold border transition-colors shadow-sm bg-black\/80 border-white\/20 text-white\/90 hover:bg-white hover:text-black whitespace-nowrap"\s*>\s*대표 지정/g,
  `className="px-2 py-0.5 rounded-full text-[9px] font-bold border transition-colors shadow-sm bg-black/60 border-white/20 text-white/50 hover:bg-white/20 hover:text-white whitespace-nowrap"
                                  >
                                    대표`
);

fs.writeFileSync('src/components/BulkImageAllocatorModal.tsx', code);
