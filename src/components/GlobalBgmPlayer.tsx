import React, { useState, useEffect, useRef, useCallback } from 'react';
import { formatTime } from '../utils/youtube';
import { useSettings } from '../contexts/SettingsContext';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: any;
  }
}

export interface BgmTrack {
  id?: string;
  title: string;
  url: string;
  videoId: string;
  startTime?: number;
}

interface GlobalBgmPlayerProps {
  currentTrack: BgmTrack | null;
  onTrackChange?: (track: BgmTrack | null) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

export const GlobalBgmPlayer: React.FC<GlobalBgmPlayerProps> = ({
  currentTrack,
  onPlayStateChange,
}) => {
  const { theme } = useSettings();
  const isDark = theme === 'dark';
  const darkBgColor = '#212121';
  const lightBgColor = '#ffffff';
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLooping, setIsLooping] = useState(true);
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const isDraggingProgressRef = useRef(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const progressIntervalRef = useRef<any>(null);

  useEffect(() => {
    isDraggingProgressRef.current = isDraggingProgress;
  }, [isDraggingProgress]);

  useEffect(() => {
    if (onPlayStateChange) {
      onPlayStateChange(isPlaying);
    }
  }, [isPlaying, onPlayStateChange]);

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const startProgressTimer = useCallback(() => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = setInterval(() => {
      // Don't update time while dragging to prevent fighting with user input
      // Also need to check if we're not dragging before reading from player
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        const dur = playerRef.current.getDuration() || 0;
        setDuration(dur);
        if (!isDraggingProgressRef.current) {
          const curr = playerRef.current.getCurrentTime() || 0;
          setCurrentTime(curr);
        }
      }
    }, 500);
  }, []);

  const stopProgressTimer = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  // Using a ref for isLooping so inside onStateChange it always reads latest
  const isLoopingRef = useRef(isLooping);
  useEffect(() => {
    isLoopingRef.current = isLooping;
  }, [isLooping]);

  useEffect(() => {
    if (!currentTrack || !currentTrack.videoId) {
      if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
        playerRef.current.pauseVideo();
      }
      setIsPlaying(false);
      return;
    }

    const initOrLoadPlayer = () => {
      if (!window.YT || !window.YT.Player) {
        setTimeout(initOrLoadPlayer, 200);
        return;
      }

      if (!playerRef.current) {
        playerRef.current = new window.YT.Player('preview-yt-player-container', {
          height: '100%',
          width: '100%',
          videoId: currentTrack.videoId,
          playerVars: {
            autoplay: 1,
            controls: 0,
            start: currentTrack.startTime || 0,
            playsinline: 1,
            rel: 0,
          },
          events: {
            onReady: (event: any) => {
              if (currentTrack.startTime) {
                event.target.seekTo(currentTrack.startTime, true);
              }
              event.target.playVideo();
              setIsPlaying(true);
              startProgressTimer();
            },
            onStateChange: (event: any) => {
              if (event.data === 1) { // PLAYING
                setIsPlaying(true);
                startProgressTimer();
              } else if (event.data === 2) { // PAUSED
                setIsPlaying(false);
                stopProgressTimer();
              } else if (event.data === 0) { // ENDED
                if (isLoopingRef.current) {
                  event.target.seekTo(currentTrack.startTime || 0, true);
                  event.target.playVideo();
                } else {
                  setIsPlaying(false);
                  stopProgressTimer();
                }
              }
            }
          }
        });
      } else {
        if (typeof playerRef.current.loadVideoById === 'function') {
          playerRef.current.loadVideoById({
            videoId: currentTrack.videoId,
            startSeconds: currentTrack.startTime || 0,
          });
          setIsPlaying(true);
          startProgressTimer();
        }
      }
    };

    setIsExpanded(true); 
    initOrLoadPlayer();
  }, [currentTrack, startProgressTimer, stopProgressTimer]);

  useEffect(() => {
    if (playerRef.current && playerRef.current.getIframe) {
      const iframe = playerRef.current.getIframe();
      if (iframe && iframe.style) {
        iframe.style.transform = 'scale(1.5)';
        iframe.style.transformOrigin = 'center center';
      }
    }
  }, [currentTrack]);

  const togglePlayPause = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      if (typeof playerRef.current.pauseVideo === 'function') {
        playerRef.current.pauseVideo();
      }
      setIsPlaying(false);
      stopProgressTimer();
    } else {
      if (typeof playerRef.current.playVideo === 'function') {
        playerRef.current.playVideo();
      }
      setIsPlaying(true);
      startProgressTimer();
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isDraggingProgressRef.current = true;
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
  };

  const handleSeekMouseUp = (e: any) => {
    isDraggingProgressRef.current = false;
    setIsDraggingProgress(false);
    const newTime = parseFloat(e.target.value);
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(newTime, true);
    }
  };

  const handleSeekMouseDown = () => {
    isDraggingProgressRef.current = true;
    setIsDraggingProgress(true);
  };

  const toggleLoop = () => {
    setIsLooping(prev => !prev);
  };

  const toggleCard = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(prev => !prev);
  };

  const youtubeUrl = currentTrack?.videoId
    ? `https://www.youtube.com/watch?v=${currentTrack.videoId}${currentTrack.startTime ? `&t=${currentTrack.startTime}s` : ''}`
    : '#';

  if (!currentTrack) return null;

  return (
    <>
      <style>{`
        .global-wrapper {
          position: fixed !important; bottom: 20px !important; right: 20px !important;
          z-index: 1000000 !important;
          display: flex; flex-direction: column; align-items: flex-end; justify-content: flex-end;
        }
        .gc-card {
          position: absolute; bottom: 70px; right: 0;
          width: 260px; background: rgba(30, 30, 30, 0.98); border: 1px solid #444; border-radius: 8px;
          box-sizing: border-box; display: flex; flex-direction: column; gap: 8px;
          padding: 12px; opacity: 0; pointer-events: none;
          transform: translateY(15px); box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }
        .global-wrapper.expanded .gc-card {
          opacity: 1; pointer-events: auto; transform: translateY(0);
        }
        .yt-container {
          width: 100%; height: 120px; max-height: 120px; background: #000;
          border-radius: 6px; overflow: hidden; flex-shrink: 0;
          border: 1px solid rgba(255, 255, 255, 0.1);
          position: relative;
        }
        .yt-container iframe {
          position: absolute; inset: 0;
          width: 100% !important; height: 100% !important;
          pointer-events: auto; border: none; display: block;
          transform: scale(1.5); transform-origin: center center;
        }
        .gc-info-ctrl { display: flex; flex-direction: column; justify-content: center; gap: 6px; width: 100%; box-sizing: border-box; font-family: 'Noto Sans KR', sans-serif; }
        .cd-btn {
          width: 56px; height: 56px; border-radius: 50%; flex-shrink: 0;
          background: conic-gradient(from 0deg, #555, #999, #eee, #999, #555);
          border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 4px 8px rgba(0,0,0,0.5);
          cursor: pointer; position: relative; transition: 0.3s;
        }
        .cd-btn::after { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 16px; height: 16px; background: ${isDark ? darkBgColor : lightBgColor}; border-radius: 50%; }
        .cd-btn:hover { box-shadow: 0 6px 12px rgba(0,0,0,0.8); }
        .global-wrapper.is-playing .cd-btn { animation: gc-spin 4s linear infinite; }
        @keyframes gc-spin { 100% { transform: rotate(360deg); } }
        
        .gc-row-1 { display: flex; justify-content: space-between; align-items: center; width: 100%; box-sizing: border-box; }
        .gc-title { font-size: 12px; font-weight: bold; color: #EEEEEE; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px; }
        .gc-link { font-size: 11px; color: #777; text-decoration: none; transition: 0.2s; }
        .gc-link:hover { color: #aaa; text-decoration: underline; }
        
        .gc-row-2 { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #aaa; width: 100%; box-sizing: border-box; }
        .gc-btn { background: none; border: none; color: #666; cursor: pointer; padding: 2px; transition: 0.2s; display: flex; align-items: center; justify-content: center; width: 18px; height: 18px; flex-shrink: 0; outline: none; }
        .gc-btn svg { width: 14px; height: 14px; fill: currentColor; }
        .gc-btn:hover { color: #AAA; }
        .gc-btn.active { color: #EEE; }
        .gc-btn-loop.active { color: #EEEEEE; filter: drop-shadow(0 0 2px rgba(255,255,255,0.4)); }
        
        .gc-progress-bar { flex-grow: 1; min-width: 0; cursor: pointer; height: 3px; border-radius: 2px; appearance: none; background: #444; outline: none; transition: 0.2s; }
        .gc-progress-bar:hover { height: 5px; }
        .gc-progress-bar::-webkit-slider-thumb { appearance: none; width: 10px; height: 10px; border-radius: 50%; background: #999; cursor: pointer; transition: 0.2s; }
        .gc-progress-bar:hover::-webkit-slider-thumb { background: #EEEEEE; }
        
        .time-text { flex-shrink: 0; min-width: 26px; text-align: center; font-size: 10px; font-family: monospace; white-space: nowrap; }
      `}</style>
      <div 
        id="global-controller" 
        ref={containerRef} 
        className={`global-wrapper ${isExpanded ? 'expanded' : ''} ${isPlaying ? 'is-playing' : ''}`}
      >
        <div className="gc-card">
          <div className="yt-container">
            <div id="preview-yt-player-container"></div>
          </div>
          
          <div className="gc-info-ctrl">
            <div className="gc-row-1">
              <div className="gc-title" title={currentTrack.title}>{currentTrack.title || '🎧 BGM'}</div>
              <a className="gc-link" href={youtubeUrl} target="_blank" rel="noreferrer" title="새 탭에서 열기">
                ⧉ Open Tab
              </a>
            </div>
            <div className="gc-row-2">
              <button className={`gc-btn ${isPlaying ? 'active' : ''}`} onClick={togglePlayPause} title="재생/일시정지">
                {isPlaying ? (
                  <svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                ) : (
                  <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                )}
              </button>
              <span className="time-text">{formatTime(currentTime)}</span>
              <input 
                type="range" 
                className="gc-progress-bar" 
                min={0} 
                max={duration || 100} 
                value={currentTime} 
                onChange={handleSeekChange}
                onMouseDown={handleSeekMouseDown}
                onMouseUp={handleSeekMouseUp}
                onTouchStart={handleSeekMouseDown}
                onTouchEnd={handleSeekMouseUp}
              />
              <span className="time-text">{formatTime(duration)}</span>
              <button className={`gc-btn gc-btn-loop ${isLooping ? 'active' : ''}`} onClick={toggleLoop} title="반복 재생">
                <svg viewBox="0 0 24 24"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>
              </button>
            </div>
          </div>
        </div>
        <div className="cd-btn" onClick={toggleCard} title="컨트롤러 열기/닫기"></div>
      </div>
    </>
  );
};
