const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const applyFuncStr = `  const applyBulkAllocations = (allocations: Record<string, string[]>, reps: Record<string, string>, newIllustrations: string[]) => {
    const nextChars = { ...charSettings };
    
    Object.entries(allocations).forEach(([charId, urls]) => {
      if (!nextChars[charId] && charId !== 'ILLUSTRATIONS') return;
      
      if (charId === 'ILLUSTRATIONS') return;

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
    if (newIllustrations && newIllustrations.length > 0) {
      newIllustrations.forEach(url => {
        nextLogs.push({
          id: 'ill_' + Math.random().toString(36).substring(2, 9),
          type: 'illustration',
          text: '',
          charId: '',
          imgUrl: url,
          tabId: tabOrder[0] || ''
        });
      });
    }

    setCharSettings(nextChars);
    if (newIllustrations && newIllustrations.length > 0) {
      setLogs(nextLogs);
      saveToHistory({ charSettings: nextChars, logs: nextLogs });
    } else {
      saveToHistory({ charSettings: nextChars });
    }
    
    setIsBulkAllocatorOpen(false);
  };`;

const oldApplyRegex = /const applyBulkAllocations = \([\s\S]*?setIsBulkAllocatorOpen\(false\);\n  };/m;
code = code.replace(oldApplyRegex, applyFuncStr);

fs.writeFileSync('src/App.tsx', code);
