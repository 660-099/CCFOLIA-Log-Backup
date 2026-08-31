import React, { useState, useMemo, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import { Pencil, Trash2, Plus, X, Image as ImageIcon, Palette, Highlighter, ArrowUp, ArrowDown } from 'lucide-react';
import { cn, r, linkifyAndFormat, markdownToHtml, htmlToMarkdown } from '../utils';
import { ColorPickerPopup } from './ColorPickerPopup';
import { EditorColorPickerPopup } from './EditorColorPickerPopup';
import { LogImage } from './LogImage';
import { LogAvatar } from './LogAvatar';
import { SectionNameEditor } from './SectionNameEditor';
import { BoundaryEditor } from './BoundaryEditor';
import { BgmItem } from './BgmItem';
import { BgmInlineInput } from './BgmInlineInput';
import { useSettings } from '../contexts/SettingsContext';
import { splitNarration } from '../utils/textTokenizer';
import { SearchableSelect } from './SearchableSelect';
// @ts-ignore
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuillComponent = ReactQuill as any;

const ColorStyle = Quill.import('attributors/style/color');
const BackgroundStyle = Quill.import('attributors/style/background');
Quill.register(ColorStyle as any, true);
Quill.register(BackgroundStyle as any, true);

const PALETTE_COLORS = [
  '#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff',
  '#e6005c', '#ff0000', '#ff4d4d', '#ff6699', '#ffb3c6', '#990033',
  '#ff6600', '#ff9900', '#ffcc00', '#ffff00', '#fff3a0', '#b36b00',
  '#008a00', '#00cc66', '#2ecc71', '#00cccc', '#a8e6cf', '#004d1a',
  '#0066cc', '#3498db', '#0099ff', '#003399', '#89cff0', '#001a4d',
  '#9933ff', '#8e44ad', '#cc66ff', '#e0b0ff', '#4b0082', '#6600cc'
];

const quillModules = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': PALETTE_COLORS }, { 'background': PALETTE_COLORS }],
    ['clean']
  ]
};


