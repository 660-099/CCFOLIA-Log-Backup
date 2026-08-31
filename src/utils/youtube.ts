export interface YoutubeParseResult {
  videoId: string;
  startTime: number;
  isValid: boolean;
}

/**
 * 유튜브 URL에서 11자리 videoId 및 타임스탬프(초)를 추출하는 함수
 */
export function parseYoutubeUrl(url: string, respectTimestamp: boolean = true): YoutubeParseResult {
  if (!url) {
    return { videoId: '', startTime: 0, isValid: false };
  }

  const trimmed = url.trim();

  // YouTube Video ID Regex (watch, short, embed, live, youtu.be 등 대응)
  const idMatch = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/
  );

  const videoId = idMatch ? idMatch[1] : '';

  let startTime = 0;
  if (respectTimestamp && videoId) {
    // t=120, t=1m20s, start=120 등의 타임스탬프 파라미터 매칭
    const timeMatch = trimmed.match(/[?&](?:t|start)=([0-9a-z]+)/i);
    if (timeMatch) {
      const timeStr = timeMatch[1];
      if (/^\d+$/.test(timeStr)) {
        startTime = parseInt(timeStr, 10);
      } else {
        // e.g. 1h2m3s / 1m20s / 80s
        let total = 0;
        const hours = timeStr.match(/(\d+)h/i);
        const mins = timeStr.match(/(\d+)m/i);
        const secs = timeStr.match(/(\d+)s/i);
        if (hours) total += parseInt(hours[1], 10) * 3600;
        if (mins) total += parseInt(mins[1], 10) * 60;
        if (secs) total += parseInt(secs[1], 10);
        startTime = total;
      }
    }
  }

  return {
    videoId,
    startTime,
    isValid: Boolean(videoId)
  };
}

/**
 * 초 단위 숫자를 "M:SS" 형식으로 변환하는 헬퍼 함수
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
