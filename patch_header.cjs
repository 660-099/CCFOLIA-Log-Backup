const fs = require('fs');
let code = fs.readFileSync('src/components/CharImagePanelPopup.tsx', 'utf-8');

const oldHeader = `<div className="flex items-center justify-between p-3 border-b border-white/5 bg-white/5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold truncate" style={{ color }}>{charName}</span>
          <span className="text-[11px] font-bold text-white/80 truncate">스탠딩 변경</span>
        </div>
        <button
          onClick={onTogglePin}
          className={cn(
            "p-1.5 rounded-md transition-colors",
            isPinned ? "text-[#e6005c] hover:bg-[#e6005c]/10" : "text-white/40 hover:bg-white/10 hover:text-white"
          )}
          title={isPinned ? "고정 해제" : "패널 고정"}
        >
          <Pin className={cn("w-3.5 h-3.5", isPinned && "fill-current")} />
        </button>
      </div>`;

const newHeader = `<div className="flex items-center gap-1.5 p-2.5 border-b border-white/5 bg-white/5">
        <button
          onClick={onTogglePin}
          className={cn(
            "p-1.5 rounded-md transition-colors shrink-0",
            isPinned ? "text-[#e6005c] hover:bg-[#e6005c]/10" : "text-white/40 hover:bg-white/10 hover:text-white"
          )}
          title={isPinned ? "고정 해제" : "패널 고정"}
        >
          <Pin className={cn("w-3.5 h-3.5", isPinned && "fill-current")} />
        </button>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[11px] font-bold truncate" style={{ color }}>{charName}</span>
          <span className="text-[11px] font-bold text-white/80 truncate">스탠딩 변경</span>
        </div>
      </div>`;

if (code.includes(oldHeader)) {
  code = code.replace(oldHeader, newHeader);
  fs.writeFileSync('src/components/CharImagePanelPopup.tsx', code);
  console.log("Successfully replaced header layout.");
} else {
  console.log("Could not find the target header element.");
}
