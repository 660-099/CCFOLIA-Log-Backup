const fs = require('fs');
const path = './src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `                            <div key={group.fileId || gIdx} className="space-y-2">
                              {/* Horizontal Bar Header for each log */}
                              <div className="flex items-center gap-2 my-2">
                                <div className="h-px bg-white/10 flex-1" />
                                <span className="text-[10px] font-bold text-[#e6005c] bg-[#e6005c]/10 border border-[#e6005c]/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                                  로그: {group.fileName} ({group.items.length}개)
                                </span>
                                <div className="h-px bg-white/10 flex-1" />
                              </div>

                              <div className="space-y-2">`;

const newCode = `                            <div key={group.fileId || gIdx} className="space-y-2">
                              <div className="space-y-2">`;

if (content.includes(target)) {
  content = content.replace(target, newCode);
  fs.writeFileSync(path, content);
  console.log('Removed pink header');
} else {
  console.log('Target not found in App.tsx');
}
