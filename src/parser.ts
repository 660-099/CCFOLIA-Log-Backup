import { LogEntry, CharSetting, TabSetting, TabFormat } from './types';

const rgbToHex = (colorStr: string) => {
  if (!colorStr) return '';
  if (colorStr.startsWith('#')) return colorStr;
  const match = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return '';
  return '#' + match.slice(1).map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
};

export const parseLogFile = async (file: File) => {
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
      newTabs[tab] = { name: tab, format, visible: true, color: '#ffd400' };
      newTabOrder.push(tab);
    }
  });

  const isLogEmpty = (content: string) => {
    const stripped = content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    return stripped === '';
  };
  
  let firstNonEmptyIndex = newLogs.findIndex(log => !isLogEmpty(log.content));
  if (firstNonEmptyIndex === -1) firstNonEmptyIndex = 0;
  const trimmedLogs = newLogs.slice(firstNonEmptyIndex);

  if (newChars['system']) {
    const hasNonCommandSystem = trimmedLogs.some(log => log.name === 'system' && !log.isCommand);
    if (!hasNonCommandSystem) {
      delete newChars['system'];
      const idx = newCharOrder.indexOf('system');
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
