const fs = require('fs');
let code = fs.readFileSync('src/components/AvatarImagePopup.tsx', 'utf-8');

code = code.replace(
  `                onClick={() => {
                  if (selectedImgId === img.id) {
                    onSelectSingle(img.id);
                  } else {
                    setSelectedImgId(img.id);
                  }
                }}`,
  `                onClick={(e) => {
                  e.stopPropagation();
                  if (selectedImgId === img.id) {
                    onSelectSingle(img.id);
                  } else {
                    setSelectedImgId(img.id);
                    selectedImgIdRef.current = img.id;
                  }
                }}`
);

code = code.replace(
  `  const estHeight = 350;
  if (top + estHeight > window.innerHeight) {
    top = window.innerHeight - estHeight - 12;
  }`,
  `  const estHeight = 350;
  if (top + estHeight > window.innerHeight) {
    top = window.innerHeight - estHeight - 12;
  }`
);
// I can just adjust it to use bottom bounds if in lower half
const posLogic = `  let left = triggerRect.right + 12;
  let top = triggerRect.top;
  
  if (left + PANEL_WIDTH > window.innerWidth) {
    left = triggerRect.left - PANEL_WIDTH - 12;
  }
  if (left < 10) left = 10;
  
  const estHeight = 450; // max height is 450
  if (top + estHeight > window.innerHeight) {
    top = window.innerHeight - estHeight - 12;
  }
  if (top < 10) top = 10;`;
const oldPosLogic = /let left = triggerRect\.right \+ 12;[\s\S]*?if \(top < 10\) top = 10;/;
code = code.replace(oldPosLogic, posLogic);

fs.writeFileSync('src/components/AvatarImagePopup.tsx', code);
