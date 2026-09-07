const fs = require('fs');

let content = fs.readFileSync('CHANGELOG.md', 'utf-8');

const targetStr = "## v1.10.17";
const targetIdx = content.indexOf(targetStr);

if (targetIdx !== -1) {
    const newContent = content.substring(0, targetIdx) + `## v1.10.17 (2026-09-07)
- [Added] 캐릭터별 다중 스탠딩 이미지(표정/의상 등 여러 장) 할당 기능 전면 도입
- [Added] 한 캐릭터에 할당된 다중 이미지 중 하나를 기본값으로 사용하는 '대표 이미지' 지정 기능 추가
- [Changed] 이미지 일괄 배분 모달(BulkImageAllocatorModal) 레이아웃 좌/우 분할 뷰(Split View) 체계로 전면 개편
  - 좌측: 미할당/전체 갤러리 이미지 표시 (우측으로 할당된 이미지는 회색으로 비활성화 처리)
  - 우측: 현재 선택된 캐릭터에게 할당된 스탠딩 이미지들 모아보기
- [Changed] 캐릭터 목록의 '삽화' 패널을 스크롤과 무관하게 화면 하단 쪽에 항상 고정되도록 디자인 개선
- [Changed] 미지정 이미지를 일괄 삽화로 등록하는 기능을 단순 버튼에서 직관적인 토글 스위치(On/Off) 방식으로 변경
- [Changed] 스탠딩 팝업(AvatarImagePopup, CharImagePanelPopup)의 패널 고정 핀 버튼 위치 이동(이름 좌측) 및 활성화 시 아이콘 채우기(Fill) 디자인 피드백 적용
- [Optimized] 스탠딩 팝업 호출 시, 마우스 클릭 위치(화면 상단/하단)에 따라 팝업이 썸네일에 겹치지 않고 위아래 유동적으로 열리도록 위치 렌더링 최적화
- [Fixed] 이미지 일괄 배분 모달에서 썸네일을 클릭할 때마다 할당된 이미지 갯수가 비정상적으로 누적 카운팅되던 버그 수정
- [Fixed] 캐릭터 스탠딩 패널 팝업에서 배경 등 외부 영역 클릭 시 변경한 이미지가 즉각 저장/적용되지 않고 유실되던 버그 수정
- [Changed] 이미지 일괄 갤러리 썸네일 UI 개편: X(제거) 버튼 우측 상단 모서리 겹침 배치 및 대표 지정이 아닌 이미지의 '대표' 뱃지 비활성화 톤다운 디자인 적용
- [Changed] 불필요하게 긴 UI 텍스트 간소화 및 정돈 ("앨범 불러오기" -> "불러오기", "삽화 (배경/CG 등)" -> "삽화", "적용 완료" -> "완료", "이미지 일괄 등록: 스탠딩 선택" -> "이미지 일괄 등록 - 스탠딩 선택")
- [Changed] 환경설정 메뉴 내 스탠딩 관련 메뉴들('스탠딩 숨김', '얼굴 위주 크롭 (상단 1:1)', '스탠딩 배경 숨김')을 관련 기능끼리 모이도록 표시 순서 재배치
`;

    fs.writeFileSync('CHANGELOG.md', newContent);
    console.log("CHANGELOG.md fully updated with v1.10.17 details.");
} else {
    console.log("Could not find v1.10.17 heading in CHANGELOG.md.");
}
