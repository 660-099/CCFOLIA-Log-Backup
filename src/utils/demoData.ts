import { LogEntry, CharSetting, TabSetting, TabFormat } from '../types';

export const getDemoData = () => {
  const tabs: Record<string, TabSetting> = {
    'tab_main': { id: 'tab_main', name: '메인', format: 'main', visible: true },
    'tab_info': { id: 'tab_info', name: '정보', format: 'info', visible: true },
    'tab_secret': { id: 'tab_secret', name: '비밀', format: 'secret', visible: true, color: '#FFC107' },
  };

  const chars: Record<string, CharSetting> = {
    'char_gm': { id: 'char_gm', name: 'GM', color: '#888888', imageUrl: '', visible: true },
    'char_a': { id: 'char_a', name: '캐릭터A', color: '#ff6b6b', imageUrl: 'https://i.imgur.com/LcJuLoU.png', visible: true },
    'char_b': { id: 'char_b', name: '캐릭터B', color: '#4dabf7', imageUrl: 'https://i.imgur.com/Ihna3F9.png', visible: true },
    'char_info': { id: 'char_info', name: '정보', color: '#ffd43b', imageUrl: '', visible: true },
  };

  const logs: LogEntry[] = [
    { id: 'log_1', tabId: 'tab_main', tab: '메인', charId: 'char_gm', name: 'GM', color: '#888888', content: '[ 코코포리아 로그 편집기 (한냥) DEMO ]', isCommand: false },
    { id: 'log_2', tabId: 'tab_main', tab: '메인', charId: 'char_a', name: '캐릭터A', color: '#ff6b6b', content: '본 로그는 뷰어의 주요 기능을 설명하는 데모입니다.<br>대사는 메인, 정보, 비밀 탭으로 분류되어 시각화됩니다.', isCommand: false },
    { id: 'demo_bgm_1', tabId: 'tab_main', tab: '메인', charId: 'system', name: '', color: '', content: '', isCommand: false, isBgmBlock: true, bgmData: { title: '로그 블록 사이에 BGM 추가가 가능합니다.', url: 'https://youtu.be/r0Gb6u_dA7o?si=V9hmwWgw31zVoYsX', videoId: 'r0Gb6u_dA7o', startTime: 0, useTimestamp: false } },
    
    { id: 'log_4', tabId: 'tab_main', tab: '메인', charId: 'char_gm', name: 'GM', color: '#888888', content: '기본 사용법', isCommand: false },
    { id: 'log_5', tabId: 'tab_main', tab: '메인', charId: 'char_a', name: '캐릭터A', color: '#ff6b6b', content: '코코포리아 룸 채팅에서 전체 로그를 추출해 주세요.<br>HTML 파일을 업로드하면 탭 설정으로 넘어가며 편집을 시작할 수 있습니다.', isCommand: false },
    { id: 'log_6', tabId: 'tab_main', tab: '메인', charId: 'char_b', name: '캐릭터B', color: '#4dabf7', content: '나레이터로 설정된 캐릭터의 대사는 중앙 정렬 텍스트로 렌더링됩니다.<br>필터 메뉴를 통해 특정 탭 및 캐릭터의 발언만 필터링하여 확인합니다.', isCommand: false },
    
    { id: 'log_7', tabId: 'tab_secret', tab: '비밀', charId: 'char_b', name: '캐릭터B', color: '#4dabf7', content: '정보 및 비밀 탭에 연속으로 속한 로그는 박스로 묶여 그룹화됩니다.', isCommand: false },
    
    { id: 'log_8', tabId: 'tab_info', tab: '정보', charId: 'char_info', name: '정보', color: '#ffd43b', content: '정보 탭은 이런 식으로 출력됩니다.', isCommand: false },
    
    { id: 'log_9', tabId: 'tab_main', tab: '메인', charId: 'char_gm', name: 'GM', color: '#888888', content: '1D100 | 다이스는 이렇게 출력됩니다. (1D100) ＞ 1', isCommand: true },
    
    { id: 'log_10', tabId: 'tab_main', tab: '메인', charId: 'char_b', name: '캐릭터B', color: '#4dabf7', content: '로그 블록의 연필 버튼을 클릭하여 발언자, 탭, 대사 내용을 수정할 수 있습니다.', isCommand: false },
    
    { id: 'log_11', tabId: 'tab_main', tab: '메인', charId: 'char_a', name: '캐릭터A', color: '#ff6b6b', content: '로그 사이에 이미지를 삽입할 수 있습니다.', isCommand: false },
    { id: 'demo_img_1', tabId: 'tab_main', tab: '메인', charId: 'system', name: '', color: '', content: 'https://i.imgur.com/pMa7RYJ.jpeg', isCommand: false, isIllustration: true, imageName: '삽화', width: '500px', align: 'center', tabOverride: 'auto' },
    { id: 'log_12', tabId: 'tab_main', tab: '메인', charId: 'char_a', name: '캐릭터A', color: '#ff6b6b', content: '[삽화] 메뉴에서 Imgur 앨범 링크를 입력하면 다수의 이미지를 한 번에 일괄 업로드합니다.<br>마찬가지로 [캐릭터] 메뉴에서 \'이미지 일괄 등록\' 버튼을 눌러 스탠딩과 삽화를 한 번에 적용시킬 수 있습니다.', isCommand: false },
    
    { id: 'log_13', tabId: 'tab_main', tab: '메인', charId: 'char_b', name: '캐릭터B', color: '#4dabf7', content: '\'캐릭터 보관함\'에 스탠딩 이미지 URL과 테마 색상을 저장할 수 있습니다.<br>해당 데이터는 로컬 스토리지에 저장되어 브라우저 재접속 시에도 유지됩니다.', isCommand: false },
    
    { id: 'log_14', tabId: 'tab_main', tab: '메인', charId: 'char_gm', name: 'GM', color: '#888888', content: '내보내기', isCommand: false },
    { id: 'log_15', tabId: 'tab_main', tab: '메인', charId: 'char_a', name: '캐릭터A', color: '#ff6b6b', content: '편집 완료 후 [내보내기] 버튼을 클릭하면 외부 블로그 복사용 HTML 코드가 생성됩니다.', isCommand: false },
    
    { id: 'log_16', tabId: 'tab_main', tab: '메인', charId: 'char_b', name: '캐릭터B', color: '#4dabf7', content: '섹션 구분으로 분할 내보내기가 가능합니다. 우측 아래의 버튼에 마우스를 올리면 섹션 헤더로 바로 이동할 수 있는 목록이 나타납니다.', isCommand: false },
    { id: 'log_17', tabId: 'tab_main', tab: '메인', charId: 'char_a', name: '캐릭터A', color: '#ff6b6b', content: '[디자인] 메뉴에서 로그 필터 컨트롤러 옵션으로, 내보낸 HTML 파일에도 출력 로그에 탭/발언자 필터링 컨트롤러를 추가할 수 있습니다.', isCommand: false },

    { id: 'log_18', tabId: 'tab_secret', tab: '비밀', charId: 'char_b', name: '캐릭터B', color: '#4dabf7', content: '더 자세한 도움말은 이쪽을 참고해주세요!<br>https://posty.pe/7s025t', isCommand: false },
    { id: 'log_19', tabId: 'tab_secret', tab: '비밀', charId: 'char_b', name: '캐릭터B', color: '#4dabf7', content: '키보드 단축키 Ctrl+Z(실행 취소) 및 Ctrl+Y(다시 실행)를 지원합니다.', isCommand: false },
  ];

  const insertedBlocks: Record<string, any[]> = {
    'log_15': [ 
      { id: 'demo_split_1', type: 'split', name: '섹션2' }
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
