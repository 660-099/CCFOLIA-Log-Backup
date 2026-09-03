const fs = require('fs');
const path = './CHANGELOG.md';
let content = fs.readFileSync(path, 'utf8');

const newEntry = `## [1.10.12] - 2026-08-31
- [Added] 개별 탭 설정의 텍스트 색상 옵션에 발언자 이름 색상 적용 여부를 제어하는 토글 버튼(사람 모양 아이콘) 추가
- [Changed] 볼드(굵게) 및 이탤릭(기울임) 서식 적용 시 캐릭터 이름에는 적용되지 않고 대사 내용에만 적용되도록 분리
- [Changed] '잡담' 탭에서 '잡담 색상을 회색으로 통일' 옵션 활성화 시 캐릭터 이름도 탭 설정 색상(또는 기본 회색)을 따르도록 예외 로직 추가

`;

content = content.replace('# Changelog\n', '# Changelog\n\n' + newEntry);
fs.writeFileSync(path, content);
console.log('Changelog updated');
