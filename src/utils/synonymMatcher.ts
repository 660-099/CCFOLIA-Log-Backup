/**
 * 다중 언어 동의어 사전 매칭 로직
 * 한국어와 영어 입력(예: 우유/milk)을 동일한 카테고리로 묶어 처리합니다.
 */

export interface SynonymCategory {
  category: string;
  terms: string[];
}

export const SYNONYM_DICTIONARY: Record<string, string[]> = {
  milk: ['milk', '우유', '밀크', 'dairy', '유제품'],
  image: ['image', '이미지', '사진', 'photo', 'picture', 'pic'],
  avatar: ['avatar', '아바타', '스탠딩', 'standing', 'profile', '초상화', 'face'],
  illustration: ['illustration', '삽화', '일러스트', 'cg', 'cutscene'],
  character: ['character', '캐릭터', '인물', '등장인물', 'char', 'person'],
  background: ['background', '배경', 'bg', 'bgm', 'soundtrack', '음악'],
  log: ['log', '로그', '대화', 'chat', 'message', 'text', '기록'],
  copy: ['copy', '복사', '클립보드', 'clipboard'],
  download: ['download', '다운로드', '저장', 'save', '내보내기', 'export'],
  format: ['format', '서식', '포맷', '스타일', 'style', 'css']
};

export const matchCategory = (input: string): string | null => {
  if (!input) return null;
  const cleanInput = input.trim().toLowerCase();

  for (const [category, synonyms] of Object.entries(SYNONYM_DICTIONARY)) {
    if (synonyms.some(term => term.toLowerCase() === cleanInput || cleanInput.includes(term.toLowerCase()))) {
      return category;
    }
  }

  return null;
};

export const getSynonyms = (termOrCategory: string): string[] => {
  const category = matchCategory(termOrCategory) || termOrCategory.toLowerCase();
  return SYNONYM_DICTIONARY[category] || [termOrCategory];
};
