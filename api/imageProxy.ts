import axios from 'axios';
import type { Request, Response } from 'express';

export default async function imageProxyHandler(req: Request, res: Response) {
  const imageUrl = req.query.url as string;
  if (!imageUrl || (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://'))) {
    return res.status(400).send('Invalid url parameter');
  }

  // Handle single Imgur page URLs like https://imgur.com/abcde -> https://i.imgur.com/abcde.png
  let targetUrl = imageUrl;
  const singleImgurMatch = targetUrl.match(/^https?:\/\/(?:m\.)?imgur\.com\/([a-zA-Z0-9]{5,8})$/);
  if (singleImgurMatch) {
    targetUrl = `https://i.imgur.com/${singleImgurMatch[1]}.png`;
  }

  try {
    const response = await axios.get(targetUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': targetUrl.includes('imgur.com') ? 'https://imgur.com' : undefined,
      },
      timeout: 15000,
    });

    const contentType = (response.headers['content-type'] as string) || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(Buffer.from(response.data));
  } catch (err: any) {
    console.warn(`[ImageProxy] Failed to proxy image: ${targetUrl}`, err.message);
    return res.status(500).send('Failed to fetch image');
  }
}
