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

export const markdownToHtml = (text: string) => {
  if (!text) return '';
  let processed = text;
  
  // Custom format parsing
  processed = processed.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  processed = processed.replace(/\*([^*]+)\*/g, '<i>$1</i>');
  processed = processed.replace(/__([^_]+)__/g, '<u>$1</u>');
  processed = processed.replace(/~~([^~]+)~~/g, '<s>$1</s>');
  processed = processed.replace(/\[c:([^\]]+)\]([\s\S]*?)\[\/c\]/g, '<span style="color:$1">$2</span>');
  processed = processed.replace(/\[bg:([^\]]+)\]([\s\S]*?)\[\/bg\]/g, '<span style="background-color:$1">$2</span>');

  processed = processed.replace(/\n/g, '<br>');
  return processed;
};

function rgbToHexInternal(colorStr: string) {
  if (!colorStr) return '';
  const trimmed = colorStr.trim();
  if (trimmed.startsWith('#')) return trimmed;
  
  const match = trimmed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
  if (!match) return trimmed;
  
  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export const htmlToMarkdown = (html: string) => {
  if (typeof document === 'undefined') return html;

  const temp = document.createElement('div');
  temp.innerHTML = html.replace(/\u00a0/g, ' ');

  function processNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      let content = Array.from(el.childNodes).map(processNode).join('');

      if (el.tagName === 'DIV' || el.tagName === 'P') {
        if (el.childNodes.length === 1 && el.firstChild?.nodeName === 'BR') {
          return '\n'; // Just one newline for an empty div
        }
        return '\n' + content;
      }
      if (el.tagName === 'BR') {
        return '\n';
      }

      // First apply text formatting styles
      if (el.tagName === 'B' || el.tagName === 'STRONG' || el.style.fontWeight === 'bold' || el.style.fontWeight === '700' || el.style.fontWeight > '400') {
        content = `**${content}**`;
      }
      if (el.tagName === 'I' || el.tagName === 'EM' || el.style.fontStyle === 'italic') {
        content = `*${content}*`;
      }
      if (el.tagName === 'U' || el.style.textDecoration === 'underline') {
        content = `__${content}__`;
      }
      if (el.tagName === 'S' || el.tagName === 'STRIKE' || el.style.textDecoration === 'line-through') {
        content = `~~${content}~~`;
      }
      if (el.tagName === 'MARK') {
        const bg = el.style.backgroundColor || '#ffff00';
        content = `[bg:${rgbToHexInternal(bg)}]${content}[/bg]`;
      }

      if (el.tagName === 'FONT') {
        const color = el.getAttribute('color');
        if (color) {
          content = `[c:${rgbToHexInternal(color)}]${content}[/c]`;
        }
      }

      // Check inline styles for colors
      const bgColor = el.style.backgroundColor || (el as any).style?.background;
      if (bgColor && bgColor !== 'transparent' && bgColor !== 'inherit' && bgColor !== 'initial') {
        content = `[bg:${rgbToHexInternal(bgColor)}]${content}[/bg]`;
      }
      
      const color = el.style.color;
      if (color && color !== 'inherit' && color !== 'transparent' && color !== 'initial') {
        content = `[c:${rgbToHexInternal(color)}]${content}[/c]`;
      }

      return content;
    }
    return '';
  }

  let text = Array.from(temp.childNodes).map(processNode).join('');
  
  // Clean up extra newlines at start that might be caused by top-level divs
  text = text.replace(/^\n+/, '');

  return text;
};

export const linkifyAndFormat = (text: string) => {
  if (!text) return '';
  let processed = text;
  
  // Custom format parsing
  processed = processed.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  processed = processed.replace(/\*([^*]+)\*/g, '<i>$1</i>');
  processed = processed.replace(/__([^_]+)__/g, '<u>$1</u>');
  processed = processed.replace(/~~([^~]+)~~/g, '<s>$1</s>');
  processed = processed.replace(/\[c:([^\]]+)\]([\s\S]*?)\[\/c\]/g, '<span style="color:$1">$2</span>');
  processed = processed.replace(/\[bg:([^\]]+)\]([\s\S]*?)\[\/bg\]/g, '<span style="background-color:$1">$2</span>');

  const urlPattern = /(https?:\/\/[^\s<]*[^\s<.,!?:;"'])/g;
  processed = processed.replace(urlPattern, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: underline;">$1</a>');
  processed = processed.replace(/\n/g, '<br/>');
  return processed;
};

export const hexToRgbValues = (hex: string) => {
  if (!hex) return { r: 0, g: 0, b: 0 };
  const str = hex.replace('#', '');
  const r = parseInt(str.length === 3 ? str.slice(0, 1).repeat(2) : str.slice(0, 2), 16) || 0;
  const g = parseInt(str.length === 3 ? str.slice(1, 2).repeat(2) : str.slice(2, 4), 16) || 0;
  const b = parseInt(str.length === 3 ? str.slice(2, 3).repeat(2) : str.slice(4, 6), 16) || 0;
  return { r, g, b };
};

export const rgbToHexValues = ({ r, g, b }: { r: number; g: number; b: number }) => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

export const hexToHsl = (hex: string) => {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;
  if (max === min) h = s = 0;
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

export const getFileNameFromUrl = (url: string) => {
  try {
    const decoded = decodeURIComponent(url);
    const lastSlash = decoded.lastIndexOf('/');
    if (lastSlash === -1) return url;
    let name = decoded.substring(lastSlash + 1);
    const queryIndex = name.indexOf('?');
    if (queryIndex !== -1) {
      name = name.substring(0, queryIndex);
    }
    return name || 'image';
  } catch (e) {
    return 'image';
  }
};
