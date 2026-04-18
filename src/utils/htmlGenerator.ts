import { LogEntry, CharSetting, TabSetting } from '../types';
import { cn, r, linkify } from '../utils';
import DOMPurify from 'dompurify';

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
  fontSize: number,
  fontFamily: string,
  disableOtherColor: boolean,
  hideEmptyAvatars: boolean,
  narrationCharacter: string | null,
  insertedImages: Record<string, any[]>,
  mergeTabStyles: Set<string>,
  showTabNames: Set<string>,
  pageTitle: string,
  fontValue: string
) => {
  const isDark = theme === 'dark';
  const bgColor = isDark ? '#1a1a1a' : '#ffffff';
  const textColor = isDark ? '#e0e0e0' : '#1a1a1a';
  const otherTextColor = isDark ? '#9e9e9e' : '#757575';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const infoBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
  const avatarPlaceholder = isDark ? '#333333' : '#f0f0f0';

  const avatarSize = r(fontSize * 3);
  const nameSize = r(fontSize * 0.93);
  const gapSize = r(fontSize * 0.8);
  const paddingSize = r(fontSize * 0.7);

  const getSecretBg = (tabColor?: string) => {
    if (!tabColor) return isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
    return isDark ? `${tabColor}15` : `${tabColor}10`;
  };

  const css = `
    * { box-sizing: border-box; }
    body { background: ${bgColor}; color: ${textColor}; margin: 0; padding: 20px 0; overflow-x: hidden; }
    .log-container { 
      width: 100%; maxWidth: 800px; margin: 0 auto; 
      ${fontFamily !== '(폰트 적용X)' ? `font-family: ${fontValue};` : ''}
      font-size: ${fontSize}px;
      line-height: 1.6;
    }
    
    .tab-name-block {
      margin: 12px ${r(paddingSize * 1.3)}px 4px ${r(paddingSize * 1.3)}px;
      display: flex;
    }
    .tab-name-badge {
      padding: 2px 10px; border-radius: 4px; font-size: 0.8em; font-weight: bold;
    }

    .log-item { display: flex; flex-direction: column; }
    
    /* Main Format */
    .main-row { 
      display: flex; gap: ${gapSize}px; padding: ${paddingSize}px ${r(paddingSize * 1.3)}px; align-items: flex-start;
    }
    .main-row.continuation { padding-top: 2px; }
    .main-avatar { 
      width: ${avatarSize}px; height: ${avatarSize}px; flex-shrink: 0; 
      background-color: ${avatarPlaceholder}; border-radius: 4px;
      object-fit: contain;
    }
    .main-body { flex-grow: 1; line-height: 1.5; }
    .main-name { font-weight: bold; font-size: 0.93em; margin-bottom: 2px; display: block; }
    .main-content { font-size: 1em; color: ${textColor}; white-space: pre-wrap; word-break: break-all; }

    /* Other Format */
    .other-row { 
      padding: ${r(paddingSize / 3)}px ${r(paddingSize * 1.3)}px; 
      display: flex;
      gap: ${r(gapSize / 1.5)}px;
      align-items: baseline;
    }
    .other-name { font-weight: bold; flex-shrink: 0; font-size: 0.93em; }
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
    .command-text { font-family: 'NanumGothicCodingLigature', monospace; color: ${textColor}; font-weight: bold; line-height: 1.6; }

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
    const tabSet = tabSettings[log.tabId];
    const format = tabSet?.format || 'main';
    const char = charSettings[log.charId];
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

    const isNarration = log.charId === narrationCharacter && format === 'main';
    const isPrevNarration = idx > 0 && filteredLogs[idx - 1].charId === narrationCharacter && (tabSettings[filteredLogs[idx - 1].tabId]?.format || 'main') === 'main';
    const isNextNarration = idx < filteredLogs.length - 1 && filteredLogs[idx + 1].charId === narrationCharacter && (tabSettings[filteredLogs[idx + 1].tabId]?.format || 'main') === 'main';

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
        // We match by name for system messages if needed, or modify to support charId if known
        const charIds = Object.keys(charSettings).filter(id => charSettings[id].name === p1.trim());
        const matchedChar = charIds.length > 0 ? charSettings[charIds[0]] : null;
        if (matchedChar) {
          return `<span style="color: ${matchedChar.color};">${match}</span>`;
        }
        return match;
      });
    }
    
    finalHtmlContent = DOMPurify.sanitize(finalHtmlContent, { ADD_ATTR: ['target'] });

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
        const nameHtml = log.name !== 'system' ? `<span style="color: ${color}; font-family: 'NanumGothicCodingLigature', monospace; font-weight: bold;">[ ${log.name} ]</span> ` : '';
        const marginLeft = log.name !== 'system' ? 'margin-left: 8px;' : '';
        if (format === 'secret') {
          const tabColor = tabSet?.color || '#ffd400';
          const secretBg = getSecretBg(tabColor);
          html += `<div style="background: ${secretBg}; border: 1px solid ${borderColor}; padding: ${paddingSize}px ${r(paddingSize * 1.3)}px; border-radius: 8px; margin: 8px ${r(paddingSize * 1.3)}px;">${nameHtml}<span style="color: ${textColor}; font-family: 'NanumGothicCodingLigature', monospace; font-weight: bold; line-height: 1.6; ${marginLeft}">${finalHtmlContent}</span></div>`;
        } else {
          html += `<div style="background: rgba(0,0,0,0.1); border: 1px solid ${borderColor}; padding: ${paddingSize}px ${r(paddingSize * 1.3)}px; border-radius: 8px; margin: 8px ${r(paddingSize * 1.3)}px;">${nameHtml}<span style="color: ${textColor}; font-family: 'NanumGothicCodingLigature', monospace; font-weight: bold; line-height: 1.6; ${marginLeft}">${finalHtmlContent}</span></div>`;
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
        const infoBorderTop = shouldMergeStyle && isPrevSameTab && !isSectionStart ? 'border-top: none;' : '';
        const infoBorderBottom = shouldMergeStyle && isNextSameTab && !isSectionEnd ? 'border-bottom: none;' : '';

        html += `<div style="padding: ${r(paddingSize * 1.3)}px ${r(paddingSize * 1.6)}px; background: ${infoBg}; border-left: 4px solid ${borderColor}; margin: ${infoMargin}; border-radius: ${infoRadius}; ${infoBorderTop} ${infoBorderBottom}">
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
          html += `<div class="command-box" style="background: ${secretBg};">${nameHtml}<span class="command-text" style="${marginLeft}">${finalHtmlContent}</span></div>`;
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
        const infoBorderTop = shouldMergeStyle && isPrevSameTab && !isSectionStart ? 'border-top: none;' : '';
        const infoBorderBottom = shouldMergeStyle && isNextSameTab && !isSectionEnd ? 'border-bottom: none;' : '';

        html += `<div class="info-row" style="margin: ${infoMargin}; border-radius: ${infoRadius}; ${infoBorderTop} ${infoBorderBottom}">
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
      <link href="https://hangeul.pstatic.net/hangeul_static/css/nanum-gothic-coding.css" rel="stylesheet">
      ${isInline ? '' : `<style>${css}</style>`}
    </head>
    <body style="margin: 0;">
      ${isInline ? html : `<div class="log-container">\n${html}\n</div>`}
    </body>
    </html>
  `;
};
