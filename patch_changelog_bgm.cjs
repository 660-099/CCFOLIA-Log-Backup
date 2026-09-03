const fs = require('fs');
const path = './CHANGELOG.md';
let content = fs.readFileSync(path, 'utf8');

const newEntry = `## [1.10.14] - 2026-08-31
- [Fixed] BGM 블록 위로 삽화를 드래그 앤 드롭하여 삽입할 수 없었던 버그 수정 (BGM 렌더러에 드래그 이벤트 핸들러 누락 문제 해결)

`;

content = content.replace('# Changelog\n', '# Changelog\n\n' + newEntry);
fs.writeFileSync(path, content);
console.log('Changelog updated');
