# PiaNote UX 규칙 (3단계)

관리자 화면의 터치, 로딩/피드백, 리스트 성능, PWA 관련 합의 사항입니다. (학부모·학생용 웹 앱 없음.)

## 관리자 화면 템플릿 (공통)

새 관리자·플랫폼 하위 화면은 아래 순서를 기본으로 합니다.

1. **레이아웃:** `AdminPageShell` — `title`, 필요 시 `backTo`, `actions`(목록 상단 주요 버튼).
2. **문구:** UI 문자열은 `src/i18n/ui.ts`의 `common.*` 또는 기능별 키만 사용 (하드코딩 지양). 교재비·월 회비·연체 등 집계 용어는 [TERMINOLOGY.md](./TERMINOLOGY.md)와 맞출 것. 비활성 학생과 결제·교재 표시 규칙은 [INACTIVE_STUDENT_UX.md](./INACTIVE_STUDENT_UX.md)를 참고합니다.
3. **테이블(목록):** 공통 껍데기는 `src/components/common/adminTable` — `AdminTableSurface` + `AdminTableWithLabel` + (선택) `AdminTablePaginationBar`, 작업 열 헤더는 `AdminTableActionsHeaderCell` / 순서 열은 `AdminTableReorderHeaderCell`. 로딩·빈 행은 아래와 동일.
4. **로딩·빈·에러:**
   - 테이블 안: `TableLoadingRow` / `TableEmptyRow` (`src/components/common/PageState.tsx`).
   - 테이블 밖 블록·페이지: `AdminPageLoading` 또는 `PageState` (`variant`: `loading` | `error` | `empty`).
   - 카드형 빈 영역: `EmptyState` (제목·설명·선택 `action`).
5. **폼 모달:** 반복되는 `DialogTitle`/`DialogContent`/`DialogActions` 패턴은 `FormDialog` (`src/components/common/FormDialog.tsx`)로 통일.
6. **피드백:** 저장 성공·일반 오류는 `notistack` 스낵바; 페이지 상단에 남겨야 할 오류는 `PageState` `error` 또는 MUI `Alert`.

화면별 중복·마이그레이션 후보는 [shared-ui-audit.md](./shared-ui-audit.md)를 참고합니다.

## 터치 영역

- 최소 **44×44px** (WCAG 2.5.5 권장). 상수: `src/constants/touch.ts`의 `MIN_TOUCH_TARGET_PX`, `touchButtonSx`, `touchIconButtonSx`.
- 테마: `src/theme/mui-theme.ts`에서 `MuiButton` `sizeMedium`·`sizeLarge`, `MuiIconButton`에 동일 최소 크기를 적용합니다 (`size="small"` 버튼은 밀집 UI 예외).
- `AdminPageShell` 툴바의 주요 `Button`은 툴바 액션 영역에서 최소 높이가 적용됩니다.

## 로딩·에러 피드백

- **목록·테이블 인라인 로딩**: `TableLoadingRow` — 테이블 전용. **테이블 밖** 전체 영역은 `AdminPageLoading` 또는 `PageState` `variant="loading"`.
- **빈 테이블**: `TableEmptyRow` — 한 줄 안내. **카드/블록** 빈 상태는 `EmptyState` 또는 `PageState` `variant="empty"`.
- **전역/비차단 알림**: `notistack` 스낵바 — 저장 성공·경고·일반 오류.
- **치명적이거나 페이지 상단에 유지할 안내**: MUI `Alert` — 정보는 `role="status"` + `aria-live="polite"`를 붙이는 것을 권장합니다.
- 동일 화면에서 문자열 `"로딩 중..."`만 쓰지 말고, 가능하면 `ui.common.loading`을 사용합니다.

## 리스트·페이지네이션

- Supabase: `.select(..., { count: 'exact' }).range(from, to)` 패턴.
- 학생·결제(전체 탭)·미디어: 서버 페이지네이션 + MUI `TablePagination`.
- 커리큘럼 단계 표: 데이터는 전체 로드(진도·경로 연동에 필요), **표시만** 클라이언트 페이지네이션(`CurriculumSection`).
- 드롭다운용 활성 학생 목록: `listActiveStudentSummaries` — `id`·`name`만 조회해 대량 학생 시 부담을 줄입니다.

## PWA·캐시

- `vite.config.ts`의 `VitePWA`(`registerType: 'autoUpdate'` 등)로 정적 자산 갱신.
- **API 응답(Supabase)은 Service Worker로 장기 캐시하지 않는 것**이 일반적입니다. `vercel.json` 등에서 정적 파일 `max-age`와 혼동하지 않습니다.

## 접근성 점검 메모

- 폼: MUI `TextField`/`Select`의 `label`·`labelId` 연결 유지.
- 다이얼로그: MUI `Dialog` 기본 포커스 관리 활용.
- 스크린리더: 테이블 로딩 행에 `aria-live`, 정보 `Alert`에 `aria-live`를 사용합니다.
