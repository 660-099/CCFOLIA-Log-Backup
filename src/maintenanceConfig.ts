/**
 * [점검 알림 및 이용 제한 설정 파일]
 * 
 * 💡 사이트 점검 알림을 켜거나 끄고 싶을 때, 이 파일의 값만 직접 수정하시면 됩니다!
 */

export interface MaintenanceConfig {
  /**
   * 점검 모드 활성화 여부
   * - true: 점검 안내 화면 또는 배너 표시
   * - false: 정상 서비스 (알림 완전히 숨김)
   */
  enabled: boolean;

  /**
   * 표시 모드
   * - 'block': 웹사이트 전체를 가리고 점검 화면만 표시 (사이트 이용 완전 차단)
   * - 'banner': 사이트 최상단에 단정한 솔리드 배너만 표시 (사이트 계속 이용 가능)
   */
  mode: 'block' | 'banner';

  /** 점검 안내 상단 뱃지 텍스트 */
  badgeText: string;

  /** 제목 */
  title: string;

  /** 상세 안내 본문 */
  message: string;
}

export const MAINTENANCE_CONFIG: MaintenanceConfig = {
  // ⚙️ 점검 알림을 끄고 싶으실 땐 아래 enabled 값을 false 로 변경하세요.
  enabled: true,

  // ⚙️ 차단 화면 대신 상단 배너로 바꾸고 싶으실 땐 아래 값을 'banner' 로 변경하세요.
  mode: 'block',

  badgeText: '점검 안내',
  title: '편집기 점검 및 기능 정비 중입니다',
  message: '현재 발생하는 여러 버그들을 고치는 작업을 진행하고 있습니다. 2026년 10월 11일까지 완료 예정이니 양해 부탁드립니다. (작업 상황에 따라 조기 정상화될 수 있습니다)',
};
