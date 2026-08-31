const fs = require('fs');
const path = './src/components/LogItem.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `  const format = tabSet?.format || 'main';
  const color = char.color || log.color;
  const otherNameColor = disableOtherColor ? (theme === 'dark' ? '#AAAAAA' : '#777777') : color;
  const img = char.imageUrl;`;

const newCode = `  const format = tabSet?.format || 'main';
  const rawColor = char.color || log.color;
  const tabTextColor = tabSet?.textColor;
  const color = tabTextColor || rawColor;
  const nameWeight = tabSet?.isBold !== undefined ? (tabSet.isBold ? 'bold' : 'normal') : 'bold';
  const nameFontStyle = tabSet?.isItalic ? 'italic' : 'normal';
  const otherNameColor = disableOtherColor ? (theme === 'dark' ? '#AAAAAA' : '#777777') : color;
  const contentColor = tabTextColor || (theme === 'dark' ? '#FFFFFF' : '#333333');
  const otherContentColor = tabTextColor || (theme === 'dark' ? '#AAAAAA' : '#777777');
  const contentWeight = tabSet?.isBold ? 'bold' : 'normal';
  const contentFontStyle = tabSet?.isItalic ? 'italic' : 'normal';
  const img = char.imageUrl;`;

if (content.includes(target)) {
  content = content.replace(target, newCode);
  fs.writeFileSync(path, content);
  console.log('Fixed colors');
} else {
  console.log('Target not found in colors');
}
