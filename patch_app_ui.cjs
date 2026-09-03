const fs = require('fs');
const path = './src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `                            <div className="flex items-center bg-black/20 rounded-md border border-white/5 p-0.5 ml-1">
                              <button
                                onClick={(e) => {`;
const newCode = `                            <div className="flex items-center bg-black/20 rounded-md border border-white/5 p-0.5 ml-1">
                              <button
                                onClick={() => {
                                  const next = { ...tabSettings, [tab.id]: { ...tab, applyColorToName: !tab.applyColorToName } };
                                  setTabSettings(next);
                                  saveToHistory({ tabSettings: next });
                                }}
                                className={\`w-6 h-6 rounded flex items-center justify-center transition-colors \${tab.applyColorToName ? "bg-white/20 text-white" : "text-white/40 hover:bg-white/10 hover:text-white"}\`}
                                title="이름에 색상 적용"
                              >
                                <User className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {`;

if (content.includes(target)) {
  content = content.replace(target, newCode);
  fs.writeFileSync(path, content);
  console.log('App UI patched');
} else {
  console.log('Target not found in App.tsx');
}
