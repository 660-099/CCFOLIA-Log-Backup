import { LogEntry, CharSetting, TabSetting, TabFormat } from '../types';

export const getDemoData = () => {
  const tabs: Record<string, TabSetting> = {
    'tab_main': { id: 'tab_main', name: '메인', format: 'main', visible: true },
    'tab_info': { id: 'tab_info', name: '정보', format: 'info', visible: true },
    'tab_secret': { id: 'tab_secret', name: '비밀', format: 'secret', visible: true, color: '#9c27b0' },
  };

  const chars: Record<string, CharSetting> = {
    'char_gm': { id: 'char_gm', name: 'GM', color: '#888888', imageUrl: '', images: [], visible: true },
    'char_a': { id: 'char_a', name: '캐릭터A', color: '#ff6b6b', imageUrl: 'https://i.imgur.com/LcJuLoU.png', images: [{id: 'demo_img_1', url: 'https://i.imgur.com/LcJuLoU.png', isRepresentative: true}], visible: true },
    'char_b': { id: 'char_b', name: '캐릭터B', color: '#4dabf7', imageUrl: 'https://i.imgur.com/Ihna3F9.png', images: [{id: 'demo_img_2', url: 'https://i.imgur.com/Ihna3F9.png', isRepresentative: true}], visible: true },
    'char_info': { id: 'char_info', name: '정보', color: '#ffd43b', imageUrl: '', images: [], visible: true },
  };

  const logs: LogEntry[] = [
    { id: 'log_1', tabId: 'tab_main', tab: '메인', charId: 'char_gm', name: 'GM', color: '#888888', content: '[ 코코포리아 로그 편집기 (한냥) ]', isCommand: false },
    { id: 'log_2', tabId: 'tab_main', tab: '메인', charId: 'char_a', name: '캐릭터A', color: '#ff6b6b', content: '본 로그는 사이트의 주요 기능을 설명하는 데모입니다.', isCommand: false },
    { id: 'demo_bgm_1', tabId: 'tab_main', tab: '메인', charId: 'system', name: '', color: '', content: '', isCommand: false, isBgmBlock: true, bgmData: { title: 'BGM 기능도 있어요!', url: 'https://youtu.be/r0Gb6u_dA7o', videoId: 'r0Gb6u_dA7o', startTime: 0, useTimestamp: false } },
    { id: 'log_3', tabId: 'tab_main', tab: '메인', charId: 'char_gm', name: 'GM', color: '#888888', content: '1. 기본 사용법', isCommand: false },
    { id: 'log_4', tabId: 'tab_main', tab: '메인', charId: 'char_a', name: '캐릭터A', color: '#ff6b6b', content: '코코포리아 룸 채팅에서 전체 로그를 추출해 주세요.<br>HTML 파일을 업로드하면 탭 설정으로 넘어가며 편집을 시작할 수 있습니다.', isCommand: false },
    { id: 'log_5', tabId: 'tab_main', tab: '메인', charId: 'char_b', name: '캐릭터B', color: '#4dabf7', content: '[탭]과 [캐릭터] 메뉴를 통해 특정 탭 및 캐릭터의 발언만 필터링하여 출력합니다.<br><span style="color:#999999">Alt 키를 누른 채로 토글 버튼을 클릭하면 해당 탭/캐릭터만 남기고 모두 숨길 수 있습니다. 그대로 다시 누르면 전부 켜짐.</span>', isCommand: false },
    { id: 'log_6', tabId: 'tab_info', tab: '정보', charId: 'char_info', name: '정보', color: '#ffd43b', content: '정보 탭은 이런 식으로 출력됩니다.', isCommand: false },
    { id: 'log_7', tabId: 'tab_main', tab: '메인', charId: 'char_gm', name: 'GM', color: '#888888', content: '나레이터로 설정된 캐릭터의 대사는 중앙 정렬 텍스트로 렌더링됩니다.', isCommand: false },
    { id: 'log_8', tabId: 'tab_main', tab: '메인', charId: 'char_gm', name: 'GM', color: '#888888', content: '1D100 | 다이스는 이렇게 출력됩니다. (1D100) ＞ 1', isCommand: true },
    { id: 'log_9', tabId: 'tab_main', tab: '메인', charId: 'char_b', name: '캐릭터B', color: '#4dabf7', content: '로그 블록의 연필 버튼을 클릭하여 발언자, 탭, 대사 내용을 수정할 수 있습니다.<br><span style="color:#999999">대사 수정 확인버튼 단축키 Ctrl+Enter</span><br>↑↓버튼으로는 블록 위치를 옮길 수 있습니다.<br><i>서식도 </i><u>변경할 수</u><span style="color:#999999"> </span><s>있습니다</s><span style="color:#999999">~ </span><b>짠!  </b><span style="color:#999999">[탭] 메뉴에서 각각의 탭에 일괄 서식을 적용할 수도 있어요.</span>', isCommand: false },
    { id: 'log_10', tabId: 'tab_secret', tab: '비밀', charId: 'char_b', name: '캐릭터B', color: '#4dabf7', content: '키보드 단축키 Ctrl+Z(실행 취소) 및 Ctrl+Y(다시 실행)를 지원합니다.', isCommand: false },
    { id: 'log_11', tabId: 'tab_main', tab: '메인', charId: 'char_gm', name: 'GM', color: '#888888', content: '2. 기능 설명', isCommand: false },
    { id: 'log_12', tabId: 'tab_main', tab: '메인', charId: 'char_a', name: '캐릭터A', color: '#ff6b6b', content: '블록 사이에 마우스를 올리면 여러 가지를 추가할 수 있습니다.', isCommand: false },
    { id: 'log_13', tabId: 'tab_main', tab: '메인', charId: 'char_b', name: '캐릭터B', color: '#4dabf7', content: '\'분할\' 버튼을 누르면 이렇게 분홍 헤더가 생기는데, 섹션을 구분하는 기능입니다. 이걸 기준으로 분할 내보내기가 가능합니다.<br><span style="color:#999999">헤더를 눌러서 섹션 제목을 수정할 수도 있습니다. 미리보기 좌측 아래의 목차 버튼에 마우스를 올리면 원하는 섹션 헤더로 바로 이동할 수 있는 목록이 나타나요!</span><br><br>\'삽화\' 버튼으로 로그 사이에 이미지를 삽입할 수 있습니다.', isCommand: false },
    { id: 'demo_img_1', tabId: 'tab_main', tab: '메인', charId: 'system', name: '', color: '', content: 'https://i.imgur.com/pMa7RYJ.jpeg', isCommand: false, isIllustration: true, imageName: '삽화', width: '50%', align: 'center', tabOverride: 'auto' },
    { id: 'log_14', tabId: 'tab_main', tab: '메인', charId: 'char_b', name: '캐릭터B', color: '#4dabf7', content: '[삽화] 메뉴에서 Imgur 앨범 링크를 입력해 다수의 이미지를 한 번에 업로드할 수 있습니다.<br>마찬가지로 [캐릭터] 메뉴에서 \'이미지 일괄 등록\' 버튼을 눌러 스탠딩과 삽화를 한 번에 업로드할 수 있습니다.', isCommand: false },
    { id: 'log_15', tabId: 'tab_main', tab: '메인', charId: 'char_a', name: '캐릭터A', color: '#ff6b6b', content: '\'BGM\'은 유튜브 링크만 삽입 가능합니다.<br><span style="color:#999999">블로그가 아닌 HTML 파일에서는 재생되지 않습니다.</span>', isCommand: false },
    { id: 'demo_bgm_2', tabId: 'tab_main', tab: '메인', charId: 'system', name: '', color: '', content: '', isCommand: false, isBgmBlock: true, bgmData: { title: '새로운 BGM을 클릭하면 자동으로 전환됩니다. 우측 하단 CD를 누르면 미니 플레이어가 생겨요!', url: 'https://youtu.be/AK9FYjzmZt4', videoId: 'AK9FYjzmZt4', startTime: 0, useTimestamp: false } },
    { id: 'log_16', tabId: 'tab_main', tab: '메인', charId: 'char_b', name: '캐릭터B', color: '#4dabf7', content: '[캐릭터] 메뉴의 \'캐릭터 보관함\'을 이용하면 스탠딩 이미지 URL과 테마 색상을 저장해두고 간편하게 재사용할 수 있습니다.<br><span style="color:#999999">해당 데이터는 로컬 스토리지에 저장되어 재접속 시에도 유지됩니다. 브라우저 캐시 삭제 시 없어짐.</span>', isCommand: false },
    { id: 'log_17', tabId: 'tab_main', tab: '메인', charId: 'char_a', name: '캐릭터A', color: '#ff6b6b', content: '[디자인] 메뉴에서 로그 필터 컨트롤러 옵션으로, 내보낸 HTML 파일에도 출력 로그에 탭/발언자 필터링 컨트롤러를 추가할 수 있습니다.<br><br><span style="color:#999999">CSS 출력 형식에 대해서...</span><br><span style="color:#999999">  ▷ 복붙할 때 코드가 짧은 게 좋다 → 내부 스타일</span><br><span style="color:#999999">  ▷ 티스토리 기본스킨을 사용한다, 주소에 m이 들어간 모바일 모드를 사용한다 → 인라인 스타일</span>', isCommand: false },
    { id: 'log_18', tabId: 'tab_main', tab: '메인', charId: 'char_b', name: '캐릭터B', color: '#4dabf7', content: '<span style="color:#999999">사이트 좌측 하단의 \'설정 기억하기\'는 탭 및 디자인 설정을 브라우저에 저장해 새로고침 시에도 바뀌지 않도록 하는 기능입니다. 매번 똑같은 디자인으로 버튼 딸깍을 원하시는 분들께 추천해 드립니다.</span><br><br><i>그 외 자잘한 기능 다수... 생략!</i>', isCommand: false },
    { id: 'log_19', tabId: 'tab_main', tab: '메인', charId: 'char_gm', name: 'GM', color: '#888888', content: '3. 내보내기 및 저장', isCommand: false },
    { id: 'log_20', tabId: 'tab_main', tab: '메인', charId: 'char_a', name: '캐릭터A', color: '#ff6b6b', content: '편집 완료 후 우측 상단의 [HTML 내보내기] 버튼을 클릭하면 복붙/다운로드용 HTML 코드가 생성됩니다.', isCommand: false },
    { id: 'log_21', tabId: 'tab_secret', tab: '비밀', charId: 'char_b', name: '캐릭터B', color: '#4dabf7', content: '<span style="color:#999999">더 상세한 도움말은 이쪽을 참고해주세요!</span><br><span style="color:#999999">https://posty.pe/7s025t</span><br><br><span style="color:#999999">오류 제보, 문의 등등도 포스타입으로...</span>', isCommand: false },
  ];

  const insertedBlocks: Record<string, any[]> = {
    'log_12': [ 
       { id: 'demo_split_1', type: 'split', name: '' }
    ]
  };

  return {
    tabs,
    tabOrder: ['tab_main', 'tab_info', 'tab_secret'],
    chars,
    charOrder: ['char_gm', 'char_a', 'char_b', 'char_info'],
    logs,
    insertedBlocks,
    narrationCharacter: 'char_gm'
  };
};
