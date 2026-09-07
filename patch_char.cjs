const fs = require('fs');
let code = fs.readFileSync('src/components/CharImagePanelPopup.tsx', 'utf-8');

const posLogic = `  let left = triggerRect.right + 12;
  let top = triggerRect.top;
  
  if (left + PANEL_WIDTH > window.innerWidth) {
    left = triggerRect.left - PANEL_WIDTH - 12;
  }
  
  const estHeight = 400; // max height is 400
  if (top + estHeight > window.innerHeight) {
    top = window.innerHeight - estHeight - 12;
  }
  if (top < 12) top = 12;`;
const oldPosLogic = /let left = triggerRect\.right \+ 12;[\s\S]*?if \(top < 12\) top = 12;/;
code = code.replace(oldPosLogic, posLogic);

code = code.replace(
  `<div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-[11px] font-bold text-white/80">{charName} 스탠딩</span>`,
  `<span className="text-[11px] font-bold truncate" style={{ color }}>{charName}</span>
          <span className="text-[11px] font-bold text-white/80 truncate">스탠딩 변경</span>`
);

fs.writeFileSync('src/components/CharImagePanelPopup.tsx', code);
