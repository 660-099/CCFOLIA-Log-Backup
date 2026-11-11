import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Download, ChevronRight, FileJson, HelpCircle } from 'lucide-react';
import { ProjectSaveOptions } from '../types';
import { DEFAULT_PROJECT_SAVE_OPTIONS } from '../store/useSettingsStore';
import { cn } from '../utils';

// Session-level in-memory accordion state (resets on browser refresh, preserved across modal toggles)
let sessionAccordionState: Record<string, boolean> = {
  chars: false,
  tabs: false,
  design: false,
  dialogue: false
};

export function normalizeOptions(raw: any): ProjectSaveOptions {
  if (!raw || typeof raw !== 'object') return DEFAULT_PROJECT_SAVE_OPTIONS;
  
  return {
    chars: {
      enabled: typeof raw.chars === 'object' && raw.chars !== null ? !!raw.chars.enabled : (raw.chars !== false),
      charNames: typeof raw.chars?.charNames === 'boolean' ? raw.chars.charNames : true,
      narration: typeof raw.chars?.narration === 'boolean' ? raw.chars.narration : true,
      charColors: typeof raw.chars?.charColors === 'boolean' ? raw.chars.charColors : true,
      charImages: typeof raw.chars?.charImages === 'boolean' ? raw.chars.charImages : true,
    },
    tabs: {
      enabled: typeof raw.tabs === 'object' && raw.tabs !== null ? !!raw.tabs.enabled : (raw.tabs !== false),
      tabMergeSettings: typeof raw.tabs?.tabMergeSettings === 'boolean' ? raw.tabs.tabMergeSettings : true,
      tabNames: typeof raw.tabs?.tabNames === 'boolean' ? raw.tabs.tabNames : true,
      tabIndividualSettings: typeof raw.tabs?.tabIndividualSettings === 'boolean' ? raw.tabs.tabIndividualSettings : true,
    },
    design: {
      enabled: typeof raw.design === 'object' && raw.design !== null ? !!raw.design.enabled : (raw.design !== false),
      themeBg: typeof raw.design?.themeBg === 'boolean' ? raw.design.themeBg : true,
      logDisplay: typeof raw.design?.logDisplay === 'boolean' ? raw.design.logDisplay : true,
      fontAndSpacing: typeof raw.design?.fontAndSpacing === 'boolean' ? raw.design.fontAndSpacing : true,
      cssFormat: typeof raw.design?.cssFormat === 'boolean' ? raw.design.cssFormat : true,
    },
    dialogue: {
      enabled: typeof raw.dialogue === 'object' && raw.dialogue !== null ? !!raw.dialogue.enabled : (raw.dialogue !== false),
      dialogueEdits: typeof raw.dialogue?.dialogueEdits === 'boolean' ? raw.dialogue.dialogueEdits : true,
      bgm: typeof raw.dialogue?.bgm === 'boolean' ? raw.dialogue.bgm : true,
      illustrations: typeof raw.dialogue?.illustrations === 'boolean' ? raw.dialogue.illustrations : true,
      splits: typeof raw.dialogue?.splits === 'boolean' ? raw.dialogue.splits : true,
    },
  };
}

interface ProjectSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: ProjectSaveOptions;
  onOptionsChange: (newOptions: ProjectSaveOptions) => void;
  onExport: () => void;
  theme?: 'light' | 'dark';
}

