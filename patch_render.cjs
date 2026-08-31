const fs = require('fs');
const path = './src/components/LogItem.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  `              <div style={{ fontWeight: 'bold', color, fontSize: \`\${nameSize}px\`, width: 'var(--name-col-width, 120px)', flexShrink: 0, textAlign: 'right' }}>`,
  `              <div style={{ fontWeight: nameWeight, fontStyle: nameFontStyle, color, fontSize: \`\${nameSize}px\`, width: 'var(--name-col-width, 120px)', flexShrink: 0, textAlign: 'right' }}>`
);

content = content.replace(
  `                    <div dangerouslySetInnerHTML={{ __html: piece }} style={{ color: theme === 'dark' ? '#FFFFFF' : '#333333', fontSize: \`\${scaledTextFontSize}px\`, fontWeight: 'bold', whiteSpace: 'pre-wrap', wordBreak: 'keep-all', overflowWrap: 'break-word' }} />`,
  `                    <div dangerouslySetInnerHTML={{ __html: piece }} style={{ color: contentColor, fontSize: \`\${scaledTextFontSize}px\`, fontWeight: tabSet?.isBold !== undefined ? contentWeight : 'bold', fontStyle: contentFontStyle, whiteSpace: 'pre-wrap', wordBreak: 'keep-all', overflowWrap: 'break-word' }} />`
);

content = content.replace(
  `              color: theme === 'dark' ? '#FFFFFF' : '#333333',
              lineHeight: lineHeight,
              fontSize: \`\${scaledTextFontSize}px\`,
              letterSpacing: letterSpacing === 0 ? 'normal' : \`\${scaledLetterSpacing}px\`,
              fontWeight: 'bold',
              fontStyle: narrationFormat === 'style1' ? 'italic' : 'normal',`,
  `              color: contentColor,
              lineHeight: lineHeight,
              fontSize: \`\${scaledTextFontSize}px\`,
              letterSpacing: letterSpacing === 0 ? 'normal' : \`\${scaledLetterSpacing}px\`,
              fontWeight: tabSet?.isBold !== undefined ? contentWeight : 'bold',
              fontStyle: tabSet?.isItalic !== undefined ? contentFontStyle : (narrationFormat === 'style1' ? 'italic' : 'normal'),`
);

content = content.replace(
  `                <span style={{ fontWeight: 'bold', color: otherNameColor, fontSize: \`\${nameSize}px\` }} className="cursor-default" dangerouslySetInnerHTML={{ __html: safeHtmlName }} />`,
  `                <span style={{ fontWeight: nameWeight, fontStyle: nameFontStyle, color: otherNameColor, fontSize: \`\${nameSize}px\` }} className="cursor-default" dangerouslySetInnerHTML={{ __html: safeHtmlName }} />`
);

content = content.replace(
  `              <div style={{ flex: 1, minWidth: 0, color: theme === 'dark' ? '#AAAAAA' : '#777777', fontSize: \`\${scaledTextFontSize}px\`, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }} dangerouslySetInnerHTML={{ __html: safeHtmlContent }} />`,
  `              <div style={{ flex: 1, minWidth: 0, color: otherContentColor, fontWeight: contentWeight, fontStyle: contentFontStyle, fontSize: \`\${scaledTextFontSize}px\`, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }} dangerouslySetInnerHTML={{ __html: safeHtmlContent }} />`
);

content = content.replace(
  `                  <span style={{ fontWeight: 'bold', color, display: 'block', fontSize: \`\${nameSize}px\` }} className="cursor-default" dangerouslySetInnerHTML={{ __html: safeHtmlName }} />`,
  `                  <span style={{ fontWeight: nameWeight, fontStyle: nameFontStyle, color, display: 'block', fontSize: \`\${nameSize}px\` }} className="cursor-default" dangerouslySetInnerHTML={{ __html: safeHtmlName }} />`
);

content = content.replace(
  `              <div dangerouslySetInnerHTML={{ __html: safeHtmlContent }} style={{ color: theme === 'dark' ? 'inherit' : '#333333', fontSize: \`\${scaledTextFontSize}px\`, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }} />`,
  `              <div dangerouslySetInnerHTML={{ __html: safeHtmlContent }} style={{ color: tabTextColor || (theme === 'dark' ? 'inherit' : '#333333'), fontWeight: contentWeight, fontStyle: contentFontStyle, fontSize: \`\${scaledTextFontSize}px\`, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }} />`
);

content = content.replace(
  `                  <div style={{ fontWeight: 'bold', color, fontSize: \`\${nameSize}px\`, width: 'var(--name-col-width, 120px)', flexShrink: 0, textAlign: 'right' }}>`,
  `                  <div style={{ fontWeight: nameWeight, fontStyle: nameFontStyle, color, fontSize: \`\${nameSize}px\`, width: 'var(--name-col-width, 120px)', flexShrink: 0, textAlign: 'right' }}>`
);

content = content.replace(
  `                    <div dangerouslySetInnerHTML={{ __html: safeHtmlContent }} style={{ color: theme === 'dark' ? 'inherit' : '#333333', fontSize: \`\${scaledTextFontSize}px\`, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }} />`,
  `                    <div dangerouslySetInnerHTML={{ __html: safeHtmlContent }} style={{ color: tabTextColor || (theme === 'dark' ? 'inherit' : '#333333'), fontWeight: contentWeight, fontStyle: contentFontStyle, fontSize: \`\${scaledTextFontSize}px\`, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }} />`
);

content = content.replace(
  `                        style={{ fontWeight: 'bold', color, fontSize: \`\${nameSize}px\`, marginBottom: Math.max(4, Math.ceil(scaledTextFontSize * (lineHeight >= 1.4 ? 0.3 : 0.5))) + 'px' }}`,
  `                        style={{ fontWeight: nameWeight, fontStyle: nameFontStyle, color, fontSize: \`\${nameSize}px\`, marginBottom: Math.max(4, Math.ceil(scaledTextFontSize * (lineHeight >= 1.4 ? 0.3 : 0.5))) + 'px' }}`
);

content = content.replace(
  `                    <div dangerouslySetInnerHTML={{ __html: safeHtmlContent }} style={{ color: theme === 'dark' ? 'inherit' : '#333333', fontSize: \`\${scaledTextFontSize}px\`, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }} />`,
  `                    <div dangerouslySetInnerHTML={{ __html: safeHtmlContent }} style={{ color: tabTextColor || (theme === 'dark' ? 'inherit' : '#333333'), fontWeight: contentWeight, fontStyle: contentFontStyle, fontSize: \`\${scaledTextFontSize}px\`, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }} />`
);

fs.writeFileSync(path, content);
console.log('Done replacement');
