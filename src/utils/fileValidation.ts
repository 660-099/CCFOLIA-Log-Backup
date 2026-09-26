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
/**
 * Checks if a parsed JSON object is a Cocofolia New JSON Log.
 * Cocofolia logs always contain a top-level `messages` array where items represent chat messages (text, channel, etc.).
 */
export const isCocofoliaLogJson = (json: any): boolean => {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return false;

  // Cocofolia JSON format contains a 'messages' array
  if (Array.isArray(json.messages)) {
    // Check if the messages look like Cocofolia chat messages (or empty array)
    if (json.messages.length === 0) return true;
    const firstMsg = json.messages[0];
    if (firstMsg && typeof firstMsg === 'object' && ('text' in firstMsg || 'channel' in firstMsg || 'channelName' in firstMsg || 'name' in firstMsg)) {
      return true;
    }
    // Even if messages has different items, if it has messages array and doesn't have app project specific keys, it's cocofolia
    if (!json.charSettings && !json.tabSettings && !json.files) {
      return true;
    }
  }

  return false;
};

/**
 * Checks if a parsed JSON object is an App Project File.
 * App Project files contain backup data: charSettings, tabSettings, files array (LogFile[]), etc.
 * Note: A Cocofolia log with messages array is NOT an app project file.
 */
export const isAppProjectJson = (json: any): boolean => {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return false;

  // If it's a Cocofolia log with messages array, it is NOT an app project file
  if (Array.isArray(json.messages) && !json.files && !json.charSettings && !json.tabSettings) {
    return false;
  }

  const hasCharSettings = !!json.charSettings && typeof json.charSettings === 'object' && !Array.isArray(json.charSettings);
  const hasTabSettings = !!json.tabSettings && typeof json.tabSettings === 'object' && !Array.isArray(json.tabSettings);
  const hasFiles = Array.isArray(json.files) && json.files.length > 0 && typeof json.files[0] === 'object' && ('logs' in json.files[0] || 'insertedBlocks' in json.files[0]);
  const hasLogs = Array.isArray(json.logs) && json.logs.length > 0 && typeof json.logs[0] === 'object' && ('charId' in json.logs[0] || 'tabId' in json.logs[0]);
  const hasVersion = typeof json.version === 'string' && (hasCharSettings || hasTabSettings || hasFiles || hasLogs || !!json.cssFormat || !!json.theme);

  // App Project must have our app's specific structure and must not be a Cocofolia log
  if (Array.isArray(json.messages)) {
    // If it has messages AND looks like an app project (e.g. has explicit app export fields)
    return (hasCharSettings && hasTabSettings) || hasFiles;
  }

  return (hasCharSettings && hasTabSettings) || hasFiles || (hasLogs && (hasCharSettings || hasTabSettings || hasVersion)) || (hasVersion && (hasCharSettings || hasTabSettings));
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

      // Check Cocofolia Log JSON first, because logs contain messages array
      if (isCocofoliaLogJson(json)) {
        return { type: 'cocofolia_json', valid: true };
      }
      if (isAppProjectJson(json)) {
        return { type: 'app_project', valid: true };
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
