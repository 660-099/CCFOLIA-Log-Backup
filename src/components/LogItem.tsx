import React, { useState, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { Pencil, Trash2, Plus, X, Image as ImageIcon } from 'lucide-react';
import { cn, r, linkify } from '../utils';
import { LogImage } from './LogImage';
import { LogAvatar } from './LogAvatar';
import { SectionNameEditor } from './SectionNameEditor';

export const LogItem = React.memo(({ 
  log, 
  idx, 
  stableId,
  isHighlighted = false,
  isCurrentMatch = false,
  searchQuery = '',
  tabSet, 
  char, 
  theme, 
  disableOtherColor, 
  fontSize, 
  insertedImages, 
  splitPoints, 
  sectionNames,
  imageInputIdx,
  onToggleSplit, 
  onRenameSection,
  onInsertImage, 
  onAddImageUrl,
  onDeleteImage,
  onUpdateImageWidth,
  onUpdateImageAlign,
  onEditLog,
  onDeleteLog,
  splitPointsArray,
  isPrevSameTab,
  isNextSameTab,
  isPrevSplit,
  mergeTabStyles,
  showTabNames,
  hideEmptyAvatars,
  narrationCharacter,
  mergedLogsCount,
  isPrevNarration,
  isNextNarration,
  charSettings
}: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(log.content.replace(/<br\s*\/?>/gi, '\n'));

  const format = tabSet?.format || 'main';
  const color = char.color || log.color;
  const otherNameColor = disableOtherColor ? (theme === 'dark' ? '#AAAAAA' : '#444444') : color;
  const img = char.imageUrl;
  const isSecret = format === 'secret';
  const tabColor = tabSet?.color || '#ffd400';
  const isNarration = log.charId === narrationCharacter && format === 'main';

  let displayContent = log.content;
  if (log.isCommand) {
    displayContent = displayContent.replace(/^(?:<[^>]+>|\s)*(?:<br\s*\/?>|\n)+(?:<[^>]+>|\s)*/gi, (match: string) => {
      return match.replace(/(?:<br\s*\/?>|\n)+/gi, '');
    });
    displayContent = displayContent.replace(/\](?:<[^>]+>|\s)*(?:<br\s*\/?>|\n)+(?:<[^>]+>|\s)*/gi, (match: string) => {
      return match.replace(/(?:<br\s*\/?>|\n)+/gi, ' ');
    });
  }
  let finalHtmlContent = linkify(displayContent);
  if (log.name === 'system') {
    finalHtmlContent = finalHtmlContent.replace(/\[\s*(.*?)\s*\]/g, (match: string, p1: string) => {
      const char = charSettings[p1.trim()];
      if (char) {
        return `<span style="color: ${char.color};">${match}</span>`;
      }
      return match;
    });
  }

  let displayName = log.name;
  if (searchQuery && isHighlighted) {
    const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const markBg = isCurrentMatch ? '#ff9900' : '#e6005c';
    
    // Highlight content
    const parts = finalHtmlContent.split(/(<[^>]*>)/);
    for (let i = 0; i < parts.length; i++) {
        if (i % 2 === 0) {
            parts[i] = parts[i].replace(regex, `<mark style="background-color: ${markBg}; color: white; border-radius: 2px; padding: 0 2px;">$1</mark>`);
        }
    }
    finalHtmlContent = parts.join('');

    // Highlight name
    displayName = displayName.replace(regex, `<mark style="background-color: ${markBg}; color: white; border-radius: 2px; padding: 0 2px;">$1</mark>`);
  }
  
  const safeHtmlContent = useMemo(() => DOMPurify.sanitize(finalHtmlContent, { ADD_ATTR: ['target'] }), [finalHtmlContent]);
  const safeHtmlName = useMemo(() => DOMPurify.sanitize(displayName), [displayName]);
  
  const getSecretBg = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return theme === 'dark' ? `rgba(${r}, ${g}, ${b}, 0.15)` : `rgba(${r}, ${g}, ${b}, 0.08)`;
  };

  const scale = fontSize / 14;
  const avatarSize = Math.round(46 * scale);
  const gapSize = Math.round(12 * scale);
  const paddingSize = Math.round(12 * scale);
  const nameSize = Math.round(13 * scale);

  const isSplit = splitPoints.has(stableId);
  const shouldMergeStyle = mergeTabStyles.has(format) && (isPrevSameTab || isNextSameTab);
  
  const isSectionStart = idx === 0 || isPrevSplit || !!insertedImages[stableId];
  const isSectionEnd = idx === mergedLogsCount - 1 || isSplit || !!insertedImages[stableId];

  const shouldShowIndex = showTabNames.has(format) && (!isPrevSameTab || isPrevSplit);
  
  let itemMarginTop = '0';
  let itemMarginBottom = shouldMergeStyle ? (isNextSameTab && !insertedImages[stableId] ? '0' : '2px') : (log.isContinuation ? '0' : '2px');

  if (isNarration) {
    itemMarginTop = isPrevNarration ? '0' : '10px';
    itemMarginBottom = isNextNarration ? '0' : '10px';
  }

  const getSectionRange = () => {
    const sorted = splitPointsArray;
    const splitIdx = sorted.indexOf(idx);
    const start = idx + 2;
    const nextSplitIdx = splitIdx + 1;
    const end = nextSplitIdx < sorted.length ? sorted[nextSplitIdx] + 1 : mergedLogsCount;
    return `${start} - ${end}`;
  };

  return (
    <div className={cn(
      "log-item-wrapper group/item relative transition-all duration-300",
      log.isContinuation && "mt-[-4px]",
      isHighlighted && searchQuery && (
        isCurrentMatch 
          ? (theme === 'dark' ? "bg-[#ff9900]/20" : "bg-[#ff9900]/10")
          : (theme === 'dark' ? "bg-[#e6005c]/10" : "bg-[#e6005c]/5")
      )
    )}>
      <>
        <div className="absolute top-2 right-4 flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity z-20">
          <button 
            onClick={() => { setIsEditing(true); setEditContent(log.content.replace(/<br\s*\/?>/gi, '\n')); }} 
            className="p-1 bg-stone-800/80 text-white/60 hover:text-white rounded border border-white/10 shadow-lg backdrop-blur-sm"
            title="수정"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button 
            onClick={() => onDeleteLog(log.id)} 
            className="p-1 bg-stone-800/80 text-white/60 hover:text-red-400 rounded border border-white/10 shadow-lg backdrop-blur-sm"
            title="삭제"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>

        {!log.isHiddenContent && !log.isContinuation && (
          <div className="block-number font-sans">{idx + 1}</div>
        )}

        {!log.isHiddenContent && shouldShowIndex && (
          <div style={{ margin: `12px ${r(paddingSize * 1.3)}px 4px ${r(paddingSize * 1.3)}px`, display: 'flex' }}>
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
            marginTop: itemMarginTop
          }}>
            {isEditing ? (
            <div className="mx-4 my-2 p-3 bg-black/20 rounded-xl border border-white/10 flex flex-col gap-2">
              <textarea 
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-black/40 text-white text-sm p-2 rounded-lg border border-white/10 outline-none focus:border-[#e6005c] min-h-[80px]"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => setIsEditing(false)} 
                  className="px-3 py-1 text-[11px] font-bold text-white/40 hover:text-white transition-colors"
                >
                  취소
                </button>
                <button 
                  onClick={() => { onEditLog(log.id, editContent); setIsEditing(false); }} 
                  className="px-4 py-1 bg-[#e6005c] text-white rounded-lg text-[11px] font-bold hover:bg-[#ff0066] transition-colors"
                >
                  확인
                </button>
              </div>
            </div>
          ) : log.isCommand ? (
            <div style={{ 
              background: isSecret ? getSecretBg(tabColor) : 'rgba(0,0,0,0.1)',
              border: `1px solid ${theme === 'dark' ? '#444' : '#DDD'}`,
              padding: `${paddingSize}px ${r(paddingSize * 1.3)}px`,
              borderRadius: '8px',
              margin: `8px ${r(paddingSize * 1.3)}px`
            }}>
              {log.name !== 'system' && <span style={{ color, fontWeight: 'bold', fontFamily: "'NanumGothicCodingLigature', monospace" }}>[ <span dangerouslySetInnerHTML={{ __html: safeHtmlName }} /> ]</span>}
              <span style={{ color: theme === 'dark' ? '#EEEEEE' : '#333333', fontWeight: 'bold', fontFamily: "'NanumGothicCodingLigature', monospace", marginLeft: log.name !== 'system' ? '8px' : '0', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: safeHtmlContent }} />
            </div>
          ) : isNarration ? (
            <div style={{ 
              padding: `${paddingSize}px ${r(paddingSize * 1.3)}px`, 
              textAlign: 'center',
              color: theme === 'dark' ? '#EEEEEE' : '#333333',
              lineHeight: 1.6,
              fontWeight: 'bold',
              fontStyle: 'italic'
            }}>
              <div dangerouslySetInnerHTML={{ __html: safeHtmlContent }} />
            </div>
          ) : format === 'other' ? (
            <div style={{ padding: `${r(paddingSize / 3)}px ${r(paddingSize * 1.3)}px`, display: 'flex', gap: `${r(gapSize / 1.5)}px`, alignItems: 'baseline' }}>
              {!log.isContinuation && (
                <div className="relative inline-block flex-shrink-0">
                  <span style={{ fontWeight: 'bold', color: otherNameColor, fontSize: `${nameSize}px` }} className="cursor-default" dangerouslySetInnerHTML={{ __html: safeHtmlName }} />
                </div>
              )}
              <span style={{ color: theme === 'dark' ? '#AAAAAA' : '#444444', marginLeft: log.isContinuation ? `${r(nameSize * 4)}px` : '0', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: safeHtmlContent }} />
            </div>
          ) : format === 'info' ? (
            <div style={{ 
              padding: `${r(paddingSize * 1.3)}px ${r(paddingSize * 1.6)}px`, 
              background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', 
              borderLeft: `4px solid ${theme === 'dark' ? '#444' : '#DDD'}`, 
              margin: shouldMergeStyle ? `0 ${r(paddingSize * 1.3)}px` : `8px ${r(paddingSize * 1.3)}px`, 
              borderRadius: shouldMergeStyle 
                ? `${(isPrevSameTab && !isSectionStart) ? '0' : '4px'} ${(isPrevSameTab && !isSectionStart) ? '0' : '4px'} ${(isNextSameTab && !isSectionEnd) ? '0' : '4px'} ${(isNextSameTab && !isSectionEnd) ? '0' : '4px'}`
                : '4px',
              borderTop: (shouldMergeStyle && isPrevSameTab && !isSectionStart) ? 'none' : undefined,
              borderBottom: (shouldMergeStyle && isNextSameTab && !isSectionEnd) ? 'none' : undefined
            }}>
              {!log.isContinuation && (
                <div className="relative inline-block mb-1">
                  <span style={{ fontWeight: 'bold', color, display: 'block' }} className="cursor-default" dangerouslySetInnerHTML={{ __html: safeHtmlName }} />
                </div>
              )}
              <div dangerouslySetInnerHTML={{ __html: safeHtmlContent }} style={{ color: theme === 'dark' ? 'inherit' : '#333333', lineHeight: 1.6 }} />
            </div>
          ) : (
            <div style={{ 
              display: 'flex', 
              gap: `${gapSize}px`, 
              padding: log.isContinuation ? `6px ${r(paddingSize * 1.3)}px ${paddingSize}px ${r(paddingSize * 1.3)}px` : `${paddingSize}px ${r(paddingSize * 1.3)}px`, 
              alignItems: 'flex-start',
              background: isSecret ? getSecretBg(tabColor) : 'transparent',
              borderLeft: isSecret ? `4px solid ${tabColor}` : 'none',
              margin: shouldMergeStyle ? (isSecret ? `0 ${r(paddingSize * 1.3)}px` : '0') : (isSecret ? `4px ${r(paddingSize * 1.3)}px` : '0'),
              borderRadius: shouldMergeStyle && isSecret
                ? `${(isPrevSameTab && !isSectionStart) ? '0' : '4px'} ${(isPrevSameTab && !isSectionStart) ? '0' : '4px'} ${(isNextSameTab && !isSectionEnd) ? '0' : '4px'} ${(isNextSameTab && !isSectionEnd) ? '0' : '4px'}`
                : (isSecret ? '4px' : '0'),
              borderTop: shouldMergeStyle && isPrevSameTab && isSecret && !isSectionStart ? 'none' : undefined,
              borderBottom: shouldMergeStyle && isNextSameTab && isSecret && !isSectionEnd ? 'none' : undefined
            }}>
              {log.isContinuation ? (
                <div style={{ width: `${avatarSize}px`, flexShrink: 0 }} />
              ) : (
                <LogAvatar img={img} theme={theme} avatarSize={avatarSize} hideEmptyAvatars={hideEmptyAvatars} />
              )}
              <div style={{ flexGrow: 1, lineHeight: 1.6 }}>
                {!log.isContinuation && (
                  <div 
                    className="relative inline-block"
                    style={{ fontWeight: 'bold', color, fontSize: `${nameSize}px`, marginBottom: '2px' }}
                  >
                    <span className="cursor-default" dangerouslySetInnerHTML={{ __html: safeHtmlName }} />
                  </div>
                )}
                <div dangerouslySetInnerHTML={{ __html: safeHtmlContent }} style={{ color: theme === 'dark' ? 'inherit' : '#333333' }} />
              </div>
            </div>
          )}
        </div>
        )}

        {insertedImages[stableId] && insertedImages[stableId].map((imgData: any, i: number) => (
          <LogImage 
            key={i} 
            url={typeof imgData === 'string' ? imgData : imgData.url} 
            width={typeof imgData === 'string' ? undefined : imgData.width}
            align={typeof imgData === 'string' ? 'center' : imgData.align}
            onDelete={() => onDeleteImage(stableId, i)} 
            onUpdateWidth={(w: string) => onUpdateImageWidth(stableId, i, w)}
            onUpdateAlign={(a: 'left' | 'center' | 'right') => onUpdateImageAlign(stableId, i, a)}
            paddingSize={paddingSize} 
          />
        ))}

        {imageInputIdx === stableId && (
          <div className={cn(
            "mx-4 my-2 p-4 border border-dashed rounded-xl flex flex-col gap-3",
            theme === 'dark' ? "bg-white/5 border-white/20" : "bg-stone-50 border-stone-200 shadow-sm"
          )}>
            <div className="flex items-center gap-2">
              <ImageIcon className={cn("w-4 h-4", theme === 'dark' ? "text-white/40" : "text-stone-400")} />
              <span className={cn("text-[11px] font-bold", theme === 'dark' ? "text-white/60" : "text-stone-600")}>이미지 URL 삽입</span>
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="https://..." 
                className={cn(
                  "flex-1 border rounded-lg px-3 py-2 text-[11px] outline-none focus:border-[#e6005c]/50",
                  theme === 'dark' ? "bg-black/40 border-white/10 text-white" : "bg-white border-stone-200 text-stone-900"
                )}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onAddImageUrl(stableId, e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
              <button 
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  onAddImageUrl(stableId, input.value);
                  input.value = '';
                }}
                className="px-4 py-2 bg-[#e6005c] text-white rounded-lg text-[11px] font-bold hover:bg-[#ff0066] transition-colors"
              >
                추가
              </button>
            </div>
          </div>
        )}
      </>

      <div className={cn("split-trigger font-sans", "mt-4")}>
        <button 
          onClick={() => onToggleSplit(stableId)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all shadow-lg",
            isSplit 
              ? "bg-[#e6005c] text-white" 
              : theme === 'dark' ? "bg-white/90 text-stone-900 hover:bg-white" : "bg-stone-900 text-white hover:bg-stone-800"
          )}
        >
          {isSplit ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          {isSplit ? "분할 해제" : "여기서 분할"}
        </button>
        <button 
          onClick={() => onInsertImage(stableId)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all shadow-lg",
            imageInputIdx === stableId ? "bg-emerald-600 text-white" : (theme === 'dark' ? "bg-white/90 text-stone-900 hover:bg-white" : "bg-stone-900 text-white hover:bg-stone-800")
          )}
        >
          <ImageIcon className="w-3 h-3" />
          이미지 삽입
        </button>
      </div>
      
      {isSplit && (
        <div id={`section-${stableId}`} className="mt-1 mb-1 px-4 font-sans relative">
          <div className="flex items-end justify-between max-w-full">
            <div className="bg-[#e6005c] rounded-t-lg px-4 py-1 flex items-center shadow-lg max-w-sm">
              <SectionNameEditor 
                initialName={sectionNames[stableId] || ''}
                defaultName={`섹션 ${splitPointsArray.indexOf(idx) + 2}`}
                onSave={(name) => onRenameSection(stableId, name)}
              />
            </div>
            <div className={cn(
              "text-[10px] font-bold mb-1",
              theme === 'dark' ? "text-white/40" : "text-stone-400"
            )}>
              {getSectionRange()}번 블록
            </div>
          </div>
          <div className="h-px bg-[#e6005c] w-full" />
        </div>
      )}
    </div>
  );
});
