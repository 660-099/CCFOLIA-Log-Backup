/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { useVirtualizer } from '@tanstack/react-virtual';
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
  User,
  ImageOff,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Copy,
  ExternalLink,
  ArrowUpDown,
  ChevronDown,
  Search,
  List
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';
import { TabFormat, LogEntry, CharSetting, TabSetting, CharacterLibraryItem } from './types';
import { parseLogFile } from './parser';
import { cn, r, rgbToHex, linkify } from './utils';
import { Toggle } from './components/Toggle';
import { LogItem } from './components/LogItem';
import { SectionNameEditor } from './components/SectionNameEditor';
import { ColorPickerPopup, CharacterNameWithTooltip } from './components/ColorPickerPopup';
import { generateFinalHtmlStr } from './utils/htmlGenerator';
import { fonts } from './constants';
import { useLocalStorage } from './hooks/useLocalStorage';

const Section = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("space-y-4", className)}>
    {children}
  </div>
);

const SectionTitle = ({ icon: Icon, title, rightElement }: { icon: any, title: React.ReactNode, rightElement?: React.ReactNode }) => (
  <div className="flex items-center justify-between">
    <h2 className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
      <Icon className="w-3.5 h-3.5" /> {title}
    </h2>
    {rightElement}
  </div>
);

const Tooltip = ({ 
  children, 
  content, 
  position = 'top',
  className,
  unstyled = false
}: { 
  children: React.ReactNode; 
  content: React.ReactNode; 
  position?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
  unstyled?: boolean;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, opacity: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    let top = 0;
    let left = 0;
    const margin = 8;

    let finalPosition = position;

    // Flip logic
    if (position === 'top' && triggerRect.top - tooltipRect.height - margin < 0) finalPosition = 'bottom';
    if (position === 'bottom' && triggerRect.bottom + tooltipRect.height + margin > window.innerHeight) finalPosition = 'top';
    if (position === 'left' && triggerRect.left - tooltipRect.width - margin < 0) finalPosition = 'right';
    if (position === 'right' && triggerRect.right + tooltipRect.width + margin > window.innerWidth) finalPosition = 'left';

    switch (finalPosition) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - margin;
        left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'bottom':
        top = triggerRect.bottom + margin;
        left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
        left = triggerRect.left - tooltipRect.width - margin;
        break;
      case 'right':
        top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
        left = triggerRect.right + margin;
        break;
    }

    if (left < margin) left = margin;
    else if (left + tooltipRect.width > window.innerWidth - margin) {
      left = window.innerWidth - tooltipRect.width - margin;
    }
    
    if (top < margin) top = margin;
    else if (top + tooltipRect.height > window.innerHeight - margin) {
      top = window.innerHeight - tooltipRect.height - margin;
    }

    setCoords({ top, left, opacity: 1 });
  }, [position]);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        updatePosition();
      }, 0);
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    } else {
      setCoords(prev => ({ ...prev, opacity: 0 }));
    }
  }, [isVisible, updatePosition]);

  return (
    <>
      <div 
        ref={triggerRef}
        onMouseEnter={() => setIsVisible(true)}
        onFocus={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onBlur={() => setIsVisible(false)}
        className={cn("inline-flex", !unstyled && "cursor-help")}
      >
        {children}
      </div>
      {isVisible && createPortal(
        <div 
          ref={tooltipRef}
          style={{ 
            top: coords.top, 
            left: coords.left, 
            opacity: coords.opacity,
            transition: 'opacity 0.2s',
            visibility: coords.opacity === 0 ? 'hidden' : 'visible'
          }}
          className={unstyled ? `fixed z-[9999] pointer-events-none ${className || ''}` : cn("fixed z-[9999] bg-[#1a1a1a] border border-white/10 rounded-xl p-3 text-[11px] leading-relaxed text-white/60 shadow-2xl pointer-events-none w-max max-w-xs font-normal text-left", className)}
        >
          {content}
        </div>,
        document.body
      )}
    </>
  );
};

const PortalDropdown = ({ isOpen, onClose, triggerRef, children, position = 'bottom-right' }: { isOpen: boolean, onClose: () => void, triggerRef: React.RefObject<HTMLElement>, children: React.ReactNode, position?: 'bottom-right' | 'right' }) => {
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (!isOpen || !triggerRef.current || !dropdownRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const dropdownRect = dropdownRef.current.getBoundingClientRect();
    
    let top = triggerRect.top;
    let left = triggerRect.right + 4;

    if (position === 'bottom-right') {
      top = triggerRect.bottom + 4;
      if (top + dropdownRect.height > window.innerHeight - 10) {
        top = triggerRect.top - dropdownRect.height - 4;
      }
      left = triggerRect.right - dropdownRect.width;
    } else if (position === 'right') {
      top = triggerRect.top;
      if (top + dropdownRect.height > window.innerHeight - 10) {
        top = window.innerHeight - dropdownRect.height - 10;
      }
      if (left + dropdownRect.width > window.innerWidth - 10) {
        left = triggerRect.left - dropdownRect.width - 4;
      }
    }

    setCoords({
      top,
      left
    });
  }, [isOpen, triggerRef, position]);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const timer = setTimeout(updatePosition, 0);
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      // Find the library dropdown ref element by looking through the path
      const target = e.target as Node;
      if (
        dropdownRef.current && !dropdownRef.current.contains(target) &&
        triggerRef.current && !triggerRef.current.contains(target)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={dropdownRef}
      style={{ top: coords.top, left: coords.left }}
      className="fixed z-[9999]"
      onClick={e => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  );
};

