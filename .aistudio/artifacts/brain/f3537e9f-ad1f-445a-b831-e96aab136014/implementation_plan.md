# 프로젝트(.json) 저장/불러오기 완전 복구 및 세부 아코디언 저장 시스템 (v1.12.1)

사용자의 정확한 요구사항에 따라 사이드바 설정 화면의 위계와 1:1로 일치하도록 프로젝트 저장/불러오기 데이터 구조를 전면 재정렬합니다. 상단 헤더의 '프로젝트 저장' 버튼 클릭 시 일체형 카드 드롭다운이 열리고, 4대 카테고리와 아코디언 세부 체크박스를 통해 필요한 항목만 정밀하게 선택하여 저장할 수 있습니다.

---

## 1. 확정된 4대 메뉴 및 세부 항목별 정밀 데이터 스펙

### ① 캐릭터 설정 (`chars`)
* **수정된 캐릭터 이름 (`charNames`)**:
  - 사용자가 편집한 캐릭터 이름 (`charSettings[id].name`)
* **나레이션 (`narration`)**:
  - 나레이션 1, 2뿐만 아니라 추가된 모든 나레이션 슬롯 (`narrationCharacter`, `narrationCharacter2`, `additionalNarrationSlots`)
  - 각 슬롯별 대상 캐릭터 ID 및 나레이션 세부 설정 일체:
    - 문단 간격 분리 여부 (`enableSentenceSpacing`, `enableSentenceSpacing2`)
    - 비밀 탭 나레이션 출력 여부 (`enableSecretNarration`, `enableSecretNarration2`)
    - 나레이션 출력 디자인 스타일 (`narrationFormat`, `narrationFormat2`: 스타일 1 / 2 / 3)
* **색상 (`charColors`)**:
  - 캐릭터별 고유 글자/식별 색상값 (`charSettings[id].color`)
* **스탠딩 이미지 (`charImages`)**:
  - 캐릭터별 다중 스탠딩 목록 (`charSettings[id].images: CharImage[]` - url, name 등)
  - 기본 대표 스탠딩 지정 상태 (`isRepresentative`)
  *(※ 스탠딩 숨김/크롭 등 아바타 표시 설정은 사용자의 지침에 따라 디자인 > 로그 표시 설정으로 이동)*

---

### ② 탭 설정 (`tabs`)
* **통합 설정 (`tabMergeSettings`)**:
  - 탭 이름 표시 여부 (`showTabNames`)
  - 발언자별 통합 여부 (`mergeTabStyles`)
  - 탭별 통합 여부 (`mergeTabs`)
  *(※ 그 외 항목은 제외)*
* **수정된 탭 이름 (`tabNames`)**:
  - 사용자가 수정한 탭 라벨 (`tabSettings[id].name`, 예: main → 메인, info → 조사)
* **개별 탭 설정 (`tabIndividualSettings`)**:
  - 탭별 기본 형식(메인/잡담/정보/비밀) 및 가시성(보이기/숨기기) 상태 (`tabSettings[id].format`, `tabSettings[id].visible`)
  - 탭 표시 순서 (`tabOrder`)
  - 탭별 대사 글자색 (`tabSettings[id].textColor`) 및 비밀 탭 포인트 색상 (`tabSettings[id].color`)
  - 발언자 이름에 탭 서식(색상) 적용 토글 (`tabSettings[id].applyColorToName`)
  - 탭 내 대사 볼드(`tabSettings[id].isBold`), 이탤릭(`tabSettings[id].isItalic`) 서식
  *(※ 잡담 색상 회색 통일 옵션은 디자인 > 로그 표시 설정으로 이동)*

---

### ③ 디자인 서식 (`design`)
* **테마 및 배경색 (`themeBg`)**:
  - 다크 / 라이트 모드 (`theme`)
  - 다크 사용자 지정 배경색 (`darkBgColor`)
  - 화이트 사용자 지정 배경색 (`lightBgColor`)
