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
      }
      if (el.tagName === 'FONT') {
        const color = el.getAttribute('color');
        if (color) {
          content = \`[c:\${rgbToHexInternal(color)}]\${content}[/c]\`;
        }
      }

      // Check inline styles for colors
      const bgColor = el.style.backgroundColor || (el as any).style?.background;
      if (bgColor && bgColor !== 'transparent' && bgColor !== 'inherit' && bgColor !== 'initial') {
        content = \`[bg:\${rgbToHexInternal(bgColor)}]\${content}[/bg]\`;
      }
      
      const color = el.style.color;
      if (color && color !== 'inherit' && color !== 'transparent' && color !== 'initial') {
        content = \`[c:\${rgbToHexInternal(color)}]\${content}[/c]\`;
      }

      return content;`;

const replace = `      if (el.tagName === 'B' || el.tagName === 'STRONG') {
        content = \`**\${content}**\`;
      } else if (el.tagName === 'I' || el.tagName === 'EM') {
        content = \`*\${content}*\`;
      } else if (el.tagName === 'U') {
        content = \`__\${content}__\`;
      } else if (el.tagName === 'S' || el.tagName === 'STRIKE') {
        content = \`~~\${content}~~\`;
      } else if (el.tagName === 'MARK') {
        const bg = el.style.backgroundColor || '#ffff00';
        content = \`[bg:\${rgbToHexInternal(bg)}]\${content}[/bg]\`;
      }
      
      if (el.tagName === 'FONT') {
        const color = el.getAttribute('color');
        if (color) {
          content = \`[c:\${rgbToHexInternal(color)}]\${content}[/c]\`;
        }
      }

      // Check inline styles for colors
      const bgColor = el.style.backgroundColor || (el as any).style?.background;
      if (bgColor && bgColor !== 'transparent' && bgColor !== 'inherit' && bgColor !== 'initial') {
        content = \`[bg:\${rgbToHexInternal(bgColor)}]\${content}[/bg]\`;
      }
      
      const color = el.style.color;
      if (color && color !== 'inherit' && color !== 'transparent' && color !== 'initial') {
        content = \`[c:\${rgbToHexInternal(color)}]\${content}[/c]\`;
      }

      return content;`;

code = code.replace(target, replace);
fs.writeFileSync('src/utils.ts', code);
