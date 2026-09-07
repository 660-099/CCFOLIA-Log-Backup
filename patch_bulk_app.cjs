const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const applyFuncStr = `  const applyBulkAllocations = (allocations: Record<string, string[]>, reps: Record<string, string>) => {
    const nextChars = { ...charSettings };
    let newIllustrations: string[] = [];
    
    Object.entries(allocations).forEach(([charId, urls]) => {
      if (charId === 'ILLUSTRATIONS') {
        newIllustrations = urls;
        return;
      }
      
      if (!nextChars[charId]) return;

      const char = { ...nextChars[charId] };
      const currentImages = char.images ? [...char.images] : [];
      
      urls.forEach(url => {
        if (!currentImages.some(img => img.url === url)) {
          currentImages.push({
            id: 'img_' + Math.random().toString(36).substring(2, 9),
            url: url,
            name: 'Image ' + (currentImages.length + 1)
          });
        }
      });
      
      if (reps[charId]) {
        currentImages.forEach(img => img.isRepresentative = false);
        const repImg = currentImages.find(img => img.url === reps[charId]);
        if (repImg) repImg.isRepresentative = true;
        char.imageUrl = reps[charId];
      } else if (!char.imageUrl && currentImages.length > 0) {
         currentImages[0].isRepresentative = true;
         char.imageUrl = currentImages[0].url;
      }
      
      char.images = currentImages;
      nextChars[charId] = char;
    });
    
    let nextLogs = [...logs];
    if (newIllustrations.length > 0) {
      newIllustrations.forEach(url => {
        nextLogs.push({
          id: 'ill_' + Math.random().toString(36).substring(2, 9),
          type: 'illustration',
          content: url,
          charId: '',
          name: '',
          color: '',
          isCommand: false,
          isBgmBlock: false,
          isIllustration: true,
          tabId: tabOrder[0] || ''
        });
      });
    }

    setCharSettings(nextChars);
    if (newIllustrations.length > 0) {
      setLogs(nextLogs);
      saveToHistory({ charSettings: nextChars, logs: nextLogs });
    } else {
      saveToHistory({ charSettings: nextChars });
    }
    
    setIsBulkAllocatorOpen(false);
  };`;

// replace applyBulkAllocations completely
const oldApplyRegex = /const applyBulkAllocations = \([\s\S]*?setIsBulkAllocatorOpen\(false\);\n  };/m;
code = code.replace(oldApplyRegex, applyFuncStr);

fs.writeFileSync('src/App.tsx', code);
