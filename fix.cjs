const fs = require('fs');
const path = './src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `                          <div className="flex bg-black/20 border border-white/5 rounded-lg p-1 gap-1">
                            <button
                              onClick={() => { setNarrationFormat('style1'); saveToHistory({ narrationFormat: 'style1' }); }}
                              className={\`flex-1 py-1.5 rounded-md transition-all text-[10px] font-bold text-center whitespace-nowrap \${
                                narrationFormat === 'style1'
                                  ? 'bg-[#e6005c] text-white shadow-sm'
                                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                              }\`}
                            >
                              스타일 1 (이탤릭)
                            </button>
                            <button
                              onClick={() => { setNarrationFormat('style2'); saveToHistory({ narrationFormat: 'style2' }); }}
                              className={\`flex-1 py-1.5 rounded-md transition-all text-[10px] font-bold text-center whitespace-nowrap \${
                                narrationFormat === 'style2'
                                  ? 'bg-[#e6005c] text-white shadow-sm'
                                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                              }\`}
                            >
                              스타일 2 (기본)
                            </button>
                            <button
                              onClick={() => { setNarrationFormat('style3'); saveToHistory({ narrationFormat: 'style3' }); }}
                              className={\`flex-1 py-1.5 rounded-md transition-all text-[10px] font-bold text-center whitespace-nowrap \${
                                narrationFormat === 'style3'
                                  ? 'bg-[#e6005c] text-white shadow-sm'
                                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                              }\`}
                            >
                              스타일 3 (단락)
                            </button>
                          </div>
                                  : 'bg-white/5 border-white/5 text-white/40 hover:border-white/10'
                              }\`}
                            >
                              스타일 3 (단락형)
                            </button>
                          </div>
                        </div>`;

const newCode = `                          <div className="flex bg-black/20 border border-white/5 rounded-lg p-1 gap-1">
                            <button
                              onClick={() => { setNarrationFormat('style1'); saveToHistory({ narrationFormat: 'style1' }); }}
                              className={\`flex-1 py-1.5 rounded-md transition-all text-[10px] font-bold text-center whitespace-nowrap \${
                                narrationFormat === 'style1'
                                  ? 'bg-[#e6005c] text-white shadow-sm'
                                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                              }\`}
                            >
                              스타일 1 (이탤릭)
                            </button>
                            <button
                              onClick={() => { setNarrationFormat('style2'); saveToHistory({ narrationFormat: 'style2' }); }}
                              className={\`flex-1 py-1.5 rounded-md transition-all text-[10px] font-bold text-center whitespace-nowrap \${
                                narrationFormat === 'style2'
                                  ? 'bg-[#e6005c] text-white shadow-sm'
                                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                              }\`}
                            >
                              스타일 2 (기본)
                            </button>
                            <button
                              onClick={() => { setNarrationFormat('style3'); saveToHistory({ narrationFormat: 'style3' }); }}
                              className={\`flex-1 py-1.5 rounded-md transition-all text-[10px] font-bold text-center whitespace-nowrap \${
                                narrationFormat === 'style3'
                                  ? 'bg-[#e6005c] text-white shadow-sm'
                                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                              }\`}
                            >
                              스타일 3 (단락)
                            </button>
                          </div>
                        </div>`;

if (content.includes(target)) {
  content = content.replace(target, newCode);
  fs.writeFileSync(path, content);
  console.log('Fixed exactly');
} else {
  console.log('Target not found');
}
