const fs = require('fs');
const path = './src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `    const elementB = document.querySelector(\`[data-index="\${targetIdx}"]\`) as HTMLElement;
    const heightB = elementB ? elementB.getBoundingClientRect().height : 0;

    setLogs(prevLogs => {`;

const newCode = `    const elementB = document.querySelector(\`[data-index="\${targetIdx}"]\`) as HTMLElement;
    const heightB = elementB ? elementB.getBoundingClientRect().height : 0;

    setIsMovingBlock(true);
    setTimeout(() => setIsMovingBlock(false), 250);

    setLogs(prevLogs => {`;

if (content.includes(target)) {
  content = content.replace(target, newCode);
  fs.writeFileSync(path, content);
  console.log('Fixed onMoveLog');
} else {
  console.log('Target not found in onMoveLog');
}
