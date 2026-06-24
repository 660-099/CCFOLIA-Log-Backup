import React, { useState, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { Pencil, Trash2, Plus, X, Image as ImageIcon } from 'lucide-react';
import { cn, r, linkifyAndFormat } from '../utils';
import { LogImage } from './LogImage';
import { LogAvatar } from './LogAvatar';
import { SectionNameEditor } from './SectionNameEditor';
import { BoundaryEditor } from './BoundaryEditor';
import { useSettings } from '../contexts/SettingsContext';
import { splitNarration } from '../utils/textTokenizer';

export const LogItem = React.memo(({ 
  log, 
  idx, 
  stableId,
  isHighlighted = false,
  isCurrentMatch = false,
  searchQuery = '',
  insertedBlocks,
  startBlocks,
  imageInputLoc,
  onAddBlock,
  onUpdateBlock,
  onRemoveBlock,
  onToggleImageInput,
  onEditLog,
  onDeleteLog,
  splitPointsArray,
  isPrevSameTab,
  isNextSameTab,
  isNextContinuation,
  isPrevBlock,
  mergedLogsCount,
  isPrevNarration,
  isNextNarration
}: any) => {
  const { 
    theme, disableOtherColor, fontSize, textFontSize,
    mergeTabStyles, showTabNames, hideEmptyAvatars, hideAllAvatars,
    narrationCharacter, charSettings, tabSettings,
    enableSentenceSpacing,
    lineHeight = 1.6, letterSpacing = 0, blockSpacing = 2, contentPadding = 15.5, avatarSizeValue = 46
  } = useSettings();

  let effectiveBlockSpacing = blockSpacing;
  let basePaddingVertical = 12;
  if (effectiveBlockSpacing < 0) {
    basePaddingVertical = Math.max(2, basePaddingVertical + effectiveBlockSpacing / 2);
    effectiveBlockSpacing = 0;
  }
  
  const tabSet = tabSettings[log.tabId];
  const char = charSettings[log.charId] || { id: log.charId, name: log.name, color: log.color, visible: true, imageUrl: '' };

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(log.content.replace(/<br\s*\/?>/gi, '\n'));

  // Define how blocks are rendered
  const renderBlocks = (blocks: any[], logId: string, isTopLevel: boolean = false) => {
    return (
      <>
        <BoundaryEditor 
          id={logId}
          onToggleSplit={() => onAddBlock(logId, 0, 'split')}
          onInsertImage={() => onToggleImageInput(logId, 0)}
          allowSplit={!isTopLevel}
          isTopLevel={isTopLevel}
        />
        {imageInputLoc?.logId === logId && imageInputLoc.insertIndex === 0 && (
          <div className={cn(
            "mx-4 my-2 p-4 border border-dashed rounded-xl flex flex-col gap-3",
            theme === 'dark' ? "bg-white/5 border-white/20" : "bg-stone-50 border-stone-200 shadow-sm"
          )}>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="https://..." 
                className={cn("flex-1 border rounded-lg px-3 py-2 text-[11px]", theme === 'dark' ? "bg-black/40 text-white" : "bg-white text-stone-900")}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onAddBlock(logId, 0, 'image', { url: e.currentTarget.value });
                }}
              />
              <button 
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  onAddBlock(logId, 0, 'image', { url: input.value });
                }}
                className="px-4 py-2 bg-[#e6005c] text-white rounded-lg text-[11px]"
              >
                추가
              </button>
            </div>
          </div>
        )}

        {blocks.map((block, i) => (
          <React.Fragment key={block.id}>
            {block.type === 'image' && (
              <LogImage 
                url={block.url} 
                width={block.width}
                align={block.align}
                onDelete={() => onRemoveBlock(logId, block.id)} 
                onUpdateWidth={(w: string) => onUpdateBlock(logId, block.id, { width: w })}
                onUpdateAlign={(a: 'left' | 'center' | 'right') => onUpdateBlock(logId, block.id, { align: a })}
                paddingSize={0}
              />
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
              allowSplit={true}
            />
            {imageInputLoc?.logId === logId && imageInputLoc.insertIndex === i + 1 && (
              <div className={cn(
                "mx-4 my-2 p-4 border border-dashed rounded-xl flex flex-col gap-3",
                theme === 'dark' ? "bg-white/5 border-white/20" : "bg-stone-50 border-stone-200 shadow-sm"
              )}>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="https://..." 
                    className={cn("flex-1 border rounded-lg px-3 py-2 text-[11px]", theme === 'dark' ? "bg-black/40 text-white" : "bg-white text-stone-900")}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onAddBlock(logId, i + 1, 'image', { url: e.currentTarget.value });
                    }}
                  />
                  <button 
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      onAddBlock(logId, i + 1, 'image', { url: input.value });
                    }}
                    className="px-4 py-2 bg-[#e6005c] text-white rounded-lg text-[11px]"
                  >
                    추가
                  </button>
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </>
    );
  };

  const format = tabSet?.format || 'main';
  const color = char.color || log.color;
  const otherNameColor = disableOtherColor ? (theme === 'dark' ? '#AAAAAA' : '#444444') : color;
  const img = char.imageUrl;
  const isSecret = format === 'secret';
  const tabColor = tabSet?.color || '#ffd400';
  const isNarration = log.charId === narrationCharacter && format === 'main';

  const narrationMargin = Math.floor(effectiveBlockSpacing * 1.2 + lineHeight * 6);

  let displayContent = log.content;
  if (log.isCommand) {
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
    return formattedPieces.map(html => DOMPurify.sanitize(html, { ADD_ATTR: ['target'] }));
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

  const currentBlocks = insertedBlocks[stableId] || [];
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

  return (
    <div className={cn(
      "log-item-wrapper group/item relative transition-all duration-300",
      isHighlighted && searchQuery && (
        isCurrentMatch 
          ? (theme === 'dark' ? "bg-[#ff9900]/20" : "bg-[#ff9900]/10")
          : (theme === 'dark' ? "bg-[#e6005c]/10" : "bg-[#e6005c]/5")
      )
    )}>
      {idx === 0 && renderBlocks(startBlocks, '__start__', true)}
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
          <div style={{ margin: `12px ${r(paddingHorizontal)}px 4px ${r(paddingHorizontal)}px`, display: 'flex' }}>
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    onEditLog(log.id, editContent);
                    setIsEditing(false);
                  }
                }}
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
            <div key="command" style={{ 
              background: isSecret ? getSecretBg(tabColor) : 'rgba(0,0,0,0.1)',
              border: `1px solid ${theme === 'dark' ? '#444' : '#DDD'}`,
              padding: `${r(12 * scale)}px ${r(paddingHorizontal)}px`,
              borderRadius: '8px',
              margin: `8px ${r(paddingHorizontal)}px`,
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              lineHeight: 1.6, // 다이스 매크로는 스페이싱 영향X
              letterSpacing: letterSpacing === 0 ? 'normal' : `${scaledLetterSpacing}px`
            }}>
              {log.name !== 'system' && <span style={{ color, fontWeight: 'bold', fontFamily: "'NanumGothicCodingLigature', monospace", fontSize: `${scaledTextFontSize}px` }}>[ <span dangerouslySetInnerHTML={{ __html: safeHtmlName }} /> ]</span>}
              <span style={{ color: theme === 'dark' ? '#EEEEEE' : '#333333', fontSize: `${scaledTextFontSize}px`, fontWeight: 'bold', fontFamily: "'NanumGothicCodingLigature', monospace", marginLeft: log.name !== 'system' ? '8px' : '0', wordBreak: 'keep-all', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: safeHtmlContent }} />
            </div>
          ) : isNarration ? (
            <div key="narration" className="narration-row" style={{ 
              paddingTop: log.isContinuation ? '0.4em' : `${r(12 * scale)}px`,
              paddingBottom: isNextContinuation ? '0.4em' : `${r(12 * scale)}px`,
              paddingLeft: `${r(paddingHorizontal)}px`,
              paddingRight: `${r(paddingHorizontal)}px`,
              textAlign: 'center',
              color: theme === 'dark' ? '#EEEEEE' : '#333333',
              lineHeight: lineHeight,
              fontSize: `${scaledTextFontSize}px`,
              letterSpacing: letterSpacing === 0 ? 'normal' : `${scaledLetterSpacing}px`,
              fontWeight: 'bold',
              fontStyle: 'italic'
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
                <span style={{ fontWeight: 'bold', color: otherNameColor, fontSize: `${nameSize}px` }} className="cursor-default" dangerouslySetInnerHTML={{ __html: safeHtmlName }} />
              </div>
              <div style={{ color: theme === 'dark' ? '#AAAAAA' : '#444444', fontSize: `${scaledTextFontSize}px`, whiteSpace: 'pre-wrap', wordBreak: 'keep-all', overflowWrap: 'break-word' }} dangerouslySetInnerHTML={{ __html: safeHtmlContent }} />
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
              marginTop: mergeWithPrev ? '0' : '4px',
              marginBottom: mergeWithNext ? '0' : '4px',
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
                  <span style={{ fontWeight: 'bold', color, display: 'block', fontSize: `${nameSize}px` }} className="cursor-default" dangerouslySetInnerHTML={{ __html: safeHtmlName }} />
                </div>
              )}
              <div dangerouslySetInnerHTML={{ __html: safeHtmlContent }} style={{ color: theme === 'dark' ? 'inherit' : '#333333', fontSize: `${scaledTextFontSize}px`, whiteSpace: 'pre-wrap', wordBreak: 'keep-all', overflowWrap: 'break-word' }} />
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
              marginTop: isSecret ? (mergeWithPrev ? '0' : '4px') : '0',
              marginBottom: isSecret ? (mergeWithNext ? '0' : '4px') : '0',
              marginLeft: isSecret ? `${r(paddingHorizontal)}px` : '0',
              marginRight: isSecret ? `${r(paddingHorizontal)}px` : '0',
              borderTopLeftRadius: mergeWithPrev && isSecret ? '0' : (isSecret ? '4px' : '0'),
              borderTopRightRadius: mergeWithPrev && isSecret ? '0' : (isSecret ? '4px' : '0'),
              borderBottomLeftRadius: mergeWithNext && isSecret ? '0' : (isSecret ? '4px' : '0'),
              borderBottomRightRadius: mergeWithNext && isSecret ? '0' : (isSecret ? '4px' : '0')
            }}>
              {hideAllAvatars ? (
                <>
                  <div style={{ fontWeight: 'bold', color, fontSize: `${nameSize}px`, width: 'var(--name-col-width, 120px)', flexShrink: 0, textAlign: 'right' }}>
                    {!log.isContinuation && (
                      <span className="cursor-default" dangerouslySetInnerHTML={{ __html: safeHtmlName + ':' }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, lineHeight: lineHeight, letterSpacing: letterSpacing === 0 ? 'normal' : `${scaledLetterSpacing}px` }}>
                    <div dangerouslySetInnerHTML={{ __html: safeHtmlContent }} style={{ color: theme === 'dark' ? 'inherit' : '#333333', fontSize: `${scaledTextFontSize}px`, whiteSpace: 'pre-wrap', wordBreak: 'keep-all', overflowWrap: 'break-word' }} />
                  </div>
                </>
              ) : (
                <>
                  {log.isContinuation ? (
                    <div style={{ width: `${avatarSize}px`, flexShrink: 0 }} />
                  ) : (
                    <LogAvatar img={img} theme={theme} avatarSize={avatarSize} hideEmptyAvatars={hideEmptyAvatars} />
                  )}
                  <div style={{ flexGrow: 1, lineHeight: lineHeight, letterSpacing: letterSpacing === 0 ? 'normal' : `${scaledLetterSpacing}px` }}>
                    {!log.isContinuation && (
                      <div 
                        className="relative inline-block"
                        style={{ fontWeight: 'bold', color, fontSize: `${nameSize}px`, marginBottom: Math.max(4, Math.ceil(scaledTextFontSize * (lineHeight >= 1.4 ? 0.3 : 0.5))) + 'px' }}
                      >
                        <span className="cursor-default" dangerouslySetInnerHTML={{ __html: safeHtmlName }} />
                      </div>
                    )}
                    <div dangerouslySetInnerHTML={{ __html: safeHtmlContent }} style={{ color: theme === 'dark' ? 'inherit' : '#333333', fontSize: `${scaledTextFontSize}px`, whiteSpace: 'pre-wrap', wordBreak: 'keep-all', overflowWrap: 'break-word' }} />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {renderBlocks(insertedBlocks, stableId)}
    </div>
  );
});
