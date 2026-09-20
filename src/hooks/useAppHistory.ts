import { useState, useRef, useEffect, useCallback } from 'react';
import { compare, applyPatch } from 'fast-json-patch';

export function useAppHistory(
  MAX_HISTORY = 300,
  applyState: (state: any) => void,
  getFullState?: () => any
) {
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const currentHistoryStateRef = useRef<any>(null);
  const historyRef = useRef<any[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const getFullStateRef = useRef<(() => any) | undefined>(getFullState);
  getFullStateRef.current = getFullState;

  const saveToHistory = useCallback((incomingState: any) => {
    if (!incomingState || typeof incomingState !== 'object') return;
    const clonedIncoming = JSON.parse(JSON.stringify(incomingState));
    
    if (historyRef.current.length === 0 || !currentHistoryStateRef.current) {
      const baseline = getFullStateRef.current 
        ? JSON.parse(JSON.stringify(getFullStateRef.current())) 
        : clonedIncoming;

      currentHistoryStateRef.current = baseline;
      const initialHistory = [{ type: 'base', state: baseline }];
      historyRef.current = initialHistory;
      historyIndexRef.current = 0;
      setHistory(initialHistory);
      setHistoryIndex(0);

      // 만약 incomingState가 베이스라인과 다른 변경사항(첫 번째 사용자 액션)이라면,
      // 즉시 1번 인덱스 패치로 기록하여 사용자가 방금 수행한 액션을 뒤로가기(Undo)할 수 있도록 함
      const nextFullState = {
        ...baseline,
        ...clonedIncoming
      };
      const forward = compare(baseline, nextFullState);
      const reverse = compare(nextFullState, baseline);
      if (forward.length > 0) {
        currentHistoryStateRef.current = nextFullState;
        const newHistory = [{ type: 'base', state: baseline }, { type: 'patch', forward, reverse }];
        historyRef.current = newHistory;
        historyIndexRef.current = 1;
        setHistory(newHistory);
        setHistoryIndex(1);
      }
      return;
    }

    // 부분 상태가 전달될 경우 기존 전체 상태와 병합하여 다른 설정값(theme, 배경색, 폰트 등)이 증발하지 않도록 보호
    const nextFullState = {
      ...currentHistoryStateRef.current,
      ...clonedIncoming
    };

    const forward = compare(currentHistoryStateRef.current, nextFullState);
    const reverse = compare(nextFullState, currentHistoryStateRef.current);
    
    // 변경사항이 없으면 저장하지 않음
    if (forward.length === 0) return;

    currentHistoryStateRef.current = nextFullState;

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
  }, [MAX_HISTORY]);

  const clearHistory = useCallback((initialState?: any) => {
    if (initialState) {
      const cloned = JSON.parse(JSON.stringify(initialState));
      currentHistoryStateRef.current = cloned;
      const initialHistory = [{ type: 'base', state: cloned }];
      historyRef.current = initialHistory;
      historyIndexRef.current = 0;
      setHistory(initialHistory);
      setHistoryIndex(0);
    } else {
      currentHistoryStateRef.current = null;
      historyRef.current = [];
      historyIndexRef.current = -1;
      setHistory([]);
      setHistoryIndex(-1);
    }
  }, []);

  const undo = useCallback(() => {
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
  }, [applyState]);

  const redo = useCallback(() => {
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
  }, [applyState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isEditable = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        (activeEl as HTMLElement).isContentEditable
      );
      if (isEditable) return;

      const isCtrl = e.ctrlKey || e.metaKey;
      if (isCtrl) {
        const key = e.key.toLowerCase();
        if (key === 'z') {
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
        } else if (key === 'y' && !e.shiftKey) {
          e.preventDefault();
          redo();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    history,
    historyIndex,
    saveToHistory,
    clearHistory,
    undo,
    redo
  };
}
