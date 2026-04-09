/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Analytics } from "@vercel/analytics/react";
import { 
  Scissors,
  Check,
  X,
  Upload, 
  Download, 
  Settings, 
  Eye, 
  Image as ImageIcon, 
  Palette, 
  CheckSquare, 
  Square,
  FileJson,
  Layout,
  MessageSquare,
  Trash2,
  Plus,
  Type,
  Pencil,
  Undo2,
  Redo2,
  RotateCcw,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  FileText,
  ChevronsUpDown,
  Users,
  ImageOff,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Copy,
  ExternalLink,
  ArrowUpDown,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HexColorPicker, RgbColorPicker } from 'react-colorful';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';
import { Analytics } from '@vercel/analytics/react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const r = (n: number) => Math.round(n * 10) / 10;

type TabFormat = 'main' | 'other' | 'info' | 'secret';

interface LogEntry {
  id: string;
  color: string;
  tab: string;
  name: string;
  content: string;
  isCommand: boolean;
  isContinuation?: boolean;
}

interface CharSetting {
  name: string;
  color: string;
  imageUrl: string;
  visible: boolean;
}

interface TabSetting {
  name: string;
  format: TabFormat;
  visible: boolean;
  color?: string; // For secret format
}

const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: (val: boolean) => void }) => (
  <button
    onClick={() => onChange(!enabled)}
    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
      enabled ? 'bg-emerald-600' : 'bg-stone-200'
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
        enabled ? 'translate-x-4' : 'translate-x-0'
      }`}
    />
  </button>
);

const rgbToHex = (colorStr: string) => {
  if (!colorStr) return '#000000';
  const trimmed = colorStr.trim();
  if (trimmed.startsWith('#')) return trimmed;
  
  const match = trimmed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
  if (!match) return '#000000';
  
  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

const linkify = (text: string) => {
  const urlPattern = /(https?:\/\/[^\s<]+)/g;
  const processed = text.replace(urlPattern, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: underline;">$1</a>');
  // 캐릭터별 통합 시 대사들 사이 간격 조정을 위해 div와 margin-bottom 사용
  return processed.split('\n').map((line, i, arr) => 
    `<div style="margin-bottom: ${i === arr.length - 1 ? '0' : '0.8em'};">${line || '&nbsp;'}</div>`
  ).join('');
};

const LogImage = React.memo(({ url, width, align = 'center', onDelete, onUpdateWidth, onUpdateAlign, paddingSize }: any) => {
  const [hasError, setHasError] = useState(false);
  const [widthInput, setWidthInput] = useState(width || '');

  useEffect(() => {
    setWidthInput(width || '');
  }, [width]);

  return (
    <div style={{ 
      margin: `10px ${r(paddingSize * 1.3)}px`, 
      position: 'relative',
      display: 'flex',
      justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'
    }} className="group/img">
      {hasError ? (
        <div className="flex flex-col items-center justify-center p-8 bg-red-500/10 border border-red-500/20 rounded-xl gap-2 w-full">
          <div className="text-red-400/40">
            <ImageIcon className="w-8 h-8" />
          </div>
          <div className="text-[11px] font-bold text-red-400">잘못된 URL입니다</div>
          <div className="text-[9px] text-red-400/60 break-all px-4 text-center">{url}</div>
        </div>
      ) : (
        <img 
          src={url} 
          alt="" 
          style={{ 
            maxWidth: '100%', 
            width: width ? `${width}px` : 'auto',
            height: 'auto',
            borderRadius: '8px',
            display: 'block'
          }} 
          onError={() => setHasError(true)}
          referrerPolicy="no-referrer"
        />
      )}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/img:opacity-100 transition-opacity z-10">
        <div className="flex items-center bg-stone-900/90 backdrop-blur-sm rounded-lg overflow-hidden border border-white/20 shadow-xl">
          <div className="flex border-r border-white/10">
            <button 
              onClick={() => onUpdateAlign('left')} 
              className={cn("p-1.5 hover:bg-white/10 transition-colors", align === 'left' ? "text-[#e6005c]" : "text-white/40")}
              title="좌측 정렬"
            >
              <AlignLeft className="w-3 h-3" />
            </button>
            <button 
              onClick={() => onUpdateAlign('center')} 
              className={cn("p-1.5 hover:bg-white/10 transition-colors", align === 'center' ? "text-[#e6005c]" : "text-white/40")}
              title="중앙 정렬"
            >
              <AlignCenter className="w-3 h-3" />
            </button>
            <button 
              onClick={() => onUpdateAlign('right')} 
              className={cn("p-1.5 hover:bg-white/10 transition-colors", align === 'right' ? "text-[#e6005c]" : "text-white/40")}
              title="우측 정렬"
            >
              <AlignRight className="w-3 h-3" />
            </button>
          </div>
          <input 
            type="text"
            value={widthInput}
            onChange={(e) => setWidthInput(e.target.value)}
            onBlur={() => onUpdateWidth(widthInput)}
            onKeyDown={(e) => e.key === 'Enter' && onUpdateWidth(widthInput)}
            placeholder="너비(px)"
            className="w-16 bg-transparent text-[10px] text-white px-2 py-1.5 outline-none placeholder:text-white/30"
          />
          <div className="px-1.5 py-1.5 bg-white/10 text-[9px] text-white/50 border-l border-white/10">px</div>
        </div>
        <button 
          onClick={onDelete}
          className="w-7 h-7 flex items-center justify-center bg-red-500 text-white rounded hover:bg-red-600 transition-colors shadow-xl"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
});

const LogAvatar = React.memo(({ img, theme, avatarSize, hideEmptyAvatars }: any) => {
  const [hasError, setHasError] = useState(false);
  return (
    <div style={{ 
      width: `${avatarSize}px`, 
      height: `${avatarSize}px`, 
      flexShrink: 0, 
      backgroundColor: hideEmptyAvatars ? 'transparent' : (theme === 'dark' ? '#1e1e1e' : '#f0f0f0'), 
      borderRadius: '4px', 
      overflow: 'hidden', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      {img && !hasError ? (
        <img 
          src={img} 
          alt="" 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
          onError={() => setHasError(true)}
          referrerPolicy="no-referrer"
        />
      ) : img && hasError ? (
        <div className="text-red-500/40">
          <ImageIcon className="w-4 h-4" />
        </div>
      ) : null}
    </div>
  );
});

const LogItem = React.memo(({ 
  log, 
  idx, 
  stableId,
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

  if (!tabSet?.visible || !char?.visible) return null;

  const format = tabSet.format;
  const color = char.color || log.color;
  const otherNameColor = disableOtherColor ? (theme === 'dark' ? '#AAAAAA' : '#444444') : color;
  const img = char.imageUrl;
  const isSecret = format === 'secret';
  const tabColor = tabSet.color || '#ffd400';
  const isNarration = log.name === narrationCharacter && format === 'main';

  let displayContent = log.content;
  if (log.isCommand) {
    displayContent = displayContent.replace(/^(?:<br\s*\/?>|\s)+/gi, '');
    displayContent = displayContent.replace(/\]\s*(?:<br\s*\/?>|\n)+\s*/gi, '] ');
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

  const isSplit = splitPoints.has(idx);
  const shouldMergeStyle = mergeTabStyles.has(format) && (isPrevSameTab || isNextSameTab);
  
  // 미리보기에서 섹션으로 나뉘는 곳의 모서리가 둥글어지도록 처리
  const isSectionStart = idx === 0 || isPrevSplit || !!insertedImages[stableId];
  const isSectionEnd = idx === mergedLogsCount - 1 || isSplit || !!insertedImages[stableId];

  // 인덱스 표시 조건: 탭이 바뀌었을 때만 (다른 탭이 사이에 끼어들었을 때) 혹은 섹션이 나뉘었을 때
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
      "log-item-wrapper group/item relative",
      log.isContinuation && "mt-[-4px]"
    )}>
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

      {!log.isContinuation && (
        <div className="block-number font-sans">{idx + 1}</div>
      )}

      {shouldShowIndex && (
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
            {log.name !== 'system' && <span style={{ color, fontWeight: 'bold', fontFamily: "'NanumGothicCodingLigature', monospace" }}>[ {log.name} ]</span>}
            <span style={{ color: theme === 'dark' ? '#EEEEEE' : '#333333', fontWeight: 'bold', fontFamily: "'NanumGothicCodingLigature', monospace", marginLeft: log.name !== 'system' ? '8px' : '0', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: finalHtmlContent }} />
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
            <div dangerouslySetInnerHTML={{ __html: finalHtmlContent }} />
          </div>
        ) : format === 'other' ? (
          <div style={{ padding: `${r(paddingSize / 3)}px ${r(paddingSize * 1.3)}px`, display: 'flex', gap: `${r(gapSize / 1.5)}px`, alignItems: 'baseline' }}>
            {!log.isContinuation && (
              <div className="relative inline-block flex-shrink-0">
                <span style={{ fontWeight: 'bold', color: otherNameColor, fontSize: `${nameSize}px` }} className="cursor-default">{log.name}</span>
              </div>
            )}
            <span style={{ color: theme === 'dark' ? '#AAAAAA' : '#444444', marginLeft: log.isContinuation ? `${r(nameSize * 4)}px` : '0', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: finalHtmlContent }} />
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
                <span style={{ fontWeight: 'bold', color, display: 'block' }} className="cursor-default">{log.name}</span>
              </div>
            )}
            <div dangerouslySetInnerHTML={{ __html: finalHtmlContent }} style={{ color: theme === 'dark' ? 'inherit' : '#333333', lineHeight: 1.6 }} />
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
                  <span className="cursor-default">{log.name}</span>
                </div>
              )}
              <div dangerouslySetInnerHTML={{ __html: finalHtmlContent }} style={{ color: theme === 'dark' ? 'inherit' : '#333333' }} />
            </div>
          </div>
        )}
      </div>

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

      {imageInputIdx === idx && (
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

      <div className="split-trigger font-sans mt-4">
        <button 
          onClick={() => onToggleSplit(idx)}
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
          onClick={() => onInsertImage(idx)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all shadow-lg",
            imageInputIdx === idx ? "bg-emerald-600 text-white" : (theme === 'dark' ? "bg-white/90 text-stone-900 hover:bg-white" : "bg-stone-900 text-white hover:bg-stone-800")
          )}
        >
          <ImageIcon className="w-3 h-3" />
          이미지 삽입
        </button>
      </div>
      
      {isSplit && (
        <div className="mt-1 mb-1 px-4 font-sans relative">
          <div className="flex items-end justify-between max-w-full">
            <div className="bg-[#e6005c] rounded-t-lg px-4 py-1.5 flex items-center shadow-lg max-w-sm">
              <input 
                type="text"
                value={sectionNames[idx + 1] || ''}
                onChange={(e) => onRenameSection(idx + 1, e.target.value)}
                placeholder={`섹션 ${splitPointsArray.indexOf(idx) + 2}`}
                className="bg-transparent border-none text-xs font-bold text-white outline-none placeholder:text-white/30 w-48"
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

const fonts = [
  { name: 'Noto Sans KR', value: "'Noto Sans KR', sans-serif", import: "@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap');" },
  { name: '(폰트 적용X)', value: "inherit", import: "" },
  { name: 'Pretendard', value: "'Pretendard', sans-serif", import: "@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');" },
  { name: '나눔고딕', value: "'Nanum Gothic', sans-serif", import: "@import url('https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700&display=swap');" },
  { name: 'Noto Serif KR', value: "'Noto Serif KR', serif", import: "@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700&display=swap');" },
  { name: 'Gothic A1', value: "'Gothic A1', sans-serif", import: "@import url('https://fonts.googleapis.com/css2?family=Gothic+A1:wght@400;700&display=swap');" },
  { name: 'Orbit', value: "'Orbit', sans-serif", import: "@import url('https://fonts.googleapis.com/css2?family=Orbit&display=swap');" }
];

export default function App() {
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [pageTitle, setPageTitle] = useState('');
  const [tempTitle, setTempTitle] = useState('');

  // Sync tempTitle when pageTitle changes (e.g. from history)
  useEffect(() => {
    setTempTitle(pageTitle);
  }, [pageTitle]);
  const [originalFileName, setOriginalFileName] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [charSettings, setCharSettings] = useState<Record<string, CharSetting>>({});
  const [charOrder, setCharOrder] = useState<string[]>([]);
  const [tabOrder, setTabOrder] = useState<string[]>([]);
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [tabSettings, setTabSettings] = useState<Record<string, TabSetting>>({});
  const [cssFormat, setCssFormat] = useState<'inline' | 'internal'>('internal');
  const [fontSize, setFontSize] = useState<number>(14);
  const [fontFamily, setFontFamily] = useState<string>('Noto Sans KR');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [disableOtherColor, setDisableOtherColor] = useState(true);
  const [isEditingFontSize, setIsEditingFontSize] = useState(false);
  const [renamingChar, setRenamingChar] = useState<string | null>(null);
  const [renamingTab, setRenamingTab] = useState<string | null>(null);
  const [newNameInput, setNewNameInput] = useState('');
  const [newTabNameInput, setNewTabNameInput] = useState('');
  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null);
  const [colorPickerRect, setColorPickerRect] = useState<DOMRect | null>(null);
  const [activeTab, setActiveTab] = useState<'files' | 'tabs' | 'chars' | 'settings'>('files');
  const [mobileTab, setMobileTab] = useState<'settings' | 'preview'>('settings');
  const [charSortMode, setCharSortMode] = useState<'appearance' | 'alphabetical'>('appearance');
  const [isNarrationDropdownOpen, setIsNarrationDropdownOpen] = useState(false);
  const narrationDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (narrationDropdownRef.current && !narrationDropdownRef.current.contains(event.target as Node)) {
        setIsNarrationDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const [splitPoints, setSplitPoints] = useState<Set<number>>(new Set());
  const [insertedImages, setInsertedImages] = useState<Record<string, { url: string; width?: string; align?: 'left' | 'center' | 'right' }[]>>({});
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showCopyMenu, setShowCopyMenu] = useState(false);
  const [initialState, setInitialState] = useState<any>(null);
  const [visibleCount, setVisibleCount] = useState(50);
  const [sectionNames, setSectionNames] = useState<Record<number, string>>({});
  const [mergeTabs, setMergeTabs] = useState<Set<TabFormat>>(new Set(['main', 'secret']));
  const [showTabNames, setShowTabNames] = useState<Set<TabFormat>>(new Set(['secret']));
  const [mergeTabStyles, setMergeTabStyles] = useState<Set<TabFormat>>(new Set(['secret']));
  const [hideEmptyAvatars, setHideEmptyAvatars] = useState(false);
  const [narrationCharacter, setNarrationCharacter] = useState<string | null>(null);
  const [imageInputIdx, setImageInputIdx] = useState<number | null>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Virtualization: Increase visible count on scroll
  useEffect(() => {
    const container = previewContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (container.scrollHeight - container.scrollTop - container.clientHeight < 500) {
        setVisibleCount(prev => Math.min(prev + 50, logs.length));
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [logs.length]);

  useEffect(() => {
    setVisibleCount(50);
  }, [logs]);
  
  // History for Undo/Redo
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Inject fonts into document head
  useEffect(() => {
    const styleId = 'global-fonts-import';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    const fontImports = fonts.map(f => f.import).filter(Boolean).join('\n');
    styleEl.innerHTML = fontImports;
  }, []);

  // Favicon
  useEffect(() => {
    const favicon = document.querySelector("link[rel*='icon']") || document.createElement('link');
    (favicon as HTMLLinkElement).rel = 'shortcut icon';
    (favicon as HTMLLinkElement).type = 'image/svg+xml';
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="50" fill="#e6005c" />
        <path d="M36 25h24l10 10v34c0 3.3-2.7 6-6 6H36c-3.3 0-6-2.7-6-6V31c0-3.3 2.7-6 6-6z" fill="white" />
        <path d="M60 25v10h10" fill="none" stroke="#e6005c" stroke-width="2" />
        <rect x="35" y="43" width="20" height="4" rx="1" fill="#e6005c" />
        <rect x="35" y="53" width="30" height="4" rx="1" fill="#e6005c" />
        <rect x="35" y="63" width="30" height="4" rx="1" fill="#e6005c" />
      </svg>
    `.trim();
    (favicon as HTMLLinkElement).href = `data:image/svg+xml;base64,${btoa(svg)}`;
    document.getElementsByTagName('head')[0].appendChild(favicon);
  }, []);

  const saveToHistory = (state: any) => {
    const fullState = {
      charSettings,
      tabSettings,
      tabOrder,
      cssFormat,
      fontSize,
      fontFamily,
      theme,
      disableOtherColor,
      logs,
      insertedImages,
      splitPoints: Array.from(splitPoints),
      sectionNames,
      mergeTabs: Array.from(mergeTabs),
      showTabNames: Array.from(showTabNames),
      mergeTabStyles: Array.from(mergeTabStyles),
      hideEmptyAvatars,
      narrationCharacter,
      ...state
    };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(fullState)));
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      applyState(prevState);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      applyState(nextState);
      setHistoryIndex(historyIndex + 1);
    }
  };

  const applyState = (state: any) => {
    setCharSettings(state.charSettings);
    setTabSettings(state.tabSettings);
    if (state.tabOrder) setTabOrder(state.tabOrder);
    setCssFormat(state.cssFormat);
    setFontSize(state.fontSize);
    setFontFamily(state.fontFamily);
    setTheme(state.theme);
    setDisableOtherColor(state.disableOtherColor);
    if (state.logs) setLogs(state.logs);
    if (state.insertedImages) setInsertedImages(state.insertedImages);
    if (state.splitPoints) setSplitPoints(new Set(state.splitPoints));
    if (state.sectionNames) setSectionNames(state.sectionNames);
    if (state.mergeTabs) setMergeTabs(new Set(state.mergeTabs));
    if (state.showTabNames) setShowTabNames(new Set(state.showTabNames));
    if (state.mergeTabStyles) setMergeTabStyles(new Set(state.mergeTabStyles));
    if (state.hideEmptyAvatars !== undefined) setHideEmptyAvatars(state.hideEmptyAvatars);
    if (state.narrationCharacter !== undefined) setNarrationCharacter(state.narrationCharacter);
  };

  const resetSettings = () => {
    if (confirm('설정을 초기화하시겠습니까?')) {
      if (initialState) {
        const state = JSON.parse(JSON.stringify(initialState));
        setCharSettings(state.charSettings);
        setTabSettings(state.tabSettings);
        setTabOrder(state.tabOrder);
        setCssFormat(state.cssFormat);
        setFontSize(state.fontSize);
        setFontFamily(state.fontFamily);
        setTheme(state.theme);
        setDisableOtherColor(state.disableOtherColor);
        setLogs(state.logs);
        setInsertedImages(state.insertedImages || {});
        setSplitPoints(new Set(state.splitPoints || []));
        setSectionNames(state.sectionNames || {});
        setMergeTabs(new Set(state.mergeTabs || ['main', 'secret']));
        setShowTabNames(new Set(state.showTabNames || ['secret']));
        setMergeTabStyles(new Set(state.mergeTabStyles || ['secret']));
        setHideEmptyAvatars(state.hideEmptyAvatars || false);
        setNarrationCharacter(state.narrationCharacter || null);
        saveToHistory(state);
      } else {
        setCssFormat('internal');
        setFontSize(14);
        setFontFamily('Noto Sans KR');
        setTheme('dark');
        setDisableOtherColor(true);
        setMergeTabs(new Set(['main', 'secret']));
        setShowTabNames(new Set(['secret']));
        setMergeTabStyles(new Set(['secret']));
        setHideEmptyAvatars(false);
      }
    }
  };

  useEffect(() => {
    if (historyIndex === -1 && Object.keys(charSettings).length > 0) {
      saveToHistory({ charSettings, tabSettings, cssFormat, fontSize, fontFamily, theme, disableOtherColor });
    }
  }, [charSettings]);

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const hexToHsl = (hex: string) => {
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s, l = (max + min) / 2;
    if (max === min) h = s = 0;
    else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  };

  const renameCharacter = (oldName: string, newName: string) => {
    if (!newName || oldName === newName) {
      setRenamingChar(null);
      return;
    }
    if (charSettings[newName]) {
      alert('이미 존재하는 이름입니다.');
      return;
    }

    setLogs(prev => prev.map(log => log.name === oldName ? { ...log, name: newName } : log));
    setCharOrder(prev => prev.map(n => n === oldName ? newName : n));
    setCharSettings(prev => {
      const next = { ...prev };
      const setting = next[oldName];
      delete next[oldName];
      next[newName] = { ...setting, name: newName };
      return next;
    });
    setRenamingChar(null);
  };

  const renameTab = (oldName: string, newName: string) => {
    if (!newName || oldName === newName) {
      setRenamingTab(null);
      return;
    }
    if (tabSettings[newName]) {
      alert('이미 존재하는 탭 이름입니다.');
      return;
    }

    setLogs(prev => prev.map(log => log.tab === oldName ? { ...log, tab: newName } : log));
    setTabOrder(prev => prev.map(n => n === oldName ? newName : n));
    setTabSettings(prev => {
      const next = { ...prev };
      const setting = next[oldName];
      delete next[oldName];
      next[newName] = { ...setting, name: newName };
      return next;
    });
    setRenamingTab(null);
  };
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const styleInputRef = useRef<HTMLInputElement>(null);

  // Parse HTML Log
  const handleLogUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.replace(/\.[^/.]+$/, "");
    setOriginalFileName(fileName);
    setPageTitle(''); // Reset custom title on new upload

    const text = await file.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const pTags = doc.querySelectorAll('p');
    
    const newLogs: LogEntry[] = [];
    const newChars: Record<string, CharSetting> = {};
    const newCharOrder: string[] = [];
    const newTabs: Record<string, TabSetting> = {};
    const newTabOrder: string[] = [];
    const colorsFound = new Set<string>();

    pTags.forEach((p, index) => {
      const spans = Array.from(p.querySelectorAll('span'));
      if (spans.length < 2) return;

      const styleAttr = p.getAttribute('style') || '';
      const colorMatch = styleAttr.match(/color\s*:\s*([^;]+)/i);
      const color = colorMatch ? rgbToHex(colorMatch[1]) : rgbToHex(p.style.color);
      
      if (color && color !== '#000000') colorsFound.add(color.toUpperCase());

      const tabRaw = spans[0].textContent?.trim() || '';
      const tabMatch = tabRaw.match(/\[(.*?)\]/);
      const tab = tabMatch ? tabMatch[1].trim() : '';
      
      let name = 'Unknown';
      let content = '';

      if (spans.length >= 3) {
        name = spans[1].textContent?.trim() || 'Unknown';
        content = spans[2].innerHTML.trim();
      } else {
        // Handle cases where name might be missing or structure is different
        content = spans[1].innerHTML.trim();
      }

      const isCommand = content.includes('|') || content.includes('＞') || content.includes('→') || content.includes('choice[');

      newLogs.push({
        id: `log-${index}`,
        color,
        tab,
        name,
        content,
        isCommand
      });

      if (!newChars[name]) {
        newChars[name] = { name, color, imageUrl: '', visible: true };
        newCharOrder.push(name);
      } else {
        newChars[name].color = color;
      }

      if (tab && !newTabs[tab]) {
        let format: TabFormat = 'main';
        const lowerTab = tab.toLowerCase();
        if (lowerTab.includes('other') || lowerTab.includes('잡담')) format = 'other';
        if (lowerTab.includes('info') || lowerTab.includes('정보')) format = 'info';
        if (lowerTab.includes('secret') || lowerTab.includes('비밀')) format = 'secret';
        newTabs[tab] = { name: tab, format, visible: true, color: format === 'secret' ? '#ffd400' : '#e6005c' };
        newTabOrder.push(tab);
      }
    });

    // Filter out leading empty logs
    const isLogEmpty = (content: string) => {
      const stripped = content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
      return stripped === '';
    };
    
    let firstNonEmptyIndex = newLogs.findIndex(log => !isLogEmpty(log.content));
    if (firstNonEmptyIndex === -1) firstNonEmptyIndex = 0;
    const trimmedLogs = newLogs.slice(firstNonEmptyIndex);

    // Check if 'system' is only used in command logs
    if (newChars['system']) {
      const hasNonCommandSystem = trimmedLogs.some(log => log.name === 'system' && !log.isCommand);
      if (!hasNonCommandSystem) {
        delete newChars['system'];
        const idx = newCharOrder.indexOf('system');
        if (idx !== -1) newCharOrder.splice(idx, 1);
      }
    }

    setLogs(trimmedLogs);
    setCharSettings(newChars);
    setCharOrder(newCharOrder);
    setExtractedColors(Array.from(colorsFound));
    setTabSettings(newTabs);
    setTabOrder(newTabOrder);
    setInsertedImages({});
    setSplitPoints(new Set());
    setSectionNames({});
    setMergeTabs(new Set(['main', 'secret']));
    setMergeTabStyles(new Set(['secret']));
    setShowTabNames(new Set(['secret']));
    setHideEmptyAvatars(false);
    setCssFormat('internal');
    setFontSize(14);
    setDisableOtherColor(true);
    setPageTitle('');
    setActiveTab('tabs');

    // Save initial state for reset
    const initial = {
      charSettings: newChars,
      tabSettings: newTabs,
      tabOrder: newTabOrder,
      cssFormat: 'internal' as const,
      fontSize: 14,
      fontFamily: 'Noto Sans KR',
      theme: 'dark' as const,
      disableOtherColor: true,
      logs: trimmedLogs,
      insertedImages: {},
      splitPoints: [] as number[],
      sectionNames: {} as Record<number, string>,
      mergeTabs: ['main', 'secret'],
      showTabNames: ['secret'],
      mergeTabStyles: ['secret'],
      hideEmptyAvatars: false
    };
    setInitialState(initial);
    setHistory([initial]);
    setHistoryIndex(0);
  };

  // Handle Style Upload
  const handleStyleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const json = JSON.parse(await file.text());
      if (json.charSettings) setCharSettings(json.charSettings);
      if (json.charOrder) setCharOrder(json.charOrder);
      if (json.tabSettings) setTabSettings(json.tabSettings);
      if (json.cssFormat) setCssFormat(json.cssFormat);
      if (json.fontSize) setFontSize(json.fontSize);
      if (json.disableOtherColor !== undefined) setDisableOtherColor(json.disableOtherColor);
    } catch (err) {
      alert('스타일 파일을 읽는 중 오류가 발생했습니다.');
    }
  };

  const exportStyle = () => {
    const data = { charSettings, charOrder, tabSettings, cssFormat, fontSize, disableOtherColor };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = pageTitle || originalFileName || 'ccfolia';
    a.download = `${fileName}_style.json`;
    a.click();
  };

  const mergedLogs = useMemo(() => {
    if (logs.length === 0) return [];
    
    const result: LogEntry[] = [];
    let currentMerged: LogEntry | null = null;
    let mergedIds: string[] = [];

    logs.forEach((log) => {
      const tabSet = tabSettings[log.tab];
      const format = tabSet?.format || 'main';
      
      const shouldMerge = mergeTabs.has(format) && 
                          currentMerged && 
                          currentMerged.name === log.name && 
                          currentMerged.color === log.color && 
                          currentMerged.tab === log.tab && 
                          !log.isCommand && 
                          !currentMerged.isCommand;

      if (shouldMerge && currentMerged) {
        currentMerged.content += `\n${log.content}`;
        mergedIds.push(log.id);
        currentMerged.id = `merged:${mergedIds.join(',')}`;
      } else {
        if (currentMerged) {
          result.push(currentMerged);
        }
        currentMerged = { ...log, isContinuation: false };
        mergedIds = [log.id];
      }
    });

    if (currentMerged) {
      result.push(currentMerged);
    }

    return result;
  }, [logs, mergeTabs, tabSettings]);

  const splitPointsArray = useMemo(() => Array.from(splitPoints).sort((a: number, b: number) => a - b), [splitPoints]);

  const sortedCharOrder = useMemo(() => {
    if (charSortMode === 'appearance') return charOrder;
    return [...charOrder].sort((a, b) => {
      // Handle "Unknown" or empty names by putting them at the end
      if (a === 'Unknown' && b !== 'Unknown') return 1;
      if (a !== 'Unknown' && b === 'Unknown') return -1;
      
      const isAEnglish = /^[a-zA-Z]/.test(a);
      const isBEnglish = /^[a-zA-Z]/.test(b);
      
      if (isAEnglish && !isBEnglish) return -1;
      if (!isAEnglish && isBEnglish) return 1;

      return a.localeCompare(b, 'ko', { sensitivity: 'base', numeric: true });
    });
  }, [charOrder, charSortMode]);

  const onEditLog = (id: string, content: string) => {
    if (id.startsWith('merged:')) {
      const ids = id.replace('merged:', '').split(',');
      const firstId = ids[0];
      const otherIds = ids.slice(1);
      
      const next = logs.filter(l => !otherIds.includes(l.id)).map(l => l.id === firstId ? { ...l, content } : l);
      setLogs(next);
      saveToHistory({ logs: next });
    } else {
      const next = logs.map(l => l.id === id ? { ...l, content } : l);
      setLogs(next);
      saveToHistory({ logs: next });
    }
  };

  const onDeleteLog = (id: string) => {
    // Find index in mergedLogs before deleting
    const idx = mergedLogs.findIndex(l => l.id === id);

    if (id.startsWith('merged:')) {
      const ids = id.replace('merged:', '').split(',');
      const next = logs.filter(l => !ids.includes(l.id));
      setLogs(next);
      saveToHistory({ logs: next });
    } else {
      const next = logs.filter(l => l.id !== id);
      setLogs(next);
      saveToHistory({ logs: next });
    }

    if (idx !== -1) {
      // Remove associated images for the deleted log (ID-based)
      const nextImages = { ...insertedImages };
      const stableId = id.startsWith('merged:') ? id.split(',').pop()! : id;
      if (nextImages[stableId]) {
        delete nextImages[stableId];
      }
      setInsertedImages(nextImages);
      
      // Shift splitPoints (these are still index-based)
      const nextSplits = new Set<number>();
      splitPoints.forEach(i => {
        if (i < idx) nextSplits.add(i);
        else if (i > idx) nextSplits.add(i - 1);
      });
      setSplitPoints(nextSplits);

      // Shift sectionNames (these are still index-based)
      const nextNames: any = {};
      Object.keys(sectionNames).forEach(key => {
        const i = parseInt(key);
        if (i < idx) nextNames[i] = sectionNames[i];
        else if (i > idx) nextNames[i - 1] = sectionNames[i];
      });
      setSectionNames(nextNames);
      
      saveToHistory({ 
        insertedImages: nextImages, 
        splitPoints: Array.from(nextSplits), 
        sectionNames: nextNames 
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('클립보드에 복사되었습니다.');
    }).catch(err => {
      console.error('복사 실패:', err);
    });
  };

  const generateFinalHtml = (range?: { start: number; end: number }) => {
    const targetLogs = range ? mergedLogs.slice(range.start, range.end + 1) : mergedLogs;
    const filteredLogs = targetLogs.filter(log => 
      tabSettings[log.tab]?.visible && 
      (charSettings[log.name]?.visible !== false)
    );

    const selectedFont = fonts.find(f => f.name === fontFamily) || fonts[0];
    
    let fontImport = selectedFont.import;
    let fontValue = selectedFont.value;

    const isDark = theme === 'dark';
    const bgColor = isDark ? '#242424' : '#FFFFFF';
    const textColor = isDark ? '#EEEEEE' : '#1A1A1A';
    const otherTextColor = isDark ? '#AAAAAA' : '#666666';
    const infoBg = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)';
    const borderColor = isDark ? '#444' : '#DDD';
    const avatarPlaceholder = isDark ? '#1e1e1e' : '#f0f0f0';

    const getSecretBg = (hex: string) => {
      const rgb = hexToRgbValues(hex || '#ffff00');
      return isDark ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)` : `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.08)`;
    };

    const scale = fontSize / 14;
    const avatarSize = Math.round(46 * scale);
    const gapSize = Math.round(12 * scale);
    const paddingSize = Math.round(12 * scale);
    const nameSize = Math.round(13 * scale);

    const css = `
      ${fontImport}
      @import url('https://hangeul.pstatic.net/hangeul_static/css/nanum-gothic-coding.css');
      .log-container * { box-sizing: border-box; min-width: 0; }
      .log-container { 
        width: 100%; 
        max-width: 800px; 
        margin: 0 auto; 
        ${fontFamily !== '(폰트 적용X)' ? `font-family: ${fontValue};` : ''}
        background: ${bgColor}; 
        color: ${textColor}; 
        line-height: 1.6; 
        padding: 20px 0; 
        font-size: ${fontSize}px;
        overflow-x: hidden;
      }
      .log-item { position: relative; margin-bottom: 2px; }
      .tab-name-block { margin: 12px ${r(paddingSize * 1.3)}px 4px ${r(paddingSize * 1.3)}px; display: flex; }
      .tab-name-badge { padding: 2px 10px; border-radius: 4px; font-size: 0.8em; font-weight: bold; }
      
      /* Main Format */
      .main-row { 
        display: flex; 
        gap: ${gapSize}px; 
        padding: ${paddingSize}px ${r(paddingSize * 1.3)}px; 
        align-items: flex-start; 
      }
      .main-avatar { 
        width: ${avatarSize}px; 
        height: ${avatarSize}px; 
        flex-shrink: 0; 
        background-color: ${avatarPlaceholder}; 
        border-radius: 4px; 
        object-fit: contain;
      }
      .main-body { flex-grow: 1; line-height: 1.5; }
      .main-name { font-weight: bold; font-size: 1em; margin-bottom: 2px; display: block; }
      .main-content { font-size: 1em; color: ${textColor}; white-space: pre-wrap; word-break: break-all; }

      /* Other Format */
      .other-row { 
        padding: ${r(paddingSize / 3)}px ${r(paddingSize * 1.3)}px; 
        display: flex;
        gap: ${r(gapSize / 1.5)}px;
        align-items: baseline;
      }
      .other-name { font-weight: bold; flex-shrink: 0; font-size: 1em; }
      .other-content { font-size: 1em; color: ${otherTextColor}; white-space: pre-wrap; word-break: break-all; }

      /* Info Format */
      .info-row { 
        padding: ${r(paddingSize * 1.3)}px ${r(paddingSize * 1.6)}px; 
        background: ${infoBg};
        border-left: 4px solid ${borderColor};
        margin: 8px ${r(paddingSize * 1.3)}px;
        border-radius: 4px;
      }
      
      .command-box { 
        background: rgba(0, 0, 0, 0.1); 
        border: 1px solid ${borderColor}; 
        padding: ${paddingSize}px ${r(paddingSize * 1.3)}px; 
        border-radius: 8px; 
        margin: 8px ${r(paddingSize * 1.3)}px; 
      }
      .command-text { font-family: 'NanumGothicCodingLigature', monospace; color: ${otherTextColor}; font-size: 0.9em; }

      /* Secret Format */
      .secret-row {
        display: flex; 
        gap: ${gapSize}px; 
        padding: ${paddingSize}px ${r(paddingSize * 1.3)}px; 
        align-items: flex-start;
        margin: 4px ${r(paddingSize * 1.3)}px;
        border-radius: 4px;
      }

      /* Narration Format */
      .narration-row {
        padding: ${paddingSize}px ${r(paddingSize * 1.3)}px;
        text-align: center;
        color: ${textColor};
        line-height: 1.6;
        font-weight: bold;
        font-style: italic;
      }
    `;

    const isInline = cssFormat === 'inline';
    let html = isInline ? `<div style="width: 100%; max-width: 800px; margin: 0 auto; ${fontFamily !== '(폰트 적용X)' ? `font-family: ${fontValue};` : ''} background: ${bgColor}; color: ${textColor}; line-height: 1.6; padding: 20px 0; font-size: ${fontSize}px; overflow-x: hidden; box-sizing: border-box;">\n` : '';

    filteredLogs.forEach((log, idx) => {
      const globalIdx = mergedLogs.findIndex(l => l.id === log.id);
      const tabSet = tabSettings[log.tab];
      const format = tabSet?.format || 'main';
      const char = charSettings[log.name];
      const color = char?.color || log.color;
      const otherNameColor = disableOtherColor ? otherTextColor : color;
      const img = char?.imageUrl;
      const isCont = log.isContinuation;
      const hideAvatar = hideEmptyAvatars;

      const isValidUrl = (url: string) => {
        if (!url) return false;
        return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:image/');
      };

      // Calculate isPrevSameTab and isNextSameTab for Tab Integration
      const stableId = log.id.startsWith('merged:') ? log.id.split(',').pop()! : log.id;
      const currentImages = (insertedImages[stableId] || []).filter(imgData => {
        const url = typeof imgData === 'string' ? imgData : imgData.url;
        return isValidUrl(url);
      });
      const prevStableId = idx > 0 ? (filteredLogs[idx-1].id.startsWith('merged:') ? filteredLogs[idx-1].id.split(',').pop()! : filteredLogs[idx-1].id) : '';
      const prevImages = idx > 0 ? (insertedImages[prevStableId] || []).filter(imgData => {
        const url = typeof imgData === 'string' ? imgData : imgData.url;
        return isValidUrl(url);
      }) : [];

      const isPrevSameTab = idx > 0 && filteredLogs[idx - 1].tab === log.tab;
      const isNextSameTab = idx < filteredLogs.length - 1 && filteredLogs[idx + 1].tab === log.tab;
      const shouldMergeStyle = mergeTabStyles.has(format) && (isPrevSameTab || isNextSameTab);
      const hasImageAfter = currentImages.length > 0;
      const hasImageBefore = prevImages.length > 0;

      const isNarration = log.name === narrationCharacter && format === 'main';
      const isPrevNarration = idx > 0 && filteredLogs[idx - 1].name === narrationCharacter && (tabSettings[filteredLogs[idx - 1].tab]?.format || 'main') === 'main';
      const isNextNarration = idx < filteredLogs.length - 1 && filteredLogs[idx + 1].name === narrationCharacter && (tabSettings[filteredLogs[idx + 1].tab]?.format || 'main') === 'main';

      let displayContent = log.content;
      if (log.isCommand) {
        displayContent = displayContent.replace(/^(?:<br\s*\/?>|\s)+/gi, '');
        displayContent = displayContent.replace(/\]\s*(?:<br\s*\/?>|\n)+\s*/gi, '] ');
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

      // Insert Tab Name if needed
      if (showTabNames.has(format) && !isPrevSameTab) {
        const tabName = log.tab;
        const isSecret = format === 'secret';
        const tabColor = tabSet?.color || '#ffd400';
        const tabBg = getSecretBg(tabColor);
        
        if (isInline) {
          html += `<div style="margin: 12px ${r(paddingSize * 1.3)}px 4px ${r(paddingSize * 1.3)}px; display: flex;">
            <div style="background: ${tabBg}; color: ${tabColor}; padding: 2px 10px; border-radius: 4px; font-size: ${r(nameSize * 0.8)}px; font-weight: bold; border: 1px solid ${tabColor}44;">
              ${tabName}
            </div>
          </div>`;
        } else {
          html += `<div class="tab-name-block">
            <div class="tab-name-badge" style="background: ${tabBg}; color: ${tabColor}; border: 1px solid ${tabColor}44;">
              ${tabName}
            </div>
          </div>`;
        }
      }

      if (isInline) {
        const avatarStyle = `width: ${avatarSize}px; height: ${avatarSize}px; flex-shrink: 0; background-color: ${hideAvatar ? 'transparent' : avatarPlaceholder}; border-radius: 4px; object-fit: contain;`;
        const bodyStyle = `flex-grow: 1; line-height: 1.6;`;
        const nameStyle = `font-weight: bold; color: ${color}; font-size: ${nameSize}px; margin-bottom: 2px; display: block;`;
        const contentStyle = `font-size: 1em; color: ${textColor}; word-break: break-all;`;
        const otherContentStyle = `font-size: 1em; color: ${otherTextColor}; word-break: break-all;`;
        
        // Tab Integration margin/border logic
        let itemMarginBottom = shouldMergeStyle ? (isNextSameTab && !hasImageAfter ? '0' : '2px') : (isCont ? '0' : '2px');
        let itemMarginTop = '0';
        
        if (isNarration) {
          itemMarginTop = isPrevNarration ? '0' : '16px';
          itemMarginBottom = isNextNarration ? '0' : '16px';
        }

        // Rounding logic for tab integration
        const isSectionStart = idx === 0 || hasImageBefore;
        const isSectionEnd = isNextSameTab === false || hasImageAfter;

        html += `<div style="margin-bottom: ${itemMarginBottom}; margin-top: ${itemMarginTop};">`;
        
        if (log.isCommand) {
          const nameHtml = log.name !== 'system' ? `<span style="color: ${color}; font-family: 'NanumGothicCodingLigature', monospace; font-weight: bold; font-size: 0.9em;">[ ${log.name} ]</span> ` : '';
          const marginLeft = log.name !== 'system' ? 'margin-left: 8px;' : '';
          if (format === 'secret') {
            const tabColor = tabSet?.color || '#ffd400';
            const secretBg = getSecretBg(tabColor);
            html += `<div style="background: ${secretBg}; border: 1px solid ${borderColor}; padding: ${paddingSize}px ${r(paddingSize * 1.3)}px; border-radius: 8px; margin: 8px ${r(paddingSize * 1.3)}px;">${nameHtml}<span style="color: ${textColor}; font-family: 'NanumGothicCodingLigature', monospace; font-weight: bold; font-size: 0.9em; ${marginLeft}">${finalHtmlContent}</span></div>`;
          } else {
            html += `<div style="background: rgba(0,0,0,0.1); border: 1px solid ${borderColor}; padding: ${paddingSize}px ${r(paddingSize * 1.3)}px; border-radius: 8px; margin: 8px ${r(paddingSize * 1.3)}px;">${nameHtml}<span style="color: ${otherTextColor}; font-family: 'NanumGothicCodingLigature', monospace; font-size: 0.9em; ${marginLeft}">${finalHtmlContent}</span></div>`;
          }
        } else if (isNarration) {
          html += `<div style="padding: ${paddingSize}px ${r(paddingSize * 1.3)}px; text-align: center; color: ${textColor}; line-height: 1.6; font-weight: bold; font-style: italic;">${finalHtmlContent}</div>`;
        } else if (format === 'other') {
          html += `<div style="padding: ${r(paddingSize / 3)}px ${r(paddingSize * 1.3)}px; display: flex; gap: ${r(gapSize / 1.5)}px; align-items: baseline;">
            ${!isCont ? `<span style="font-weight: bold; color: ${otherNameColor}; font-size: ${nameSize}px; flex-shrink: 0;">${log.name}</span>` : `<span style="width: 50px; flex-shrink: 0;"></span>`}
            <span style="${otherContentStyle}">${finalHtmlContent}</span>
          </div>`;
        } else if (format === 'info') {
          const infoMargin = shouldMergeStyle ? `0 ${r(paddingSize * 1.3)}px` : `8px ${r(paddingSize * 1.3)}px`;
          const infoRadius = shouldMergeStyle 
            ? `${(isPrevSameTab && !isSectionStart) ? '0' : '4px'} ${(isPrevSameTab && !isSectionStart) ? '0' : '4px'} ${(isNextSameTab && !isSectionEnd) ? '0' : '4px'} ${(isNextSameTab && !isSectionEnd) ? '0' : '4px'}`
            : '4px';
          const infoBorderTop = shouldMergeStyle && isPrevSameTab && !isSectionStart ? 'none' : `4px solid ${borderColor}`;
          const infoBorderBottom = shouldMergeStyle && isNextSameTab && !isSectionEnd ? 'none' : 'none';

          html += `<div style="padding: ${r(paddingSize * 1.3)}px ${r(paddingSize * 1.6)}px; background: ${infoBg}; border-left: 4px solid ${borderColor}; margin: ${infoMargin}; border-radius: ${infoRadius}; border-top: ${infoBorderTop}; border-bottom: ${infoBorderBottom};">
            ${!isCont ? `<span style="${nameStyle}">${log.name}</span>` : ''}
            <div style="${contentStyle}">${finalHtmlContent}</div>
          </div>`;
        } else if (format === 'secret') {
          const tabColor = tabSet?.color || '#ffd400';
          const secretBg = getSecretBg(tabColor);
          const imgTag = img ? `<img src="${img}" style="${avatarStyle}" />` : `<div style="${avatarStyle}"></div>`;
          const secretMargin = shouldMergeStyle ? `0 ${r(paddingSize * 1.3)}px` : `4px ${r(paddingSize * 1.3)}px`;
          const secretRadius = shouldMergeStyle 
            ? `${(isPrevSameTab && !isSectionStart) ? '0' : '4px'} ${(isPrevSameTab && !isSectionStart) ? '0' : '4px'} ${(isNextSameTab && !isSectionEnd) ? '0' : '4px'} ${(isNextSameTab && !isSectionEnd) ? '0' : '4px'}`
            : '4px';
          const secretBorderTop = shouldMergeStyle && isPrevSameTab && !isSectionStart ? 'none' : 'none';
          const secretBorderBottom = shouldMergeStyle && isNextSameTab && !isSectionEnd ? 'none' : 'none';

          html += `
            <div style="display: flex; gap: ${gapSize}px; padding: ${paddingSize}px ${r(paddingSize * 1.3)}px; align-items: flex-start; background: ${secretBg}; border-left: 4px solid ${tabColor}; margin: ${secretMargin}; border-radius: ${secretRadius}; border-top: ${secretBorderTop}; border-bottom: ${secretBorderBottom};">
              ${!isCont ? imgTag : `<div style="width: ${avatarSize}px; flex-shrink: 0;"></div>`}
              <div style="${bodyStyle}">
                ${!isCont ? `<div style="${nameStyle}">${log.name}</div>` : ''}
                <div style="${contentStyle}">${finalHtmlContent}</div>
              </div>
            </div>`;
        } else {
          const avatarHtml = img 
            ? `<img src="${img}" style="${avatarStyle}" />` 
            : `<div style="${avatarStyle}"></div>`;
          
          const contAvatarHtml = `<div style="width: ${avatarSize}px; flex-shrink: 0;"></div>`;

          html += `
            <div style="display: flex; gap: ${gapSize}px; padding: ${paddingSize}px ${r(paddingSize * 1.3)}px; align-items: flex-start; ${isCont ? 'padding-top: 2px;' : ''}">
              ${!isCont ? avatarHtml : contAvatarHtml}
              <div style="${bodyStyle}">
                ${!isCont ? `<div style="${nameStyle}">${log.name}</div>` : ''}
                <div style="${contentStyle}">${finalHtmlContent}</div>
              </div>
            </div>`;
        }
        html += `</div>`;
      } else {
        // Rounding logic for tab integration
        const isSectionStart = idx === 0 || hasImageBefore;
        const isSectionEnd = isNextSameTab === false || hasImageAfter;

        let itemMarginBottom = shouldMergeStyle ? (isNextSameTab && !hasImageAfter ? '0' : '2px') : (isCont ? '0' : '2px');
        let itemMarginTop = '0';

        if (isNarration) {
          itemMarginTop = isPrevNarration ? '0' : '16px';
          itemMarginBottom = isNextNarration ? '0' : '16px';
        }

        html += `<div class="log-item" style="margin-bottom: ${itemMarginBottom}; margin-top: ${itemMarginTop};">`;

        if (log.isCommand) {
          const nameHtml = log.name !== 'system' ? `<span class="command-text" style="color: ${color}; font-weight: bold;">[ ${log.name} ]</span> ` : '';
          const marginLeft = log.name !== 'system' ? 'margin-left: 8px;' : '';
          if (format === 'secret') {
            const tabColor = tabSet?.color || '#ffd400';
            const secretBg = getSecretBg(tabColor);
            html += `<div class="command-box" style="background: ${secretBg}; border-color: rgba(0,0,0,0.1);">${nameHtml}<span class="command-text" style="color: ${textColor}; font-weight: bold; ${marginLeft}">${finalHtmlContent}</span></div>`;
          } else {
            html += `<div class="command-box">${nameHtml}<span class="command-text" style="${marginLeft}">${finalHtmlContent}</span></div>`;
          }
        } else if (isNarration) {
          html += `<div class="narration-row">${finalHtmlContent}</div>`;
        } else if (format === 'other') {
          html += `<div class="other-row">
            ${!isCont ? `<span class="other-name" style="color: ${otherNameColor}">${log.name}</span>` : `<span style="width: 50px; flex-shrink: 0;"></span>`}
            <span class="other-content">${finalHtmlContent}</span>
          </div>`;
        } else if (format === 'info') {
          const infoMargin = shouldMergeStyle ? `0 ${r(paddingSize * 1.3)}px` : `8px ${r(paddingSize * 1.3)}px`;
          const infoRadius = shouldMergeStyle 
            ? `${(isPrevSameTab && !isSectionStart) ? '0' : '4px'} ${(isPrevSameTab && !isSectionStart) ? '0' : '4px'} ${(isNextSameTab && !isSectionEnd) ? '0' : '4px'} ${(isNextSameTab && !isSectionEnd) ? '0' : '4px'}`
            : '4px';
          const infoBorderTop = shouldMergeStyle && isPrevSameTab && !isSectionStart ? 'none' : undefined;

          html += `<div class="info-row" style="margin: ${infoMargin}; border-radius: ${infoRadius}; border-top: ${infoBorderTop};">
            ${!isCont ? `<span class="main-name" style="color: ${color}">${log.name}</span>` : ''}
            <div class="main-content">${finalHtmlContent}</div>
          </div>`;
        } else if (format === 'secret') {
          const tabColor = tabSet?.color || '#ffd400';
          const secretBg = getSecretBg(tabColor);
          const avatarHtml = img ? `<img src="${img}" class="main-avatar" style="${hideAvatar ? 'background-color: transparent;' : ''}" />` : `<div class="main-avatar" style="${hideAvatar ? 'background-color: transparent;' : ''}"></div>`;
          const secretMargin = shouldMergeStyle ? `0 ${r(paddingSize * 1.3)}px` : `4px ${r(paddingSize * 1.3)}px`;
          const secretRadius = shouldMergeStyle 
            ? `${(isPrevSameTab && !isSectionStart) ? '0' : '4px'} ${(isPrevSameTab && !isSectionStart) ? '0' : '4px'} ${(isNextSameTab && !isSectionEnd) ? '0' : '4px'} ${(isNextSameTab && !isSectionEnd) ? '0' : '4px'}`
            : '4px';
          const secretBorderTop = shouldMergeStyle && isPrevSameTab && !isSectionStart ? 'none' : undefined;

          html += `
            <div class="secret-row" style="background: ${secretBg}; border-left: 4px solid ${tabColor}; margin: ${secretMargin}; border-radius: ${secretRadius}; border-top: ${secretBorderTop};">
              ${!isCont ? avatarHtml : `<div style="width: ${avatarSize}px; flex-shrink: 0;"></div>`}
              <div class="main-body">
                ${!isCont ? `<span class="main-name" style="color: ${color}">${log.name}</span>` : ''}
                <div class="main-content">${finalHtmlContent}</div>
              </div>
            </div>`;
        } else {
          const avatarHtml = img ? `<img src="${img}" class="main-avatar" style="${hideAvatar ? 'background-color: transparent;' : ''}" />` : `<div class="main-avatar" style="${hideAvatar ? 'background-color: transparent;' : ''}"></div>`;
          html += `
            <div class="main-row ${isCont ? 'continuation' : ''}">
              ${!isCont ? avatarHtml : `<div style="width: ${avatarSize}px; flex-shrink: 0;"></div>`}
              <div class="main-body">
                ${!isCont ? `<span class="main-name" style="color: ${color}">${log.name}</span>` : ''}
                <div class="main-content">${finalHtmlContent}</div>
              </div>
            </div>`;
        }
        html += `</div>`;
      }

      // Insert images if any
      const currentStableId = log.id.startsWith('merged:') ? log.id.split(',').pop()! : log.id;
      if (insertedImages[currentStableId]) {
        insertedImages[currentStableId].forEach(imgData => {
          const url = typeof imgData === 'string' ? imgData : imgData.url;
          if (!isValidUrl(url)) return;
          
          const align = (typeof imgData === 'string' ? 'center' : imgData.align) || 'center';
          const justify = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start';
          const width = typeof imgData === 'string' ? undefined : imgData.width;
          const widthStyle = width ? `width: ${width}px;` : 'max-width: 100%;';
          html += `<div style="display: flex; justify-content: ${justify}; margin: 10px ${r(paddingSize * 1.3)}px;">
            <img src="${url}" style="${widthStyle} border-radius: 8px; display: block;" referrerPolicy="no-referrer" onerror="this.style.display='none'" />
          </div>`;
        });
      }
    });

    if (isInline) {
      html += `</div>`;
    }

    return `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${pageTitle}</title>
        ${isInline ? '' : `<style>${css}</style>`}
      </head>
      <body style="margin: 0;">
        ${isInline ? html : `<div class="log-container">\n${html}\n</div>`}
      </body>
      </html>
    `;
  };

  const previewHtml = useMemo(() => {
    if (mergedLogs.length === 0) return '';
    return generateFinalHtml();
  }, [mergedLogs, charSettings, tabSettings, cssFormat, fontSize, fontFamily, theme, disableOtherColor, pageTitle, originalFileName, insertedImages, narrationCharacter]);

  const downloadHtml = (range?: { start: number; end: number }) => {
    const html = generateFinalHtml(range);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = pageTitle || originalFileName || 'ccfolia';
    let suffix = '_log';
    if (range) {
      const name = sectionNames[range.start];
      suffix = name ? `_${name}` : `_part${range.start + 1}-${range.end + 1}`;
    }
    a.download = `${fileName}${suffix}.html`;
    a.click();
  };

  const downloadZip = async () => {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    const sortedPoints = Array.from(splitPoints).sort((a: number, b: number) => a - b);
    const sections: { start: number; end: number }[] = [];
    
    let last = 0;
    sortedPoints.forEach((p: number) => {
      sections.push({ start: last, end: p });
      last = p + 1;
    });
    sections.push({ start: last, end: mergedLogs.length - 1 });

    const fileName = pageTitle || originalFileName || 'ccfolia';
    const folderName = `${fileName}_log`;
    const folder = zip.folder(folderName);

    sections.forEach((s, i) => {
      const html = generateFinalHtml(s);
      const name = sectionNames[s.start] || `section_${i + 1}`;
      folder?.file(`${name}.html`, html);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${folderName}.zip`;
    a.click();
  };

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-[#121212] font-sans text-stone-200 overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className={cn(
          "w-full md:w-[400px] bg-[#1a1a1a] border-r border-white/5 flex-col shadow-2xl z-20 shrink-0",
          mobileTab === 'settings' ? 'flex' : 'hidden md:flex'
        )}>
        {/* Sidebar Header */}
        <div className="p-5 border-b border-white/5 bg-[#1a1a1a] shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-[#e6005c] rounded-xl shadow-lg shadow-pink-500/20 shrink-0 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex flex-col justify-center">
                <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.15em]">CCFOLIA LOG FORMATTER</p>
                <h1 className="text-[17px] font-bold text-white whitespace-nowrap leading-tight">코코포리아 로그 편집기</h1>
              </div>
            </div>

            <div className="flex flex-col items-end text-right shrink-0 gap-1">
              <p className="text-[9px] font-medium text-white/20">
                제작: <span className="text-white/40 font-bold">한냥</span>
                <a 
                  href="https://posty.pe/7oldqj" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="ml-1 text-white/30 hover:text-[#e6005c] transition-colors underline underline-offset-2 decoration-white/5"
                >
                  (후원하기)
                </a>
              </p>
              <a 
                href="https://posty.pe/7oldqj" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[9px] font-bold text-white/40 hover:text-white transition-all flex items-center gap-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md px-2 py-1"
              >
                도움말 보기
                <ExternalLink className="w-2.5 h-2.5 opacity-30" />
              </a>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/5 bg-[#1a1a1a] shrink-0">
          {[
            { id: 'files', icon: Upload, label: '파일' },
            { id: 'tabs', icon: Settings, label: '탭' },
            { id: 'chars', icon: ImageIcon, label: '캐릭터' },
            { id: 'settings', icon: Palette, label: '디자인' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 flex flex-col items-center gap-1.5 transition-all relative ${
                activeTab === tab.id ? 'text-[#e6005c]' : 'text-white/30 hover:text-white/60'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-[10px] font-bold tracking-tight">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#e6005c] shadow-[0_0_10px_rgba(230,0,92,0.5)]"
                />
              )}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'files' && (
              <motion.div 
                key="files"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="space-y-3">
                  <h2 className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-2 mb-4">
                    <MessageSquare className="w-3.5 h-3.5" /> 로그 업로드
                  </h2>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center gap-3 p-3 border-2 border-dashed border-white/5 rounded-xl hover:border-[#e6005c] hover:bg-pink-500/5 transition-all group"
                  >
                    <div className="p-1.5 bg-[#242424] rounded-lg group-hover:bg-[#e6005c]/20 transition-colors">
                      <Upload className="w-3.5 h-3.5 text-white/20 group-hover:text-[#e6005c]" />
                    </div>
                    <div className="text-left">
                      <p className="text-[11px] font-bold text-white/60">HTML 로그 파일 선택</p>
                    </div>
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleLogUpload} accept=".html" className="hidden" />
                </div>

                <div className="space-y-3">
                  <h2 className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-2 mb-4">
                    <Palette className="w-3.5 h-3.5" /> 스타일 불러오기
                  </h2>
                  <button 
                    onClick={() => styleInputRef.current?.click()}
                    className="w-full flex items-center gap-3 p-3 border-2 border-dashed border-white/5 rounded-xl hover:border-blue-500 hover:bg-blue-500/5 transition-all group"
                  >
                    <div className="p-1.5 bg-[#242424] rounded-lg group-hover:bg-blue-500/20 transition-colors">
                      <FileJson className="w-3.5 h-3.5 text-white/20 group-hover:text-blue-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-[11px] font-bold text-white/60">JSON 설정 파일 선택</p>
                    </div>
                  </button>
                  <input type="file" ref={styleInputRef} onChange={handleStyleUpload} accept=".json" className="hidden" />
                </div>
              </motion.div>
            )}

            {activeTab === 'tabs' && (
              <motion.div 
                key="tabs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl shadow-sm">
                      <span className="text-[11px] font-bold text-white/70">잡담 색상을 회색으로 통일</span>
                      <Toggle enabled={disableOtherColor} onChange={(val) => { setDisableOtherColor(val); saveToHistory({ charSettings, tabSettings, cssFormat, fontSize, fontFamily, theme, disableOtherColor: val }); }} />
                    </div>
                    
                    <div className="p-3 bg-white/5 border border-white/5 rounded-xl shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-white/70">탭 이름 표시</span>
                      </div>
                      <div className="flex bg-black/20 p-0.5 rounded-lg border border-white/5 gap-0.75">
                        {(['main', 'other', 'info', 'secret'] as TabFormat[]).map(f => (
                          <button
                            key={f}
                            onClick={() => {
                              const next = new Set(showTabNames);
                              if (next.has(f)) next.delete(f);
                              else next.add(f);
                              setShowTabNames(next);
                              saveToHistory({ showTabNames: Array.from(next) });
                            }}
                            className={`flex-1 py-1 text-[9px] font-bold rounded-md transition-all ${
                              showTabNames.has(f) 
                                ? 'bg-[#e6005c] text-white shadow-sm' 
                                : 'text-white/30 hover:text-white/60'
                            }`}
                          >
                            {f === 'main' ? '메인' : f === 'other' ? '잡담' : f === 'info' ? '정보' : '비밀'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 bg-white/5 border border-white/5 rounded-xl shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-white/70">발언자별 통합</span>
                        <div className="text-[9px] text-white/30 font-medium text-right">
                          연속되는 대사를 하나의 블록으로 합칩니다.
                        </div>
                      </div>
                      <div className="flex bg-black/20 p-0.5 rounded-lg border border-white/5 gap-0.75">
                        {(['main', 'other', 'info', 'secret'] as TabFormat[]).map(f => (
                          <button
                            key={f}
                            onClick={() => {
                              const next = new Set(mergeTabs);
                              if (next.has(f)) next.delete(f);
                              else next.add(f);
                              setMergeTabs(next);
                            }}
                            className={`flex-1 py-1 text-[9px] font-bold rounded-md transition-all ${
                              mergeTabs.has(f) 
                                ? 'bg-[#e6005c] text-white shadow-sm' 
                                : 'text-white/30 hover:text-white/60'
                            }`}
                          >
                            {f === 'main' ? '메인' : f === 'other' ? '잡담' : f === 'info' ? '정보' : '비밀'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 bg-white/5 border border-white/5 rounded-xl shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-white/70">탭별 통합</span>
                        <div className="text-[9px] text-white/30 font-medium text-right">
                          동일한 탭의 블록을 연결합니다.
                        </div>
                      </div>
                      <div className="flex bg-black/20 p-0.5 rounded-lg border border-white/5 gap-0.75">
                        {(['main', 'other', 'info', 'secret'] as TabFormat[]).map(f => {
                          const isDisabled = f === 'main' || f === 'other';
                          return (
                            <button
                              key={f}
                              disabled={isDisabled}
                              onClick={() => {
                                const next = new Set(mergeTabStyles);
                                if (next.has(f)) next.delete(f);
                                else next.add(f);
                                setMergeTabStyles(next);
                              }}
                              className={`flex-1 py-1 text-[9px] font-bold rounded-md transition-all ${
                                isDisabled 
                                  ? 'bg-transparent text-white/10 cursor-not-allowed'
                                  : mergeTabStyles.has(f) 
                                    ? 'bg-[#e6005c] text-white shadow-sm' 
                                    : 'text-white/30 hover:text-white/60'
                              }`}
                            >
                              {f === 'main' ? '메인' : f === 'other' ? '잡담' : f === 'info' ? '정보' : '비밀'}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-2 mb-4">
                    <Settings className="w-3.5 h-3.5" /> 탭별 출력 설정
                  </h2>
                  {tabOrder.length > 0 ? (
                    tabOrder.map(tabName => {
                      const tab = tabSettings[tabName];
                      if (!tab) return null;
                      return (
                        <div key={tab.name} className="p-3 bg-white/5 rounded-xl border border-white/5 shadow-sm flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <Toggle 
                            enabled={tab.visible} 
                            onChange={(val) => {
                              const next = { ...tabSettings, [tab.name]: { ...tab, visible: val } };
                              setTabSettings(next);
                              saveToHistory({ charSettings, tabSettings: next, cssFormat, fontSize, fontFamily, theme, disableOtherColor });
                            }} 
                          />
                          {renamingTab === tab.name ? (
                            <div className="flex gap-1 flex-1">
                              <input 
                                type="text"
                                value={newTabNameInput}
                                autoFocus
                                onChange={(e) => setNewTabNameInput(e.target.value)}
                                onBlur={() => renameTab(tab.name, newTabNameInput)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') renameTab(tab.name, newTabNameInput);
                                  if (e.key === 'Escape') setRenamingTab(null);
                                }}
                                className="bg-black/40 text-[11px] font-bold text-white px-2 py-1 rounded border border-[#e6005c] outline-none flex-1"
                              />
                              <button 
                                onClick={() => renameTab(tab.name, newTabNameInput)}
                                className="p-1 bg-[#e6005c] text-white rounded"
                              >
                                <CheckSquare className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 flex-1 overflow-hidden">
                              <span 
                                className="text-[11px] font-bold truncate text-white/80"
                              >
                                {tab.name}
                              </span>
                              <button 
                                onClick={() => { setRenamingTab(tab.name); setNewTabNameInput(tab.name); }}
                                className="p-1 text-white/20 hover:text-[#e6005c] transition-colors"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex bg-black/20 p-0.5 rounded-lg border border-white/5 gap-3 flex-1">
                            {(['main', 'other', 'info', 'secret'] as TabFormat[]).map(f => (
                              <button
                                key={f}
                                onClick={() => {
                                  const next = { ...tabSettings, [tab.name]: { ...tab, format: f } };
                                  setTabSettings(next);
                                  saveToHistory({ charSettings, tabSettings: next, cssFormat, fontSize, fontFamily, theme, disableOtherColor });
                                }}
                                className={`flex-1 py-1 text-[9px] font-bold rounded-md transition-all ${
                                  tab.format === f 
                                    ? 'bg-[#e6005c] text-white shadow-sm' 
                                    : 'text-white/30 hover:text-white/60'
                                }`}
                              >
                                {f === 'main' ? '메인' : f === 'other' ? '잡담' : f === 'info' ? '정보' : '비밀'}
                              </button>
                            ))}
                          </div>
                          
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                if (activeColorPicker === `tab-${tab.name}`) {
                                  setActiveColorPicker(null);
                                  setColorPickerRect(null);
                                } else {
                                  setActiveColorPicker(`tab-${tab.name}`);
                                  setColorPickerRect(e.currentTarget.getBoundingClientRect());
                                }
                              }}
                              className="w-6 h-6 rounded-md border border-white/10 shadow-sm transition-all hover:scale-105"
                              style={{ backgroundColor: tab.color || (tab.format === 'secret' ? '#ffd400' : '#e6005c') }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                    <div className="text-center py-20 text-white/10">
                      <Settings className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm font-medium">로그를 먼저 업로드하세요</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'chars' && (
              <motion.div 
                key="chars"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl shadow-sm">
                  <span className="text-[11px] font-bold text-white/70">이미지 배경 상자 숨김</span>
                  <Toggle 
                    enabled={hideEmptyAvatars} 
                    onChange={(val) => {
                      setHideEmptyAvatars(val);
                      saveToHistory({ hideEmptyAvatars: val });
                    }} 
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl shadow-sm relative" ref={narrationDropdownRef}>
                  <span className="text-[11px] font-bold text-white/70">나레이션 캐릭터</span>
                  <div className="relative">
                    <button
                      onClick={() => setIsNarrationDropdownOpen(!isNarrationDropdownOpen)}
                      className="flex items-center gap-2 bg-black/20 border border-white/10 rounded-lg text-[10px] text-white/80 px-2 py-1 outline-none hover:border-white/20 transition-colors"
                    >
                      <span className="max-w-[100px] truncate">{narrationCharacter || '선택 안 함'}</span>
                      <ChevronDown className="w-3 h-3 opacity-50" />
                    </button>
                    
                    {isNarrationDropdownOpen && (
                      <div className="absolute right-0 top-full mt-1 w-40 bg-[#222] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
                        <div className="max-h-80 overflow-y-auto custom-scrollbar p-1">
                          <button
                            onClick={() => {
                              setNarrationCharacter(null);
                              saveToHistory({ narrationCharacter: null });
                              setIsNarrationDropdownOpen(false);
                            }}
                            className={cn(
                              "w-full text-left px-3 py-2 text-[11px] rounded-lg transition-colors",
                              !narrationCharacter ? "bg-[#e6005c] text-white font-bold" : "text-white/60 hover:bg-white/5 hover:text-white"
                            )}
                          >
                            선택 안 함
                          </button>
                          {Object.keys(charSettings).map(charName => (
                            <button
                              key={charName}
                              onClick={() => {
                                setNarrationCharacter(charName);
                                saveToHistory({ narrationCharacter: charName });
                                setIsNarrationDropdownOpen(false);
                              }}
                              className={cn(
                                "w-full text-left px-3 py-2 text-[11px] rounded-lg transition-colors truncate",
                                narrationCharacter === charName ? "bg-[#e6005c] text-white font-bold" : "text-white/60 hover:bg-white/5 hover:text-white"
                              )}
                            >
                              {charName}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" /> 캐릭터 설정
                  </h2>
                  <button 
                    onClick={() => setCharSortMode(charSortMode === 'appearance' ? 'alphabetical' : 'appearance')}
                    className="flex items-center gap-1.5 px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-bold text-white/40 hover:text-white transition-all border border-white/5"
                  >
                    <ArrowUpDown className="w-3 h-3" />
                    {charSortMode === 'appearance' ? '등장순' : '가나다순'}
                  </button>
                </div>
                {sortedCharOrder.length > 0 ? (
                  <div className="space-y-2">
                    {sortedCharOrder.map(charName => {
                      const char = charSettings[charName];
                      if (!char) return null;
                      return (
                        <div key={char.name} className="p-2 bg-white/5 rounded-2xl border border-white/5 shadow-sm flex items-center gap-2 relative group/charitem">
                          <div className="shrink-0">
                            <Toggle 
                              enabled={char.visible} 
                              onChange={(val) => {
                                const next = { ...charSettings, [char.name]: { ...char, visible: val } };
                                setCharSettings(next);
                                saveToHistory({ charSettings: next, tabSettings, cssFormat, fontSize, fontFamily, theme, disableOtherColor });
                              }} 
                            />
                          </div>
                          
                          {renamingChar === char.name ? (
                            <div className="flex gap-1 w-32 shrink-0">
                              <input 
                                type="text" 
                                value={newNameInput}
                                onChange={(e) => setNewNameInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') renameCharacter(char.name, newNameInput);
                                  if (e.key === 'Escape') setRenamingChar(null);
                                }}
                                className="w-full text-[10px] font-bold px-1 py-0.5 border border-[#e6005c] rounded outline-none bg-black/20 text-white"
                                autoFocus
                              />
                              <button 
                                onClick={() => renameCharacter(char.name, newNameInput)}
                                className="p-0.5 bg-[#e6005c] text-white rounded"
                              >
                                <CheckSquare className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 w-24 shrink-0 overflow-visible relative">
                              <CharacterNameWithTooltip name={char.name} />
                              <button 
                                onClick={() => { setRenamingChar(char.name); setNewNameInput(char.name); }}
                                className="p-0.5 text-white/20 hover:text-[#e6005c] transition-colors"
                              >
                                <Pencil className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          )}

                          <div className="relative shrink-0">
                            <button
                              onClick={(e) => {
                                if (activeColorPicker === char.name) {
                                  setActiveColorPicker(null);
                                  setColorPickerRect(null);
                                } else {
                                  setActiveColorPicker(char.name);
                                  setColorPickerRect(e.currentTarget.getBoundingClientRect());
                                }
                              }}
                              className="w-5 h-5 rounded-md border border-white/10 shadow-sm transition-transform active:scale-90"
                              style={{ backgroundColor: char.color }}
                            />
                          </div>

                          <input 
                            type="text" 
                            placeholder="이미지 URL"
                            value={char.imageUrl}
                            onChange={(e) => {
                              const next = { ...charSettings, [char.name]: { ...char, imageUrl: e.target.value } };
                              setCharSettings(next);
                            }}
                            onBlur={() => {
                              saveToHistory({ charSettings, tabSettings, cssFormat, fontSize, fontFamily, theme, disableOtherColor });
                            }}
                            className="flex-1 min-w-0 text-[10px] px-2 py-1.5 bg-black/20 border border-white/5 rounded-lg outline-none focus:border-[#e6005c] text-white/80 transition-colors"
                          />
                          
                          <div className="group/charimg relative w-7 h-7 rounded-lg bg-black/20 border border-white/5 shrink-0 flex items-center justify-center ml-auto">
                            {char.imageUrl ? (
                              <>
                                <img src={char.imageUrl} alt="" referrerPolicy="no-referrer" className="max-w-full max-h-full object-contain rounded-lg" />
                                <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 z-[100] hidden group-hover/charimg:block pointer-events-none">
                                  <div className="bg-[#1a1a1a] p-1.5 rounded-xl border border-white/20 shadow-2xl overflow-hidden min-w-[128px] min-h-[128px] flex items-center justify-center">
                                    <img src={char.imageUrl} alt="" referrerPolicy="no-referrer" className="w-32 h-32 object-contain rounded-lg block" />
                                  </div>
                                </div>
                              </>
                            ) : (
                              <ImageIcon className="w-3.5 h-3.5 text-white/10" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-20 text-white/10">
                    <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">로그를 먼저 업로드하세요</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <h2 className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
                    <Layout className="w-3.5 h-3.5" /> 테마 설정
                  </h2>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => { setTheme('dark'); saveToHistory({ charSettings, tabSettings, cssFormat, fontSize, fontFamily, theme: 'dark', disableOtherColor }); }}
                      className={`py-2 px-3 rounded-xl border-2 transition-all text-[11px] font-bold ${
                        theme === 'dark' 
                          ? 'bg-[#e6005c] border-[#e6005c] text-white' 
                          : 'bg-white/5 border-white/5 text-white/40 hover:border-white/10'
                      }`}
                    >
                      다크 모드
                    </button>
                    <button 
                      onClick={() => { setTheme('light'); saveToHistory({ charSettings, tabSettings, cssFormat, fontSize, fontFamily, theme: 'light', disableOtherColor }); }}
                      className={`py-2 px-3 rounded-xl border-2 transition-all text-[11px] font-bold ${
                        theme === 'light' 
                          ? 'bg-white border-white text-stone-900' 
                          : 'bg-white/5 border-white/5 text-white/40 hover:border-white/10'
                      }`}
                    >
                      화이트 모드
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
                      <Type className="w-3.5 h-3.5" /> 폰트 설정
                    </h2>
                  </div>
                  <select 
                    value={fontFamily}
                    onChange={(e) => { setFontFamily(e.target.value); saveToHistory({ charSettings, tabSettings, cssFormat, fontSize, fontFamily: e.target.value, theme, disableOtherColor }); }}
                    className="w-full p-3 bg-white/5 border border-white/5 rounded-xl text-xs font-bold outline-none focus:border-[#e6005c] text-white/80 transition-all"
                  >
                    {fonts.map(f => (
                      <option key={f.name} value={f.name} className="bg-[#1a1a1a]">{f.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h2 className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
                        <Type className="w-3.5 h-3.5" /> 전체 크기 조절
                      </h2>
                      <div className="group relative">
                        <HelpCircle className="w-3 h-3 text-white/20 cursor-help" />
                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-stone-800 text-white text-[9px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                          폰트 크기에 맞춰 인장 및 간격이 자동 조절됩니다.
                        </div>
                      </div>
                    </div>
                    {isEditingFontSize ? (
                      <input 
                        type="number"
                        value={fontSize}
                        autoFocus
                        onBlur={() => setIsEditingFontSize(false)}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 12;
                          setFontSize(val);
                          saveToHistory({ charSettings, tabSettings, cssFormat, fontSize: val, fontFamily, theme, disableOtherColor });
                        }}
                        className="w-12 text-right text-xs font-bold text-[#e6005c] bg-pink-500/10 border border-pink-500/20 rounded px-1 outline-none"
                      />
                    ) : (
                      <span 
                        onClick={() => setIsEditingFontSize(true)}
                        className="text-xs font-bold text-[#e6005c] cursor-pointer hover:underline"
                      >
                        {fontSize}px
                      </span>
                    )}
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="30" 
                    step="1"
                    value={fontSize} 
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setFontSize(val);
                      saveToHistory({ charSettings, tabSettings, cssFormat, fontSize: val, fontFamily, theme, disableOtherColor });
                    }}
                    className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-[#e6005c]"
                  />
                </div>

                <div className="space-y-4">
                  <h2 className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
                    <Palette className="w-3.5 h-3.5" /> CSS 출력 형식
                  </h2>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="group relative">
                      <button 
                        onClick={() => { setCssFormat('internal'); saveToHistory({ charSettings, tabSettings, cssFormat: 'internal', fontSize, fontFamily, theme, disableOtherColor }); }}
                        className={`w-full py-2 px-3 rounded-xl border-2 transition-all text-[11px] font-bold ${
                          cssFormat === 'internal' 
                            ? 'bg-[#e6005c] border-[#e6005c] text-white' 
                            : 'bg-white/5 border-white/5 text-white/40 hover:border-white/10'
                        }`}
                      >
                        내부 스타일
                      </button>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-stone-800 text-white text-[9px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        HTML 상단에 스타일 시트를 포함합니다. (권장)
                      </div>
                    </div>
                    <div className="group relative">
                      <button 
                        onClick={() => { setCssFormat('inline'); saveToHistory({ charSettings, tabSettings, cssFormat: 'inline', fontSize, fontFamily, theme, disableOtherColor }); }}
                        className={`w-full py-2 px-3 rounded-xl border-2 transition-all text-[11px] font-bold ${
                          cssFormat === 'inline' 
                            ? 'bg-[#e6005c] border-[#e6005c] text-white' 
                            : 'bg-white/5 border-white/5 text-white/40 hover:border-white/10'
                        }`}
                      >
                        인라인 스타일
                      </button>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-stone-800 text-white text-[9px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        각 태그에 직접 스타일을 부여합니다.
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Footer */}
        <div className="p-2 border-t border-white/5 bg-[#1a1a1a] shrink-0 space-y-1">
          <div className="flex items-center gap-1">
            <button 
              onClick={undo}
              disabled={historyIndex <= 0}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white disabled:opacity-10 transition-all text-[9px] font-bold border border-white/5"
              title="되돌리기"
            >
              <Undo2 className="w-3 h-3" />
              되돌리기
            </button>
            <button 
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white disabled:opacity-10 transition-all text-[9px] font-bold border border-white/5"
              title="다시 실행"
            >
              <Redo2 className="w-3 h-3" />
              다시 실행
            </button>
            <button 
              onClick={resetSettings}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-white/5 hover:bg-red-500/20 rounded-lg text-white/40 hover:text-red-400 transition-all text-[9px] font-bold border border-white/5"
              title="초기화"
            >
              <RotateCcw className="w-3 h-3" />
              초기화
            </button>
          </div>

          <div className="flex items-center justify-center pt-0.5 opacity-30">
            <span className="text-[8px] font-bold text-white/40 uppercase tracking-[0.3em]">v1.0.0</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 flex-col bg-[#0f0f0f] relative overflow-hidden min-w-0",
        mobileTab === 'preview' ? 'flex' : 'hidden md:flex'
      )}>
        <div className={cn(
          "h-16 border-b flex items-center justify-between px-4 xl:px-8 shrink-0 gap-4 min-w-0",
          "bg-[#1a1a1a] border-white/5"
        )}>
          <div className="flex items-center gap-3 xl:gap-6 shrink-0 min-w-0">
            <div className={cn(
              "flex items-center justify-center gap-2 px-2.5 xl:px-3 py-1.5 rounded-lg border shrink-0",
              "bg-white/5 border-white/5"
            )}>
              <Eye className={cn("w-3.5 h-3.5 shrink-0", "text-white/40")} />
              <span className={cn("hidden xl:inline-block text-[11px] font-bold truncate", "text-white/60")}>미리보기</span>
            </div>
            <div className={cn("hidden xl:block h-4 w-px shrink-0", "bg-white/10")} />
            <p className={cn("hidden xl:block text-[11px] font-bold truncate", "text-white/30")}>
              총 <span className="text-white/60">{logs.length}</span>개의 로그 항목
            </p>
          </div>

          <div className="flex items-center gap-2 xl:gap-3 shrink-1 min-w-0">
            {isTitleEditing ? (
              <div className="flex items-center gap-1 shrink-1 min-w-0">
                <div className="relative w-28 xl:w-48 shrink-1 min-w-[80px]">
                  <input 
                    type="text"
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setPageTitle(tempTitle);
                        saveToHistory({ pageTitle: tempTitle });
                        setIsTitleEditing(false);
                      } else if (e.key === 'Escape') {
                        setTempTitle(pageTitle);
                        setIsTitleEditing(false);
                      }
                    }}
                    className={cn(
                      "w-full border rounded-xl px-3 py-2 text-[11px] font-bold outline-none transition-colors",
                      "bg-black/20 border-[#e6005c] text-white placeholder:text-white/20"
                    )}
                    placeholder="제목 입력"
                    autoFocus
                    onBlur={() => {
                      // Small delay to allow button click
                      setTimeout(() => setIsTitleEditing(false), 200);
                    }}
                  />
                </div>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setPageTitle(tempTitle);
                    saveToHistory({ pageTitle: tempTitle });
                    setIsTitleEditing(false);
                  }}
                  className="px-2.5 py-2 bg-[#e6005c] text-white rounded-xl text-[10px] font-bold hover:bg-[#ff0066] transition-all active:scale-95 shrink-0"
                >
                  확인
                </button>
              </div>
            ) : (
              <div 
                onClick={() => {
                  setIsTitleEditing(true);
                  setTempTitle(pageTitle);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 cursor-pointer group transition-colors shrink-1 min-w-0"
              >
                <span className={cn(
                  "text-[11px] font-bold truncate max-w-[100px] xl:max-w-[180px]",
                  pageTitle ? "text-white" : "text-white/20"
                )}>
                  {pageTitle || "제목 변경"}
                </span>
                <Pencil className="w-3.5 h-3.5 text-white/20 group-hover:text-white/40 transition-colors shrink-0" />
              </div>
            )}
            <button 
              onClick={() => {
                const filename = `${pageTitle || 'log'}_style`;
                const data = { 
                  charSettings, 
                  charOrder, 
                  tabSettings, 
                  cssFormat, 
                  fontSize, 
                  disableOtherColor, 
                  pageTitle, 
                  fontFamily, 
                  theme,
                  sectionNames,
                  splitPoints: Array.from(splitPoints),
                  insertedImages
                };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${filename}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className={cn(
                "flex items-center justify-center gap-2 px-3 xl:px-4 py-2 border rounded-xl transition-all text-[11px] font-bold shrink-0",
                "bg-white/5 hover:bg-white/10 border-white/10 text-white/60 hover:text-white"
              )}
              title="스타일 저장"
            >
              <FileJson className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xl:inline-block truncate">스타일 저장</span>
            </button>

            <div className="relative">
              <button 
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                className="flex items-center justify-center gap-2 px-3 xl:px-6 py-2 bg-[#e6005c] hover:bg-[#ff0066] rounded-xl text-white shadow-lg shadow-pink-500/20 transition-all text-[11px] font-bold shrink-0"
                title="HTML 다운로드"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden xl:inline-block truncate">HTML 다운로드</span>
              </button>
              
              <AnimatePresence>
                {showDownloadMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowDownloadMenu(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-64 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden p-2"
                    >
                      <button 
                        onClick={() => { copyToClipboard(generateFinalHtml()); setShowDownloadMenu(false); }}
                        className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-colors text-left"
                      >
                        <Copy className="w-4 h-4 text-blue-400" />
                        <div>
                          <p className="text-[11px] font-bold text-white">HTML 복사</p>
                          <p className="text-[9px] text-white/30">클립보드에 전체 HTML 복사</p>
                        </div>
                      </button>

                      <div className="flex items-center gap-2 pr-2">
                        <button 
                          onClick={() => { downloadHtml(); setShowDownloadMenu(false); }}
                          className="flex-1 flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-colors text-left"
                        >
                          <FileText className="w-4 h-4 text-emerald-400" />
                          <div>
                            <p className="text-[11px] font-bold text-white">전체 다운로드</p>
                            <p className="text-[9px] text-white/30">하나의 HTML 파일로 저장</p>
                          </div>
                        </button>
                      </div>
                      
                      {splitPoints.size > 0 && (
                        <>
                          <div className="h-px bg-white/5 my-1" />
                          <div className="px-3 py-2">
                            <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">분할 섹션</p>
                          </div>
                          <div className="max-h-64 overflow-y-auto custom-scrollbar">
                            {(() => {
                              const sortedPoints = Array.from(splitPoints).sort((a: number, b: number) => a - b);
                              const sections: { start: number; end: number }[] = [];
                              let last = 0;
                              sortedPoints.forEach((p: number) => {
                                sections.push({ start: last, end: p });
                                last = p + 1;
                              });
                              sections.push({ start: last, end: mergedLogs.length - 1 });
                              
                              return sections.map((s, i) => (
                                <div key={i} className="flex items-center gap-2 pr-2 group">
                                  <button 
                                    onClick={() => { downloadHtml(s); setShowDownloadMenu(false); }}
                                    className="flex-1 flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-colors text-left"
                                  >
                                    <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[9px] font-bold text-white/40 group-hover:text-white/60">
                                      {i + 1}
                                    </div>
                                    <div>
                                      <p className="text-[11px] font-bold text-white truncate max-w-[120px]">{sectionNames[s.start] || `섹션 ${i + 1}`}</p>
                                      <p className="text-[9px] text-white/30">{s.start + 1} ~ {s.end + 1}번 블록</p>
                                    </div>
                                  </button>
                                  <button 
                                    onClick={() => { copyToClipboard(generateFinalHtml(s)); setShowDownloadMenu(false); }}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/30 hover:text-white"
                                    title="HTML 복사"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ));
                            })()}
                          </div>
                          <div className="h-px bg-white/5 my-1" />
                          <button 
                            onClick={() => { downloadZip(); setShowDownloadMenu(false); }}
                            className="w-full flex items-center gap-3 p-3 hover:bg-[#e6005c]/20 rounded-xl transition-colors text-left group"
                          >
                            <Plus className="w-4 h-4 text-[#e6005c]" />
                            <div>
                              <p className="text-[11px] font-bold text-[#e6005c]">ZIP으로 모두 저장</p>
                              <p className="text-[9px] text-[#e6005c]/40">모든 섹션을 압축파일로 저장</p>
                            </div>
                          </button>
                        </>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Preview Area */}
        <div 
          ref={previewContainerRef}
          className={cn(
            "flex-1 overflow-y-auto custom-scrollbar relative min-w-0 transition-colors",
            theme === 'dark' ? "bg-[#242424]" : "bg-white"
          )}
        >
          <div className="w-full min-w-0 min-h-full flex flex-col">
            {logs.length > 0 ? (
              <div className="relative group/preview">
                <div className={cn(
                  "min-h-screen relative transition-colors",
                  theme === 'dark' ? "bg-[#242424]" : "bg-white"
                )}>
                  {/* Top Section Name Input */}
                  <div className="max-w-[800px] mx-auto px-4 pt-4 pb-1 font-sans relative">
                    <div className="flex items-end justify-between max-w-full">
                      <div className="bg-[#e6005c] rounded-t-lg px-4 py-1.5 flex items-center shadow-lg max-w-sm">
                        <input 
                          type="text"
                          value={sectionNames[0] || ''}
                          onChange={(e) => setSectionNames(prev => ({ ...prev, [0]: e.target.value }))}
                          placeholder="섹션 1"
                          className="bg-transparent border-none text-xs font-bold text-white outline-none placeholder:text-white/30 w-48"
                        />
                      </div>
                      <div className={cn(
                        "text-[10px] font-bold mb-1",
                        theme === 'dark' ? "text-white/40" : "text-stone-400"
                      )}>
                        {`1 - ${splitPointsArray.length > 0 ? splitPointsArray[0] + 1 : mergedLogs.length}번 블록`}
                      </div>
                    </div>
                    <div className="h-px bg-[#e6005c] w-full" />
                  </div>

                  {/* We render the logs as a list of components for interactivity */}
                  <div className="log-container" style={{ 
                    maxWidth: '800px', 
                    margin: '0 auto', 
                    padding: '0 0 40px 0',
                    backgroundColor: theme === 'dark' ? '#242424' : '#FFFFFF',
                    color: theme === 'dark' ? '#EEEEEE' : '#333333',
                    fontFamily: fontFamily !== '(폰트 적용X)' ? (fonts.find(f => f.name === fontFamily)?.value || 'sans-serif') : undefined,
                    fontSize: `${fontSize}px`
                  }}>
                    {/* Inject Base Styles */}
                    <style>{`
                      @import url('https://hangeul.pstatic.net/hangeul_static/css/nanum-gothic-coding.css');
                      .log-item-wrapper { 
                        position: relative; 
                        border-bottom: 1px solid transparent;
                        transition: border-color 0.2s;
                      }
                      .log-item-wrapper:hover {
                        border-bottom: 1px dotted ${theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'};
                      }
                      .log-item-wrapper:hover .block-number { opacity: 1; }
                      .log-item-wrapper:hover .split-trigger { opacity: 1; }
                      .block-number { 
                        position: absolute; 
                        right: 12px; 
                        top: 8px; 
                        font-size: 10px; 
                        font-weight: bold; 
                        color: ${theme === 'dark' ? '#666' : '#CCC'}; 
                        opacity: 0; 
                        transition: opacity 0.2s;
                        pointer-events: none;
                        z-index: 10;
                        padding: 2px 6px;
                        font-family: sans-serif !important;
                      }
                      .section-name-input {
                        background: transparent;
                        border: none;
                        border-bottom: 1px dashed #e6005c;
                        color: white;
                        font-size: 11px;
                        font-weight: bold;
                        padding: 2px 4px;
                        width: 150px;
                        outline: none;
                      }
                      .section-name-input::placeholder {
                        color: #e6005c;
                        opacity: 0.4;
                      }
                      .split-trigger {
                        position: absolute;
                        bottom: -14px;
                        left: 50%;
                        transform: translateX(-50%);
                        z-index: 30;
                        opacity: 0;
                        transition: opacity 0.2s;
                        display: flex;
                        gap: 8px;
                      }
                      .split-line {
                        position: absolute;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        height: 2px;
                        background: #e6005c;
                        box-shadow: 0 0 10px rgba(230,0,92,0.5);
                        z-index: 10;
                      }
                    `}</style>

                    {(() => {
                      const filteredLogsWithGlobalIdx = mergedLogs.map((log, globalIdx) => ({ log, globalIdx }))
                        .filter(({ log }) => 
                          tabSettings[log.tab]?.visible && 
                          (charSettings[log.name]?.visible !== false)
                        );
                      
                      return filteredLogsWithGlobalIdx.slice(0, visibleCount).map(({ log, globalIdx }, idx) => {
                        const prevGlobalIdx = idx > 0 ? filteredLogsWithGlobalIdx[idx - 1].globalIdx : -1;
                        const isPrevSameTab = idx > 0 && filteredLogsWithGlobalIdx[idx - 1].log.tab === log.tab;
                        const isNextSameTab = idx < filteredLogsWithGlobalIdx.length - 1 && filteredLogsWithGlobalIdx[idx + 1].log.tab === log.tab;
                        const stableId = log.id.startsWith('merged:') ? log.id.split(',').pop()! : log.id;
                        
                        return (
                          <LogItem 
                            key={log.id}
                            idx={globalIdx}
                            stableId={stableId}
                            log={log}
                            tabSet={tabSettings[log.tab]}
                            char={charSettings[log.name] || { name: log.name, color: log.color, visible: true }}
                            charSettings={charSettings}
                            theme={theme}
                            disableOtherColor={disableOtherColor}
                            fontSize={fontSize}
                            narrationCharacter={narrationCharacter}
                            insertedImages={insertedImages}
                            splitPoints={splitPoints}
                            sectionNames={sectionNames}
                            imageInputIdx={imageInputIdx}
                            onToggleSplit={(i: number) => {
                              const next = new Set(splitPoints);
                              if (next.has(i)) next.delete(i);
                              else next.add(i);
                              setSplitPoints(next);
                              saveToHistory({ splitPoints: Array.from(next) });
                            }}
                            onRenameSection={(i: number, name: string) => {
                              const next = { ...sectionNames, [i]: name };
                              setSectionNames(next);
                              saveToHistory({ sectionNames: next });
                            }}
                            onInsertImage={(i: number) => {
                              setImageInputIdx(i === imageInputIdx ? null : i);
                            }}
                            onAddImageUrl={(id: string, url: string) => {
                              const next = { ...insertedImages };
                              if (!next[id]) next[id] = [];
                              next[id].push({ url, width: '400', align: 'center' });
                              setInsertedImages(next);
                              saveToHistory({ insertedImages: next });
                              setImageInputIdx(null);
                            }}
                            onDeleteImage={(id: string, imgIdx: number) => {
                              const next = { ...insertedImages };
                              next[id] = next[id].filter((_: any, j: number) => j !== imgIdx);
                              if (next[id].length === 0) delete next[id];
                              setInsertedImages(next);
                              saveToHistory({ insertedImages: next });
                            }}
                            onUpdateImageWidth={(id: string, imgIdx: number, width: string) => {
                              const next = { ...insertedImages };
                              if (next[id] && next[id][imgIdx]) {
                                next[id][imgIdx] = { ...next[id][imgIdx], width };
                                setInsertedImages(next);
                                saveToHistory({ insertedImages: next });
                              }
                            }}
                            onUpdateImageAlign={(id: string, imgIdx: number, align: 'left' | 'center' | 'right') => {
                              const next = { ...insertedImages };
                              if (next[id] && next[id][imgIdx]) {
                                next[id][imgIdx] = { ...next[id][imgIdx], align };
                                setInsertedImages(next);
                                saveToHistory({ insertedImages: next });
                              }
                            }}
                            onEditLog={onEditLog}
                            onDeleteLog={onDeleteLog}
                            mergedLogsCount={mergedLogs.length}
                            splitPointsArray={splitPointsArray}
                            isPrevSameTab={isPrevSameTab}
                            isNextSameTab={isNextSameTab}
                            isPrevSplit={idx > 0 && splitPoints.has(prevGlobalIdx)}
                            mergeTabStyles={mergeTabStyles}
                            showTabNames={showTabNames}
                            hideEmptyAvatars={hideEmptyAvatars}
                          />
                        );
                      });
                    })()}
                    
                    {visibleCount < mergedLogs.length && (
                      <div className="py-10 text-center text-stone-400 text-xs font-bold">
                        스크롤하여 더 보기... ({visibleCount} / {mergedLogs.length})
                      </div>
                    )}
                  </div>
                </div>

                {activeColorPicker && colorPickerRect && (
                  <>
                    {activeColorPicker.startsWith('tab-') ? (
                      <ColorPickerPopup 
                        color={tabSettings[activeColorPicker.replace('tab-', '')]?.color || '#ffd400'} 
                        extractedColors={extractedColors}
                        triggerRect={colorPickerRect}
                        onClose={() => {
                          setActiveColorPicker(null);
                          setColorPickerRect(null);
                        }}
                        onChange={(newColor) => {
                          const tabName = activeColorPicker.replace('tab-', '');
                          const next = { ...tabSettings, [tabName]: { ...tabSettings[tabName], color: newColor } };
                          setTabSettings(next);
                          saveToHistory({ charSettings, tabSettings: next, cssFormat, fontSize, fontFamily, theme, disableOtherColor });
                        }}
                      />
                    ) : (
                      <ColorPickerPopup 
                        color={charSettings[activeColorPicker]?.color || '#ffffff'} 
                        extractedColors={extractedColors}
                        triggerRect={colorPickerRect}
                        onClose={() => {
                          setActiveColorPicker(null);
                          setColorPickerRect(null);
                        }}
                        onChange={(newColor) => {
                          const next = { ...charSettings, [activeColorPicker]: { ...charSettings[activeColorPicker], color: newColor } };
                          setCharSettings(next);
                          saveToHistory({ charSettings: next, tabSettings, cssFormat, fontSize, fontFamily, theme, disableOtherColor });
                        }}
                      />
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-white/20 space-y-6 py-40">
                <div className="relative">
                  <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center animate-pulse">
                    <Upload className="w-12 h-12 text-white/10" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-2xl font-bold text-white/40 tracking-tight">로그 파일을 기다리고 있어요</p>
                  <p className="text-sm font-medium text-white/20">CCFOLIA에서 추출한 HTML 파일을 업로드하여 시작하세요</p>
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-8 py-3 bg-[#e6005c] text-white rounded-2xl text-sm font-bold hover:bg-[#ff0066] transition-all shadow-xl shadow-pink-500/20 active:scale-95"
                >
                  업로드하기
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <div className="md:hidden h-16 bg-[#1a1a1a] border-t border-white/5 flex shrink-0 z-50">
        <button 
          onClick={() => setMobileTab('settings')} 
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-1 transition-colors",
            mobileTab === 'settings' ? "text-[#e6005c]" : "text-white/40 hover:text-white/60"
          )}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-bold">설정</span>
        </button>
        <button 
          onClick={() => setMobileTab('preview')} 
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-1 transition-colors",
            mobileTab === 'preview' ? "text-[#e6005c]" : "text-white/40 hover:text-white/60"
          )}
        >
          <Eye className="w-5 h-5" />
          <span className="text-[10px] font-bold">미리보기</span>
        </button>
      </div>
      <Analytics />
    </div>
  );
}

// Helper Components
const CharacterNameWithTooltip = ({ name }: { name: string }) => {
  const [isTruncated, setIsTruncated] = useState(false);
  const spanRef = useRef<HTMLSpanElement>(null);

  const checkTruncation = () => {
    if (spanRef.current) {
      setIsTruncated(spanRef.current.scrollWidth > spanRef.current.clientWidth);
    }
  };

  return (
    <div className="flex-1 min-w-0 relative group/tooltip">
      <span 
        ref={spanRef}
        onMouseEnter={checkTruncation}
        className="text-[10px] font-bold truncate block text-white cursor-default"
      >
        {name}
      </span>
      {isTruncated && (
        <div className="absolute left-0 bottom-full mb-1 px-2 py-1 bg-stone-800 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-all duration-200 pointer-events-none z-[100] shadow-xl border border-white/10">
          {name}
        </div>
      )}
    </div>
  );
};

interface ColorPickerPopupProps {
  color: string;
  extractedColors: string[];
  triggerRect: DOMRect;
  onChange: (newColor: string) => void;
  onClose: () => void;
}

const DEFAULT_COLORS = [
  '#212121', '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3',
  '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b',
  '#ffc107', '#ff9800', '#ff5722', '#795548', '#607d8b', '#9e9e9e', '#e0e0e0'
];

const ColorPickerPopup = ({ color, extractedColors, triggerRect, onClose, onChange }: ColorPickerPopupProps) => {
  const [mode, setMode] = useState<'hex' | 'rgb'>('hex');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedColor, setSelectedColor] = useState(color);
  const [tempColorInput, setTempColorInput] = useState(color);
  const [position, setPosition] = useState({ top: -9999, left: -9999 });
  const [isPositioned, setIsPositioned] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (popupRef.current && triggerRect) {
      const popupRect = popupRef.current.getBoundingClientRect();
      const popupWidth = popupRect.width;
      const popupHeight = popupRect.height;
      
      let top = triggerRect.bottom + 8;
      let left = triggerRect.left;

      // Check right edge
      if (left + popupWidth > window.innerWidth) {
        left = triggerRect.right - popupWidth;
      }
      
      // Check left edge
      if (left < 0) {
        left = 8;
      }

      // Check bottom edge
      if (top + popupHeight > window.innerHeight) {
        top = triggerRect.top - popupHeight - 8;
      }
      
      // Check top edge
      if (top < 0) {
        top = 8;
      }

      setPosition({ top, left });
      
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsPositioned(true);
        });
      });
    }
  }, [triggerRect]);

  const rgb = hexToRgbValues(selectedColor);
  const normalizedDefaultColors = DEFAULT_COLORS.map(c => c.toLowerCase());
  const usedColors = extractedColors.filter(c => !normalizedDefaultColors.includes(c.toLowerCase()));

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0" onClick={onClose} />
      <div 
        ref={popupRef}
        className={cn(
          "absolute p-4 bg-[#222] rounded-2xl shadow-2xl border border-white/10 w-[240px] space-y-4",
          isPositioned ? "animate-in fade-in zoom-in-95 duration-200" : "invisible opacity-0"
        )}
        style={{ 
          top: position.top, 
          left: position.left,
          transition: isPositioned ? undefined : 'none'
        }}
      >
        <div className="h-32 overflow-hidden rounded-lg">
          {mode === 'hex' ? (
            <HexColorPicker color={selectedColor} onChange={setSelectedColor} className="!w-full !h-full" />
          ) : (
            <RgbColorPicker color={rgb} onChange={(c) => setSelectedColor(rgbToHexValues(c))} className="!w-full !h-full" />
          )}
        </div>
        
        <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl border border-white/5">
          <div className="w-8 h-8 rounded-lg shadow-inner border border-white/10 shrink-0" style={{ backgroundColor: selectedColor }} />
          <div className="flex-1 min-w-0">
            <input 
              type="text"
              value={isEditing ? tempColorInput : (mode === 'hex' ? selectedColor.toUpperCase() : `${rgb.r},${rgb.g},${rgb.b}`)}
              onFocus={() => {
                setIsEditing(true);
                setTempColorInput(mode === 'hex' ? selectedColor.toUpperCase() : `${rgb.r},${rgb.g},${rgb.b}`);
              }}
              onBlur={() => {
                setIsEditing(false);
                if (mode === 'hex') {
                  if (/^#[0-9A-F]{6}$/i.test(tempColorInput)) {
                    setSelectedColor(tempColorInput);
                  }
                } else {
                  const parts = tempColorInput.split(',').map(p => parseInt(p.trim()));
                  if (parts.length === 3 && parts.every(p => !isNaN(p) && p >= 0 && p <= 255)) {
                    setSelectedColor(rgbToHexValues({ r: parts[0], g: parts[1], b: parts[2] }));
                  }
                }
              }}
              onChange={(e) => setTempColorInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              className="w-full bg-transparent text-xs font-mono font-bold text-white outline-none cursor-text"
            />
          </div>
          <button 
            onClick={() => setMode(mode === 'hex' ? 'rgb' : 'hex')}
            className="p-1.5 bg-white/5 hover:bg-white/10 rounded-md text-pink-400 transition-colors"
            title={mode === 'hex' ? 'RGB 모드로 전환' : 'HEX 모드로 전환'}
          >
            <ChevronsUpDown className="w-4 h-4" />
          </button>
        </div>

        <div className="pt-3 border-t border-white/5">
          <div className="grid grid-cols-7 gap-1">
            {DEFAULT_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setSelectedColor(c)}
                className="w-6 h-6 rounded-md border border-white/10 hover:scale-110 transition-transform"
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>

        {usedColors.length > 0 && (
          <div className="pt-3 border-t border-white/5">
            <div className="grid grid-cols-7 gap-1 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
              {usedColors.map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  className="w-6 h-6 rounded-md border border-white/10 hover:scale-110 transition-transform"
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>
        )}

        <button 
          onClick={() => {
            onChange(selectedColor);
            onClose();
          }}
          className="w-full py-2.5 bg-[#e6005c] text-white rounded-xl text-xs font-bold hover:bg-[#ff0066] transition-all active:scale-95"
        >
          확인
        </button>
      </div>
    </div>,
    document.body
  );
};

const hexToRgbValues = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
};

const rgbToHexValues = ({ r, g, b }: { r: number; g: number; b: number }) => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};