export const ProjectSaveModal: React.FC<ProjectSaveModalProps> = ({
  isOpen,
  onClose,
  options,
  onOptionsChange,
  onExport,
  theme = 'dark'
}) => {
  const safeOptions = normalizeOptions(options);

  // Accordion state initialized from in-memory session (initially all false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => ({ ...sessionAccordionState }));
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);

  if (!isOpen) return null;

  const toggleExpand = (cat: string) => {
    setExpanded(prev => {
      const next = { ...prev, [cat]: !prev[cat] };
      sessionAccordionState = next;
      return next;
    });
  };

  // Helper to update specific sub-item
  const handleSubToggle = (cat: keyof ProjectSaveOptions, subKey: string, checked: boolean) => {
    const currentCat = { ...(safeOptions[cat] || DEFAULT_PROJECT_SAVE_OPTIONS[cat]) } as any;
    currentCat[subKey] = checked;

    const subKeys = Object.keys(currentCat).filter(k => k !== 'enabled');
    const anyChecked = subKeys.some(k => currentCat[k]);
    currentCat.enabled = anyChecked;

    onOptionsChange({
      ...safeOptions,
      [cat]: currentCat
    });
  };

  // Helper to toggle entire category
  const handleCatToggle = (cat: keyof ProjectSaveOptions, checked: boolean) => {
    const currentCat = { ...(safeOptions[cat] || DEFAULT_PROJECT_SAVE_OPTIONS[cat]) } as any;
    currentCat.enabled = checked;
    Object.keys(currentCat).forEach(k => {
      currentCat[k] = checked;
    });

    onOptionsChange({
      ...safeOptions,
      [cat]: currentCat
    });
  };

  const getCatState = (cat: keyof ProjectSaveOptions) => {
    const currentCat = (safeOptions[cat] || DEFAULT_PROJECT_SAVE_OPTIONS[cat]) as any;
    const subKeys = Object.keys(currentCat).filter(k => k !== 'enabled');
    const checkedCount = subKeys.filter(k => currentCat[k]).length;
    const isAll = checkedCount === subKeys.length;
    const isSome = checkedCount > 0 && checkedCount < subKeys.length;
    const isNone = checkedCount === 0;
    return { isAll, isSome, isNone };
  };

  const categories = [
    {
      key: 'chars' as const,
      title: '캐릭터 설정',
      items: [
        { key: 'charNames', label: '캐릭터 이름' },
        { key: 'narration', label: '나레이션 캐릭터' },
        { key: 'charColors', label: '색상' },
        { key: 'charImages', label: '스탠딩 이미지' }
      ]
    },
    {
      key: 'tabs' as const,
      title: '탭 설정',
      items: [
        { key: 'tabMergeSettings', label: '통합 설정' },
        { key: 'tabNames', label: '탭 이름' },
        { key: 'tabIndividualSettings', label: '개별 탭 설정 (on/off, 서식 등)' }
      ]
    },
    {
      key: 'design' as const,
      title: '디자인 서식',
      items: [
        { key: 'themeBg', label: '테마 및 배경색' },
        { key: 'logDisplay', label: '로그 표시 설정' },
        { key: 'fontAndSpacing', label: '폰트 및 크기/간격' },
        { key: 'cssFormat', label: 'CSS 출력 형식' }
      ]
    },
    {
      key: 'dialogue' as const,
      title: '대사 및 연출 편집',
      items: [
        { key: 'dialogueEdits', label: '대사 수정 (서식, 내용, 삭제 및 추가, 위치, 표정)' },
        { key: 'bgm', label: 'BGM' },
        { key: 'illustrations', label: '삽화' },
        { key: 'splits', label: '섹션 분할' }
      ]
    }
  ];

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="absolute right-0 mt-2 w-[276px] bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl z-50 p-3.5 space-y-2.5 text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-1.5 min-w-0 relative">
            <FileJson className="w-4 h-4 text-[#e6005c] shrink-0" />
            <span className="font-bold text-[13px] text-white">프로젝트 저장</span>
            
            {/* Tooltip Help Icon */}
            <div 
              className="relative flex items-center"
              onMouseEnter={() => setShowHelpTooltip(true)}
              onMouseLeave={() => setShowHelpTooltip(false)}
            >
              <button
                type="button"
                onClick={() => setShowHelpTooltip(prev => !prev)}
                className="p-1 rounded-full text-white/40 hover:text-white transition-colors cursor-help focus:outline-none"
                aria-label="프로젝트 저장 도움말"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>

              {showHelpTooltip && (
                <div 
                  className="absolute left-0 top-full mt-2 w-[240px] p-2.5 bg-[#252525] border border-white/20 rounded-xl shadow-2xl z-[100] text-[11px] leading-relaxed text-white/90 pointer-events-none"
                >
                  <p className="mb-1 text-white/90 font-normal">
                    섹션 분할, 삽화, BGM, 탭, 캐릭터 설정 등 현재의 모든 편집 데이터를 JSON 파일로 내보냅니다. 원본 로그를 업로드한 상태에서 이 파일을 불러오면 이전 작업 상태를 그대로 복원합니다.
                  </p>
                  <p className="text-[#ff4d88] font-medium text-[10px]">
                    ※ 프로젝트 파일은 편집 정보만 포함하므로, 원본 로그 파일이 없으면 복원되지 않습니다.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content: Balanced Spacing & Dividers between Categories */}
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar pr-0.5 divide-y divide-white/5">
          {categories.map((cat) => {
            const { isAll, isSome } = getCatState(cat.key);
            const isOpen = expanded[cat.key];
            const catConfig = (safeOptions[cat.key] || DEFAULT_PROJECT_SAVE_OPTIONS[cat.key]) as any;

            return (
              <div
                key={cat.key}
                className="py-1.5 first:pt-0.5 last:pb-0.5 select-none"
              >
                {/* Category Header Row (Left checkbox, Right expand trigger) */}
                <div className="flex items-center justify-between py-0.5 px-1">
                  {/* Left: Checkbox + Title */}
                  <label className="flex items-center gap-2.5 cursor-pointer py-0.5">
                    <input
                      type="checkbox"
                      checked={isAll}
                      ref={(el) => {
                        if (el) el.indeterminate = isSome;
                      }}
                      onChange={(e) => handleCatToggle(cat.key, e.target.checked)}
                      className="w-4 h-4 rounded border-white/30 bg-black/40 accent-[#e6005c] cursor-pointer shrink-0"
                    />
                    <span className="font-bold text-[12.5px] tracking-tight text-white select-none">
                      {cat.title}
                    </span>
                  </label>

                  {/* Right: Broad, comfortable click zone for expanding/collapsing */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(cat.key)}
                    className="flex-1 flex items-center justify-end py-1 pl-4 cursor-pointer focus:outline-none"
                    aria-label={isOpen ? "접기" : "세부 항목 펼치기"}
                  >
                    <div className="p-0.5 rounded text-white/40 hover:text-white transition-colors">
                      <ChevronRight
                        className={cn(
                          "w-4 h-4 transition-transform duration-200",
                          isOpen ? "rotate-90 text-[#e6005c]" : "text-white/40"
                        )}
                      />
                    </div>
                  </button>
                </div>

                {/* Sub-Items Accordion Content */}
                {isOpen && (
                  <div className="ml-2 pl-4 mt-1 mb-1 space-y-1.5 border-l border-white/10">
                    {cat.items.map((item) => (
                      <label
                        key={item.key}
                        className="flex items-center gap-2 py-0.5 cursor-pointer select-none text-white/65 hover:text-white transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={!!catConfig[item.key]}
                          onChange={(e) => handleSubToggle(cat.key, item.key, e.target.checked)}
                          className="w-3.5 h-3.5 rounded border-white/20 bg-black/40 accent-[#e6005c] cursor-pointer shrink-0"
                        />
                        <span className="text-[11px] font-normal leading-tight">
                          {item.label}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-white/5">
          <button
            onClick={() => {
              onExport();
              onClose();
            }}
            className="w-full py-2.5 bg-[#e6005c] hover:bg-[#ff0066] text-white rounded-xl text-[12px] font-bold transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>선택 항목으로 JSON 저장</span>
          </button>
        </div>
      </motion.div>
    </>
  );
};
