const fs = require('fs');

const avatarPath = 'src/components/AvatarImagePopup.tsx';
let avatarCode = fs.readFileSync(avatarPath, 'utf-8');
const avatarOldLogic = /let left = triggerRect\.right \+ 12;[\s\S]*?if \(top < 10\) top = 10;/;
const avatarNewLogic = `let left = triggerRect.right + 12;
  if (left + PANEL_WIDTH > window.innerWidth) {
    left = triggerRect.left - PANEL_WIDTH - 12;
  }
  if (left < 10) left = 10;
  
  const isBottomHalf = triggerRect.top > window.innerHeight / 2;
  const verticalStyle = isBottomHalf 
    ? { bottom: Math.max(12, window.innerHeight - triggerRect.bottom) }
    : { top: Math.max(12, triggerRect.top) };`;

avatarCode = avatarCode.replace(avatarOldLogic, avatarNewLogic);
avatarCode = avatarCode.replace(/style=\{\{\s*left,\s*top,\s*width: PANEL_WIDTH,\s*maxHeight: '450px'\s*\}\}/, 
                                `style={{ left, ...verticalStyle, width: PANEL_WIDTH, maxHeight: '450px' }}`);
fs.writeFileSync(avatarPath, avatarCode);

const charPath = 'src/components/CharImagePanelPopup.tsx';
let charCode = fs.readFileSync(charPath, 'utf-8');
const charOldLogic = /let left = triggerRect\.right \+ 12;[\s\S]*?if \(top < 12\) top = 12;/;
const charNewLogic = `let left = triggerRect.right + 12;
  if (left + PANEL_WIDTH > window.innerWidth) {
    left = triggerRect.left - PANEL_WIDTH - 12;
  }
  if (left < 12) left = 12;
  
  const isBottomHalf = triggerRect.top > window.innerHeight / 2;
  const verticalStyle = isBottomHalf 
    ? { bottom: Math.max(12, window.innerHeight - triggerRect.bottom) }
    : { top: Math.max(12, triggerRect.top) };`;

charCode = charCode.replace(charOldLogic, charNewLogic);
charCode = charCode.replace(/style=\{\{\s*left,\s*top,\s*width: PANEL_WIDTH,\s*maxHeight: '400px'\s*\}\}/, 
                            `style={{ left, ...verticalStyle, width: PANEL_WIDTH, maxHeight: '400px' }}`);
fs.writeFileSync(charPath, charCode);
