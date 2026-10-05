// =========================================================================
// MIT License - Copyright (c) 2024 jlplenio
// Based on: https://github.com/jlplenio/imgur-direct-links-grabber
// =========================================================================

import axios from 'axios';
import type { Request, Response } from 'express';

// 1. 사용자가 입력한 주소에서 고유 ID(해시값)만 추출하는 정규식 로직
export function extractImgurId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // 1. Album / gallery format: imgur.com/a/XXXXX, imgur.com/gallery/XXXXX
  const albumMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?(?:m\.)?imgur\.com\/(?:a|gallery|t|r)\/([a-zA-Z0-9]+)/i);
  if (albumMatch) return albumMatch[1];

  // 2. Direct alphanumeric ID if user entered just the hash
  if (/^[a-zA-Z0-9]{5,10}$/.test(trimmed)) {
    return trimmed;
  }

  // 3. Direct single image link: i.imgur.com/XXXXX.ext or imgur.com/XXXXX
  const singleMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?(?:i\.)?imgur\.com\/([a-zA-Z0-9]+)(?:\.[a-zA-Z0-9]+)?/i);
  if (singleMatch && singleMatch[1] !== 'a' && singleMatch[1] !== 'gallery') {
    return singleMatch[1];
  }

  return null;
}

// 2. Imgur 페이지 소스코드를 긁어와서 숨겨진 이미지 데이터를 쪼개내는 핵심 로직
export async function fetchImgurImages(imgurUrl: string) {
  try {
    const imgurId = extractImgurId(imgurUrl);
    if (!imgurId) throw new Error('유효한 Imgur 앨범 주소가 아닙니다.');
    
    const clientId = process.env.VITE_IMGUR_CLIENT_ID || process.env.IMGUR_CLIENT_ID || '546c25a59c58ad7';

    // 1순위: Imgur V3 API (Client-ID 사용)
    // 이 방식은 원본 업로드 파일명(name)을 유지해줍니다.
    try {
      const apiUrl = `https://api.imgur.com/3/album/${imgurId}`;
      const apiResponse = await axios.get(apiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Authorization': `Client-ID ${clientId}`,
          'Accept': 'application/json'
        }
      });
      
      const images = apiResponse.data?.data?.images;
      if (images && Array.isArray(images) && images.length > 0) {
        return images.map((item: any) => {
          let ext = '.jpg';
          if (item.link) {
            const match = item.link.match(/\.[a-zA-Z0-9]+$/);
            if (match) ext = match[0];
          }
          return {
            url: item.link || `https://i.imgur.com/${item.id}${ext}`,
            fileName: item.name || item.title || item.description || item.id,
            ext: ext,
            size: typeof item.size === 'number' ? item.size : undefined,
            width: typeof item.width === 'number' ? item.width : undefined,
            height: typeof item.height === 'number' ? item.height : undefined
          };
        });
      }
    } catch (apiError: any) {
      // If 404, maybe this is a single image ID rather than an album
      if (apiError.response?.status === 404) {
        try {
          const singleUrl = `https://api.imgur.com/3/image/${imgurId}`;
          const singleRes = await axios.get(singleUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Authorization': `Client-ID ${clientId}`,
              'Accept': 'application/json'
            }
          });
          const item = singleRes.data?.data;
          if (item && item.link) {
            let ext = '.png';
            if (item.link) {
              const match = item.link.match(/\.[a-zA-Z0-9]+$/);
              if (match) ext = match[0];
            }
            return [{
              url: item.link || `https://i.imgur.com/${item.id}${ext}`,
              fileName: item.name || item.title || item.description || item.id,
              ext: ext,
              size: typeof item.size === 'number' ? item.size : undefined,
              width: typeof item.width === 'number' ? item.width : undefined,
              height: typeof item.height === 'number' ? item.height : undefined
            }];
          }
        } catch (singleErr) {
          // ignore and proceed to scraping
        }
      }
      console.warn("Imgur V3 API 실패, Embed 스크래핑으로 우회 시도합니다.", apiError.message);
    }

    // 2순위: Imgur의 embed 페이지를 통해 데이터 접근 우회 (스크래핑)
    const embedUrl = `https://imgur.com/a/${imgurId}/embed?pub=true`;
    
    // 브라우저인 척 속이기 위한 헤더 설정 (스크래핑 차단 방지)
    const response = await axios.get(embedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });

    const html = response.data;
    
    const prefix1 = 'var images            = ';
    const prefix2 = 'var images = '; // Just in case whitespace changes
    let startIndex = html.indexOf(prefix1);
    if (startIndex === -1) {
        startIndex = html.indexOf(prefix2);
        if (startIndex !== -1) startIndex += prefix2.length;
    } else {
        startIndex += prefix1.length;
    }

    if (startIndex === -1) {
      throw new Error('Imgur 데이터 구조를 찾을 수 없습니다. (embed 렌더링 실패)');
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
      console.log("Imgur Scrape item:", item.hash);
      return {
        url: `https://i.imgur.com/${item.hash}${item.ext}`,
        fileName: item.name || item.title || item.description || item.id || item.hash, // 원래 파일명이나 업로더가 적은 이름
        ext: item.ext,
        size: typeof item.size === 'number' ? item.size : (typeof item.bytes === 'number' ? item.bytes : undefined),
        width: typeof item.width === 'number' ? item.width : undefined,
        height: typeof item.height === 'number' ? item.height : undefined
      };
    });

    return directLinks;

  } catch (error) {
    console.error('Imgur 파싱 중 에러 발생:', error);
    throw error;
  }
}

// Vercel Serverless Function 및 Express 환경 공용 API 핸들러
export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. POST 요청만 지원합니다.' });
  }

  const { url } = req.body;

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
    console.error('API 에러:', error);
    return res.status(500).json({ error: error.message || '서버 파싱 중 오류가 발생했습니다.' });
  }
}