export const LogItem = React.memo(({ 
  log, 
  idx, 
  stableId,
  isHighlighted = false,
  isCurrentMatch = false,
  searchQuery = '',
  mergedLogs = [],
  insertedBlocks,
  startBlocks,
  imageInputLoc,
  bgmInputLoc,
  onAddBlock,
  onUpdateBlock,
  onRemoveBlock,
  onToggleImageInput,
  onToggleBgmInput,
  onAddBgmBlock,
  currentPlayingBgmId,
  isGlobalBgmPlaying,
  onSelectBgmTrack,
  onAddIllustration,
  onUpdateIllustration,
  onRemoveIllustration,
  originalLogIndex,
  illustrations = [],
  onEditLog,
  onBatchUpdateLog,
  onDeleteLog,
  onMoveLog,
  insertLogBlock,
  onChangeSpeaker,
  onChangeTab,
  charSettings: charSettingsFromProps,
  tabOrder,
  splitPointsArray,
  isPrevSameTab,
  isNextSameTab,
  isNextContinuation,
  isPrevBlock,
  mergedLogsCount,
  isPrevNarration,
  isNextNarration,
  editingLogId = null,
  setEditingLogId
}: any) => {
  const { 
    theme, disableOtherColor, fontSize, textFontSize,
    mergeTabStyles, showTabNames, hideEmptyAvatars, cropFaceTop, hideAllAvatars,
    narrationCharacter, charSettings: charSettingsFromContext, tabSettings,
    enableSentenceSpacing, enableSecretNarration, narrationFormat,
    lineHeight = 1.6, letterSpacing = 0, blockSpacing = 2, contentPadding = 15.5, avatarSizeValue = 46,
    showLogDivider = false
  } = useSettings();

  const charSettings = charSettingsFromProps || charSettingsFromContext;

  let effectiveBlockSpacing = blockSpacing;
  let basePaddingVertical = 12;
  if (effectiveBlockSpacing < 0) {
    basePaddingVertical = Math.max(2, basePaddingVertical + effectiveBlockSpacing / 2);
    effectiveBlockSpacing = 0;
  }
  
  const tabSet = tabSettings[log.tabId];
  const char = charSettings[log.charId] || { id: log.charId, name: log.name, color: log.color, visible: true, imageUrl: '' };

  const isEditing = editingLogId === log.id;
  const isAnyEditing = editingLogId !== null;
  const [editContent, setEditContent] = useState(() => markdownToHtml(log.content));
  const [editCharId, setEditCharId] = useState(log.charId);
  const [editTabId, setEditTabId] = useState(log.tabId);
  const [isHoveringButton, setIsHoveringButton] = useState(false);
  const [editingInsertedBlockId, setEditingInsertedBlockId] = useState<string | null>(null);

  const [customColorPickerTarget, setCustomColorPickerTarget] = useState<'foreColor' | 'backColor' | null>(null);
  const [customColorTriggerRect, setCustomColorTriggerRect] = useState<DOMRect | null>(null);
  const [customColorVal, setCustomColorVal] = useState('#e6005c');
  const quillRef = useRef<any>(null);
  const savedQuillRange = useRef<any>(null);

  const toolbarId = `quill-toolbar-${log.id}`;
  const quillModules = useMemo(() => ({
    toolbar: {
      container: `#${toolbarId}`
    }
  }), [toolbarId]);

  const handleOpenCustomColor = (e: React.MouseEvent, type: 'foreColor' | 'backColor') => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const quill = quillRef.current?.getEditor();
    if (quill) {
      savedQuillRange.current = quill.getSelection();
    }
    setCustomColorTriggerRect(rect);
    setCustomColorPickerTarget(type);
  };
  


  const orderedTabs = useMemo(() => {
    if (tabOrder && tabOrder.length > 0) {
      return tabOrder.map((id: string) => tabSettings[id]).filter(Boolean);
    }
    return Object.values(tabSettings);
  }, [tabOrder, tabSettings]);

  const [tabOverrideValue, setTabOverrideValue] = useState(() => {
    const initialTabId = log.tabId || '';
    const hasTab = orderedTabs.some((tab: any) => tab.id === initialTabId);
    return hasTab ? initialTabId : (orderedTabs[0]?.id || '');
  });
  const [imageInputVal, setImageInputVal] = useState('');
  const [dragOverPart, setDragOverPart] = useState<'top' | 'bottom' | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    const types = Array.from(e.dataTransfer.types);
    if (!types.includes("application/json") && !types.includes("text/plain")) return;

    e.preventDefault();
    e.stopPropagation();

    const isLast = idx === mergedLogsCount - 1;
    if (isLast) {
      const rect = e.currentTarget.getBoundingClientRect();
      const cursorY = e.clientY;
      const middleY = rect.top + rect.height / 2;
      if (cursorY < middleY) {
        if (dragOverPart !== 'top') setDragOverPart('top');
      } else {
        if (dragOverPart !== 'bottom') setDragOverPart('bottom');
      }
    } else {
      if (dragOverPart !== 'top') setDragOverPart('top');
    }
  };

  const handleDragLeave = () => {
    setDragOverPart(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const finalPart = dragOverPart;
    setDragOverPart(null);

    try {
      let dataStr = e.dataTransfer.getData("application/json") || e.dataTransfer.getData("text/plain");
      if (!dataStr) return;
      
      let parsed = null;
      if (dataStr.trim().startsWith('{')) {
        parsed = JSON.parse(dataStr);
      } else {
        parsed = { type: 'illustration', id: dataStr };
      }

      if (parsed && parsed.type === 'illustration') {
        const illId = parsed.id;
        const pos = finalPart || 'top';
        if (onUpdateIllustration) {
          onUpdateIllustration(illId, { 
            targetLogId: stableId, 
            position: pos === 'top' ? 'before' : 'after' 
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!imageInputLoc || imageInputLoc.logId !== stableId) {
      setImageInputVal('');
    }
    const initialTabId = log.tabId || '';
    const hasTab = orderedTabs.some((tab: any) => tab.id === initialTabId);
    setTabOverrideValue(hasTab ? initialTabId : (orderedTabs[0]?.id || ''));
  }, [imageInputLoc, stableId, log.tabId, orderedTabs]);

  useEffect(() => {
    if (isEditing) {
      setEditContent(markdownToHtml(log.content));
      setEditCharId(log.charId);
      setEditTabId(log.tabId);
    }
  }, [isEditing, log.id, log.content, log.charId, log.tabId]);

  const handleCancel = () => {
    if (!log.content || log.content.trim() === '') {
      onDeleteLog(log.id);
    }
    setEditingLogId(null);
  };

  const handleConfirm = () => {
    const mdContent = htmlToMarkdown(editContent);
    const trimmed = mdContent.trim();
    if (!trimmed) {
      onDeleteLog(log.id);
    } else {
      if (onBatchUpdateLog) {
        onBatchUpdateLog(log.id, {
          content: mdContent,
          charId: editCharId !== log.charId ? editCharId : undefined,
          tabId: editTabId !== log.tabId ? editTabId : undefined
        });
      } else {
        onEditLog(log.id, mdContent);
        if (editCharId !== log.charId && onChangeSpeaker) {
          onChangeSpeaker(log.id, editCharId);
        }
        if (editTabId !== log.tabId && onChangeTab) {
          onChangeTab(log.id, editTabId);
        }
      }
    }
    setEditingLogId(null);
  };

  // Define how blocks are rendered
  const renderBlocks = (blocks: any[], logId: string, isTopLevel: boolean = false) => {
    const isLastLog = idx === mergedLogsCount - 1;
    return (
      <>
        <BoundaryEditor 
          id={logId}
          onToggleSplit={() => onAddBlock(logId, 0, 'split')}
          onInsertImage={() => onToggleImageInput(logId, 0)}
          onInsertBgm={() => onToggleBgmInput && onToggleBgmInput(logId, 0)}
          onInsertLog={() => insertLogBlock(log.id, isTopLevel)}
          allowSplit={!isTopLevel && !(isLastLog && blocks.length === 0)}
          isTopLevel={isTopLevel}
          disabled={isHoveringButton || isAnyEditing}
          onDropIllustration={(illId) => onUpdateIllustration(illId, { targetLogId: stableId, position: 'before' })}
        />
        {imageInputLoc?.logId === logId && imageInputLoc.insertIndex === 0 && (
          <div className={cn(
            "mx-4 my-2 p-4 border border-dashed rounded-xl flex flex-col gap-3",
            theme === 'dark' ? "bg-white/5 border-white/20" : "bg-stone-50 border-stone-200 shadow-sm"
          )}>
            <div className="flex gap-2 items-center">
              <select 
                value={tabOverrideValue}
                onChange={(e) => setTabOverrideValue(e.target.value)}
                className={cn(
                  "border rounded-lg px-3 py-2 text-[11px] h-9 min-w-[120px] focus:outline-none focus:ring-1 focus:ring-[#e6005c]",
                  theme === 'dark' ? "bg-black/40 text-white border-white/20" : "bg-white text-stone-900 border-stone-200"
                )}
              >
                {orderedTabs.map((tab: any) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.name}
                  </option>
                ))}
              </select>
              <input 
                type="text" 
                placeholder="https://..." 
                value={imageInputVal}
                onChange={(e) => setImageInputVal(e.target.value)}
                className={cn(
                  "flex-1 border rounded-lg px-3 py-2 text-[11px] h-9 focus:outline-none focus:ring-1 focus:ring-[#e6005c]",
                  theme === 'dark' ? "bg-black/40 text-white border-white/20" : "bg-white text-stone-900 border-stone-200"
                )}
                onKeyDown={(e) => {
                  if (e.nativeEvent.isComposing) return;
                  if (e.key === 'Enter') {
                    const url = imageInputVal.trim();
                    if (url && onAddIllustration) {
                      onAddIllustration(stableId, url, tabOverrideValue);
                    }
                  }
                }}
              />
              <button 
                onClick={() => {
                  const url = imageInputVal.trim();
                  if (url && onAddIllustration) {
                    onAddIllustration(stableId, url, tabOverrideValue);
                  }
                }}
                className="px-4 py-2 bg-[#e6005c] hover:bg-[#ff007f] text-white rounded-lg text-[11px] h-9 font-bold shrink-0 flex items-center justify-center transition-colors"
              >
                추가
              </button>
              <button
                onClick={() => onToggleImageInput('', -1)}
                className={cn(
                  "px-4 py-2 rounded-lg text-[11px] h-9 font-bold shrink-0 flex items-center justify-center transition-colors border",
                  theme === 'dark' ? "bg-white/10 hover:bg-white/20 border-white/10 text-white" : "bg-white hover:bg-stone-50 border-stone-200 text-stone-700"
                )}
              >
                취소
              </button>
            </div>
          </div>
        )}

        {bgmInputLoc?.logId === logId && bgmInputLoc.insertIndex === 0 && (
          <BgmInlineInput
            onSave={(bgmData) => {
              if (onAddBgmBlock) {
                onAddBgmBlock(logId, 0, bgmData);
              }
            }}
            onCancel={() => onToggleBgmInput && onToggleBgmInput(logId, 0)}
          />
        )}

        {blocks.map((block, i) => (
          <React.Fragment key={block.id}>
            {block.type === 'image' && (
              editingInsertedBlockId === block.id ? (
                <div className="w-full flex justify-center py-2 relative">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const url = formData.get('url') as string;
                      if (onUpdateBlock) {
                        onUpdateBlock(logId, block.id, { url });
                      }
                      setEditingInsertedBlockId(null);
                    }}
                    className={cn(
                      "mx-4 my-2 p-4 border border-dashed rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full max-w-lg",
                      theme === 'dark' ? "bg-white/5 border-white/20 text-white" : "bg-stone-50 border-stone-200 text-stone-800 shadow-sm"
                    )}
                  >
                    <input
                      name="url"
                      type="text"
                      defaultValue={block.url}
                      placeholder="이미지 URL"
                      className={cn(
                        "px-3 py-2 text-[11px] h-9 rounded-lg border focus:outline-none focus:ring-1 focus:ring-[#e6005c] flex-1",
                        theme === 'dark' ? 'bg-black/40 border-white/20 text-white placeholder-white/30' : 'bg-white border-stone-200 text-stone-900 placeholder-stone-400'
                      )}
                      required
                    />
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#e6005c] hover:bg-[#ff007f] text-white rounded-lg text-[11px] h-9 font-bold flex-1 sm:flex-none flex items-center justify-center transition-colors"
                      >
                        저장
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingInsertedBlockId(null)}
                        className={cn(
                          "px-4 py-2 rounded-lg text-[11px] h-9 font-bold flex-1 sm:flex-none flex items-center justify-center transition-colors border",
                          theme === 'dark' ? "bg-white/10 hover:bg-white/20 border-white/10 text-white" : "bg-white hover:bg-stone-50 border-stone-200 text-stone-700"
                        )}
                      >
                        취소
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="relative group/block w-full min-h-[30px] flex justify-center py-2">
                  <LogImage 
                    url={block.url} 
                    width={block.width}
                    align={block.align || 'center'}
                    onUpdateWidth={(w: string) => onUpdateBlock && onUpdateBlock(logId, block.id, { width: w })}
                    onUpdateAlign={(a: 'left' | 'center' | 'right') => onUpdateBlock && onUpdateBlock(logId, block.id, { align: a })}
                    paddingSize={0}
                    tabOverride={block.tabOverride}
                    onUpdateTabOverride={(t: string) => onUpdateBlock && onUpdateBlock(logId, block.id, { tabOverride: t })}
                  />
                  {!isAnyEditing && onRemoveBlock && (
                    <div className="absolute top-2 right-4 flex items-center gap-1.5 opacity-0 group-hover/block:opacity-100 transition-opacity z-20">
                      <button
                        onClick={() => setEditingInsertedBlockId(block.id)}
                        className={cn(
                          "p-1 rounded border shadow-sm backdrop-blur-sm transition-colors",
                          theme === 'dark'
                            ? "bg-stone-800/80 text-white/60 hover:text-white border-white/10"
                            : "bg-white/90 text-stone-600 hover:text-stone-900 border-stone-200"
                        )}
                        title="수정"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onRemoveBlock(logId, block.id)}
                        className={cn(
                          "p-1 rounded border shadow-sm backdrop-blur-sm transition-colors",
                          theme === 'dark'
                            ? "bg-stone-800/80 text-white/60 hover:text-red-400 border-white/10"
                            : "bg-white/90 text-stone-600 hover:text-red-500 border-stone-200"
                        )}
                        title="삭제"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              )
            )}
            {block.type === 'bgm' && (
              editingInsertedBlockId === block.id ? (
                <div className="w-full relative">
                  <BgmInlineInput
                    initialTitle={block.title}
                    initialUrl={block.url}
                    initialUseTimestamp={block.useTimestamp}
                    isEditing={true}
                    onSave={(updated) => {
                      if (onUpdateBlock) onUpdateBlock(logId, block.id, updated);
                      setEditingInsertedBlockId(null);
                    }}
                    onCancel={() => setEditingInsertedBlockId(null)}
                  />
                </div>
              ) : (
                <div className="relative group/block w-full min-h-[30px] flex justify-center py-2">
                  <BgmItem
                    id={block.id}
                    title={block.title || '🎧 BGM'}
                    url={block.url || ''}
                    videoId={block.videoId}
                    startTime={block.startTime}
                    useTimestamp={block.useTimestamp}
                    isPlaying={currentPlayingBgmId === block.id && isGlobalBgmPlaying}
                    onSelectBgm={(track) => onSelectBgmTrack && onSelectBgmTrack(track)}
                  />
                  {!isAnyEditing && onRemoveBlock && (
                    <div className="absolute top-2 right-4 flex items-center gap-1.5 opacity-0 group-hover/block:opacity-100 transition-opacity z-20">
                      <button
                        onClick={() => setEditingInsertedBlockId(block.id)}
                        className={cn(
                          "p-1 rounded border shadow-sm backdrop-blur-sm transition-colors",
                          theme === 'dark'
                            ? "bg-stone-800/80 text-white/60 hover:text-white border-white/10"
                            : "bg-white/90 text-stone-600 hover:text-stone-900 border-stone-200"
                        )}
                        title="수정"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onRemoveBlock(logId, block.id)}
                        className={cn(
                          "p-1 rounded border shadow-sm backdrop-blur-sm transition-colors",
                          theme === 'dark'
                            ? "bg-stone-800/80 text-white/60 hover:text-red-400 border-white/10"
                            : "bg-white/90 text-stone-600 hover:text-red-500 border-stone-200"
                        )}
                        title="삭제"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              )
            )}
            {block.type === 'split' && (
              <div id={`section-${block.id}`} className="mt-1 mb-1 px-4 font-sans relative">
                <div className="flex items-end justify-between max-w-full border-b border-[#e6005c]">
                  <div className="bg-[#e6005c] rounded-t-lg px-4 py-1 flex items-center shadow-lg gap-2">
                    <SectionNameEditor 
                      initialName={block.name || ''}
                      defaultName={(() => {
                        const splitIndex = splitPointsArray.indexOf(idx);
                        return `섹션 ${splitIndex !== -1 ? splitIndex + 2 : 2}`;
                      })()}
                      onSave={(name) => onUpdateBlock(logId, block.id, { name })}
                    />
                    <button onClick={() => onRemoveBlock(logId, block.id)} className="text-white/60 hover:text-white p-1 ml-2 flex-shrink-0" title="섹션 삭제">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className={cn(
                    "text-[10px] font-bold mb-1 ml-4",
                    theme === 'dark' ? "text-white/40" : "text-stone-400"
                  )}>
                    {`${idx + 1} - ${(() => {
                      const _nextIndex = splitPointsArray.findIndex((p: number) => p > idx);
                      return _nextIndex !== -1 ? splitPointsArray[_nextIndex] : mergedLogsCount;
                    })()}번 블록`}
                  </div>
                </div>
              </div>
            )}
            
            <BoundaryEditor 
              id={logId}
              onToggleSplit={() => onAddBlock(logId, i + 1, 'split')}
              onInsertImage={() => onToggleImageInput(logId, i + 1)}
              onInsertBgm={() => onToggleBgmInput && onToggleBgmInput(logId, i + 1)}
              onInsertLog={() => insertLogBlock(log.id, isTopLevel)}
              allowSplit={!(isLastLog && i === blocks.length - 1)}
              disabled={isHoveringButton || isAnyEditing}
              onDropIllustration={(illId) => onUpdateIllustration(illId, { targetLogId: stableId, position: 'after' })}
            />
            {imageInputLoc?.logId === logId && imageInputLoc.insertIndex === i + 1 && (
              <div className={cn(
                "mx-4 my-2 p-4 border border-dashed rounded-xl flex flex-col gap-3",
                theme === 'dark' ? "bg-white/5 border-white/20" : "bg-stone-50 border-stone-200 shadow-sm"
              )}>
                <div className="flex gap-2 items-center">
                  <select 
                    value={tabOverrideValue}
                    onChange={(e) => setTabOverrideValue(e.target.value)}
                    className={cn(
                      "border rounded-lg px-3 py-2 text-[11px] h-9 min-w-[120px] focus:outline-none focus:ring-1 focus:ring-[#e6005c]",
                      theme === 'dark' ? "bg-black/40 text-white border-white/20" : "bg-white text-stone-900 border-stone-200"
                    )}
                  >
                    {orderedTabs.map((tab: any) => (
                      <option key={tab.id} value={tab.id}>
                        {tab.name}
                      </option>
                    ))}
                  </select>
                  <input 
                    type="text" 
                    placeholder="https://..." 
                    value={imageInputVal}
                    onChange={(e) => setImageInputVal(e.target.value)}
                    className={cn(
                      "flex-1 border rounded-lg px-3 py-2 text-[11px] h-9 focus:outline-none focus:ring-1 focus:ring-[#e6005c]",
                      theme === 'dark' ? "bg-black/40 text-white border-white/20" : "bg-white text-stone-900 border-stone-200"
                    )}
                    onKeyDown={(e) => {
                      if (e.nativeEvent.isComposing) return;
                      if (e.key === 'Enter') {
                        const url = imageInputVal.trim();
                        if (url && onAddIllustration) {
                          onAddIllustration(stableId, url, tabOverrideValue);
                        }
                      }
                    }}
                  />
                  <button 
                    onClick={() => {
                      const url = imageInputVal.trim();
                      if (url && onAddIllustration) {
                        onAddIllustration(stableId, url, tabOverrideValue);
                      }
                    }}
                    className="px-4 py-2 bg-[#e6005c] hover:bg-[#ff007f] text-white rounded-lg text-[11px] h-9 font-bold shrink-0 flex items-center justify-center transition-colors"
                  >
                    추가
                  </button>
                  <button
                    onClick={() => onToggleImageInput('', -1)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-[11px] h-9 font-bold shrink-0 flex items-center justify-center transition-colors border",
                      theme === 'dark' ? "bg-white/10 hover:bg-white/20 border-white/10 text-white" : "bg-white hover:bg-stone-50 border-stone-200 text-stone-700"
                    )}
                  >
                    취소
                  </button>
                </div>
              </div>
            )}

            {bgmInputLoc?.logId === logId && bgmInputLoc.insertIndex === i + 1 && (
              <BgmInlineInput
                onSave={(bgmData) => {
                  if (onAddBgmBlock) {
                    onAddBgmBlock(logId, i + 1, bgmData);
                  }
                }}
                onCancel={() => onToggleBgmInput && onToggleBgmInput(logId, i + 1)}
              />
            )}
          </React.Fragment>
        ))}
      </>
    );
  };

  const format = tabSet?.format || 'main';
  const rawColor = char.color || log.color;
  const tabTextColor = tabSet?.textColor;
  const color = tabTextColor || rawColor;
  const nameWeight = tabSet?.isBold !== undefined ? (tabSet.isBold ? 'bold' : 'normal') : 'bold';
  const nameFontStyle = tabSet?.isItalic ? 'italic' : 'normal';
  const otherNameColor = disableOtherColor ? (theme === 'dark' ? '#AAAAAA' : '#777777') : color;
  const contentColor = tabTextColor || (theme === 'dark' ? '#FFFFFF' : '#333333');
  const otherContentColor = tabTextColor || (theme === 'dark' ? '#AAAAAA' : '#777777');
  const contentWeight = tabSet?.isBold ? 'bold' : 'normal';
  const contentFontStyle = tabSet?.isItalic ? 'italic' : 'normal';
  const img = char.imageUrl;
  const isSecret = format === 'secret';
  const tabColor = tabSet?.color || '#ffd400';
  const isNarration = log.charId === narrationCharacter && (format === 'main' || (enableSecretNarration && format === 'secret'));

  const narrationMargin = Math.floor(effectiveBlockSpacing * 1.2 + lineHeight * 6);

  let displayContent = log.content;
  if (log.isCommand) {
    displayContent = displayContent.replace(/シークレットダイス\s*\?\?\?/g, 'Secret dice 🎲');
    displayContent = displayContent.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/(?:\r\n|\r|\n)+/g, ' ');
  }

  let textPieces = [displayContent];
  if (isNarration && enableSentenceSpacing) {
    textPieces = splitNarration(displayContent);
  }

  let formattedPieces = textPieces.map(piece => {
    let pieceHtml = linkifyAndFormat(piece);
    if (log.name === 'system') {
      pieceHtml = pieceHtml.replace(/\[\s*(.*?)\s*\]/g, (match: string, p1: string) => {
        const charChars = charSettings[p1.trim()];
        if (charChars) {
          return `<span style="color: ${charChars.color};">${match}</span>`;
        }
        return match;
      });
    }
    return pieceHtml;
  });

  let displayName = log.name;
  if (searchQuery && isHighlighted) {
    const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const markBg = isCurrentMatch ? '#ff9900' : '#e6005c';
    
    // Highlight content for each piece
    formattedPieces = formattedPieces.map(pieceHtml => {
      const parts = pieceHtml.split(/(<[^>]*>)/);
      for (let i = 0; i < parts.length; i++) {
          if (i % 2 === 0) {
              parts[i] = parts[i].replace(regex, `<mark style="background-color: ${markBg}; color: white; border-radius: 2px; padding: 0 2px;">$1</mark>`);
          }
      }
      return parts.join('');
    });

    // Highlight name
    displayName = displayName.replace(regex, `<mark style="background-color: ${markBg}; color: white; border-radius: 2px; padding: 0 2px;">$1</mark>`);
  }
  
  const safeHtmlContentPieces = useMemo(() => {
    return formattedPieces.map(html => DOMPurify.sanitize(html, { ADD_ATTR: ['target', 'style'] }));
  }, [formattedPieces]);
  const safeHtmlContent = safeHtmlContentPieces[0] || '';
  const safeHtmlName = useMemo(() => DOMPurify.sanitize(displayName), [displayName]);
  
  const getSecretBg = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return theme === 'dark' ? `rgba(${r}, ${g}, ${b}, 0.15)` : `rgba(${r}, ${g}, ${b}, 0.08)`;
  };

  const scale = fontSize / 14;
  const avatarSize = Math.round(avatarSizeValue * scale);
  const gapSize = Math.round(12 * scale);
  const paddingVertical = Math.round(basePaddingVertical * scale);
  const paddingHorizontal = Math.round(contentPadding * scale);
  
  const scaledTextFontSize = textFontSize * scale;
  const scaledLetterSpacing = letterSpacing * scale;
  const textScale = scaledTextFontSize / 14;
  const nameSize = Math.round(13.44 * textScale); // 0.96em of 14px

  const currentBlocks = Array.isArray(insertedBlocks)
    ? insertedBlocks
    : (insertedBlocks[stableId] || []);
  
  const logIllustrations = useMemo(() => {
    if (originalLogIndex === undefined || originalLogIndex === -1) return [];
    return illustrations.filter((ill: any) => ill.afterLogIndex === originalLogIndex);
  }, [illustrations, originalLogIndex]);

  const hasBlockAfter = currentBlocks.length > 0;
  
  const isSplit = hasBlockAfter && currentBlocks.some((b: any) => b.type === 'split');
  const shouldMergeStyle = mergeTabStyles.has(format) && (isPrevSameTab || isNextSameTab);
  
  const isSectionStart = idx === 0 || isPrevBlock;
  const isSectionEnd = idx === mergedLogsCount - 1 || hasBlockAfter;
  
  const mergeWithPrev = log.isContinuation || (shouldMergeStyle && isPrevSameTab && !isSectionStart);
  const mergeWithNext = isNextContinuation || (shouldMergeStyle && isNextSameTab && !isSectionEnd);

  const shouldShowIndex = showTabNames.has(format) && (!isPrevSameTab || isPrevBlock);
  
  let itemMarginTop = '0';
  let itemMarginBottom = '0';

  if (log.isCommand || format === 'secret') {
    itemMarginBottom = mergeWithNext ? '0' : `${effectiveBlockSpacing}px`;
  } else if (isNarration) {
    itemMarginTop = log.isContinuation ? '0' : `${Math.floor(narrationMargin / 2)}px`;
    itemMarginBottom = mergeWithNext ? '0' : `${Math.ceil(narrationMargin / 2)}px`;
  } else {
    itemMarginTop = mergeWithPrev ? '0' : `${Math.floor(effectiveBlockSpacing / 2)}px`;
    itemMarginBottom = mergeWithNext ? '0' : `${Math.ceil(effectiveBlockSpacing / 2)}px`;
  }

  const getSectionRange = () => {
    const sorted = splitPointsArray;
    const splitIdx = sorted.indexOf(idx);
    const start = idx + 2;
    const nextSplitIdx = splitIdx + 1;
    const end = nextSplitIdx < sorted.length ? sorted[nextSplitIdx] + 1 : mergedLogsCount;
    return `${start} - ${end}`;
  };

  const getHasDividerBelow = (i: number) => {
    if (!showLogDivider) return false;
    if (i < 0 || i >= mergedLogsCount - 1) return false;
    const logA = mergedLogs[i];
    const logB = mergedLogs[i + 1];
    if (!logA || !logB) return false;

    const getFormatOf = (l: any) => {
      if (l.isIllustration) {
        const ill = l.illustration || { tabOverride: l.tabOverride || 'auto' };
        const resolvedTabOverride = ill.tabOverride === 'auto' || !ill.tabOverride ? (l.tabId || 'main') : ill.tabOverride;
        const illTabSet = tabSettings[resolvedTabOverride] || tabSettings['main'];
        return illTabSet?.format || 'main';
      }
      const tabSet = tabSettings[l.tabId];
      const formatVal = tabSet?.format || 'main';
      if (l.charId === narrationCharacter && formatVal === 'main') {
        return 'narration';
      }
      return formatVal;
    };

    const formatA = getFormatOf(logA);
    const formatB = getFormatOf(logB);

    const isISA = formatA === 'info' || formatA === 'secret';
    const isISB = formatB === 'info' || formatB === 'secret';
    const isTabNameAndMergeA = isISA && showTabNames.has(formatA) && mergeTabStyles.has(formatA);
    const isTabNameAndMergeB = isISB && showTabNames.has(formatB) && mergeTabStyles.has(formatB);

    // [강제 규칙] 정보/비밀 탭이고 '탭 이름 표시' & '탭별 통합'이 활성화되었을 때, 탭 묶음의 상/하단에는 무조건 구분선 적용
    if (isTabNameAndMergeA && (logA.tabId !== logB.tabId || !isISB)) {
      return true;
    }
    if (isTabNameAndMergeB && (logA.tabId !== logB.tabId || !isISA)) {
      return true;
    }

    // 우선순위 1위: 발언자별 통합 (연속되는 대사 사이사이에는 구분선이 들어가지 않음)
    if (logB.isContinuation) {
      return false;
    }

    // 우선순위 2위: 다이스 및 매크로 (구분선 규칙 유지 - 다이스/매크로도 기본 로그블록 구분선 규칙 따름)

    // 우선순위 3위: 정보 및 비밀탭
    if (isISA || isISB) {
      if (isISA && isISB) {
        if (logA.tabId === logB.tabId) {
          // 같은 탭이면 '탭별 통합'이 활성화되어 있을 때만 구분선이 있음
          return mergeTabStyles.has(formatA);
        } else {
          // 다른 탭인 경우, '탭별 통합'이 활성화되어 있거나 '탭 이름 표시'가 활성화되어 있으면 구분선이 있음
          if (mergeTabStyles.has(formatA) || mergeTabStyles.has(formatB)) {
            return true;
          }
          return showTabNames.has(formatB);
        }
      }
      if (!isISA && isISB) {
        // 가장 첫 정보/비밀 위: '탭 이름 표시'가 활성화되어 있다면 구분선이 있음
        return showTabNames.has(formatB);
      }
      if (isISA && !isISB) {
        // 가장 마지막 정보/비밀 아래: 해당 비밀/정보탭의 '탭 이름 표시'가 활성화되어 있을 때만 구분선이 들어감
        return showTabNames.has(formatA);
      }
    }

    // 우선순위 4위: 잡담 탭 (잡담끼리는 하나로 취급해 사이사이에 구분선 없고, 첫 잡담 위와 마지막 잡담 아래에만 선이 있음)
    const isChatA = formatA === 'other';
    const isChatB = formatB === 'other';
    if (isChatA || isChatB) {
      if (isChatA && isChatB) {
        return false;
      }
      return true;
    }

    // 그 외 일반적인 경우 (기본)
    const isSameTab = logA.tab === logB.tab;
    const shouldMergeA = mergeTabStyles.has(formatA);
    if (shouldMergeA && isSameTab) {
      return false;
    }

    return true;
  };

  const hasDividerBelow = useMemo(() => {
    return getHasDividerBelow(idx);
  }, [idx, mergedLogsCount, mergedLogs, tabSettings, narrationCharacter, showTabNames, mergeTabStyles, showLogDivider]);

  const hasDividerAbove = useMemo(() => {
    return idx > 0 ? getHasDividerBelow(idx - 1) : false;
  }, [idx, mergedLogsCount, mergedLogs, tabSettings, narrationCharacter, showTabNames, mergeTabStyles, showLogDivider]);

  const prevLog = idx > 0 ? mergedLogs[idx - 1] : null;
  const prevFormat = useMemo(() => {
    if (!prevLog) return null;
    if (prevLog.isCommand) return 'command';
    const tabSet = tabSettings[prevLog.tabId];
    const formatVal = tabSet?.format || 'main';
    if (prevLog.charId === narrationCharacter && formatVal === 'main') {
      return 'narration';
    }
    return formatVal;
  }, [prevLog, tabSettings, narrationCharacter]);

  const nextLog = idx < mergedLogsCount - 1 ? mergedLogs[idx + 1] : null;
  const nextFormat = useMemo(() => {
    if (!nextLog) return null;
    if (nextLog.isCommand) return 'command';
    const tabSet = tabSettings[nextLog.tabId];
    const formatVal = tabSet?.format || 'main';
    if (nextLog.charId === narrationCharacter && formatVal === 'main') {
      return 'narration';
    }
    return formatVal;
  }, [nextLog, tabSettings, narrationCharacter]);

  const isSpecialDividerBelow = useMemo(() => {
    if (!nextLog) return false;
    if (log.tabId === nextLog.tabId) return false;
    const isSpecialFormat = (f: string | null) => f === 'info' || f === 'secret' || f === 'other';
    return isSpecialFormat(format) || isSpecialFormat(nextFormat);
  }, [log.tabId, nextLog, format, nextFormat]);

  const isSpecialDividerAbove = useMemo(() => {
    if (!prevLog) return false;
    if (log.tabId === prevLog.tabId) return false;
    const isSpecialFormat = (f: string | null) => f === 'info' || f === 'secret' || f === 'other';
    return isSpecialFormat(format) || isSpecialFormat(prevFormat);
  }, [log.tabId, prevLog, format, prevFormat]);

  const hasSpecialDividerBelow = useMemo(() => {
    return hasDividerBelow && isSpecialDividerBelow;
  }, [hasDividerBelow, isSpecialDividerBelow]);

  const hasSpecialDividerAbove = useMemo(() => {
    return hasDividerAbove && isSpecialDividerAbove;
  }, [hasDividerAbove, isSpecialDividerAbove]);

  const nextShouldShowIndex = useMemo(() => {
    if (!nextLog) return false;
    const tabSet = tabSettings[nextLog.tabId];
    const nFormat = tabSet?.format || 'main';
    const isSameTab = log.tabId === nextLog.tabId;
    return showTabNames.has(nFormat) && (!isSameTab || hasBlockAfter);
  }, [nextLog, log.tabId, tabSettings, showTabNames, hasBlockAfter]);

  const dividerMarginTop = useMemo(() => {
    if (!hasSpecialDividerBelow) return 0;
    if (format === 'main') {
      return 0;
    }
    return 12;
  }, [hasSpecialDividerBelow, format]);

  const dividerMarginBottom = useMemo(() => {
    if (!hasSpecialDividerBelow) return 0;
    if (nextFormat === 'main') {
      if (nextShouldShowIndex) {
        return 12;
      }
      return 0;
    }
    return 12;
  }, [hasSpecialDividerBelow, nextFormat, nextShouldShowIndex]);

  const hasSpecialDividerAboveAndNoBadge = useMemo(() => {
    return hasSpecialDividerAbove && !shouldShowIndex;
  }, [hasSpecialDividerAbove, shouldShowIndex]);

  const finalItemMarginTop = useMemo(() => {
    if (hasSpecialDividerAboveAndNoBadge) return '0';
    return itemMarginTop;
  }, [hasSpecialDividerAboveAndNoBadge, itemMarginTop]);

  if (log.isBgmBlock) {
    const bgmData = log.bgmData || {};
    
    if (isEditing) {
      return (
        <div className="w-full relative">
          <BgmInlineInput
            initialTitle={bgmData.title}
            initialUrl={bgmData.url}
            initialUseTimestamp={bgmData.useTimestamp}
            isEditing={true}
            onSave={(updated) => {
              if (onBatchUpdateLog) onBatchUpdateLog(log.id, { bgmData: { ...bgmData, ...updated } });
              setEditingLogId(null);
            }}
            onCancel={() => setEditingLogId(null)}
          />
        </div>
      );
    }

    return (
      <div 
        className={cn("log-item-wrapper relative group/item w-full min-h-[30px] flex flex-col justify-center", isHighlighted ? 'bg-[#ffd400]/20' : '')}
        style={{
          marginTop: `${Math.floor(effectiveBlockSpacing / 2)}px`,
          marginBottom: `${Math.ceil(effectiveBlockSpacing / 2)}px`
        }}
      >
        {isCurrentMatch && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#e6005c] shadow-[0_0_10px_rgba(230,0,92,0.5)] z-10" />
        )}
        <div className="w-full flex justify-center py-2 relative group/img">
          <BgmItem
            id={bgmData.id || log.id}
            title={bgmData.title || '🎧 BGM'}
            url={bgmData.url || ''}
            videoId={bgmData.videoId}
            startTime={bgmData.startTime}
            useTimestamp={bgmData.useTimestamp}
            isPlaying={currentPlayingBgmId === (bgmData.id || log.id) && isGlobalBgmPlaying}
            onSelectBgm={(track) => onSelectBgmTrack && onSelectBgmTrack(track)}
          />
        </div>
        {!isAnyEditing && (
          <div 
            onMouseEnter={() => setIsHoveringButton(true)}
            onMouseLeave={() => setIsHoveringButton(false)}
            className="absolute top-2 right-4 flex items-center gap-1.5 opacity-0 group-hover/item:opacity-100 transition-opacity z-20"
          >
            <div className="bg-black/85 text-white/95 border border-white/10 rounded px-1.5 py-0.5 text-[9.5px] font-bold font-mono tracking-wider shadow-md leading-none">
              #{originalLogIndex + 1}
            </div>

            <button
              onClick={() => onMoveLog(log.id, 'up')}
              disabled={idx === 0}
              className={cn(
                "p-1 rounded border shadow-sm backdrop-blur-sm transition-colors",
                theme === 'dark' 
                  ? "bg-stone-800/80 text-white/60 border-white/10" 
                  : "bg-white/90 text-stone-600 border-stone-200",
                idx === 0 
                  ? "opacity-30 cursor-not-allowed" 
                  : (theme === 'dark' ? "hover:text-white" : "hover:text-stone-900")
              )}
              title="위로 이동"
            >
              <ArrowUp className="w-3 h-3" />
            </button>
            <button
              onClick={() => onMoveLog(log.id, 'down')}
              disabled={idx === mergedLogsCount - 1}
              className={cn(
                "p-1 rounded border shadow-sm backdrop-blur-sm transition-colors",
                theme === 'dark' 
                  ? "bg-stone-800/80 text-white/60 border-white/10" 
                  : "bg-white/90 text-stone-600 border-stone-200",
                idx === mergedLogsCount - 1 
                  ? "opacity-30 cursor-not-allowed" 
                  : (theme === 'dark' ? "hover:text-white" : "hover:text-stone-900")
              )}
              title="아래로 이동"
            >
              <ArrowDown className="w-3 h-3" />
            </button>

            <button
              onClick={() => setEditingLogId(log.id)}
              className={cn(
                "p-1 rounded border shadow-sm backdrop-blur-sm transition-colors",
                theme === 'dark'
                  ? "bg-stone-800/80 text-white/60 hover:text-white border-white/10"
                  : "bg-white/90 text-stone-600 hover:text-stone-900 border-stone-200"
              )}
              title="수정"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              onClick={() => onDeleteLog(log.id)}
              className={cn(
                "p-1 rounded border shadow-sm backdrop-blur-sm transition-colors",
                theme === 'dark'
                  ? "bg-stone-800/80 text-white/60 hover:text-red-400 border-white/10"
                  : "bg-white/90 text-stone-600 hover:text-red-500 border-stone-200"
              )}
              title="삭제"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    );
  }

  if (log.isIllustration) {
    const ill = log.illustration || {
      id: log.id,
      url: log.content,
      tabOverride: log.tabOverride || 'auto',
      width: log.width,
      align: log.align || 'center'
    };
    const resolvedTabOverride = ill.tabOverride === 'auto' || !ill.tabOverride ? (log.tabId || 'main') : ill.tabOverride;
    const illTabSet = tabSettings[resolvedTabOverride] || tabSettings['main'] || Object.values(tabSettings)[0];
    const illFormat = illTabSet?.format || 'main';
    const illIsSecret = illFormat === 'secret';
    const illTabColor = illTabSet?.color || '#ffd400';

    const align = ill.align || 'center';
    const justify = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start';

    const isFirstInSection = !isPrevSameTab;
    const isLastInSection = !isNextSameTab;

    let contentPaddingValue = contentPadding;
    if (typeof contentPaddingValue !== 'number') {
      contentPaddingValue = parseFloat(contentPaddingValue) || 15.5;
    }

    const scale = fontSize / 14;
    const paddingHorizontal = contentPaddingValue * scale;
    const paddingVertical = basePaddingVertical * scale;

    const renderHeader = showTabNames.has(illFormat) && isFirstInSection;

    return (
      <div 
        className={cn(
          "log-item-wrapper group/item relative min-h-[30px] flex flex-col justify-center",
          dragOverPart === 'top' && "is-drag-over-top",
          dragOverPart === 'bottom' && "is-drag-over-bottom"
        )}
        style={{
          marginTop: isFirstInSection ? `${Math.round(paddingVertical)}px` : '4px',
          marginBottom: isLastInSection ? `${Math.round(paddingVertical)}px` : '4px',
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {dragOverPart === 'top' && (
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#e6005c] z-40 pointer-events-none" />
        )}
        {dragOverPart === 'bottom' && (
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#e6005c] z-40 pointer-events-none" />
        )}
        {idx === 0 && renderBlocks(startBlocks, '__start__', true)}
        {renderHeader && (
          <div style={{ margin: `${hasSpecialDividerAbove ? 0 : 12}px ${r(paddingHorizontal)}px 8px ${r(paddingHorizontal)}px`, display: 'flex' }}>
            <div style={{ 
              background: getSecretBg(illTabColor), 
              color: illTabColor,
              padding: '2px 10px',
              borderRadius: '4px',
              fontSize: `${r(nameSize * 0.8)}px`,
              fontWeight: 'bold',
              border: `1px solid ${illTabColor}44`
            }}>
              {illTabSet?.name || 'Unknown'}
            </div>
          </div>
        )}

        {!isAnyEditing && (
          <div 
            onMouseEnter={() => setIsHoveringButton(true)}
            onMouseLeave={() => setIsHoveringButton(false)}
            className="absolute top-2 right-4 flex items-center gap-1.5 opacity-0 group-hover/item:opacity-100 transition-opacity z-20"
          >
            <div className="bg-black/85 text-white/95 border border-white/10 rounded px-1.5 py-0.5 text-[9.5px] font-bold font-mono tracking-wider shadow-md leading-none">
              #{originalLogIndex + 1}
            </div>

            <button
              onClick={() => onMoveLog(log.id, 'up')}
              disabled={idx === 0}
              className={cn(
                "p-1 rounded border shadow-sm backdrop-blur-sm transition-colors",
                theme === 'dark' 
                  ? "bg-stone-800/80 text-white/60 border-white/10" 
                  : "bg-white/90 text-stone-600 border-stone-200",
                idx === 0 
                  ? "opacity-30 cursor-not-allowed" 
                  : (theme === 'dark' ? "hover:text-white" : "hover:text-stone-900")
              )}
              title="위로 이동"
            >
              <ArrowUp className="w-3 h-3" />
            </button>
            <button
              onClick={() => onMoveLog(log.id, 'down')}
              disabled={idx === mergedLogsCount - 1}
              className={cn(
                "p-1 rounded border shadow-sm backdrop-blur-sm transition-colors",
                theme === 'dark' 
                  ? "bg-stone-800/80 text-white/60 border-white/10" 
                  : "bg-white/90 text-stone-600 border-stone-200",
                idx === mergedLogsCount - 1 
                  ? "opacity-30 cursor-not-allowed" 
                  : (theme === 'dark' ? "hover:text-white" : "hover:text-stone-900")
              )}
              title="아래로 이동"
            >
              <ArrowDown className="w-3 h-3" />
            </button>

            <button
              onClick={() => setEditingLogId(log.id)}
              className={cn(
                "p-1 rounded border shadow-sm backdrop-blur-sm transition-colors",
                theme === 'dark'
                  ? "bg-stone-800/80 text-white/60 hover:text-white border-white/10"
                  : "bg-white/90 text-stone-600 hover:text-stone-900 border-stone-200"
              )}
              title="수정"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button 
              onClick={() => onDeleteLog(log.id)}
              className={cn(
                "p-1 rounded border shadow-sm backdrop-blur-sm transition-colors",
                theme === 'dark' 
                  ? "bg-stone-800/80 text-white/60 hover:text-red-400 border-white/10" 
                  : "bg-white/90 text-stone-600 hover:text-red-500 border-stone-200"
              )}
              title="삭제"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}

        {isEditing ? (
          <div className="w-full flex justify-center py-2 relative">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const url = formData.get('url') as string;
                if (onUpdateIllustration) {
                  onUpdateIllustration(ill.id, { url }); // Map to URL for App.tsx
                }
                setEditingLogId(null);
              }}
              className={cn(
                "mx-4 my-2 p-4 border border-dashed rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full max-w-lg",
                theme === 'dark' ? "bg-white/5 border-white/20 text-white" : "bg-stone-50 border-stone-200 text-stone-800 shadow-sm"
              )}
            >
              <input
                name="url"
                type="text"
                defaultValue={ill.url}
                placeholder="이미지 URL"
                className={cn(
                  "px-3 py-2 text-[11px] h-9 rounded-lg border focus:outline-none focus:ring-1 focus:ring-[#e6005c] flex-1",
                  theme === 'dark' ? 'bg-black/40 border-white/20 text-white placeholder-white/30' : 'bg-white border-stone-200 text-stone-900 placeholder-stone-400'
                )}
                required
              />
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#e6005c] hover:bg-[#ff007f] text-white rounded-lg text-[11px] h-9 font-bold flex-1 sm:flex-none flex items-center justify-center transition-colors"
                >
                  저장
                </button>
                <button
                  type="button"
                  onClick={() => setEditingLogId(null)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-[11px] h-9 font-bold flex-1 sm:flex-none flex items-center justify-center transition-colors border",
                    theme === 'dark' ? "bg-white/10 hover:bg-white/20 border-white/10 text-white" : "bg-white hover:bg-stone-50 border-stone-200 text-stone-700"
                  )}
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        ) : illFormat === 'info' ? (
          <div
            style={{
              paddingTop: `${Math.round(12 * scale)}px`,
              paddingBottom: `${Math.round(12 * scale)}px`,
              paddingLeft: `${Math.round(paddingHorizontal)}px`,
              paddingRight: `${Math.round(paddingHorizontal)}px`,
              background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
              borderLeft: `4px solid ${theme === 'dark' ? '#444' : '#DDD'}`,
              marginLeft: `${Math.round(paddingHorizontal)}px`,
              marginRight: `${Math.round(paddingHorizontal)}px`,
              borderRadius: '4px',
              display: 'flex',
              justifyContent: justify
            }}
          >
            <LogImage
              url={ill.url}
              width={ill.width}
              align={ill.align || 'center'}
              onUpdateWidth={(w: string) => onUpdateIllustration && onUpdateIllustration(ill.id, { width: w })}
              onUpdateAlign={(a: 'left' | 'center' | 'right') => onUpdateIllustration && onUpdateIllustration(ill.id, { align: a })}
              paddingSize={0}
              tabOverride={ill.tabOverride}
              onUpdateTabOverride={(tabId: string) => onUpdateIllustration && onUpdateIllustration(ill.id, { tabOverride: tabId })}
            />
          </div>
        ) : illFormat === 'secret' ? (
          <div
            style={{
              paddingTop: `${paddingVertical}px`,
              paddingBottom: `${paddingVertical}px`,
              paddingLeft: `${Math.round(paddingHorizontal)}px`,
              paddingRight: `${Math.round(paddingHorizontal)}px`,
              background: getSecretBg(illTabColor),
              borderLeft: `4px solid ${illTabColor}`,
              marginLeft: `${Math.round(paddingHorizontal)}px`,
              marginRight: `${Math.round(paddingHorizontal)}px`,
              borderRadius: '4px',
              display: 'flex',
              justifyContent: justify
            }}
          >
            <LogImage
              url={ill.url}
              width={ill.width}
              align={ill.align || 'center'}
              onUpdateWidth={(w: string) => onUpdateIllustration && onUpdateIllustration(ill.id, { width: w })}
              onUpdateAlign={(a: 'left' | 'center' | 'right') => onUpdateIllustration && onUpdateIllustration(ill.id, { align: a })}
              paddingSize={0}
              tabOverride={ill.tabOverride}
              onUpdateTabOverride={(tabId: string) => onUpdateIllustration && onUpdateIllustration(ill.id, { tabOverride: tabId })}
            />
          </div>
        ) : (
          <div 
            style={{ 
              marginLeft: `${Math.round(paddingHorizontal)}px`,
              marginRight: `${Math.round(paddingHorizontal)}px`,
              display: 'flex', 
              justifyContent: justify 
            }}
          >
            <LogImage
              url={ill.url}
              width={ill.width}
              align={ill.align || 'center'}
              onUpdateWidth={(w: string) => onUpdateIllustration && onUpdateIllustration(ill.id, { width: w })}
              onUpdateAlign={(a: 'left' | 'center' | 'right') => onUpdateIllustration && onUpdateIllustration(ill.id, { align: a })}
              paddingSize={0}
              tabOverride={ill.tabOverride}
              onUpdateTabOverride={(tabId: string) => onUpdateIllustration && onUpdateIllustration(ill.id, { tabOverride: tabId })}
            />
          </div>
        )}

        {hasDividerBelow && !isSplit && (
          <div 
            style={{
              marginTop: `${r(dividerMarginTop * scale)}px`,
              marginBottom: `${r(dividerMarginBottom * scale)}px`,
              marginLeft: ((format === 'info' || format === 'secret') && mergeWithNext) ? `${r(paddingHorizontal)}px` : '0',
              marginRight: ((format === 'info' || format === 'secret') && mergeWithNext) ? `${r(paddingHorizontal)}px` : '0',
              background: ((format === 'info' || format === 'secret') && mergeWithNext) 
                ? (format === 'secret' ? getSecretBg(tabColor) : (theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)')) 
                : 'transparent',
              borderLeft: ((format === 'info' || format === 'secret') && mergeWithNext)
                ? (format === 'secret' ? `4px solid ${tabColor}` : `4px solid ${theme === 'dark' ? '#444' : '#DDD'}`)
                : 'none',
              paddingLeft: `${r(paddingHorizontal)}px`,
              paddingRight: `${r(paddingHorizontal)}px`
            }}
            className="w-full flex items-center justify-stretch pointer-events-none mt-4"
          >
            <div 
              className={cn(
                "w-full border-b-[1px]",
                theme === 'dark' 
                  ? "border-white/8" 
                  : "border-black/10"
              )}
            />
          </div>
        )}

        {renderBlocks(insertedBlocks, stableId)}
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "log-item-wrapper group/item relative min-h-[30px] flex flex-col justify-center",
        isEditing && "is-editing",
        isHighlighted && searchQuery && (
          isCurrentMatch 
            ? (theme === 'dark' ? "bg-[#ff9900]/20" : "bg-[#ff9900]/10")
            : (theme === 'dark' ? "bg-[#e6005c]/10" : "bg-[#e6005c]/5")
        ),
        dragOverPart === 'top' && "is-drag-over-top",
        dragOverPart === 'bottom' && "is-drag-over-bottom"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {dragOverPart === 'top' && (
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#e6005c] z-40 pointer-events-none" />
      )}
      {dragOverPart === 'bottom' && (
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#e6005c] z-40 pointer-events-none" />
      )}
      {idx === 0 && renderBlocks(startBlocks, '__start__', true)}
      {!isEditing && !isAnyEditing && (
        <div 
          onMouseEnter={() => setIsHoveringButton(true)}
          onMouseLeave={() => setIsHoveringButton(false)}
          className="absolute top-2 right-4 flex items-center gap-1.5 opacity-0 group-hover/item:opacity-100 transition-opacity z-20"
        >
          <div className="bg-black/85 text-white/95 border border-white/10 rounded px-1.5 py-0.5 text-[9.5px] font-bold font-mono tracking-wider shadow-md leading-none">
            #{originalLogIndex + 1}
          </div>
          
          <button 
            onClick={() => onMoveLog(log.id, 'up')}
            disabled={idx === 0}
            className={cn(
              "p-1 rounded border shadow-sm backdrop-blur-sm transition-colors",
              theme === 'dark' 
                ? "bg-stone-800/80 text-white/60 border-white/10" 
                : "bg-white/90 text-stone-600 border-stone-200",
              idx === 0 
                ? "opacity-30 cursor-not-allowed" 
                : (theme === 'dark' ? "hover:text-white" : "hover:text-stone-900")
            )}
            title="위로 이동"
          >
            <ArrowUp className="w-3 h-3" />
          </button>
          <button 
            onClick={() => onMoveLog(log.id, 'down')}
            disabled={idx === mergedLogsCount - 1}
            className={cn(
              "p-1 rounded border shadow-sm backdrop-blur-sm transition-colors",
              theme === 'dark' 
                ? "bg-stone-800/80 text-white/60 border-white/10" 
                : "bg-white/90 text-stone-600 border-stone-200",
              idx === mergedLogsCount - 1 
                ? "opacity-30 cursor-not-allowed" 
                : (theme === 'dark' ? "hover:text-white" : "hover:text-stone-900")
            )}
            title="아래로 이동"
          >
            <ArrowDown className="w-3 h-3" />
          </button>

          <button 
            onClick={() => { setEditingLogId(log.id); setEditContent(markdownToHtml(log.content)); setEditCharId(log.charId); }} 
            className={cn(
              "p-1 rounded border shadow-sm backdrop-blur-sm transition-colors",
              theme === 'dark' 
                ? "bg-stone-800/80 text-white/60 hover:text-white border-white/10" 
                : "bg-white/90 text-stone-600 hover:text-stone-900 border-stone-200"
            )}
            title="수정"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button 
            onClick={() => onDeleteLog(log.id)} 
            className={cn(
              "p-1 rounded border shadow-sm backdrop-blur-sm transition-colors",
              theme === 'dark' 
                ? "bg-stone-800/80 text-white/60 hover:text-red-400 border-white/10" 
                : "bg-white/90 text-stone-600 hover:text-red-500 border-stone-200"
            )}
            title="삭제"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}

        {!log.isHiddenContent && shouldShowIndex && (
          <div style={{ margin: `${hasSpecialDividerAbove ? 0 : 12}px ${r(paddingHorizontal)}px 8px ${r(paddingHorizontal)}px`, display: 'flex' }}>
            <div style={{ 
              background: getSecretBg(tabColor), 
              color: tabColor,
              padding: '2px 10px',
              borderRadius: '4px',
              fontSize: `${r(nameSize * 0.8)}px`,
              fontWeight: 'bold',
              border: `1px solid ${tabColor}44`
            }}>
              {log.tab}
            </div>
          </div>
        )}
        
        {!log.isHiddenContent && (
          <div className="log-item" style={{ 
            marginBottom: itemMarginBottom,
            marginTop: finalItemMarginTop
          }}>
            {isEditing ? (
            <div 
              className="w-full my-1.5" 
              style={{ paddingLeft: `${r(paddingHorizontal)}px`, paddingRight: `${r(paddingHorizontal)}px` }}
              onKeyDown={(e) => {
                if (e.nativeEvent.isComposing) return;
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleConfirm();
                }
              }}
            >
              <div className={cn(
                "p-2 rounded-lg flex flex-col gap-2 border",
                theme === 'dark' ? "bg-black/20 border-white/10" : "bg-stone-100 border-stone-200 shadow-sm"
              )}>
                {/* Header Control Row (above the Textarea) */}
                <div className="flex items-center justify-between gap-3 pb-0.5">
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("text-[10px] whitespace-nowrap font-medium shrink-0", theme === 'dark' ? "text-white/40" : "text-stone-500")}>탭:</span>
                      <SearchableSelect
                        value={editTabId}
                        onChange={(val) => setEditTabId(val)}
                        options={(tabOrder || Object.keys(tabSettings)).map((tId: string) => {
                          const tab = tabSettings[tId];
                          return { label: tab?.name || tId, value: tId, color: tab?.color };
                        })}
                        placeholder="선택 안 함"
                        className="w-[120px] text-xs"
                        theme={theme}
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={cn("text-[10px] whitespace-nowrap font-medium shrink-0", theme === 'dark' ? "text-white/40" : "text-stone-500")}>발언자:</span>
                      <SearchableSelect
                        value={editCharId}
                        onChange={(val) => setEditCharId(val)}
                        options={Object.values(charSettings).map((c: any) => ({ label: c.name, value: c.id, color: c.color }))}
                        placeholder="선택 안 함"
                        className="w-[120px] text-xs"
                        theme={theme}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-1 shrink-0">
                    <button 
                      onClick={handleCancel} 
                      className={cn(
                        "px-2 py-1 text-[11px] font-medium transition-colors",
                        theme === 'dark' ? "text-white/40 hover:text-white" : "text-stone-500 hover:text-stone-800"
                      )}
                    >
                      취소
                    </button>
                    <button 
                      onClick={handleConfirm} 
                      className="px-3 py-1 bg-[#e6005c] text-white rounded text-[11px] font-medium hover:bg-[#ff0066] transition-colors shadow-sm"
                    >
                      확인
                    </button>
                  </div>
                </div>

                
                {/* React Quill Editor */}
                <div className={cn("quill-editor-container relative", theme === 'dark' ? "is-dark" : "is-light")} style={{ minHeight: '64px' }}>
                  {/* Custom Slim Quill Toolbar */}
                  <div 
                    id={toolbarId} 
                    className={cn(
                      "ql-toolbar ql-snow flex items-center flex-wrap gap-0.5 rounded-t-md border border-b-0",
                      theme === 'dark' ? "bg-[#1f1f25] border-white/15 text-white" : "bg-stone-100 border-stone-300 text-stone-800"
                    )}
                    style={{ minHeight: '26px', padding: '3px 6px' }}
                  >
                    <span className="ql-formats flex items-center gap-0.5 m-0! p-0!">
                      <button className="ql-bold" title="굵게" style={{ width: '20px', height: '20px', padding: '1px' }} />
                      <button className="ql-italic" title="기울임" style={{ width: '20px', height: '20px', padding: '1px' }} />
                      <button className="ql-underline" title="밑줄" style={{ width: '20px', height: '20px', padding: '1px' }} />
                      <button className="ql-strike" title="취소선" style={{ width: '20px', height: '20px', padding: '1px' }} />
                    </span>

                    {/* 깔끔한 세로 구분선 */}
                    <div className="w-[1px] h-3 bg-stone-200 dark:bg-white/10 mx-1 self-center shrink-0" />

                    <span className="ql-formats flex items-center gap-1 m-0! p-0!">
                      {/* 글자색 버튼 */}
                      <button
                        type="button"
                        onMouseDown={(e) => handleOpenCustomColor(e, 'foreColor')}
                        className={cn(
                          "flex flex-col items-center justify-center rounded transition-colors cursor-pointer hover:bg-stone-200 dark:hover:bg-stone-700/60 p-0.5 shrink-0",
                          theme === 'dark' ? "text-stone-200" : "text-stone-800"
                        )}
                        style={{ width: '20px', height: '20px' }}
                        title="글자색 선택"
                      >
                        <span className="font-serif font-black text-[11px] leading-none">A</span>
                        <span className="w-3 h-[2px] rounded-full bg-red-500 mt-[1px]" />
                      </button>

                      {/* 하이라이트/배경색 버튼 */}
                      <button
                        type="button"
                        onMouseDown={(e) => handleOpenCustomColor(e, 'backColor')}
                        className={cn(
                          "flex flex-col items-center justify-center rounded transition-colors cursor-pointer hover:bg-stone-200 dark:hover:bg-stone-700/60 p-0.5 shrink-0",
                          theme === 'dark' ? "text-stone-200" : "text-stone-800"
                        )}
                        style={{ width: '20px', height: '20px' }}
                        title="하이라이트색 선택"
                      >
                        <span className="font-serif font-black text-[11px] leading-none bg-yellow-300 dark:bg-yellow-400 text-stone-900 px-0.5 rounded-2xs">A</span>
                      </button>
                    </span>

                    {/* 깔끔한 세로 구분선 */}
                    <div className="w-[1px] h-3 bg-stone-200 dark:bg-white/10 mx-1 self-center shrink-0" />

                    <span className="ql-formats flex items-center gap-0.5 m-0! p-0!">
                      <button className="ql-clean" title="서식 지우기" style={{ width: '20px', height: '20px', padding: '1px' }} />
                    </span>
                  </div>

                  <ReactQuillComponent 
                    ref={quillRef}
                    value={editContent}
                    onChange={setEditContent}
                    modules={quillModules}
                    theme="snow"
                    className={cn(
                      "w-full text-[13px] rounded-b-md outline-none",
                      theme === 'dark' ? "bg-black/35 text-white quill-dark" : "bg-white text-stone-800"
                    )}
                  />

                  {customColorPickerTarget && customColorTriggerRect && (
                    <EditorColorPickerPopup
                      title={customColorPickerTarget === 'foreColor' ? '글자색 선택' : '하이라이트색 선택'}
                      color={customColorVal}
                      triggerRect={customColorTriggerRect}
                      onClose={() => setCustomColorPickerTarget(null)}
                      onChange={(color) => setCustomColorVal(color)}
                      onChangeComplete={(color) => {
                        setCustomColorVal(color);
                        const quill = quillRef.current?.getEditor();
                        if (quill) {
                          if (savedQuillRange.current) {
                            quill.setSelection(savedQuillRange.current.index, savedQuillRange.current.length);
                          }
                          const formatName = customColorPickerTarget === 'foreColor' ? 'color' : 'background';
                          quill.format(formatName, color);
                        }
                        setCustomColorPickerTarget(null);
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          ) : log.isCommand ? (
            <div key="command" style={{ 
              background: isSecret ? getSecretBg(tabColor) : 'rgba(0,0,0,0.1)',
              border: `1px solid ${theme === 'dark' ? '#444' : '#DDD'}`,
              padding: `${r(12 * scale)}px ${r(paddingHorizontal)}px`,
              borderRadius: '8px',
              margin: `${hasSpecialDividerAboveAndNoBadge ? 0 : 8}px ${r(paddingHorizontal)}px`,
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              lineHeight: 1.6, // 다이스 매크로는 스페이싱 영향X
              letterSpacing: letterSpacing === 0 ? 'normal' : `${scaledLetterSpacing}px`
            }}>
              {log.name !== 'system' && <span style={{ color, fontWeight: 'bold', fontFamily: "'NanumGothicCodingLigature', monospace", fontSize: `${scaledTextFontSize}px` }}>[ <span dangerouslySetInnerHTML={{ __html: safeHtmlName }} /> ]</span>}
              <span style={{ color: theme === 'dark' ? '#FFFFFF' : '#333333', fontSize: `${scaledTextFontSize}px`, fontWeight: 'bold', fontFamily: "'NanumGothicCodingLigature', monospace", marginLeft: log.name !== 'system' ? '8px' : '0', wordBreak: 'keep-all', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: safeHtmlContent }} />
            </div>
          ) : (isNarration && narrationFormat === 'style3') ? (
            <div key="narration-style2" className={cn(
              log.isContinuation && "pt-1 border-t-0 rounded-t-none",
              isNextContinuation && "pb-1 border-b-0 rounded-b-none"
            )} style={{ 
              display: 'flex',
              gap: '16px', 
              paddingTop: log.isContinuation ? undefined : `${paddingVertical}px`,
              paddingBottom: isNextContinuation ? undefined : `${mergeWithNext ? 4 : paddingVertical}px`,
              paddingLeft: `${r(paddingHorizontal)}px`,
              paddingRight: `${r(paddingHorizontal)}px`,
              alignItems: 'flex-start',
              background: isSecret ? getSecretBg(tabColor) : 'transparent',
              borderLeft: isSecret ? `4px solid ${tabColor}` : 'none',
              marginTop: isSecret ? (hasSpecialDividerAboveAndNoBadge ? '0' : (mergeWithPrev ? '0' : '4px')) : '0',
              marginBottom: isSecret ? (mergeWithNext ? '0' : (hasSpecialDividerBelow ? '0' : '4px')) : '0',
              marginLeft: isSecret ? `${r(paddingHorizontal)}px` : '0',
              marginRight: isSecret ? `${r(paddingHorizontal)}px` : '0',
              borderTopLeftRadius: mergeWithPrev && isSecret ? '0' : (isSecret ? '4px' : '0'),
              borderTopRightRadius: mergeWithPrev && isSecret ? '0' : (isSecret ? '4px' : '0'),
              borderBottomLeftRadius: mergeWithNext && isSecret ? '0' : (isSecret ? '4px' : '0'),
              borderBottomRightRadius: mergeWithNext && isSecret ? '0' : (isSecret ? '4px' : '0')
            }}>
              <div style={{ fontWeight: nameWeight, fontStyle: nameFontStyle, color, fontSize: `${nameSize}px`, width: 'var(--name-col-width, 120px)', flexShrink: 0, textAlign: 'right' }}>
                {!log.isContinuation && (
                  <span className="cursor-default" dangerouslySetInnerHTML={{ __html: safeHtmlName + ':' }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0, lineHeight: lineHeight, letterSpacing: letterSpacing === 0 ? 'normal' : `${scaledLetterSpacing}px` }}>
                {safeHtmlContentPieces.map((piece, pIdx) => (
                  <React.Fragment key={`${log.id}-narration-s2-${pIdx}`}>
                    {pIdx > 0 && <div style={{ marginTop: '0.8em' }}></div>}
                    <div dangerouslySetInnerHTML={{ __html: piece }} style={{ color: contentColor, fontSize: `${scaledTextFontSize}px`, fontWeight: tabSet?.isBold !== undefined ? contentWeight : 'bold', fontStyle: contentFontStyle, whiteSpace: 'pre-wrap', wordBreak: 'keep-all', overflowWrap: 'break-word' }} />
                  </React.Fragment>
                ))}
              </div>
            </div>
          ) : isNarration ? (
            <div key="narration" className="narration-row" style={{ 
              paddingTop: log.isContinuation ? '0.4em' : `${r(12 * scale)}px`,
              paddingBottom: isNextContinuation ? '0.4em' : `${r(12 * scale)}px`,
              paddingLeft: `${r(paddingHorizontal)}px`,
              paddingRight: `${r(paddingHorizontal)}px`,
              textAlign: 'center',
              color: contentColor,
              lineHeight: lineHeight,
              fontSize: `${scaledTextFontSize}px`,
              letterSpacing: letterSpacing === 0 ? 'normal' : `${scaledLetterSpacing}px`,
              fontWeight: tabSet?.isBold !== undefined ? contentWeight : 'bold',
              fontStyle: tabSet?.isItalic !== undefined ? contentFontStyle : (narrationFormat === 'style1' ? 'italic' : 'normal'),
              background: isSecret ? getSecretBg(tabColor) : 'transparent',
              borderLeft: isSecret ? `4px solid ${tabColor}` : 'none',
              marginTop: isSecret ? (hasSpecialDividerAboveAndNoBadge ? '0' : (mergeWithPrev ? '0' : '4px')) : '0',
              marginBottom: isSecret ? (mergeWithNext ? '0' : (hasSpecialDividerBelow ? '0' : '4px')) : '0',
              marginLeft: isSecret ? `${r(paddingHorizontal)}px` : '0',
              marginRight: isSecret ? `${r(paddingHorizontal)}px` : '0',
              borderTopLeftRadius: mergeWithPrev && isSecret ? '0' : (isSecret ? '4px' : '0'),
              borderTopRightRadius: mergeWithPrev && isSecret ? '0' : (isSecret ? '4px' : '0'),
              borderBottomLeftRadius: mergeWithNext && isSecret ? '0' : (isSecret ? '4px' : '0'),
              borderBottomRightRadius: mergeWithNext && isSecret ? '0' : (isSecret ? '4px' : '0')
            }}>
              {safeHtmlContentPieces.map((piece, pIdx) => (
                <React.Fragment key={`${log.id}-narration-${pIdx}`}>
                  {pIdx > 0 && <div style={{ marginTop: '0.8em' }}></div>}
                  <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'keep-all', overflowWrap: 'break-word' }} dangerouslySetInnerHTML={{ __html: piece }} />
                </React.Fragment>
              ))}
            </div>
          ) : format === 'other' ? (
            <div key="other" style={{ padding: `2px ${r(paddingHorizontal)}px`, display: 'flex', gap: `${r(gapSize / 1.5)}px`, alignItems: 'baseline', lineHeight: lineHeight, letterSpacing: letterSpacing === 0 ? 'normal' : `${scaledLetterSpacing}px` }}>
              <div className="relative inline-block flex-shrink-0" style={{ opacity: log.isContinuation ? 0 : 1, pointerEvents: log.isContinuation ? 'none' : 'auto', userSelect: log.isContinuation ? 'none' : 'auto' }}>
                <span style={{ fontWeight: nameWeight, fontStyle: nameFontStyle, color: otherNameColor, fontSize: `${nameSize}px` }} className="cursor-default" dangerouslySetInnerHTML={{ __html: safeHtmlName }} />
              </div>
              <div style={{ flex: 1, minWidth: 0, color: otherContentColor, fontWeight: contentWeight, fontStyle: contentFontStyle, fontSize: `${scaledTextFontSize}px`, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }} dangerouslySetInnerHTML={{ __html: safeHtmlContent }} />
            </div>
          ) : format === 'info' ? (
            <div key="info" className={cn(
              log.isContinuation && "pt-1 border-t-0 rounded-t-none",
              isNextContinuation && "pb-1 border-b-0 rounded-b-none"
            )} style={{ 
              paddingTop: log.isContinuation ? undefined : `${r(12 * scale)}px`,
              paddingBottom: isNextContinuation ? undefined : `${r(mergeWithNext ? 4 : 12 * scale)}px`,
              paddingLeft: `${r(paddingHorizontal)}px`,
              paddingRight: `${r(paddingHorizontal)}px`,
              background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', 
              borderLeft: `4px solid ${theme === 'dark' ? '#444' : '#DDD'}`, 
              marginTop: hasSpecialDividerAboveAndNoBadge ? '0' : (mergeWithPrev ? '0' : '4px'),
              marginBottom: mergeWithNext ? '0' : (hasSpecialDividerBelow ? '0' : '4px'),
              marginLeft: `${r(paddingHorizontal)}px`,
              marginRight: `${r(paddingHorizontal)}px`,
              borderTopLeftRadius: mergeWithPrev ? '0' : '4px',
              borderTopRightRadius: mergeWithPrev ? '0' : '4px',
              borderBottomLeftRadius: mergeWithNext ? '0' : '4px',
              borderBottomRightRadius: mergeWithNext ? '0' : '4px',
              lineHeight: lineHeight, 
              letterSpacing: letterSpacing === 0 ? 'normal' : `${scaledLetterSpacing}px`
            }}>
              {!log.isContinuation && (
                <div className="relative inline-block" style={{ marginBottom: Math.max(4, Math.ceil(scaledTextFontSize * (lineHeight >= 1.4 ? 0.3 : 0.5))) + 'px' }}>
                  <span style={{ fontWeight: nameWeight, fontStyle: nameFontStyle, color, display: 'block', fontSize: `${nameSize}px` }} className="cursor-default" dangerouslySetInnerHTML={{ __html: safeHtmlName }} />
                </div>
              )}
              <div dangerouslySetInnerHTML={{ __html: safeHtmlContent }} style={{ color: tabTextColor || (theme === 'dark' ? 'inherit' : '#333333'), fontWeight: contentWeight, fontStyle: contentFontStyle, fontSize: `${scaledTextFontSize}px`, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }} />
            </div>
          ) : (
            <div key="main" className={cn(
              log.isContinuation && "pt-1 border-t-0 rounded-t-none",
              isNextContinuation && "pb-1 border-b-0 rounded-b-none"
            )} style={{ 
              display: 'flex',
              gap: hideAllAvatars ? '16px' : `${gapSize}px`, 
              paddingTop: log.isContinuation ? undefined : `${paddingVertical}px`,
              paddingBottom: isNextContinuation ? undefined : `${mergeWithNext ? 4 : paddingVertical}px`,
              paddingLeft: `${r(paddingHorizontal)}px`,
              paddingRight: `${r(paddingHorizontal)}px`,
              alignItems: 'flex-start',
              background: isSecret ? getSecretBg(tabColor) : 'transparent',
              borderLeft: isSecret ? `4px solid ${tabColor}` : 'none',
              marginTop: isSecret ? (hasSpecialDividerAboveAndNoBadge ? '0' : (mergeWithPrev ? '0' : '4px')) : '0',
              marginBottom: isSecret ? (mergeWithNext ? '0' : (hasSpecialDividerBelow ? '0' : '4px')) : '0',
              marginLeft: isSecret ? `${r(paddingHorizontal)}px` : '0',
              marginRight: isSecret ? `${r(paddingHorizontal)}px` : '0',
              borderTopLeftRadius: mergeWithPrev && isSecret ? '0' : (isSecret ? '4px' : '0'),
              borderTopRightRadius: mergeWithPrev && isSecret ? '0' : (isSecret ? '4px' : '0'),
              borderBottomLeftRadius: mergeWithNext && isSecret ? '0' : (isSecret ? '4px' : '0'),
              borderBottomRightRadius: mergeWithNext && isSecret ? '0' : (isSecret ? '4px' : '0')
            }}>
              {hideAllAvatars ? (
                <>
                  <div style={{ fontWeight: nameWeight, fontStyle: nameFontStyle, color, fontSize: `${nameSize}px`, width: 'var(--name-col-width, 120px)', flexShrink: 0, textAlign: 'right' }}>
                    {!log.isContinuation && (
                      <span className="cursor-default" dangerouslySetInnerHTML={{ __html: safeHtmlName + ':' }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, lineHeight: lineHeight, letterSpacing: letterSpacing === 0 ? 'normal' : `${scaledLetterSpacing}px` }}>
                    <div dangerouslySetInnerHTML={{ __html: safeHtmlContent }} style={{ color: tabTextColor || (theme === 'dark' ? 'inherit' : '#333333'), fontWeight: contentWeight, fontStyle: contentFontStyle, fontSize: `${scaledTextFontSize}px`, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }} />
                  </div>
                </>
              ) : (
                <>
                  {log.isContinuation ? (
                    <div style={{ width: `${avatarSize}px`, flexShrink: 0 }} />
                  ) : (
                    <LogAvatar img={img} theme={theme} avatarSize={avatarSize} hideEmptyAvatars={hideEmptyAvatars} cropFaceTop={cropFaceTop} />
                  )}
                  <div style={{ flex: 1, minWidth: 0, lineHeight: lineHeight, letterSpacing: letterSpacing === 0 ? 'normal' : `${scaledLetterSpacing}px` }}>
                    {!log.isContinuation && (
                      <div 
                        className="relative inline-block"
                        style={{ fontWeight: nameWeight, fontStyle: nameFontStyle, color, fontSize: `${nameSize}px`, marginBottom: Math.max(4, Math.ceil(scaledTextFontSize * (lineHeight >= 1.4 ? 0.3 : 0.5))) + 'px' }}
                      >
                        <span className="cursor-default" dangerouslySetInnerHTML={{ __html: safeHtmlName }} />
                      </div>
                    )}
                    <div dangerouslySetInnerHTML={{ __html: safeHtmlContent }} style={{ color: tabTextColor || (theme === 'dark' ? 'inherit' : '#333333'), fontWeight: contentWeight, fontStyle: contentFontStyle, fontSize: `${scaledTextFontSize}px`, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }} />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {renderBlocks(insertedBlocks, stableId)}

      {hasDividerBelow && !isSplit && (
        <div 
          style={{
            marginTop: `${r(dividerMarginTop * scale)}px`,
            marginBottom: `${r(dividerMarginBottom * scale)}px`,
            marginLeft: ((format === 'info' || format === 'secret') && mergeWithNext) ? `${r(paddingHorizontal)}px` : '0',
            marginRight: ((format === 'info' || format === 'secret') && mergeWithNext) ? `${r(paddingHorizontal)}px` : '0',
            background: ((format === 'info' || format === 'secret') && mergeWithNext) 
              ? (format === 'secret' ? getSecretBg(tabColor) : (theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)')) 
              : 'transparent',
            borderLeft: ((format === 'info' || format === 'secret') && mergeWithNext)
              ? (format === 'secret' ? `4px solid ${tabColor}` : `4px solid ${theme === 'dark' ? '#444' : '#DDD'}`)
              : 'none',
            paddingLeft: `${r(paddingHorizontal)}px`,
            paddingRight: `${r(paddingHorizontal)}px`
          }}
          className="w-full flex items-center justify-stretch pointer-events-none"
        >
          <div 
            className={cn(
              "w-full border-b-[1px]",
              theme === 'dark' 
                ? "border-white/8" 
                : "border-black/10"
            )}
          />
        </div>
      )}
    </div>
  );
});
