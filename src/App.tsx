/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
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
  ChevronsUpDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HexColorPicker, RgbColorPicker } from 'react-colorful';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type TabFormat = 'main' | 'other' | 'info' | 'secret';

interface LogEntry {
  id: string;
  color: string;
  tab: string;
  name: string;
  content: string;
  isCommand: boolean;
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
  return text.replace(urlPattern, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: underline;">$1</a>');
};

export default function App() {
  const [pageTitle, setPageTitle] = useState('코코포리아 로그 백업');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [charSettings, setCharSettings] = useState<Record<string, CharSetting>>({});
  const [charOrder, setCharOrder] = useState<string[]>([]);
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [tabSettings, setTabSettings] = useState<Record<string, TabSetting>>({});
  const [cssFormat, setCssFormat] = useState<'inline' | 'internal'>('internal');
  const [fontSize, setFontSize] = useState<number>(14);
  const [fontFamily, setFontFamily] = useState<string>('Noto Sans KR');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [disableOtherColor, setDisableOtherColor] = useState(false);
  const [isEditingFontSize, setIsEditingFontSize] = useState(false);
  const [renamingChar, setRenamingChar] = useState<string | null>(null);
  const [newNameInput, setNewNameInput] = useState('');
  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [activeTab, setActiveTab] = useState<'files' | 'tabs' | 'chars' | 'settings'>('files');
  
  // History for Undo/Redo
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const fonts = [
    { name: 'Noto Sans KR', value: "'Noto Sans KR', sans-serif", import: "@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap');" },
    { name: '(폰트 적용X)', value: "sans-serif", import: "" },
    { name: 'Pretendard', value: "'Pretendard', sans-serif", import: "@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');" },
    { name: '나눔고딕', value: "'Nanum Gothic', sans-serif", import: "@import url('https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700&display=swap');" },
    { name: 'Noto Serif KR', value: "'Noto Serif KR', serif", import: "@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700&display=swap');" },
    { name: 'Gothic A1', value: "'Gothic A1', sans-serif", import: "@import url('https://fonts.googleapis.com/css2?family=Gothic+A1:wght@400;700&display=swap');" },
    { name: 'Orbit', value: "'Orbit', sans-serif", import: "@import url('https://fonts.googleapis.com/css2?family=Orbit&display=swap');" }
  ];

  const saveToHistory = (state: any) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(state)));
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
    setCssFormat(state.cssFormat);
    setFontSize(state.fontSize);
    setFontFamily(state.fontFamily);
    setTheme(state.theme);
    setDisableOtherColor(state.disableOtherColor);
  };

  const resetSettings = () => {
    if (confirm('설정을 초기화하시겠습니까?')) {
      const defaultState = {
        charSettings: Object.fromEntries(Object.entries(charSettings).map(([k, v]) => [k, { ...(v as object), color: '#000000', imageUrl: '', visible: true }])),
        tabSettings: Object.fromEntries(Object.entries(tabSettings).map(([k, v]) => [k, { ...(v as object), format: 'main', visible: true, color: '#ffd400' }])),
        cssFormat: 'internal' as const,
        fontSize: 14,
        fontFamily: 'Noto Sans KR',
        theme: 'dark' as const,
        disableOtherColor: false
      };
      applyState(defaultState);
      saveToHistory(defaultState);
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
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const styleInputRef = useRef<HTMLInputElement>(null);

  // Parse HTML Log
  const handleLogUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const pTags = doc.querySelectorAll('p');
    
    const newLogs: LogEntry[] = [];
    const newChars: Record<string, CharSetting> = {};
    const newCharOrder: string[] = [];
    const newTabs: Record<string, TabSetting> = {};
    const colorsFound = new Set<string>();

    pTags.forEach((p, index) => {
      const spans = Array.from(p.querySelectorAll('span'));
      if (spans.length < 3) return;

      const styleAttr = p.getAttribute('style') || '';
      const colorMatch = styleAttr.match(/color\s*:\s*([^;]+)/i);
      const color = colorMatch ? rgbToHex(colorMatch[1]) : rgbToHex(p.style.color);
      
      if (color && color !== '#000000') colorsFound.add(color.toUpperCase());

      const tabRaw = spans[0].textContent?.trim() || '';
      const tabMatch = tabRaw.match(/\[(.*?)\]/);
      const tab = tabMatch ? tabMatch[1].trim() : '';
      
      const name = spans[1].textContent?.trim() || 'Unknown';
      const content = spans[2].innerHTML.trim();

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
      }
    });

    setLogs(newLogs);
    setCharSettings(newChars);
    setCharOrder(newCharOrder);
    setExtractedColors(Array.from(colorsFound));
    setTabSettings(newTabs);
    setActiveTab('tabs');
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
    a.download = 'trpg_style_settings.json';
    a.click();
  };

  const generateFinalHtml = () => {
    const filteredLogs = logs.filter(log => 
      tabSettings[log.tab]?.visible && 
      charSettings[log.name]?.visible
    );

    const selectedFont = fonts.find(f => f.name === fontFamily) || fonts[0];
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
    const avatarSize = 46 * scale;
    const gapSize = 12 * scale;
    const paddingSize = 12 * scale;
    const nameSize = 13 * scale;

    const css = `
      ${selectedFont.import}
      * { box-sizing: border-box; min-width: 0; }
      .log-container { 
        width: 100%; 
        max-width: 800px; 
        margin: 0 auto; 
        font-family: ${selectedFont.value}; 
        background: ${bgColor}; 
        color: ${textColor}; 
        line-height: 1.6; 
        padding: 40px 0; 
        font-size: ${fontSize}px;
        overflow-x: hidden;
      }
      .log-item { position: relative; margin-bottom: 2px; }
      
      /* Main Format */
      .main-row { 
        display: flex; 
        gap: ${gapSize}px; 
        padding: ${paddingSize}px ${paddingSize * 1.3}px; 
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
        padding: ${paddingSize / 3}px ${paddingSize * 1.3}px; 
        display: flex;
        gap: ${gapSize / 1.5}px;
        align-items: baseline;
      }
      .other-name { font-weight: bold; flex-shrink: 0; font-size: 1em; }
      .other-content { font-size: 1em; color: ${otherTextColor}; white-space: pre-wrap; word-break: break-all; }

      /* Info Format */
      .info-row { 
        padding: ${paddingSize * 1.3}px ${paddingSize * 1.6}px; 
        background: ${infoBg};
        border-left: 4px solid ${borderColor};
        margin: 8px ${paddingSize * 1.3}px;
        border-radius: 4px;
      }
      
      .command-box { 
        background: rgba(0, 0, 0, 0.1); 
        border: 1px solid ${borderColor}; 
        padding: ${paddingSize}px ${paddingSize * 1.3}px; 
        border-radius: 8px; 
        margin: 8px ${paddingSize * 1.3}px; 
      }
      .command-text { font-family: 'JetBrains Mono', monospace; color: ${otherTextColor}; font-size: 0.9em; }

      /* Secret Format */
      .secret-row {
        display: flex; 
        gap: ${gapSize}px; 
        padding: ${paddingSize}px ${paddingSize * 1.3}px; 
        align-items: flex-start;
        margin: 4px ${paddingSize * 1.3}px;
        border-radius: 4px;
      }
    `;

    const isInline = cssFormat === 'inline';
    let html = '';

    filteredLogs.forEach(log => {
      const tabSet = tabSettings[log.tab];
      const format = tabSet?.format || 'main';
      const char = charSettings[log.name];
      const color = char?.color || log.color;
      const otherNameColor = disableOtherColor ? otherTextColor : color;
      const img = char?.imageUrl;

      if (isInline) {
        const avatarStyle = `width: ${avatarSize}px; height: ${avatarSize}px; flex-shrink: 0; background-color: ${avatarPlaceholder}; border-radius: 4px; object-fit: contain;`;
        
        html += `<div style="margin-bottom: 2px;">`;
        
        if (log.isCommand) {
          if (format === 'secret') {
            const secretColor = tabSet?.color || '#ffd400';
            const secretBg = getSecretBg(secretColor);
            html += `<div style="background: ${secretBg}; border: 1px solid ${borderColor}; padding: ${paddingSize}px ${paddingSize * 1.3}px; border-radius: 8px; margin: 8px ${paddingSize * 1.3}px;"><span style="color: ${color}; font-family: monospace; font-weight: bold;">[ ${log.name} ]</span> <span style="color: ${textColor}; font-family: monospace; font-weight: bold;">${linkify(log.content)}</span></div>`;
          } else {
            html += `<div style="background: rgba(0,0,0,0.1); border: 1px solid ${borderColor}; padding: ${paddingSize}px ${paddingSize * 1.3}px; border-radius: 8px; margin: 8px ${paddingSize * 1.3}px;"><span style="color: ${color}; font-family: monospace;">[ ${log.name} ]</span> <span style="color: ${otherTextColor}; font-family: monospace;">${linkify(log.content)}</span></div>`;
          }
        } else if (format === 'other') {
          html += `<div style="padding: ${paddingSize / 3}px ${paddingSize * 1.3}px; display: flex; gap: ${gapSize / 1.5}px; align-items: baseline;"><span style="font-weight: bold; color: ${otherNameColor}; font-size: ${nameSize}px; flex-shrink: 0;">${log.name}</span> <span style="color: ${otherTextColor};">${linkify(log.content)}</span></div>`;
        } else if (format === 'info') {
          html += `<div style="padding: ${paddingSize * 1.3}px ${paddingSize * 1.6}px; background: ${infoBg}; border-left: 4px solid ${borderColor}; margin: 8px ${paddingSize * 1.3}px; border-radius: 4px;"><span style="font-weight: bold; color: ${color}; display: block; margin-bottom: 4px;">${log.name}</span><div style="color: ${textColor};">${linkify(log.content)}</div></div>`;
        } else if (format === 'secret') {
          const secretColor = tabSet?.color || '#ffd400';
          const secretBg = getSecretBg(secretColor);
          const imgTag = img ? `<img src="${img}" style="${avatarStyle}" />` : `<div style="${avatarStyle}"></div>`;
          html += `
            <div style="display: flex; gap: ${gapSize}px; padding: ${paddingSize}px ${paddingSize * 1.3}px; align-items: flex-start; background: ${secretBg}; border-left: 4px solid ${secretColor}; margin: 4px ${paddingSize * 1.3}px; border-radius: 4px;">
              ${imgTag}
              <div style="flex-grow: 1; line-height: 1.5;">
                <div style="font-weight: bold; color: ${color}; font-size: ${nameSize}px; margin-bottom: 2px;">${log.name}</div>
                <div style="color: ${textColor};">${linkify(log.content)}</div>
              </div>
            </div>
          `;
        } else {
          const imgTag = img ? `<img src="${img}" style="${avatarStyle}" />` : `<div style="${avatarStyle}"></div>`;
          html += `
            <div style="display: flex; gap: ${gapSize}px; padding: ${paddingSize}px ${paddingSize * 1.3}px; align-items: flex-start;">
              ${imgTag}
              <div style="flex-grow: 1; line-height: 1.5;">
                <div style="font-weight: bold; color: ${color}; font-size: ${nameSize}px; margin-bottom: 2px;">${log.name}</div>
                <div style="color: ${textColor};">${linkify(log.content)}</div>
              </div>
            </div>
          `;
        }
        html += `</div>`;
      } else {
        html += `<div class="log-item">`;

        if (log.isCommand) {
          if (format === 'secret') {
            const secretColor = tabSet?.color || '#ffd400';
            const secretBg = getSecretBg(secretColor);
            html += `<div class="command-box" style="background: ${secretBg}; border-color: rgba(0,0,0,0.1);"><span class="command-text" style="color: ${color}; font-weight: bold;">[ ${log.name} ]</span> <span class="command-text" style="color: ${textColor}; font-weight: bold;">${linkify(log.content)}</span></div>`;
          } else {
            html += `<div class="command-box"><span class="command-text" style="color: ${color}">[ ${log.name} ]</span> <span class="command-text">${linkify(log.content)}</span></div>`;
          }
        } else if (format === 'other') {
          html += `<div class="other-row"><span class="other-name" style="color: ${otherNameColor}">${log.name}</span> <span class="other-content">${linkify(log.content)}</span></div>`;
        } else if (format === 'info') {
          html += `<div class="info-row"><span class="main-name" style="color: ${color}">${log.name}</span> <div class="main-content">${linkify(log.content)}</div></div>`;
        } else if (format === 'secret') {
          const secretColor = tabSet?.color || '#ffd400';
          const secretBg = getSecretBg(secretColor);
          const imgTag = img ? `<img src="${img}" class="main-avatar" />` : `<div class="main-avatar"></div>`;
          html += `
            <div class="secret-row" style="background: ${secretBg}; border-left: 4px solid ${secretColor};">
              ${imgTag}
              <div class="main-body">
                <span class="main-name" style="color: ${color}">${log.name}</span>
                <div class="main-content">${linkify(log.content)}</div>
              </div>
            </div>
          `;
        } else {
          const imgTag = img ? `<img src="${img}" class="main-avatar" />` : `<div class="main-avatar"></div>`;
          html += `
            <div class="main-row">
              ${imgTag}
              <div class="main-body">
                <span class="main-name" style="color: ${color}">${log.name}</span>
                <div class="main-content">${linkify(log.content)}</div>
              </div>
            </div>
          `;
        }
        html += `</div>`;
      }
    });

    return `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${pageTitle}</title>
        ${isInline ? '' : `<style>${css}</style>`}
      </head>
      <body style="margin: 0; background: ${bgColor};">
        <div class="log-container">
          ${html}
        </div>
      </body>
      </html>
    `;
  };

  useEffect(() => {
    if (logs.length > 0) {
      setPreviewHtml(generateFinalHtml());
    }
  }, [logs, charSettings, tabSettings, cssFormat, fontSize, fontFamily, theme, disableOtherColor]);

  const downloadHtml = () => {
    const html = generateFinalHtml();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pageTitle}_log.html`;
    a.click();
  };

  return (
    <div className="flex h-screen bg-[#121212] font-sans text-stone-200 overflow-x-hidden">
      {/* Sidebar */}
      <aside className="w-[400px] bg-[#1a1a1a] border-r border-white/5 flex flex-col shadow-2xl z-20">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-white/5 bg-[#1a1a1a] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#e6005c] rounded-xl shadow-lg shadow-pink-500/20">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-[8px] font-bold text-white/20 uppercase tracking-[0.2em] mb-0.5">CCFOLIA Log Formatter</p>
              <div className="flex items-center gap-1.5 group">
                <input 
                  type="text"
                  value={pageTitle}
                  onChange={(e) => setPageTitle(e.target.value)}
                  className="w-full bg-transparent text-base font-bold text-white tracking-tight outline-none focus:text-pink-400 transition-colors"
                  placeholder="제목을 입력하세요"
                />
                <Pencil className="w-3 h-3 text-white/10 group-hover:text-white/30 transition-colors shrink-0" />
              </div>
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
              className={`flex-1 py-4 flex flex-col items-center gap-1.5 transition-all relative ${
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
                  <h2 className="text-xs font-bold text-stone-500 flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5" /> 로그 업로드
                  </h2>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center gap-3 p-3 border-2 border-dashed border-white/5 rounded-xl hover:border-[#e6005c] hover:bg-pink-500/5 transition-all group"
                  >
                    <div className="p-1.5 bg-[#242424] rounded-lg group-hover:bg-[#e6005c]/20 transition-colors">
                      <Upload className="w-3.5 h-3.5 text-stone-500 group-hover:text-[#e6005c]" />
                    </div>
                    <div className="text-left">
                      <p className="text-[11px] font-bold text-stone-300">HTML 로그 파일 선택</p>
                    </div>
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleLogUpload} accept=".html" className="hidden" />
                </div>

                <div className="space-y-3">
                  <h2 className="text-xs font-bold text-stone-500 flex items-center gap-2">
                    <Palette className="w-3.5 h-3.5" /> 스타일 불러오기
                  </h2>
                  <button 
                    onClick={() => styleInputRef.current?.click()}
                    className="w-full flex items-center gap-3 p-4 border border-white/5 bg-[#242424] rounded-xl hover:bg-[#2a2a2a] transition-all"
                  >
                    <FileJson className="w-5 h-5 text-blue-400" />
                    <div className="text-left">
                      <p className="text-xs font-bold text-stone-300">JSON 설정 파일</p>
                      <p className="text-[10px] text-stone-500">이전에 저장한 스타일 불러오기</p>
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
                  <h2 className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
                    <Palette className="w-3.5 h-3.5" /> 잡담 설정
                  </h2>
                  <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl shadow-sm">
                    <span className="text-[11px] font-bold text-white/70">잡담 색상을 회색으로 통일</span>
                    <Toggle enabled={disableOtherColor} onChange={(val) => { setDisableOtherColor(val); saveToHistory({ charSettings, tabSettings, cssFormat, fontSize, fontFamily, theme, disableOtherColor: val }); }} />
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
                    <Settings className="w-3.5 h-3.5" /> 탭별 출력 설정
                  </h2>
                  {Object.keys(tabSettings).length > 0 ? (
                    (Object.values(tabSettings) as TabSetting[]).map(tab => (
                      <div key={tab.name} className="p-2 bg-white/5 rounded-xl border border-white/5 shadow-sm flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Toggle 
                            enabled={tab.visible} 
                            onChange={(val) => {
                              const next = { ...tabSettings, [tab.name]: { ...tab, visible: val } };
                              setTabSettings(next);
                              saveToHistory({ charSettings, tabSettings: next, cssFormat, fontSize, fontFamily, theme, disableOtherColor });
                            }} 
                          />
                          <span className="text-[11px] font-bold truncate flex-1 text-white/80">{tab.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex bg-black/20 p-0.5 rounded-lg border border-white/5 flex-1">
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
                              disabled={tab.format !== 'secret'}
                              onClick={() => setActiveColorPicker(activeColorPicker === `tab-${tab.name}` ? null : `tab-${tab.name}`)}
                              className={`w-6 h-6 rounded-md border border-white/10 shadow-sm transition-all ${
                                tab.format === 'secret' ? 'opacity-100 hover:scale-105' : 'opacity-20 cursor-not-allowed'
                              }`}
                              style={{ backgroundColor: tab.color || '#ffd400' }}
                            />
                          </div>
                        </div>
                      </div>
                    ))
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
                className="space-y-2"
              >
                {charOrder.length > 0 ? (
                  charOrder.map(charName => {
                    const char = charSettings[charName];
                    if (!char) return null;
                    return (
                      <div key={char.name} className="p-2 bg-white/5 rounded-2xl border border-white/5 shadow-sm flex items-center gap-2 relative">
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
                          <div className="flex gap-1 w-16 shrink-0">
                            <input 
                              type="text" 
                              value={newNameInput}
                              onChange={(e) => setNewNameInput(e.target.value)}
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
                          <div className="flex items-center gap-1 w-16 shrink-0 overflow-hidden">
                            <span className="text-[10px] font-bold truncate flex-1 text-white">{char.name}</span>
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
                            onClick={() => setActiveColorPicker(activeColorPicker === char.name ? null : char.name)}
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
                            saveToHistory({ charSettings: next, tabSettings, cssFormat, fontSize, fontFamily, theme, disableOtherColor });
                          }}
                          className="w-24 text-[10px] px-2 py-1.5 bg-black/20 border border-white/5 rounded-lg outline-none focus:border-[#e6005c] text-white/80 transition-colors"
                        />
                        
                        <div className="w-7 h-7 rounded-lg bg-black/20 border border-white/5 overflow-hidden shrink-0 flex items-center justify-center ml-auto">
                          {char.imageUrl ? (
                            <img src={char.imageUrl} alt="" className="max-w-full max-h-full object-contain" />
                          ) : (
                            <ImageIcon className="w-3.5 h-3.5 text-white/10" />
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-20 text-stone-300">
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
                          폰트 크기에 맞춰 아바타 및 간격이 자동 조절됩니다.
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
        <div className="p-3 border-t border-white/5 bg-[#1a1a1a] shrink-0">
          <div className="flex items-center gap-1.5">
            <button 
              onClick={undo}
              disabled={historyIndex <= 0}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/50 hover:text-white disabled:opacity-10 transition-all text-[9px] font-bold border border-white/5"
              title="되돌리기"
            >
              <Undo2 className="w-3 h-3" />
              되돌리기
            </button>
            <button 
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/50 hover:text-white disabled:opacity-10 transition-all text-[9px] font-bold border border-white/5"
              title="다시 실행"
            >
              <Redo2 className="w-3 h-3" />
              다시 실행
            </button>
            <button 
              onClick={resetSettings}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white/5 hover:bg-red-500/20 rounded-lg text-white/30 hover:text-red-400 transition-all text-[9px] font-bold border border-white/5"
              title="초기화"
            >
              <RotateCcw className="w-3 h-3" />
              초기화
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-[#0f0f0f] relative overflow-hidden">
        {/* Top bar */}
        <div className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#1a1a1a] shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5">
              <Eye className="w-3.5 h-3.5 text-white/40" />
              <span className="text-[11px] font-bold text-white/60">미리보기</span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <p className="text-[11px] font-bold text-white/30">
              총 <span className="text-white/60">{logs.length}</span>개의 로그 항목
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                const filename = prompt('저장할 스타일 파일 이름을 입력하세요', `${pageTitle}_style`);
                if (filename) {
                  const data = { charSettings, charOrder, tabSettings, cssFormat, fontSize, disableOtherColor, pageTitle, fontFamily, theme };
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${filename}.json`;
                  a.click();
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/60 hover:text-white transition-all text-[11px] font-bold"
            >
              <FileJson className="w-3.5 h-3.5" />
              스타일 저장
            </button>
            <button 
              onClick={downloadHtml}
              className="flex items-center gap-2 px-6 py-2 bg-[#e6005c] hover:bg-[#ff0066] rounded-xl text-white shadow-lg shadow-pink-500/20 transition-all text-[11px] font-bold"
            >
              <Download className="w-3.5 h-3.5" />
              HTML 다운로드
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0f0f0f] relative min-w-0">
          <div className="max-w-[800px] mx-auto min-w-0">
            {logs.length > 0 ? (
              <>
                <iframe
                  srcDoc={previewHtml}
                  className="w-full min-h-screen border-none bg-white"
                  title="Preview"
                />
                {activeColorPicker && (
                  <div className="fixed bottom-6 left-[424px] z-[70]">
                    {activeColorPicker.startsWith('tab-') ? (
                      <ColorPickerPopup 
                        char={{ name: activeColorPicker.replace('tab-', ''), color: tabSettings[activeColorPicker.replace('tab-', '')]?.color || '#ffd400', imageUrl: '', visible: true }} 
                        extractedColors={extractedColors}
                        onClose={() => setActiveColorPicker(null)}
                        onChange={(newColor) => {
                          const tabName = activeColorPicker.replace('tab-', '');
                          const next = { ...tabSettings, [tabName]: { ...tabSettings[tabName], color: newColor } };
                          setTabSettings(next);
                          saveToHistory({ charSettings, tabSettings: next, cssFormat, fontSize, fontFamily, theme, disableOtherColor });
                        }}
                        fixed
                      />
                    ) : (
                      <ColorPickerPopup 
                        char={charSettings[activeColorPicker]} 
                        extractedColors={extractedColors}
                        onClose={() => setActiveColorPicker(null)}
                        onChange={(newColor) => {
                          const next = { ...charSettings, [activeColorPicker]: { ...charSettings[activeColorPicker], color: newColor } };
                          setCharSettings(next);
                          saveToHistory({ charSettings: next, tabSettings, cssFormat, fontSize, fontFamily, theme, disableOtherColor });
                        }}
                        fixed
                      />
                    )}
                  </div>
                )}
              </>
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
                  지금 업로드하기
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// Helper Components
const ColorPickerPopup = ({ char, extractedColors, onClose, onChange, fixed }: { char: CharSetting; extractedColors: string[]; onClose: () => void; onChange: (color: string) => void; fixed?: boolean }) => {
  const [mode, setMode] = useState<'hex' | 'rgb'>('hex');
  const [isEditing, setIsEditing] = useState(false);
  const [tempColor, setTempColor] = useState(char.color);
  const [position, setPosition] = useState<{ v: 'top' | 'bottom', h: 'left' | 'right' }>({ v: 'top', h: 'right' });
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (popupRef.current && !fixed) {
      const rect = popupRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.top;
      const spaceRight = window.innerWidth - rect.left;
      
      setPosition({
        v: spaceBelow < 300 ? 'bottom' : 'top',
        h: spaceRight < 200 ? 'left' : 'right'
      });
    }
  }, [fixed]);

  const rgb = hexToRgbValues(char.color);

  return (
    <>
      <div className="fixed inset-0 z-[60]" onClick={onClose} />
      <div 
        ref={popupRef}
        className={cn(
          "p-3 bg-[#222] rounded-2xl shadow-2xl border border-white/10 z-[70] w-[170px] space-y-3 transition-all duration-200",
          fixed ? "relative" : cn(
            "absolute",
            position.v === 'top' ? "top-[15px]" : "bottom-[15px]",
            position.h === 'right' ? "left-full ml-[-24px]" : "right-full mr-[-24px]"
          )
        )}
      >
        <div className="h-24 overflow-hidden rounded-lg">
          {mode === 'hex' ? (
            <HexColorPicker color={char.color} onChange={onChange} className="!w-full !h-full" />
          ) : (
            <RgbColorPicker color={rgb} onChange={(c) => onChange(rgbToHexValues(c))} className="!w-full !h-full" />
          )}
        </div>
        
        <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5">
          <div className="w-6 h-6 rounded-lg shadow-inner border border-white/10 shrink-0" style={{ backgroundColor: char.color }} />
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input 
                type="text"
                value={tempColor}
                autoFocus
                onBlur={() => {
                  setIsEditing(false);
                  onChange(tempColor);
                }}
                onChange={(e) => setTempColor(e.target.value)}
                className="w-full bg-transparent text-[10px] font-mono font-bold text-white outline-none"
              />
            ) : (
              <p 
                onClick={() => {
                  setIsEditing(true);
                  setTempColor(char.color);
                }}
                className="text-[10px] font-mono font-bold text-white cursor-text truncate"
              >
                {mode === 'hex' ? char.color.toUpperCase() : `${rgb.r},${rgb.g},${rgb.b}`}
              </p>
            )}
          </div>
          <button 
            onClick={() => setMode(mode === 'hex' ? 'rgb' : 'hex')}
            className="p-1 bg-white/5 hover:bg-white/10 rounded-md text-pink-400 transition-colors"
            title={mode === 'hex' ? 'RGB 모드로 전환' : 'HEX 모드로 전환'}
          >
            <ChevronsUpDown className="w-3 h-3" />
          </button>
        </div>

        {extractedColors.length > 0 && (
          <div className="pt-2 border-t border-white/5">
            <div className="grid grid-cols-6 gap-1 max-h-16 overflow-y-auto pr-1 custom-scrollbar">
              {extractedColors.map(c => (
                <button
                  key={c}
                  onClick={() => onChange(c)}
                  className="w-4 h-4 rounded-sm border border-white/10 hover:scale-110 transition-transform"
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
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
