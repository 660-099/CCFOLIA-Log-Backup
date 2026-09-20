const blobToOriginMap = new Map<string, string>();

export const createBlobUrl = (dataUrl: string): string => {
  if (!dataUrl.startsWith('data:')) return dataUrl;
  try {
    const parts = dataUrl.split(',');
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const blob = new Blob([u8arr], { type: mime });
    const blobUrl = URL.createObjectURL(blob);
    blobToOriginMap.set(blobUrl, dataUrl);
    return blobUrl;
  } catch (e) {
    console.error('Failed to create blob url', e);
    return dataUrl;
  }
};

export const getOriginDataUrl = (url: string): string | null => {
  return blobToOriginMap.get(url) || null;
};
