export const compressImageToWebP = async (base64Url: string, maxWidth = 400, maxHeight = 600, quality = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Url); // Fallback
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/webp', quality));
    };
    img.onerror = () => {
      resolve(base64Url); // Fallback if invalid
    };
    img.src = base64Url;
  });
};


export const fetchAndCompressImage = async (url: string, maxWidth = 1000, maxHeight = 1920, quality = 0.8): Promise<string> => {
  const tryLoadAndDraw = (srcUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Cannot get canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        try {
          const result = canvas.toDataURL('image/webp', quality);
          resolve(result);
        } catch (e) {
          reject(e); // Likely CORS tainted canvas error
        }
      };
      img.onerror = () => {
        reject(new Error(`Failed to load image for compression: ${srcUrl}`));
      };
      img.src = srcUrl;
    });
  };

  // Convert single imgur page links like https://imgur.com/abcde to direct image links
  let targetUrl = url;
  const singleImgurMatch = url.match(/^https?:\/\/(?:m\.)?imgur\.com\/([a-zA-Z0-9]{5,8})$/);
  if (singleImgurMatch) {
    targetUrl = `https://i.imgur.com/${singleImgurMatch[1]}.png`;
  }

  try {
    return await tryLoadAndDraw(targetUrl);
  } catch (err) {
    // If it's an external http/https URL (e.g. imgur or CORS-blocked domains), try proxy fallback
    if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
      try {
        const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(targetUrl)}`;
        return await tryLoadAndDraw(proxyUrl);
      } catch (proxyErr) {
        console.warn(`[fetchAndCompressImage] Proxy fallback also failed for ${targetUrl}:`, proxyErr);
        throw err;
      }
    }
    throw err;
  }
};


import { getOriginDataUrl } from './blobStore';
import { CharSetting, LogEntry } from '../types';

export const processImagesForExport = async (
  charSettings: Record<string, CharSetting>, 
  blocks: Record<string, any[]>, 
  logs: LogEntry[], 
  exportMode: 'html' | 'blog'
): Promise<{ charSettings: Record<string, CharSetting>, blocks: Record<string, any[]>, logs: LogEntry[] }> => {
  // We ALWAYS need to process to some degree because 'blob:' URLs are useless when exported.
  // If exportMode === 'blog', we just map 'blob:' back to their original (external URL or base64) and DO NOT fetch/compress external URLs.

  // Create deep copies
  const newCharSettings = JSON.parse(JSON.stringify(charSettings)) as Record<string, CharSetting>;
  const newBlocks = JSON.parse(JSON.stringify(blocks)) as Record<string, any[]>;
  const newLogs = JSON.parse(JSON.stringify(logs)) as LogEntry[];

  // Collect all used URLs
  const usedUrls = new Set<string>();

  // 1. Check charSettings (default images & multi-images)
  Object.values(newCharSettings).forEach(char => {
    if (char.imageUrl) usedUrls.add(char.imageUrl);
    if (char.images) {
      char.images.forEach(img => {
        if (img.url) usedUrls.add(img.url);
      });
    }
  });

  // 2. Check logs for avatars and illustrations
  newLogs.forEach(log => {
    const char = newCharSettings[log.charId];
    if (char) {
      let url = char.imageUrl;
      if (log.overrideImageId && char.images) {
        const img = char.images.find(i => i.id === log.overrideImageId);
        if (img) url = img.url;
      }
      if (url) usedUrls.add(url);
    }

    // Check illustrations in logs
    if (log.isIllustration) {
      if (log.content) usedUrls.add(log.content);
      if (log.illustration?.url) usedUrls.add(log.illustration.url);
    }
  });

  // 3. Check inserted blocks for illustrations/images
  Object.values(newBlocks).forEach(blockList => {
    blockList.forEach(block => {
      if ((block.type === 'illustration' || block.type === 'image') && block.url) {
        usedUrls.add(block.url);
      }
    });
  });

  const urlMap = new Map<string, string>(); // Original URL -> Compressed Base64 WebP
  const failedUrls: string[] = [];

  const isIllustrationUrl = (u: string) => {
    if (newLogs.some(l => l.isIllustration && (l.content === u || l.illustration?.url === u))) return true;
    for (const blockList of Object.values(newBlocks)) {
      if (blockList.some(b => (b.type === 'illustration' || b.type === 'image') && b.url === u)) return true;
    }
    return false;
  };

  // Process unique URLs
  const urlArray = Array.from(usedUrls);
  for (const url of urlArray) {
    if (!url) continue;

    try {
      if (url.startsWith('blob:')) {
        const originData = getOriginDataUrl(url);
        if (originData) {
          if (exportMode === 'html') {
            const isIll = isIllustrationUrl(url);
            const maxW = isIll ? 1920 : 800;
            const maxH = isIll ? 1920 : 1200;
            const optimized = await fetchAndCompressImage(originData, maxW, maxH, 0.82);
            urlMap.set(url, optimized);
          } else {
            // Blog mode: restore original base64 or URL
            urlMap.set(url, originData);
          }
        } else {
          urlMap.set(url, url);
        }
      } else if (url.startsWith('data:')) {
        if (exportMode === 'html') {
          const isIll = isIllustrationUrl(url);
          const maxW = isIll ? 1920 : 800;
          const maxH = isIll ? 1920 : 1200;
          const optimized = await fetchAndCompressImage(url, maxW, maxH, 0.82);
          urlMap.set(url, optimized);
        } else {
          urlMap.set(url, url);
        }
      } else if (url.startsWith('http')) {
        if (exportMode === 'blog') {
          // Do not touch external URLs for blog mode
          urlMap.set(url, url);
        } else {
          const isIll = isIllustrationUrl(url);
          const maxW = isIll ? 1920 : 800;
          const maxH = isIll ? 1920 : 1200;
          const optimized = await fetchAndCompressImage(url, maxW, maxH, 0.82);
          urlMap.set(url, optimized);
        }
      } else {
        urlMap.set(url, url);
      }
    } catch (e) {
      console.warn("Failed to process image:", url, e);
      failedUrls.push(url);
      urlMap.set(url, url); // Fallback to original
    }
  }

  if (failedUrls.length > 0 && exportMode === 'html') {
    const proceed = window.confirm('일부 외부 이미지를 보안 문제(CORS)로 인해 파일에 내장할 수 없습니다.\n\n해당 이미지는 외부 링크 형태로 출력되며, 인터넷이 연결되지 않은 환경에서는 보이지 않을 수 있습니다.\n\n그래도 다운로드를 진행하시겠습니까?');
    if (!proceed) {
      throw new Error('User cancelled download due to CORS errors.');
    }
  }

  // Apply mapped URLs to CharSettings
  Object.values(newCharSettings).forEach(char => {
    if (char.imageUrl && urlMap.has(char.imageUrl)) {
      char.imageUrl = urlMap.get(char.imageUrl)!;
    }
    if (char.images) {
      char.images.forEach(img => {
        if (img.url && urlMap.has(img.url)) {
          img.url = urlMap.get(img.url)!;
        }
      });
    }
  });

  // Apply mapped URLs to Inserted Blocks
  Object.values(newBlocks).forEach(blockList => {
    blockList.forEach(block => {
      if ((block.type === 'illustration' || block.type === 'image') && block.url && urlMap.has(block.url)) {
        block.url = urlMap.get(block.url)!;
      }
    });
  });

  // Apply mapped URLs to Logs (illustrations)
  newLogs.forEach(log => {
    if (log.isIllustration) {
      if (log.content && urlMap.has(log.content)) {
        log.content = urlMap.get(log.content)!;
      }
      if (log.illustration && log.illustration.url && urlMap.has(log.illustration.url)) {
        log.illustration.url = urlMap.get(log.illustration.url)!;
      }
    }
  });

  return { charSettings: newCharSettings, blocks: newBlocks, logs: newLogs };
};
