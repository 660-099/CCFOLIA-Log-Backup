const fs = require('fs');
let code = fs.readFileSync('src/components/BulkImageAllocatorModal.tsx', 'utf-8');

code = code.replace(
  "Object.values(allocations).reduce((acc, arr: string[]) => acc + arr.length, 0)",
  "Object.values(allocations).reduce((acc: number, arr: string[]) => acc + arr.length, 0)"
);

fs.writeFileSync('src/components/BulkImageAllocatorModal.tsx', code);
