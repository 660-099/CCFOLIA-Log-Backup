const fs = require('fs');
let code = fs.readFileSync('src/utils.ts', 'utf-8');

const target = `      if (el.tagName === 'B' || el.tagName === 'STRONG') {
        return \`**\${content}**\`;
      }
      if (el.tagName === 'I' || el.tagName === 'EM') {
        return \`*\${content}*\`;
      }
      if (el.tagName === 'U') {
        return \`__\${content}__\`;
      }
      if (el.tagName === 'S' || el.tagName === 'STRIKE') {
        return \`~~\${content}~~\`;
      }
      if (el.tagName === 'MARK') {
        const bg = el.style.backgroundColor || '#ffff00';
        return \`[bg:\${rgbToHexInternal(bg)}]\${content}[/bg]\`;
      }`;

const replace = `      // First apply text formatting styles
      if (el.tagName === 'B' || el.tagName === 'STRONG' || el.style.fontWeight === 'bold' || el.style.fontWeight === '700' || el.style.fontWeight > '400') {
        content = \`**\${content}**\`;
      }
      if (el.tagName === 'I' || el.tagName === 'EM' || el.style.fontStyle === 'italic') {
        content = \`*\${content}*\`;
      }
      if (el.tagName === 'U' || el.style.textDecoration === 'underline') {
        content = \`__\${content}__\`;
      }
      if (el.tagName === 'S' || el.tagName === 'STRIKE' || el.style.textDecoration === 'line-through') {
        content = \`~~\${content}~~\`;
      }
      if (el.tagName === 'MARK') {
        const bg = el.style.backgroundColor || '#ffff00';
        content = \`[bg:\${rgbToHexInternal(bg)}]\${content}[/bg]\`;
      }`;

code = code.replace(target, replace);
fs.writeFileSync('src/utils.ts', code);