* **로그 표시 설정 (`logDisplay`)**:
  - 로그 구분선 표시 (`showLogDivider`)
  - 잡담 색상을 회색으로 통일 (`disableOtherColor`)
  - 스탠딩 숨김 (`hideAllAvatars`)
  - 얼굴 위주 크롭 (상단 1:1) (`cropFaceTop`)
  - 스탠딩 배경 숨김 (`hideEmptyAvatars`)
  - 상단 필터바 고정 모드 (`filterBarMode`: none / floating / fixed)
  *(※ 향후 로그 표시 설정 메뉴에 추가 기능이 생기더라도 안전하게 자동 확장 및 저장되도록 아키텍처 구축)*
* **폰트 및 간격 (`fontAndSpacing`)**:
  - 폰트 설정: 글꼴 패밀리 (`fontFamily`)
  - 전체 크기 조절 및 상세 설정:
    - 기본/발언자 폰트 크기 (`fontSize`)
    - 대사 본문 폰트 크기 (`textFontSize`)
    - 줄간격 (`lineHeight`)
    - 자간 (`letterSpacing`)
    - 블록 간격 (`blockSpacing`)
    - 좌우 본문 여백 (`contentPadding`)
    - 아바타 크기 (`avatarSizeValue`)
* **CSS 출력 형식 (`cssFormat`)**:
  - 인라인 스타일 / 내부 스타일시트 (`cssFormat`: inline / internal)
  - 내보내기 모드 (`exportMode`: html / blog)

---

### ④ 대사 및 연출 편집 (`dialogue`)
* **대사 수정 (`dialogueEdits`)**:
  - 사용자가 위지윅 에디터로 수정한 대사 본문 텍스트 및 인라인 서식(색상, 볼드, 하이라이트 등)
  - 신규 추가된 대사 블록
  - 삭제된 대사 블록 제외 상태
  - 위/아래 이동 및 순서 변경된 블록 배열 상태
  - 개별 대사 블록에 지정된 표정 스탠딩 (`overrideImageId`)
  - 개별 대사의 발언자/탭 변경 사항
* **BGM (`bgm`)**:
  - 대사 사이에 삽입된 유튜브 BGM 블록 (`isBgmBlock: true`)
  - BGM 트랙 정보 (`bgmData`: url, title, videoId, startTime, useTimestamp)
  - **BGM 블록의 적용 탭** (`tabOverride`)
* **삽화 (`illustrations`)**:
  - 대사 사이에 배치된 이미지 블록 (`isIllustration: true`)
  - 이미지 주소 (`url`) 및 라벨 (`imageName`)
  - **이미지 가로 너비**: 사용자가 입력한 단위 그대로 `%` 및 `px` 값 완벽 보존 (`width`: "100%", "450px" 등)
  - 이미지 정렬 (`align`: left / center / right)
  - 삽화 블록의 적용 탭 (`tabOverride`)
* **섹션 분할 (`splits`)**:
  - 챕터 분할선 및 목차 섹션 이름 (`sectionId`, `sectionNames`)

---

## 2. UI Layout & Visual Interaction

### 프로젝트 저장 카드 드롭다운 (헤더 버튼 클릭 시 노출)

