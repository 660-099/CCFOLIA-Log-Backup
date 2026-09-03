const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const targetStr = `                        onChangeComplete={(newColor) => {
                          const tabId = activeColorPicker.replace('tab-text-', '');
                          const next = { ...tabSettings, [tabId]: { ...tabSettings[tabId], textColor: newColor } };
                          saveToHistory({ charSettings, tabSettings: next, cssFormat, fontSize, fontFamily, theme, disableOtherColor });
                        }}
                      />`;

const replaceStr = `                        onChangeComplete={(newColor) => {
                          const tabId = activeColorPicker.replace('tab-text-', '');
                          const next = { ...tabSettings, [tabId]: { ...tabSettings[tabId], textColor: newColor } };
                          saveToHistory({ charSettings, tabSettings: next, cssFormat, fontSize, fontFamily, theme, disableOtherColor });
                        }}
                        onReset={() => {
                          const tabId = activeColorPicker.replace('tab-text-', '');
                          const next = { ...tabSettings, [tabId]: { ...tabSettings[tabId] } };
                          delete next[tabId].textColor;
                          setTabSettings(next);
                          saveToHistory({ charSettings, tabSettings: next, cssFormat, fontSize, fontFamily, theme, disableOtherColor });
                        }}
                      />`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/App.tsx', code);
