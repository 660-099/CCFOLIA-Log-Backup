import { LogEntry, CharSetting, TabSetting, TabFormat } from './types';
import { isAppProjectJson } from './utils/fileValidation';

const rgbToHex = (colorStr: string) => {
  if (!colorStr) return '';
  if (colorStr.startsWith('#')) return colorStr;
  const match = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return '';
  return '#' + match.slice(1).map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
};

import { createBlobUrl } from './utils/blobStore';

export const parseLogFile = async (file: File, uploadMode: 'easy' | 'high_quality' = 'high_quality') => {
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

    const charIdentityMap = new Map<string, string>(); // name_color -> charId

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const color = msg.color ? msg.color.toUpperCase() : '#888888';
      if (color && color !== '#000000') colorsFound.add(color);

      const tab = msg.channelName || msg.channel || 'Unknown Tab';
      let tabId = msg.channel;
      if (!tabId) {
        if (!fallbackTabIds.has(tab)) {
          fallbackTabIds.set(tab, `tab_${++tabCounter}`);
        }
        tabId = fallbackTabIds.get(tab)!;
      }

      let name = msg.name !== undefined && msg.name !== null ? msg.name : 'Unknown';
      const identityKey = `${name}_${color}`;
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
        content = content.replace(/シークレットダイス\s*\?\?\?/g, 'Secret dice 🎲');
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
        // Keep the last valid color if it changed? Or keep the first? We'll keep first for identity.
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
        const lowerChannel = (msg.channel || '').toLowerCase();
        if (lowerTab.includes('other') || lowerTab.includes('잡담') || lowerChannel.includes('other')) format = 'other';
        if (lowerTab.includes('info') || lowerTab.includes('정보') || lowerChannel.includes('info')) format = 'info';
        if (lowerTab.includes('secret') || lowerTab.includes('비밀') || lowerChannel.includes('private')) format = 'secret';
        
        newTabs[tabId] = { id: tabId, name: tab, format, visible: true, color: '#ffd400' };
        newTabOrder.push(tabId);
      }
    }

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
      const tab = tabMatch ? tabMatch[1].trim() : '';
          
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
      let tabId = p.getAttribute('data-tab-id');
      if (!tabId) {
        if (tab && !fallbackTabIds.has(tab)) {
          fallbackTabIds.set(tab, `tab_${++tabCounter}`);
        }
        tabId = tab ? fallbackTabIds.get(tab)! : '';
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
        if (lowerTab.includes('other') || lowerTab.includes('잡담')) format = 'other';
        if (lowerTab.includes('info') || lowerTab.includes('정보')) format = 'info';
        if (lowerTab.includes('secret') || lowerTab.includes('비밀')) format = 'secret';
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
    colorsFound: Array.from(colorsFound)
  };
};