const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf-8');

const target = `                    {narrationCharacter && (`;

const insert = `                    <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl shadow-sm h-11 relative">
                      <span className="text-[11px] font-bold text-white/70">스탠딩 숨김</span>
                      <Toggle 
                        enabled={hideAllAvatars} 
                        onChange={(val) => {
                          setHideAllAvatars(val);
                          saveToHistory({ hideAllAvatars: val });
                        }} 
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl shadow-sm h-11 relative">
                      <span className="text-[11px] font-bold text-white/70">얼굴 위주 크롭 (상단 1:1)</span>
                      <Toggle 
                        enabled={cropFaceTop} 
                        onChange={(val) => {
                          setCropFaceTop(val);
                          saveToHistory({ cropFaceTop: val });
                        }} 
                      />
                    </div>
                    {narrationCharacter && (`;

app = app.replace(target, insert);
fs.writeFileSync('src/App.tsx', app);