```
[ 상단 헤더 우측 ]
┌─────────────────────────────────┐   ┌─────────────────┐
│   [FileJson] 프로젝트 저장      │   │ [Download] HTML │
└────────────────┬────────────────┘   └─────────────────┘
                 │ (클릭 시 일체형 카드 팝업 오픈)
                 ▼
┌────────────────────────────────────────────────────────┐
│  프로젝트 저장                                    [X]  │
│  현재 작업 중인 편집 데이터 및 설정을 JSON으로 저장합니다.│
├────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────┐ │
│ │ [v] 캐릭터 설정                              [▼]  │ │
│ │  └─ 아코디언 펼침:                                 │ │
│ │     [v] 수정된 캐릭터 이름                         │ │
│ │     [v] 나레이션 (슬롯, 대상, 스타일, 간격)        │ │
│ │     [v] 색상                                       │ │
│ │     [v] 스탠딩 이미지 (다중 스탠딩 목록 및 대표)   │ │
│ ├────────────────────────────────────────────────────┤ │
│ │ [v] 탭 설정                                  [▶]  │ │
│ │  └─ 아코디언 펼침:                                 │ │
│ │     [v] 통합 설정 (탭 이름 표시, 발언자별/탭별통합)│ │
│ │     [v] 수정된 탭 이름                             │ │
│ │     [v] 개별 탭 설정 (가시성, 형식, 글자색, 서식)  │ │
│ ├────────────────────────────────────────────────────┤ │
│ │ [v] 디자인 서식                              [▶]  │ │
│ │  └─ 아코디언 펼침:                                 │ │
│ │     [v] 테마 및 배경색                             │ │
│ │     [v] 로그 표시 설정 (구분선, 회색통일, 스탠딩숨김/크롭)│ │
│ │     [v] 폰트 및 간격 (폰트, 글자크기, 자간/행간/여백)│ │
│ │     [v] CSS 출력 형식                              │ │
│ ├────────────────────────────────────────────────────┤ │
│ │ [v] 대사 및 연출 편집                        [▶]  │ │
│ │  └─ 아코디언 펼침:                                 │ │
│ │     [v] 대사 수정 (텍스트, 추가, 삭제, 이동, 표정) │ │
│ │     [v] BGM (유튜브 링크, 트랙 제목, 재생 탭)      │ │
│ │     [v] 삽화 (이미지, %/px 너비, 정렬, 적용 탭)    │ │
│ │     [v] 섹션 분할 (챕터 분할선 및 섹션 제목)       │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ ┌────────────────────────────────────────────────────┐ │
│ │   [Download] 선택 항목으로 JSON 저장 (다운로드)    │ │
│ └────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

* **체크박스 연동**:
  * 상위 카테고리 체크 시 하위 모든 세부 항목이 동시에 체크/해제.
  * 하위 세부 항목 중 일부만 선택된 경우 상위 카테고리 체크박스는 반선택(Indeterminate) 상태로 표시.
* **설정 기억**: 사용자가 선택한 세부 체크박스 상태는 `localStorage`에 자동 보관되어 다음 저장 시에도 동일하게 유지.

---

## 3. 과거 호환(Backward) & 미래 확장(Forward) 보장 체계

1. **과거 JSON 파일 로드 시**:
   * 구버전 파일(v1.0~v1.11)의 경우 `illustrations` 별도 배열은 `migrateIllustrationsToLogs`로 대사 흐름에 자동 결합.
   * 단일 `imageUrl` 스탠딩은 `migrateCharSettings`로 `images: [{ url, isRepresentative: true }]`로 자동 승격.
   * `showLogDivider` 등 구버전에 없던 신규 필드는 기본값(`false`)으로 안전하게 폴백(Fallback)되어 로드 실패나 에러가 일절 발생하지 않음.
2. **미래 신규 필드 추가 시**:
   * JSON 역직렬화(Hydration) 시 `if (json.field !== undefined)` 방식으로 안전 가드를 두어, 미래에 필드가 늘어나거나 생략되어도 다른 모든 정상 데이터가 100% 온전하게 주입됨.
   * '로그 표시 설정' 등 향후 옵션이 확장되더라도 모듈형 딕셔너리 구조를 통해 코드 수정 없이 자동 포함되도록 직렬화 로직 설계.

---

## 4. 버전 관리 (v1.12.1)
* 사용자의 명시적 요청에 따라 `package.json`, 사이드바 하단 푸터, 프로젝트 메타데이터 버전을 `v1.12.1`로 갱신.
* `CHANGELOG.md`에 `## [1.12.1]` 항목을 추가하고 `[Fixed]`, `[Added]`, `[Changed]` 카테고리로 정리.
