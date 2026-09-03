const fs = require('fs');
let code = fs.readFileSync('CHANGELOG.md', 'utf-8');

const newEntry = `## [1.10.15] - 2026-09-01
- [Fixed] 에디터에서 볼드/이탤릭 등 텍스트 서식과 글자색/배경색이 동시에 중첩 적용되지 않던 버그 수정
- [Fixed] 수정 모드 진입 직후나 블록 추가 후 일부 블록 사이에 마우스를 올려도 블록 추가/수정 버튼(BoundaryEditor)이 나타나지 않던 버그 수정 (hover 상태 잔존 버그 해결)
- [Fixed] 우측 하단 BGM 플레이어가 숨겨져 있을 때에도 투명하게 클릭 영역을 차지하여 다른 버튼 클릭을 방해하던 문제 수정
- [Changed] 데모 로그 보기 버튼에 마우스 호버 시 딜레이 없이 즉시 밝아지도록 트랜지션 제거 및 손가락(Pointer) 마우스 커서 적용
- [Changed] BGM 블록 재생 중 블록을 다시 클릭하면 일시 정지되고, 한 번 더 클릭하면 처음부터 다시 재생되도록 동작 개선
- [Changed] 대사 텍스트 에디터에서 숫자 리스트(1.)나 하이픈(-) 입력 시 의도치 않게 리스트(목록) 서식으로 자동 변환되는 기능 제거

`;

code = code.replace('# Changelog\n', '# Changelog\n\n' + newEntry);
fs.writeFileSync('CHANGELOG.md', code);

let pkg = fs.readFileSync('package.json', 'utf-8');
pkg = pkg.replace('"version": "1.10.14"', '"version": "1.10.15"');
fs.writeFileSync('package.json', pkg);
