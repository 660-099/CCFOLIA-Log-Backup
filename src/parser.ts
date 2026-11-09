import { LogEntry, CharSetting, TabSetting, TabFormat } from './types';
import { isAppProjectJson } from './utils/fileValidation';

export interface ParseLogOptions {
  unifySameNameChars?: boolean;
}

export interface MultiColorCharInfo {
  name: string;
  colors: string[];
  lastColor: string;
}

const rgbToHex = (colorStr: string) => {
  if (!colorStr) return '';
  if (colorStr.startsWith('#')) return colorStr;
  const match = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return '';
  return '#' + match.slice(1).map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
};

import { createBlobUrl } from './utils/blobStore';

export const parseLogFile = async (
  file: File, 
  uploadMode: 'easy' | 'high_quality' = 'high_quality',
  options?: ParseLogOptions
) => {
  const text = await file.text();

  const newLogs: LogEntry[] = [];
  const newChars: Record<string, CharSetting> = {};
  const newCharOrder: string[] = [];
  const newTabs: Record<string, TabSetting> = {};
  const newTabOrder: string[] = [];
  const colorsFound = new Set<string>();

  let tabCounter = 0;
  let charCounter = 0;
  const fallbackTabIds = new Map<string, string>();
  const fallbackCharIds = new Map<string, string>();
  let multiColorChars: MultiColorCharInfo[] = [];

  // Check if JSON
  if (file.name.endsWith('.json') || file.type === 'application/json') {
    let data;
    try {
      data = JSON.parse(text);
    } catch (e: any) {
      console.error("Invalid JSON file", e);
      throw new Error("파일 형식이 올바르지 않거나 손상된 JSON입니다. 코코포리아에서 올바르게 추출했는지 확인해주세요.");
    }

    if (isAppProjectJson(data)) {
      throw new Error("프로젝트 백업 파일(.json)은 '프로젝트 파일 관리'에서 불러와주세요.");
    }

    if (!data || !Array.isArray(data.messages)) {
      throw new Error("올바른 코코포리아 신버전 JSON 파일이 아닙니다.");
    }

    const messages = data.messages || [];
    const imagesDict = data.images || {};

    const hashToShortId = new Map<string, string>();
    let imgCounter = 1;
    Object.keys(imagesDict).sort().forEach(hash => {
        hashToShortId.set(hash, `img_${imgCounter.toString().padStart(3, '0')}`);
        imgCounter++;
    });

    // Extract root channels/tabs definitions if available in JSON
    const channelMap = new Map<string, { name: string; format?: TabFormat }>();
    if (Array.isArray(data.channels)) {
      data.channels.forEach((c: any) => {
        if (!c) return;
        const id = String(c.id ?? c.channel ?? c.channelId ?? '').trim();
        const name = String(c.name ?? c.channelName ?? c.tabName ?? '').trim();
        if (id && name) channelMap.set(id, { name, format: c.format || c.type });
      });
    } else if (data.channels && typeof data.channels === 'object') {
      Object.entries(data.channels).forEach(([k, v]: [string, any]) => {
        if (typeof v === 'string') channelMap.set(k.trim(), { name: v.trim() });
        else if (v && typeof v === 'object') channelMap.set(k.trim(), { name: String(v.name || '').trim(), format: v.format || v.type });
      });
    }
    if (Array.isArray(data.tabs)) {
      data.tabs.forEach((t: any) => {
        if (!t) return;
        const id = String(t.id ?? t.tabId ?? t.name ?? '').trim();
        const name = String(t.name ?? t.tabName ?? '').trim();
        if (id && name) channelMap.set(id, { name, format: t.format || t.type });
      });
    } else if (data.tabs && typeof data.tabs === 'object') {
      Object.entries(data.tabs).forEach(([k, v]: [string, any]) => {
        if (typeof v === 'string') channelMap.set(k.trim(), { name: v.trim() });
        else if (v && typeof v === 'object') channelMap.set(k.trim(), { name: String(v.name || '').trim(), format: v.format || v.type });
      });
    }

    const charIdentityMap = new Map<string, string>();
    const nameToColors = new Map<string, string[]>();
    const unifySameNameChars = !!options?.unifySameNameChars;

    const isSecretKeyword = (s: string) => 
      s.includes('secret') || s.includes('비밀') || s.includes('시크릿') || s.includes('private') || s.includes('귓속말');
    const isInfoKeyword = (s: string) => 
      s.includes('info') || s.includes('정보');
    const isOtherKeyword = (s: string) => 
      s.includes('other') || s.includes('잡담');

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const color = msg.color ? msg.color.toUpperCase() : '#888888';
      if (color && color !== '#000000') colorsFound.add(color);

      const channelIdRaw = msg.channel ?? msg.channelId ?? msg.tabId;
      const channelIdStr = (channelIdRaw !== undefined && channelIdRaw !== null) ? String(channelIdRaw).trim() : '';
      const channelObj = channelIdStr ? channelMap.get(channelIdStr) : undefined;

      const rawTabName = msg.channelName || msg.tabName || msg.tab || channelObj?.name || (channelIdStr && !fallbackTabIds.has(channelIdStr) ? channelIdStr : '') || 'Unknown Tab';
      const tab = String(rawTabName).trim() || 'Unknown Tab';

      let tabId = channelIdStr || msg.tabId || msg.channelId;
      if (!tabId) {
        if (!fallbackTabIds.has(tab)) {
          fallbackTabIds.set(tab, `tab_${++tabCounter}`);
        }
        tabId = fallbackTabIds.get(tab)!;
      }

      let name = msg.name !== undefined && msg.name !== null ? String(msg.name).trim() : 'Unknown';
      if (!name) name = 'Unknown';

      // Track colors in encounter order for character names
      if (!nameToColors.has(name)) {
        nameToColors.set(name, []);
      }
      const existingColors = nameToColors.get(name)!;
      if (!existingColors.includes(color)) {
        existingColors.push(color);
      } else {
        const idx = existingColors.indexOf(color);
        if (idx !== -1) {
          existingColors.splice(idx, 1);
          existingColors.push(color);
        }
      }

      const identityKey = unifySameNameChars ? name : `${name}_${color}`;
      let charId = charIdentityMap.get(identityKey);
      if (!charId) {
          charId = `char_${++charCounter}`;
          charIdentityMap.set(identityKey, charId);
      }

      let content = msg.text || '';
      // Escape HTML tags to prevent XSS but allow our <br> later
      content = content.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      
      // Convert newlines to <br>
      content = content.replace(/\n/g, '<br>');

      // Append roll results if any
      if (msg.extend?.roll?.result) {
        content += '<br>' + msg.extend.roll.result;
      }

      let cleanText = content.replace(/<br\s*\/?>/gi, '').replace(/&nbsp;/gi, '').trim();
      if (!cleanText && !msg.extend?.roll?.result) continue;

      let isCommand = content.includes('|') || content.includes('＞') || content.includes('→') || content.includes('choice[');
      if (isCommand) {
        content = content.replace(/シークレットダイ스\s*\?\?\?/g, 'Secret dice 🎲');
      }
      
      let overrideImageId = undefined;
      let iconHash = msg.iconImage;
      let shortIconId = iconHash ? hashToShortId.get(iconHash) : undefined;
      
      if (iconHash && imagesDict[iconHash]) {
          overrideImageId = shortIconId || iconHash;
      }

      newLogs.push({
        id: `log-${i}`,
        color,
        tabId,
        tab,
        charId,
        name,
        content,
        isCommand,
        overrideImageId
      });

      if (!newChars[charId]) {
        newChars[charId] = { id: charId, name, color, imageUrl: '', images: [], visible: true };
        newCharOrder.push(charId);
      } else {
        // If unified mode, keep the LAST valid color encountered!
        if (unifySameNameChars && color && color !== '#000000') {
          newChars[charId].color = color;
        }
      }

      if (iconHash && imagesDict[iconHash]) {
          const charImages = newChars[charId].images || [];
          const shortId = shortIconId || iconHash;
          if (!charImages.find(img => img.id === shortId)) {
              let rawUrl = imagesDict[iconHash];
              if (rawUrl.startsWith('data:image/')) {
                  rawUrl = createBlobUrl(rawUrl);
              } else if (uploadMode === 'high_quality' && rawUrl.startsWith('http')) {
                  // Keep http URLs as is
              } else if (uploadMode === 'high_quality') {
                  rawUrl = ''; // Fallback for some reason, maybe empty images
              }
              const exprNum = (charImages.length + 1).toString().padStart(2, '0');
              const sanitizedName = (name || '').trim().replace(/[/\\?%*:|"<>]/g, '_');
              charImages.push({
                  id: shortId,
                  url: rawUrl,
                  name: sanitizedName ? `${sanitizedName}_${exprNum}` : '',
                  isRepresentative: charImages.length === 0
              });
              newChars[charId].images = charImages;
              
              if (charImages.length === 1) {
                  newChars[charId].imageUrl = rawUrl;
              }
          }
      }

      if (!newTabs[tabId]) {
        let format: TabFormat = 'main';
        const lowerTab = tab.toLowerCase();
        const lowerChannel = channelIdStr.toLowerCase();
        const lowerTabId = String(tabId).toLowerCase();
        const explicitFormat = String(msg.format || msg.tabFormat || msg.tabType || msg.type || channelObj?.format || '').toLowerCase();

        if (isOtherKeyword(lowerTab) || isOtherKeyword(lowerChannel) || isOtherKeyword(lowerTabId) || isOtherKeyword(explicitFormat)) format = 'other';
        if (isInfoKeyword(lowerTab) || isInfoKeyword(lowerChannel) || isInfoKeyword(lowerTabId) || isInfoKeyword(explicitFormat)) format = 'info';
        if (isSecretKeyword(lowerTab) || isSecretKeyword(lowerChannel) || isSecretKeyword(lowerTabId) || isSecretKeyword(explicitFormat) || Boolean(msg.isSecret)) format = 'secret';
        
        newTabs[tabId] = { id: tabId, name: tab, format, visible: true, color: '#ffd400' };
        newTabOrder.push(tabId);
      }
    }

    // Collect characters with multiple distinct colors in this JSON log
    nameToColors.forEach((cols, cName) => {
      if (cols.length > 1 && cName.toLowerCase() !== 'system') {
        multiColorChars.push({
          name: cName,
          colors: cols,
          lastColor: cols[cols.length - 1]
        });
      }
    });

  } else {
    // HTML Parsing
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    
    // 태그 독립적 탐색: <p>뿐만 아니라 모든 요소를 대상으로 탐색
    const allElements = doc.querySelectorAll('*');
    const logRows = Array.from(allElements).filter((el) => {
      const tagName = el.tagName.toLowerCase();
      const styleAttr = el.getAttribute('style') || '';
      const hasColor = /color\s*:/.test(styleAttr) || !!(el as HTMLElement).style?.color;
      
      if (!hasColor && tagName !== 'p') return false;
      const spans = el.querySelectorAll('span');
      if (spans.length < 2) return false;
      if (spans[0].parentElement !== el) return false;
      return true;
    });
    if (logRows.length === 0) {
      throw new Error("올바른 코코포리아 HTML 로그 파일이 아닙니다. 로그 데이터를 찾을 수 없습니다.");
    }

    logRows.forEach((p, index) => {
      const spans = Array.from(p.querySelectorAll('span'));
      if (spans.length < 2) return;
      const styleAttr = p.getAttribute('style') || '';
      const colorMatch = styleAttr.match(/color\s*:\s*([^;]+)/i);
      const color = colorMatch ? rgbToHex(colorMatch[1]) : rgbToHex((p as HTMLElement).style.color);
          
      if (color && color !== '#000000') colorsFound.add(color.toUpperCase());
      const tabRaw = spans[0].textContent?.trim() || '';
      const tabMatch = tabRaw.match(/\[(.*?)\]/);
      let tab = tabMatch ? tabMatch[1].trim() : (p.getAttribute('data-tab-name') || p.getAttribute('data-tab') || '');
      if (!tab && tabRaw && spans.length >= 3) {
        tab = tabRaw.replace(/^[\[\(【]/, '').replace(/[\]\)】]$/, '').trim();
      }
      if (!tab) {
        tab = '메인';
      }
          
      let name = 'Unknown';
      let content = '';
      if (spans.length >= 3) {
        name = spans[1].textContent !== null && spans[1].textContent !== undefined ? spans[1].textContent : 'Unknown';
        
        content = spans[2].innerHTML.trim();
      } else {
        content = spans[1].innerHTML.trim();
      }
      let cleanText = content.replace(/<br\s*\/?>/gi, '').replace(/&nbsp;/gi, '').trim();
      if (!cleanText) return;

      const isCommand = content.includes('|') || content.includes('＞') || content.includes('→') || content.includes('choice[');
          
      if (isCommand) {
        content = content.replace(/シークレットダイス\s*\?\?\?/g, 'Secret dice 🎲');
      }
      
      // Identity Extraction
      let tabId = p.getAttribute('data-tab-id') || p.getAttribute('data-channel-id');
      if (!tabId) {
        if (!fallbackTabIds.has(tab)) {
          fallbackTabIds.set(tab, `tab_${++tabCounter}`);
        }
        tabId = fallbackTabIds.get(tab)!;
      }
      let charId = p.getAttribute('data-char-id');
      if (!charId) {
        if (!fallbackCharIds.has(name)) {
          fallbackCharIds.set(name, `char_${++charCounter}`);
        }
        charId = fallbackCharIds.get(name)!;
      }
      newLogs.push({
        id: `log-${index}`,
        color,
        tabId,
        tab,
        charId,
        name,
        content,
        isCommand
      });
      if (!newChars[charId]) {
        newChars[charId] = { id: charId, name, color, imageUrl: '', images: [], visible: true };
        newCharOrder.push(charId);
      } else {
        newChars[charId].color = color;
      }
      if (tabId && !newTabs[tabId]) {
        let format: TabFormat = 'main';
        const lowerTab = tab.toLowerCase();
        const tabAttrFormat = p.getAttribute('data-tab-format')?.toLowerCase() || '';
        const classNames = (p.getAttribute('class') || '').toLowerCase();
        if (
          lowerTab.includes('secret') || lowerTab.includes('비밀') || lowerTab.includes('시크릿') ||
          lowerTab.includes('private') || lowerTab.includes('귓속말') || lowerTab.includes('whisper') ||
          tabAttrFormat === 'secret' || classNames.includes('secret')
        ) {
          format = 'secret';
        } else if (lowerTab.includes('other') || lowerTab.includes('잡담') || tabAttrFormat === 'other') {
          format = 'other';
        } else if (lowerTab.includes('info') || lowerTab.includes('정보') || tabAttrFormat === 'info') {
          format = 'info';
        }
        newTabs[tabId] = { id: tabId, name: tab, format, visible: true, color: '#ffd400' };
        newTabOrder.push(tabId);
      }
    });
  }

  const isLogEmpty = (content: string) => {
    const stripped = content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    return stripped === '';
  };
  
  let firstNonEmptyIndex = newLogs.findIndex(log => !isLogEmpty(log.content));
  if (firstNonEmptyIndex === -1) firstNonEmptyIndex = 0;
  const trimmedLogs = newLogs.slice(firstNonEmptyIndex);

  // Check for 'system' char removal by looking for any character named 'system' that lacks non-commands
  const systemCharIds = newCharOrder.filter(id => newChars[id]?.name.toLowerCase() === 'system');
  for (const sysId of systemCharIds) {
    const hasNonCommandSystem = trimmedLogs.some(log => log.charId === sysId && !log.isCommand);
    if (!hasNonCommandSystem) {
      delete newChars[sysId];
      const idx = newCharOrder.indexOf(sysId);
      if (idx !== -1) newCharOrder.splice(idx, 1);
    }
  }

  return {
    trimmedLogs,
    newChars,
    newCharOrder,
    newTabs,
    newTabOrder,
    colorsFound: Array.from(colorsFound),
    multiColorChars,
    isNewJson: file.name.endsWith('.json') || file.type === 'application/json'
  };
};