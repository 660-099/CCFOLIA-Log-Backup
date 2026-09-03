const fs = require('fs');
const path = './CHANGELOG.md';
let content = fs.readFileSync(path, 'utf8');

const newEntry = `## [1.10.13] - 2026-08-31
- [Removed] 다중 파일 업로드 기능 임시 중단에 따라, 삽화 탭 목록에서 불필요해진 파일명 구분 헤더(핑크색 라인) 렌더링 제거

`;

content = content.replace('# Changelog\n', '# Changelog\n\n' + newEntry);
fs.writeFileSync(path, content);
console.log('Changelog updated');
