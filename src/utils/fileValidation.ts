/**
 * File validation utilities for log files and project files.
 *
 * Supported File Types:
 * 1. HTML Logs:
 *    - Cocofolia Old HTML Log
 *    - ccfolia_log_getter Extracted HTML Log
 * 2. JSON Files:
 *    - Cocofolia New JSON Log (has messages array with channel/name/text)
 *    - App Project File (.json) (has charSettings / tabSettings / files / logs)
 */

export type FileTypeCheckResult =
  | { type: 'cocofolia_html'; valid: true; reason?: string }
  | { type: 'cocofolia_json'; valid: true; reason?: string }
  | { type: 'app_project'; valid: true; reason?: string }
  | { type: 'invalid'; valid: false; reason?: string };

/**
 * Checks if a string or document resembles a Cocofolia or ccfolia_log_getter HTML log.
 */
export const isCocofoliaHtmlText = (text: string): boolean => {
  if (!text || typeof text !== 'string') return false;

  // Fast check: HTML must contain <span> and some styling or <p>
  if (!text.includes('<span') && !text.includes('<p')) return false;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const allElements = doc.querySelectorAll('*');

    let validRows = 0;
    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i];
      const tagName = el.tagName.toLowerCase();
      const styleAttr = el.getAttribute('style') || '';
      const hasColor = /color\s*:/.test(styleAttr) || !!(el as HTMLElement).style?.color;

      if (!hasColor && tagName !== 'p') continue;

      const spans = el.querySelectorAll('span');
      if (spans.length < 2) continue;
      if (spans[0].parentElement !== el) continue;

      validRows++;
      if (validRows >= 1) {
        return true;
      }
    }
  } catch (e) {
    return false;
  }

  return false;
};

/**
 * Checks if a parsed JSON object is an App Project File.
 */
export const isAppProjectJson = (json: any): boolean => {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return false;

  // Project file should contain specific signature keys
  const hasCharSettings = !!json.charSettings && typeof json.charSettings === 'object';
  const hasTabSettings = !!json.tabSettings && typeof json.tabSettings === 'object';
  const hasFiles = Array.isArray(json.files);
  const hasLogs = Array.isArray(json.logs);
  const hasVersion = typeof json.version === 'string';

  return (hasCharSettings && hasTabSettings) || hasFiles || (hasLogs && (hasCharSettings || hasTabSettings || hasVersion));
};

/**
 * Checks if a parsed JSON object is a Cocofolia New JSON Log.
 */
export const isCocofoliaLogJson = (json: any): boolean => {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return false;

  if (Array.isArray(json.messages)) {
    // If messages array is present, check that it is not our app project file
    if (isAppProjectJson(json)) return false;
    return true;
  }

  return false;
};

/**
 * Analyzes an uploaded file to determine its type and validity.
 */
export const inspectUploadedFile = async (file: File): Promise<FileTypeCheckResult> => {
  const fileName = (file.name || '').toLowerCase();

  if (fileName.endsWith('.json') || file.type === 'application/json') {
    try {
      const text = await file.text();
      const json = JSON.parse(text);

      if (isAppProjectJson(json)) {
        return { type: 'app_project', valid: true };
      }
      if (isCocofoliaLogJson(json)) {
        return { type: 'cocofolia_json', valid: true };
      }

      return {
        type: 'invalid',
        valid: false,
        reason: '올바른 코코포리아 신버전 로그(.json) 또는 프로젝트 파일(.json)이 아닙니다.'
      };
    } catch (e) {
      return {
        type: 'invalid',
        valid: false,
        reason: '파일 형식이 올바르지 않거나 손상된 JSON 파일입니다.'
      };
    }
  }

  if (fileName.endsWith('.html') || fileName.endsWith('.htm') || file.type.includes('html')) {
    try {
      const text = await file.text();
      if (isCocofoliaHtmlText(text)) {
        return { type: 'cocofolia_html', valid: true };
      }
      return {
        type: 'invalid',
        valid: false,
        reason: '올바른 코코포리아 HTML 로그 파일이 아닙니다. 로그 데이터를 찾을 수 없습니다.'
      };
    } catch (e) {
      return {
        type: 'invalid',
        valid: false,
        reason: 'HTML 파일을 읽는 도중 오류가 발생했습니다.'
      };
    }
  }

  return {
    type: 'invalid',
    valid: false,
    reason: '지원하지 않는 파일 형식입니다. (HTML 또는 JSON 파일만 업로드할 수 있습니다.)'
  };
};
