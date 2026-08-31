const fs = require('fs');
const path = './src/types.ts';
let content = fs.readFileSync(path, 'utf8');

const target = `export interface TabSetting {
  id: string;
  name: string;
  format: TabFormat;
  visible: boolean;
  color?: string; // For secret format`;

const newCode = `export interface TabSetting {
  id: string;
  name: string;
  format: TabFormat;
  visible: boolean;
  color?: string; // For secret format
  textColor?: string;
  isBold?: boolean;
  isItalic?: boolean;`;

if (content.includes(target)) {
  content = content.replace(target, newCode);
  fs.writeFileSync(path, content);
  console.log('Fixed types.ts');
} else {
  console.log('Target not found in types.ts');
}
