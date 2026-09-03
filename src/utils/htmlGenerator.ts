import { LogEntry, CharSetting, TabSetting, Illustration } from '../types';
import { cn, r, linkifyAndFormat } from '../utils';
import DOMPurify from 'dompurify';
import { fonts } from '../constants';
import { splitNarration } from './textTokenizer';
import { parseYoutubeUrl } from './youtube';

const hexToRgbValues = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
};

export const isValidUrl = (url: string) => {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:image/');
};

export const isValidBgm = (block: any) => {
  if (!block || block.type !== 'bgm') return false;
  const parsed = parseYoutubeUrl(block.url, block.useTimestamp);
  return Boolean(block.videoId || parsed.videoId);
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
  cropFaceTop: boolean,
  hideAllAvatars: boolean,
  narrationCharacter: string | null,
  enableSentenceSpacing: boolean,
  enableSecretNarration: boolean,
  narrationFormat: 'style1' | 'style2' | 'style3',
  insertedBlocks: Record<string, any[]>,
  mergeTabs: Set<string>,
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
  showLogDivider: boolean = false,
  illustrations: Illustration[] = [],
  originalLogs: LogEntry[] = []
) => {
  const isDark = theme === 'dark';
  const cleanStyle = (styleStr: string) => {
    if (!styleStr) return '';
    let clean = styleStr
      .replace(/background-color:/gi, 'background:')
      // Compress 4-directional margin/padding into shorthand formats
      .replace(/(margin|padding):\s*(\S+)\s+(\S+)\s+(\S+)\s+(\S+)/gi, (match, prop, top, right, bottom, left) => {
        if (top === bottom && right === left) {
          if (top === right) return `${prop}:${top}`;
          return `${prop}:${top} ${right}`;
        }
        if (right === left) return `${prop}:${top} ${right} ${bottom}`;
        return match;
      })
      .replace(/:\s+/g, ':')
      .replace(/;\s+/g, ';')
      .trim();
    
    // Hex code compression (#ffffff -> #fff, #000000 -> #000, etc.)
    clean = clean.replace(/#([0-9a-fA-F])\1([0-9a-fA-F])\2([0-9a-fA-F])\3(?![0-9a-fA-F])/g, '#$1$2$3');
    
    if (clean.endsWith(';')) {
      clean = clean.slice(0, -1);
    }
    return clean;
  };
  const shortenId = (id: string) => {
    if (!id) return '';
    if (id === '__NARRATION__') return 'cn';
    const clean = id.replace(/^tab_/, 't').replace(/^char_/, 'c').replace(/[^a-zA-Z0-9_-]/g, '');
    if (/^[0-9]/.test(clean)) {
      return 'c' + clean;
    }
    return clean;
  };
  const sectionIds = new Set(filteredLogs.map(l => l.sectionId).filter(Boolean));
  const isFullExport = sectionIds.size > 1;
  const bgColor = isDark ? darkBgColor : lightBgColor;
  const textColor = isDark ? '#FFFFFF' : '#1a1a1a';
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

  const isFilterEnabled = filterBarMode !== 'none';
  const getFilterAttrs = (logEntry: LogEntry, forceClass: string = '') => {
    if (!isFilterEnabled) {
      return forceClass ? ` class="${forceClass}"` : '';
    }
    const isMainTab = (tabSettings[logEntry.tabId]?.format || 'main') === 'main';
    const isNarrationCharacterTag = logEntry.charId === narrationCharacter;
    const isCommandFlag = logEntry.isCommand;

    let attrs = ` d-t="${shortenId(logEntry.tabId)}" d-c="${shortenId(logEntry.charId)}"`;
    if (isMainTab) attrs += ' d-mt="1"';
    if (isNarrationCharacterTag) attrs += ' d-nc="1"';
    if (isCommandFlag) attrs += ' d-cm="1"';

    const classes = ['c-e', forceClass].filter(Boolean).join(' ');
    attrs += ` class="${classes}"`;
    return attrs;
  };

  const activeTabs = new Map<string, { id: string, name: string }>();
  const activeChars = new Map<string, { id: string, name: string, color: string }>();

  if (isFilterEnabled) {
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
      `<label class="i"><input type="checkbox" checked value="${shortenId(t.id)}" class="f-t"><span class="c"></span>${t.name}</label>`
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
      `<label class="i"><input type="checkbox" checked value="${shortenId(c.id)}" class="f-c"><span class="c"></span>${c.name}</label>`
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
          border: 1.5px solid ${borderColor}; border-radius: 8px;
          cursor: pointer; z-index: 1000001;
          display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 4px;
          transition: transform 0.2s ease, background-color 0.2s ease;
        }
        #f-btn:hover { transform: scale(1.05); }
        #f-btn span { display: block; width: 20px; height: 1.5px; background: ${isDark ? '#888' : '#666'}; }
        #f-menu {
          position: fixed !important; top: 68px; right: 20px;
          width: 200px; max-height: 0; opacity: 0;
          overflow: hidden; pointer-events: none;
          transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease, padding 0.25s ease;
          background: ${isDark ? 'rgba(30, 30, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)'}; border: 1px solid ${borderColor}; 
          border-radius: 10px; padding: 0 15px; 
          z-index: 1000000;
          box-shadow: -5px 5px 25px rgba(0,0,0,0.5);
        }
        #f-menu.expanded {
          max-height: 70vh; opacity: 1; padding: 15px;
          overflow-y: auto; pointer-events: auto;
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
          const tC = qs('input.f-t'), cC = qs('input.f-c');
          const aT = id('aT'), aC = id('aC'), items = qs('.c-e');
          
          ${!isFixed ? `
          const b = id('f-btn'), m = id('f-menu');
          if (b && m) {
            document.body.appendChild(b);
            document.body.appendChild(m);
            b.onclick = (e) => { e.stopPropagation(); m.classList.toggle('expanded'); };
            document.addEventListener('click', (e) => { if (!m.contains(e.target) && e.target !== b) m.classList.remove('expanded'); });
          }
          ` : ''}
          
          const update = () => {
            const hTbs = new Set(tC.filter(c => !c.checked).map(c => c.value));
            const hChs = new Set(cC.filter(c => !c.checked).map(c => c.value));
            
            items.forEach(i => {
              const t = i.getAttribute('d-t');
              const c = i.getAttribute('d-c');
              const mt = i.getAttribute('d-mt');
              const nc = i.getAttribute('d-nc');
              
              if (t && hTbs.has(t)) {
                i.style.display = 'none';
                return;
              }

              if (c) {
                if (nc === '1' && mt === '1') {
                  if (hChs.has('cn')) {
                    i.style.display = 'none';
                    return;
                  }
                } else {
                  if (hChs.has(c)) {
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
                const group = c.classList.contains('f-t') ? tC : cC;
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
    .c-ct :is(p, a, b, strong, i, em, h1, h2, h3, h4, h5, h6, .m-c, .o-c, .m-nm, .o-nm, .n-r, .n-sr, .c-tx) {
      background-color: transparent !important;
    }
    .s-p { margin-top: 4px; }
    .s-p-nr { margin-top: 10px; }
    .c-ct a, .c-ct a:visited, .c-ct a:hover, .c-ct a:active { color: inherit !important; text-decoration: underline !important; }
    .s-p-ob { margin-top: 0.8em; }
  `;

  const activeCharColors = new Map<string, string>();
  filteredLogs.forEach(log => {
    const cid = shortenId(log.charId);
    if (cid) {
      const charColor = charSettings[log.charId]?.color || log.color;
      if (charColor) {
        activeCharColors.set(cid, charColor);
      }
    }
  });

  const dynamicColorsCss = Array.from(activeCharColors.entries())
    .map(([cid, color]) => `.${cid} { color: ${color} !important; }`)
    .join('\n');

  let computedNameWidth = 120;
  if ((hideAllAvatars || narrationFormat === 'style3') && typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const fw = fontValue || 'sans-serif';
      const nameSizePixel = textFontSize * 0.96;
      ctx.font = `bold ${nameSizePixel}px ${fw}`;
      let mw = 0;
      for (const log of filteredLogs) {
        if (!log.isContinuation) {
          const isNarration = log.charId === narrationCharacter;
          if (hideAllAvatars || (isNarration && narrationFormat === 'style3')) {
            const w = ctx.measureText(log.name + ':').width;
            if (w > mw) mw = w;
          }
        }
      }
      computedNameWidth = Math.min(Math.max(20, Math.ceil(mw + 4)), 160);
    }
  }

  const css = `
    ${fontImport}
    ${filterBarCSS}
    ${textResetCSS}
    ${dynamicColorsCss}
    .c-mc { background-color: ${bgColor}; margin: 0; padding: 0; }
    .c-ct * { box-sizing: border-box; min-width: 0; }
    .c-ct { 
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
    
    .c-i { position: relative; }
    .c-i.c-mb0 { margin-bottom: 0 !important; }
    .c-i.c-mt0 { margin-top: 0 !important; }
    .c-i.c-mb-n { margin-bottom: ${Math.ceil(effectiveBlockSpacing / 2)}px !important; }
    .c-i.c-mt-n { margin-top: ${Math.floor(effectiveBlockSpacing / 2)}px !important; }
    .c-i.c-mb-nr { margin-bottom: ${Math.ceil(narrationMargin / 2)}px !important; }
    .c-i.c-mt-nr { margin-top: ${Math.floor(narrationMargin / 2)}px !important; }
    .c-i.c-mb-c { margin-bottom: ${effectiveBlockSpacing}px !important; }
    .c-i div:not(.c-dv) { margin-bottom: 0 !important; }
    .c-mt-f { margin-top: 0 !important; }
    .c-mt-f .s-r, .c-mt-f .i-r, .c-mt-f .c-bx { margin-top: 0 !important; }

    .t-bl { margin: ${s(12)}px ${paddingHorizontal}px ${s(8)}px; display: flex; }
    .t-bd { display: inline-block; white-space: nowrap; padding: 2px 10px; border-radius: 4px; font-size: 0.74em; font-weight: bold; }

    .m-r, .s-r, .c-bx, .n-r { padding: ${paddingVertical}px ${paddingHorizontal}px; }
    .m-r, .s-r { display: flex; gap: ${s(12)}px; align-items: flex-start; padding-top: ${paddingVertical}px; padding-bottom: ${paddingVertical}px; }
    .m-r.no-avatar-grid, .s-r.no-avatar-grid { display: flex; gap: 16px; align-items: flex-start; }
    .s-r { margin: ${s(4)}px ${paddingHorizontal}px; border-radius: 4px; }

    .m-a { 
      width: ${avatarSize}px; height: ${avatarSize}px; flex-shrink: 0; 
      background-color: ${avatarPlaceholder}; border-radius: 4px; object-fit: ${cropFaceTop ? 'cover' : 'contain'}; object-position: ${cropFaceTop ? 'top' : 'center'};
    }
    .m-b { flex-grow: 1; line-height: ${lineHeight}; }
    .m-nm { font-weight: bold; font-size: ${r(textFontSize * 0.96)}px; margin-bottom: ${Math.max(4, Math.ceil(textFontSize * (lineHeight >= 1.4 ? 0.3 : 0.5)))}px; display: block; }
    .no-avatar-grid .m-nm { width: ${computedNameWidth}px; flex-shrink: 0; margin-bottom: 0; text-align: right; }
    .no-avatar-grid .m-b { flex: 1; min-width: 0; }
    .m-c, .o-c { font-size: ${r(textFontSize)}px; white-space: pre-wrap; word-break: keep-all; overflow-wrap: break-word; }
    .m-c { color: ${textColor}; }

    .o-r { padding: ${s(4)}px ${paddingHorizontal}px; display: flex; gap: ${s(8)}px; align-items: baseline; }
    .o-nm { font-weight: bold; flex-shrink: 0; font-size: ${r(textFontSize * 0.96)}px; }
    .o-c { color: ${otherTextColor}; }

    .i-r { 
      padding: ${paddingVertical}px ${paddingHorizontal}px; background: ${infoBg};
      border-left: 4px solid ${borderColor}; margin: ${s(8)}px ${paddingHorizontal}px; border-radius: 4px;
    }
    
    .c-bx { 
      background: ${commandBg}; border: 1px solid ${borderColor}; 
      border-radius: 8px; margin: ${s(8)}px ${paddingHorizontal}px; 
      display: flex; align-items: center; flex-wrap: wrap;
    }
    .c-tx { font-family: 'NanumGothicCodingLigature', monospace; color: ${textColor}; font-weight: bold; line-height: 1.6; }

    .n-r { text-align: ${'center'}; color: ${textColor}; line-height: ${lineHeight}; font-size: ${r(textFontSize)}px; font-weight: bold; font-style: ${narrationFormat === 'style2' ? 'italic' : 'normal'}; }
    .n-sr { text-align: ${'center'}; color: ${textColor}; line-height: ${lineHeight}; font-size: ${r(textFontSize)}px; font-weight: bold; font-style: ${narrationFormat === 'style2' ? 'italic' : 'normal'}; padding: ${s(2)}px ${paddingHorizontal}px; margin-bottom: 0px; }

    .c-dv { display: flex; align-items: center; justify-content: stretch; pointer-events: none; margin-left: 0; margin-right: 0; padding-left: ${paddingHorizontal}px; padding-right: ${paddingHorizontal}px; }
    .c-dv-ib { margin-left: ${paddingHorizontal}px; margin-right: ${paddingHorizontal}px; padding-left: ${paddingHorizontal}px; padding-right: ${paddingHorizontal}px; }
    .c-dv-in { width: 100%; border-bottom: 1px solid; }
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
        let widthStyle = 'max-width:100%;';
        if (width) {
          const widthStr = String(width);
          widthStyle = widthStr.endsWith('px') || widthStr.endsWith('%') ? `width:${widthStr};` : `width:${widthStr}px;`;
        }
        html += `<div class="c-e" style="${cleanStyle(`display:flex;justify-content:${justify};margin:10px ${s(15.6)}px`)}">
          <img src="${url}" style="${cleanStyle(`${widthStyle}border-radius:8px;display:block`)}" referrerPolicy="no-referrer" onerror="this.style.display='none'" />
        </div>`;
      } else if (block.type === 'bgm' && isValidBgm(block)) {
        const bgmTitle = block.title || '🎧 BGM';
        const parsed = parseYoutubeUrl(block.url, block.useTimestamp);
        const videoId = block.videoId || parsed.videoId || '';
        const startTime = block.startTime || parsed.startTime || 0;
        const safeTitle = bgmTitle.replace(/"/g, '&quot;');
        
        html += `<div style="${cleanStyle(`position:relative;margin-top:0px;margin-bottom:0px;`)}">
          <div class="c-i bgm-center-wrapper" style="display:flex;justify-content:center;align-items:center;width:100%;margin:12px 0;">
            <div class="custom-bgm" data-vid="${videoId}" data-start="${startTime}" data-title="${safeTitle}" onclick="triggerBGM(event, this)">
              <svg class="icon" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> <span>${bgmTitle}</span>
            </div>
          </div>
        </div>`;
      }
    });
  }

  const finalLogsSequence: any[] = [];
  let prevLogForContinuation: any = null;

  (originalLogs || []).forEach((log, idx) => {
    if (log.isUnplaced) return; // Skip unplaced illustrations

    if (log.isBgmBlock) {
      const bgmLogEntry: any = {
        id: log.id,
        isBgmBlock: true,
        bgmData: log.bgmData,
        color: '',
        tabId: 'main',
        tab: tabSettings['main']?.name || '메인',
        charId: 'system',
        name: '',
        content: '',
        isCommand: false,
        isContinuation: false,
        isHiddenContent: false,
        sectionId: log.sectionId
      };
      finalLogsSequence.push(bgmLogEntry);
      prevLogForContinuation = bgmLogEntry;
      return;
    }

    if (log.isBgmBlock) {
      finalLogsSequence.push({ ...log, sectionId: log.sectionId });
      prevLogForContinuation = log;
      return;
    }

    if (log.isIllustration) {
      let resolvedTabId = log.tabOverride;
      if (resolvedTabId === 'auto' || !resolvedTabId || !tabSettings[resolvedTabId]) {
        let prevTabId = null;
        for (let i = idx - 1; i >= 0; i--) {
          if (originalLogs[i] && !originalLogs[i].isIllustration) {
            const tabId = originalLogs[i].tabId;
            if (tabSettings[tabId] && tabSettings[tabId].visible !== false) {
              prevTabId = tabId;
              break;
            }
          }
        }
        if (prevTabId) {
          resolvedTabId = prevTabId;
        } else {
          let nextTabId = null;
          for (let i = idx + 1; i < originalLogs.length; i++) {
            if (originalLogs[i] && !originalLogs[i].isIllustration) {
              const tabId = originalLogs[i].tabId;
              if (tabSettings[tabId] && tabSettings[tabId].visible !== false) {
                nextTabId = tabId;
                break;
              }
            }
          }
          resolvedTabId = nextTabId || Object.keys(tabSettings)[0] || 'main';
        }
      }
      const isIllVisible = tabSettings[resolvedTabId]?.visible !== false;
      if (isIllVisible) {
        const illLogEntry: any = {
          id: log.id,
          color: '',
          tabId: resolvedTabId,
          tab: tabSettings[resolvedTabId]?.name || '',
          charId: 'system',
          name: '',
          content: log.content,
          isCommand: false,
          isContinuation: false,
          isHiddenContent: false,
          isIllustration: true,
          illustration: {
            id: log.id,
            url: log.content,
            tabOverride: log.tabOverride || 'auto',
            width: log.width,
            align: log.align || 'center'
          },
          sectionId: log.sectionId
        };
        finalLogsSequence.push(illLogEntry);
        prevLogForContinuation = illLogEntry;
      }
      return;
    }

    // Check if the log is in filteredLogs (visible based on tab/character filters)
    const isLogVisible = filteredLogs.some(f => f.id === log.id);
    const hasImage = insertedBlocks[log.id]?.some((b: any) => b.type === 'image');

    let mappedLog: any = null;
    if (isLogVisible) {
      mappedLog = { ...log, isHiddenContent: false };
    } else if (hasImage) {
      mappedLog = { ...log, isHiddenContent: true };
    }

    if (mappedLog) {
      const tabSet = tabSettings[mappedLog.tabId];
      const format = tabSet?.format || 'main';
      const stableId = mappedLog.id.startsWith('merged:') ? mappedLog.id.split(',').pop()! : mappedLog.id;
      const prevStableId = prevLogForContinuation && !prevLogForContinuation.isIllustration ? (prevLogForContinuation.id.startsWith('merged:') ? prevLogForContinuation.id.split(',').pop()! : prevLogForContinuation.id) : '';
      const prevHasBlock = prevLogForContinuation && !prevLogForContinuation.isIllustration && !!insertedBlocks[prevStableId]?.length;

      let isContinuation = false;
      if (prevLogForContinuation && !prevLogForContinuation.isIllustration) {
        const prevFormat = tabSettings[prevLogForContinuation.tabId]?.format || 'main';
        const isPrevHidden = prevLogForContinuation.isHiddenContent;
        if (!mappedLog.isHiddenContent && 
            !isPrevHidden &&
            mergeTabs.has(format) && 
            mergeTabs.has(prevFormat) &&
            prevLogForContinuation.name === mappedLog.name && 
            prevLogForContinuation.tab === mappedLog.tab && 
            !mappedLog.isCommand && 
            !prevLogForContinuation.isCommand &&
            !prevHasBlock) {
          isContinuation = true;
        }
      }

      const newLog = { ...mappedLog, isContinuation };
      finalLogsSequence.push(newLog);
      prevLogForContinuation = newLog;
    }

    // 삽화 처리 (레거시 지원)
    // 삽화 처리 (레거시 지원)
    if (illustrations && illustrations.length > 0) {
      const logIllustrations = illustrations.filter((ill: any) => ill.afterLogIndex === idx);
      logIllustrations.forEach((ill: any) => {
        let resolvedTabId = ill.tabOverride;
        if (resolvedTabId === 'auto' || !resolvedTabId || !tabSettings[resolvedTabId]) {
          // 직전 로그 블록 탐색 (afterLogIndex가 idx이므로, 직전 로그는 originalLogs[idx]가 됨)
          let prevTabId = null;
          for (let i = idx; i >= 0; i--) {
            if (originalLogs[i]) {
              prevTabId = originalLogs[i].tabId;
              break;
            }
          }
          if (prevTabId) {
            resolvedTabId = prevTabId;
          } else {
            // 직후 로그 블록 탐색 (가장 상단에 삽화가 들어간 예외 케이스)
            let nextTabId = null;
            for (let i = idx + 1; i < originalLogs.length; i++) {
              if (originalLogs[i]) {
                nextTabId = originalLogs[i].tabId;
                break;
              }
            }
            resolvedTabId = nextTabId || Object.keys(tabSettings)[0] || 'main';
          }
        }
        const isIllVisible = tabSettings[resolvedTabId]?.visible !== false;
        if (isIllVisible) {
          const illLogEntry: any = {
            id: `illustration:${ill.id}`,
            color: '',
            tabId: resolvedTabId,
            tab: tabSettings[resolvedTabId]?.name || '',
            charId: 'system',
            name: '',
            content: ill.url,
            isCommand: false,
            isContinuation: false,
            isHiddenContent: false,
            isIllustration: true,
            illustration: { ...ill, tabOverride: resolvedTabId },
            sectionId: log.sectionId
          };
          finalLogsSequence.push(illLogEntry);
          prevLogForContinuation = illLogEntry;
        }
      });
    }
  });

  const chunks: { logs: any[], stableId: string, blocksAfter: any[], isHidden: boolean }[] = [];

  finalLogsSequence.forEach((log) => {
    const stableId = log.id.startsWith('merged:') ? log.id.split(',').pop()! : log.id;
    const currentBlocks = (insertedBlocks[stableId] || []).filter(b => 
      b.type === 'split' || 
      (b.type === 'image' && isValidUrl(b.url)) ||
      (b.type === 'bgm' && isValidBgm(b))
    );
    
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

    // 만약 전체 내보내기이고, 두 로그의 섹션 ID가 서로 다르다면 무조건 구분선 적용
    if (isFullExport && logA.sectionId && logB.sectionId && logA.sectionId !== logB.sectionId) {
      return true;
    }

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

    const isISA = formatA === 'info' || formatA === 'secret' || formatA === 'other';
    const isISB = formatB === 'info' || formatB === 'secret' || formatB === 'other';

    return isISA || isISB;
  };

  chunks.forEach((chunk, chunkIdx) => {
    const log = chunk.logs[0];

    let nextVisibleChunkIdx = chunkIdx + 1;
    while (nextVisibleChunkIdx < chunks.length && chunks[nextVisibleChunkIdx].isHidden) {
      nextVisibleChunkIdx++;
    }
    const nextVisibleChunk = nextVisibleChunkIdx < chunks.length ? chunks[nextVisibleChunkIdx] : null;

    if (log.isBgmBlock) {
      const bgmData = log.bgmData || {};
      const parsed = parseYoutubeUrl(bgmData.url, bgmData.useTimestamp);
      const videoId = bgmData.videoId || parsed.videoId;
      const startTime = bgmData.startTime || parsed.startTime || 0;
      if (videoId) {
        const isFilterEnabled = filterBarMode !== 'none';
        const bgmAttrs = isFilterEnabled ? ` d-t="main" d-c="system" class="c-e"` : '';
        const bgmTitle = bgmData.title || '🎧 BGM';
        const safeTitle = bgmTitle.replace(/"/g, '&quot;').replace(/'/g, "\\'");
        
        const hasDividerBelow = getHasDividerBetween(chunk, nextVisibleChunk);
        let dividerHtml = '';
        if (hasDividerBelow) {
          const borderStyleColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
          const dividerInStyle = isInline ? `width:100%;border-bottom:1px solid;border-color:${borderStyleColor};` : `border-color:${borderStyleColor};`;
          dividerHtml = `<div class="c-dv" style="${cleanStyle(`display:flex;align-items:center;justify-content:stretch;pointer-events:none;margin-top:0px;margin-bottom:0px;`)}"><div class="c-dv-in" style="${cleanStyle(dividerInStyle)}"></div></div>`;
        }

        html += `<div${bgmAttrs} style="${cleanStyle(`position:relative;margin-top:0px;margin-bottom:0px;`)}">
          <div class="c-i bgm-center-wrapper" style="display:flex;justify-content:center;align-items:center;width:100%;margin:12px 0;">
            <div class="custom-bgm" data-vid="${videoId}" data-start="${startTime}" data-title="${safeTitle}" onclick="triggerBGM(event, this)">
              <svg class="icon" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> <span>${bgmTitle}</span>
            </div>
          </div>
          ${hasDividerBelow ? dividerHtml : ''}
        </div>`;
      }
      return;
    }
    
    const { logs: groupedLogs, blocksAfter, isHidden, stableId } = chunk;

    const tabSet = tabSettings[log.tabId];
    const format = tabSet?.format || 'main';
    const char = charSettings[log.charId];
    const color = char?.color || log.color;
    const otherNameColor = disableOtherColor ? otherTextColor : color;
    const img = char?.imageUrl;
    const hideAvatar = hideEmptyAvatars;

    const prevChunk = chunkIdx > 0 ? chunks[chunkIdx - 1] : null;
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

    const isNarration = log.charId === narrationCharacter && (format === 'main' || (enableSecretNarration && format === 'secret'));
    const isPrevNarration = prevVisibleChunk ? (!hasBlockBefore && prevVisibleChunk.logs[0].charId === narrationCharacter && ((tabSettings[prevVisibleChunk.logs[0].tabId]?.format || 'main') === 'main' || (enableSecretNarration && tabSettings[prevVisibleChunk.logs[0].tabId]?.format === 'secret'))) : false;
    const isNextNarration = nextVisibleChunk ? (!hasBlockAfter && nextVisibleChunk.logs[0].charId === narrationCharacter && ((tabSettings[nextVisibleChunk.logs[0].tabId]?.format || 'main') === 'main' || (enableSecretNarration && tabSettings[nextVisibleChunk.logs[0].tabId]?.format === 'secret'))) : false;

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

    if (log.isBgmBlock) {
      if (!isHidden) {
        const bgmData = log.bgmData || {};
        
        let linkHtml = '';
        if (bgmData.url) {
          const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
          const match = bgmData.url.match(ytRegex);
          let finalUrl = bgmData.url;
          if (match && bgmData.useTimestamp && bgmData.startTime > 0) {
            const hasQ = finalUrl.includes('?');
            finalUrl += (hasQ ? '&' : '?') + `t=${Math.floor(bgmData.startTime)}`;
          }
          linkHtml = `
            <a href="${finalUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; color: inherit; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: rgba(0, 0, 0, 0.04); border-radius: 6px; font-size: 13px; margin-top: 4px; transition: background 0.2s;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              <span>YouTube에서 듣기</span>
            </a>
          `;
        }

        html += `
        <div style="width: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 12px 0; margin-top: 4px; margin-bottom: 4px;">
          <div style="display: flex; flex-direction: column; align-items: center; background: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'}; padding: 12px 20px; border-radius: 12px; border: 1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}; max-width: 100%;">
            <div style="font-size: 13px; opacity: 0.8; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
              <span>${bgmData.title || '🎧 BGM'}</span>
            </div>
            ${linkHtml}
          </div>
        </div>
        `;
      }
      return;
    }

    if (log.isIllustration) {
      if (!isHidden) {
        const ill = log.illustration;
        const illTabSet = tabSettings[ill.tabOverride];
        const illFormat = illTabSet?.format || 'main';
        const illIsSecret = illFormat === 'secret';
        const illTabColor = illTabSet?.color || '#ffd400';

        const align = ill.align || 'center';
        const justify = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start';
        let widthVal = 'max-width: 100%;';
        if (ill.width) {
          const wStr = String(ill.width);
          widthVal = wStr.endsWith('px') || wStr.endsWith('%') ? `width: ${wStr};` : `width: ${wStr}px;`;
        }

        // 1. Render Tab Name Badge if showTabNames has this format and isFirstInSection
        if (showTabNames.has(illFormat) && !isPrevSameTab) {
          const tabName = illTabSet?.name || 'Unknown';
          const tabBg = getSecretBg(illTabColor);
          const isMainTab = illFormat === 'main' ? 'true' : 'false';

          if (isInline) {
            const fAttrs = isFilterEnabled ? ` d-t="${shortenId(ill.tabOverride)}"${isMainTab === 'true' ? ' d-mt="1"' : ''} class="c-e"` : '';
            const tabMarginTop = hasSpecialDividerAbove ? '0' : `${s(12)}px`;
            const outerStyle = `margin: ${tabMarginTop} ${paddingHorizontal}px ${s(8)}px ${paddingHorizontal}px; display: flex;`;
            const badgeStyle = `background: ${tabBg}; color: ${illTabColor}; padding: 2px 10px; border-radius: 4px; font-size: 0.74em; font-weight: bold; border: 1px solid ${illTabColor}44; display: inline-block; white-space: nowrap;`;
            html += `<div${fAttrs} style="${cleanStyle(outerStyle)}">
              <div style="${cleanStyle(badgeStyle)}">
                ${tabName}
              </div>
            </div>`;
          } else {
            const fAttrs = isFilterEnabled ? ` d-t="${shortenId(ill.tabOverride)}"${isMainTab === 'true' ? ' d-mt="1"' : ''} class="t-bl c-e"` : ` class="t-bl"`;
            const badgeStyle = hasSpecialDividerAbove ? ' style="margin-top: 0 !important;"' : '';
            html += `<div${fAttrs}${badgeStyle}>
              <div class="t-bd" style="background: ${tabBg}; color: ${illTabColor}; border: 1px solid ${illTabColor}44;">
                ${tabName}
              </div>
            </div>`;
          }
        }

        // 2. Render the actual Illustration Container based on Format (info, secret, main/other)
        const fAttrs = isFilterEnabled ? ` d-t="${shortenId(ill.tabOverride)}" class="c-e"` : ' class="c-e"';

        if (isInline) {
          let wrapperStyle = '';
          if (illFormat === 'info') {
            wrapperStyle = `padding:${paddingVertical}px ${paddingHorizontal}px;background:${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'};border-left:4px solid ${isDark ? '#444' : '#DDD'};margin:4px ${paddingHorizontal}px;border-radius:4px;display:flex;justify-content:${justify};`;
          } else if (illFormat === 'secret') {
            wrapperStyle = `padding:${paddingVertical}px ${paddingHorizontal}px;background:${getSecretBg(illTabColor)};border-left:4px solid ${illTabColor};margin:4px ${paddingHorizontal}px;border-radius:4px;display:flex;justify-content:${justify};`;
          } else {
            wrapperStyle = `margin:4px ${paddingHorizontal}px;display:flex;justify-content:${justify};`;
          }

          html += `<div${fAttrs} style="${cleanStyle(wrapperStyle)}">
            <img src="${ill.url}" style="${cleanStyle(`${widthVal}border-radius:8px;display:block`)}" referrerPolicy="no-referrer" onerror="this.style.display='none'" />
          </div>`;
        } else {
          if (illFormat === 'info') {
            const wrapperStyle = `margin: 4px ${paddingHorizontal}px; display: flex; justify-content: ${justify};`;
            html += `<div${fAttrs} class="i-r" style="${cleanStyle(wrapperStyle)}">
              <img src="${ill.url}" style="${cleanStyle(`${widthVal}border-radius:8px;display:block`)}" referrerPolicy="no-referrer" onerror="this.style.display='none'" />
            </div>`;
          } else if (illFormat === 'secret') {
            const secretBg = getSecretBg(illTabColor);
            const wrapperStyle = `background: ${secretBg}; border-left: 4px solid ${illTabColor}; margin: 4px ${paddingHorizontal}px; border-radius: 4px; display: flex; justify-content: ${justify};`;
            html += `<div${fAttrs} class="s-r" style="${cleanStyle(wrapperStyle)}">
              <img src="${ill.url}" style="${cleanStyle(`${widthVal}border-radius:8px;display:block`)}" referrerPolicy="no-referrer" onerror="this.style.display='none'" />
            </div>`;
          } else {
            const wrapperStyle = `margin: 4px ${paddingHorizontal}px; display: flex; justify-content: ${justify};`;
            html += `<div${fAttrs} style="${cleanStyle(wrapperStyle)}">
              <img src="${ill.url}" style="${cleanStyle(`${widthVal}border-radius:8px;display:block`)}" referrerPolicy="no-referrer" onerror="this.style.display='none'" />
            </div>`;
          }
        }

        // Add Divider if needed
        if (hasDividerBelow) {
          if (isInline) {
            const dividerStyle = `margin:${s(12)}px ${((illFormat === 'info' || illFormat === 'secret') && mergeWithNextOuter) ? `${paddingHorizontal}px` : '0'};background:transparent;border:none;border-top:1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'};height:0;`;
            html += `<hr style="${cleanStyle(dividerStyle)}" class="c-e" />`;
          } else {
            html += `<div class="d-v c-e"></div>`;
          }
        }
      }

      return; // End chunk loop for illustration
    }

    let dividerHtml = '';
    if (hasDividerBelow) {
      const isMainTab = format === 'main' ? 'true' : 'false';
      const isNarrationCharacterTag = log.charId === narrationCharacter ? 'true' : 'false';
      const isCommandFlag = log.isCommand ? 'true' : 'false';
      
      let divAttrs = '';
      if (isFilterEnabled) {
        divAttrs = ` d-t="${shortenId(log.tabId)}" d-c="${shortenId(log.charId)}"`;
        if (isMainTab === 'true') divAttrs += ' d-mt="1"';
        if (isNarrationCharacterTag === 'true') divAttrs += ' d-nc="1"';
        if (isCommandFlag === 'true') divAttrs += ' d-cm="1"';
        divAttrs += ' class="c-e c-dv"';
      } else {
        divAttrs = ' class="c-dv"';
      }

      const borderStyleColor = isDark 
        ? `rgba(255, 255, 255, 0.08)` 
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
      
      let styleStr = `margin-top:${s(marginTopVal)}px;margin-bottom:${s(marginBottomVal)}px;`;
      if (isInline) {
        styleStr += `display:flex;align-items:center;justify-content:stretch;pointer-events:none;`;
        if (isInternalBoxDivider) {
          styleStr += `margin-left:${paddingHorizontal}px;margin-right:${paddingHorizontal}px;padding-left:${paddingHorizontal}px;padding-right:${paddingHorizontal}px;`;
        } else {
          styleStr += `margin-left:0;margin-right:0;padding-left:${paddingHorizontal}px;padding-right:${paddingHorizontal}px;`;
        }
      }
      if (isInternalBoxDivider) {
        const bg = format === 'secret' ? getSecretBg(tabColor) : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)');
        const bLeft = format === 'secret' ? `4px solid ${tabColor}` : `4px solid ${isDark ? '#444' : '#DDD'}`;
        styleStr += `background:${bg};border-left:${bLeft};`;
        if (isFilterEnabled) {
          divAttrs = divAttrs.replace('class="c-e c-dv"', 'class="c-e c-dv c-dv-ib"');
        } else {
          divAttrs = ' class="c-dv c-dv-ib"';
        }
      }

      const dividerInStyle = isInline ? `width:100%;border-bottom:1px solid;border-color:${borderStyleColor};` : `border-color:${borderStyleColor};`;
      dividerHtml = `<div${divAttrs} style="${cleanStyle(styleStr)}"><div class="c-dv-in" style="${cleanStyle(dividerInStyle)}"></div></div>`;
    }

    // Generate blocksAfterHtml early
    let blocksAfterHtml = '';
    if (blocksAfter && blocksAfter.length > 0) {
      blocksAfter.forEach((block: any) => {
        if (block.type === 'image' && isValidUrl(block.url)) {
          const align = block.align || 'center';
          const justify = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start';
          
          let widthStyle = 'max-width:100%;';
          if (block.width) {
            const widthStr = String(block.width);
            widthStyle = widthStr.endsWith('px') || widthStr.endsWith('%') ? `width:${widthStr};` : `width:${widthStr}px;`;
          }
          
          const isMainTab = format === 'main';
          const imgAttrs = isFilterEnabled 
            ? ` d-t="${shortenId(log.tabId)}" d-c="${shortenId(log.charId)}"${isMainTab ? ' d-mt="1"' : ''} class="c-e"`
            : '';
          blocksAfterHtml += `<div${imgAttrs} style="${cleanStyle(`display:flex;justify-content:${justify};margin:10px ${s(15.6)}px`)}">
            <img src="${block.url}" style="${cleanStyle(`${widthStyle}border-radius:8px;display:block`)}" referrerPolicy="no-referrer" onerror="this.style.display='none'" />
          </div>`;
        } else if (block.type === 'bgm' && isValidBgm(block)) {
          const bgmTitle = block.title || '🎧 BGM';
          const parsed = parseYoutubeUrl(block.url, block.useTimestamp);
          const videoId = block.videoId || parsed.videoId || '';
          const startTime = block.startTime || parsed.startTime || 0;
          const safeTitle = bgmTitle.replace(/"/g, '&quot;');
          
          const isMainTab = format === 'main';
          const bgmAttrs = isFilterEnabled 
            ? ` d-t="${shortenId(log.tabId)}" d-c="${shortenId(log.charId)}"${isMainTab ? ' d-mt="1"' : ''} class="c-e"`
            : '';
            
          blocksAfterHtml += `<div${bgmAttrs} style="${cleanStyle(`position:relative;margin-top:0px;margin-bottom:0px;`)}">
            <div class="c-i bgm-center-wrapper" style="display:flex;justify-content:center;align-items:center;width:100%;margin:12px 0;">
              <div class="custom-bgm" data-vid="${videoId}" data-start="${startTime}" data-title="${safeTitle}" onclick="triggerBGM(event, this)">
                <svg class="icon" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> <span>${bgmTitle}</span>
              </div>
            </div>
          </div>`;
        }
      });
    }

    // Combine all contents in this chunk
    let finalHtmlContentPieces = groupedLogs.map((l, i) => {
      let content = l.content;
      if (l.isCommand) {
        content = content.replace(/シークレットダイス\s*\?\?\?/g, 'Secret dice 🎲');
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
        return sanitizeFn ? sanitizeFn(pieceHtml, { ADD_ATTR: ['target', 'style'] }) : pieceHtml;
      });
      return htmlPieces;
    });

    const spacingClass = isNarration ? 's-p-nr' : (format === 'other' ? 's-p' : 's-p-ob');
    let finalHtmlContent = finalHtmlContentPieces.map(pieces => pieces.join(`<div class="${spacingClass}"></div>`)).join(`<div class="${spacingClass}"></div>`);

    if (!isHidden) {
      const hasSpecialDividerAboveAndNoBadge = hasSpecialDividerAbove && !(showTabNames.has(format) && !isPrevSameTab);
      if (showTabNames.has(format) && !isPrevSameTab) {
        const tabName = log.tab;
      const isSecret = format === 'secret';
      const tabColor = tabSet?.color || '#ffd400';
      const tabBg = getSecretBg(tabColor);
      
      const isMainTab = format === 'main' ? 'true' : 'false';
      if (isInline) {
        const fAttrs = isFilterEnabled ? ` d-t="${shortenId(log.tabId)}"${isMainTab === 'true' ? ' d-mt="1"' : ''} class="c-e"` : '';
        const tabMarginTop = hasSpecialDividerAbove ? '0' : `${s(12)}px`;
        const outerStyle = `margin: ${tabMarginTop} ${paddingHorizontal}px ${s(8)}px ${paddingHorizontal}px; display: flex;`;
        const badgeStyle = `background: ${tabBg}; color: ${tabColor}; padding: 2px 10px; border-radius: 4px; font-size: 0.74em; font-weight: bold; border: 1px solid ${tabColor}44; display: inline-block; white-space: nowrap;`;
        html += `<div${fAttrs} style="${cleanStyle(outerStyle)}">
          <div style="${cleanStyle(badgeStyle)}">
            ${tabName}
          </div>
        </div>`;
      } else {
        const fAttrs = isFilterEnabled ? ` d-t="${shortenId(log.tabId)}"${isMainTab === 'true' ? ' d-mt="1"' : ''} class="t-bl c-e"` : ` class="t-bl"`;
        const badgeStyle = hasSpecialDividerAbove ? ' style="margin-top: 0 !important;"' : '';
        html += `<div${fAttrs}${badgeStyle}>
          <div class="t-bd" style="background: ${tabBg}; color: ${tabColor}; border: 1px solid ${tabColor}44;">
            ${tabName}
          </div>
        </div>`;
      }
    }

    if (isInline) {
      const charClass = shortenId(log.charId);
      const avatarStyle = `width:${avatarSize}px;height:${avatarSize}px;flex-shrink:0;background-color:${hideAvatar ? 'transparent' : avatarPlaceholder};border-radius:4px;object-fit:${cropFaceTop ? 'cover' : 'contain'};object-position:${cropFaceTop ? 'top' : 'center'};`;
      const bodyStyle = `flex:1;`;
      const nameStyle = `font-size:0.96em;margin-bottom:${Math.max(4, Math.ceil(textFontSize * (lineHeight >= 1.4 ? 0.3 : 0.5)))}px;display:block;`;
      const contentStyle = `white-space:pre-wrap;word-break:break-all;`;
      const otherContentStyle = `color:${otherTextColor};white-space:pre-wrap;word-break:break-all;`;
      
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

      const fullFilterAttrs = getFilterAttrs(log);
        
      if (isNarration && narrationFormat === 'style3') {
        html += `<div${fullFilterAttrs} style="position:relative;margin-bottom:${itemMarginBottom};margin-top:${itemMarginTop};">`;
        const wrapperStyle = `display:flex;gap:16px;padding:${isPrevNarration ? '0.4em' : `${paddingVertical}px`} ${paddingHorizontal}px ${isNextNarration ? '0.4em' : `${paddingVertical}px`} ${paddingHorizontal}px;align-items:flex-start;`;
        const flatPieces = finalHtmlContentPieces.flat();
        let nameHtml = '';
        if (!log.isContinuation) {
            nameHtml = `<b><span class="${charClass}" style="${cleanStyle(`color:${log.color};font-size:0.96em;`)}">${log.name}:</span></b>`;
        }
        let innerContent = flatPieces.map((piece, pIdx) => {
          const prefix = pIdx > 0 ? `<div style="height:${Math.max(lineHeight * textFontSize, 8)}px;"></div>` : '';
          return `${prefix}<div style="white-space:pre-wrap;word-break:keep-all;overflow-wrap:break-word;font-weight:bold;">${piece}</div>`;
        }).join('');
        
        html += `
        <div style="${cleanStyle(wrapperStyle)}">
          <div style="${cleanStyle(`width:${computedNameWidth}px;flex-shrink:0;text-align:right;`)}">
            ${nameHtml}
          </div>
          <div style="${cleanStyle(`flex:1;min-width:0;line-height:${lineHeight};font-size:${textFontSize}px;`)}">
            ${innerContent}
          </div>
        </div>`;
        if (blocksAfterHtml) {
          html += blocksAfterHtml;
        }
        if (hasDividerBelow) {
          html += dividerHtml;
        }
        html += `</div>`;
      } else if (isNarration) {
        const narrStyle = `padding:${isPrevNarration ? '0.4em' : `${paddingVertical}px`} ${paddingHorizontal}px ${isNextNarration ? '0.4em' : `${paddingVertical}px`} ${paddingHorizontal}px;text-align:${'center'};`;
        html += `<div${fullFilterAttrs} style="position:relative;margin-bottom:${itemMarginBottom};margin-top:${itemMarginTop};">`;
        html += `<div style="${cleanStyle(narrStyle)}">`;
        const flatPieces = finalHtmlContentPieces.flat();
        html += flatPieces.map((piece, pIdx) => {
          const prefix = pIdx > 0 ? `<div class="s-p-ob"></div>` : '';
          return `${prefix}<div style="white-space:pre-wrap;word-break:break-all;"><b>${narrationFormat === 'style2' ? `<i>${piece}</i>` : piece}</b></div>`;
        }).join('');
        html += `</div>`;
        if (blocksAfterHtml) {
          html += blocksAfterHtml;
        }
        if (hasDividerBelow) {
          html += dividerHtml;
        }
        html += `</div>`;
      } else {
        html += `<div${fullFilterAttrs} style="position:relative;margin-bottom:${itemMarginBottom};margin-top:${itemMarginTop};">`;
        if (log.isCommand) {
          const nameHtml = log.name !== 'system' ? `<b class="c-tx ${charClass}">[ ${log.name} ]</b>` : '';
          const marginLeft = log.name !== 'system' ? 'margin-left:8px;' : '';
          const cmdMarginTop = hasSpecialDividerAboveAndNoBadge ? '0' : `${s(8)}px`;
          if (format === 'secret') {
            const tabColor = tabSet?.color || '#ffd400';
            const secretBg = getSecretBg(tabColor);
            html += `<div style="${cleanStyle(`display:flex;align-items:center;flex-wrap:wrap;background:${secretBg};border:1px solid ${borderColor};padding:${paddingVertical}px ${paddingHorizontal}px;border-radius:8px;margin:${cmdMarginTop} ${paddingHorizontal}px ${s(8)}px ${paddingHorizontal}px`)}">${nameHtml}<b><span style="${cleanStyle(`color:${textColor};font-family:'NanumGothicCodingLigature',monospace;${marginLeft}`)}">${finalHtmlContent}</span></b></div>`;
          } else {
            html += `<div style="${cleanStyle(`display:flex;align-items:center;flex-wrap:wrap;background:${commandBg};border:1px solid ${borderColor};padding:${paddingVertical}px ${paddingHorizontal}px;border-radius:8px;margin:${cmdMarginTop} ${paddingHorizontal}px ${s(8)}px ${paddingHorizontal}px`)}">${nameHtml}<b><span style="${cleanStyle(`color:${textColor};font-family:'NanumGothicCodingLigature',monospace;${marginLeft}`)}">${finalHtmlContent}</span></b></div>`;
          }
        } else if (format === 'other') {
          const rowStyle = `padding:${s(2)}px ${paddingHorizontal}px;display:flex;gap:${gapSize / 1.5}px;align-items:baseline;`;
          html += `<div style="${cleanStyle(rowStyle)}">
            <b><span style="${cleanStyle(`flex-shrink:0;font-size:0.96em;color:${otherNameColor}`)}">${log.name}</span></b>
            <div style="${cleanStyle(otherContentStyle)}">${finalHtmlContent}</div>
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
 
          const wrapperStyle = `padding:${paddingVertical}px ${paddingHorizontal}px;background:${infoBg};border-left:4px solid ${borderColor};margin:${infoMargin};border-radius:${infoRadius};${infoBorderTop ? `border-top:${infoBorderTop};` : ''}${infoBorderBottom ? `border-bottom:${infoBorderBottom};` : ''}`;
          html += `<div style="${cleanStyle(wrapperStyle)}">
            <b><span class="${charClass}" style="${cleanStyle(nameStyle)}">${log.name}</span></b>
            <div style="${cleanStyle(contentStyle)}">${finalHtmlContent}</div>
          </div>`;
        } else if (format === 'secret') {
          const tabColor = tabSet?.color || '#ffd400';
          const secretBg = getSecretBg(tabColor);
          const imgTag = img ? `<img src="${img}" style="${cleanStyle(avatarStyle)}" />` : `<div style="${cleanStyle(avatarStyle)}"></div>`;
          const secretMarginTop = hasSpecialDividerAboveAndNoBadge ? '0' : (mergeWithPrev ? '0' : '4px');
          const secretMarginBottomVal = mergeWithNext ? '0' : (hasSpecialDividerBelow ? '0' : '4px');
          const secretMargin = `${secretMarginTop} ${paddingHorizontal}px ${secretMarginBottomVal} ${paddingHorizontal}px`;
          const secretRadius = shouldMergeStyle 
            ? `${(isPrevSameTab && !isSectionStart) ? '0' : '4px'} ${(isPrevSameTab && !isSectionStart) ? '0' : '4px'} ${(isNextSameTab && !isSectionEnd) ? '0' : '4px'} ${(isNextSameTab && !isSectionEnd) ? '0' : '4px'}`
            : '4px';
          const secretBorderTop = shouldMergeStyle && isPrevSameTab && !isSectionStart ? 'none' : '';
          const secretBorderBottom = shouldMergeStyle && isNextSameTab && !isSectionEnd ? 'none' : '';
 
          const borderTopStyle = secretBorderTop ? `border-top:${secretBorderTop};` : '';
          const borderBottomStyle = secretBorderBottom ? `border-bottom:${secretBorderBottom};` : '';

          if (isNarration) {
            const wrapperStyle = `padding:${paddingVertical}px ${paddingHorizontal}px;background:${secretBg};border-left:4px solid ${tabColor};margin:${secretMargin};border-radius:${secretRadius};${borderTopStyle}${borderBottomStyle}`;
            const flatPieces = finalHtmlContentPieces.flat();
            let innerContent = `<div style="${cleanStyle(`text-align:${'center'};font-weight:bold;font-style:${narrationFormat === 'style2' ? 'italic' : 'normal'};color:${textColor};width:100%;`)}">`;
            innerContent += flatPieces.map((piece, pIdx) => {
              const prefix = pIdx > 0 ? `<div style="height:${Math.max(lineHeight * textFontSize, 8)}px;"></div>` : '';
              return `${prefix}<div style="white-space:pre-wrap;word-break:keep-all;overflow-wrap:break-word;">${piece}</div>`;
            }).join('');
            innerContent += `</div>`;
            html += `
            <div style="${cleanStyle(wrapperStyle)}">
              ${innerContent}
            </div>`;
          } else {
            const wrapperStyle = `display:flex;gap:${gapSize}px;padding:${paddingVertical}px ${paddingHorizontal}px;align-items:flex-start;background:${secretBg};border-left:4px solid ${tabColor};margin:${secretMargin};border-radius:${secretRadius};${borderTopStyle}${borderBottomStyle}`;
            html += `
            <div style="${cleanStyle(wrapperStyle)}">
              ${imgTag}
              <div style="${cleanStyle(bodyStyle)}">
                <b><span class="${charClass}" style="${cleanStyle(nameStyle)}">${log.name}</span></b>
                <div style="${cleanStyle(contentStyle)}">${finalHtmlContent}</div>
              </div>
            </div>`;
          }
        } else {
          const avatarHtml = img 
            ? `<img src="${img}" style="${cleanStyle(avatarStyle)}" />` 
            : `<div style="${cleanStyle(avatarStyle)}"></div>`;
          
          const wrapperStyle = `display:flex;gap:${gapSize}px;padding:${paddingVertical}px ${paddingHorizontal}px;align-items:flex-start;`;
          html += `
            <div style="${cleanStyle(wrapperStyle)}">
              ${avatarHtml}
              <div style="${cleanStyle(bodyStyle)}">
                <b><span class="${charClass}" style="${cleanStyle(nameStyle)}">${log.name}</span></b>
                <div style="${cleanStyle(contentStyle)}">${finalHtmlContent}</div>
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
      const charClass = shortenId(log.charId);
      const isSectionStart = !prevVisibleChunk || hasBlockBefore;
      const isSectionEnd = !nextVisibleChunk || isNextSameTab === false || hasBlockAfter;
      let mb = '';
      let mt = '';

      if (log.isCommand || format === 'secret') {
        mb = isNextSameTab && !hasBlockAfter && shouldMergeStyle ? 'c-mb0' : 'c-mb-c';
      } else if (isNarration) {
        mt = isPrevNarration ? 'c-mt0' : 'c-mt-nr';
        mb = isNextNarration ? 'c-mb0' : 'c-mb-nr';
      } else {
        mt = isPrevSameTab && !hasBlockBefore && shouldMergeStyle ? 'c-mt0' : 'c-mt-n';
        mb = isNextSameTab && !hasBlockAfter && shouldMergeStyle ? 'c-mb0' : 'c-mb-n';
      }

      const cl = [mb, mt].filter(Boolean).join(' ');
      const clStr = `c-i${cl ? ` ${cl}` : ''}${hasSpecialDividerAboveAndNoBadge ? ' c-mt-f' : ''}`;
      
      const fullFilterAttrs = getFilterAttrs(log, clStr);

      html += `<div${fullFilterAttrs}>`;

      if (log.isCommand) {
        const nameHtml = log.name !== 'system' ? `<b class="c-tx ${charClass}">[ ${log.name} ]</b> ` : '';
        const marginLeft = log.name !== 'system' ? 'margin-left: 8px;' : '';
        if (format === 'secret') {
          const tabColor = tabSet?.color || '#ffd400';
          const secretBg = getSecretBg(tabColor);
          html += `<div class="c-bx" style="display: flex; align-items: center; flex-wrap: wrap; background: ${secretBg}; border: 1px solid ${borderColor}; margin: ${s(8)}px ${paddingHorizontal}px; border-radius: 8px;">${nameHtml}<span class="c-tx" style="${marginLeft}">${finalHtmlContent}</span></div>`;
        } else {
          html += `<div class="c-bx" style="display: flex; align-items: center; flex-wrap: wrap;">${nameHtml}<span class="c-tx" style="${marginLeft}">${finalHtmlContent}</span></div>`;
        }
      } else if (isNarration && narrationFormat === 'style3') {
        const flatPieces = finalHtmlContentPieces.flat();
        let nameHtml = '';
        if (!log.isContinuation) {
            nameHtml = `<span class="m-nm ${charClass}">${log.name}:</span>`;
        }
        html += `<div class="m-r no-avatar-grid">${nameHtml}<div class="m-b"><div class="m-c" style="font-weight:bold;">${flatPieces.map((piece, pIdx) => {
          const prefix = pIdx > 0 ? `<div class="s-p-ob"></div>` : '';
          return `${prefix}<div style="white-space: pre-wrap; word-break: keep-all; overflow-wrap: break-word;">${piece}</div>`;
        }).join('')}</div></div></div>`;
      } else if (isNarration) {
        const flatPieces = finalHtmlContentPieces.flat();
        html += `<div class="n-r" style="padding: ${isPrevNarration ? '0.4em' : `${paddingVertical}px`} ${paddingHorizontal}px ${isNextNarration ? '0.4em' : `${paddingVertical}px`} ${paddingHorizontal}px;">`;
        html += flatPieces.map((piece, pIdx) => {
          const prefix = pIdx > 0 ? `<div class="s-p-ob"></div>` : '';
          return `${prefix}<div style="white-space: pre-wrap; word-break: keep-all; overflow-wrap: break-word;">${piece}</div>`;
        }).join('');
        html += `</div>`;
      } else if (format === 'other') {
        html += `<div class="o-r" style="padding-top: ${s(2)}px; padding-bottom: ${s(2)}px;"><span class="o-nm" style="color: ${otherNameColor}">${log.name}</span><div class="o-c">${finalHtmlContent}</div></div>`;
      } else if (format === 'info') {
        const tZ = isPrevSameTab && !isSectionStart, bZ = isNextSameTab && !isSectionEnd;
        const rad = shouldMergeStyle ? `${tZ ? 0 : 4}px ${tZ ? 0 : 4}px ${bZ ? 0 : 4}px ${bZ ? 0 : 4}px` : '4px';
        const st = [
          shouldMergeStyle ? `margin: 0 ${paddingHorizontal}px;` : '',
          rad !== '4px' ? `border-radius: ${rad};` : '',
          shouldMergeStyle && tZ ? 'border-top: none;' : '',
          shouldMergeStyle && bZ ? 'border-bottom: none;' : ''
        ].filter(Boolean).join(' ');

        html += `<div class="i-r"${st ? ` style="${st}"` : ''}><span class="m-nm ${charClass}">${log.name}</span><div class="m-c">${finalHtmlContent}</div></div>`;
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

        if (isNarration && narrationFormat === 'style3') {
          const flatPieces = finalHtmlContentPieces.flat();
          let nameHtml = '';
          if (!log.isContinuation) {
              nameHtml = `<span class="m-nm ${charClass}">${log.name}:</span>`;
          }
          html += `<div class="s-r no-avatar-grid" style="${st}">${nameHtml}<div class="m-b"><div class="m-c" style="font-weight:bold;">${flatPieces.map((piece, pIdx) => {
            const prefix = pIdx > 0 ? `<div class="s-p-ob"></div>` : '';
            return `${prefix}<div style="white-space: pre-wrap; word-break: keep-all; overflow-wrap: break-word;">${piece}</div>`;
          }).join('')}</div></div></div>`;
        } else if (isNarration) {
          const flatPieces = finalHtmlContentPieces.flat();
          html += `<div class="s-r" style="${st} padding:${paddingVertical}px ${paddingHorizontal}px;">`;
          html += `<div style="text-align:${'center'};font-weight:bold;font-style:${narrationFormat === 'style2' ? 'italic' : 'normal'};color:${textColor};width:100%;">`;
          html += flatPieces.map((piece, pIdx) => {
            const prefix = pIdx > 0 ? `<div class="s-p-ob"></div>` : '';
            return `${prefix}<div style="white-space: pre-wrap; word-break: keep-all; overflow-wrap: break-word;">${piece}</div>`;
          }).join('');
          html += `</div></div>`;
        } else if (hideAllAvatars) {
          html += `<div class="s-r no-avatar-grid" style="${st}"><span class="m-nm ${charClass}">${log.name}:</span><div class="m-b"><div class="m-c">${finalHtmlContent}</div></div></div>`;
        } else {
          const avatarHtml = img ? `<img src="${img}" class="m-a"${avSt ? ` style="${avSt}"` : ''} />` : `<div class="m-a"${avSt ? ` style="${avSt}"` : ''}></div>`;
          html += `<div class="s-r" style="${st}">${avatarHtml}<div class="m-b"><span class="m-nm ${charClass}">${log.name}</span><div class="m-c">${finalHtmlContent}</div></div></div>`;
        }
      } else {
        const avSt = hideAvatar ? 'background-color: transparent;' : '';
        if (hideAllAvatars) {
          html += `<div class="m-r no-avatar-grid"><span class="m-nm ${charClass}">${log.name}:</span><div class="m-b"><div class="m-c">${finalHtmlContent}</div></div></div>`;
        } else {
          const avatarHtml = img ? `<img src="${img}" class="m-a"${avSt ? ` style="${avSt}"` : ''} />` : `<div class="m-a"${avSt ? ` style="${avSt}"` : ''}></div>`;
          html += `<div class="m-r">${avatarHtml}<div class="m-b"><span class="m-nm ${charClass}">${log.name}</span><div class="m-c">${finalHtmlContent}</div></div></div>`;
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

  const hasValidBgm = (originalLogs || []).some((l: any) => l.isBgmBlock || (insertedBlocks[l.id]?.some((b: any) => b.type === 'bgm' && isValidBgm(b))));

  const bgmPlayerCSS = hasValidBgm ? `
    .bgm-center-wrapper { display: flex; justify-content: center; margin: 16px 0; }
    .custom-bgm { cursor: pointer; display: inline-flex; align-items: center; gap: 10px; font-size: 13px; background: rgba(255, 255, 255, 0.05); padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.1); color: #AAAAAA; user-select: none; transition: 0.2s; }
    .custom-bgm span { text-align: left; word-break: keep-all; overflow-wrap: break-word; line-height: 1.4; }
    .custom-bgm:hover { background: rgba(255, 255, 255, 0.1); color: #EEEEEE; }
    .custom-bgm.active { border-color: #EEEEEE; color: #EEEEEE; background: rgba(255, 255, 255, 0.15); }
    .custom-bgm svg { width: 12px; height: 12px; fill: currentColor; flex-shrink: 0; }

    .global-wrapper { position: fixed !important; bottom: 20px !important; right: 20px !important; z-index: 1000000 !important; display: flex; flex-direction: column; align-items: flex-end; justify-content: flex-end; }
    .gc-card { position: absolute; bottom: 70px; right: 0; width: 260px; background: rgba(30, 30, 30, 0.98); border: 1px solid #444; border-radius: 8px; box-sizing: border-box; display: flex; flex-direction: column; gap: 8px; padding: 12px; opacity: 0; pointer-events: none; transform: translateY(15px); box-shadow: 0 10px 30px rgba(0,0,0,0.5); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); overflow: hidden; }
    .global-wrapper.expanded .gc-card { opacity: 1; pointer-events: auto; transform: translateY(0); }
    .yt-container { width: 100%; height: 120px; max-height: 120px; background: #000; border-radius: 6px; overflow: hidden; flex-shrink: 0; border: 1px solid rgba(255, 255, 255, 0.1); position: relative; }
    .yt-container iframe { position: absolute; inset: 0; width: 100% !important; height: 100% !important; pointer-events: auto; border: none; display: block; transform: scale(1.5); transform-origin: center center; }
    .gc-info-ctrl { display: flex; flex-direction: column; justify-content: center; gap: 6px; width: 100%; box-sizing: border-box; font-family: 'Noto Sans KR', sans-serif; }
    .cd-btn { width: 56px; height: 56px; border-radius: 50%; flex-shrink: 0; background: conic-gradient(from 0deg, #555, #999, #eee, #999, #555); border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 4px 8px rgba(0,0,0,0.5); cursor: pointer; position: relative; transition: 0.3s; }
    .cd-btn::after { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 16px; height: 16px; background: ${theme === 'dark' ? darkBgColor : lightBgColor}; border-radius: 50%; }
    .cd-btn:hover { box-shadow: 0 6px 12px rgba(0,0,0,0.8); }
    .global-wrapper.is-playing .cd-btn { animation: gc-spin 4s linear infinite; }
    @keyframes gc-spin { 100% { transform: rotate(360deg); } }
    .gc-row-1 { display: flex; justify-content: space-between; align-items: center; width: 100%; box-sizing: border-box; }
    .gc-title { font-size: 12px; font-weight: bold; color: #EEEEEE; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px; }
    .gc-link { font-size: 11px; color: #777; text-decoration: none; transition: 0.2s; }
    .gc-link:hover { color: #aaa; text-decoration: underline; }
    .gc-link.disabled { pointer-events: none; opacity: 0.4; }
    .gc-row-2 { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #aaa; width: 100%; box-sizing: border-box; }
    .gc-btn { background: none; border: none; color: #666; cursor: pointer; padding: 2px; transition: 0.2s; display: flex; align-items: center; justify-content: center; width: 18px; height: 18px; flex-shrink: 0; outline: none; }
    .gc-btn svg { width: 14px; height: 14px; fill: currentColor; }
    .gc-btn:hover { color: #AAA; }
    .gc-btn.active { color: #EEE; }
    .gc-btn-loop.active { color: #EEEEEE; filter: drop-shadow(0 0 2px rgba(255,255,255,0.4)); }
    .gc-progress-bar { flex-grow: 1; min-width: 0; cursor: pointer; height: 3px; border-radius: 2px; appearance: none; background: #444; outline: none; transition: 0.2s; }
    .gc-progress-bar:hover { height: 5px; }
    .gc-progress-bar::-webkit-slider-thumb { appearance: none; width: 10px; height: 10px; border-radius: 50%; background: #999; cursor: pointer; transition: 0.2s; }
    .gc-progress-bar:hover::-webkit-slider-thumb { background: #EEEEEE; }
    .time-text { flex-shrink: 0; min-width: 26px; text-align: center; font-size: 10px; font-family: monospace; white-space: nowrap; }
  ` : '';

  const bgmPlayerHtml = hasValidBgm ? `
    <div id="global-controller" class="global-wrapper">
      <div class="gc-card" id="gc-card">
        <div class="yt-container" id="yt-player-visible"></div>
        <div class="gc-info-ctrl">
          <div class="gc-row-1">
            <div class="gc-title" id="gc-title">선택된 BGM 없음</div>
            <a id="gc-link" class="gc-link disabled" href="#" target="_blank" title="새 탭에서 열기" onclick="return gcLinkHasTarget();">⧉ Open Tab</a>
          </div>
          <div class="gc-row-2">
            <button class="gc-btn" id="btn-playpause" onclick="togglePlayPause()" title="재생/일시정지">
              <svg id="icon-play" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              <svg id="icon-pause" viewBox="0 0 24 24" style="display:none;"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            </button>
            <span class="time-text" id="gc-time-curr">0:00</span>
            <input type="range" class="gc-progress-bar" id="gc-progress" min="0" max="100" value="0">
            <span class="time-text" id="gc-time-total">0:00</span>
            <button class="gc-btn gc-btn-loop active" id="btn-loop" onclick="toggleLoop()" title="반복 재생">
              <svg viewBox="0 0 24 24"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>
            </button>
          </div>
        </div>
      </div>
      <div class="cd-btn" id="cd-trigger" onclick="toggleCard(event)" title="컨트롤러 열기/닫기"></div>
    </div>

    <script src="https://www.youtube.com/iframe_api"></script>
    <script>
      var wrapper = document.getElementById('global-controller');

      function toggleCard(e) {
        if (e) e.stopPropagation();
        if (wrapper) wrapper.classList.toggle('expanded');
      }

      document.addEventListener('click', function(e) {
        if (wrapper && !wrapper.contains(e.target)) {
          wrapper.classList.remove('expanded');
        }
      });
      document.addEventListener('DOMContentLoaded', function() {
        if (wrapper) document.body.appendChild(wrapper);
      });

      var ytPlayer;
      var isApiReady = false;
      var isLooping = true;
      var progressInterval;
      var activeTriggerBtn = null;
      var isDraggingProgress = false;
      var currentStartSec = 0;

      function onYouTubeIframeAPIReady() {
        ytPlayer = new YT.Player('yt-player-visible', {
          playerVars: { 'autoplay': 0, 'controls': 0, 'playsinline': 1, 'rel': 0 },
          events: {
            'onReady': function() { isApiReady = true; },
            'onStateChange': onPlayerStateChange
          }
        });
      }

      function onPlayerStateChange(event) {
        var playBtn = document.getElementById('btn-playpause'), iconPlay = document.getElementById('icon-play'), iconPause = document.getElementById('icon-pause');
        if (event.data === YT.PlayerState.PLAYING) {
          if (iconPlay) iconPlay.style.display = 'none'; 
          if (iconPause) iconPause.style.display = 'block';
          if (playBtn) playBtn.classList.add('active'); 
          if (wrapper) wrapper.classList.add('is-playing');
          if (activeTriggerBtn) {
            activeTriggerBtn.classList.add('active');
            var iconSpan = activeTriggerBtn.querySelector('svg');
            if (iconSpan) iconSpan.outerHTML = '<svg class="icon" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
          }
          startProgressTimer();
        } else {
          if (iconPlay) iconPlay.style.display = 'block'; 
          if (iconPause) iconPause.style.display = 'none';
          if (playBtn) playBtn.classList.remove('active'); 
          if (wrapper) wrapper.classList.remove('is-playing');
          stopProgressTimer();
          if (event.data === YT.PlayerState.ENDED && isLooping) {
            if (ytPlayer && ytPlayer.seekTo) {
              ytPlayer.seekTo(currentStartSec, true); 
              ytPlayer.playVideo(); 
            }
            return;
          }
          if (activeTriggerBtn) {
            activeTriggerBtn.classList.remove('active');
            var iconSpan = activeTriggerBtn.querySelector('svg');
            if (iconSpan) iconSpan.outerHTML = '<svg class="icon" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
          }
        }
      }

      function gcLinkHasTarget() { 
        var gcLink = document.getElementById('gc-link');
        return gcLink ? !gcLink.classList.contains('disabled') : false; 
      }

      function triggerBGM(e, btn) {
        if (e) e.stopPropagation();
        if (!isApiReady) { alert("유튜브 API 로딩중입니다."); return; }

        var vidId = btn.getAttribute('data-vid');
        var startSec = parseInt(btn.getAttribute('data-start')) || 0;
        var title = btn.getAttribute('data-title');
        
        if (wrapper) wrapper.classList.add('expanded');

        if (activeTriggerBtn === btn) {
          togglePlayPause();
          return;
        }

        if (activeTriggerBtn) {
          activeTriggerBtn.classList.remove('active');
          var iconSpan = activeTriggerBtn.querySelector('svg');
          if (iconSpan) iconSpan.outerHTML = '<svg class="icon" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
        }
        activeTriggerBtn = btn;
        activeTriggerBtn.classList.add('active');
        currentStartSec = startSec;
        
        var tElem = document.getElementById('gc-title');
        var lElem = document.getElementById('gc-link');
        var cdElem = document.getElementById('cd-trigger');

        if (tElem) tElem.innerText = title;
        if (lElem) {
          lElem.href = 'https://www.youtube.com/watch?v=' + vidId + (startSec ? '&t=' + startSec + 's' : '');
          lElem.classList.remove('disabled');
        }
        if (cdElem) cdElem.setAttribute('title', title);
        
        if (ytPlayer && ytPlayer.loadVideoById) {
          ytPlayer.loadVideoById({ videoId: vidId, startSeconds: startSec });
        }
      }

      function togglePlayPause() {
        if (!isApiReady || !activeTriggerBtn) return;
        if (ytPlayer && ytPlayer.getPlayerState) {
          if (ytPlayer.getPlayerState() === YT.PlayerState.PLAYING) ytPlayer.pauseVideo();
          else ytPlayer.playVideo();
        }
      }

      function toggleLoop() {
        isLooping = !isLooping;
        var loopBtn = document.getElementById('btn-loop');
        if (loopBtn) {
          if (isLooping) loopBtn.classList.add('active');
          else loopBtn.classList.remove('active');
        }
      }

      var progressRange = document.getElementById('gc-progress');
      var timeCurr = document.getElementById('gc-time-curr');
      var timeTotal = document.getElementById('gc-time-total');

      function formatTime(seconds) {
        var m = Math.floor(seconds / 60);
        var s = Math.floor(seconds % 60);
        return m + ':' + (s < 10 ? '0' : '') + s;
      }

      function startProgressTimer() {
        if (progressInterval) clearInterval(progressInterval);
        progressInterval = setInterval(function() {
          if (!isDraggingProgress && isApiReady && ytPlayer && ytPlayer.getDuration) {
            var curr = ytPlayer.getCurrentTime();
            var duration = ytPlayer.getDuration();
            if (duration > 0) {
              if (progressRange) progressRange.value = (curr / duration) * 100;
              if (timeCurr) timeCurr.innerText = formatTime(curr);
              if (timeTotal) timeTotal.innerText = formatTime(duration);
            }
          }
        }, 500);
      }

      function stopProgressTimer() { clearInterval(progressInterval); }

      if (progressRange) {
        progressRange.addEventListener('mousedown', function() { isDraggingProgress = true; });
        progressRange.addEventListener('touchstart', function() { isDraggingProgress = true; });
        progressRange.addEventListener('mouseup', function(e) {
          isDraggingProgress = false;
        });
        progressRange.addEventListener('touchend', function(e) {
          isDraggingProgress = false;
        });
        progressRange.addEventListener('input', function(e) {
          isDraggingProgress = true;
          if (timeCurr && isApiReady && ytPlayer && ytPlayer.getDuration) {
            var newTime = (e.target.value / 100) * ytPlayer.getDuration();
            timeCurr.innerText = formatTime(newTime);
          }
        });
        progressRange.addEventListener('change', function(e) {
          if (isApiReady && ytPlayer && ytPlayer.getDuration) {
            var newTime = (e.target.value / 100) * ytPlayer.getDuration();
            ytPlayer.seekTo(newTime, true);
          }
        });
      }
    </script>
  ` : '';

  const finalHtml = `
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
        ${bgmPlayerCSS}
        ${textResetCSS}
        ${dynamicColorsCss}
        .c-tx { font-family: 'NanumGothicCodingLigature', monospace; font-weight: bold; line-height: 1.6; }
        .c-ct * { box-sizing: border-box; min-width: 0; }
      </style>` : `<style>${css}\n${bgmPlayerCSS}</style>`}
    </head>
    <body>
      <div class="c-mc"${isInline ? ` style="${cleanStyle(`background-color: ${bgColor}; margin: 0; padding: 0`)}"` : ''}>
        ${filterBarHtml}
        ${isInline ? `<div class="c-ct" style="${cleanStyle(`width: 100%; max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; ${fontFamily !== '(폰트 적용X)' ? `font-family: ${fontValue};` : ''} background: ${bgColor}; color: ${textColor}; line-height: ${lineHeight}; letter-spacing: ${letterSpacing === 0 ? 'normal' : `${letterSpacing}px`}; padding: 20px 0; font-size: ${fontSize}px; overflow-x: hidden`)}">\n${html}\n</div>` : `<div class="c-ct">\n${html}\n</div>`}
      </div>
      ${filterBarScript}
      ${bgmPlayerHtml}
    </body>
    </html>
  `;

  return minifyHtml(finalHtml);
};

const minifyHtml = (html: string): string => {
  let minified = html;
  
  // 1. 주석 제거
  minified = minified.replace(/<!--[\s\S]*?-->/g, '');

  // 2. 태그와 태그 사이의 공백(줄바꿈 포함) 제거
  minified = minified.replace(/>\s+</g, '><');

  // 3. CSS 축소 (style="..." 속성 내부의 ': ' 및 '; ' 등을 ':' 및 ';'로 치환)
  minified = minified.replace(/style="([^"]*)"/gi, (match, p1) => {
    const cleaned = p1
      .replace(/:\s+/g, ':')
      .replace(/;\s+/g, ';')
      .trim();
    return `style="${cleaned}"`;
  });

  // 4. HTML 클래스명 사이의 다중 공백 단일화
  minified = minified.replace(/class="([^"]*)"/gi, (match, p1) => {
    const cleaned = p1.replace(/\s+/g, ' ').trim();
    return `class="${cleaned}"`;
  });

  return minified.trim();
};
