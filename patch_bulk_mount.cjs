const fs = require('fs');
let code = fs.readFileSync('src/components/BulkImageAllocatorModal.tsx', 'utf-8');

// Load illustrations and charSettings correctly into allocations and illustrations states when modal opens
// But wait, it's easier to just do this when `isOpen` becomes true or just rely on the existing values.
// Actually, since we unmount the component using `if (!isOpen) return null`, all states reset!
// To fix "나갔다가 다시 들어갔을 경우, 선택되어있는 이미지들이 상단으로 오게끔 정렬을 바뀌게 해줘", 
// we should NOT return null. We should keep it mounted and just use CSS display:none.
// Or, if we DO return null, we can pass `bulkImages` and `bulkAllocations` as props.
// BUT right now it fetches itself. Let's make it keep state by NOT unmounting.

code = code.replace("if (!isOpen) return null;", "");
code = code.replace(
  "<AnimatePresence>",
  "<AnimatePresence>{isOpen && ("
);
code = code.replace(
  "</AnimatePresence>,",
  ")}</AnimatePresence>,"
);

// We want to sort loadedImages when the gallery renders based on assignments
const galleryGridRegex = /\{loadedImages\.map\(\(img, idx\) => \{[\s\S]*?\}\)/;
const sortedGalleryStr = `{loadedImages
                      .slice()
                      .sort((a, b) => {
                        const ownerA = urlToCharId[a.url] ? 1 : 0;
                        const ownerB = urlToCharId[b.url] ? 1 : 0;
                        return ownerB - ownerA; // 1 (assigned) comes before 0 (unassigned)
                      })
                      .map((img, idx) => {`;
code = code.replace("{loadedImages.map((img, idx) => {", sortedGalleryStr);

fs.writeFileSync('src/components/BulkImageAllocatorModal.tsx', code);
