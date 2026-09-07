const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Add states
const stateStr = `  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null);\n  const [pinnedCharPanel, setPinnedCharPanel] = useState<string | null>(null);`;
const newStateStr = `  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null);
  const [pinnedCharPanel, setPinnedCharPanel] = useState<string | null>(null);
  const [panelTriggerRect, setPanelTriggerRect] = useState<DOMRect | null>(null);
  const panelHoverTimeout = useRef<NodeJS.Timeout | null>(null);`;
app = app.replace(stateStr, newStateStr);

// 2. Badge > 1
app = app.replace(
  "backgroundColor: char.images && char.images.length > 0 ? '#e6005c' : '#333'",
  "backgroundColor: char.images && char.images.length > 1 ? '#e6005c' : '#333'"
);
app = app.replace(
  "{char.images && char.images.length > 0 ? (",
  "{char.images && char.images.length > 1 ? ("
);

// 3. Hover logic
const oldHoverLogic = `                            onMouseEnter={(e) => {
                              if (pinnedCharPanel !== char.id) {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setHoverImgRect(rect);
                                setActiveColorPicker(char.id + '_panel');
                              }
                            }}
                            onMouseLeave={() => {
                              if (pinnedCharPanel !== char.id) {
                                setActiveColorPicker(null);
                                setHoverImgRect(null);
                              }
                            }}
                            onClick={(e) => {
                              if (pinnedCharPanel === char.id) {
                                setPinnedCharPanel(null);
                                setActiveColorPicker(null);
                                setHoverImgRect(null);
                              } else {
                                setPinnedCharPanel(char.id);
                                const rect = e.currentTarget.getBoundingClientRect();
                                setHoverImgRect(rect);
                                setActiveColorPicker(char.id + '_panel');
                              }
                            }}`;

const newHoverLogic = `                            onMouseEnter={(e) => {
                              if (panelHoverTimeout.current) clearTimeout(panelHoverTimeout.current);
                              if (pinnedCharPanel !== char.id) {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setPanelTriggerRect(rect);
                                setActiveColorPicker(char.id + '_panel');
                              }
                            }}
                            onMouseLeave={() => {
                              if (pinnedCharPanel !== char.id) {
                                panelHoverTimeout.current = setTimeout(() => {
                                  setActiveColorPicker(null);
                                  setPanelTriggerRect(null);
                                }, 150);
                              }
                            }}
                            onClick={(e) => {
                              if (pinnedCharPanel === char.id) {
                                setPinnedCharPanel(null);
                                // Don't close on click because we are still hovering
                              } else {
                                setPinnedCharPanel(char.id);
                                const rect = e.currentTarget.getBoundingClientRect();
                                setPanelTriggerRect(rect);
                                setActiveColorPicker(char.id + '_panel');
                              }
                            }}`;
app = app.replace(oldHoverLogic, newHoverLogic);

// 4. Update the popup rendering to use panelTriggerRect
const oldPopupRender = `      {/* Character Image Panel Popup */}
      {(activeColorPicker?.endsWith('_panel') || pinnedCharPanel) && hoverImgRect && (() => {
        const charId = pinnedCharPanel || activeColorPicker?.replace('_panel', '');
        const char = charId ? charSettings[charId] : null;
        if (!char) return null;
        
        return (
          <CharImagePanelPopup
            charName={char.name}
            images={char.images || []}
            color={char.color || '#ffffff'}
            triggerRect={hoverImgRect}
            isPinned={pinnedCharPanel === charId}
            onTogglePin={() => {
              if (pinnedCharPanel === charId) {
                setPinnedCharPanel(null);
                setActiveColorPicker(null);
                setHoverImgRect(null);
              } else {
                setPinnedCharPanel(charId);
              }
            }}
            onClose={() => {
              if (pinnedCharPanel !== charId) {
                setActiveColorPicker(null);
                setHoverImgRect(null);
              }
            }}
            onAddImage={(url) => addCharacterImage(charId, url)}
            onRemoveImage={(id) => removeCharacterImage(charId, id)}
            onSetRepresentative={(id) => setRepresentativeImage(charId, id)}
          />
        );
      })()}`;

const newPopupRender = `      {/* Character Image Panel Popup */}
      {(activeColorPicker?.endsWith('_panel') || pinnedCharPanel) && panelTriggerRect && (() => {
        const charId = pinnedCharPanel || activeColorPicker?.replace('_panel', '');
        const char = charId ? charSettings[charId] : null;
        if (!char) return null;
        
        return (
          <CharImagePanelPopup
            charName={char.name}
            images={char.images || []}
            color={char.color || '#ffffff'}
            triggerRect={panelTriggerRect}
            isPinned={pinnedCharPanel === charId}
            onMouseEnter={() => {
              if (panelHoverTimeout.current) clearTimeout(panelHoverTimeout.current);
            }}
            onMouseLeave={() => {
              if (pinnedCharPanel !== charId) {
                panelHoverTimeout.current = setTimeout(() => {
                  setActiveColorPicker(null);
                  setPanelTriggerRect(null);
                }, 150);
              }
            }}
            onThumbnailHover={(url, rect) => {
              setHoverImgUrl(url);
              setHoverImgRect(rect);
              setHoverImgLabel(char.name + ' 스탠딩');
            }}
            onTogglePin={() => {
              if (pinnedCharPanel === charId) {
                setPinnedCharPanel(null);
              } else {
                setPinnedCharPanel(charId);
              }
            }}
            onClose={() => {
              if (pinnedCharPanel !== charId) {
                setActiveColorPicker(null);
                setPanelTriggerRect(null);
              }
            }}
            onAddImage={(url) => addCharacterImage(charId, url)}
            onRemoveImage={(id) => removeCharacterImage(charId, id)}
            onSetRepresentative={(id) => setRepresentativeImage(charId, id)}
          />
        );
      })()}`;

app = app.replace(oldPopupRender, newPopupRender);

fs.writeFileSync('src/App.tsx', app);
