const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf-8');

app = app.replace(
  "import { extractOldFormat",
  "import { compare, applyPatch } from 'fast-json-patch';\nimport { extractOldFormat"
);

const historyStateStr = `  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const currentHistoryStateRef = useRef<any>(null);
  const historyRef = useRef<any[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const MAX_HISTORY = 300;`;

app = app.replace(
  "  const [history, setHistory] = useState<any[]>([]);\n  const [historyIndex, setHistoryIndex] = useState(-1);",
  historyStateStr
);

const saveToHistoryStart = app.indexOf('  const saveToHistory = (state: any) => {');
const redoEnd = app.indexOf('  useEffect(() => {\n    const handleKeyDown = (e: KeyboardEvent) => {');

if (saveToHistoryStart > -1 && redoEnd > -1) {
  const newFunctions = `  const saveToHistory = (state: any) => {
    const fullState = {
      charSettings,
      tabSettings,
      tabOrder,
      cssFormat,
      fontSize,
      textFontSize,
      lineHeight,
      letterSpacing,
      blockSpacing,
      avatarSizeValue,
      contentPadding,
      fontFamily,
      theme,
      darkBgColor,
      lightBgColor,
      disableOtherColor,
      filterBarMode,
      logs,
      insertedBlocks,
      mergeTabs: Array.from(mergeTabs),
      showTabNames: Array.from(showTabNames),
      mergeTabStyles: Array.from(mergeTabStyles),
      hideEmptyAvatars,
      cropFaceTop,
      hideAllAvatars,
      narrationCharacter,
      enableSentenceSpacing,
      enableSecretNarration,
      narrationFormat,
      showLogDivider,
      illustrations,
      ...state
    };
    
    // JSON 직렬화를 통해 참조를 끊고 순수 데이터만 추출 (diff를 위함)
    const clonedState = JSON.parse(JSON.stringify(fullState));

    if (historyRef.current.length === 0 || !currentHistoryStateRef.current) {
      currentHistoryStateRef.current = clonedState;
      const initialHistory = [{ type: 'base', state: clonedState }];
      historyRef.current = initialHistory;
      historyIndexRef.current = 0;
      setHistory(initialHistory);
      setHistoryIndex(0);
      return;
    }

    const forward = compare(currentHistoryStateRef.current, clonedState);
    const reverse = compare(clonedState, currentHistoryStateRef.current);

    // 변경사항이 없으면 저장하지 않음
    if (forward.length === 0) return;

    currentHistoryStateRef.current = clonedState;

    let newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    newHistory.push({ type: 'patch', forward, reverse });
    
    if (newHistory.length > MAX_HISTORY) {
      // 0번(base)에 1번(patch)를 병합하여 base를 업데이트하고 1번은 제거
      const baseStep = newHistory[0];
      const patchStep = newHistory[1];
      const newBaseState = JSON.parse(JSON.stringify(baseStep.state));
      applyPatch(newBaseState, patchStep.forward);
      
      newHistory[0] = { type: 'base', state: newBaseState };
      newHistory.splice(1, 1);
    }
    
    historyRef.current = newHistory;
    historyIndexRef.current = newHistory.length - 1;
    
    setHistory([...newHistory]);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    const currentIndex = historyIndexRef.current;
    if (currentIndex > 0) {
      const step = historyRef.current[currentIndex];
      if (step.type === 'patch') {
        const prevState = JSON.parse(JSON.stringify(currentHistoryStateRef.current));
        applyPatch(prevState, step.reverse);
        currentHistoryStateRef.current = prevState;
        applyState(prevState);
      }
      historyIndexRef.current = currentIndex - 1;
      setHistoryIndex(currentIndex - 1);
    }
  };

  const redo = () => {
    const currentIndex = historyIndexRef.current;
    if (currentIndex < historyRef.current.length - 1) {
      const nextIdx = currentIndex + 1;
      const step = historyRef.current[nextIdx];
      if (step.type === 'patch') {
        const nextState = JSON.parse(JSON.stringify(currentHistoryStateRef.current));
        applyPatch(nextState, step.forward);
        currentHistoryStateRef.current = nextState;
        applyState(nextState);
      }
      historyIndexRef.current = nextIdx;
      setHistoryIndex(nextIdx);
    }
  };

`;
  app = app.substring(0, saveToHistoryStart) + newFunctions + app.substring(redoEnd);
} else {
  console.error("Could not find start or end markers for replace");
}

fs.writeFileSync('src/App.tsx', app);
