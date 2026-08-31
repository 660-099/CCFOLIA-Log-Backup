const fs = require('fs');
const path = './CHANGELOG.md';
let content = fs.readFileSync(path, 'utf8');

const newEntry = `## [1.10.11] - 2026-08-30
- [Added] 개별 탭 설정에 텍스트 일괄 서식 변경(글자색, 굵게, 이탤릭) 인라인 버튼 그룹 추가 및 렌더링 적용
- [Changed] 사이드바 나레이션 출력 디자인 토글을 가로형 세그먼트 컨트롤 UI로 개선
- [Removed] 미리보기 탭 렌더링 최적화를 위해 블록 순서 변경(위/아래 이동)을 제외한 불필요한 위치 슬라이딩 애니메이션 제거

`;

content = content.replace('# Changelog\n', '# Changelog\n\n' + newEntry);
fs.writeFileSync(path, content);
console.log('Changelog updated');
