import React from 'react';
import { AlertCircle } from 'lucide-react';
import { parseYoutubeUrl } from '../utils/youtube';
import { useSettings } from '../contexts/SettingsContext';

interface BgmItemProps {
  id: string;
  title: string;
  url: string;
  videoId?: string;
  startTime?: number;
  useTimestamp?: boolean;
  isPlaying?: boolean;
  tabFormat?: 'main' | 'other' | 'info' | 'secret';
  tabColor?: string;
  tabTextColor?: string;
  onSelectBgm: (track: { id: string; title: string; url: string; videoId: string; startTime: number }) => void;
}

export const BgmItem: React.FC<BgmItemProps> = ({
  id,
  title,
  url,
  videoId,
  startTime = 0,
  useTimestamp = true,
  isPlaying = false,
  tabFormat = 'main',
  tabColor,
  tabTextColor,
  onSelectBgm,
}) => {
  const { theme } = useSettings();
  const isDark = theme === 'dark';

  // Video ID 및 유효성 재검증
  const parsed = parseYoutubeUrl(url, useTimestamp);
  const effectiveVideoId = videoId || parsed.videoId;
  const effectiveStartTime = startTime || parsed.startTime;
  const isValid = Boolean(effectiveVideoId);

  const isSecret = tabFormat === 'secret';
  const isInfo = tabFormat === 'info';

  const hasTabBg = isSecret || isInfo;
  const defaultHighContrastTextColor = isDark ? '#FFFFFF' : '#1F2937';
  const buttonTextColor = tabTextColor || defaultHighContrastTextColor;

  const customStyle: React.CSSProperties = isSecret && tabColor ? {
    borderColor: `${tabColor}88`,
    color: buttonTextColor,
    backgroundColor: isPlaying ? `${tabColor}33` : (isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.85)'),
    boxShadow: isDark ? `0 2px 8px ${tabColor}15` : `0 1px 4px rgba(0,0,0,0.06)`,
  } : isInfo ? {
    borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)',
    color: buttonTextColor,
    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(255, 255, 255, 0.85)',
  } : !isDark ? {
    borderColor: 'rgba(0, 0, 0, 0.15)',
    color: '#374151',
    backgroundColor: isPlaying ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.04)',
  } : {
    borderColor: isPlaying ? '#EEEEEE' : 'rgba(255, 255, 255, 0.15)',
    color: isPlaying ? '#EEEEEE' : '#E5E7EB',
    backgroundColor: isPlaying ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.06)',
  };

  const iconFill = (isSecret && tabColor) ? tabColor : 'currentColor';

  return (
    <div className="bgm-center-wrapper my-2 flex justify-center items-center relative">
      {isValid ? (
        /* 유효한 BGM 알약 버튼 (사용자 제공 디자인 복제) */
        <div
          onClick={() =>
            onSelectBgm({
              id,
              title: title || '🎧 BGM',
              url,
              videoId: effectiveVideoId,
              startTime: effectiveStartTime,
            })
          }
          style={customStyle}
          className={`custom-bgm ${isPlaying ? 'active' : ''} ${isSecret ? 'custom-bgm-secret' : ''}`}
        >
          {isPlaying ? (
            <svg 
              className="icon w-3.5 h-3.5 shrink-0" 
              style={{ fill: iconFill }}
              viewBox="0 0 24 24"
            >
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          ) : (
            <svg 
              className="icon w-3.5 h-3.5 shrink-0" 
              style={{ fill: iconFill }}
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
          <span style={{ color: hasTabBg ? buttonTextColor : (!isDark ? '#374151' : '#E5E7EB'), fontWeight: hasTabBg ? 600 : 500 }}>
            {title || '🎧 BGM'}
          </span>
        </div>
      ) : (
        /* 유효하지 않은 유튜브 링크 플레이스홀더 */
        <div className="flex items-center gap-2 px-3 py-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg select-none">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span className="font-medium">[유효하지 않은 유튜브 링크]</span>
          <span className="text-[11px] opacity-70 truncate max-w-[200px] sm:max-w-[300px]">
            ({url || '링크 없음'})
          </span>
        </div>
      )}
    </div>
  );
};
