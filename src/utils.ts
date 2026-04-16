import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const r = (n: number) => Math.round(n * 10) / 10;

export const rgbToHex = (colorStr: string) => {
  if (!colorStr) return '#000000';
  const trimmed = colorStr.trim();
  if (trimmed.startsWith('#')) return trimmed;
  
  const match = trimmed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
  if (!match) return '#000000';
  
  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

export const linkify = (text: string) => {
  const urlPattern = /(https?:\/\/[^\s<]+)/g;
  const processed = text.replace(urlPattern, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: underline;">$1</a>');
  // 캐릭터별 통합 시 대사들 사이 간격 조정을 위해 div와 margin-bottom 사용
  return processed.split('\n').map((line, i, arr) => 
    `<div style="margin-bottom: ${i === arr.length - 1 ? '0' : '0.8em'};">${line || '&nbsp;'}</div>`
  ).join('');
};
