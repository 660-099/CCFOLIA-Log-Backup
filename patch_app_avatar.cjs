const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf-8');

app = app.replace(
  "import { CharImagePanelPopup } from './components/CharImagePanelPopup';",
  "import { CharImagePanelPopup } from './components/CharImagePanelPopup';\nimport { AvatarImagePopup } from './components/AvatarImagePopup';"
);

const stateStr = `  const [panelHoverTimeout, setPanelHoverTimeout] = useState<NodeJS.Timeout | null>(null);`;
const newStateStr = `  const [avatarPopupInfo, setAvatarPopupInfo] = useState<{ logId: string; charId: string; triggerRect: DOMRect; logIndex: number } | null>(null);`;
app = app.replace(
  "  const panelHoverTimeout = useRef<NodeJS.Timeout | null>(null);",
  "  const panelHoverTimeout = useRef<NodeJS.Timeout | null>(null);\n" + newStateStr
);

const batchOverrideFunc = `  const onBatchUpdateLog = useCallback((id: string, updates: any) => {
    setLogs(prev => {
      const next = prev.map(log => log.id === id ? { ...log, ...updates } : log);
      saveToHistory({ logs: next });
      return next;
    });
  }, [saveToHistory]);`;

const newBatchOverrideFunc = `  const onBatchUpdateLog = useCallback((id: string, updates: any) => {
    setLogs(prev => {
      const next = prev.map(log => log.id === id ? { ...log, ...updates } : log);
      saveToHistory({ logs: next });
      return next;
    });
  }, [saveToHistory]);

  const onAvatarClick = useCallback((logId: string, charId: string, rect: DOMRect, logIndex: number) => {
    setAvatarPopupInfo({ logId, charId, triggerRect: rect, logIndex });
  }, []);

  const handleOverrideImage = useCallback((logId: string, imageId: string) => {
    setLogs(prev => {
      const next = prev.map(log => log.id === logId ? { ...log, overrideImageId: imageId } : log);
      saveToHistory({ logs: next });
      return next;
    });
    setAvatarPopupInfo(null);
  }, [saveToHistory]);

  const handleBatchOverrideImage = useCallback((charId: string, imageId: string, startNum: number, endNum: number) => {
    setLogs(prev => {
      let changed = false;
      const next = prev.map((log, index) => {
        // original index is index + 1 for user (1-based)
        const currentNum = index + 1;
        if (currentNum >= startNum && currentNum <= endNum && log.charId === charId && !log.isCommand && !log.isBgmBlock) {
          if (log.overrideImageId !== imageId) {
            changed = true;
            return { ...log, overrideImageId: imageId };
          }
        }
        return log;
      });
      if (changed) {
        saveToHistory({ logs: next });
      }
      return next;
    });
    setAvatarPopupInfo(null);
  }, [saveToHistory]);`;

app = app.replace(batchOverrideFunc, newBatchOverrideFunc);

const logItemPropsOld = `                              onNextContinuation={idx < mergedLogs.length - 1 && mergedLogs[idx + 1].isContinuation}`;
const logItemPropsNew = `                              isNextContinuation={idx < mergedLogs.length - 1 && mergedLogs[idx + 1].isContinuation}
                              onAvatarClick={onAvatarClick}`;
app = app.replace(
  "                              isNextContinuation={idx < mergedLogs.length - 1 && mergedLogs[idx + 1].isContinuation}",
  logItemPropsNew
);

const avatarPopupRender = `      {/* Avatar Image Popup */}
      {avatarPopupInfo && (() => {
        const char = charSettings[avatarPopupInfo.charId];
        if (!char || !char.images || char.images.length === 0) return null;
        
        return (
          <AvatarImagePopup
            charId={char.id}
            charName={char.name}
            color={char.color || '#ffffff'}
            images={char.images}
            triggerRect={avatarPopupInfo.triggerRect}
            onClose={() => setAvatarPopupInfo(null)}
            onSelectSingle={(imageId) => handleOverrideImage(avatarPopupInfo.logId, imageId)}
            onSelectBatch={(imageId, start, end) => handleBatchOverrideImage(avatarPopupInfo.charId, imageId, start, end)}
            defaultStartIdx={avatarPopupInfo.logIndex + 1}
            defaultEndIdx={logs.length}
          />
        );
      })()}`;

const marker = `{activeColorPicker?.endsWith('_panel') || pinnedCharPanel) && panelTriggerRect`;
app = app.replace(
  `      {/* Character Image Panel Popup */}`,
  avatarPopupRender + `\n\n      {/* Character Image Panel Popup */}`
);

fs.writeFileSync('src/App.tsx', app);
