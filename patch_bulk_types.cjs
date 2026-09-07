const fs = require('fs');
let code = fs.readFileSync('src/components/BulkImageAllocatorModal.tsx', 'utf-8');

code = code.replace(
  "Object.entries(allocations).forEach(([charId, urls]) => {",
  "Object.entries(allocations).forEach(([charId, urls]: [string, string[]]) => {"
);

code = code.replace(
  "for (const [k, urls] of Object.entries(next)) {",
  "for (const [k, urls] of Object.entries(next) as [string, string[]][]) {"
);

code = code.replace(
  "Object.values(next).forEach(urls => urls.forEach(u => assignedUrls.add(u)));",
  "Object.values(next).forEach((urls: any) => urls.forEach((u: string) => assignedUrls.add(u)));"
);

code = code.replace(
  "Object.values(allocations).forEach(arr => count += arr.length);",
  "Object.values(allocations).forEach((arr: any) => count += arr.length);"
);

code = code.replace(
  "Object.values(charSettings).map(char => {",
  "Object.values(charSettings).map((char: CharSetting) => {"
);

fs.writeFileSync('src/components/BulkImageAllocatorModal.tsx', code);
