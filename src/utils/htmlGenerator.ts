import { LogEntry, CharSetting, TabSetting } from '../types';
import { cn, r, linkifyAndFormat } from '../utils';
import DOMPurify from 'dompurify';
import { fonts } from '../constants';
import { splitNarration } from './textTokenizer';

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
  hideAllAvatars: boolean,
  narrationCharacter: string | null,
  enableSentenceSpacing: boolean,
  insertedBlocks: Record<string, any[]>,
  mergeTabStyles: Set<string>,
  showTabNames: Set<string>,
  pageTitle: string,
  fontValue: string,
  textFontSize: number = 14,
  lineHeight: number = 1.6,
  letterSpacing: number = 0,
  blockSpacing: number = 2,
  contentPadding: number = 12,
  avatarSizeValue: number = 46,
  showLogDivider: boolean = false
) => {
  const isDark = theme === 'dark';
  const bgColor = isDark ? darkBgColor : lightBgColor;
  const textColor = isDark ? '#EEEEEE' : '#1a1a1a';
  const otherTextColor = isDark ? '#AAAAAA' : '#757575';
  const borderColor = isDark ? '#444' : '#e5e5e5';
  const infoBg = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)';
  const commandBg = isDark ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.03)';
  const avatarPlaceholder = isDark ? '#242424' : '#f0f0f0';

  const overrideScale = fontSize / 14;
  textFontSize *= overrideScale;
  letterSpacing *= overrideScale;

  const s = (val: number) => r(val * overrideScale);
  const t = (val: number) => r(val * (textFontSize / 14));

  const avatarSize = s(avatarSizeValue);
  const gapSize = s(12);
  let effectiveBlockSpacing = blockSpacing;
  let basePaddingVertical = 12;

  if (effectiveBlockSpacing < 0) {
    basePaddingVertical = Math.max(2, basePaddingVertical + effectiveBlockSpacing / 2);
    effectiveBlockSpacing = 0;
  }

  const paddingVertical = s(basePaddingVertical); // Scaled padding (vert)
  const paddingHorizontal = s(contentPadding); // Scaled padding (horiz)
  const nameSize = t(13.44); // 0.96em of textFontSize

  const narrationMargin = Math.floor(effectiveBlockSpacing * 1.2 + lineHeight * 6);

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

          [...tC, ...cC].forEach(c => {
            const h = e => {
              if (e.altKey) {
                e.preventDefault();
                e.stopPropagation();
                const group = c.dataset.type === 'tab' ? tC : cC;
                setTimeout(() => {
                  const isSolo = group.every(x => x === c ? x.checked : !x.checked);
                  if (isSolo) {
                    group.forEach(x => x.checked = true);
                  } else {
                    group.forEach(x => x.checked = false);
                    c.checked = true;
                  }
                  update();
                }, 0);
              }
            };
            c.parentElement.addEventListener('click', h);
            c.addEventListener('click', h);
            c.addEventListener('change', update);
          });
          
          aT.addEventListener('change', e => { tC.forEach(c => c.checked = e.target.checked); update(); });
          aC.addEventListener('change', e => { cC.forEach(c => c.checked = e.target.checked); update(); });
        });
      </script>
    `;
  }

  const textResetCSS = `
    .log-container :is(p, span, a, b, strong, i, em, h1, h2, h3, h4, h5, h6, [class$="-content"], [class$="-name"], .narration-row, .narration-split-row, .command-text) {
      background-color: transparent !important;
    }
  `;

  let computedNameWidth = 120;
  if (hideAllAvatars && typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const fw = fontValue || 'sans-serif';
      const nameSizePixel = textFontSize * 0.96;
      ctx.font = `bold ${nameSizePixel}px ${fw}`;
      let mw = 0;
      for (const log of filteredLogs) {
        if (log.charId !== narrationCharacter && !log.isContinuation) {
          const w = ctx.measureText(log.name + ':').width;
          if (w > mw) mw = w;
        }
      }
      computedNameWidth = Math.min(Math.max(48, Math.ceil(mw + 8)), 120);
    }
  }

  const css = `
    ${fontImport}
    ${filterBarCSS}
    ${textResetCSS}
    .log-main-container { background-color: ${bgColor}; margin: 0; padding: 0; }
    .log-container * { box-sizing: border-box; min-width: 0; }
    .log-container { 
      width: 100%; max-width: 800px; margin: 0 auto; 
      display: flex; flex-direction: column;
      ${fontFamily !== '(폰트 적용X)' ? `font-family: ${fontValue};` : ''}
      background: ${bgColor}; color: ${textColor};
      padding: 20px 0;
      font-size: ${fontSize}px;
      line-height: ${lineHeight};
      letter-spacing: ${letterSpacing === 0 ? 'normal' : `${letterSpacing}px`};
      overflow-x: hidden;
    }
    
    .log-item { position: relative; }
    .log-item.mb-0 { margin-bottom: 0 !important; }
    .log-item.mt-0 { margin-top: 0 !important; }
    .log-item.mb-normal { margin-bottom: ${Math.ceil(effectiveBlockSpacing / 2)}px !important; }
    .log-item.mt-normal { margin-top: ${Math.floor(effectiveBlockSpacing / 2)}px !important; }
    .log-item.mb-narr { margin-bottom: ${Math.ceil(narrationMargin / 2)}px !important; }
    .log-item.mt-narr { margin-top: ${Math.floor(narrationMargin / 2)}px !important; }
    .log-item.mb-cmd { margin-bottom: ${effectiveBlockSpacing}px !important; }
    .log-item div:not(.log-divider) { margin-bottom: 0 !important; }
    .mt-0-force { margin-top: 0 !important; }
    .mt-0-force .secret-row, .mt-0-force .info-row, .mt-0-force .command-box { margin-top: 0 !important; }

    .tab-name-block { margin: ${s(12)}px ${paddingHorizontal}px ${s(8)}px; display: flex; }
    .tab-name-badge { padding: 2px 10px; border-radius: 4px; font-size: 0.74em; font-weight: bold; }

    .main-row, .secret-row, .command-box, .narration-row { padding: ${paddingVertical}px ${paddingHorizontal}px; }
    .main-row, .secret-row { display: flex; gap: ${s(12)}px; align-items: flex-start; padding-top: ${paddingVertical}px; padding-bottom: ${paddingVertical}px; }
    .main-row.no-avatar-grid, .secret-row.no-avatar-grid { display: flex; gap: 16px; align-items: flex-start; }
    .secret-row { margin: ${s(4)}px ${paddingHorizontal}px; border-radius: 4px; }

    .main-avatar { 
      width: ${avatarSize}px; height: ${avatarSize}px; flex-shrink: 0; 
      background-color: ${avatarPlaceholder}; border-radius: 4px; object-fit: contain;
    }
    .main-body { flex-grow: 1; line-height: ${lineHeight}; }
    .main-name { font-weight: bold; font-size: ${r(textFontSize * 0.96)}px; margin-bottom: ${Math.max(4, Math.ceil(textFontSize * (lineHeight >= 1.4 ? 0.3 : 0.5)))}px; display: block; }
    .no-avatar-grid .main-name { width: ${computedNameWidth}px; flex-shrink: 0; margin-bottom: 0; text-align: right; }
    .no-avatar-grid .main-body { flex: 1; min-width: 0; }
    .main-content, .other-content { font-size: ${r(textFontSize)}px; white-space: pre-wrap; word-break: keep-all; overflow-wrap: break-word; }
    .main-content { color: ${textColor}; }

    .other-row { padding: ${s(4)}px ${paddingHorizontal}px; display: flex; gap: ${s(8)}px; align-items: baseline; }
    .other-name { font-weight: bold; flex-shrink: 0; font-size: ${r(textFontSize * 0.96)}px; }
    .other-content { color: ${otherTextColor}; }

    .info-row { 
      padding: ${paddingVertical}px ${paddingHorizontal}px; background: ${infoBg};
      border-left: 4px solid ${borderColor}; margin: ${s(8)}px ${paddingHorizontal}px; border-radius: 4px;
    }
    
    .command-box { 
      background: ${commandBg}; border: 1px solid ${borderColor}; 
      border-radius: 8px; margin: ${s(8)}px ${paddingHorizontal}px; 
    }
    .command-text { font-family: 'NanumGothicCodingLigature', monospace; color: ${textColor}; font-weight: bold; line-height: 1.6; }

    .narration-row { text-align: center; color: ${textColor}; line-height: ${lineHeight}; font-size: ${r(textFontSize)}px; font-weight: bold; font-style: italic; }
    .narration-split-row { text-align: center; color: ${textColor}; line-height: ${lineHeight}; font-size: ${r(textFontSize)}px; font-weight: bold; font-style: italic; padding: ${s(2)}px ${paddingHorizontal}px; margin-bottom: 0px; }
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

  const getHasDividerBetween = (chunkA: any, chunkB: any) => {
    if (!showLogDivider) return false;
    if (!chunkA || !chunkB) return false;
    const logA = chunkA.logs[0];
    const logB = chunkB.logs[0];

    const getFormatOf = (l: any) => {
      if (l.isCommand) return 'command';
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
    if (isTabNameAndMergeA && (logA.tabId !== logB.tabId || logB.isCommand || !isISB)) {
      return true;
    }
    if (isTabNameAndMergeB && (logA.tabId !== logB.tabId || logA.isCommand || !isISA)) {
      return true;
    }

    // 우선순위 1위: 발언자별 통합 (연속되는 대사 사이사이에는 구분선이 들어가지 않음)
    if (logB.isContinuation) {
      return false;
    }
    if (logA.isCommand || logB.isCommand) {
      // 우선순위 2위: 다이스 및 매크로 (사이사이나 위 아래에 구분선 없음)
      return false;
    }

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
      } else if (!isISA && isISB) {
        // 가장 첫 정보/비밀 위: '탭 이름 표시'가 활성화되어 있다면 구분선이 있음
        return showTabNames.has(formatB);
      } else if (isISA && !isISB) {
        // 가장 마지막 정보/비밀 아래: 해당 비밀/정보탭의 '탭 이름 표시'가 활성화되어 있을 때만 구분선이 들어감
        return showTabNames.has(formatA);
      }
    } else {
      // 우선순위 4위: 잡담 탭 (잡담끼리는 하나로 취급해 사이사이에 구분선 없고, 첫 잡담 위와 마지막 잡담 아래에만 선이 있음)
      const isChatA = formatA === 'other';
      const isChatB = formatB === 'other';
      if (isChatA || isChatB) {
        if (isChatA && isChatB) {
          return false;
        }
        return true;
      } else {
        // 그 외 일반적인 경우 (기본)
        const isSameTab = logA.tab === logB.tab;
        const shouldMergeA = mergeTabStyles.has(formatA);
        if (shouldMergeA && isSameTab) {
          return false;
        }
        return true;
      }
    }
    return false;
  };

  const getHasSpecialDividerBetween = (chunkA: any, chunkB: any) => {
    if (!getHasDividerBetween(chunkA, chunkB)) return false;
    const logA = chunkA.logs[0];
    const logB = chunkB.logs[0];
    if (logA.tabId === logB.tabId) return false;

    const getFormatOf = (l: any) => {
      if (l.isCommand) return 'command';
      const tabSet = tabSettings[l.tabId];
      const formatVal = tabSet?.format || 'main';
      if (l.charId === narrationCharacter && formatVal === 'main') {
        return 'narration';
      }
      return formatVal;
    };

    const formatA = getFormatOf(logA);
    const formatB = getFormatOf(logB);

    const isISA = formatA === 'info' || formatA === 'secret' || formatA === 'other';
    const isISB = formatB === 'info' || formatB === 'secret' || formatB === 'other';

    return isISA || isISB;
  };

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
    const isLastVisibleChunk = nextVisibleChunk === null;

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

    const isSectionEndOuter = !nextVisibleChunk || isNextSameTab === false || hasBlockAfter;
    const mergeWithNextOuter = shouldMergeStyle && isNextSameTab && !isSectionEndOuter;

    const isNarration = log.charId === narrationCharacter && format === 'main';
    const isPrevNarration = prevVisibleChunk ? (!hasBlockBefore && prevVisibleChunk.logs[0].charId === narrationCharacter && (tabSettings[prevVisibleChunk.logs[0].tabId]?.format || 'main') === 'main') : false;
    const isNextNarration = nextVisibleChunk ? (!hasBlockAfter && nextVisibleChunk.logs[0].charId === narrationCharacter && (tabSettings[nextVisibleChunk.logs[0].tabId]?.format || 'main') === 'main') : false;

    // Calculate divider presence and visual properties early
    const hasDividerBelow = nextVisibleChunk ? getHasDividerBetween(chunk, nextVisibleChunk) : false;
    const hasDividerAbove = prevVisibleChunk ? getHasDividerBetween(prevVisibleChunk, chunk) : false;

    const hasSpecialDividerBelow = nextVisibleChunk ? getHasSpecialDividerBetween(chunk, nextVisibleChunk) : false;
    const hasSpecialDividerAbove = prevVisibleChunk ? getHasSpecialDividerBetween(prevVisibleChunk, chunk) : false;

    const prevLogObj = prevVisibleChunk ? prevVisibleChunk.logs[0] : null;
    let prevFormat = null;
    if (prevLogObj) {
      if (prevLogObj.isCommand) {
        prevFormat = 'command';
      } else {
        const tabSetVal = tabSettings[prevLogObj.tabId];
        const formatVal = tabSetVal?.format || 'main';
        if (prevLogObj.charId === narrationCharacter && formatVal === 'main') {
          prevFormat = 'narration';
        } else {
          prevFormat = formatVal;
        }
      }
    }
    const isSectionStartOuter = !prevVisibleChunk || isPrevSameTab === false || hasBlockBefore;
    const mergeWithPrevOuter = log.isContinuation || (shouldMergeStyle && isPrevSameTab && !isSectionStartOuter);

    const nextLogObj = nextVisibleChunk ? nextVisibleChunk.logs[0] : null;
    let nextFormat = null;
    if (nextLogObj) {
      if (nextLogObj.isCommand) {
        nextFormat = 'command';
      } else {
        const tabSetVal = tabSettings[nextLogObj.tabId];
        const formatVal = tabSetVal?.format || 'main';
        if (nextLogObj.charId === narrationCharacter && formatVal === 'main') {
          nextFormat = 'narration';
        } else {
          nextFormat = formatVal;
        }
      }
    }

    let dividerHtml = '';
    if (hasDividerBelow) {
      const isMainTab = format === 'main' ? 'true' : 'false';
      const isNarrationCharacterTag = log.charId === narrationCharacter ? 'true' : 'false';
      const isCommandFlag = log.isCommand ? 'true' : 'false';
      const divAttrs = isFilterEnabled 
        ? ` data-tab="${log.tabId}" data-char="${log.charId}" data-is-main-tab="${isMainTab}" data-is-narration-character="${isNarrationCharacterTag}" data-is-command="${isCommandFlag}" class="ccfolia-log-entry log-divider"`
        : ` class="log-divider"`;
      const borderStyleColor = isDark 
        ? `rgba(255, 255, 255, 0.15)` 
        : `rgba(0, 0, 0, 0.1)`;
      
      const isInternalBoxDivider = (format === 'info' || format === 'secret') && mergeWithNextOuter;
      const tabColor = tabSet?.color || '#ffd400';
      
      let nextShouldShowIndex = false;
      if (nextLogObj && nextFormat) {
        const isSameTab = log.tabId === nextLogObj.tabId;
        nextShouldShowIndex = showTabNames.has(nextFormat) && (!isSameTab || hasBlockAfter);
      }

      let marginTopVal = hasSpecialDividerBelow ? 12 : 0;
      let marginBottomVal = hasSpecialDividerBelow ? 12 : 0;

      if (hasSpecialDividerBelow) {
        if (format === 'main') {
          marginTopVal = 0;
        }
        if (nextFormat === 'main') {
          if (nextShouldShowIndex) {
            marginBottomVal = 12;
          } else {
            marginBottomVal = 0;
          }
        }
      }
      
      let styleStr = `margin-top: ${s(marginTopVal)}px; margin-bottom: ${s(marginBottomVal)}px; margin-left: 0; margin-right: 0;`;
      if (isInternalBoxDivider) {
        const bg = format === 'secret' ? getSecretBg(tabColor) : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)');
        const bLeft = format === 'secret' ? `4px solid ${tabColor}` : `4px solid ${isDark ? '#444' : '#DDD'}`;
        styleStr = `margin-top: ${s(marginTopVal)}px; margin-bottom: ${s(marginBottomVal)}px; margin-left: ${paddingHorizontal}px; margin-right: ${paddingHorizontal}px; background: ${bg}; border-left: ${bLeft}; padding-left: ${paddingHorizontal}px; padding-right: ${paddingHorizontal}px;`;
      } else {
        styleStr += ` padding-left: ${paddingHorizontal}px; padding-right: ${paddingHorizontal}px;`;
      }

      dividerHtml = `<div${divAttrs} style="${styleStr} display: flex; align-items: center; justify-content: stretch; pointer-events: none;"><div style="width: 100%; border-bottom: 1px solid ${borderStyleColor};"></div></div>`;
    }

    // Generate blocksAfterHtml early
    let blocksAfterHtml = '';
    if (blocksAfter && blocksAfter.length > 0) {
      blocksAfter.forEach((block: any) => {
        if (block.type === 'image' && isValidUrl(block.url)) {
          const align = block.align || 'center';
          const justify = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start';
          const widthStyle = block.width ? `width: ${block.width}px;` : 'max-width: 100%;';
          const isMainTab = format === 'main' ? 'true' : 'false';
          const imgAttrs = isFilterEnabled 
            ? ` data-tab="${log.tabId}" data-char="${log.charId}" data-is-main-tab="${isMainTab}" class="ccfolia-log-entry"`
            : '';
          blocksAfterHtml += `<div${imgAttrs} style="display: flex; justify-content: ${justify}; margin: 10px ${s(15.6)}px;">
            <img src="${block.url}" style="${widthStyle} border-radius: 8px; display: block;" referrerPolicy="no-referrer" onerror="this.style.display='none'" />
          </div>`;
        }
      });
    }

    // Combine all contents in this chunk
    let finalHtmlContentPieces = groupedLogs.map((l, i) => {
      let content = l.content;
      if (l.isCommand) {
        content = content.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/(?:\r\n|\r|\n)+/g, ' ');
      }
      
      let textPieces = [content];
      if (isNarration && enableSentenceSpacing) {
        textPieces = splitNarration(content);
      }
      
      let htmlPieces = textPieces.map(piece => {
        let pieceHtml = linkifyAndFormat(piece);
        if (l.name === 'system') {
          pieceHtml = pieceHtml.replace(/\[\s*(.*?)\s*\]/g, (match: string, p1: string) => {
            const charIds = Object.keys(charSettings).filter(id => charSettings[id].name === p1.trim());
            const matchedChar = charIds.length > 0 ? charSettings[charIds[0]] : null;
            return matchedChar ? `<span style="color: ${matchedChar.color};">${match}</span>` : match;
          });
        }
        let sanitizeFn = (DOMPurify && DOMPurify.sanitize) ? DOMPurify.sanitize.bind(DOMPurify) : (global as any).DOMPurify?.sanitize;
        return sanitizeFn ? sanitizeFn(pieceHtml, { ADD_ATTR: ['target'] }) : pieceHtml;
      });
      return htmlPieces;
    });

    let finalHtmlContent = finalHtmlContentPieces.map(pieces => pieces.join(`<div style="margin-top: ${isNarration ? '10px' : (format === 'other' ? '4px' : '0.8em')};"></div>`)).join(`<div style="margin-top: ${isNarration ? '10px' : (format === 'other' ? '4px' : '0.8em')};"></div>`);

    if (!isHidden) {
      const hasSpecialDividerAboveAndNoBadge = hasSpecialDividerAbove && !(showTabNames.has(format) && !isPrevSameTab);
      if (showTabNames.has(format) && !isPrevSameTab) {
        const tabName = log.tab;
      const isSecret = format === 'secret';
      const tabColor = tabSet?.color || '#ffd400';
      const tabBg = getSecretBg(tabColor);
      
      const isMainTab = format === 'main' ? 'true' : 'false';
      if (isInline) {
        const fAttrs = isFilterEnabled ? ` data-tab="${log.tabId}" data-is-main-tab="${isMainTab}" class="ccfolia-log-entry"` : '';
        const tabMarginTop = hasSpecialDividerAbove ? '0' : `${s(12)}px`;
        html += `<div${fAttrs} style="margin: ${tabMarginTop} ${paddingHorizontal}px ${s(8)}px ${paddingHorizontal}px; display: flex;">
          <div style="background: ${tabBg}; color: ${tabColor}; padding: 2px 10px; border-radius: 4px; font-size: 0.74em; font-weight: bold; border: 1px solid ${tabColor}44;">
            ${tabName}
          </div>
        </div>`;
      } else {
        const fAttrs = isFilterEnabled ? ` data-tab="${log.tabId}" data-is-main-tab="${isMainTab}" class="tab-name-block ccfolia-log-entry"` : ` class="tab-name-block"`;
        const badgeStyle = hasSpecialDividerAbove ? ' style="margin-top: 0 !important;"' : '';
        html += `<div${fAttrs}${badgeStyle}>
          <div class="tab-name-badge" style="background: ${tabBg}; color: ${tabColor}; border: 1px solid ${tabColor}44;">
            ${tabName}
          </div>
        </div>`;
      }
    }

    if (isInline) {
      const avatarStyle = `width: ${avatarSize}px; height: ${avatarSize}px; flex-shrink: 0; background-color: ${hideAvatar ? 'transparent' : avatarPlaceholder}; border-radius: 4px; object-fit: contain;`;
      const bodyStyle = `flex-grow: 1; line-height: ${lineHeight}; ${letterSpacing === 0 ? '' : `letter-spacing: ${letterSpacing}px;`}`;
      const nameStyle = `font-weight: bold; color: ${color}; font-size: ${r(textFontSize * 0.96)}px; margin-bottom: ${Math.max(4, Math.ceil(textFontSize * (lineHeight >= 1.4 ? 0.3 : 0.5)))}px; display: block;`;
      const contentStyle = `font-size: ${r(textFontSize)}px; color: ${textColor}; white-space: pre-wrap; word-break: break-all;`;
      const otherContentStyle = `font-size: ${r(textFontSize)}px; color: ${otherTextColor}; white-space: pre-wrap; word-break: break-all;`;
      
      const isSectionStart = chunkIdx === 0 || hasBlockBefore;
      const mergeWithPrev = shouldMergeStyle && isPrevSameTab && !isSectionStart;
      const isSectionEnd = isNextSameTab === false || hasBlockAfter;
      const mergeWithNext = shouldMergeStyle && isNextSameTab && !isSectionEnd;

      let itemMarginTop = '0';
      let itemMarginBottom = '0';

      if (log.isCommand || format === 'secret') {
        itemMarginBottom = mergeWithNext ? '0' : `${effectiveBlockSpacing}px`;
      } else if (isNarration) {
        itemMarginTop = isPrevNarration && !hasBlockBefore ? '0' : `${Math.floor(narrationMargin / 2)}px`;
        itemMarginBottom = isNextNarration && !hasBlockAfter ? '0' : `${Math.ceil(narrationMargin / 2)}px`;
      } else {
        itemMarginTop = mergeWithPrev ? '0' : `${Math.floor(effectiveBlockSpacing / 2)}px`;
        itemMarginBottom = mergeWithNext ? '0' : `${Math.ceil(effectiveBlockSpacing / 2)}px`;
      }

      if (format === 'other') {
        itemMarginBottom = '0';
        itemMarginTop = '0';
      }

      if (hasSpecialDividerAboveAndNoBadge) {
        itemMarginTop = '0';
      }

      const isMainTab = format === 'main' ? 'true' : 'false';
      const isNarrationCharacterTag = log.charId === narrationCharacter ? 'true' : 'false';
      const isCommandFlag = log.isCommand ? 'true' : 'false';
      const fullFilterAttrs = isFilterEnabled 
        ? ` data-tab="${log.tabId}" data-char="${log.charId}" data-is-main-tab="${isMainTab}" data-is-narration-character="${isNarrationCharacterTag}" data-is-command="${isCommandFlag}" class="ccfolia-log-entry"`
        : '';
        
      if (isNarration) {
        html += `<div${fullFilterAttrs} style="position: relative; margin-bottom: ${itemMarginBottom}; margin-top: ${itemMarginTop}; padding: ${isPrevNarration ? '0.4em' : `${paddingVertical}px`} ${paddingHorizontal}px ${isNextNarration ? '0.4em' : `${paddingVertical}px`} ${paddingHorizontal}px; text-align: center; color: ${textColor}; line-height: ${lineHeight}; font-size: ${r(textFontSize)}px; ${letterSpacing === 0 ? '' : `letter-spacing: ${letterSpacing}px;`} font-weight: bold; font-style: italic;">`;
        const flatPieces = finalHtmlContentPieces.flat();
        html += flatPieces.map((piece, pIdx) => {
          const prefix = pIdx > 0 ? `<div style="margin-top: 0.8em;"></div>` : '';
          return `${prefix}<div style="white-space: pre-wrap; word-break: break-all;">${piece}</div>`;
        }).join('');
        if (blocksAfterHtml) {
          html += blocksAfterHtml;
        }
        if (hasDividerBelow) {
          html += dividerHtml;
        }
        html += `</div>`;
      } else {
        html += `<div${fullFilterAttrs} style="position: relative; margin-bottom: ${itemMarginBottom}; margin-top: ${itemMarginTop};">`;
        if (log.isCommand) {
          const nameHtml = log.name !== 'system' ? `<span style="color: ${color}; font-family: 'NanumGothicCodingLigature', monospace; font-weight: bold; font-size: ${r(textFontSize)}px;">[ ${log.name} ]</span>` : '';
          const marginLeft = log.name !== 'system' ? 'margin-left: 8px;' : '';
          const lsStyle = letterSpacing === 0 ? '' : `letter-spacing: ${letterSpacing}px;`;
          const cmdMarginTop = hasSpecialDividerAboveAndNoBadge ? '0' : `${s(8)}px`;
          if (format === 'secret') {
            const tabColor = tabSet?.color || '#ffd400';
            const secretBg = getSecretBg(tabColor);
            html += `<div style="display: flex; align-items: center; flex-wrap: wrap; background: ${secretBg}; border: 1px solid ${borderColor}; padding: ${paddingVertical}px ${paddingHorizontal}px; border-radius: 8px; margin: ${cmdMarginTop} ${paddingHorizontal}px ${s(8)}px ${paddingHorizontal}px;">${nameHtml}<span style="color: ${textColor}; font-family: 'NanumGothicCodingLigature', monospace; font-weight: bold; line-height: 1.6; font-size: ${r(textFontSize)}px; ${lsStyle} ${marginLeft}">${finalHtmlContent}</span></div>`;
          } else {
            html += `<div style="display: flex; align-items: center; flex-wrap: wrap; background: ${commandBg}; border: 1px solid ${borderColor}; padding: ${paddingVertical}px ${paddingHorizontal}px; border-radius: 8px; margin: ${cmdMarginTop} ${paddingHorizontal}px ${s(8)}px ${paddingHorizontal}px;">${nameHtml}<span style="color: ${textColor}; font-family: 'NanumGothicCodingLigature', monospace; font-weight: bold; line-height: 1.6; font-size: ${r(textFontSize)}px; ${lsStyle} ${marginLeft}">${finalHtmlContent}</span></div>`;
          }
        } else if (format === 'other') {
          html += `<div style="padding: ${s(2)}px ${paddingHorizontal}px; display: flex; gap: ${gapSize / 1.5}px; align-items: baseline; line-height: ${lineHeight}; ${letterSpacing === 0 ? '' : `letter-spacing: ${letterSpacing}px;`}">
            <span style="font-weight: bold; flex-shrink: 0; font-size: ${r(textFontSize * 0.96)}px; color: ${otherNameColor};">${log.name}</span>
            <div style="${otherContentStyle}">${finalHtmlContent}</div>
          </div>`;
        } else if (format === 'info') {
          const infoMarginTop = hasSpecialDividerAboveAndNoBadge ? '0' : (mergeWithPrev ? '0' : '4px');
          const infoMarginBottomVal = mergeWithNext ? '0' : (hasSpecialDividerBelow ? '0' : '4px');
          const infoMargin = `${infoMarginTop} ${paddingHorizontal}px ${infoMarginBottomVal} ${paddingHorizontal}px`;
          const infoRadius = shouldMergeStyle 
            ? `${(isPrevSameTab && !isSectionStart) ? '0' : '4px'} ${(isPrevSameTab && !isSectionStart) ? '0' : '4px'} ${(isNextSameTab && !isSectionEnd) ? '0' : '4px'} ${(isNextSameTab && !isSectionEnd) ? '0' : '4px'}`
            : '4px';
          const infoBorderTop = shouldMergeStyle && isPrevSameTab && !isSectionStart ? 'none' : '';
          const infoBorderBottom = shouldMergeStyle && isNextSameTab && !isSectionEnd ? 'none' : '';

          const lsStyle = letterSpacing === 0 ? '' : `letter-spacing: ${letterSpacing}px;`;
          html += `<div style="padding: ${paddingVertical}px ${paddingHorizontal}px; background: ${infoBg}; border-left: 4px solid ${borderColor}; margin: ${infoMargin}; border-radius: ${infoRadius}; ${infoBorderTop ? `border-top: ${infoBorderTop}; ` : ''}${infoBorderBottom ? `border-bottom: ${infoBorderBottom}; ` : ''} line-height: ${lineHeight}; ${lsStyle}">
            <span style="${nameStyle}">${log.name}</span>
            <div style="${contentStyle}">${finalHtmlContent}</div>
          </div>`;
        } else if (format === 'secret') {
          const tabColor = tabSet?.color || '#ffd400';
          const secretBg = getSecretBg(tabColor);
          const imgTag = img ? `<img src="${img}" style="${avatarStyle}" />` : `<div style="${avatarStyle}"></div>`;
          const secretMarginTop = hasSpecialDividerAboveAndNoBadge ? '0' : (mergeWithPrev ? '0' : '4px');
          const secretMarginBottomVal = mergeWithNext ? '0' : (hasSpecialDividerBelow ? '0' : '4px');
          const secretMargin = `${secretMarginTop} ${paddingHorizontal}px ${secretMarginBottomVal} ${paddingHorizontal}px`;
          const secretRadius = shouldMergeStyle 
            ? `${(isPrevSameTab && !isSectionStart) ? '0' : '4px'} ${(isPrevSameTab && !isSectionStart) ? '0' : '4px'} ${(isNextSameTab && !isSectionEnd) ? '0' : '4px'} ${(isNextSameTab && !isSectionEnd) ? '0' : '4px'}`
            : '4px';
          const secretBorderTop = shouldMergeStyle && isPrevSameTab && !isSectionStart ? 'none' : '';
          const secretBorderBottom = shouldMergeStyle && isNextSameTab && !isSectionEnd ? 'none' : '';

          const borderTopStyle = secretBorderTop ? `border-top: ${secretBorderTop}; ` : '';
          const borderBottomStyle = secretBorderBottom ? `border-bottom: ${secretBorderBottom}; ` : '';

          html += `
            <div style="display: flex; gap: ${gapSize}px; padding: ${paddingVertical}px ${paddingHorizontal}px; align-items: flex-start; background: ${secretBg}; border-left: 4px solid ${tabColor}; margin: ${secretMargin}; border-radius: ${secretRadius}; ${borderTopStyle}${borderBottomStyle}">
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
            <div style="display: flex; gap: ${gapSize}px; padding: ${paddingVertical}px ${paddingHorizontal}px; align-items: flex-start;">
              ${avatarHtml}
              <div style="${bodyStyle}">
                <span style="${nameStyle}">${log.name}</span>
                <div style="${contentStyle}">${finalHtmlContent}</div>
              </div>
            </div>`;
        }
        if (blocksAfterHtml) {
          html += blocksAfterHtml;
        }
        if (hasDividerBelow) {
          html += dividerHtml;
        }
        html += `</div>`;
      }
    } else {
      const isSectionStart = !prevVisibleChunk || hasBlockBefore;
      const isSectionEnd = !nextVisibleChunk || isNextSameTab === false || hasBlockAfter;
      let mb = '';
      let mt = '';

      if (log.isCommand || format === 'secret') {
        mb = isNextSameTab && !hasBlockAfter && shouldMergeStyle ? 'mb-0' : 'mb-cmd';
      } else if (isNarration) {
        mt = isPrevNarration ? 'mt-0' : 'mt-narr';
        mb = isNextNarration ? 'mb-0' : 'mb-narr';
      } else {
        mt = isPrevSameTab && !hasBlockBefore && shouldMergeStyle ? 'mt-0' : 'mt-normal';
        mb = isNextSameTab && !hasBlockAfter && shouldMergeStyle ? 'mb-0' : 'mb-normal';
      }

      const cl = [mb, mt].filter(Boolean).join(' ');
      const clStr = `log-item${cl ? ` ${cl}` : ''}${hasSpecialDividerAboveAndNoBadge ? ' mt-0-force' : ''}`;
      
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
          html += `<div class="command-box" style="display: flex; align-items: center; flex-wrap: wrap; background: ${secretBg}; border: 1px solid ${borderColor}; margin: ${s(8)}px ${paddingHorizontal}px; border-radius: 8px;">${nameHtml}<span class="command-text" style="${marginLeft}">${finalHtmlContent}</span></div>`;
        } else {
          html += `<div class="command-box" style="display: flex; align-items: center; flex-wrap: wrap;">${nameHtml}<span class="command-text" style="${marginLeft}">${finalHtmlContent}</span></div>`;
        }
      } else if (isNarration) {
        const flatPieces = finalHtmlContentPieces.flat();
        html += `<div class="narration-row" style="padding: ${isPrevNarration ? '0.4em' : `${paddingVertical}px`} ${paddingHorizontal}px ${isNextNarration ? '0.4em' : `${paddingVertical}px`} ${paddingHorizontal}px;">`;
        html += flatPieces.map((piece, pIdx) => {
          const prefix = pIdx > 0 ? `<div style="margin-top: 0.8em;"></div>` : '';
          return `${prefix}<div style="white-space: pre-wrap; word-break: keep-all; overflow-wrap: break-word;">${piece}</div>`;
        }).join('');
        html += `</div>`;
      } else if (format === 'other') {
        html += `<div class="other-row" style="padding-top: ${s(2)}px; padding-bottom: ${s(2)}px;"><span class="other-name" style="color: ${otherNameColor}">${log.name}</span><div class="other-content">${finalHtmlContent}</div></div>`;
      } else if (format === 'info') {
        const tZ = isPrevSameTab && !isSectionStart, bZ = isNextSameTab && !isSectionEnd;
        const rad = shouldMergeStyle ? `${tZ ? 0 : 4}px ${tZ ? 0 : 4}px ${bZ ? 0 : 4}px ${bZ ? 0 : 4}px` : '4px';
        const st = [
          shouldMergeStyle ? `margin: 0 ${paddingHorizontal}px;` : '',
          rad !== '4px' ? `border-radius: ${rad};` : '',
          shouldMergeStyle && tZ ? 'border-top: none;' : '',
          shouldMergeStyle && bZ ? 'border-bottom: none;' : ''
        ].filter(Boolean).join(' ');

        html += `<div class="info-row"${st ? ` style="${st}"` : ''}><span class="main-name" style="color: ${color};">${log.name}</span><div class="main-content">${finalHtmlContent}</div></div>`;
      } else if (format === 'secret') {
        const tabColor = tabSet?.color || '#ffd400';
        const secretBg = getSecretBg(tabColor);
        const avSt = hideAvatar ? 'background-color: transparent;' : '';
        const tZ = isPrevSameTab && !isSectionStart, bZ = isNextSameTab && !isSectionEnd;
        const rad = shouldMergeStyle ? `${tZ ? 0 : 4}px ${tZ ? 0 : 4}px ${bZ ? 0 : 4}px ${bZ ? 0 : 4}px` : '4px';
        const st = [
          `background: ${secretBg};`,
          `border-left: 4px solid ${tabColor};`,
          shouldMergeStyle ? `margin: 0 ${paddingHorizontal}px;` : '',
          rad !== '4px' ? `border-radius: ${rad};` : '',
          shouldMergeStyle && tZ ? 'border-top: none;' : ''
        ].filter(Boolean).join(' ');

        if (hideAllAvatars) {
          html += `<div class="secret-row no-avatar-grid" style="${st}"><span class="main-name" style="color: ${color};">${log.name}:</span><div class="main-body"><div class="main-content">${finalHtmlContent}</div></div></div>`;
        } else {
          const avatarHtml = img ? `<img src="${img}" class="main-avatar"${avSt ? ` style="${avSt}"` : ''} />` : `<div class="main-avatar"${avSt ? ` style="${avSt}"` : ''}></div>`;
          html += `<div class="secret-row" style="${st}">${avatarHtml}<div class="main-body"><span class="main-name" style="color: ${color};">${log.name}</span><div class="main-content">${finalHtmlContent}</div></div></div>`;
        }
      } else {
        const avSt = hideAvatar ? 'background-color: transparent;' : '';
        if (hideAllAvatars) {
          html += `<div class="main-row no-avatar-grid"><span class="main-name" style="color: ${color};">${log.name}:</span><div class="main-body"><div class="main-content">${finalHtmlContent}</div></div></div>`;
        } else {
          const avatarHtml = img ? `<img src="${img}" class="main-avatar"${avSt ? ` style="${avSt}"` : ''} />` : `<div class="main-avatar"${avSt ? ` style="${avSt}"` : ''}></div>`;
          html += `<div class="main-row">${avatarHtml}<div class="main-body"><span class="main-name" style="color: ${color};">${log.name}</span><div class="main-content">${finalHtmlContent}</div></div></div>`;
        }
      }
      if (blocksAfterHtml) {
        html += blocksAfterHtml;
      }
      if (hasDividerBelow) {
        html += dividerHtml;
      }
      html += `</div>`;
    }
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
        ${textResetCSS}
        .log-container * { box-sizing: border-box; min-width: 0; }
      </style>` : `<style>${css}</style>`}
    </head>
    <body>
      <div class="log-main-container"${isInline ? ` style="background-color: ${bgColor}; margin: 0; padding: 0;"` : ''}>
        ${filterBarHtml}
        ${isInline ? `<div class="log-container" style="width: 100%; max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; ${fontFamily !== '(폰트 적용X)' ? `font-family: ${fontValue};` : ''} background: ${bgColor}; color: ${textColor}; line-height: ${lineHeight}; letter-spacing: ${letterSpacing === 0 ? 'normal' : `${letterSpacing}px`}; padding: 20px 0; font-size: ${textFontSize}px; overflow-x: hidden;">\n${html}\n</div>` : `<div class="log-container">\n${html}\n</div>`}
      </div>
      ${filterBarScript}
    </body>
    </html>
  `;
};
