import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
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
  '#6366f1', // indigo
  '#0d9488', // teal
  '#d97706', // amber
  '#8b5cf6', // purple
  '#0284c7', // light blue
  '#e11d48', // rose
  '#4f46e5', // violet
  '#475569', // slate
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

  // When active file changes, reset selection range and step (fallback for external file list changes)
  useEffect(() => {
    if (activeFile) {
      setSelectionRange(prev => {
        if (prev.start === 0 && prev.end === Math.max(0, activeFile.logs.length - 1)) {
          return prev;
        }
        return {
          start: 0,
          end: Math.max(0, activeFile.logs.length - 1)
        };
      });
      setSelectionStep('idle');
    }
  }, [selectedFileId, activeFile]);

  // Switch selected file (or 'merged') cleanly and immediately
  const handleSelectFile = (fileId: string) => {
    setSelectedFileId(fileId);
    if (fileId !== 'merged') {
      const targetFile = sourceFiles.find(f => f.id === fileId);
      if (targetFile) {
        setSelectionRange({
          start: 0,
          end: Math.max(0, targetFile.logs.length - 1)
        });
        setSelectionStep('idle');
      }
    }
    if (viewerScrollRef.current) {
      viewerScrollRef.current.scrollTop = 0;
    }
  };

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
    if (itemCount > 0) {
      rowVirtualizer.scrollToIndex(itemCount - 1, { align: 'end' });
    } else if (viewerScrollRef.current) {
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

  // Compute overlap count at each boundary between adjacent clips
  const clipBoundaries = useMemo(() => {
    const fileMap = new Map<string, MergeSourceFile>();
    sourceFiles.forEach(f => fileMap.set(f.id, f));

    const boundaries: { overlapCount: number }[] = [];
    for (let i = 0; i < clips.length - 1; i++) {
      const clipA = clips[i];
      const clipB = clips[i + 1];
      const sourceA = fileMap.get(clipA.sourceFileId);
      const sourceB = fileMap.get(clipB.sourceFileId);

      if (!sourceA || !sourceB) {
        boundaries.push({ overlapCount: 0 });
        continue;
      }

      const logsA = sourceA.logs.slice(clipA.startIndex, clipA.endIndex + 1);
      const logsB = sourceB.logs.slice(clipB.startIndex, clipB.endIndex + 1);
      const maxCheck = Math.min(logsA.length, logsB.length, 500);
      let overlap = 0;

      for (let len = maxCheck; len >= 1; len--) {
        let match = true;
        for (let k = 0; k < len; k++) {
          if (!isIdenticalLog(logsA[logsA.length - len + k], logsB[k])) {
            match = false;
            break;
          }
        }
        if (match) {
          overlap = len;
          break;
        }
      }

      boundaries.push({ overlapCount: overlap });
    }

    return boundaries;
  }, [clips, sourceFiles]);

  // Total raw logs across all clips
  const totalRawClipLogs = useMemo(() => {
    return clips.reduce((sum, c) => sum + Math.max(0, c.endIndex - c.startIndex + 1), 0);
  }, [clips]);

  // Total duplicates excluded by deduplication
  const totalDuplicatesExcluded = useMemo(() => {
    if (!autoDeduplicate) return 0;
    return Math.max(0, totalRawClipLogs - mergedItems.length);
  }, [autoDeduplicate, totalRawClipLogs, mergedItems.length]);

  // Virtualizer for high-speed rendering of tens of thousands of logs
  const itemCount = selectedFileId === 'merged' ? mergedItems.length : (activeFile?.logs.length || 0);

  const rowVirtualizer = useVirtualizer({
    count: itemCount,
    getScrollElement: () => viewerScrollRef.current,
    estimateSize: () => 28,
    overscan: 25,
  });

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
    <div className="fixed inset-0 z-50 bg-[#121212] text-stone-200 flex flex-col font-sans select-none overflow-hidden">
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
      <header className="h-14 px-5 border-b border-white/5 bg-[#1a1a1a] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all text-xs font-semibold border border-white/10 cursor-pointer"
            title="편집기로 돌아가기"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>편집기로 돌아가기</span>
          </button>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#e6005c]/10 border border-[#e6005c]/25 flex items-center justify-center shrink-0">
              <Layers className="w-3.5 h-3.5 text-[#e6005c]" />
            </div>
            <h1 className="text-sm font-bold text-white tracking-tight whitespace-nowrap">로그 병합</h1>
            <span className="text-[11px] font-medium text-white/50 bg-white/5 px-2 py-0.5 rounded-md border border-white/10 shrink-0">
              총 {sourceFiles.length}개 파일
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleFinalMerge}
            disabled={mergedItems.length === 0}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs transition-all border cursor-pointer shrink-0 ${
              mergedItems.length > 0
                ? 'bg-[#e6005c] hover:bg-[#ff1a75] text-white border-[#e6005c] shadow-lg shadow-pink-500/20 active:scale-[0.98]'
                : 'bg-white/5 text-white/30 border-white/5 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className={`w-4 h-4 shrink-0 ${mergedItems.length > 0 ? 'text-white' : 'text-white/30'}`} />
            <div className="flex flex-col items-start leading-none text-left whitespace-nowrap">
              <span className="font-bold text-[12px] tracking-tight whitespace-nowrap">
                이대로 병합하여 편집 시작 ({mergedItems.length.toLocaleString()}개 로그)
              </span>
              <span className={`text-[10px] mt-1 font-medium whitespace-nowrap ${mergedItems.length > 0 ? 'text-white/80' : 'text-white/30'}`}>
                {totalDuplicatesExcluded.toLocaleString()}개 중복 제외됨
              </span>
            </div>
          </button>
        </div>
      </header>

      {/* 2. Main 3-Column Body */}
      <div className="flex-1 flex min-h-0 divide-x divide-white/5">
        {/* LEFT COLUMN: File List & Sequence (approx 280px) */}
        <div className="w-72 bg-[#1a1a1a] flex flex-col shrink-0">
          <div className="p-3.5 border-b border-white/5 flex items-center justify-between">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">파일 목록 및 순서</span>
            <span className="text-[10px] text-white/40">{sourceFiles.length}개</span>
          </div>

          {/* Clean '로그 파일 추가' Button */}
          <div className="p-2 border-b border-white/5">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/5 hover:bg-[#e6005c]/10 hover:border-[#e6005c]/40 text-white/70 hover:text-white transition-all text-xs font-semibold border border-white/10 cursor-pointer group"
            >
              <Upload className="w-3.5 h-3.5 text-white/50 group-hover:text-[#e6005c] transition-colors" />
              <span>로그 파일 추가</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
            {/* Master 'Preview' Tab */}
            <button
              onClick={() => handleSelectFile('merged')}
              className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 relative cursor-pointer ${
                selectedFileId === 'merged'
                  ? 'bg-[#e6005c]/15 border-[#e6005c]/50 text-white shadow-sm'
                  : 'bg-white/5 hover:bg-white/10 border-white/5 text-white/70'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                selectedFileId === 'merged'
                  ? 'bg-[#e6005c]/25 border-[#e6005c]/40 text-[#e6005c]'
                  : 'bg-black/30 border-white/5 text-white/40'
              }`}>
                <Layers className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">통합 미리보기</span>
                  <span className="text-[10px] font-bold text-white/80 bg-black/30 px-1.5 py-0.5 rounded border border-white/5">{mergedItems.length.toLocaleString()}줄</span>
                </div>
                <p className="text-[10px] text-white/40 truncate mt-0.5">
                  {clips.length > 0 ? `시퀀스 클립 ${clips.length}개 조합` : '등록된 클립 없음'}
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
                  onClick={() => handleSelectFile(file.id)}
                  className={`w-full p-2.5 rounded-xl border transition-all cursor-pointer group relative ${
                    isSelected
                      ? 'bg-white/10 border-white/20 text-white shadow-sm ring-1 ring-white/10'
                      : 'bg-white/5 hover:bg-white/[0.08] border-white/5 text-white/70'
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

        {/* CENTER COLUMN: Text Viewer (matches editor preview background) */}
        <div className="flex-1 flex flex-col bg-[#0f0f0f] min-w-0 overflow-hidden relative">
          {/* Viewer Toolbar Header */}
          <div className="h-11 px-4 border-b border-white/5 bg-[#141414] flex items-center justify-between shrink-0 gap-2 overflow-hidden">
            <div className="flex items-center gap-3 min-w-0">
              {selectedFileId === 'merged' ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-white/90 min-w-0">
                  <Layers className="w-3.5 h-3.5 text-[#e6005c] shrink-0" />
                  <span className="whitespace-nowrap shrink-0">병합 미리보기</span>
                  <span className="text-[10px] font-normal text-white/40 truncate hidden sm:inline">
                    ([순번] [파일] [탭] 이름: 대사)
                  </span>
                </div>
              ) : activeFile ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-white/90 min-w-0">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: activeFile.badgeColor }} />
                  <span className="truncate">{activeFile.name}</span>
                  <span className="text-[10px] font-normal text-white/40 hidden xl:inline truncate">
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
              <div className="flex items-center gap-1.5 text-[11px] shrink-0">
                {/* 1. 전체 선택 버튼 */}
                <button
                  type="button"
                  onClick={handleSelectAllInActiveFile}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors border border-white/10 cursor-pointer font-medium whitespace-nowrap shrink-0"
                >
                  전체 선택
                </button>

                {/* 2. 선택 시작하기 버튼 */}
                <button
                  type="button"
                  onClick={handleStartSelectionFlow}
                  className={`px-2.5 py-1 rounded-lg transition-all border font-semibold cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    isSelectionActive
                      ? 'bg-[#e6005c]/20 border-[#e6005c] text-[#e6005c] shadow-[0_0_10px_rgba(230,0,92,0.2)]'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white'
                  }`}
                >
                  <Scissors className="w-3 h-3 shrink-0" />
                  <span className="whitespace-nowrap">
                    {selectionStep === 'picking_start' 
                      ? '1. 첫 대사 선택 중' 
                      : selectionStep === 'picking_end' 
                        ? '2. 끝 대사 선택 중' 
                        : '구간 선택 시작'}
                  </span>
                </button>

                {/* 3. 우측 화살표로 시퀀스 추가 버튼 */}
                <button
                  type="button"
                  onClick={handleAddCurrentRangeAsClip}
                  title="지정된 구간을 우측 병합 시퀀스에 추가"
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#e6005c] hover:bg-[#ff1a75] text-white font-bold transition-all border border-[#e6005c] shadow-md shadow-pink-500/20 cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
                >
                  <span className="whitespace-nowrap">구간 추가</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              </div>
            )}
          </div>

          {/* Viewer Text Area */}
          <div ref={viewerScrollRef} className="flex-1 overflow-y-auto px-5 py-3 font-mono text-[12px] leading-relaxed select-text custom-scrollbar relative">
            {selectedFileId === 'merged' ? (
              /* Merged Preview View (Virtualized) */
              mergedItems.length > 0 ? (
                <div
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const idx = virtualRow.index;
                    const item = mergedItems[idx];
                    if (!item) return null;
                    const log = item.log;
                    return (
                      <div 
                        key={`merged_${virtualRow.index}`}
                        data-index={virtualRow.index}
                        ref={rowVirtualizer.measureElement}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                        className="flex items-baseline gap-2 hover:bg-white/[0.04] px-2 py-0.5 rounded transition-colors"
                      >
                        {/* 1. Sequence Number */}
                        <span className="text-white/30 text-[10px] shrink-0 font-mono w-9 text-right select-none">
                          [{idx + 1}]
                        </span>

                        {/* 2. File Name Badge */}
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-medium text-white/80 bg-white/5 border border-white/10 shrink-0 tracking-tight inline-flex items-center gap-1"
                          title={item.sourceFileName}
                        >
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.badgeColor }} />
                          {item.sourceFileName.length > 12 ? item.sourceFileName.substring(0, 10) + '..' : item.sourceFileName}
                        </span>

                        {/* 3. Tab Name */}
                        <span className="text-white/40 text-[11px] shrink-0 font-medium">
                          [{log.tab || '메인'}]
                        </span>

                        {/* 4. Name (with color) */}
                        <span 
                          className="font-semibold shrink-0"
                          style={{ color: log.color || '#f5f5f4' }}
                        >
                          {log.name}:
                        </span>

                        {/* 5. Content */}
                        <span 
                          className="text-stone-200 break-words whitespace-pre-wrap flex-1"
                          dangerouslySetInnerHTML={{ __html: log.content }}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : null
            ) : activeFile ? (
              /* Single File Range Selection View (Virtualized) */
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const idx = virtualRow.index;
                  const log = activeFile.logs[idx];
                  if (!log) return null;
                  const isWithinRange = idx >= startIdx && idx <= endIdx;
                  const isStart = idx === startIdx;
                  const isEnd = idx === endIdx;

                  return (
                    <div
                      key={log.id || `log_${idx}`}
                      data-index={virtualRow.index}
                      ref={rowVirtualizer.measureElement}
                      onClick={() => handleLogClick(idx)}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      className={`flex items-baseline gap-2 px-2 py-0.5 rounded cursor-pointer transition-all ${
                        isWithinRange
                          ? 'opacity-100 bg-white/[0.06] hover:bg-white/[0.09]'
                          : 'opacity-35 hover:opacity-70 bg-transparent'
                      } ${isStart ? 'border-l-2 border-[#e6005c] bg-[#e6005c]/10 text-white' : ''} ${
                        isEnd ? 'border-r-2 border-[#e6005c] bg-[#e6005c]/10 text-white' : ''
                      }`}
                    >
                      {/* Line Number */}
                      <span className="text-white/30 text-[10px] shrink-0 font-mono w-8 text-right select-none">
                        {idx + 1}
                      </span>

                      {/* File Name Badge */}
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium text-white/80 bg-white/5 border border-white/10 shrink-0 tracking-tight inline-flex items-center gap-1"
                      >
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: activeFile.badgeColor }} />
                        {activeFile.name.length > 10 ? activeFile.name.substring(0, 8) + '..' : activeFile.name}
                      </span>

                      {/* Tab Name */}
                      <span className="text-white/40 text-[11px] shrink-0 font-medium">
                        [{log.tab || '메인'}]
                      </span>

                      {/* Name */}
                      <span 
                        className="font-semibold shrink-0"
                        style={{ color: log.color || '#f5f5f4' }}
                      >
                        {log.name}:
                      </span>

                      {/* Content */}
                      <span 
                        className="text-stone-200 break-words whitespace-pre-wrap flex-1"
                        dangerouslySetInnerHTML={{ __html: log.content }}
                      />

                      {/* Selection Quick Indicators */}
                      {isStart && (
                        <span className="px-1.5 py-0.2 text-[9px] bg-[#e6005c]/20 text-[#e6005c] rounded border border-[#e6005c]/30 font-medium shrink-0">
                          시작
                        </span>
                      )}
                      {isEnd && (
                        <span className="px-1.5 py-0.2 text-[9px] bg-[#e6005c]/20 text-[#e6005c] rounded border border-[#e6005c]/30 font-medium shrink-0">
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
              className="w-8 h-8 rounded-full bg-[#1a1a1a]/90 hover:bg-[#242424] text-white/70 hover:text-white border border-white/10 shadow-xl flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
              title="파일 최상단으로 이동"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={scrollToBottom}
              className="w-8 h-8 rounded-full bg-[#1a1a1a]/90 hover:bg-[#242424] text-white/70 hover:text-white border border-white/10 shadow-xl flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
              title="파일 최하단으로 이동"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Clips Sequence & Merge Settings (approx 340px) */}
        <div className="w-80 bg-[#1a1a1a] flex flex-col shrink-0">
          <div className="p-3.5 border-b border-white/5 flex items-center justify-between">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">병합 시퀀스 (구간 조립)</span>
            <span className="text-[10px] text-white/40">{clips.length}개 구간</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
            {/* Active Range Inspector Box (when a single file is active) */}
            {activeFile && (
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>선택된 구간 범위</span>
                  <span className="text-[10px] text-white/40 font-mono">
                    #{startIdx + 1} ~ #{endIdx + 1} ({endIdx - startIdx + 1}개 로그)
                  </span>
                </div>

                <div className="text-[11px] text-stone-300 space-y-1 bg-black/40 border border-white/5 p-2.5 rounded-lg">
                  <p className="truncate">
                    <span className="text-white/40 font-medium">시작:</span>{' '}
                    <span className="text-white/90 font-mono text-[10px]">{getSnippet(activeFile.logs[startIdx])}</span>
                  </p>
                  <p className="truncate">
                    <span className="text-white/40 font-medium">종료:</span>{' '}
                    <span className="text-white/90 font-mono text-[10px]">{getSnippet(activeFile.logs[endIdx])}</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddCurrentRangeAsClip}
                  className="w-full py-2 rounded-xl bg-[#e6005c] hover:bg-[#ff1a75] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-[#e6005c] shadow-md shadow-pink-500/20 cursor-pointer active:scale-95 whitespace-nowrap"
                >
                  <span>구간 시퀀스에 추가</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Clips Sequence List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                  조립 순서 (위에서 아래로 병합)
                </span>
                <span className="text-[10px] text-white/40 font-mono">
                  {clips.length}개 구간
                </span>
              </div>

              {clips.map((clip, cIdx) => {
                const source = sourceFiles.find(f => f.id === clip.sourceFileId);
                const startLog = source?.logs[clip.startIndex];
                const endLog = source?.logs[clip.endIndex];
                const count = Math.max(0, clip.endIndex - clip.startIndex + 1);
                const boundary = clipBoundaries[cIdx];

                return (
                  <React.Fragment key={clip.id}>
                    <div
                      className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all space-y-2 group shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <GripVertical className="w-3.5 h-3.5 text-white/30 group-hover:text-white/60 cursor-grab shrink-0" />
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: source?.badgeColor || '#e6005c' }}
                          />
                          <span className="text-xs font-semibold text-white/90 truncate max-w-[150px]">
                            {cIdx + 1}. {source?.name || '알 수 없음'}
                          </span>
                        </div>

                        <div className="flex items-center gap-0.5">
                          <button
                            disabled={cIdx === 0}
                            onClick={() => moveClipOrder(cIdx, 'up')}
                            className="p-1 hover:bg-white/10 text-white/40 hover:text-white rounded disabled:opacity-20 transition-colors cursor-pointer"
                            title="위로 이동"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            disabled={cIdx === clips.length - 1}
                            onClick={() => moveClipOrder(cIdx, 'down')}
                            className="p-1 hover:bg-white/10 text-white/40 hover:text-white rounded disabled:opacity-20 transition-colors cursor-pointer"
                            title="아래로 이동"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRemoveClip(clip.id)}
                            className="p-1 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors ml-1 cursor-pointer"
                            title="구간 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="text-[11px] text-white/60 space-y-1 bg-black/30 border border-white/5 p-2 rounded-lg">
                        <p className="truncate">
                          <span className="text-white/40 font-medium">시작:</span>{' '}
                          <span className="text-white/80 font-mono text-[10px]">{getSnippet(startLog)}</span>
                        </p>
                        <p className="truncate">
                          <span className="text-white/40 font-medium">종료:</span>{' '}
                          <span className="text-white/80 font-mono text-[10px]">{getSnippet(endLog)}</span>
                        </p>
                        <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-white/40">
                          <span>#{clip.startIndex + 1} ~ #{clip.endIndex + 1}</span>
                          <span className="font-medium text-white/60">{count.toLocaleString()}개 로그</span>
                        </div>
                      </div>
                    </div>

                    {/* Sequence connector between clip cIdx and cIdx + 1 */}
                    {cIdx < clips.length - 1 && (
                      boundary && boundary.overlapCount > 0 ? (
                        <div
                          className="relative flex items-center justify-center my-2.5 py-0.5"
                          title={`${boundary.overlapCount.toLocaleString()}개 대사가 중복되어 이어집니다`}
                        >
                          <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-white/10" />
                          </div>
                          <div className="relative z-10 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#242424] text-white/80 border border-white/10 text-[10px] font-medium shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#e6005c] shrink-0" />
                            <span>{boundary.overlapCount.toLocaleString()}개 겹침</span>
                          </div>
                        </div>
                      ) : (
                        <div className="my-2.5 py-1 flex items-center" title="겹치지 않는 구간">
                          <div className="w-full border-t border-white/10" />
                        </div>
                      )
                    )}
                  </React.Fragment>
                );
              })}

              {clips.length === 0 && (
                <div className="text-center py-6 text-white/40 text-xs border border-dashed border-white/10 rounded-xl">
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

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={autoDeduplicate}
                  onChange={(e) => setAutoDeduplicate(e.target.checked)}
                  className="rounded border-white/20 bg-black/40 text-[#e6005c] focus:ring-0 cursor-pointer accent-[#e6005c]"
                />
                <span className="text-[11px] font-medium text-white/80">중복 로그 자동 제외</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
