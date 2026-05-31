export const splitNarration = (text: string): string[] => {
  if (!text) return [];

  // Replace <br> and <br/> with \n for unified processing
  const normalizedText = text.replace(/<br\s*\/?>/gi, '\n');
  
  const blocks: string[] = [];
  let currentBlock = '';
  
  const openBrackets: string[] = [];
  
  const bracketPairs: Record<string, string> = {
    '"': '"',
    "'": "'",
    '「': '」',
    '『': '』',
    '(': ')',
    '<': '>'
  };
  
  const closingBrackets = Object.values(bracketPairs);
  
  const isPunctuation = (c: string) => ['.', '?', '!', '~'].includes(c);
  const isDigit = (c: string) => /[0-9]/.test(c);
  const isSpace = (c: string) => /\s/.test(c);

  // Heuristic to decide if a quote acts as opening or closing
  const parseQuoteType = (index: number): 'open' | 'close' => {
    if (index === 0) return 'open';
    const prev = normalizedText[index - 1];
    if (isSpace(prev) || Object.keys(bracketPairs).includes(prev)) {
      return 'open';
    }
    return 'close';
  };
  
  for (let i = 0; i < normalizedText.length; i++) {
    const char = normalizedText[i];
    
    // Check explicit newlines -> guaranteed split
    if (char === '\n') {
      if (currentBlock.trim().length > 0) {
        blocks.push(currentBlock.trim());
      }
      currentBlock = '';
      continue;
    }
    
    // Manage brackets/quotes tracking
    if (Object.keys(bracketPairs).includes(char)) {
      // If it's a quote like " or ', it can be both open and close.
      if (char === '"' || char === "'") {
        const type = parseQuoteType(i);
        if (type === 'close') {
          if (openBrackets[openBrackets.length - 1] === char) {
            openBrackets.pop();
          }
        } else {
          openBrackets.push(char);
        }
      } else {
        openBrackets.push(char);
      }
    } else if (openBrackets.length > 0 && bracketPairs[openBrackets[openBrackets.length - 1]] === char) {
      openBrackets.pop();
    }
    
    currentBlock += char;
    
    // Try to split on punctuation or closed brackets followed by space if we are not inside any brackets
    if (openBrackets.length === 0) {
      let canSplit = false;
      let punctuationIndex = -1;

      if (isPunctuation(char)) {
        // Check if the next char is also a punctuation (e.g. "...", "?!", "~~")
        if (i + 1 < normalizedText.length && isPunctuation(normalizedText[i + 1])) {
          // Do not split yet, wait until the last punctuation or its closing bracket
        } else {
          canSplit = true;
          punctuationIndex = i;
        }
      } else if (closingBrackets.includes(char)) {
        // We are at a closing quote/bracket, and openBrackets has just been fully closed (length 0).
        // Let's look back to see if sentence-ending punctuation occurred before this closing bracket or series of closing brackets/spaces.
        let k = i - 1;
        while (k >= 0 && (closingBrackets.includes(normalizedText[k]) || isSpace(normalizedText[k]))) {
          k--;
        }
        if (k >= 0 && isPunctuation(normalizedText[k])) {
          canSplit = true;
          punctuationIndex = k;
        }
      }

      if (canSplit) {
        // Look ahead to check the split condition: 1+ spaces followed by any char/digit (non-space)
        let j = i + 1;
        let spaceCount = 0;
        
        while (j < normalizedText.length && isSpace(normalizedText[j])) {
          spaceCount++;
          j++;
        }
        
        // If there are spaces, and the next thing is a character/digit (i.e. not end of string)
        if (spaceCount > 0 && j < normalizedText.length) {
          // Condition: don't split if sandwiched between digits (like 1.5)
          const prevChar = punctuationIndex > 0 ? normalizedText[punctuationIndex - 1] : '';
          const nextChar = normalizedText[j];
          
          if (isDigit(prevChar) && isDigit(nextChar)) {
            // Sandwich between digits -> do not split
          } else {
            // It's a valid split point!
            blocks.push(currentBlock.trim());
            currentBlock = '';
            
            // skip the spaces we already evaluated
            i = j - 1; 
          }
        }
      }
    }
  }
  
  if (currentBlock.trim().length > 0) {
    blocks.push(currentBlock.trim());
  }
  
  return blocks;
};