export default function App() {
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [pageTitle, setPageTitle] = useState('');
  const [tempTitle, setTempTitle] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isTocHovered, setIsTocHovered] = useState(false);

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
  const [rememberSettings, setRememberSettings] = useLocalStorage<boolean>('ccfolia_rememberSettings', true);
  
  const [cssFormat, setCssFormat] = useLocalStorage<'inline' | 'internal'>('ccfolia_cssFormat', 'internal', undefined, undefined, rememberSettings);
  const [fontSize, setFontSize] = useLocalStorage<number>('ccfolia_fontSize', 14, undefined, undefined, rememberSettings);
  const [fontFamily, setFontFamily] = useLocalStorage<string>('ccfolia_fontFamily', 'Noto Sans KR', undefined, undefined, rememberSettings);
  const [theme, setTheme] = useLocalStorage<'dark' | 'light'>('ccfolia_theme', 'dark', undefined, undefined, rememberSettings);
  const [darkBgColor, setDarkBgColor] = useLocalStorage<string>('ccfolia_darkBgColor', '#212121', undefined, undefined, rememberSettings);
  const [lightBgColor, setLightBgColor] = useLocalStorage<string>('ccfolia_lightBgColor', '#ffffff', undefined, undefined, rememberSettings);
  const [disableOtherColor, setDisableOtherColor] = useLocalStorage<boolean>('ccfolia_disableOtherColor', true, undefined, undefined, rememberSettings);
  const [isEditingFontSize, setIsEditingFontSize] = useState(false);
  const [renamingChar, setRenamingChar] = useState<string | null>(null);
  const [renamingTab, setRenamingTab] = useState<string | null>(null);
  const [newNameInput, setNewNameInput] = useState('');
  const [newTabNameInput, setNewTabNameInput] = useState('');
  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null);
  const [colorPickerRect, setColorPickerRect] = useState<DOMRect | null>(null);
  const [activeTab, setActiveTab] = useState<'files' | 'tabs' | 'chars' | 'settings'>('files');
  const scrollPositions = useRef<Record<string, number>>({});
  const sidebarScrollRef = useRef<HTMLDivElement>(null);

  const [mobileTab, setMobileTab] = useState<'settings' | 'preview'>('settings');
  const [charSortMode, setCharSortMode] = useState<'appearance' | 'alphabetical'>('appearance');
  const [isNarrationDropdownOpen, setIsNarrationDropdownOpen] = useState(false);
  const narrationDropdownRef = useRef<HTMLDivElement>(null);
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);
  const fontDropdownRef = useRef<HTMLDivElement>(null);

  const [splitPoints, setSplitPoints] = useState<Set<string>>(new Set());
  const [insertedImages, setInsertedImages] = useState<Record<string, { url: string; width?: string; align?: 'left' | 'center' | 'right' }[]>>({});
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showCopyMenu, setShowCopyMenu] = useState(false);
  const [initialState, setInitialState] = useState<any>(null);
  const [sectionNames, setSectionNames] = useState<Record<string, string>>({});
  const [isLibraryAccordionOpen, setIsLibraryAccordionOpen] = useState(false);
  const [openLibraryDropdownId, setOpenLibraryDropdownId] = useState<string | null>(null);
  const [librarySortMode, setLibrarySortMode] = useState<'newest' | 'oldest' | 'alphabetical'>('newest');
  const [isLibraryEditMode, setIsLibraryEditMode] = useState(false);
  const [renamingLibraryId, setRenamingLibraryId] = useState<string | null>(null);
  const [libraryNameInput, setLibraryNameInput] = useState('');
  const libraryDropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (narrationDropdownRef.current && !narrationDropdownRef.current.contains(target)) {
        setIsNarrationDropdownOpen(false);
      }
      if (fontDropdownRef.current && !fontDropdownRef.current.contains(target)) {
        setIsFontDropdownOpen(false);
      }
      if (libraryDropdownRef.current && !libraryDropdownRef.current.contains(target)) {
        setOpenLibraryDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const [characterLibrary, setCharacterLibrary] = useState<CharacterLibraryItem[]>(() => {
    try {
      const saved = localStorage.getItem('characterLibrary');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('characterLibrary', JSON.stringify(characterLibrary));
  }, [characterLibrary]);
  
  const [mergeTabs, setMergeTabs] = useLocalStorage<Set<TabFormat>>(
    'ccfolia_mergeTabs',
    new Set(['main', 'secret', 'other']),
    (val) => { try { return new Set(JSON.parse(val)); } catch { return new Set(['main', 'secret', 'other']); } },
    (val) => JSON.stringify(Array.from(val)),
    rememberSettings
  );

  const [showTabNames, setShowTabNames] = useLocalStorage<Set<TabFormat>>(
    'ccfolia_showTabNames',
    new Set(['secret']),
    (val) => { try { return new Set(JSON.parse(val)); } catch { return new Set(['secret']); } },
    (val) => JSON.stringify(Array.from(val)),
    rememberSettings
  );

  const [mergeTabStyles, setMergeTabStyles] = useLocalStorage<Set<TabFormat>>(
    'ccfolia_mergeTabStyles',
    new Set(['secret']),
    (val) => { try { return new Set(JSON.parse(val)); } catch { return new Set(['secret']); } },
    (val) => JSON.stringify(Array.from(val)),
    rememberSettings
  );

  const [hideEmptyAvatars, setHideEmptyAvatars] = useLocalStorage<boolean>('ccfolia_hideEmptyAvatars', false, undefined, undefined, rememberSettings);
  const [narrationCharacter, setNarrationCharacter] = useState<string | null>(null);
  const [imageInputIdx, setImageInputIdx] = useState<string | null>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [listOffset, setListOffset] = useState(0);

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
      darkBgColor,
      lightBgColor,
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
    newHistory.push(fullState);
    if (newHistory.length > 15) newHistory.shift();
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
    if (state.darkBgColor) setDarkBgColor(state.darkBgColor);
    if (state.lightBgColor) setLightBgColor(state.lightBgColor);
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
        const state = initialState;
        setCharSettings(state.charSettings);
        setTabSettings(state.tabSettings);
        setTabOrder(state.tabOrder);
        setCssFormat(state.cssFormat);
        setFontSize(state.fontSize);
        setFontFamily(state.fontFamily);
        setTheme(state.theme);
        if (state.darkBgColor) setDarkBgColor(state.darkBgColor);
        if (state.lightBgColor) setLightBgColor(state.lightBgColor);
        setDisableOtherColor(state.disableOtherColor);
        setLogs(state.logs);
        setInsertedImages(state.insertedImages || {});
        setSplitPoints(new Set(state.splitPoints || []));
        setSectionNames(state.sectionNames || {});
        setMergeTabs(new Set(state.mergeTabs || ['main', 'secret', 'other']));
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
        setDarkBgColor('#212121');
        setLightBgColor('#ffffff');
        setDisableOtherColor(true);
        setMergeTabs(new Set(['main', 'secret', 'other']));
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

  const renameCharacter = (charId: string, newName: string) => {
    if (!newName) {
      setRenamingChar(null);
      return;
    }
    const oldName = charSettings[charId]?.name;
    if (oldName === newName) {
      setRenamingChar(null);
      return;
    }

    setLogs(prev => prev.map(log => log.charId === charId ? { ...log, name: newName } : log));
    setCharSettings(prev => {
      const next = { ...prev };
      if (next[charId]) {
        next[charId] = { ...next[charId], name: newName };
      }
      return next;
    });
    setRenamingChar(null);
  };

  const renameTab = (tabId: string, newName: string) => {
    if (!newName) {
      setRenamingTab(null);
      return;
    }
    const oldName = tabSettings[tabId]?.name;
    if (oldName === newName) {
      setRenamingTab(null);
      return;
    }

    setLogs(prev => prev.map(log => log.tabId === tabId ? { ...log, tab: newName } : log));
    setTabSettings(prev => {
      const next = { ...prev };
      if (next[tabId]) {
        next[tabId] = { ...next[tabId], name: newName };
      }
      return next;
    });
    setRenamingTab(null);
  };

  const handleAddToLibrary = () => {
    const validChars = charOrder
      .map(id => charSettings[id])
      .filter(char => char && char.visible && char.imageUrl);
      
    if (validChars.length === 0) return;
    
    const newLibraryItem: CharacterLibraryItem = {
      id: `lib_${Date.now()}`,
      name: pageTitle || originalFileName || 'ccfolia',
      characters: validChars.map(char => ({
        name: char.name,
        color: char.color,
        imageUrl: char.imageUrl
      }))
    };
    
    setCharacterLibrary(prev => [...prev, newLibraryItem]);
  };

  const applyFromLibrary = (libraryItem: CharacterLibraryItem) => {
    let nextCharSettings = { ...charSettings };
    let hasChanges = false;
    
    libraryItem.characters.forEach(libChar => {
      Object.keys(nextCharSettings).forEach(charId => {
        if (nextCharSettings[charId].name === libChar.name) {
          nextCharSettings[charId] = {
            ...nextCharSettings[charId],
            color: libChar.color,
            imageUrl: libChar.imageUrl
          };
          hasChanges = true;
        }
      });
    });
    
    if (hasChanges) {
      setCharSettings(nextCharSettings);
      saveToHistory({ charSettings: nextCharSettings, tabSettings, cssFormat, fontSize, fontFamily, theme, disableOtherColor, logs });
    }
  };

  const applyCharacterFromLibrary = (libChar: { name: string; color: string; imageUrl: string }) => {
    let nextCharSettings = { ...charSettings };
    let hasChanges = false;
    
    Object.keys(nextCharSettings).forEach(charId => {
      if (nextCharSettings[charId].name === libChar.name) {
        nextCharSettings[charId] = {
          ...nextCharSettings[charId],
          color: libChar.color,
          imageUrl: libChar.imageUrl
        };
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setCharSettings(nextCharSettings);
      saveToHistory({ charSettings: nextCharSettings, tabSettings, cssFormat, fontSize, fontFamily, theme, disableOtherColor, logs });
    }
    setOpenLibraryDropdownId(null);
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

    const {
      trimmedLogs,
      newChars,
      newCharOrder,
      newTabs,
      newTabOrder,
      colorsFound
    } = await parseLogFile(file);

    setLogs(trimmedLogs);
    setCharSettings(newChars);
    setCharOrder(newCharOrder);
    setExtractedColors(colorsFound);
    setTabSettings(newTabs);
    setTabOrder(newTabOrder);
    setInsertedImages({});
    setSplitPoints(new Set());
    setSectionNames({});
    setMergeTabs(new Set(['main', 'secret', 'other']));
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
      mergeTabs: ['main', 'secret', 'other'],
      showTabNames: ['secret'],
      mergeTabStyles: ['secret'],
      hideEmptyAvatars: false
    };
    setInitialState(initial);
    setHistory([initial]);
    setHistoryIndex(0);
  };

  const [jsonFileName, setJsonFileName] = useState('');

  // Handle Project Upload
  const handleProjectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const jsonText = await file.text();
      const json = JSON.parse(jsonText);
      
      let confirmMessage = "";
      
      if (logs.length > 0) {
        confirmMessage += "현재 작업 중인 데이터를 덮어씌우시겠습니까?\n";
      }
      
      const jsonTargetName = json.pageTitle || json.originalFileName;
      const currentTargetName = pageTitle || originalFileName;
      
      if (jsonTargetName && currentTargetName && jsonTargetName !== currentTargetName) {
        confirmMessage += `\n주의: 이 프로젝트 파일은 "${jsonTargetName}" 프로젝트용입니다.\n현재 작업 중인 문서("${currentTargetName}")와 이름이 다릅니다.`;
      }
      
      if (confirmMessage) {
        if (!window.confirm(confirmMessage.trim() + "\n\n그래도 계속하시겠습니까?")) {
          e.target.value = '';
          return;
        }
      }

      if (json.charSettings) setCharSettings(json.charSettings);
      if (json.charOrder) setCharOrder(json.charOrder);
      if (json.tabSettings) setTabSettings(json.tabSettings);
      if (json.tabOrder) setTabOrder(json.tabOrder);
      if (json.pageTitle !== undefined) setPageTitle(json.pageTitle);
      
      if (json.logs) setLogs(json.logs); // Restore edited/deleted logs
      
      if (json.cssFormat) setCssFormat(json.cssFormat);
      if (json.fontSize) setFontSize(json.fontSize);
      if (json.fontFamily) setFontFamily(json.fontFamily);
      if (json.theme) setTheme(json.theme);
      if (json.disableOtherColor !== undefined) setDisableOtherColor(json.disableOtherColor);
      
      if (json.splitPoints) setSplitPoints(new Set(json.splitPoints));
      if (json.sectionNames) setSectionNames(json.sectionNames);
      if (json.insertedImages) setInsertedImages(json.insertedImages);
      
      if (json.mergeTabs) setMergeTabs(new Set(json.mergeTabs));
      if (json.showTabNames) setShowTabNames(new Set(json.showTabNames));
      if (json.mergeTabStyles) setMergeTabStyles(new Set(json.mergeTabStyles));
      if (json.hideEmptyAvatars !== undefined) setHideEmptyAvatars(json.hideEmptyAvatars);
      if (json.narrationCharacter !== undefined) setNarrationCharacter(json.narrationCharacter);

      saveToHistory(json);
      setJsonFileName(file.name);
    } catch (err) {
      alert('프로젝트 파일을 읽는 중 오류가 발생했습니다.');
    }
    e.target.value = '';
  };

  const exportProject = () => {
    const data = { 
      originalFileName,
      charSettings, 
      charOrder, 
      tabSettings, 
      tabOrder,
      pageTitle,
      cssFormat, 
      fontSize, 
      fontFamily, 
      theme, 
      disableOtherColor,
      splitPoints: Array.from(splitPoints),
      sectionNames,
      insertedImages,
      mergeTabs: Array.from(mergeTabs),
      showTabNames: Array.from(showTabNames),
      mergeTabStyles: Array.from(mergeTabStyles),
      hideEmptyAvatars,
      narrationCharacter,
      logs // Included so edit/delete status can be restored
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    let baseName = 'ccfolia_project';
    if (pageTitle) {
      baseName = pageTitle;
    } else if (originalFileName) {
      baseName = originalFileName.replace(/\.html$/, '');
    }
    
    a.download = `${baseName}.json`;
    a.click();
  };

  const mergedLogs = useMemo(() => {
    if (logs.length === 0) return [];
    
    const result: LogEntry[] = [];
    let currentMerged: LogEntry | null = null;
    let mergedIds: string[] = [];

    const visibleLogs = logs.map(log => {
      const isVisibleContent = tabSettings[log.tabId]?.visible && charSettings[log.charId]?.visible !== false;
      const hasImage = insertedImages[log.id] && insertedImages[log.id].length > 0;
      
      if (isVisibleContent) {
        return { ...log, isHiddenContent: false };
      } else if (hasImage) {
        return { ...log, isHiddenContent: true };
      }
      return null;
    }).filter(Boolean) as LogEntry[];

    visibleLogs.forEach((log) => {
      const tabSet = tabSettings[log.tabId];
      const format = tabSet?.format || 'main';
      
      const currentStableId = currentMerged ? (currentMerged.id.startsWith('merged:') ? currentMerged.id.split(',').pop()! : currentMerged.id) : null;
      const hasSplitPoint = currentStableId ? splitPoints.has(currentStableId) : false;

      const shouldMerge = !log.isHiddenContent && 
                          !currentMerged?.isHiddenContent &&
                          mergeTabs.has(format) && 
                          currentMerged && 
                          currentMerged.name === log.name && 
                          currentMerged.tab === log.tab && 
                          !log.isCommand && 
                          !currentMerged.isCommand &&
                          !hasSplitPoint;

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
  }, [logs, mergeTabs, tabSettings, charSettings, splitPoints]);

  useLayoutEffect(() => {
    if (listRef.current) {
      setListOffset(listRef.current.offsetTop);
    }
  }, [mergedLogs.length, sectionNames, splitPoints]);

  const splitPointsArray = useMemo(() => {
    return mergedLogs
      .map((log, idx) => ({ log, idx }))
      .filter(({ log }) => {
        const stableId = log.id.startsWith('merged:') ? log.id.split(',').pop()! : log.id;
        return splitPoints.has(stableId);
      })
      .map(({ idx }) => idx);
  }, [mergedLogs, splitPoints]);

  const sectionsList = useMemo(() => {
    if (mergedLogs.length === 0) return [];
    const list = [];
    
    const firstEnd = splitPointsArray.length > 0 ? splitPointsArray[0] - 1 : mergedLogs.length - 1;
    list.push({ 
      id: 'section-0', 
      name: sectionNames[0] || '섹션 1',
      startBlock: 1,
      endBlock: firstEnd + 1,
      targetOriginalIndex: 0
    });

    splitPointsArray.forEach((idx, i) => {
      const splitLog = mergedLogs[idx];
      const stableId = splitLog ? (splitLog.id.startsWith('merged:') ? splitLog.id.split(',').pop()! : splitLog.id) : '';
      const startBlock = idx + 1;
      const endBlock = i + 1 < splitPointsArray.length ? splitPointsArray[i + 1] : mergedLogs.length;
      
      list.push({ 
        id: `section-${stableId}`, 
        name: sectionNames[stableId] || `섹션 ${i + 2}`,
        startBlock,
        endBlock,
        targetOriginalIndex: idx
      });
    });
    return list;
  }, [splitPointsArray, sectionNames, mergedLogs]);

  const scrollToSection = (targetOriginalIndex: number, sectionId: string) => {
    if (targetOriginalIndex === 0 || sectionId === 'section-0') {
      rowVirtualizer.scrollToIndex(0, { align: 'start' });
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (previewContainerRef.current) {
            previewContainerRef.current.scrollTo({ top: 0, behavior: 'auto' });
          }
        }, 10);
      });
      return;
    }

    const virtualIndex = displayItems.findIndex(item => item.originalIndex === targetOriginalIndex);
    if (virtualIndex !== -1) {
      rowVirtualizer.scrollToIndex(virtualIndex, { align: 'start' });
      
      requestAnimationFrame(() => {
        setTimeout(() => {
          const el = document.getElementById(sectionId);
          const container = previewContainerRef.current;
          if (el && container) {
            const elRect = el.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            const offsetTop = elRect.top - containerRect.top + container.scrollTop - 50;
            container.scrollTo({ top: offsetTop, behavior: 'auto' });
          }
        }, 30);
      });
    }
  };

  const displayItems = useMemo(() => {
    if (!searchQuery) {
      return mergedLogs.map((log, index) => ({ log, isMatched: true, originalIndex: index }));
    }
    const lowerQuery = searchQuery.toLowerCase();
    return mergedLogs.map((log, index) => {
      const isMatched = log.content.toLowerCase().includes(lowerQuery) || log.name.toLowerCase().includes(lowerQuery);
      const stableId = log.id.startsWith('merged:') ? log.id.split(',').pop()! : log.id;
      const isSplit = splitPoints.has(stableId);
      if (isMatched || isSplit) {
        return { log, isMatched, originalIndex: index };
      }
      return null;
    }).filter(Boolean) as { log: any, isMatched: boolean, originalIndex: number }[];
  }, [mergedLogs, searchQuery, splitPoints]);

  const rowVirtualizer = useVirtualizer({
    count: displayItems.length,
    getScrollElement: () => previewContainerRef.current,
    estimateSize: () => 100,
    overscan: 10,
    scrollMargin: listOffset,
  });

  const sortedCharOrder = useMemo(() => {
    if (charSortMode === 'appearance') return charOrder;
    return [...charOrder].sort((idA, idB) => {
      const a = charSettings[idA]?.name || 'Unknown';
      const b = charSettings[idB]?.name || 'Unknown';

      // Handle "Unknown" or empty names by putting them at the end
      if (a === 'Unknown' && b !== 'Unknown') return 1;
      if (a !== 'Unknown' && b === 'Unknown') return -1;
      
      const isAEnglish = /^[a-zA-Z]/.test(a);
      const isBEnglish = /^[a-zA-Z]/.test(b);
      
      if (isAEnglish && !isBEnglish) return -1;
      if (!isAEnglish && isBEnglish) return 1;

      return a.localeCompare(b, 'ko', { sensitivity: 'base', numeric: true });
    });
  }, [charOrder, charSortMode, charSettings]);

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
      const stableId = id.startsWith('merged:') ? id.split(',').pop()! : id;
      
      // Remove associated images for the deleted log (ID-based)
      const nextImages = { ...insertedImages };
      if (nextImages[stableId]) {
        delete nextImages[stableId];
      }
      setInsertedImages(nextImages);
      
      // Remove split point if it was on this log
      const nextSplits = new Set(splitPoints);
      if (nextSplits.has(stableId)) {
        nextSplits.delete(stableId);
      }
      setSplitPoints(nextSplits);

      // Remove section name if it was on this log
      const nextNames = { ...sectionNames };
      if (nextNames[stableId]) {
        delete nextNames[stableId];
      }
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

  const getHtmlString = (range?: { start: number; end: number }) => {
    const selectedFont = fonts.find(f => f.name === fontFamily) || fonts[0];
    const targetLogs = range ? mergedLogs.slice(range.start, range.end + 1) : mergedLogs;
    const filteredLogs = targetLogs.filter(log => 
      tabSettings[log.tabId]?.visible && 
      (charSettings[log.charId]?.visible !== false)
    );

    return generateFinalHtmlStr(
      filteredLogs,
      mergedLogs,
      charSettings,
      tabSettings,
      cssFormat,
      theme,
      fontSize,
      fontFamily,
      disableOtherColor,
      hideEmptyAvatars,
      narrationCharacter,
      insertedImages,
      mergeTabStyles,
      showTabNames,
      pageTitle,
      selectedFont.value
    );
  };

  const downloadHtml = (range?: { start: number; end: number }) => {
    const html = getHtmlString(range);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = pageTitle || originalFileName || 'ccfolia';
    let suffix = '_log';
    if (range) {
      let name = '';
      if (range.start === 0) {
        name = sectionNames[0];
      } else {
        const splitLog = mergedLogs[range.start - 1];
        const stableId = splitLog ? (splitLog.id.startsWith('merged:') ? splitLog.id.split(',').pop()! : splitLog.id) : '';
        name = sectionNames[stableId];
      }
      suffix = name ? `_${name}` : `_part${range.start + 1}-${range.end + 1}`;
    }
    a.download = `${fileName}${suffix}.html`;
    a.click();
  };

  const downloadZip = async () => {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    const sortedPoints = splitPointsArray;
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
      const selectedFont = fonts.find(f => f.name === fontFamily) || fonts[0];
      const targetLogs = mergedLogs.slice(s.start, s.end + 1);
      const filteredLogs = targetLogs.filter(log => 
        tabSettings[log.tabId]?.visible && 
        (charSettings[log.charId]?.visible !== false)
      );

      const html = generateFinalHtmlStr(
        filteredLogs,
        mergedLogs,
        charSettings,
        tabSettings,
        cssFormat,
        theme,
        fontSize,
        fontFamily,
        disableOtherColor,
        hideEmptyAvatars,
        narrationCharacter,
        insertedImages,
        mergeTabStyles,
        showTabNames,
        pageTitle,
        selectedFont.value
      );
      
      let name = '';
      if (s.start === 0) {
        name = sectionNames[0];
      } else {
        const splitLog = mergedLogs[s.start - 1];
        const stableId = splitLog ? (splitLog.id.startsWith('merged:') ? splitLog.id.split(',').pop()! : splitLog.id) : '';
        name = sectionNames[stableId];
      }
      const finalName = name ? `${fileName}_${name}` : `${fileName}_section_${i + 1}`;
      folder?.file(`${finalName}.html`, html);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${folderName}.zip`;
    a.click();
  };

  const handleTabChange = (newTab: 'files' | 'tabs' | 'chars' | 'settings') => {
    if (newTab === activeTab) return;
    if (sidebarScrollRef.current) {
      scrollPositions.current[activeTab] = sidebarScrollRef.current.scrollTop;
    }
    setActiveTab(newTab);
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
            { id: 'chars', icon: User, label: '캐릭터' },
            { id: 'settings', icon: Palette, label: '디자인' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
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
        <div className="flex-1 overflow-y-auto p-6" ref={sidebarScrollRef}>
          <AnimatePresence 
            mode="wait"
            onExitComplete={() => {
              if (sidebarScrollRef.current) {
                // Ensure immediate position restoration happens after unmount, but before remount finishes
                // using a setTimeout of 0 pushes it to the end of the execution queue 
                // so the DOM can update and actually accept the new scrollTop
                setTimeout(() => {
                  if (sidebarScrollRef.current) {
                    sidebarScrollRef.current.scrollTop = scrollPositions.current[activeTab] || 0;
                  }
                }, 0);
              }
            }}
          >
            {activeTab === 'files' && (
              <motion.div 
                key="files"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <Section>
                  <SectionTitle icon={MessageSquare} title="로그 업로드" />
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-[50px] px-3 flex items-center justify-between border-2 border-dashed border-white/5 rounded-xl hover:border-[#e6005c] hover:bg-pink-500/5 transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={cn(
                        "p-1.5 rounded-lg transition-colors shrink-0",
                        originalFileName ? "bg-[#e6005c]/20" : "bg-[#242424] group-hover:bg-[#e6005c]/20"
                      )}>
                        <Upload className={cn(
                          "w-3.5 h-3.5 transition-colors",
                          originalFileName ? "text-[#e6005c]" : "text-white/20 group-hover:text-[#e6005c]"
                        )} />
                      </div>
                      <div className="text-left w-full overflow-hidden">
                        <p className={cn(
                          "text-[11px] font-bold truncate leading-none mt-0.5 transition-colors",
                          originalFileName ? "text-white/90" : "text-white/60"
                        )}>
                          {originalFileName ? `${originalFileName}.html` : 'HTML 로그 파일 선택'}
                        </p>
                      </div>
                    </div>
                    {originalFileName ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setLogs([]);
                          setOriginalFileName('');
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="p-1 hover:bg-white/10 rounded-lg transition-colors shrink-0 flex items-center justify-center w-6 h-6"
                        title="업로드 취소"
                      >
                        <X className="w-3.5 h-3.5 text-white/60 hover:text-white" />
                      </button>
                    ) : (
                      <div className="w-6 h-6 shrink-0" />
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleLogUpload} accept=".html" className="hidden" />
                </Section>

                <Section>
                  <SectionTitle 
                    icon={Palette} 
                    title={
                      <div className="flex items-center gap-2">
                        <span>프로젝트 관리</span>
                        <Tooltip position="right" content={
                          <>
                            <p className="mb-2">
                              섹션 분할, 삽화, 탭, 캐릭터 설정 등 현재의 모든 편집 데이터를 JSON 파일로 내보냅니다. 원본 로그를 업로드한 상태에서 이 파일을 불러오면 이전 작업 상태를 그대로 복원합니다.
                            </p>
                            <p className="text-[#e6005c] font-medium">
                              프로젝트 파일은 편집 정보만 포함하므로, 원본 로그 파일이 없으면 복원되지 않습니다.
                            </p>
                          </>
                        }>
                          <HelpCircle className="w-3 h-3 text-white/20 hover:text-white/40 cursor-help transition-colors" />
                        </Tooltip>
                      </div>
                    } 
                  />
                  <div 
                    onClick={() => {
                      if (logs.length > 0) styleInputRef.current?.click();
                    }}
                    className={cn(
                      "w-full h-[50px] px-3 flex items-center justify-between border-2 border-dashed rounded-xl transition-all group",
                      logs.length > 0 
                        ? "border-white/5 hover:border-blue-500 hover:bg-blue-500/5 cursor-pointer"
                        : "border-white/5 opacity-50 cursor-not-allowed bg-white/5"
                    )}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={cn(
                        "p-1.5 rounded-lg transition-colors shrink-0",
                        jsonFileName ? "bg-blue-500/20" : (logs.length > 0 ? "bg-[#242424] group-hover:bg-blue-500/20" : "bg-white/5")
                      )}>
                        <FileJson className={cn(
                          "w-3.5 h-3.5 transition-colors",
                          jsonFileName ? "text-blue-400" : (logs.length > 0 ? "text-white/20 group-hover:text-blue-400" : "text-white/20")
                        )} />
                      </div>
                      <div className="text-left w-full overflow-hidden">
                        <p className={cn(
                          "text-[11px] font-bold truncate leading-none mt-0.5 transition-colors",
                          jsonFileName ? "text-white/90" : "text-white/60",
                          logs.length === 0 && "opacity-50"
                        )}>
                          {jsonFileName || '프로젝트 파일(.json) 선택'}
                        </p>
                      </div>
                    </div>
                    {jsonFileName ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setJsonFileName('');
                          if (styleInputRef.current) styleInputRef.current.value = '';
                        }}
                        className="p-1 hover:bg-white/10 rounded-lg transition-colors shrink-0 flex items-center justify-center w-6 h-6"
                        title="업로드 취소"
                      >
                        <X className="w-3.5 h-3.5 text-white/60 hover:text-white" />
                      </button>
                    ) : (
                      <div className="w-6 h-6 shrink-0" />
                    )}
                  </div>
                  <input type="file" ref={styleInputRef} onChange={handleProjectUpload} accept=".json" className="hidden" />
                </Section>
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
                <Section>
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
                </Section>

                <Section>
                  <SectionTitle icon={Settings} title="개별 탭 출력 설정" />
                  <div className="space-y-2">
                  {tabOrder.length > 0 ? (
                    tabOrder.map(tabId => {
                      const tab = tabSettings[tabId];
                      if (!tab) return null;
                      return (
                        <div key={tab.id} className="p-3 bg-white/5 rounded-xl border border-white/5 shadow-sm flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <Toggle 
                            enabled={tab.visible} 
                            onChange={(val) => {
                              const next = { ...tabSettings, [tab.id]: { ...tab, visible: val } };
                              setTabSettings(next);
                              saveToHistory({ charSettings, tabSettings: next, cssFormat, fontSize, fontFamily, theme, disableOtherColor });
                            }} 
                          />
                          {renamingTab === tab.id ? (
                            <div className="flex gap-1 flex-1">
                              <input 
                                type="text"
                                value={newTabNameInput}
                                autoFocus
                                onChange={(e) => setNewTabNameInput(e.target.value)}
                                onBlur={() => renameTab(tab.id, newTabNameInput)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') renameTab(tab.id, newTabNameInput);
                                  if (e.key === 'Escape') setRenamingTab(null);
                                }}
                                className="bg-black/40 text-[11px] font-bold text-white px-2 py-1 rounded border border-[#e6005c] outline-none flex-1"
                              />
                              <button 
                                onClick={() => renameTab(tab.id, newTabNameInput)}
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
                                onClick={() => { setRenamingTab(tab.id); setNewTabNameInput(tab.name); }}
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
                                  const next = { ...tabSettings, [tab.id]: { ...tab, format: f } };
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
                                if (activeColorPicker === `tab-${tab.id}`) {
                                  setActiveColorPicker(null);
                                  setColorPickerRect(null);
                                } else {
                                  setActiveColorPicker(`tab-${tab.id}`);
                                  setColorPickerRect(e.currentTarget.getBoundingClientRect());
                                }
                              }}
                              className="w-6 h-6 rounded-md border border-white/10 shadow-sm transition-all hover:scale-105"
                              style={{ backgroundColor: tab.color || '#ffd400' }}
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
                </Section>
              </motion.div>
            )}

            {activeTab === 'chars' && (
              <motion.div 
                key="chars"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <Section>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl shadow-sm h-11">
                      <span className="text-[11px] font-bold text-white/70">이미지 배경 상자 숨김</span>
                      <Toggle 
                        enabled={hideEmptyAvatars} 
                        onChange={(val) => {
                          setHideEmptyAvatars(val);
                          saveToHistory({ hideEmptyAvatars: val });
                        }} 
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl shadow-sm relative h-11" ref={narrationDropdownRef}>
                      <span className="text-[11px] font-bold text-white/70">나레이션 캐릭터</span>
                      <div className="relative">
                        <button
                          onClick={() => setIsNarrationDropdownOpen(!isNarrationDropdownOpen)}
                          className="flex items-center gap-2 bg-black/20 border border-white/10 rounded-lg text-[10px] text-white/80 px-2 py-1 outline-none hover:border-white/20 transition-colors"
                        >
                          <span className="max-w-[100px] truncate">{narrationCharacter ? charSettings[narrationCharacter]?.name || narrationCharacter : '선택 안 함'}</span>
                          <ChevronDown className="w-3 h-3 opacity-50" />
                        </button>
                        
                        {isNarrationDropdownOpen && (
                          <div className="absolute right-0 top-full mt-1 w-40 bg-[#222] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
                            <div className="max-h-[50vh] overflow-y-auto custom-scrollbar p-1">
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
                              {Object.keys(charSettings).map(charId => {
                                const char = charSettings[charId];
                                if (!char) return null;
                                return (
                                  <button
                                    key={charId}
                                    onClick={() => {
                                      setNarrationCharacter(charId);
                                      saveToHistory({ narrationCharacter: charId });
                                      setIsNarrationDropdownOpen(false);
                                    }}
                                    className={cn(
                                      "w-full text-left px-3 py-2 text-[11px] rounded-lg transition-colors truncate",
                                      narrationCharacter === charId ? "bg-[#e6005c] text-white font-bold" : "text-white/60 hover:bg-white/5 hover:text-white"
                                    )}
                                  >
                                    {char.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Section>

                <Section>
                  <div className="flex items-center justify-between">
                    <SectionTitle 
                      icon={Users} 
                      title={
                        <div className="flex items-center gap-1.5">
                          캐릭터 설정 불러오기
                          <Tooltip content={
                            <div className="text-[11px] leading-relaxed w-[240px]">
                              이름이 일치하는 캐릭터에게 등록된 이미지 URL과 지정색을 적용합니다.<br/><br/>
                              <span className="text-white/60">모든 데이터는 서버가 아니고 현재 브라우저(로컬 스토리지)에만 보관됩니다. 캐시를 지우거나 시크릿 모드를 사용하면 등록된 정보가 삭제됩니다.</span>
                            </div>
                          } position="right">
                            <HelpCircle className="w-3.5 h-3.5 text-white/30 hover:text-white/60 transition-colors cursor-help" />
                          </Tooltip>
                        </div>
                      } 
                    />
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-xl shadow-sm">
                    <button
                      onClick={() => setIsLibraryAccordionOpen(!isLibraryAccordionOpen)}
                      className="w-full flex items-center justify-between p-3 outline-none hover:bg-white/5 transition-colors"
                    >
                      <span className="text-[11px] font-bold text-white/70">로컬 스토리지에서 불러오기</span>
                        <ChevronDown className={cn("w-4 h-4 opacity-50 transition-transform", isLibraryAccordionOpen && "rotate-180")} />
                      </button>
                      {isLibraryAccordionOpen && (
                        <div className="border-t border-white/5 bg-black/20 flex flex-col rounded-b-xl">
                          <div className="flex items-center justify-between p-2 pb-2 border-b border-white/5">
                              <div className="flex items-center gap-2 px-1 text-[9px]">
                                  <button onClick={() => setLibrarySortMode('newest')} className={cn("transition-colors", librarySortMode === 'newest' ? "text-white font-bold" : "text-white/40 hover:text-white")}>최신순</button>
                                  <span className="text-white/20">|</span>
                                  <button onClick={() => setLibrarySortMode('oldest')} className={cn("transition-colors", librarySortMode === 'oldest' ? "text-white font-bold" : "text-white/40 hover:text-white")}>오래된순</button>
                                  <span className="text-white/20">|</span>
                                  <button onClick={() => setLibrarySortMode('alphabetical')} className={cn("transition-colors", librarySortMode === 'alphabetical' ? "text-white font-bold" : "text-white/40 hover:text-white")}>가나다순</button>
                              </div>
                              <button
                                  onClick={() => {
                                      setIsLibraryEditMode(!isLibraryEditMode);
                                      if (isLibraryEditMode) setRenamingLibraryId(null);
                                  }}
                                  className={cn("flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-bold transition-all border border-white/5", 
                                      isLibraryEditMode ? "bg-white/20 text-white" : "bg-white/5 hover:bg-white/10 text-white/40 hover:text-white")}
                              >
                                  <Pencil className="w-3 h-3" />
                                  {isLibraryEditMode ? "수정 완료" : "수정"}
                              </button>
                          </div>
                          <div className="max-h-[300px] overflow-y-auto flex flex-col">
                            {(() => {
                              const sortedLibrary = [...characterLibrary];
                              if (librarySortMode === 'alphabetical') {
                                sortedLibrary.sort((a, b) => a.name.localeCompare(b.name));
                              } else if (librarySortMode === 'oldest') {
                                sortedLibrary.sort((a, b) => {
                                  const ta = parseInt(a.id.replace('lib_', '')) || 0;
                                  const tb = parseInt(b.id.replace('lib_', '')) || 0;
                                  return ta - tb;
                                });
                              } else {
                                sortedLibrary.sort((a, b) => {
                                  const ta = parseInt(a.id.replace('lib_', '')) || 0;
                                  const tb = parseInt(b.id.replace('lib_', '')) || 0;
                                  return tb - ta;
                                });
                              }
                              
                              return sortedLibrary.length > 0 ? (
                                sortedLibrary.map(lib => {
                                  const libDateMs = parseInt(lib.id.replace('lib_', ''));
                                  const dateStr = isNaN(libDateMs) ? '' : `${new Date(libDateMs).getFullYear()}.${String(new Date(libDateMs).getMonth() + 1).padStart(2, '0')}.${String(new Date(libDateMs).getDate()).padStart(2, '0')}`;
                                  
                                  return (
                                    <div
                                      key={lib.id}
                                      onClick={() => !isLibraryEditMode && applyFromLibrary(lib)}
                                      className="flex flex-row items-center gap-3 px-3 hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5 last:border-b-0 min-h-[58px] py-2 h-auto box-border relative group/libitem"
                                    >
                                      
                                      <Tooltip unstyled position="right" content={
                                        lib.characters.length > 0 ? (
                                          <div className="grid grid-cols-2 gap-[1px] w-[171px] shadow-2xl bg-[#1a1a1a] rounded-lg overflow-hidden border border-white/20 p-[5px]">
                                            {[...lib.characters]
                                              .sort((a,b) => a.name.localeCompare(b.name))
                                              .slice(0,4)
                                              .map((c, i) => (
                                                  c.imageUrl ? (
                                                    <img key={i} src={c.imageUrl} className="w-[80px] h-[80px] object-cover rounded-none" alt="" referrerPolicy="no-referrer" />
                                                  ) : (
                                                    <div key={i} className="w-[80px] h-[80px] bg-[#1a1a1a] flex items-center justify-center shrink-0 rounded-none">
                                                      <User className="w-8 h-8 text-white/20" />
                                                    </div>
                                                  )
                                              ))}
                                          </div>
                                        ) : <></>
                                      }>
                                        <div className="w-8 h-8 rounded-lg outline-none shrink-0 border border-white/5 bg-[#1a1a1a] flex items-center justify-center relative">
                                          {lib.characters[0]?.imageUrl ? (
                                              <img src={lib.characters[0].imageUrl} className="w-full h-full object-cover rounded-lg" alt="" referrerPolicy="no-referrer" />
                                            ) : (
                                              <User className="w-4 h-4 text-white/20" />
                                          )}
                                        </div>
                                      </Tooltip>
                                      
                                      <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
                                        {renamingLibraryId === lib.id ? (
                                          <input 
                                            value={libraryNameInput}
                                            onChange={e => setLibraryNameInput(e.target.value)}
                                            onKeyDown={e => {
                                               if (e.key === 'Enter') {
                                                   setCharacterLibrary(prev => prev.map(l => l.id === lib.id ? {...l, name: libraryNameInput} : l));
                                                   setRenamingLibraryId(null);
                                               }
                                               if (e.key === 'Escape') {
                                                   setRenamingLibraryId(null);
                                               }
                                            }}
                                            onClick={e => e.stopPropagation()}
                                            autoFocus
                                            className="w-full text-[11px] font-bold px-1 h-[18px] border border-[#e6005c] rounded outline-none bg-black/20 text-white"
                                          />
                                        ) : (
                                          <div className="flex items-end gap-2 w-full h-[18px]">
                                            <div className="text-[11px] font-bold text-white/90 truncate leading-tight flex-1">{lib.name}</div>
                                            {dateStr && <span className="text-[9px] text-white/30 shrink-0 font-normal mb-[1px]">{dateStr}</span>}
                                          </div>
                                        )}
                                        <div className="text-[9px] mt-1.5 leading-[1.3] w-full flex flex-wrap gap-x-[3px] gap-y-1">
                                          {lib.characters.map((c, idx) => (
                                            <span key={idx} className="inline-flex items-center">
                                              <span className="inline-block w-1.5 h-1.5 rounded-full mr-1 shrink-0" style={{ backgroundColor: c.color || '#ffffff' }} />
                                              <span className="text-white/60">{c.name}</span>
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center justify-end shrink-0 h-full gap-1.5 pl-1">
                                        {isLibraryEditMode ? (
                                          <div className="flex items-center justify-end gap-1.5 w-full">
                                            {renamingLibraryId === lib.id ? (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setCharacterLibrary(prev => prev.map(l => l.id === lib.id ? {...l, name: libraryNameInput} : l));
                                                  setRenamingLibraryId(null);
                                                }}
                                                className="w-[26px] h-[26px] flex items-center justify-center rounded-md bg-[#e6005c]/20 hover:bg-[#e6005c]/30 border border-[#e6005c]/30 transition-colors"
                                              >
                                                <Check className="w-3.5 h-3.5 text-[#e6005c]" />
                                              </button>
                                            ) : (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setRenamingLibraryId(lib.id);
                                                  setLibraryNameInput(lib.name);
                                                }}
                                                className="w-[26px] h-[26px] flex items-center justify-center rounded-md bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                                              >
                                                <Pencil className="w-3 h-3 text-white/60" />
                                              </button>
                                            )}
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm('등록된 항목을 삭제하시겠습니까?')) {
                                                  setCharacterLibrary(prev => prev.filter(l => l.id !== lib.id));
                                                }
                                              }}
                                              className="w-[26px] h-[26px] flex items-center justify-center rounded-md bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors"
                                            >
                                              <Trash2 className="w-3 h-3 text-red-400" />
                                            </button>
                                          </div>
                                        ) : (
                                          <div className="flex items-center justify-end w-full">
                                            <div className="relative">
                                              <button
                                                ref={openLibraryDropdownId === lib.id ? libraryDropdownRef : null}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setOpenLibraryDropdownId(openLibraryDropdownId === lib.id ? null : lib.id);
                                                }}
                                                className="shrink-0 flex items-center justify-center outline-none relative z-10 w-7 h-7 rounded-md bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                                              >
                                                <User className="w-3.5 h-3.5 text-white/60" />
                                              </button>
                                     
                                              <PortalDropdown
                                                isOpen={openLibraryDropdownId === lib.id}
                                                onClose={() => setOpenLibraryDropdownId(null)}
                                                triggerRef={libraryDropdownRef}
                                                position="right"
                                              >
                                                <div
                                                  className="w-48 bg-[#222] border border-white/10 rounded-xl shadow-2xl overflow-hidden pointer-events-auto"
                                                >
                                                  <div className="max-h-[30vh] overflow-y-auto p-1 custom-scrollbar">
                                                    {lib.characters.map((c, i) => (
                                                      <button
                                                        key={i}
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          applyCharacterFromLibrary(c);
                                                          setOpenLibraryDropdownId(null);
                                                        }}
                                                        className="relative w-full text-left pl-4 pr-3 py-2 text-[11px] rounded-lg transition-colors text-white/60 hover:bg-white/5 hover:text-white flex items-center gap-2 outline-none group overflow-hidden"
                                                      >
                                                        <div className="absolute left-0 top-0 bottom-0 w-[6px]" style={{ backgroundColor: c.color || '#fff' }} />
                                                        <div className="w-[28px] h-[28px] rounded-md overflow-hidden bg-black/40 border border-white/5 shrink-0 flex items-center justify-center z-10">
                                                          {c.imageUrl ? (
                                                            <img src={c.imageUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                                                          ) : (
                                                            <User className="w-4 h-4 text-white/20" />
                                                          )}
                                                        </div>
                                                        <span className="truncate flex-1 font-medium group-hover:text-white transition-colors z-10 relative">{c.name}</span>
                                                      </button>
                                                    ))}
                                                  </div>
                                                </div>
                                              </PortalDropdown>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="text-center py-4 text-white/30 text-[10px]">등록된 도감이 없습니다.</div>
                              );
                            })()}
                          </div>
                          
                          <div className="p-2 border-t border-white/5">
                            <button
                              onClick={handleAddToLibrary}
                              className="w-full flex flex-col items-center justify-center p-3 border border-dashed border-white/20 rounded-xl hover:border-white/40 hover:bg-[#e6005c]/10 transition-colors text-white/60 hover:text-white group"
                            >
                              <div className="flex items-center gap-2 font-bold text-[11px] mb-1 group-hover:text-[#e6005c] transition-colors">
                                <Plus className="w-3.5 h-3.5" />
                                현재 설정을 등록
                              </div>
                              <span className="text-[9px] text-white/40 text-center max-w-[90%]">
                                토글이 켜져 있고, 이미지 URL이 설정된 캐릭터만 등록됩니다.
                              </span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                </Section>

                <Section>
                  <SectionTitle 
                    icon={List} 
                    title="캐릭터 목록" 
                    rightElement={
                      <button 
                        onClick={() => setCharSortMode(charSortMode === 'appearance' ? 'alphabetical' : 'appearance')}
                        className="flex items-center gap-1.5 px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-bold text-white/40 hover:text-white transition-all border border-white/5 mt-[-4px]"
                      >
                        <ArrowUpDown className="w-3 h-3" />
                        {charSortMode === 'appearance' ? '등장순' : '가나다순'}
                      </button>
                    }
                  />
                  {sortedCharOrder.length > 0 ? (
                    <div className="space-y-2">
                    {sortedCharOrder.map(charId => {
                      const char = charSettings[charId];
                      if (!char) return null;
                      return (
                        <div key={char.id} className="p-2 bg-white/5 rounded-2xl border border-white/5 shadow-sm flex items-center gap-2 relative group/charitem">
                          <div className="shrink-0">
                            <Toggle 
                              enabled={char.visible} 
                              onChange={(val) => {
                                const next = { ...charSettings, [char.id]: { ...char, visible: val } };
                                setCharSettings(next);
                                saveToHistory({ charSettings: next, tabSettings, cssFormat, fontSize, fontFamily, theme, disableOtherColor });
                              }} 
                            />
                          </div>
                          
                          {renamingChar === char.id ? (
                            <div className="flex gap-1 w-32 shrink-0">
                              <input 
                                type="text" 
                                value={newNameInput}
                                onChange={(e) => setNewNameInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') renameCharacter(char.id, newNameInput);
                                  if (e.key === 'Escape') setRenamingChar(null);
                                }}
                                className="w-full text-[10px] font-bold px-1 py-0.5 border border-[#e6005c] rounded outline-none bg-black/20 text-white"
                                autoFocus
                              />
                              <button 
                                onClick={() => renameCharacter(char.id, newNameInput)}
                                className="p-0.5 bg-[#e6005c] text-white rounded"
                              >
                                <CheckSquare className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 w-24 shrink-0 overflow-visible relative">
                              <CharacterNameWithTooltip name={char.name} />
                              <button 
                                onClick={() => { setRenamingChar(char.id); setNewNameInput(char.name); }}
                                className="p-0.5 text-white/20 hover:text-[#e6005c] transition-colors"
                              >
                                <Pencil className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          )}

                          <div className="relative shrink-0">
                            <button
                              onClick={(e) => {
                                if (activeColorPicker === char.id) {
                                  setActiveColorPicker(null);
                                  setColorPickerRect(null);
                                } else {
                                  setActiveColorPicker(char.id);
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
                              const next = { ...charSettings, [char.id]: { ...char, imageUrl: e.target.value } };
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
                </Section>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <Section>
                  <SectionTitle 
                    icon={Layout} 
                    title="테마 설정" 
                    rightElement={
                      <div className="flex gap-1.5 items-center">
                        {theme === 'dark' ? (
                          <>
                            <button 
                              onClick={() => { setDarkBgColor('#212121'); saveToHistory({ charSettings, tabSettings, cssFormat, fontSize, fontFamily, theme, darkBgColor: '#212121', lightBgColor, disableOtherColor }); }}
                              className={cn("w-[22px] h-[22px] rounded border transition-colors", darkBgColor === '#212121' ? "border-[#e6005c]" : "border-white/20 hover:border-white/40")}
                              style={{ backgroundColor: '#212121' }}
                            />
                            <button 
                              onClick={() => { setDarkBgColor('#121212'); saveToHistory({ charSettings, tabSettings, cssFormat, fontSize, fontFamily, theme, darkBgColor: '#121212', lightBgColor, disableOtherColor }); }}
                              className={cn("w-[22px] h-[22px] rounded border transition-colors", darkBgColor === '#121212' ? "border-[#e6005c]" : "border-white/20 hover:border-white/40")}
                              style={{ backgroundColor: '#121212' }}
                            />
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => { setLightBgColor('#ffffff'); saveToHistory({ charSettings, tabSettings, cssFormat, fontSize, fontFamily, theme, darkBgColor, lightBgColor: '#ffffff', disableOtherColor }); }}
                              className={cn("w-[22px] h-[22px] rounded border transition-colors shadow-sm", lightBgColor === '#ffffff' ? "border-[#e6005c]" : "border-white/20 hover:border-white/40")}
                              style={{ backgroundColor: '#ffffff' }}
                            />
                            <button 
                              onClick={() => { setLightBgColor('#f8f9fa'); saveToHistory({ charSettings, tabSettings, cssFormat, fontSize, fontFamily, theme, darkBgColor, lightBgColor: '#f8f9fa', disableOtherColor }); }}
                              className={cn("w-[22px] h-[22px] rounded border transition-colors shadow-sm", lightBgColor === '#f8f9fa' ? "border-[#e6005c]" : "border-white/20 hover:border-white/40")}
                              style={{ backgroundColor: '#f8f9fa' }}
                            />
                          </>
                        )}
                      </div>
                    }
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => { setTheme('dark'); saveToHistory({ charSettings, tabSettings, cssFormat, fontSize, fontFamily, theme: 'dark', darkBgColor, lightBgColor, disableOtherColor }); }}
                      className={`py-2 px-3 rounded-xl border-2 transition-all text-[11px] font-bold ${
                        theme === 'dark' 
                          ? 'bg-[#e6005c] border-[#e6005c] text-white' 
                          : 'bg-white/5 border-white/5 text-white/40 hover:border-white/10'
                      }`}
                    >
                      다크 모드
                    </button>
                    <button 
                      onClick={() => { setTheme('light'); saveToHistory({ charSettings, tabSettings, cssFormat, fontSize, fontFamily, theme: 'light', darkBgColor, lightBgColor, disableOtherColor }); }}
                      className={`py-2 px-3 rounded-xl border-2 transition-all text-[11px] font-bold ${
                        theme === 'light' 
                          ? 'bg-white border-white text-stone-900' 
                          : 'bg-white/5 border-white/5 text-white/40 hover:border-white/10'
                      }`}
                    >
                      화이트 모드
                    </button>
                  </div>
                </Section>

                <Section>
                  <SectionTitle icon={Type} title="폰트 설정" />
                  <div className="relative" ref={fontDropdownRef}>
                    <button
                      onClick={() => setIsFontDropdownOpen(!isFontDropdownOpen)}
                      className="w-full p-3 bg-white/5 border border-white/5 rounded-xl text-xs font-bold outline-none hover:border-white/20 transition-all flex items-center justify-between text-white/80"
                    >
                      <span style={{ fontFamily: fonts.find(f => f.name === fontFamily)?.value }}>{fontFamily}</span>
                      <ChevronDown className="w-4 h-4 opacity-50" />
                    </button>
                    
                    {isFontDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-2 w-full bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                        <div className="max-h-[50vh] overflow-y-auto custom-scrollbar p-1">
                          {fonts.map(f => (
                            <button
                              key={f.name}
                              onClick={() => {
                                setFontFamily(f.name);
                                saveToHistory({ charSettings, tabSettings, cssFormat, fontSize, fontFamily: f.name, theme, disableOtherColor });
                                setIsFontDropdownOpen(false);
                              }}
                              style={{ fontFamily: f.value }}
                              className={cn(
                                "w-full text-left px-3 py-2 text-xs rounded-lg transition-colors",
                                fontFamily === f.name ? "bg-[#e6005c] text-white font-bold" : "text-white/60 hover:bg-white/5 hover:text-white"
                              )}
                            >
                              {f.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Section>

                <Section>
                  <SectionTitle 
                    icon={Type} 
                    title="전체 크기 조절"
                    rightElement={
                      isEditingFontSize ? (
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
                      )
                    }
                  />
                  <div className="pt-1 pb-4">
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
                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#e6005c]"
                    />
                  </div>
                </Section>

                <Section>
                  <SectionTitle icon={Palette} title="CSS 출력 형식" />
                  <div className="grid grid-cols-2 gap-2">
                    <Tooltip position="top" className="text-center" content={
                      <>HTML 상단에 스타일 시트를 포함합니다. <span className="text-[#e6005c] font-medium">(권장)</span></>
                    }>
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
                    </Tooltip>
                    <Tooltip position="top" className="text-center" content={
                      <>각 태그에 직접 스타일을 부여합니다.<br />(티스토리 기본 스킨 사용 시)</>
                    }>
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
                    </Tooltip>
                  </div>
                </Section>
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

          <div className="flex items-center justify-between pt-2 mt-2 border-t border-white/5 relative z-50">
            <div className="flex items-center gap-1.5">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <button
                  type="button"
                  onClick={() => setRememberSettings(!rememberSettings)}
                  className={cn(
                    "relative inline-flex h-3.5 w-6 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    rememberSettings ? "bg-[#e6005c]" : "bg-white/20"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      rememberSettings ? "translate-x-2.5" : "translate-x-0"
                    )}
                  />
                </button>
                <span className={cn(
                    "text-[9px] font-bold transition-colors",
                    rememberSettings ? "text-white/80" : "text-white/30"
                )}>설정 기억하기</span>
              </label>
              <Tooltip position="top" content={
                <>
                  <p className="mb-2">
                    변경되는 설정을 브라우저에 자동 저장합니다. 모든 데이터는 서버 전송 없이 개인 기기에만 보관됩니다. <span className="text-white/30 text-[9px]">(브라우저 캐시 삭제 시 초기화)</span>
                  </p>
                  <p className="text-[#e6005c] font-medium">
                    토글을 끄면 저장된 데이터가 삭제되며, 새로고침 시 기본 설정으로 돌아갑니다.
                  </p>
                </>
              }>
                <HelpCircle className="w-3 h-3 text-white/20 hover:text-white/40 cursor-help transition-colors" />
              </Tooltip>
            </div>
            <span className="text-[8px] font-bold text-white/20 uppercase tracking-[0.3em]">v1.1.2</span>
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
            <div className="flex items-center">
              <div 
                className={cn(
                  "flex items-center overflow-hidden shrink-0 transition-all duration-200 ease-out border rounded-full",
                  isSearchExpanded 
                    ? "w-[240px] px-3 py-1.5 bg-white/5 border-white/10" 
                    : "w-8 h-8 bg-white/5 hover:bg-white/10 border-white/10 cursor-pointer justify-center"
                )}
                onClick={() => {
                  if (!isSearchExpanded) {
                    setIsSearchExpanded(true);
                    setTimeout(() => searchInputRef.current?.focus(), 50);
                  }
                }}
              >
                <Search className={cn("shrink-0", isSearchExpanded ? "w-3.5 h-3.5 text-white/50" : "w-3.5 h-3.5 text-white/60 hover:text-white")} />
                
                {isSearchExpanded && (
                  <>
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="로그 검색..."
                      className="bg-transparent border-none outline-none text-xs text-white ml-2 w-full placeholder:text-white/30"
                    />
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setIsSearchExpanded(false); 
                        setSearchQuery(''); 
                      }}
                      className="shrink-0 ml-1 p-0.5 rounded-full hover:bg-white/20 text-white/50 hover:text-white transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div className={cn("hidden xl:block h-4 w-px shrink-0", "bg-white/10")} />
            <p className={cn("hidden xl:block text-[11px] font-bold truncate", "text-white/30")}>
              총 <span className={cn("text-white/60", searchQuery && "text-[#e6005c]")}>{searchQuery ? displayItems.filter(item => item.isMatched).length : logs.length}</span>개의 로그 항목
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
              onClick={exportProject}
              className={cn(
                "flex items-center justify-center gap-2 px-3 xl:px-4 py-2 border rounded-xl transition-all text-[11px] font-bold shrink-0",
                "bg-white/5 hover:bg-white/10 border-white/10 text-white/60 hover:text-white"
              )}
              title="프로젝트 저장"
            >
              <FileJson className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xl:inline-block truncate">프로젝트 저장</span>
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
                        onClick={() => { copyToClipboard(getHtmlString()); setShowDownloadMenu(false); }}
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
                              const sortedPoints = splitPointsArray;
                              const sections: { start: number; end: number }[] = [];
                              let last = 0;
                              sortedPoints.forEach((p: number) => {
                                sections.push({ start: last, end: p });
                                last = p + 1;
                              });
                              sections.push({ start: last, end: mergedLogs.length - 1 });
                              
                              return sections.map((s, i) => {
                                let name = '';
                                if (s.start === 0) {
                                  name = sectionNames[0];
                                } else {
                                  const splitLog = mergedLogs[s.start - 1];
                                  const stableId = splitLog ? (splitLog.id.startsWith('merged:') ? splitLog.id.split(',').pop()! : splitLog.id) : '';
                                  name = sectionNames[stableId];
                                }
                                const finalName = name || `섹션 ${i + 1}`;

                                return (
                                  <div key={i} className="flex items-center gap-2 pr-2 group">
                                    <button 
                                      onClick={() => { downloadHtml(s); setShowDownloadMenu(false); }}
                                      className="flex-1 flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-colors text-left"
                                    >
                                      <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[9px] font-bold text-white/40 group-hover:text-white/60">
                                        {i + 1}
                                      </div>
                                      <div>
                                        <p className="text-[11px] font-bold text-white truncate max-w-[120px]">{finalName}</p>
                                        <p className="text-[9px] text-white/30">{s.start + 1} ~ {s.end + 1}번 블록</p>
                                      </div>
                                    </button>
                                    <button 
                                      onClick={() => { copyToClipboard(getHtmlString(s)); setShowDownloadMenu(false); }}
                                      className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/30 hover:text-white"
                                      title="HTML 복사"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                );
                              });
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
          className="flex-1 overflow-y-auto custom-scrollbar relative min-w-0 transition-colors"
          style={{ backgroundColor: theme === 'dark' ? darkBgColor : lightBgColor }}
        >
          <div className="w-full min-w-0 min-h-full flex flex-col">
            {logs.length > 0 ? (
              <div className="relative group/preview">
                <div 
                  className="min-h-screen relative transition-colors"
                  style={{ backgroundColor: theme === 'dark' ? darkBgColor : lightBgColor }}
                >
                  {/* Top Section Name Input */}
                  <div id="section-0" className="max-w-[800px] mx-auto px-4 pt-2 font-sans relative">
                    <div className="flex items-end justify-between max-w-full">
                      <div className="bg-[#e6005c] rounded-t-lg px-4 py-1 flex items-center shadow-lg max-w-sm">
                        <SectionNameEditor 
                          initialName={sectionNames[0] || ''}
                          defaultName="섹션 1"
                          onSave={(name) => {
                            const next = { ...sectionNames, [0]: name };
                            setSectionNames(next);
                            saveToHistory({ sectionNames: next });
                          }}
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
                    backgroundColor: theme === 'dark' ? darkBgColor : lightBgColor,
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
                        z-index: 50;
                        opacity: 0;
                        transition: opacity 0.2s;
                        display: flex;
                        gap: 8px;
                        pointer-events: none;
                      }
                      .log-item-wrapper:hover .split-trigger,
                      .split-trigger:hover { 
                        opacity: 1; 
                        pointer-events: auto;
                      }
                      .split-trigger::before {
                        content: '';
                        position: absolute;
                        top: -6px;
                        left: -6px;
                        right: -6px;
                        bottom: -6px;
                        z-index: -1;
                      }
                      .virtualize-row:hover {
                        z-index: 50 !important;
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

                    <div
                      ref={listRef}
                      style={{
                        height: `${rowVirtualizer.getTotalSize()}px`,
                        width: '100%',
                        position: 'relative',
                        marginTop: '-8px'
                      }}
                    >
                      {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                        const displayItem = displayItems[virtualItem.index];
                        const { log, isMatched, originalIndex: globalIdx } = displayItem;
                        const idx = globalIdx;
                        const isPrevSameTab = idx > 0 && mergedLogs[idx - 1].tab === log.tab;
                        const isNextSameTab = idx < mergedLogs.length - 1 && mergedLogs[idx + 1].tab === log.tab;
                        const stableId = log.id.startsWith('merged:') ? log.id.split(',').pop()! : log.id;
                        
                        const isPrevNarration = idx > 0 && mergedLogs[idx - 1].charId === narrationCharacter && (tabSettings[mergedLogs[idx - 1].tabId]?.format || 'main') === 'main';
                        const isNextNarration = idx < mergedLogs.length - 1 && mergedLogs[idx + 1].charId === narrationCharacter && (tabSettings[mergedLogs[idx + 1].tabId]?.format || 'main') === 'main';

                        return (
                          <div
                            key={virtualItem.key}
                            data-index={virtualItem.index}
                            ref={rowVirtualizer.measureElement}
                            className="virtualize-row"
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              transform: `translateY(${virtualItem.start}px)`,
                            }}
                          >
                            <LogItem 
                              idx={globalIdx}
                              isMatched={isMatched}
                              stableId={stableId}
                              log={log}
                              tabSet={tabSettings[log.tabId]}
                              char={charSettings[log.charId] || { id: log.charId, name: log.name, color: log.color, visible: true, imageUrl: '' }}
                              charSettings={charSettings}
                              theme={theme}
                              disableOtherColor={disableOtherColor}
                              fontSize={fontSize}
                              narrationCharacter={narrationCharacter}
                              insertedImages={insertedImages}
                              splitPoints={splitPoints}
                              sectionNames={sectionNames}
                              imageInputIdx={imageInputIdx}
                              onToggleSplit={(id: string) => {
                                const next = new Set(splitPoints);
                                if (next.has(id)) next.delete(id);
                                else next.add(id);
                                setSplitPoints(next);
                                saveToHistory({ splitPoints: Array.from(next) });
                              }}
                              onRenameSection={(id: string, name: string) => {
                                const next = { ...sectionNames, [id]: name };
                                setSectionNames(next);
                                saveToHistory({ sectionNames: next });
                              }}
                              onInsertImage={(id: string) => {
                                setImageInputIdx(id === imageInputIdx ? null : id);
                              }}
                              onAddImageUrl={(id: string, url: string) => {
                                const next = { ...insertedImages };
                                next[id] = next[id] ? [...next[id], { url, width: '400', align: 'center' }] : [{ url, width: '400', align: 'center' }];
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
                                  next[id] = [...next[id]];
                                  next[id][imgIdx] = { ...next[id][imgIdx], width };
                                  setInsertedImages(next);
                                  saveToHistory({ insertedImages: next });
                                }
                              }}
                              onUpdateImageAlign={(id: string, imgIdx: number, align: 'left' | 'center' | 'right') => {
                                const next = { ...insertedImages };
                                if (next[id] && next[id][imgIdx]) {
                                  next[id] = [...next[id]];
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
                              isPrevSplit={idx > 0 && splitPoints.has(mergedLogs[idx - 1].id.startsWith('merged:') ? mergedLogs[idx - 1].id.split(',').pop()! : mergedLogs[idx - 1].id)}
                              mergeTabStyles={mergeTabStyles}
                              showTabNames={showTabNames}
                              hideEmptyAvatars={hideEmptyAvatars}
                              isPrevNarration={isPrevNarration}
                              isNextNarration={isNextNarration}
                            />
                          </div>
                        );
                      })}
                    </div>
                    {/* Spacer for visibility (Preview only) */}
                    <div className="w-full shrink-0" style={{ height: '60px' }} />
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
                          const tabId = activeColorPicker.replace('tab-', '');
                          const next = { ...tabSettings, [tabId]: { ...tabSettings[tabId], color: newColor } };
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
              <div className="flex-1 flex flex-col items-center justify-center space-y-6 py-40">
                <div className="relative">
                  <div className={cn(
                    "w-32 h-32 rounded-full flex items-center justify-center",
                    theme === 'dark' ? "bg-white/5" : "bg-stone-900/5"
                  )}>
                    <Upload className={cn("w-12 h-12", theme === 'dark' ? "text-white/10" : "text-stone-900/20")} />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <p className={cn(
                    "text-2xl font-bold tracking-tight",
                    theme === 'dark' ? "text-white/40" : "text-stone-900/40"
                  )}>로그 파일을 기다리고 있어요</p>
                  <p className={cn(
                    "text-sm font-medium",
                    theme === 'dark' ? "text-white/20" : "text-stone-900/40"
                  )}>CCFOLIA에서 추출한 HTML 파일을 업로드하여 시작하세요</p>
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
        {logs.length > 0 && (
          <div 
            className="z-50 flex flex-col items-end"
            style={{ position: 'fixed', bottom: '19px', right: '19px' }}
            onMouseEnter={() => setIsTocHovered(true)}
            onMouseLeave={() => setIsTocHovered(false)}
          >
            <AnimatePresence>
              {isTocHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="mb-3 bg-[#1a1a1a]/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[350px] w-56 transform origin-bottom-right"
                >
                  <div className="px-3 border-b border-white/10 bg-white/5 flex items-center justify-center shrink-0" style={{ height: '26px' }}>
                    <h3 className="text-[10px] font-bold text-white/60 uppercase tracking-widest text-center m-0 leading-none">섹션 이동</h3>
                  </div>
                  <div className="overflow-y-auto custom-scrollbar flex-1 p-2 space-y-1">
                    {sectionsList.map((sec) => (
                      <button
                        key={sec.id}
                        onClick={() => scrollToSection(sec.targetOriginalIndex, sec.id)}
                        className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[12px] font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <span className="truncate pr-2">{sec.name}</span>
                        <span className="text-[10px] font-mono text-white/30 whitespace-nowrap">{sec.startBlock}~{sec.endBlock}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div 
              className="bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-black/80 transition-colors shadow-lg cursor-pointer shrink-0"
              style={{ width: '50px', height: '50px', borderRadius: '50%' }}
            >
              <List className="w-6 h-6" />
            </div>
          </div>
        )}
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
