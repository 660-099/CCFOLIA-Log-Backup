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
import { CharSetting, LogEntry, TabSetting } from '../types';

export const isBase64Url = (url: string | null | undefined): boolean => {
  if (!url) return false;
  if (url.startsWith('data:')) return true;
  if (url.startsWith('blob:')) {
    const origin = getOriginDataUrl(url);
    return Boolean(origin && origin.startsWith('data:'));
  }
  return false;
};

export const getUsedBase64ImagesInfo = (
  files: any[],
  charSettings: Record<string, CharSetting>,
  tabSettings: Record<string, TabSetting>,
  hideAllAvatars: boolean
): string[] => {
  const result: string[] = [];
  const addedChars = new Set<string>();

  // Determine all logs that are actually exported
  const allLogs: LogEntry[] = [];
  const allBlocks: Record<string, any[]> = {};
  (files || []).forEach(f => {
    allLogs.push(...(f.logs || []));
    if (f.insertedBlocks) {
      Object.assign(allBlocks, f.insertedBlocks);
    }
  });

  // Filter for visible tabs and characters
  const visibleLogs = allLogs.filter(log => {
    const tabVisible = tabSettings[log.tabId]?.visible !== false;
    const charVisible = charSettings[log.charId]?.visible !== false;
    return tabVisible && charVisible;
  });

  // 1. Check speaking characters' avatars if avatars are not hidden
  if (!hideAllAvatars) {
    visibleLogs.forEach(log => {
      const char = charSettings[log.charId];
      if (!char || addedChars.has(char.id)) return;

      let imgUrl = char.imageUrl;
      if (log.overrideImageId && char.images) {
        const override = char.images.find(i => i.id === log.overrideImageId);
        if (override?.url) imgUrl = override.url;
      }

      if (isBase64Url(imgUrl)) {
        addedChars.add(char.id);
        result.push(char.name || log.name || '미지정 캐릭터');
      }
    });
  }

  // 2. Check illustrations and image blocks in order of appearance
  let illustrationCounter = 0;
  
  // Check start blocks
  const startBlocks = allBlocks['__start__'] || [];
  startBlocks.forEach(block => {
    if (block && (block.type === 'image' || block.type === 'illustration')) {
      illustrationCounter++;
      const url = typeof block === 'string' ? block : block.url;
      if (isBase64Url(url)) {
        result.push(`${illustrationCounter}번째 삽화`);
      }
    }
  });

  // Look through logs for illustrations and blocks
  visibleLogs.forEach(log => {
    const logBlocks = allBlocks[log.id] || [];
    logBlocks.forEach(block => {
      if (block && (block.type === 'image' || block.type === 'illustration')) {
        illustrationCounter++;
        const url = typeof block === 'string' ? block : block.url;
        if (isBase64Url(url)) {
          result.push(`${illustrationCounter}번째 삽화`);
        }
      }
    });

    if (log.isIllustration && !log.isUnplaced) {
      illustrationCounter++;
      const url = log.content || log.illustration?.url;
      if (isBase64Url(url)) {
        result.push(`${illustrationCounter}번째 삽화`);
      }
    }
  });

  return Array.from(new Set(result));
};

