const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf-8');

const funcs = `
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
  }, [saveToHistory]);

  const onBatchUpdateLog = useCallback((id: string, updates: { content?: string; charId?: string; tabId?: string; bgmData?: any }) => {`;

app = app.replace("  const onBatchUpdateLog = useCallback((id: string, updates: { content?: string; charId?: string; tabId?: string; bgmData?: any }) => {", funcs);

fs.writeFileSync('src/App.tsx', app);
