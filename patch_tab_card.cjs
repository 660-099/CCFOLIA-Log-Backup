const fs = require('fs');
const path = './src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `                            ) : (
                              <div className="flex items-center gap-1 flex-1 overflow-hidden">
                                <span className="text-[11px] font-bold truncate text-white/80">
                                  {tab.name}
                                </span>
                                <button 
                                  onClick={() => { setRenamingTab(tab.id); setNewTabNameInput(tab.name); }}
                                  className="p-1 text-white/20 hover:text-[#e6005c] transition-colors"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>`;

const newCode = `                            ) : (
                              <div className="flex items-center gap-1 flex-1 overflow-hidden">
                                <span className="text-[11px] font-bold truncate text-white/80">
                                  {tab.name}
                                </span>
                                <button 
                                  onClick={() => { setRenamingTab(tab.id); setNewTabNameInput(tab.name); }}
                                  className="p-1 text-white/20 hover:text-[#e6005c] transition-colors"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                            <div className="flex items-center bg-black/20 rounded-md border border-white/5 p-0.5 ml-1">
                              <button
                                onClick={(e) => {
                                  if (activeColorPicker === \`tab-text-\${tab.id}\`) {
                                    setActiveColorPicker(null);
                                    setColorPickerRect(null);
                                  } else {
                                    setActiveColorPicker(\`tab-text-\${tab.id}\`);
                                    setColorPickerRect(e.currentTarget.getBoundingClientRect());
                                  }
                                }}
                                className="w-6 h-6 rounded flex items-center justify-center relative hover:bg-white/10 transition-colors"
                                title="텍스트 색상"
                              >
                                <span className="font-bold text-[10px] text-white" style={{ color: tab.textColor || 'white' }}>A</span>
                                <div className="absolute bottom-1 left-1.5 right-1.5 h-[2px] rounded-full" style={{ backgroundColor: tab.textColor || 'transparent' }} />
                              </button>
                              <button
                                onClick={() => {
                                  const next = { ...tabSettings, [tab.id]: { ...tab, isBold: !tab.isBold } };
                                  setTabSettings(next);
                                  saveToHistory({ tabSettings: next });
                                }}
                                className={\`w-6 h-6 rounded flex items-center justify-center font-serif font-bold text-[10px] transition-colors \${tab.isBold ? "bg-white/20 text-white" : "text-white/40 hover:bg-white/10 hover:text-white"}\`}
                                title="굵게"
                              >
                                B
                              </button>
                              <button
                                onClick={() => {
                                  const next = { ...tabSettings, [tab.id]: { ...tab, isItalic: !tab.isItalic } };
                                  setTabSettings(next);
                                  saveToHistory({ tabSettings: next });
                                }}
                                className={\`w-6 h-6 rounded flex items-center justify-center font-serif italic text-[11px] transition-colors \${tab.isItalic ? "bg-white/20 text-white" : "text-white/40 hover:bg-white/10 hover:text-white"}\`}
                                title="이탤릭"
                              >
                                I
                              </button>
                            </div>
                          </div>`;

if (content.includes(target)) {
  content = content.replace(target, newCode);
  fs.writeFileSync(path, content);
  console.log('Fixed tab card');
} else {
  console.log('Target not found in tab card');
}