export const processImagesForExport = async (
  charSettings: Record<string, CharSetting>, 
  blocks: Record<string, any[]>, 
  logs: LogEntry[], 
  exportMode: 'html' | 'blog',
  excludeUnlinkedImages: boolean = false
): Promise<{ charSettings: Record<string, CharSetting>, blocks: Record<string, any[]>, logs: LogEntry[] }> => {
  // Deep copy
  const newCharSettings = JSON.parse(JSON.stringify(charSettings)) as Record<string, CharSetting>;
  const newBlocks = JSON.parse(JSON.stringify(blocks)) as Record<string, any[]>;
  let newLogs = JSON.parse(JSON.stringify(logs)) as LogEntry[];

  if (excludeUnlinkedImages) {
    // Exclude unlinked (Base64/data/blob) images completely
    Object.values(newCharSettings).forEach(char => {
      if (isBase64Url(char.imageUrl)) {
        char.imageUrl = '';
      }
      if (char.images) {
        char.images = char.images.filter(img => !isBase64Url(img.url));
        if (!char.imageUrl && char.images.length > 0) {
          char.imageUrl = char.images[0].url;
        }
      }
    });

    Object.keys(newBlocks).forEach(key => {
      newBlocks[key] = (newBlocks[key] || []).filter(block => {
        if (block.type === 'image' || block.type === 'illustration') {
          return !isBase64Url(block.url);
        }
        return true;
      });
      if (newBlocks[key].length === 0) {
        delete newBlocks[key];
      }
    });

    newLogs = newLogs.filter(log => {
      if (log.isIllustration) {
        const url = log.content || log.illustration?.url;
        return !isBase64Url(url);
      }
      return true;
    });
  }

  // Collect ONLY actually used URLs from active logs and blocks (avoiding unused data)
  const usedUrls = new Set<string>();

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
    if (log.isIllustration && !log.isUnplaced) {
      if (log.content) usedUrls.add(log.content);
      if (log.illustration?.url) usedUrls.add(log.illustration.url);
    }
  });

  // Check inserted blocks for illustrations/images
  Object.values(newBlocks).forEach(blockList => {
    (blockList || []).forEach(block => {
      if ((block.type === 'illustration' || block.type === 'image') && block.url) {
        usedUrls.add(block.url);
      }
    });
  });

  const urlMap = new Map<string, string>();
  const failedUrls: string[] = [];

  const parseWidthToPx = (w: string | number | undefined): number => {
    if (!w) return 800;
    const str = String(w).trim();
    if (str.endsWith('%')) {
      const pct = parseFloat(str) || 100;
      return Math.round(800 * (pct / 100));
    }
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    if (!isNaN(num) && num > 0) return Math.round(num);
    return 800;
  };

  const getIllustrationMaxWidth = (u: string): number => {
    for (const l of newLogs) {
      if (l.isIllustration && (l.content === u || l.illustration?.url === u)) {
        const w = l.width || l.illustration?.width;
        if (w) return parseWidthToPx(w);
      }
    }
    for (const blockList of Object.values(newBlocks)) {
      for (const b of blockList) {
        if ((b.type === 'illustration' || b.type === 'image') && b.url === u) {
          if (b.width) return parseWidthToPx(b.width);
        }
      }
    }
    return 800;
  };

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

    const isIll = isIllustrationUrl(url);
    // Dynamic screen-size compression:
    // For illustrations, size slightly larger than display width (1.4x) for high-DPI/Retina crispness, capped at 900px
    // For avatars, max 120px is crisp for ~46-50px avatars, saving substantial code space
    let maxW = 120;
    let maxH = 120;
    if (isIll) {
      const displayW = getIllustrationMaxWidth(url);
      maxW = Math.min(900, Math.max(160, Math.round(displayW * 1.4)));
      maxH = Math.round(maxW * 1.5);
    }
    const quality = isIll ? 0.76 : 0.78;

    try {
      if (url.startsWith('blob:')) {
        const originData = getOriginDataUrl(url);
        if (originData) {
          if (exportMode === 'html') {
            const optimized = await fetchAndCompressImage(originData, maxW, maxH, quality);
            urlMap.set(url, optimized);
          } else {
            // Blog mode: if origin is base64, compress to screen-size WebP
            if (originData.startsWith('data:')) {
              const compressed = await compressImageToWebP(originData, maxW, maxH, quality);
              urlMap.set(url, compressed);
            } else {
              urlMap.set(url, originData);
            }
          }
        } else {
          urlMap.set(url, url);
        }
      } else if (url.startsWith('data:')) {
        // High-compression WebP for data: URLs in both modes (fitted to screen size)
        const optimized = await compressImageToWebP(url, maxW, maxH, quality);
        urlMap.set(url, optimized);
      } else if (url.startsWith('http')) {
        if (exportMode === 'blog') {
          // Do not touch external URLs for blog mode
          urlMap.set(url, url);
        } else {
          const optimized = await fetchAndCompressImage(url, maxW, maxH, quality);
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
    (blockList || []).forEach(block => {
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
