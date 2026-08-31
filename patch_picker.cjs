const fs = require('fs');
const path = './src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `                    {activeColorPicker.startsWith('tab-') ? (
                      <ColorPickerPopup 
                        color={tabSettings[activeColorPicker.replace('tab-', '')]?.color || '#ffd400'} 
                        extractedColors={Array.from(new Set([...extractedColors, ...Object.values(charSettings).map((c: any) => c.color), ...Object.values(tabSettings).filter((t: any) => t.color).map((t: any) => t.color)]))}
                        triggerRect={colorPickerRect}
                        onClose={() => {
                          setActiveColorPicker(null);
                          setColorPickerRect(null);
                        }}
                        onChange={(newColor) => {
                          const tabId = activeColorPicker.replace('tab-', '');
                          const next = { ...tabSettings, [tabId]: { ...tabSettings[tabId], color: newColor } };
                          setTabSettings(next);
                        }}
                        onChangeComplete={(newColor) => {
                          const tabId = activeColorPicker.replace('tab-', '');
                          const next = { ...tabSettings, [tabId]: { ...tabSettings[tabId], color: newColor } };
                          saveToHistory({ charSettings, tabSettings: next, cssFormat, fontSize, fontFamily, theme, disableOtherColor });
                        }}
                      />
                    ) : (`;

const newCode = `                    {activeColorPicker.startsWith('tab-text-') ? (
                      <ColorPickerPopup 
                        color={tabSettings[activeColorPicker.replace('tab-text-', '')]?.textColor || '#ffffff'} 
                        extractedColors={Array.from(new Set([...extractedColors, ...Object.values(charSettings).map((c: any) => c.color), ...Object.values(tabSettings).filter((t: any) => t.color).map((t: any) => t.color)]))}
                        triggerRect={colorPickerRect}
                        onClose={() => {
                          setActiveColorPicker(null);
                          setColorPickerRect(null);
                        }}
                        onChange={(newColor) => {
                          const tabId = activeColorPicker.replace('tab-text-', '');
                          const next = { ...tabSettings, [tabId]: { ...tabSettings[tabId], textColor: newColor } };
                          setTabSettings(next);
                        }}
                        onChangeComplete={(newColor) => {
                          const tabId = activeColorPicker.replace('tab-text-', '');
                          const next = { ...tabSettings, [tabId]: { ...tabSettings[tabId], textColor: newColor } };
                          saveToHistory({ charSettings, tabSettings: next, cssFormat, fontSize, fontFamily, theme, disableOtherColor });
                        }}
                      />
                    ) : activeColorPicker.startsWith('tab-') ? (
                      <ColorPickerPopup 
                        color={tabSettings[activeColorPicker.replace('tab-', '')]?.color || '#ffd400'} 
                        extractedColors={Array.from(new Set([...extractedColors, ...Object.values(charSettings).map((c: any) => c.color), ...Object.values(tabSettings).filter((t: any) => t.color).map((t: any) => t.color)]))}
                        triggerRect={colorPickerRect}
                        onClose={() => {
                          setActiveColorPicker(null);
                          setColorPickerRect(null);
                        }}
                        onChange={(newColor) => {
                          const tabId = activeColorPicker.replace('tab-', '');
                          const next = { ...tabSettings, [tabId]: { ...tabSettings[tabId], color: newColor } };
                          setTabSettings(next);
                        }}
                        onChangeComplete={(newColor) => {
                          const tabId = activeColorPicker.replace('tab-', '');
                          const next = { ...tabSettings, [tabId]: { ...tabSettings[tabId], color: newColor } };
                          saveToHistory({ charSettings, tabSettings: next, cssFormat, fontSize, fontFamily, theme, disableOtherColor });
                        }}
                      />
                    ) : (`;

if (content.includes(target)) {
  content = content.replace(target, newCode);
  fs.writeFileSync(path, content);
  console.log('Fixed picker');
} else {
  console.log('Target not found in picker');
}
