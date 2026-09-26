import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ArrowLeft, Upload, Trash2, ChevronUp, ChevronDown, 
  Layers, CheckCircle2, AlertCircle, Plus, FileText, 
  Scissors, Clock, Hash, HelpCircle, GripVertical, Check, RefreshCw,
  ArrowRight, ArrowUp, ArrowDown
} from 'lucide-react';
import { LogEntry, CharSetting, TabSetting, MergeSourceFile, MergeClip } from '../types';
import { parseLogFile } from '../parser';

interface LogMergeStudioProps {
  initialSourceFiles: MergeSourceFile[];
  onCancel: () => void;
  onCompleteMerge: (result: {
    logs: LogEntry[];
    charSettings: Record<string, CharSetting>;
    charOrder: string[];
    tabSettings: Record<string, TabSetting>;
    tabOrder: string[];
    mergedFileName: string;
  }) => void;
}

const BADGE_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#14b8a6', // teal
];

export const LogMergeStudio: React.FC<LogMergeStudioProps> = ({
  initialSourceFiles,
  onCancel,
  onCompleteMerge,
}) => {
  const [sourceFiles, setSourceFiles] = useState<MergeSourceFile[]>(() => {
    return initialSourceFiles.map((f, idx) => ({
      ...f,
      badgeColor: f.badgeColor || BADGE_COLORS[idx % BADGE_COLORS.length]
    }));
  });

  // activeView: 'merged' | fileId
  const [selectedFileId, setSelectedFileId] = useState<string>(() => {
    return sourceFiles.length > 0 ? sourceFiles[0].id : 'merged';
  });

  // Selection step for active file: 'idle' | 'picking_start' | 'picking_end' | 'ready'
  const [selectionStep, setSelectionStep] = useState<'idle' | 'picking_start' | 'picking_end' | 'ready'>('idle');

  // Range selection for the current active file
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number }>({ start: 0, end: 0 });

  // List of clips to merge - Starts empty until user adds clips
  const [clips, setClips] = useState<MergeClip[]>([]);

  // Merge options
  const [autoDeduplicate, setAutoDeduplicate] = useState<boolean>(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const viewerScrollRef = useRef<HTMLDivElement>(null);

  // Active file object
  const activeFile = useMemo(() => {
    return sourceFiles.find(f => f.id === selectedFileId);
  }, [sourceFiles, selectedFileId]);

  // When active file changes, reset selection range and step
  useEffect(() => {
    if (activeFile) {
      setSelectionRange({
        start: 0,
        end: Math.max(0, activeFile.logs.length - 1)
      });
      setSelectionStep('idle');
    }
  }, [selectedFileId, activeFile]);

  // Handle uploading additional log files
  const handleAddFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const newSources: MergeSourceFile[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      try {
        const parsed = await parseLogFile(file);
        const fileId = `file_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`;
        const badgeColor = BADGE_COLORS[(sourceFiles.length + newSources.length) % BADGE_COLORS.length];

        const sourceFile: MergeSourceFile = {
          id: fileId,
          name: file.name,
          badgeColor,
          logs: parsed.trimmedLogs,
          charSettings: parsed.newChars,
          charOrder: parsed.newCharOrder,
          tabSettings: parsed.newTabs,
          tabOrder: parsed.newTabOrder,
        };

        newSources.push(sourceFile);
      } catch (err: any) {
        console.error('파일 파싱 실패:', file.name, err);
        alert(`[${file.name}] 파일을 불러오는 중 오류가 발생했습니다: ${err.message || err}`);
      }
    }

    if (newSources.length > 0) {
      setSourceFiles(prev => [...prev, ...newSources]);
      // Clips are not added automatically until user adds them

      if (selectedFileId === 'merged' && newSources.length > 0) {
        setSelectedFileId(newSources[0].id);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove a source file
  const handleRemoveFile = (fileId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSourceFiles(prev => prev.filter(f => f.id !== fileId));
    setClips(prev => prev.filter(c => c.sourceFileId !== fileId));
    if (selectedFileId === fileId) {
      const remaining = sourceFiles.filter(f => f.id !== fileId);
      setSelectedFileId(remaining.length > 0 ? remaining[0].id : 'merged');
    }
  };

  // Move source file up / down
  const moveFileOrder = (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= sourceFiles.length) return;

    setSourceFiles(prev => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[newIdx];
      next[newIdx] = temp;
      return next;
    });
  };

  // Move clip order
  const moveClipOrder = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= clips.length) return;

    setClips(prev => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[newIdx];
      next[newIdx] = temp;
      return next;
    });
  };

  // Remove clip
  const handleRemoveClip = (clipId: string) => {
    setClips(prev => prev.filter(c => c.id !== clipId));
  };

  // Add currently selected range as a clip
  const handleAddCurrentRangeAsClip = () => {
    if (!activeFile) return;
    const s = Math.min(selectionRange.start, selectionRange.end);
    const e = Math.max(selectionRange.start, selectionRange.end);

    const newClip: MergeClip = {
      id: `clip_${activeFile.id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sourceFileId: activeFile.id,
      startIndex: s,
      endIndex: e,
    };

    setClips(prev => [...prev, newClip]);
    setSelectionStep('ready');
  };

  // Select entire active file
  const handleSelectAllInActiveFile = () => {
    if (!activeFile) return;
    setSelectionRange({
      start: 0,
      end: Math.max(0, activeFile.logs.length - 1)
    });
    setSelectionStep('ready');
  };

  // Start selection workflow
  const handleStartSelectionFlow = () => {
    setSelectionStep('picking_start');
  };

  // Handle clicking a log entry in active file viewer
  const handleLogClick = (idx: number) => {
    if (selectionStep === 'picking_start') {
      setSelectionRange({ start: idx, end: idx });
      setSelectionStep('picking_end');
    } else if (selectionStep === 'picking_end') {
      if (idx < selectionRange.start) {
        setSelectionRange({ start: idx, end: selectionRange.start });
      } else {
        setSelectionRange(prev => ({ ...prev, end: idx }));
      }
      setSelectionStep('ready');
    } else {
      if (idx < selectionRange.start) {
        setSelectionRange(prev => ({ ...prev, start: idx }));
      } else {
        setSelectionRange(prev => ({ ...prev, end: idx }));
      }
      setSelectionStep('ready');
    }
  };

  // Scroll to Top / Bottom
  const scrollToTop = () => {
    if (viewerScrollRef.current) {
      viewerScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToBottom = () => {
    if (viewerScrollRef.current) {
      viewerScrollRef.current.scrollTo({
        top: viewerScrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Helper to get preview text snippet (name: content...)
  const getSnippet = (log?: LogEntry) => {
    if (!log) return '(없음)';
    const cleanContent = log.content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    const truncated = cleanContent.length > 30 ? cleanContent.substring(0, 30) + '...' : cleanContent;
    return `${log.name || '알 수 없음'}: ${truncated}`;
  };

  // Normalize text across HTML and JSON formats for reliable comparison
  const normalizeLogText = (raw: string): string => {
    if (!raw) return '';
    return raw
      // Normalize line breaks: <br>, <br/>, <br />, \r\n, \r, \n -> \n
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/\r\n|\r/g, '\n')
      // Normalize common HTML entities
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      // Remove any other lingering HTML tags
      .replace(/<[^>]+>/g, '')
      // Replace non-breaking spaces and zero-width spaces
      .replace(/[\u00A0\u200B\u200C\u200D\uFEFF]/g, ' ')
      // Normalize whitespace within lines
      .replace(/[ \t]+/g, ' ')
      // Trim each line and outer edges
      .split('\n')
      .map(line => line.trim())
      .join('\n')
      .trim();
  };

  // Check if two log entries are identical across HTML and JSON formats
  const isIdenticalLog = (a: LogEntry, b: LogEntry) => {
    // 1. Compare normalized speaker name (ignoring surrounding spaces and case)
    const nameA = (a.name || '').trim().toLowerCase();
    const nameB = (b.name || '').trim().toLowerCase();
    if (nameA !== nameB) return false;

    // 2. Compare normalized tab name (treating empty/undefined as '메인')
    const tabA = (a.tab || '메인').trim().toLowerCase();
    const tabB = (b.tab || '메인').trim().toLowerCase();
    if (tabA !== tabB) return false;

    // 3. Compare normalized content
    const textA = normalizeLogText(a.content);
    const textB = normalizeLogText(b.content);
    return textA === textB;
  };

  // Compute merged logs based on clips & options
  // Intelligent deduplication: Only check and deduplicate overlapping sequence blocks at the boundary between consecutive clips!
  const mergedItems = useMemo(() => {
    const fileMap = new Map<string, MergeSourceFile>();
    sourceFiles.forEach(f => fileMap.set(f.id, f));

    type MergeItem = {
      log: LogEntry;
      sourceFileName: string;
      badgeColor: string;
      sourceFileId: string;
    };

    let resultLogs: MergeItem[] = [];

    for (let cIdx = 0; cIdx < clips.length; cIdx++) {
      const clip = clips[cIdx];
      const source = fileMap.get(clip.sourceFileId);
      if (!source) continue;

      const clipLogs = source.logs.slice(clip.startIndex, clip.endIndex + 1);
      const currentItems: MergeItem[] = clipLogs.map(log => ({
        log,
        sourceFileName: source.name,
        badgeColor: source.badgeColor,
        sourceFileId: source.id,
      }));

      // If autoDeduplicate is enabled and we already have items from previous clip(s),
      // look for overlapping block between resultLogs (tail) and currentItems (head)
      if (autoDeduplicate && resultLogs.length > 0 && currentItems.length > 0) {
        const maxCheck = Math.min(resultLogs.length, currentItems.length, 500);
        let overlapLength = 0;

        for (let len = maxCheck; len >= 1; len--) {
          let match = true;
          for (let i = 0; i < len; i++) {
            const tailItem = resultLogs[resultLogs.length - len + i];
            const headItem = currentItems[i];
            if (!isIdenticalLog(tailItem.log, headItem.log)) {
              match = false;
              break;
            }
          }
          if (match) {
            overlapLength = len;
            break;
          }
        }

        if (overlapLength > 0) {
          resultLogs.push(...currentItems.slice(overlapLength));
        } else {
          resultLogs.push(...currentItems);
        }
      } else {
        resultLogs.push(...currentItems);
      }
    }

    return resultLogs;
  }, [clips, sourceFiles, autoDeduplicate]);

  // Execute complete merge and pass to parent App.tsx
  const handleFinalMerge = () => {
    if (mergedItems.length === 0) {
      alert('병합할 로그가 없습니다. 최소 하나 이상의 구간(클립)을 지정해주세요.');
      return;
    }

    // Merge characters and tabs
    const mergedChars: Record<string, CharSetting> = {};
    const mergedCharOrder: string[] = [];
    const mergedTabs: Record<string, TabSetting> = {};
    const mergedTabOrder: string[] = [];

    // Map to reconcile duplicate characters by (name + color)
    const charIdentityToId = new Map<string, string>();
    // Map to reconcile duplicate tabs by name
    const tabNameToId = new Map<string, string>();

    sourceFiles.forEach(file => {
      // Merge Characters
      const fileChars = file.charSettings || {};
      const fileCharOrder = file.charOrder || Object.keys(fileChars);

      fileCharOrder.forEach(cId => {
        const char = fileChars[cId];
        if (!char) return;

        const identity = `${char.name}_${char.color}`.toLowerCase();
        if (!charIdentityToId.has(identity)) {
          charIdentityToId.set(identity, char.id);
          mergedChars[char.id] = { ...char };
          mergedCharOrder.push(char.id);
        }
      });

      // Merge Tabs
      const fileTabs = file.tabSettings || {};
      const fileTabOrder = file.tabOrder || Object.keys(fileTabs);

      fileTabOrder.forEach(tId => {
        const tab = fileTabs[tId];
        if (!tab) return;

        const nameKey = tab.name.trim().toLowerCase();
        if (!tabNameToId.has(nameKey)) {
          tabNameToId.set(nameKey, tab.id);
          mergedTabs[tab.id] = { ...tab };
          mergedTabOrder.push(tab.id);
        }
      });
    });

    // Re-map logs to new merged charId and tabId
    const finalLogs: LogEntry[] = mergedItems.map((item, idx) => {
      const orig = item.log;
      const charIdentity = `${orig.name}_${orig.color}`.toLowerCase();
      const mappedCharId = charIdentityToId.get(charIdentity) || orig.charId;

      const tabNameKey = (orig.tab || '').trim().toLowerCase();
      const mappedTabId = tabNameToId.get(tabNameKey) || orig.tabId;

      return {
        ...orig,
        id: `merged_log_${idx + 1}`,
        charId: mappedCharId,
        tabId: mappedTabId,
      };
    });

    const firstFileName = sourceFiles[0]?.name.replace(/\.[^/.]+$/, '') || '통합_로그';
    const mergedFileName = sourceFiles.length > 1 ? `${firstFileName}_외${sourceFiles.length - 1}개_통합` : firstFileName;

    onCompleteMerge({
      logs: finalLogs,
      charSettings: mergedChars,
      charOrder: mergedCharOrder,
      tabSettings: mergedTabs,
      tabOrder: mergedTabOrder,
      mergedFileName,
    });
  };

  const isSelectionActive = selectionStep !== 'idle';
  const startIdx = Math.min(selectionRange.start, selectionRange.end);
  const endIdx = Math.max(selectionRange.start, selectionRange.end);

  return (
    <div className="fixed inset-0 z-50 bg-[#121215] text-white flex flex-col font-sans select-none overflow-hidden">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAddFiles}
        accept=".html,.htm,.json,application/json"
        multiple
        className="hidden"
      />

      {/* 1. Header Bar */}
      <header className="h-14 px-5 border-b border-white/10 bg-[#18181b] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-all text-xs font-bold border border-white/5 cursor-pointer"
            title="편집기로 돌아가기"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>편집기로 돌아가기</span>
          </button>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#e6005c]" />
            <h1 className="text-sm font-bold text-white tracking-tight">여러 로그 파일 병합하기</h1>
            <span className="text-[11px] font-medium text-white/40 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
              총 {sourceFiles.length}개 파일
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleFinalMerge}
            disabled={mergedItems.length === 0}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-lg cursor-pointer ${
              mergedItems.length > 0
                ? 'bg-[#e6005c] hover:bg-[#ff1a75] text-white shadow-pink-500/20'
                : 'bg-white/10 text-white/40 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>이대로 병합하여 편집 시작 ({mergedItems.length.toLocaleString()}개 로그)</span>
          </button>
        </div>
      </header>

      {/* 2. Main 3-Column Body */}
      <div className="flex-1 flex min-h-0 divide-x divide-white/10">
        {/* LEFT COLUMN: File List & Sequence (approx 280px) */}
        <div className="w-72 bg-[#161619] flex flex-col shrink-0">
          <div className="p-3 border-b border-white/5 flex items-center justify-between bg-[#1a1a1e]">
            <span className="text-[11px] font-bold text-white/60 uppercase tracking-wider">파일 목록 및 순서</span>
            <span className="text-[10px] text-white/40">{sourceFiles.length}개</span>
          </div>

          {/* Clean '로그 파일 추가' Button placed clearly at the top of file list */}
          <div className="p-2 border-b border-white/5">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/90 hover:text-white transition-all text-xs font-bold border border-white/10 hover:border-[#e6005c]/50 hover:bg-[#e6005c]/5 cursor-pointer group"
            >
              <Upload className="w-3.5 h-3.5 text-white/60 group-hover:text-[#e6005c] transition-colors" />
              <span>로그 파일 추가</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
            {/* Master 'Preview' Tab */}
            <button
              onClick={() => setSelectedFileId('merged')}
              className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 relative cursor-pointer ${
                selectedFileId === 'merged'
                  ? 'bg-[#e6005c]/15 border-[#e6005c]/50 text-white shadow-md'
                  : 'bg-white/5 hover:bg-white/10 border-white/5 text-white/70'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-[#e6005c]/20 border border-[#e6005c]/30 flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4 text-[#e6005c]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">★ 미리보기</span>
                  <span className="text-[10px] font-bold text-[#e6005c]">{mergedItems.length.toLocaleString()}줄</span>
                </div>
                <p className="text-[10px] text-white/40 truncate mt-0.5">
                  {clips.length > 0 ? `클립 ${clips.length}개 조합 미리보기` : '등록된 클립 없음'}
                </p>
              </div>
            </button>

            <div className="pt-2 pb-1 px-1 flex items-center justify-between">
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">개별 원본 파일</span>
            </div>

            {/* Individual Source Files */}
            {sourceFiles.map((file, idx) => {
              const isSelected = selectedFileId === file.id;
              return (
                <div
                  key={file.id}
                  onClick={() => setSelectedFileId(file.id)}
                  className={`w-full p-2.5 rounded-xl border transition-all cursor-pointer group relative ${
                    isSelected
                      ? 'bg-white/10 border-white/30 text-white shadow-sm'
                      : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/5 text-white/70'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {/* Badge Color Strip */}
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0 mt-1"
                      style={{ backgroundColor: file.badgeColor }}
                      title={`고유 배지 색상: ${file.badgeColor}`}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold truncate text-white/90 group-hover:text-white" title={file.name}>
                          {idx + 1}. {file.name}
                        </span>
                        <button
                          onClick={(e) => handleRemoveFile(file.id, e)}
                          className="text-white/20 hover:text-red-400 p-0.5 rounded transition-colors cursor-pointer"
                          title="목록에서 제외"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-1 text-[10px] text-white/40">
                        <span>{file.logs.length.toLocaleString()}개 로그</span>
                        <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            disabled={idx === 0}
                            onClick={(e) => moveFileOrder(idx, 'up', e)}
                            className="p-1 hover:bg-white/10 rounded disabled:opacity-20 transition-colors cursor-pointer"
                            title="위로 이동"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            disabled={idx === sourceFiles.length - 1}
                            onClick={(e) => moveFileOrder(idx, 'down', e)}
                            className="p-1 hover:bg-white/10 rounded disabled:opacity-20 transition-colors cursor-pointer"
                            title="아래로 이동"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {sourceFiles.length === 0 && (
              <div className="text-center py-10 px-4 text-white/40 text-xs">
                업로드된 파일이 없습니다.<br />
                상단의 '로그 파일 추가' 버튼을 눌러주세요.
              </div>
            )}
          </div>
        </div>

        {/* CENTER COLUMN: Clean High-Speed Text Viewer (Flex-1) */}
        <div className="flex-1 flex flex-col bg-[#0f0f11] min-w-0 overflow-hidden relative">
          {/* Viewer Toolbar Header */}
          <div className="h-11 px-4 border-b border-white/5 bg-[#141417] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {selectedFileId === 'merged' ? (
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Layers className="w-3.5 h-3.5 text-[#e6005c]" />
                  <span>미리보기</span>
                  <span className="text-[10px] font-normal text-white/40">
                    ([순번] [파일명 뱃지] [탭] 이름: 대사)
                  </span>
                </div>
              ) : activeFile ? (
                <div className="flex items-center gap-2 text-xs font-bold text-white min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeFile.badgeColor }} />
                  <span className="truncate">{activeFile.name}</span>
                  <span className="text-[10px] font-normal text-white/40 hidden md:inline">
                    ({selectionStep === 'picking_start' 
                      ? '첫 대사를 클릭하세요' 
                      : selectionStep === 'picking_end' 
                        ? '마지막 대사를 클릭하세요' 
                        : '대사를 클릭하여 범위를 지정할 수 있습니다'})
                  </span>
                </div>
              ) : null}
            </div>

            {selectedFileId !== 'merged' && activeFile && (
              <div className="flex items-center gap-2 text-[11px]">
                {/* 1. 전체 선택 버튼 */}
                <button
                  type="button"
                  onClick={handleSelectAllInActiveFile}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors border border-white/5 cursor-pointer font-medium"
                >
                  전체 선택
                </button>

                {/* 2. 선택 시작하기 버튼 */}
                <button
                  type="button"
                  onClick={handleStartSelectionFlow}
                  className={`px-2.5 py-1 rounded-lg transition-all border font-bold cursor-pointer flex items-center gap-1.5 ${
                    isSelectionActive
                      ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80'
                  }`}
                >
                  <Scissors className="w-3 h-3" />
                  <span>
                    {selectionStep === 'picking_start' 
                      ? '1. 첫 대사 클릭 대기...' 
                      : selectionStep === 'picking_end' 
                        ? '2. 마지막 대사 클릭 대기...' 
                        : '구간 선택 시작'}
                  </span>
                </button>

                {/* 3. 우측 화살표로 시퀀스 추가 버튼 */}
                <button
                  type="button"
                  onClick={handleAddCurrentRangeAsClip}
                  title="지정된 구간을 우측 병합 시퀀스에 추가"
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#e6005c] hover:bg-[#ff1a75] text-white font-bold transition-all shadow-md shadow-pink-500/10 cursor-pointer"
                >
                  <span>구간 추가</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Viewer Text Area */}
          <div ref={viewerScrollRef} className="flex-1 overflow-y-auto p-5 font-mono text-[12px] leading-relaxed select-text custom-scrollbar">
            {selectedFileId === 'merged' ? (
              /* Merged Preview View */
              mergedItems.length > 0 ? (
                <div className="space-y-1.5">
                  {mergedItems.map((item, idx) => {
                    const log = item.log;
                    return (
                      <div 
                        key={log.id + '_' + idx}
                        className="flex items-baseline gap-2 hover:bg-white/[0.04] px-2 py-0.5 rounded transition-colors"
                      >
                        {/* 1. Sequence Number */}
                        <span className="text-white/30 text-[10px] shrink-0 font-mono w-9 text-right">
                          [{idx + 1}]
                        </span>

                        {/* 2. File Name Badge */}
                        <span
                          className="px-1.5 py-0.2 rounded text-[10px] font-bold text-white shrink-0 tracking-tight"
                          style={{ backgroundColor: item.badgeColor + 'cc' }}
                          title={item.sourceFileName}
                        >
                          {item.sourceFileName.length > 12 ? item.sourceFileName.substring(0, 10) + '..' : item.sourceFileName}
                        </span>

                        {/* 3. Tab Name */}
                        <span className="text-white/40 text-[11px] shrink-0 font-semibold">
                          [{log.tab || '메인'}]
                        </span>

                        {/* 4. Name (with color) */}
                        <span 
                          className="font-bold shrink-0"
                          style={{ color: log.color || '#ffffff' }}
                        >
                          {log.name}:
                        </span>

                        {/* 5. Content */}
                        <span 
                          className="text-white/90 break-words whitespace-pre-wrap flex-1"
                          dangerouslySetInnerHTML={{ __html: log.content }}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-20 text-white/30">
                  등록된 시퀀스 구간(클립)이 없습니다.<br />
                  좌측 파일 목록에서 파일을 선택한 후 구간을 지정하여 추가해주세요.
                </div>
              )
            ) : activeFile ? (
              /* Single File Range Selection View */
              <div className="space-y-1">
                {activeFile.logs.map((log, idx) => {
                  const isWithinRange = idx >= startIdx && idx <= endIdx;
                  const isStart = idx === startIdx;
                  const isEnd = idx === endIdx;

                  return (
                    <div
                      key={log.id}
                      onClick={() => handleLogClick(idx)}
                      className={`flex items-baseline gap-2 px-2 py-0.5 rounded cursor-pointer transition-all ${
                        isWithinRange
                          ? 'opacity-100 hover:bg-white/[0.08]'
                          : 'opacity-30 hover:opacity-60 bg-transparent'
                      } ${isStart ? 'ring-1 ring-blue-400 bg-blue-500/10' : ''} ${
                        isEnd ? 'ring-1 ring-pink-400 bg-pink-500/10' : ''
                      }`}
                    >
                      {/* Line Number */}
                      <span className="text-white/30 text-[10px] shrink-0 font-mono w-8 text-right">
                        {idx + 1}
                      </span>

                      {/* File Name Badge */}
                      <span
                        className="px-1.5 py-0.2 rounded text-[10px] font-bold text-white shrink-0 tracking-tight opacity-75"
                        style={{ backgroundColor: activeFile.badgeColor + 'aa' }}
                      >
                        {activeFile.name.length > 10 ? activeFile.name.substring(0, 8) + '..' : activeFile.name}
                      </span>

                      {/* Tab Name */}
                      <span className="text-white/40 text-[11px] shrink-0 font-semibold">
                        [{log.tab || '메인'}]
                      </span>

                      {/* Name */}
                      <span 
                        className="font-bold shrink-0"
                        style={{ color: log.color || '#ffffff' }}
                      >
                        {log.name}:
                      </span>

                      {/* Content */}
                      <span 
                        className="text-white/90 break-words whitespace-pre-wrap flex-1"
                        dangerouslySetInnerHTML={{ __html: log.content }}
                      />

                      {/* Selection Quick Indicators */}
                      {isStart && (
                        <span className="px-1.5 py-0.2 text-[9px] bg-blue-500/20 text-blue-300 rounded border border-blue-500/30 font-bold shrink-0">
                          시작
                        </span>
                      )}
                      {isEnd && (
                        <span className="px-1.5 py-0.2 text-[9px] bg-pink-500/20 text-pink-300 rounded border border-pink-500/30 font-bold shrink-0">
                          끝
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          {/* Floating Scroll to Top & Bottom Buttons */}
          <div className="absolute right-5 bottom-5 flex flex-col gap-1.5 z-20">
            <button
              type="button"
              onClick={scrollToTop}
              className="w-8 h-8 rounded-full bg-[#1e1e24]/90 hover:bg-[#2d2d38] text-white/70 hover:text-white border border-white/10 shadow-lg flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
              title="파일 최상단으로 이동"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={scrollToBottom}
              className="w-8 h-8 rounded-full bg-[#1e1e24]/90 hover:bg-[#2d2d38] text-white/70 hover:text-white border border-white/10 shadow-lg flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
              title="파일 최하단으로 이동"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Clips Sequence & Merge Settings (approx 340px) */}
        <div className="w-80 bg-[#161619] flex flex-col shrink-0">
          <div className="p-3 border-b border-white/5 bg-[#1a1a1e] flex items-center justify-between">
            <span className="text-[11px] font-bold text-white/60 uppercase tracking-wider">병합 시퀀스 (구간 조립)</span>
            <span className="text-[10px] text-white/40">{clips.length}개 구간</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
            {/* Active Range Inspector Box (when a single file is active) */}
            {activeFile && (
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>선택된 구간 범위</span>
                  <span className="text-[10px] text-white/40">
                    {endIdx - startIdx + 1}개 로그
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="p-2 rounded bg-black/40 border border-white/5">
                    <span className="text-blue-400 font-bold block text-[10px] mb-0.5">시작 대사:</span>
                    <p className="text-white/80 font-mono text-[10px] truncate">
                      {getSnippet(activeFile.logs[startIdx])}
                    </p>
                  </div>

                  <div className="p-2 rounded bg-black/40 border border-white/5">
                    <span className="text-pink-400 font-bold block text-[10px] mb-0.5">종료 대사:</span>
                    <p className="text-white/80 font-mono text-[10px] truncate">
                      {getSnippet(activeFile.logs[endIdx])}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddCurrentRangeAsClip}
                  className="w-full py-1.5 rounded-lg bg-[#e6005c] hover:bg-[#ff1a75] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-pink-500/10 cursor-pointer"
                >
                  <span>구간 시퀀스에 추가</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Clips Sequence List */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider block px-1">
                조립 순서 (위에서 아래로 병합)
              </span>

              {clips.map((clip, cIdx) => {
                const source = sourceFiles.find(f => f.id === clip.sourceFileId);
                const startLog = source?.logs[clip.startIndex];
                const endLog = source?.logs[clip.endIndex];
                const count = Math.max(0, clip.endIndex - clip.startIndex + 1);

                return (
                  <div
                    key={clip.id}
                    className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <GripVertical className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 cursor-grab" />
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: source?.badgeColor || '#888' }}
                        />
                        <span className="text-xs font-bold text-white/90 truncate max-w-[150px]">
                          {cIdx + 1}. {source?.name || '알 수 없음'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          disabled={cIdx === 0}
                          onClick={() => moveClipOrder(cIdx, 'up')}
                          className="p-1 hover:bg-white/10 rounded disabled:opacity-20 transition-colors cursor-pointer"
                          title="위로 이동"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          disabled={cIdx === clips.length - 1}
                          onClick={() => moveClipOrder(cIdx, 'down')}
                          className="p-1 hover:bg-white/10 rounded disabled:opacity-20 transition-colors cursor-pointer"
                          title="아래로 이동"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleRemoveClip(clip.id)}
                          className="p-1 text-white/20 hover:text-red-400 rounded transition-colors ml-1 cursor-pointer"
                          title="구간 삭제"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="text-[10px] text-white/50 space-y-0.5 bg-black/20 p-1.5 rounded">
                      <p className="truncate">
                        <strong className="text-white/70">시작:</strong> {getSnippet(startLog)}
                      </p>
                      <p className="truncate">
                        <strong className="text-white/70">종료:</strong> {getSnippet(endLog)}
                      </p>
                      <p className="text-right text-white/30 text-[9px]">
                        포함 로그: {count.toLocaleString()}개
                      </p>
                    </div>
                  </div>
                );
              })}

              {clips.length === 0 && (
                <div className="text-center py-6 text-white/30 text-xs border border-dashed border-white/10 rounded-xl">
                  등록된 시퀀스 구간이 없습니다.<br />
                  구간을 선택 후 추가해주세요.
                </div>
              )}
            </div>

            {/* Merge Options */}
            <div className="pt-3 border-t border-white/5 space-y-2.5">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider block px-1">
                병합 옵션
              </span>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={autoDeduplicate}
                  onChange={(e) => setAutoDeduplicate(e.target.checked)}
                  className="rounded border-white/20 bg-black/40 text-[#e6005c] focus:ring-0 cursor-pointer"
                />
                <div className="text-[11px]">
                  <span className="font-bold text-white/90">중복 로그 자동 제외</span>
                  <p className="text-[10px] text-white/40">
                    서로 이어지는 클립 간 겹치는 시퀀스 블록을 감지해 1번만 포함합니다.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
