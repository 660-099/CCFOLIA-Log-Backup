import { LogEntry, CharSetting, TabSetting } from '../types';
import { cn, r, linkifyAndFormat } from '../utils';
import DOMPurify from 'dompurify';
import { fonts } from '../constants';

const hexToRgbValues = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
};

export const generateFinalHtmlStr = (
  filteredLogs: LogEntry[],
  mergedLogs: LogEntry[],
  charSettings: Record<string, CharSetting>,
  tabSettings: Record<string, TabSetting>,
  cssFormat: 'inline' | 'internal',
  theme: 'dark' | 'light',
  darkBgColor: string,
  lightBgColor: string,
  filterBarMode: 'none' | 'floating' | 'fixed',
  fontSize: number,
  fontFamily: string,
  disableOtherColor: boolean,
  hideEmptyAvatars: boolean,
  narrationCharacter: string | null,
  insertedBlocks: Record<string, any[]>,
  mergeTabStyles: Set<string>,
  showTabNames: Set<string>,
  pageTitle: string,
  fontValue: string
) => {
  const isDark = theme === 'dark';
  const bgColor = isDark ? darkBgColor : lightBgColor;
  const textColor = isDark ? '#EEEEEE' : '#1a1a1a';
  const otherTextColor = isDark ? '#AAAAAA' : '#757575';
  const borderColor = isDark ? '#444' : '#e5e5e5';
  const infoBg = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)';
  const commandBg = isDark ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.03)';
  const avatarPlaceholder = isDark ? '#242424' : '#f0f0f0';

  const s = (val: number) => r(val * (fontSize / 14));

  const avatarSize = s(46);
  const gapSize = s(12);
  const paddingSize = s(12); // Base padding (vert)
  const nameSize = s(13); // Represents 0.93em of 14px

  const getSecretBg = (tabColor?: string) => {
    if (!tabColor) return isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)';
    return isDark ? `${tabColor}15` : `${tabColor}10`;
  };

  const fontData = fonts.find(f => f.name === fontFamily);
  const fontImport = fontData?.import || '';

  const activeTabs = new Map<string, { id: string, name: string }>();
  const activeChars = new Map<string, { id: string, name: string, color: string }>();

  if (filterBarMode !== 'none') {
    filteredLogs.forEach(log => {
      // Find actual character settings color if available
      const charColor = charSettings[log.charId]?.color || log.color;
      activeTabs.set(log.tabId, { id: log.tabId, name: log.tab });
      activeChars.set(log.charId, { id: log.charId, name: log.name, color: charColor });
    });
  }

  let filterBarHtml = '';
  let filterBarCSS = '';
  let filterBarScript = '';

  if (filterBarMode !== 'none') {
    const tabBtns = Array.from(activeTabs.values()).map(t => 
      `<label class="i"><input type="checkbox" checked value="${t.id}" data-type="tab"><span class="c"></span>${t.name}</label>`
    ).join('');
    
    let charsArray = Array.from(activeChars.values());
    if (narrationCharacter) {
      charsArray = [
        {
          id: '__NARRATION__',
          name: '나레이션',
          color: charSettings[narrationCharacter]?.color || '#000000'
        },
        ...charsArray
      ];
    }

    const charBtns = charsArray.map(c => 
      `<label class="i"><input type="checkbox" checked value="${c.id}" data-type="char"><span class="c"></span>${c.name}</label>`
    ).join('');

    const isFixed = filterBarMode === 'fixed';

    let filterMenuStyles = '';
    if (isFixed) {
      filterMenuStyles = `
        #f-menu {
          background: ${bgColor}; 
          border-bottom: 1px solid ${borderColor}; 
          padding: 15px 20px; 
          margin: 0 auto 20px auto;
          max-width: 800px;
          width: 100%;
        }
        #f-menu .g { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 10px; }
        #f-menu .g:last-child { margin-bottom: 0; }
        #f-menu .t { font-size: 9px; font-weight: bold; color: ${isDark ? '#555' : '#888'}; letter-spacing: 1.2px; text-transform: uppercase; margin-right: 5px; margin-bottom: 0; display: block; }
        #f-menu .all { width: auto; border: none; padding-bottom: 0; margin-bottom: 0; padding-right: 10px; border-right: 1px solid ${borderColor}; display: inline-flex !important; }
        #f-menu .i { display: inline-flex !important; align-items: center; gap: 6px; cursor: pointer; font-size: 12px; color: ${isDark ? '#999' : '#666'}; }
      `;
    } else {
      filterMenuStyles = `
        #f-btn {
          position: fixed !important; top: 20px; right: 20px;
          width: 40px; height: 40px; background: ${isDark ? '#1a1a1a' : '#f5f5f5'}; 
          border: 1.5px solid ${borderColor}; border-radius: 6px;
          cursor: pointer; z-index: 1000001;
          display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 4px;
        }
        #f-btn span { display: block; width: 20px; height: 1.5px; background: ${isDark ? '#888' : '#666'}; }
        #f-menu {
          position: fixed !important; top: 65px; right: 20px;
          width: 180px; max-height: 70vh; 
          background: ${isDark ? 'rgba(30, 30, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)'}; border: 1px solid ${borderColor}; 
          border-radius: 6px; padding: 15px; 
          display: none; overflow-y: auto; z-index: 1000000;
          box-shadow: -5px 5px 25px rgba(0,0,0,0.5);
        }
        #f-menu::-webkit-scrollbar { width: 4px; }
        #f-menu::-webkit-scrollbar-thumb { background: ${borderColor}; border-radius: 10px; }
        #f-menu .g { margin-bottom: 20px; }
        #f-menu .t { font-size: 9px; font-weight: bold; color: ${isDark ? '#555' : '#888'}; letter-spacing: 1.2px; margin-bottom: 10px; display: block; text-transform: uppercase; }
        #f-menu .i { display: flex !important; align-items: flex-start; gap: 10px; padding: 5px 0; cursor: pointer; font-size: 12px; color: ${isDark ? '#999' : '#666'}; }
        #f-menu .all { font-weight: bold; color: ${textColor}; border-bottom: 1px solid ${borderColor}; padding-bottom: 8px; width: 100%; margin-bottom: 6px; }
      `;
    }

    filterBarCSS = `
      #filter-root { position: relative; z-index: 1000000; font-family: inherit; }
      #filter-root * { box-sizing: border-box; }
      ${filterMenuStyles}
      #f-menu .i input { display: none; }
      #f-menu .c { width: 12px; height: 12px; border: 1px solid ${borderColor}; border-radius: 2px; background: ${isDark ? '#111' : '#eee'}; flex-shrink: 0; margin-top: ${isFixed ? '0' : '3px'}; position: relative; }
      #f-menu .i input:checked + .c { background: #aaa; border-color: #aaa; }
      #f-menu .i input:checked + .c::after {
        content: ''; position: absolute; left: 3px; top: 1px; width: 3px; height: 6px;
        border: solid ${isDark ? '#111' : '#fff'}; border-width: 0 1.5px 1.5px 0; transform: rotate(45deg);
      }
      #f-menu .i:hover { color: ${textColor}; }
      #f-menu .i:has(input:not(:checked)) { opacity: 0.55; text-decoration: line-through; color: ${isDark ? '#888' : '#aaa'}; }
    `;

    filterBarHtml = `
      <div id="filter-root">
        ${!isFixed ? `<div id="f-btn"><span></span><span></span><span></span></div>` : ''}
        <div id="f-menu">
          <div class="g">
            <span class="t">TABS</span>
            <label class="i all"><input type="checkbox" checked id="aT"><span class="c"></span>All</label>
            ${tabBtns}
          </div>
          <div class="g" style="margin-bottom: 0;">
            <span class="t">CHARS</span>
            <label class="i all"><input type="checkbox" checked id="aC"><span class="c"></span>All</label>
            ${charBtns}
          </div>
        </div>
      </div>
    `;

    filterBarScript = `
      <script>
        document.addEventListener('DOMContentLoaded', () => {
          const qs = s => Array.from(document.querySelectorAll(s)), id = i => document.getElementById(i);
          const tC = qs('input[data-type="tab"]'), cC = qs('input[data-type="char"]');
          const aT = id('aT'), aC = id('aC'), items = qs('.ccfolia-log-entry');
          
          ${!isFixed ? `
          const b = id('f-btn'), m = id('f-menu');
          document.body.appendChild(b); document.body.appendChild(m);
          b.onclick = (e) => { e.stopPropagation(); m.style.display = (m.style.display === 'block') ? 'none' : 'block'; };
          document.addEventListener('click', (e) => { if (!m.contains(e.target) && e.target !== b) m.style.display = 'none'; });
          ` : ''}
          
          const update = () => {
            const hTbs = new Set(tC.filter(c => !c.checked).map(c => c.value));
            const hChs = new Set(cC.filter(c => !c.checked).map(c => c.value));
            
            items.forEach(i => {
              const { tab, char, isMainTab, isNarrationCharacter } = i.dataset;
              
              if (tab && hTbs.has(tab)) {
                i.style.display = 'none';
                return;
              }

              if (char) {
                if (isNarrationCharacter === 'true' && isMainTab === 'true') {
                  if (hChs.has('__NARRATION__')) {
                    i.style.display = 'none';
                    return;
                  }
                } else {
                  if (hChs.has(char)) {
                    i.style.display = 'none';
                    return;
                  }
                }
              }

              i.style.display = '';
            });
            aT.checked = tC.every(c => c.checked);
            aC.checked = cC.every(c => c.checked);
          };
          [...tC, ...cC].forEach(c => c.addEventListener('change', update));
          aT.addEventListener('change', e => { tC.forEach(c => c.checked = e.target.checked); update(); });
          aC.addEventListener('change', e => { cC.forEach(c => c.checked = e.target.checked); update(); });
        });
      </script>
    `;
  }

  const css = `
    ${fontImport}
    ${filterBarCSS}
    .log-main-container { background-color: ${bgColor}; margin: 0; padding: 0; }
    .log-container * { box-sizing: border-box; min-width: 0; }
    .log-container { 
      width: 100%; max-width: 800px; margin: 0 auto; 
      ${fontFamily !== '(폰트 적용X)' ? `font-family: ${fontValue};` : ''}
      background: ${bgColor}; color: ${textColor};
      padding: 20px 0;
      font-size: ${fontSize}px;
      line-height: 1.6;
      overflow-x: hidden;
    }
    
    .log-item { position: relative; margin-bottom: 2px; }
    .log-item.mb-0 { margin-bottom: 0 !important; }
    .log-item.mb-10 { margin-bottom: 10px !important; }
    .log-item.mt-0 { margin-top: 0 !important; }
    .log-item.mt-10 { margin-top: 10px !important; }
    .log-item div { margin-bottom: 0 !important; }

    .tab-name-block { margin: ${s(12)}px ${s(15.6)}px ${s(4)}px; display: flex; }
    .tab-name-badge { padding: 2px 10px; border-radius: 4px; font-size: 0.74em; font-weight: bold; }

    .main-row, .secret-row, .command-box, .narration-row { padding: ${s(12)}px ${s(15.6)}px; }
    .main-row, .secret-row { display: flex; gap: ${s(12)}px; align-items: flex-start; }
    .secret-row { margin: ${s(4)}px ${s(15.6)}px; border-radius: 4px; }

    .main-avatar { 
      width: ${avatarSize}px; height: ${avatarSize}px; flex-shrink: 0; 
      background-color: ${avatarPlaceholder}; border-radius: 4px; object-fit: contain;
    }
    .main-body { flex-grow: 1; line-height: 1.6; }
    .main-name { font-weight: bold; font-size: 0.96em; margin-bottom: 2px; display: block; }
    .main-content, .other-content { font-size: 1em; white-space: pre-wrap; word-break: break-all; }
    .main-content { color: ${textColor}; }

    .other-row { padding: ${s(4)}px ${s(15.6)}px; display: flex; gap: ${s(8)}px; align-items: baseline; }
    .other-name { font-weight: bold; flex-shrink: 0; font-size: 0.96em; }
    .other-content { color: ${otherTextColor}; }

    .info-row { 
      padding: ${s(15.6)}px ${s(19.2)}px; background: ${infoBg};
      border-left: 4px solid ${borderColor}; margin: ${s(8)}px ${s(15.6)}px; border-radius: 4px;
    }
    
    .command-box { 
      background: ${commandBg}; border: 1px solid ${borderColor}; 
      border-radius: 8px; margin: ${s(8)}px ${s(15.6)}px; 
    }
    .command-text { font-family: 'NanumGothicCodingLigature', monospace; color: ${textColor}; font-weight: bold; line-height: 1.6; }

    .narration-row { text-align: center; color: ${textColor}; line-height: 1.6; font-weight: bold; font-style: italic; }
  `;

  const isInline = cssFormat === 'inline';
  let html = '';

  const firstVisible = mergedLogs.find(l => {
    const ts = tabSettings[l.tabId];
    const cs = charSettings[l.charId];
    return ts?.visible && (cs?.visible !== false);
  });
  const isStartExported = filteredLogs.length === 0 || filteredLogs[0] === firstVisible;

  // Extract images from blocks for the exporter
  const insertedImages: Record<string, any[]> = {};
  Object.entries(insertedBlocks || {}).forEach(([id, blocks]) => {
    blocks.forEach((b: any) => {
      if (b.type === 'image') {
        if (!insertedImages[id]) insertedImages[id] = [];
        insertedImages[id].push({ url: b.url, width: b.width, align: b.align });
      }
    });
  });

  if (isStartExported && insertedBlocks && insertedBlocks['__start__']) {
    insertedBlocks['__start__'].forEach((block: any) => {
      if (block.type === 'image') {
        const url = typeof block === 'string' ? block : block.url;
        if (!url || (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:image/'))) return;
        
        const align = (typeof block === 'string' ? 'center' : block.align) || 'center';
        const justify = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start';
        const width = typeof block === 'string' ? undefined : block.width;
        const widthStyle = width ? `width: ${width}px;` : 'max-width: 100%;';
        html += `<div class="ccfolia-log-entry" style="display: flex; justify-content: ${justify}; margin: 10px ${s(15.6)}px;">
          <img src="${url}" style="${widthStyle} border-radius: 8px; display: block;" referrerPolicy="no-referrer" onerror="this.style.display='none'" />
        </div>`;
      }
    });
  }

  const chunks: { logs: LogEntry[], stableId: string, blocksAfter: any[], isHidden: boolean }[] = [];
  
  const isValidUrl = (url: string) => {
    if (!url) return false;
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:image/');
  };

  filteredLogs.forEach((log) => {
    const stableId = log.id.startsWith('merged:') ? log.id.split(',').pop()! : log.id;
    const currentBlocks = (insertedBlocks[stableId] || []).filter(b => b.type === 'split' || (b.type === 'image' && isValidUrl(b.url)));
    
    if (log.isContinuation && chunks.length > 0 && !log.isHiddenContent) {
      chunks[chunks.length - 1].logs.push(log);
      chunks[chunks.length - 1].stableId = stableId;
      chunks[chunks.length - 1].blocksAfter = currentBlocks;
    } else {
      chunks.push({ logs: [log], stableId, blocksAfter: currentBlocks, isHidden: log.isHiddenContent || false });
    }
  });

  chunks.forEach((chunk, chunkIdx) => {
    const log = chunk.logs[0];
    const { logs: groupedLogs, blocksAfter, isHidden, stableId } = chunk;

    const tabSet = tabSettings[log.tabId];
    const format = tabSet?.format || 'main';
    const char = charSettings[log.charId];
    const color = char?.color || log.color;
    const otherNameColor = disableOtherColor ? otherTextColor : color;
    const img = char?.imageUrl;
    const hideAvatar = hideEmptyAvatars;

    const prevChunk = chunkIdx > 0 ? chunks[chunkIdx - 1] : null;
    let nextVisibleChunkIdx = chunkIdx + 1;
    while (nextVisibleChunkIdx < chunks.length && chunks[nextVisibleChunkIdx].isHidden) {
      nextVisibleChunkIdx++;
    }
    const nextVisibleChunk = nextVisibleChunkIdx < chunks.length ? chunks[nextVisibleChunkIdx] : null;

    let prevVisibleChunkIdx = chunkIdx - 1;
    while (prevVisibleChunkIdx >= 0 && chunks[prevVisibleChunkIdx].isHidden) {
      prevVisibleChunkIdx--;
    }
    const prevVisibleChunk = prevVisibleChunkIdx >= 0 ? chunks[prevVisibleChunkIdx] : null;

    const isPrevSameTab = prevVisibleChunk ? prevVisibleChunk.logs[0].tab === log.tab : false;
    const isNextSameTab = nextVisibleChunk ? nextVisibleChunk.logs[0].tab === log.tab : false;
    
    const hasBlockAfter = blocksAfter.length > 0;
    const isFilterEnabled = filterBarMode !== 'none';
    const hasBlockBefore = prevChunk ? prevChunk.blocksAfter.length > 0 : false;
    
    const shouldMergeStyle = mergeTabStyles.has(format) && (isPrevSameTab || isNextSameTab);

    const isNarration = log.charId === narrationCharacter && format === 'main';
    const isPrevNarration = prevVisibleChunk ? prevVisibleChunk.logs[0].charId === narrationCharacter && (tabSettings[prevVisibleChunk.logs[0].tabId]?.format || 'main') === 'main' : false;
    const isNextNarration = nextVisibleChunk ? nextVisibleChunk.logs[0].charId === narrationCharacter && (tabSettings[nextVisibleChunk.logs[0].tabId]?.format || 'main') === 'main' : false;

    // Combine all contents in this chunk
    let finalHtmlContent = groupedLogs.map((l, i) => {
      let content = l.content;
      if (l.isCommand) {
        content = content.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/(?:\r\n|\r|\n)+/g, ' ');
      }
      let html = linkifyAndFormat(content, format === 'other' ? '4px' : '0.8em');
      if (l.name === 'system') {
        html = html.replace(/\[\s*(.*?)\s*\]/g, (match: string, p1: string) => {
          const charIds = Object.keys(charSettings).filter(id => charSettings[id].name === p1.trim());
          const matchedChar = charIds.length > 0 ? charSettings[charIds[0]] : null;
          return matchedChar ? `<span style="color: ${matchedChar.color};">${match}</span>` : match;
        });
      }
      return DOMPurify.sanitize(html, { ADD_ATTR: ['target'] });
    }).join(`<div style="margin-top: ${format === 'other' ? '4px' : '0.8em'};"></div>`);

    if (!isHidden) {
      if (showTabNames.has(format) && !isPrevSameTab) {
        const tabName = log.tab;
      const isSecret = format === 'secret';
      const tabColor = tabSet?.color || '#ffd400';
      const tabBg = getSecretBg(tabColor);
      
      const isMainTab = format === 'main' ? 'true' : 'false';
      if (isInline) {
        const fAttrs = isFilterEnabled ? ` data-tab="${log.tabId}" data-is-main-tab="${isMainTab}" class="ccfolia-log-entry"` : '';
        html += `<div${fAttrs} style="margin: ${s(12)}px ${s(15.6)}px ${s(4)}px ${s(15.6)}px; display: flex;">
          <div style="background: ${tabBg}; color: ${tabColor}; padding: 2px 10px; border-radius: 4px; font-size: 0.74em; font-weight: bold; border: 1px solid ${tabColor}44;">
            ${tabName}
          </div>
        </div>`;
      } else {
        const fAttrs = isFilterEnabled ? ` data-tab="${log.tabId}" data-is-main-tab="${isMainTab}" class="tab-name-block ccfolia-log-entry"` : ` class="tab-name-block"`;
        html += `<div${fAttrs}>
          <div class="tab-name-badge" style="background: ${tabBg}; color: ${tabColor}; border: 1px solid ${tabColor}44;">
            ${tabName}
          </div>
        </div>`;
      }
    }

    if (isInline) {
      const avatarStyle = `width: ${avatarSize}px; height: ${avatarSize}px; flex-shrink: 0; background-color: ${hideAvatar ? 'transparent' : avatarPlaceholder}; border-radius: 4px; object-fit: contain;`;
      const bodyStyle = `flex-grow: 1; line-height: 1.6;`;
      const nameStyle = `font-weight: bold; color: ${color}; font-size: 0.96em; margin-bottom: 2px; display: block;`;
      const contentStyle = `font-size: 1em; color: ${textColor}; white-space: pre-wrap; word-break: break-all;`;
      const otherContentStyle = `font-size: 1em; color: ${otherTextColor}; white-space: pre-wrap; word-break: break-all;`;
      
      let itemMarginBottom = shouldMergeStyle ? (isNextSameTab && !hasBlockAfter ? '0' : '2px') : '2px';
      let itemMarginTop = '0';
      
      if (format === 'other') {
        itemMarginBottom = '0';
      }
      
      if (isNarration) {
        itemMarginTop = isPrevNarration ? '0' : '10px';
        itemMarginBottom = isNextNarration ? '0' : '10px';
      }

      const isSectionStart = chunkIdx === 0 || hasBlockBefore;
      const isSectionEnd = isNextSameTab === false || hasBlockAfter;

      const isMainTab = format === 'main' ? 'true' : 'false';
      const isNarrationCharacterTag = log.charId === narrationCharacter ? 'true' : 'false';
      const isCommandFlag = log.isCommand ? 'true' : 'false';
      const fullFilterAttrs = isFilterEnabled 
        ? ` data-tab="${log.tabId}" data-char="${log.charId}" data-is-main-tab="${isMainTab}" data-is-narration-character="${isNarrationCharacterTag}" data-is-command="${isCommandFlag}" class="ccfolia-log-entry"`
        : '';

      html += `<div${fullFilterAttrs} style="position: relative; margin-bottom: ${itemMarginBottom}; margin-top: ${itemMarginTop};">`;
      
      if (log.isCommand) {
        const nameHtml = log.name !== 'system' ? `<span style="color: ${color}; font-family: 'NanumGothicCodingLigature', monospace; font-weight: bold;">[ ${log.name} ]</span>` : '';
        const marginLeft = log.name !== 'system' ? 'margin-left: 8px;' : '';
        if (format === 'secret') {
          const tabColor = tabSet?.color || '#ffd400';
          const secretBg = getSecretBg(tabColor);
          html += `<div style="display: flex; align-items: center; flex-wrap: wrap; background: ${secretBg}; border: 1px solid ${borderColor}; padding: ${s(12)}px ${s(15.6)}px; border-radius: 8px; margin: ${s(8)}px ${s(15.6)}px;">${nameHtml}<span style="color: ${textColor}; font-family: 'NanumGothicCodingLigature', monospace; font-weight: bold; line-height: 1.6; ${marginLeft}">${finalHtmlContent}</span></div>`;
        } else {
          html += `<div style="display: flex; align-items: center; flex-wrap: wrap; background: ${commandBg}; border: 1px solid ${borderColor}; padding: ${s(12)}px ${s(15.6)}px; border-radius: 8px; margin: ${s(8)}px ${s(15.6)}px;">${nameHtml}<span style="color: ${textColor}; font-family: 'NanumGothicCodingLigature', monospace; font-weight: bold; line-height: 1.6; ${marginLeft}">${finalHtmlContent}</span></div>`;
        }
      } else if (isNarration) {
        html += `<div style="padding: ${s(9)}px ${s(15.6)}px; text-align: center; color: ${textColor}; line-height: 1.6; font-weight: bold; font-style: italic;">${finalHtmlContent}</div>`;
      } else if (format === 'other') {
        html += `<div style="padding: ${s(2)}px ${s(15.6)}px; display: flex; gap: ${s(8)}px; align-items: baseline;">
          <span style="font-weight: bold; flex-shrink: 0; font-size: 0.96em; color: ${otherNameColor};">${log.name}</span>
          <div style="${otherContentStyle}">${finalHtmlContent}</div>
        </div>`;
      } else if (format === 'info') {
        const infoMargin = `${(shouldMergeStyle && isPrevSameTab && !isSectionStart) ? '0' : s(8)}px ${s(15.6)}px ${(shouldMergeStyle && isNextSameTab && !isSectionEnd) ? '0' : s(8)}px ${s(15.6)}px`;
        const infoRadius = shouldMergeStyle 
          ? `${(isPrevSameTab && !isSectionStart) ? '0' : '4px'} ${(isPrevSameTab && !isSectionStart) ? '0' : '4px'} ${(isNextSameTab && !isSectionEnd) ? '0' : '4px'} ${(isNextSameTab && !isSectionEnd) ? '0' : '4px'}`
          : '4px';
        const infoBorderTop = shouldMergeStyle && isPrevSameTab && !isSectionStart ? 'none' : '';
        const infoBorderBottom = shouldMergeStyle && isNextSameTab && !isSectionEnd ? 'none' : '';

        html += `<div style="padding: ${s(15.6)}px ${s(19.2)}px; background: ${infoBg}; border-left: 4px solid ${borderColor}; margin: ${infoMargin}; border-radius: ${infoRadius}; ${infoBorderTop ? `border-top: ${infoBorderTop}; ` : ''}${infoBorderBottom ? `border-bottom: ${infoBorderBottom}; ` : ''}">
          <span style="${nameStyle}">${log.name}</span>
          <div style="${contentStyle}">${finalHtmlContent}</div>
        </div>`;
      } else if (format === 'secret') {
        const tabColor = tabSet?.color || '#ffd400';
        const secretBg = getSecretBg(tabColor);
        const imgTag = img ? `<img src="${img}" style="${avatarStyle}" />` : `<div style="${avatarStyle}"></div>`;
        const secretMargin = `${(shouldMergeStyle && isPrevSameTab && !isSectionStart) ? '0' : s(4)}px ${s(15.6)}px ${(shouldMergeStyle && isNextSameTab && !isSectionEnd) ? '0' : s(4)}px ${s(15.6)}px`;
        const secretRadius = shouldMergeStyle 
          ? `${(isPrevSameTab && !isSectionStart) ? '0' : '4px'} ${(isPrevSameTab && !isSectionStart) ? '0' : '4px'} ${(isNextSameTab && !isSectionEnd) ? '0' : '4px'} ${(isNextSameTab && !isSectionEnd) ? '0' : '4px'}`
          : '4px';
        const secretBorderTop = shouldMergeStyle && isPrevSameTab && !isSectionStart ? 'none' : '';
        const secretBorderBottom = shouldMergeStyle && isNextSameTab && !isSectionEnd ? 'none' : '';

        const borderTopStyle = secretBorderTop ? `border-top: ${secretBorderTop}; ` : '';
        const borderBottomStyle = secretBorderBottom ? `border-bottom: ${secretBorderBottom}; ` : '';

        html += `
          <div style="display: flex; gap: ${s(12)}px; padding: ${s(12)}px ${s(15.6)}px; align-items: flex-start; background: ${secretBg}; border-left: 4px solid ${tabColor}; margin: ${secretMargin}; border-radius: ${secretRadius}; ${borderTopStyle}${borderBottomStyle}">
            ${imgTag}
            <div style="${bodyStyle}">
              <span style="${nameStyle}">${log.name}</span>
              <div style="${contentStyle}">${finalHtmlContent}</div>
            </div>
          </div>`;
      } else {
        const avatarHtml = img 
          ? `<img src="${img}" style="${avatarStyle}" />` 
          : `<div style="${avatarStyle}"></div>`;
        
        html += `
          <div style="display: flex; gap: ${s(12)}px; padding: ${s(12)}px ${s(15.6)}px; align-items: flex-start;">
            ${avatarHtml}
            <div style="${bodyStyle}">
              <span style="${nameStyle}">${log.name}</span>
              <div style="${contentStyle}">${finalHtmlContent}</div>
            </div>
          </div>`;
      }
      html += `</div>`;
    } else {
      const isSectionStart = !prevVisibleChunk || hasBlockBefore;
      const isSectionEnd = !nextVisibleChunk || isNextSameTab === false || hasBlockAfter;

      let mb = shouldMergeStyle ? (isNextSameTab && !hasBlockAfter ? 'mb-0' : '') : '';
      let mt = '';

      if (isNarration) {
        mt = isPrevNarration ? 'mt-0' : 'mt-10';
        mb = isNextNarration ? 'mb-0' : 'mb-10';
      }

      const cl = [mb, mt].filter(Boolean).join(' ');
      const clStr = `log-item${cl ? ` ${cl}` : ''}`;
      
      const isMainTab = format === 'main' ? 'true' : 'false';
      const isNarrationCharacterTag = log.charId === narrationCharacter ? 'true' : 'false';
      const isCommandFlag = log.isCommand ? 'true' : 'false';
      
      const fullFilterAttrs = isFilterEnabled
        ? ` data-tab="${log.tabId}" data-char="${log.charId}" data-is-main-tab="${isMainTab}" data-is-narration-character="${isNarrationCharacterTag}" data-is-command="${isCommandFlag}" class="${clStr} ccfolia-log-entry"`
        : ` class="${clStr}"`;

      html += `<div${fullFilterAttrs}>`;

      if (log.isCommand) {
        const nameHtml = log.name !== 'system' ? `<span class="command-text" style="color: ${color}; font-weight: bold;">[ ${log.name} ]</span> ` : '';
        const marginLeft = log.name !== 'system' ? 'margin-left: 8px;' : '';
        if (format === 'secret') {
          const tabColor = tabSet?.color || '#ffd400';
          const secretBg = getSecretBg(tabColor);
          html += `<div class="command-box" style="display: flex; align-items: center; flex-wrap: wrap; background: ${secretBg}; border: 1px solid ${borderColor}; margin: ${s(8)}px ${s(15.6)}px; border-radius: 8px; padding-top: ${s(12)}px; padding-bottom: ${s(shouldMergeStyle && isNextSameTab ? 6 : 12)}px;">${nameHtml}<span class="command-text" style="${marginLeft}">${finalHtmlContent}</span></div>`;
        } else {
          html += `<div class="command-box" style="display: flex; align-items: center; flex-wrap: wrap; padding-top: ${s(12)}px; padding-bottom: ${s(shouldMergeStyle && isNextSameTab ? 6 : 12)}px;">${nameHtml}<span class="command-text" style="${marginLeft}">${finalHtmlContent}</span></div>`;
        }
      } else if (isNarration) {
        html += `<div class="narration-row" style="padding-top: ${s(isPrevNarration ? 3 : 9)}px; padding-bottom: ${s(isNextNarration ? 3 : 9)}px; padding-left: ${s(15.6)}px; padding-right: ${s(15.6)}px;">${finalHtmlContent}</div>`;
      } else if (format === 'other') {
        html += `<div class="other-row" style="padding-top: ${s(2)}px; padding-bottom: ${s(2)}px;"><span class="other-name" style="color: ${otherNameColor}">${log.name}</span><div class="other-content">${finalHtmlContent}</div></div>`;
      } else if (format === 'info') {
        const tZ = isPrevSameTab && !isSectionStart, bZ = isNextSameTab && !isSectionEnd;
        const rad = shouldMergeStyle ? `${tZ ? 0 : 4}px ${tZ ? 0 : 4}px ${bZ ? 0 : 4}px ${bZ ? 0 : 4}px` : '4px';
        const st = [
          shouldMergeStyle ? `margin: 0 ${s(15.6)}px;` : '',
          rad !== '4px' ? `border-radius: ${rad};` : '',
          shouldMergeStyle && tZ ? 'border-top: none;' : '',
          shouldMergeStyle && bZ ? 'border-bottom: none;' : '',
          `padding-top: ${s(15.6)}px; padding-bottom: ${s(shouldMergeStyle && isNextSameTab ? 4 : 15.6)}px;`
        ].filter(Boolean).join(' ');

        html += `<div class="info-row"${st ? ` style="${st}"` : ''}><span class="main-name" style="color: ${color}; display: block;">${log.name}</span><div class="main-content">${finalHtmlContent}</div></div>`;
      } else if (format === 'secret') {
        const tabColor = tabSet?.color || '#ffd400';
        const secretBg = getSecretBg(tabColor);
        const avSt = hideAvatar ? 'background-color: transparent;' : '';
        const avatarHtml = img ? `<img src="${img}" class="main-avatar"${avSt ? ` style="${avSt}"` : ''} />` : `<div class="main-avatar"${avSt ? ` style="${avSt}"` : ''}></div>`;
        const tZ = isPrevSameTab && !isSectionStart, bZ = isNextSameTab && !isSectionEnd;
        const rad = shouldMergeStyle ? `${tZ ? 0 : 4}px ${tZ ? 0 : 4}px ${bZ ? 0 : 4}px ${bZ ? 0 : 4}px` : '4px';
        const st = [
          `background: ${secretBg};`,
          `border-left: 4px solid ${tabColor};`,
          shouldMergeStyle ? `margin: 0 ${s(15.6)}px;` : '',
          rad !== '4px' ? `border-radius: ${rad};` : '',
          shouldMergeStyle && tZ ? 'border-top: none;' : '',
          `padding-top: ${s(12)}px; padding-bottom: ${s(shouldMergeStyle && isNextSameTab ? 6 : 12)}px;`
        ].filter(Boolean).join(' ');

        html += `<div class="secret-row" style="${st}">${avatarHtml}<div class="main-body"><span class="main-name" style="color: ${color}; display: block;">${log.name}</span><div class="main-content">${finalHtmlContent}</div></div></div>`;
      } else {
        const avSt = hideAvatar ? 'background-color: transparent;' : '';
        const avatarHtml = img ? `<img src="${img}" class="main-avatar"${avSt ? ` style="${avSt}"` : ''} />` : `<div class="main-avatar"${avSt ? ` style="${avSt}"` : ''}></div>`;
        html += `<div class="main-row" style="padding-top: ${s(12)}px; padding-bottom: ${s(shouldMergeStyle && isNextSameTab ? 6 : 12)}px;">${avatarHtml}<div class="main-body"><span class="main-name" style="color: ${color}; display: block;">${log.name}</span><div class="main-content">${finalHtmlContent}</div></div></div>`;
      }
      html += `</div>`;
    }
    } 
    
    if (blocksAfter && blocksAfter.length > 0) {
      blocksAfter.forEach((block: any) => {
        if (block.type === 'image' && isValidUrl(block.url)) {
          const align = block.align || 'center';
          const justify = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start';
          const widthStyle = block.width ? `width: ${block.width}px;` : 'max-width: 100%;';
          const isMainTab = format === 'main' ? 'true' : 'false';
          const imgAttrs = isFilterEnabled 
            ? ` data-tab="${log.tabId}" data-is-main-tab="${isMainTab}" class="ccfolia-log-entry"`
            : '';
          html += `<div${imgAttrs} style="display: flex; justify-content: ${justify}; margin: 10px ${s(15.6)}px;">
            <img src="${block.url}" style="${widthStyle} border-radius: 8px; display: block;" referrerPolicy="no-referrer" onerror="this.style.display='none'" />
          </div>`;
        }
      });
    }
  });

  return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${pageTitle}</title>
      <link href="https://hangeul.pstatic.net/hangeul_static/css/nanum-gothic-coding.css" rel="stylesheet">
      ${isInline ? `<style>
        ${fontImport}
        ${filterBarCSS}
        .log-container * { box-sizing: border-box; min-width: 0; }
      </style>` : `<style>${css}</style>`}
    </head>
    <body>
      <div class="log-main-container"${isInline ? ` style="background-color: ${bgColor}; margin: 0; padding: 0;"` : ''}>
        ${filterBarHtml}
        ${isInline ? `<div class="log-container" style="width: 100%; max-width: 800px; margin: 0 auto; ${fontFamily !== '(폰트 적용X)' ? `font-family: ${fontValue};` : ''} background: ${bgColor}; color: ${textColor}; line-height: 1.6; padding: 20px 0; font-size: ${fontSize}px; overflow-x: hidden;">\n${html}\n</div>` : `<div class="log-container">\n${html}\n</div>`}
      </div>
      ${filterBarScript}
    </body>
    </html>
  `;
};
