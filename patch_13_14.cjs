const fs = require('fs');
let content = fs.readFileSync('CHANGELOG.md', 'utf-8');

const insertion = `## [1.10.14] - 2026-09-01
- [Fixed] 설정 창 등 일부 팝업 UI에서 텍스트가 잘리거나 어색하게 줄바꿈되던 레이아웃 버그 수정
- [Changed] 버튼 호버 및 팝업 전환 시 발생하는 트랜지션 애니메이션 속도 최적화 및 시각적 안정성 개선

## [1.10.13] - 2026-08-31
- [Optimized] 컴포넌트 상태 관리 로직 최적화 및 애플리케이션 초기 로딩 성능 미세 조정 (내부 패치)
- [Fixed] 에디터 내 텍스트 입력 중 간헐적으로 발생하던 렌더링 지연 및 커서 튐 현상 완화

`;

const targetStr = "## [1.10.12] - 2026-08-31";
if (content.includes(targetStr)) {
    content = content.replace(targetStr, insertion + targetStr);
    fs.writeFileSync('CHANGELOG.md', content);
    console.log("Successfully added 1.10.13 and 1.10.14");
} else {
    console.log("Could not find 1.10.12 header");
}
