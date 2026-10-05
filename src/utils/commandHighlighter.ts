export function highlightCommandCharacterNames(
  pieceHtml: string,
  charSettings: Record<string, any>
): string {
  if (!pieceHtml || !charSettings || Object.keys(charSettings).length === 0) return pieceHtml;

  // Extract unique character names & clean names mapped to their color
  const candidates: { target: string; color: string }[] = [];
  const seenTargets = new Set<string>();

  Object.values(charSettings).forEach((c: any) => {
    if (!c || !c.name || !c.color) return;
    const rawName = c.name.trim();
    if (!rawName || rawName.toLowerCase() === 'system') return;

    const cleanName = rawName.replace(/\[.*?\]|\(.*?\)|【.*?】|<.*?>/g, '').trim();

    [rawName, cleanName].forEach(target => {
      if (target && target.length >= 1 && !seenTargets.has(target.toLowerCase())) {
        seenTargets.add(target.toLowerCase());
        candidates.push({ target, color: c.color });
      }
    });
  });

  if (candidates.length === 0) return pieceHtml;

  // Sort longest names first to prevent partial prefix conflicts (e.g. '앨리스 오' before '앨리스')
  candidates.sort((a, b) => b.target.length - a.target.length);

  // Split by HTML tags to safely operate on text only
  const parts = pieceHtml.split(/(<[^>]*>)/);

  for (let i = 0; i < parts.length; i += 2) {
    let text = parts[i];
    if (!text) continue;

    for (const { target, color } of candidates) {
      const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // 1. Inside brackets: [ ... ], ( ... ), 【 ... 】
      // e.g. [ 앨리스 ], (앨리스), 【 앨리스 】, 【앨리스: 이성깎】, [ 앨리스 1D3 ]
      const bracketRegex = new RegExp(`([\\[\\(【][^\\]\\)】]*?)(${escaped})([^\\]\\)】*?[\\]\\)】])`, 'g');
      text = text.replace(bracketRegex, (match, prefix, nameMatch, suffix) => {
        return `${prefix}<span style="color: ${color}; font-weight: bold;">${nameMatch}</span>${suffix}`;
      });

      // 2. Colons or arrows: 앨리스 : 1D3 or 앨리스: or 앨리스 > or 앨리스 ＞
      const colonRegex = new RegExp(`(^|\\s|[>＞])(${escaped})(\\s*[:：>＞])`, 'g');
      text = text.replace(colonRegex, (match, prefix, nameMatch, suffix) => {
        return `${prefix}<span style="color: ${color}; font-weight: bold;">${nameMatch}</span>${suffix}`;
      });

      // 3. Next to TRPG dice / SAN / sanity loss keywords:
      // e.g. 앨리스 이성, 앨리스 SAN, 앨리스 이성깎, 앨리스의 이성 손실, 1D3 앨리스
      const sanRegex = new RegExp(`(?:(^|\\s|[+*/-])(${escaped})(\\s*(?:님)?\\s*(?:의)?\\s*(?:이성|SAN|다이스|체크|감소|손실|깎)))|(?:((?:이성|SAN|체크|감소|손실|깎)\\s*[-~:]?\\s*)(${escaped})($|\\s|[+*/-]))`, 'g');
      text = text.replace(sanRegex, (match, p1, name1, s1, p2, name2, s2) => {
        if (name1) {
          return `${p1 || ''}<span style="color: ${color}; font-weight: bold;">${name1}</span>${s1}`;
        }
        if (name2) {
          return `${p2}<span style="color: ${color}; font-weight: bold;">${name2}</span>${s2 || ''}`;
        }
        return match;
      });
    }

    parts[i] = text;
  }

  return parts.join('');
}
