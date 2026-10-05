/**
 * 캐릭터 이름 및 스탠딩 이미지 고유 식별자 정밀 매칭 유틸리티
 */

// 다국어 및 카테고리 동의어 사전 (공통 제약 사항 준수)
export const MULTILINGUAL_SYNONYMS: Record<string, string[]> = {
  // 기본 물품/카테고리
  '우유': ['milk'],
  '물': ['water'],
  '커피': ['coffee'],
  '차': ['tea'],
  '사과': ['apple'],
  '빵': ['bread']
};

/**
 * 단어의 동의어 그룹 조회
 */
export function findSynonymGroup(word: string): string[] {
  const norm = normalizeString(word);
  if (!norm) return [];
  for (const [key, aliases] of Object.entries(MULTILINGUAL_SYNONYMS)) {
    const normKey = normalizeString(key);
    const normAliases = aliases.map(normalizeString);
    if (normKey === norm || normAliases.includes(norm)) {
      return [key, ...aliases];
    }
  }
  return [word];
}

/**
 * 문자열 정규화: 특수문자, 괄호, 공백 제거 후 소문자 변환
 */
export function normalizeString(str: string): string {
  if (!str) return '';
  return str.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();
}

/**
 * 캐릭터 이름에서 수식어([PC1], (NPC), 【...】 등)를 제거하고 순수 전체 이름 추출
 * 단어 단위로 쪼개지 않고 전체 이름의 온전성을 유지합니다.
 */
export function cleanCharacterName(rawName: string): string {
  if (!rawName) return '';
  // 1. 대괄호, 소괄호, 특수 괄호 태그 제거 (예: "[PC1] 앨리스 오" -> "앨리스 오")
  let cleaned = rawName.replace(/\[.*?\]|\(.*?\)|【.*?】|<.*?>/g, '').trim();
  // 2. 일반적인 접두사 (PC1:, NPC_ 등) 제거
  cleaned = cleaned.replace(/^(?:PC\d*|NPC|GM|KP|PL)\s*[:_.-]?\s*/i, '').trim();
  return cleaned || rawName.trim();
}

export interface MatchCandidateCharacter {
  charId: string;
  charName: string;
  color?: string;
  images: { id: string; name?: string; url: string; isRepresentative?: boolean }[];
}

export interface ImageToMatch {
  url: string;
  fileName: string;
  size?: number;
}

export interface MatchResult {
  charId: string;
  targetImgId?: string;
  reason: string;
}

/**
 * 이미지 목록과 캐릭터 목록을 대조하여 정확한 캐릭터 매칭을 도출합니다.
 * - 단어 단위 분할로 인한 오매칭 방지 (온전한 이름 매칭)
 * - 수식어 제거 후 순수 이름 길이가 긴 순서대로 우선 대조
 */
export function matchImagesToCharacters(
  images: ImageToMatch[],
  characters: MatchCandidateCharacter[]
): Record<string, MatchResult> {
  const results: Record<string, MatchResult> = {};
  const usedStandingKeys = new Set<string>(); // `${charId}_${imgId}`

  // 수식어([PC1] 등)를 제거한 순수 캐릭터 이름 길이 역순으로 정렬 (예: '앨리스 오'가 '앨리스'보다 우선 대조)
  const sortedChars = [...characters].sort((a, b) => {
    const cleanB = cleanCharacterName(b.charName || '');
    const cleanA = cleanCharacterName(a.charName || '');
    return cleanB.length - cleanA.length;
  });

  // [1순위: 코코포리아 고유 식별자(img_001 등) 완전 일치]
  images.forEach(img => {
    if (results[img.url]) return;
    const rawBase = (img.fileName || '').replace(/\.[^/.]+$/, '').trim();
    const normRaw = normalizeString(rawBase);
    if (!normRaw) return;

    for (const char of sortedChars) {
      for (const cImg of char.images) {
        const normId = normalizeString(cImg.id || '');
        if (!normId) continue;

        // img_001 <-> img_1, 1 등 번호 정규화 대조
        const matchA = normId.match(/^(?:img|image|asset)?(\d+)$/i);
        const matchB = normRaw.match(/^(?:img|image|asset)?(\d+)$/i);
        const isNumericIdMatch = !!(matchA && matchB && parseInt(matchA[1], 10) === parseInt(matchB[1], 10));

        if (normId === normRaw || isNumericIdMatch) {
          const key = `${char.charId}_${cImg.id}`;
          if (!usedStandingKeys.has(key)) {
            usedStandingKeys.add(key);
            results[img.url] = {
              charId: char.charId,
              targetImgId: cImg.id,
              reason: `고유 식별자 일치 (${cImg.id})`
            };
            return;
          }
        }
      }
    }
  });

  // [2순위: 캐릭터 이름 및 번호 접미사/접두사 대조]
  // 예: '앨리스 오.png', '앨리스 오_01.png', '01_앨리스 오.png'
  images.forEach(img => {
    if (results[img.url]) return;
    const rawBase = (img.fileName || '').replace(/\.[^/.]+$/, '').trim();
    const normRaw = normalizeString(rawBase);
    if (!normRaw) return;

    for (const char of sortedChars) {
      const cleanName = cleanCharacterName(char.charName);
      const normChar = normalizeString(cleanName);
      if (!normChar) continue;

      let isMatched = false;

      // 1) 전체 이름 완전 일치 (공백/특수문자 무시: '앨리스 오' === '앨리스오')
      if (normRaw === normChar) {
        isMatched = true;
      }
      // 2) 후행 번호 접미사 형태 (예: '앨리스 오_01' -> normRaw: '앨리스오01', remainder: '01')
      else if (normRaw.startsWith(normChar)) {
        const remainder = normRaw.slice(normChar.length);
        if (/^\d+$/.test(remainder)) {
          isMatched = true;
        }
      }
      // 3) 선행 번호 접두사 형태 (예: '01_앨리스 오' -> normRaw: '01앨리스오', prefix: '01')
      else if (normRaw.endsWith(normChar)) {
        const prefix = normRaw.slice(0, normRaw.length - normChar.length);
        if (/^\d+$/.test(prefix)) {
          isMatched = true;
        }
      }

      if (isMatched) {
        // 기존 스탠딩 중 최적의 ID 매칭 시도
        let targetImg = char.images.find(ci => {
          const ciNorm = normalizeString(ci.name || ci.id || '');
          return !usedStandingKeys.has(`${char.charId}_${ci.id}`) && (ciNorm === normRaw);
        });

        if (!targetImg) {
          targetImg = char.images.find(ci => !usedStandingKeys.has(`${char.charId}_${ci.id}`));
        }

        if (targetImg) {
          usedStandingKeys.add(`${char.charId}_${targetImg.id}`);
        }

        results[img.url] = {
          charId: char.charId,
          targetImgId: targetImg?.id,
          reason: `캐릭터명 일치 (${char.charName})`
        };
        return;
      }
    }
  });

  return results;
}
