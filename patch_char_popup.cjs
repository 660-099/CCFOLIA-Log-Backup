const fs = require('fs');
let code = fs.readFileSync('src/components/CharImagePanelPopup.tsx', 'utf-8');

code = code.replace(
  '<div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />',
  ''
);

code = code.replace(
  '<span className="text-[11px] font-bold text-white/80 truncate">스탠딩 변경</span>',
  '<span className="text-[11px] font-bold truncate" style={{ color }}>{charName}</span><span className="text-[11px] font-bold text-white/80"> 스탠딩</span>'
);

fs.writeFileSync('src/components/CharImagePanelPopup.tsx', code);
