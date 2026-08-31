import React, { useState } from 'react';
import { parseYoutubeUrl } from '../utils/youtube';
import { useSettings } from '../contexts/SettingsContext';

interface BgmInlineInputProps {
  initialTitle?: string;
  initialUrl?: string;
  initialUseTimestamp?: boolean;
  onSave: (data: { title: string; url: string; videoId: string; startTime: number; useTimestamp: boolean }) => void;
  onCancel?: () => void;
  isEditing?: boolean;
}

export const BgmInlineInput: React.FC<BgmInlineInputProps> = ({
  initialTitle = '🎧 BGM',
  initialUrl = '',
  initialUseTimestamp,
  onSave,
  onCancel,
  isEditing = false,
}) => {
  const { theme } = useSettings();
  const isDark = theme === 'dark';

  const [title, setTitle] = useState(initialTitle);
  const [url, setUrl] = useState(initialUrl);

  // 타임스탬프 체크박스 state (localStorage 연동)
  const [useTimestamp, setUseTimestamp] = useState<boolean>(() => {
    if (initialUseTimestamp !== undefined) return initialUseTimestamp;
    const saved = localStorage.getItem('bgm_use_timestamp');
    return saved !== null ? saved === 'true' : true;
  });

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setUseTimestamp(checked);
    localStorage.setItem('bgm_use_timestamp', String(checked));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseYoutubeUrl(url, useTimestamp);
    onSave({
      title: title.trim() || '🎧 BGM',
      url: url.trim(),
      videoId: parsed.videoId,
      startTime: parsed.startTime,
      useTimestamp,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`mx-4 my-2 p-4 border border-dashed rounded-xl flex flex-col gap-3 ${
        isDark
          ? 'bg-white/5 border-white/20 text-white'
          : 'bg-stone-50 border-stone-200 text-stone-800 shadow-sm'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* 좌측 입력칸: BGM 제목 */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="🎧 BGM"
          className={`px-3 py-2 text-[11px] h-9 rounded-lg border focus:outline-none focus:ring-1 focus:ring-[#e6005c] ${
            isDark
              ? 'bg-black/40 border-white/20 text-white placeholder-white/30'
              : 'bg-white border-stone-200 text-stone-900 placeholder-stone-400'
          }`}
          style={{ minWidth: '120px', flex: '1' }}
          required
        />

        {/* 우측 입력칸: 유튜브 링크 */}
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="유튜브 링크 붙여넣기 (https://youtu.be/...)"
          className={`px-3 py-2 text-[11px] h-9 rounded-lg border focus:outline-none focus:ring-1 focus:ring-[#e6005c] ${
            isDark
              ? 'bg-black/40 border-white/20 text-white placeholder-white/30'
              : 'bg-white border-stone-200 text-stone-900 placeholder-stone-400'
          }`}
          style={{ flex: '2' }}
          required
        />

        {/* 추가/저장 및 취소 버튼 */}
        <div className="flex gap-2 shrink-0">
          <button
            type="submit"
            className="px-4 py-2 bg-[#e6005c] hover:bg-[#ff007f] text-white rounded-lg text-[11px] h-9 font-bold flex items-center justify-center transition-colors"
          >
            {isEditing ? '저장' : '추가'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className={`px-4 py-2 rounded-lg text-[11px] h-9 font-bold flex items-center justify-center transition-colors border ${
                isDark ? "bg-white/10 hover:bg-white/20 border-white/10 text-white" : "bg-white hover:bg-stone-50 border-stone-200 text-stone-700"
              }`}
            >
              취소
            </button>
          )}
        </div>
      </div>

      {/* 하단 타임스탬프 체크박스 */}
      <div className="flex items-center justify-start gap-1.5 text-xs select-none">
        <label className="flex items-center gap-1.5 cursor-pointer opacity-80 hover:opacity-100">
          <input
            type="checkbox"
            checked={useTimestamp}
            onChange={handleCheckboxChange}
            className="rounded border-stone-400 text-[#e6005c] focus:ring-[#e6005c] w-3.5 h-3.5"
          />
          <span className="text-[11px]">링크의 타임스탬프(&t=) 반영</span>
        </label>
      </div>
    </form>
  );
};
