export const splitNarration = (text: string): string[] => {
  if (!text) return [];

  // Replace <br> and <br/> with \n for unified processing
  const normalizedText = text.replace(/<br\s*\/?>/gi, '\n');
  
  const blocks: string[] = [];
  let currentBlock = '';
  
  const bracketPairs: Record<string, string> = {
    '"': '"',
    "'": "'",
    '「': '」',
    '『': '』',
    '(': ')',
    '（': '）',
    '[': ']',
    '{': '}',
    '<': '>'
  };
  
  const closingBrackets = ['"', "'", '」', '』', ')', '）', ']', '}', '>'];
  
  const isPunctuation = (c: string) => ['.', '?', '!', '~'].includes(c);
  const isDigit = (c: string) => /[0-9]/.test(c);
  const isSpace = (c: string) => /\s/.test(c);

  // Parse quote opening/closing heuristic
  const parseQuoteType = (txt: string, index: number): 'open' | 'close' => {
    if (index === 0) return 'open';
    const prev = txt[index - 1];
    if (isSpace(prev) || Object.keys(bracketPairs).includes(prev)) {
      return 'open';
    }
    return 'close';
  };

  interface MatchedPair {
    start: number;
    end: number;
    openChar: string;
    closeChar: string;
    hasPunctuation: boolean;
  }

  const getMatchedPairs = (txt: string): MatchedPair[] => {
    const allPairs: MatchedPair[] = [];
    const stacks: Record<string, number[]> = {};
    for (const openChar of Object.keys(bracketPairs)) {
      stacks[openChar] = [];
    }

    const endsWithPunctuation = (str: string, startIdx: number, endIdx: number): boolean => {
      let k = endIdx - 1;
      while (k > startIdx && (isSpace(str[k]) || closingBrackets.includes(str[k]))) {
        k--;
      }
      return k > startIdx && isPunctuation(str[k]);
    };

    for (let idx = 0; idx < txt.length; idx++) {
      const char = txt[idx];
      if (char === '"' || char === "'") {
        const type = parseQuoteType(txt, idx);
        if (type === 'close') {
          const stack = stacks[char];
          if (stack.length > 0) {
            const startIdx = stack.pop()!;
            allPairs.push({
              start: startIdx,
              end: idx,
              openChar: char,
              closeChar: char,
              hasPunctuation: endsWithPunctuation(txt, startIdx, idx)
            });
          } else {
            stacks[char].push(idx);
          }
        } else {
          stacks[char].push(idx);
        }
      } else if (Object.keys(bracketPairs).includes(char)) {
        stacks[char].push(idx);
      } else {
        const openChar = Object.keys(bracketPairs).find(k => bracketPairs[k] === char);
        if (openChar && openChar !== char && stacks[openChar].length > 0) {
          const startIdx = stacks[openChar].pop()!;
          allPairs.push({
            start: startIdx,
            end: idx,
            openChar,
            closeChar: char,
            hasPunctuation: endsWithPunctuation(txt, startIdx, idx)
          });
        }
      }
    }

    return allPairs;
  };

  const matchedPairs = getMatchedPairs(normalizedText);

  // Returns the innermost pair that contains idx
  const getPairAt = (idx: number): MatchedPair | null => {
    const containing = matchedPairs.filter(p => idx >= p.start && idx <= p.end);
    if (containing.length === 0) return null;
    containing.sort((a, b) => (a.end - a.start) - (b.end - b.start));
    return containing[0];
  };

  for (let i = 0; i < normalizedText.length; i++) {
    const char = normalizedText[i];
    
    // Explicit newlines -> guaranteed split
    if (char === '\n') {
      if (currentBlock.trim().length > 0) {
        blocks.push(currentBlock.trim());
      }
      currentBlock = '';
      continue;
    }

    const pair = getPairAt(i);

    // If starting a sentence-level quote pair (with punctuation), split before if there's preceding content
    if (pair && i === pair.start && pair.hasPunctuation && (pair.openChar === "'" || pair.openChar === '"' || pair.openChar === '「' || pair.openChar === '『')) {
      if (currentBlock.trim().length > 0) {
        blocks.push(currentBlock.trim());
        currentBlock = '';
      }
    }

    currentBlock += char;

    let canSplit = false;
    let punctuationIndex = -1;

    if (pair) {
      // Inside a pair:
      // ONLY split at the exact END of the pair, AND ONLY IF hasPunctuation is true!
      // If the quote does NOT end with sentence-ending punctuation (e.g. '이런건', '쿼테이션'), it MUST NOT split!
      if (i === pair.end && pair.hasPunctuation) {
        canSplit = true;
        punctuationIndex = i - 1;
      }
    } else {
      // OUTSIDE any pair:
      if (isPunctuation(char)) {
        if (i + 1 < normalizedText.length && isPunctuation(normalizedText[i + 1])) {
          // Wait until last punctuation mark in sequence (e.g. "...", "?!")
        } else {
          canSplit = true;
          punctuationIndex = i;
        }
      } else if (['」', '』', ')', '）', ']', '}', '>'].includes(char)) {
        let k = i - 1;
        while (k >= 0 && (isSpace(normalizedText[k]) || ['」', '』', ')', '）', ']', '}', '>'].includes(normalizedText[k]))) {
          k--;
        }
        if (k >= 0 && isPunctuation(normalizedText[k])) {
          canSplit = true;
          punctuationIndex = k;
        }
      }
    }

    if (canSplit) {
      let j = i + 1;
      let spaceCount = 0;
      
      while (j < normalizedText.length && isSpace(normalizedText[j])) {
        spaceCount++;
        j++;
      }
      
      if (j < normalizedText.length) {
        const prevChar = punctuationIndex > 0 ? normalizedText[punctuationIndex - 1] : '';
        const nextChar = normalizedText[j];
        
        // Skip splitting if it looks like a decimal number (e.g. 1.5)
        if (isDigit(prevChar) && isDigit(nextChar)) {
          continue;
        }

        // For quote pairs, NEVER split if spaceCount === 0 and the next character is part of a word/particle (e.g. '문장.'이라고)
        if (spaceCount === 0 && pair && (pair.openChar === "'" || pair.openChar === '"' || pair.openChar === '「' || pair.openChar === '『')) {
          continue;
        }

        // We split if:
        // 1. There is at least one space after sentence/quote
        // 2. OR the next char is an opening bracket or quotation
        if (spaceCount > 0 || Object.keys(bracketPairs).includes(nextChar)) {
          blocks.push(currentBlock.trim());
          currentBlock = '';
          i = j - 1; 
        }
      }
    }
  }
  
  if (currentBlock.trim().length > 0) {
    blocks.push(currentBlock.trim());
  }
  
  return blocks;
};
