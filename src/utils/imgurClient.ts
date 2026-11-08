export interface ImgurFetchedImage {
  url: string;
  fileName: string;
  ext: string;
  size?: number;
  width?: number;
  height?: number;
  targetImgId?: string;
}

/**
 * Imgur 주소에서 고유 앨범/이미지 ID를 추출합니다.
 * 지원 형식:
 * - https://imgur.com/a/XXXXXXX
 * - https://imgur.com/gallery/XXXXXXX
 * - https://imgur.com/gallery/title-slug-XXXXXXX
 * - https://imgur.com/a/title-slug-XXXXXXX
 * - https://imgur.com/t/tagName/XXXXXXX
 * - https://imgur.com/r/subreddit/XXXXXXX
 * - https://i.imgur.com/XXXXXXX.ext
 * - https://imgur.com/XXXXXXX
 * - XXXXXXX (순수 해시값)
 */
export function extractImgurId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  let trimmed = url.trim();
  // URL 뒤의 파라미터(?...) 및 해시(#...) 제거, 끝 슬래시 제거
  trimmed = trimmed.split('?')[0].split('#')[0].replace(/\/+$/, '');

  // 1. Gallery/album/tags with possible title slug
  const slugMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?(?:m\.)?imgur\.com\/(?:a|gallery|t\/[^\/]+|r\/[^\/]+)\/([a-zA-Z0-9_-]+)/i);
  if (slugMatch) {
    const segment = slugMatch[1];
    // 슬러그에 하이픈이 있는 경우 마지막 토큰이 실제 ID (예: title-slug-8eNRyro)
    if (segment.includes('-')) {
      const parts = segment.split('-');
      const lastPart = parts[parts.length - 1];
      if (/^[a-zA-Z0-9]{5,10}$/.test(lastPart)) return lastPart;
    }
    const cleanIdMatch = segment.match(/([a-zA-Z0-9]{5,10})/);
    if (cleanIdMatch) return cleanIdMatch[1];
    return segment;
  }

  // 2. 순수 해시값 입력
  if (/^[a-zA-Z0-9]{5,10}$/.test(trimmed)) {
    return trimmed;
  }

  // 3. 단일 이미지 링크 (i.imgur.com/XXXXX.ext 또는 imgur.com/XXXXX)
  const singleMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?(?:i\.)?imgur\.com\/([a-zA-Z0-9]+)(?:\.[a-zA-Z0-9]+)?/i);
  if (singleMatch && !['a', 'gallery', 'signin', 'upload', 't', 'r', 'user', 'about'].includes(singleMatch[1].toLowerCase())) {
    return singleMatch[1];
  }

  return null;
}

/**
 * 2중 안전 로딩(Dual-Fallback) 방식으로 Imgur 이미지를 로드합니다.
 * 1순위: 브라우저 직접 Imgur API 호출 (CORS 지원으로 iframe 쿠키/인증 차단 없이 100% 성공)
 * 2순위: 로컬 서버 프록시(/api/imgur) 호출 (브라우저 네트워크 제한 시 우회)
 */
export async function fetchImgurImagesClient(inputUrl: string): Promise<ImgurFetchedImage[]> {
  const trimmed = inputUrl.trim();
  const imgurId = extractImgurId(trimmed);

  // 1순위: 브라우저 직접 Imgur API 호출 (CORS 지원)
  if (imgurId) {
    try {
      const clientId = '546c25a59c58ad7';
      
      // 1-1. 앨범 엔드포인트 조회
      const albumRes = await fetch(`https://api.imgur.com/3/album/${imgurId}`, {
        headers: { 'Authorization': `Client-ID ${clientId}` }
      });
      if (albumRes.ok) {
        const albumData = await albumRes.json();
        const images = albumData?.data?.images;
        if (Array.isArray(images) && images.length > 0) {
          return images.map((item: any) => {
            let ext = '.jpg';
            if (item.link) {
              const match = item.link.match(/\.[a-zA-Z0-9]+$/);
              if (match) ext = match[0];
            }
            const rawName = item.name || item.title || item.description || item.id || '';
            return {
              url: item.link || `https://i.imgur.com/${item.id}${ext}`,
              fileName: String(rawName).normalize('NFC'),
              ext,
              size: typeof item.size === 'number' ? item.size : undefined,
              width: typeof item.width === 'number' ? item.width : undefined,
              height: typeof item.height === 'number' ? item.height : undefined
            };
          });
        }
      }

      // 1-2. 갤러리 엔드포인트 조회 (갤러리 앨범인 경우)
      const galleryRes = await fetch(`https://api.imgur.com/3/gallery/album/${imgurId}`, {
        headers: { 'Authorization': `Client-ID ${clientId}` }
      });
      if (galleryRes.ok) {
        const galleryData = await galleryRes.json();
        const images = galleryData?.data?.images;
        if (Array.isArray(images) && images.length > 0) {
          return images.map((item: any) => {
            let ext = '.jpg';
            if (item.link) {
              const match = item.link.match(/\.[a-zA-Z0-9]+$/);
              if (match) ext = match[0];
            }
            const rawName = item.name || item.title || item.description || item.id || '';
            return {
              url: item.link || `https://i.imgur.com/${item.id}${ext}`,
              fileName: String(rawName).normalize('NFC'),
              ext,
              size: typeof item.size === 'number' ? item.size : undefined,
              width: typeof item.width === 'number' ? item.width : undefined,
              height: typeof item.height === 'number' ? item.height : undefined
            };
          });
        }
      }

      // 1-3. 단일 이미지 조회
      const singleRes = await fetch(`https://api.imgur.com/3/image/${imgurId}`, {
        headers: { 'Authorization': `Client-ID ${clientId}` }
      });
      if (singleRes.ok) {
        const singleData = await singleRes.json();
        const item = singleData?.data;
        if (item && item.link) {
          let ext = '.png';
          if (item.link) {
            const match = item.link.match(/\.[a-zA-Z0-9]+$/);
            if (match) ext = match[0];
          }
          const rawName = item.name || item.title || item.description || item.id || '';
          return [{
            url: item.link || `https://i.imgur.com/${item.id}${ext}`,
            fileName: String(rawName).normalize('NFC'),
            ext,
            size: typeof item.size === 'number' ? item.size : undefined,
            width: typeof item.width === 'number' ? item.width : undefined,
            height: typeof item.height === 'number' ? item.height : undefined
          }];
        }
      }
    } catch (directErr) {
      console.warn('Direct Imgur API call failed, attempting fallback to /api/imgur:', directErr);
    }
  }

  // 2순위: 백엔드 프록시(/api/imgur) 우회 시도
  try {
    const proxyRes = await fetch('/api/imgur', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: trimmed }),
    });

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item: any) => ({
          ...item,
          fileName: String(item.fileName || '').normalize('NFC'),
          ext: item.ext || (item.url?.match(/\.[a-zA-Z0-9]+$/)?.[0]) || '.jpg'
        }));
      }
    } else {
      const errJson = await proxyRes.json().catch(() => ({}));
      if (errJson && errJson.error) {
        throw new Error(errJson.error);
      }
    }
  } catch (proxyErr: any) {
    if (proxyErr.message && !proxyErr.message.includes('fetch')) {
      throw proxyErr;
    }
  }

  throw new Error('Imgur 앨범 정보를 불러올 수 없습니다. 앨범 주소 및 공개 설정을 확인해주세요.');
}
