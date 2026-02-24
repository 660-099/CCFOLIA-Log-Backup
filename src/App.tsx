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
  Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { HexColorPicker } from 'react-colorful';

type TabFormat = 'main' | 'other' | 'info';

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

export default function App() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [charSettings, setCharSettings] = useState<Record<string, CharSetting>>({});
  const [charOrder, setCharOrder] = useState<string[]>([]);
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [tabSettings, setTabSettings] = useState<Record<string, TabSetting>>({});
  const [cssFormat, setCssFormat] = useState<'inline' | 'internal'>('internal');
  const [fontSize, setFontSize] = useState<number>(14);
  const [fontFamily, setFontFamily] = useState<string>('Pretendard');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [disableOtherColor, setDisableOtherColor] = useState(false);
  const [isEditingFontSize, setIsEditingFontSize] = useState(false);
  const [renamingChar, setRenamingChar] = useState<string | null>(null);
  const [newNameInput, setNewNameInput] = useState('');
  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [activeTab, setActiveTab] = useState<'files' | 'tabs' | 'chars' | 'settings'>('files');

  const fonts = [
    { name: '바닐라', value: "sans-serif", import: "", help: "바닐라를 선택하면 폰트가 따로 적용되지 않습니다." },
    { name: 'Pretendard', value: "'Pretendard', sans-serif", import: "@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');" },
    { name: 'Noto Sans KR', value: "'Noto Sans KR', sans-serif", import: "@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap');" },
    { name: '나눔고딕', value: "'Nanum Gothic', sans-serif", import: "@import url('https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700&display=swap');" },
    { name: 'Noto Serif KR', value: "'Noto Serif KR', serif", import: "@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700&display=swap');" },
    { name: 'Gothic A1', value: "'Gothic A1', sans-serif", import: "@import url('https://fonts.googleapis.com/css2?family=Gothic+A1:wght@400;700&display=swap');" },
    { name: 'Orbit', value: "'Orbit', sans-serif", import: "@import url('https://fonts.googleapis.com/css2?family=Orbit&display=swap');" }
  ];

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
        newTabs[tab] = { name: tab, format, visible: true };
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

    const scale = fontSize / 14;
    const avatarSize = 40 * scale;
    const gapSize = 12 * scale;
    const paddingSize = 12 * scale;
    const nameSize = 13 * scale;

    const css = `
      ${selectedFont.import}
      body { 
        font-family: ${selectedFont.value}; 
        background: ${bgColor}; 
        color: ${textColor}; 
        line-height: 1.6; 
        padding: 40px 0; 
        margin: 0;
        font-size: ${fontSize}px; 
      }
      .log-container { width: 100%; max-width: 800px; margin: 0 auto; }
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
      .main-name { font-weight: bold; font-size: ${nameSize}px; margin-bottom: 2px; display: block; }
      .main-content { font-size: 1em; color: ${textColor}; white-space: pre-wrap; word-break: break-all; }

      /* Other Format */
      .other-row { 
        padding: ${paddingSize / 3}px ${paddingSize * 1.3}px; 
        display: flex;
        gap: ${gapSize / 1.5}px;
        align-items: baseline;
      }
      .other-name { font-weight: bold; flex-shrink: 0; font-size: ${nameSize}px; }
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
          html += `<div style="background: rgba(0,0,0,0.1); border: 1px solid ${borderColor}; padding: ${paddingSize}px ${paddingSize * 1.3}px; border-radius: 8px; margin: 8px ${paddingSize * 1.3}px;"><span style="color: ${color}; font-family: monospace;">[ ${log.name} ]</span> <span style="color: ${otherTextColor}; font-family: monospace;">${log.content}</span></div>`;
        } else if (format === 'other') {
          html += `<div style="padding: ${paddingSize / 3}px ${paddingSize * 1.3}px; display: flex; gap: ${gapSize / 1.5}px; align-items: baseline;"><span style="font-weight: bold; color: ${otherNameColor}; font-size: ${nameSize}px; flex-shrink: 0;">${log.name}</span> <span style="color: ${otherTextColor};">${log.content}</span></div>`;
        } else if (format === 'info') {
          html += `<div style="padding: ${paddingSize * 1.3}px ${paddingSize * 1.6}px; background: ${infoBg}; border-left: 4px solid ${borderColor}; margin: 8px ${paddingSize * 1.3}px; border-radius: 4px;"><span style="font-weight: bold; color: ${color}; display: block; margin-bottom: 4px;">${log.name}</span><div style="color: ${textColor};">${log.content}</div></div>`;
        } else {
          const imgTag = img ? `<img src="${img}" style="${avatarStyle}" />` : `<div style="${avatarStyle}"></div>`;
          html += `
            <div style="display: flex; gap: ${gapSize}px; padding: ${paddingSize}px ${paddingSize * 1.3}px; align-items: flex-start;">
              ${imgTag}
              <div style="flex-grow: 1; line-height: 1.5;">
                <div style="font-weight: bold; color: ${color}; font-size: ${nameSize}px; margin-bottom: 2px;">${log.name}</div>
                <div style="color: ${textColor};">${log.content}</div>
              </div>
            </div>
          `;
        }
        html += `</div>`;
      } else {
        html += `<div class="log-item">`;

        if (log.isCommand) {
          html += `<div class="command-box"><span class="command-text" style="color: ${color}">[ ${log.name} ]</span> <span class="command-text">${log.content}</span></div>`;
        } else if (format === 'other') {
          html += `<div class="other-row"><span class="other-name" style="color: ${otherNameColor}">${log.name}</span> <span class="other-content">${log.content}</span></div>`;
        } else if (format === 'info') {
          html += `<div class="info-row"><span class="main-name" style="color: ${color}">${log.name}</span> <div class="main-content">${log.content}</div></div>`;
        } else {
          const imgTag = img ? `<img src="${img}" class="main-avatar" />` : `<div class="main-avatar"></div>`;
          html += `
            <div class="main-row">
              ${imgTag}
              <div class="main-body">
                <span class="main-name" style="color: ${color}">${log.name}</span>
                <div class="main-content">${log.content}</div>
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
        <title>TRPG Log Backup</title>
        ${isInline ? '' : `<style>${css}</style>`}
      </head>
      <body ${isInline ? `style="font-family: ${selectedFont.value}; background: ${bgColor}; color: ${textColor}; padding: 40px 0; margin: 0; font-size: ${fontSize}px;"` : ''}>
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
    a.download = 'trpg_log_backup.html';
    a.click();
  };

  return (
    <div className="flex h-screen bg-[#121212] font-sans text-stone-200 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[400px] bg-[#1a1a1a] border-r border-white/5 flex flex-col shadow-2xl z-20">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-white/5 bg-[#1a1a1a] shrink-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-stone-900 rounded-xl border border-white/10">
              <img src="https://ccfolia.com/images/logo-white.svg" alt="CCFOLIA" className="h-4 w-auto" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                코코포리아 로그 백업 툴
              </h1>
              <p className="text-[10px] font-medium text-stone-500 uppercase tracking-widest">CCFOLIA Log Formatter</p>
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
              className={`flex-1 py-3 flex flex-col items-center gap-1 transition-all relative ${
                activeTab === tab.id ? 'text-[#e6005c]' : 'text-stone-500 hover:text-stone-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-[10px] font-bold">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#e6005c]"
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
                className="space-y-2"
              >
                {Object.keys(tabSettings).length > 0 ? (
                  (Object.values(tabSettings) as TabSetting[]).map(tab => (
                    <div key={tab.name} className="p-2 bg-[#242424] rounded-xl border border-white/5 shadow-sm flex items-center gap-2">
                      <Toggle 
                        enabled={tab.visible} 
                        onChange={(val) => setTabSettings(prev => ({ ...prev, [tab.name]: { ...tab, visible: val } }))} 
                      />
                      <span className="text-[11px] font-bold truncate flex-1 text-stone-300">{tab.name}</span>
                      <div className="flex bg-[#1a1a1a] p-0.5 rounded-lg border border-white/5 shrink-0">
                        {(['main', 'other', 'info'] as TabFormat[]).map(f => (
                          <button
                            key={f}
                            onClick={() => setTabSettings(prev => ({ ...prev, [tab.name]: { ...tab, format: f } }))}
                            className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all ${
                              tab.format === f 
                                ? 'bg-[#e6005c] text-white shadow-sm' 
                                : 'text-stone-500 hover:text-stone-300'
                            }`}
                          >
                            {f === 'main' ? '메인' : f === 'other' ? '잡담' : '정보'}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 text-stone-700">
                    <Settings className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">로그를 먼저 업로드하세요</p>
                  </div>
                )}
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
                      <div key={char.name} className="p-2 bg-[#242424] rounded-2xl border border-white/5 shadow-sm flex items-center gap-2 relative">
                        <div className="shrink-0">
                          <Toggle 
                            enabled={char.visible} 
                            onChange={(val) => setCharSettings(prev => ({ ...prev, [char.name]: { ...char, visible: val } }))} 
                          />
                        </div>
                        
                        {renamingChar === char.name ? (
                          <div className="flex gap-1 w-20 shrink-0">
                            <input 
                              type="text" 
                              value={newNameInput}
                              onChange={(e) => setNewNameInput(e.target.value)}
                              className="w-full text-[10px] font-bold px-1 py-0.5 bg-[#1a1a1a] text-white border border-[#e6005c] rounded outline-none"
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
                          <div className="flex items-center gap-1 w-20 shrink-0 overflow-hidden">
                            <span className="text-[10px] font-bold truncate flex-1 text-stone-300">{char.name}</span>
                            <button 
                              onClick={() => { setRenamingChar(char.name); setNewNameInput(char.name); }}
                              className="p-0.5 text-stone-600 hover:text-[#e6005c] transition-colors"
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
                          {activeColorPicker === char.name && (
                            <div className="absolute top-full left-0 mt-2 p-4 bg-[#1a1a1a] rounded-2xl shadow-2xl border border-white/10 z-50 w-64 space-y-4">
                              <HexColorPicker 
                                color={char.color} 
                                onChange={(newColor) => setCharSettings(prev => ({ ...prev, [char.name]: { ...char, color: newColor } }))} 
                              />
                              
                              <div className="flex items-center gap-3 bg-stone-900 p-2 rounded-xl border border-white/5">
                                <div className="w-8 h-8 rounded-lg shadow-inner border border-white/10" style={{ backgroundColor: char.color }} />
                                <div className="flex-1">
                                  <input 
                                    type="text"
                                    value={char.color.toUpperCase()}
                                    onChange={(e) => setCharSettings(prev => ({ ...prev, [char.name]: { ...char, color: e.target.value } }))}
                                    className="w-full bg-transparent text-xs font-mono font-bold text-white outline-none"
                                  />
                                  <p className="text-[8px] font-bold text-stone-500 uppercase tracking-tighter">HEX</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 px-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-[8px] font-bold text-stone-500">RGB</span>
                                  <span className="text-[9px] font-mono text-stone-400">{hexToRgb(char.color)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-[8px] font-bold text-stone-500">HSL</span>
                                  <span className="text-[9px] font-mono text-stone-400">{hexToHsl(char.color)}</span>
                                </div>
                              </div>

                              {extractedColors.length > 0 && (
                                <div className="pt-3 border-t border-white/5">
                                  <p className="text-[9px] font-bold text-stone-500 mb-2 uppercase tracking-wide">로그에서 추출된 색상</p>
                                  <div className="grid grid-cols-8 gap-1.5 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                                    {extractedColors.map(c => (
                                      <button
                                        key={c}
                                        onClick={() => setCharSettings(prev => ({ ...prev, [char.name]: { ...char, color: c } }))}
                                        className="w-5 h-5 rounded-sm border border-white/10 hover:scale-110 transition-transform"
                                        style={{ backgroundColor: c }}
                                        title={c}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}

                              <button 
                                onClick={() => setActiveColorPicker(null)}
                                className="w-full py-2 bg-[#e6005c] text-white text-[10px] font-bold rounded-xl hover:bg-[#ff0066] transition-colors"
                              >
                                닫기
                              </button>
                            </div>
                          )}
                        </div>

                        <input 
                          type="text" 
                          placeholder="이미지 URL"
                          value={char.imageUrl}
                          onChange={(e) => setCharSettings(prev => ({ ...prev, [char.name]: { ...char, imageUrl: e.target.value } }))}
                          className="flex-1 text-[10px] px-2 py-1.5 bg-[#1a1a1a] text-white border border-white/5 rounded-lg outline-none focus:border-[#e6005c] transition-colors"
                        />
                        
                        <div className="w-7 h-7 rounded-lg bg-[#1a1a1a] border border-white/5 overflow-hidden shrink-0 flex items-center justify-center">
                          {char.imageUrl ? (
                            <img src={char.imageUrl} alt="" className="w-full h-full object-contain" />
                          ) : (
                            <ImageIcon className="w-3.5 h-3.5 text-stone-700" />
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
                  <h2 className="text-xs font-bold text-stone-500 flex items-center gap-2">
                    <Layout className="w-3.5 h-3.5" /> 테마 설정
                  </h2>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => setTheme('dark')}
                      className={`py-2 px-3 rounded-xl border-2 transition-all text-[11px] font-bold ${
                        theme === 'dark' 
                          ? 'bg-stone-900 border-[#e6005c] text-white' 
                          : 'bg-[#242424] border-white/5 text-stone-500 hover:border-white/10'
                      }`}
                    >
                      다크 모드
                    </button>
                    <button 
                      onClick={() => setTheme('light')}
                      className={`py-2 px-3 rounded-xl border-2 transition-all text-[11px] font-bold ${
                        theme === 'light' 
                          ? 'bg-white border-[#e6005c] text-stone-900' 
                          : 'bg-white border-stone-100 text-stone-400 hover:border-stone-200'
                      }`}
                    >
                      화이트 모드
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold text-stone-500 flex items-center gap-2">
                      <Type className="w-3.5 h-3.5" /> 폰트 설정
                    </h2>
                  </div>
                  <select 
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="w-full p-3 bg-[#242424] text-white border border-white/5 rounded-xl text-xs font-bold outline-none focus:border-[#e6005c] transition-all"
                  >
                    {fonts.map(f => (
                      <option key={f.name} value={f.name} className="bg-[#1a1a1a]">{f.name}</option>
                    ))}
                  </select>
                  {fonts.find(f => f.name === fontFamily)?.help && (
                    <p className="text-[10px] text-stone-500 text-center">
                      {fonts.find(f => f.name === fontFamily)?.help}
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold text-stone-500 flex items-center gap-2">
                      <Type className="w-3.5 h-3.5" /> 전체 크기 조절
                    </h2>
                    {isEditingFontSize ? (
                      <input 
                        type="number"
                        value={fontSize}
                        autoFocus
                        onBlur={() => setIsEditingFontSize(false)}
                        onChange={(e) => setFontSize(parseFloat(e.target.value) || 12)}
                        className="w-12 text-right text-xs font-bold text-[#e6005c] bg-[#e6005c]/10 border border-[#e6005c]/20 rounded px-1 outline-none"
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
                    onChange={(e) => setFontSize(parseFloat(e.target.value))}
                    className="w-full h-2 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-[#e6005c]"
                  />
                  <p className="text-[10px] text-stone-500 text-center">폰트 크기에 맞춰 아바타 및 간격이 자동 조절됩니다.</p>
                </div>

                <div className="space-y-4">
                  <h2 className="text-xs font-bold text-stone-500 flex items-center gap-2">
                    <Palette className="w-3.5 h-3.5" /> 잡담 설정
                  </h2>
                  <div className="flex items-center justify-between p-3 bg-[#242424] border border-white/5 rounded-xl shadow-sm">
                    <span className="text-[11px] font-bold text-stone-300">캐릭터 색상을 회색으로 통일</span>
                    <Toggle enabled={disableOtherColor} onChange={setDisableOtherColor} />
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-xs font-bold text-stone-500 flex items-center gap-2">
                    <Palette className="w-3.5 h-3.5" /> CSS 출력 형식
                  </h2>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => setCssFormat('internal')}
                      className={`py-2 px-3 rounded-xl border-2 transition-all text-[11px] font-bold ${
                        cssFormat === 'internal' 
                          ? 'bg-[#e6005c] border-[#e6005c] text-white' 
                          : 'bg-[#242424] border-white/5 text-stone-500 hover:border-white/10'
                      }`}
                    >
                      내부 스타일
                    </button>
                    <button 
                      onClick={() => setCssFormat('inline')}
                      className={`py-2 px-3 rounded-xl border-2 transition-all text-[11px] font-bold ${
                        cssFormat === 'inline' 
                          ? 'bg-[#e6005c] border-[#e6005c] text-white' 
                          : 'bg-[#242424] border-white/5 text-stone-500 hover:border-white/10'
                      }`}
                    >
                      인라인 스타일
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Apply Button (Sticky) */}
        <div className="p-6 border-t border-white/5 bg-[#1a1a1a] shrink-0">
          <button 
            onClick={() => setPreviewHtml(generateFinalHtml())}
            className="w-full py-4 bg-[#e6005c] text-white rounded-2xl text-sm font-bold hover:bg-[#ff0066] transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-2 active:scale-95"
          >
            <CheckSquare className="w-4 h-4" /> 설정 적용하기
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-stone-200 flex items-center justify-between px-10 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-100 rounded-full text-xs font-bold text-stone-500">
              <Eye className="w-3.5 h-3.5" /> 미리보기
            </div>
            {logs.length > 0 && (
              <div className="text-xs font-medium text-stone-400">
                총 <span className="text-stone-900 font-bold">{logs.length}</span>개의 로그 항목
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={exportStyle}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-stone-200 rounded-2xl text-sm font-bold text-stone-600 hover:bg-stone-50 transition-all shadow-sm active:scale-95"
            >
              <FileJson className="w-4 h-4" /> 스타일 저장
            </button>
            <button 
              onClick={downloadHtml}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-2xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-95"
            >
              <Download className="w-4 h-4" /> HTML 다운로드
            </button>
          </div>
        </header>

        {/* Preview Area */}
        <div className="flex-1 overflow-y-auto bg-white flex justify-center">
          <div className="w-full max-w-4xl min-h-full flex flex-col">
            {logs.length > 0 ? (
              <iframe 
                srcDoc={previewHtml}
                title="Preview"
                className="w-full flex-1 border-none"
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-stone-400 space-y-6 py-40 bg-stone-50">
                <div className="relative">
                  <div className="w-32 h-32 bg-stone-50 rounded-full flex items-center justify-center animate-pulse">
                    <Upload className="w-12 h-12 text-stone-200" />
                  </div>
                  <motion.div 
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -top-2 -right-2 p-3 bg-emerald-500 text-white rounded-2xl shadow-lg"
                  >
                    <Plus className="w-5 h-5" />
                  </motion.div>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-2xl font-bold text-stone-800 tracking-tight">로그 파일을 기다리고 있어요</p>
                  <p className="text-sm font-medium text-stone-400">CCFOLIA에서 추출한 HTML 파일을 업로드하여 시작하세요</p>
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-8 py-3 bg-stone-900 text-white rounded-2xl text-sm font-bold hover:bg-stone-800 transition-all shadow-xl shadow-stone-200 active:scale-95"
                >
                  지금 업로드하기
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Floating Help Button */}
        <div className="absolute bottom-8 right-8">
          <button className="w-12 h-12 bg-white border border-stone-200 rounded-full shadow-lg flex items-center justify-center text-stone-400 hover:text-emerald-600 hover:border-emerald-200 transition-all group">
            <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
          </button>
        </div>
      </main>
    </div>
  );
}
