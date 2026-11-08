// =========================================================================
// MIT License - Copyright (c) 2024 jlplenio
// Based on: https://github.com/jlplenio/imgur-direct-links-grabber
// =========================================================================

import axios from 'axios';
import type { Request, Response } from 'express';

// 1. 사용자가 입력한 주소에서 고유 ID(해시값)만 정밀 추출하는 로직
export function extractImgurId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  let trimmed = url.trim();
  // URL 뒤의 파라미터(?...) 및 해시(#...) 제거, 끝 슬래시 제거
  trimmed = trimmed.split('?')[0].split('#')[0].replace(/\/+$/, '');

  // 1. Gallery/album/tags with possible title slug: /gallery/slug-ID or /gallery/ID or /a/slug-ID or /a/ID
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

  // 2. Direct alphanumeric ID if user entered just the hash
  if (/^[a-zA-Z0-9]{5,10}$/.test(trimmed)) {
    return trimmed;
  }

  // 3. Direct single image link: i.imgur.com/XXXXX.ext or imgur.com/XXXXX
  const singleMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?(?:i\.)?imgur\.com\/([a-zA-Z0-9]+)(?:\.[a-zA-Z0-9]+)?/i);
  if (singleMatch && !['a', 'gallery', 'signin', 'upload', 't', 'r', 'user', 'about'].includes(singleMatch[1].toLowerCase())) {
    return singleMatch[1];
  }

  return null;
}

// 2. Imgur 페이지 및 API를 통해 이미지 데이터를 정제하는 핵심 로직
export async function fetchImgurImages(imgurUrl: string) {
  try {
    const imgurId = extractImgurId(imgurUrl);
    if (!imgurId) throw new Error('유효한 Imgur 앨범 주소가 아닙니다.');
    
    const clientId = process.env.VITE_IMGUR_CLIENT_ID || process.env.IMGUR_CLIENT_ID || '546c25a59c58ad7';
    const commonHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Authorization': `Client-ID ${clientId}`,
      'Accept': 'application/json'
    };

    // 1순위: Imgur V3 API (Client-ID 사용)
    // 1-1. Album API
    try {
      const apiUrl = `https://api.imgur.com/3/album/${imgurId}`;
      const apiResponse = await axios.get(apiUrl, { headers: commonHeaders });
      const images = apiResponse.data?.data?.images;
      if (images && Array.isArray(images) && images.length > 0) {
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
            ext: ext,
            size: typeof item.size === 'number' ? item.size : undefined,
            width: typeof item.width === 'number' ? item.width : undefined,
            height: typeof item.height === 'number' ? item.height : undefined
          };
        });
      }
    } catch (apiError: any) {
      // 1-2. Gallery Album API (갤러리 공유 앨범인 경우)
      try {
        const galleryUrl = `https://api.imgur.com/3/gallery/album/${imgurId}`;
        const galleryRes = await axios.get(galleryUrl, { headers: commonHeaders });
        const images = galleryRes.data?.data?.images;
        if (images && Array.isArray(images) && images.length > 0) {
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
              ext: ext,
              size: typeof item.size === 'number' ? item.size : undefined,
              width: typeof item.width === 'number' ? item.width : undefined,
              height: typeof item.height === 'number' ? item.height : undefined
            };
          });
        }
      } catch (galleryErr) {
        // Continue to single image check
      }

      // 1-3. Single Image API (단일 이미지 주소인 경우)
      try {
        const singleUrl = `https://api.imgur.com/3/image/${imgurId}`;
        const singleRes = await axios.get(singleUrl, { headers: commonHeaders });
        const item = singleRes.data?.data;
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
            ext: ext,
            size: typeof item.size === 'number' ? item.size : undefined,
            width: typeof item.width === 'number' ? item.width : undefined,
            height: typeof item.height === 'number' ? item.height : undefined
          }];
        }
      } catch (singleErr) {
        // Continue to scraping
      }

      console.warn("Imgur V3 API 실패, Embed 스크래핑으로 우회 시도합니다.", apiError?.message || apiError);
    }

    // 2순위: Imgur의 embed 페이지를 통해 데이터 접근 우회 (스크래핑)
    const embedUrls = [
      `https://imgur.com/a/${imgurId}/embed?pub=true`,
      `https://imgur.com/gallery/${imgurId}/embed?pub=true`
    ];

    let html = '';
    for (const embedUrl of embedUrls) {
      try {
        const response = await axios.get(embedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
          },
          timeout: 8000
        });
        if (response.data && typeof response.data === 'string') {
          html = response.data;
          break;
        }
      } catch (e) {
        // Try next embed URL
      }
    }

    if (!html) {
      throw new Error('Imgur 페이지에 접근할 수 없습니다. 비공개 또는 성인(NSFW) 앨범인지 확인해주세요.');
    }
    
    const prefix1 = 'var images            = ';
    const prefix2 = 'var images = ';
    let startIndex = html.indexOf(prefix1);
    if (startIndex === -1) {
        startIndex = html.indexOf(prefix2);
        if (startIndex !== -1) startIndex += prefix2.length;
    } else {
        startIndex += prefix1.length;
    }

    if (startIndex === -1) {
      throw new Error('Imgur 데이터 구조를 찾을 수 없습니다. (embed 렌더링 실패 또는 비공개 앨범)');
    }

    // JSON 객체의 끝을 중괄호 쌍 맞추기로 찾음
    let braceCount = 0;
    let endIndex = startIndex;
    for (let i = startIndex; i < html.length; i++) {
        if (html[i] === '{') braceCount++;
        else if (html[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
                endIndex = i + 1;
                break;
            }
        }
    }

    const jsonStr = html.substring(startIndex, endIndex);
    const albumData = JSON.parse(jsonStr);
    
    if (!albumData || !albumData.images) {
      throw new Error('앨범 내에서 이미지 미디어 데이터를 찾을 수 없습니다.');
    }

    // 3. 알맹이(다이렉트 링크와 파일 이름)만 예쁘게 정제해서 배열로 만들기
    const directLinks = albumData.images.map((item: any) => {
      const rawName = item.name || item.title || item.description || item.id || item.hash || '';
      return {
        url: `https://i.imgur.com/${item.hash}${item.ext}`,
        fileName: String(rawName).normalize('NFC'),
        ext: item.ext,
        size: typeof item.size === 'number' ? item.size : (typeof item.bytes === 'number' ? item.bytes : undefined),
        width: typeof item.width === 'number' ? item.width : undefined,
        height: typeof item.height === 'number' ? item.height : undefined
      };
    });

    return directLinks;

  } catch (error: any) {
    console.error('Imgur 파싱 중 에러 발생:', error?.message || error);
    throw error;
  }
}

// Vercel Serverless Function 및 Express 환경 공용 API 핸들러
export default async function handler(req: Request, res: Response) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = req.method === 'POST' ? req.body?.url : req.query?.url;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: '올바른 URL이 제공되지 않았습니다.' });
  }

  const imgurId = extractImgurId(url);
  if (!imgurId) {
    return res.status(400).json({ error: '유효한 Imgur 앨범 또는 갤러리 주소가 아닙니다.' });
  }

  try {
    const directLinks = await fetchImgurImages(url);
    return res.status(200).json(directLinks);
  } catch (error: any) {
    console.error('API 에러:', error?.message || error);
    return res.status(500).json({ error: error?.message || '서버 파싱 중 오류가 발생했습니다.' });
  }
}
