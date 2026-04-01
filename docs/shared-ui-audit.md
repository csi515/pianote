# 공통 UI 통일 — 페이지 감사 및 마이그레이션 후보

관리자·플랫폼 화면에서 로딩·빈 목록·에러·다이얼로그 패턴을 점검한 결과입니다. 우선순위는 사용 빈도·패턴 중복도 기준입니다.

## 요약

| 구분 | 파일 | 현재 패턴 | 권장 |
|------|------|-----------|------|
| 대시보드 | `src/pages/admin/Dashboard.tsx` | 카드 수치 `...` 로딩 | `ui.common.loading` 또는 `AdminPageLoading` 블록 |
| 학생 관리 | `StudentManagement.tsx` | `TableLoadingRow`, 스낵바 | 유지 (이미 공통) |
| 결제 | `PaymentsManagement.tsx`, `MonthlyPaymentsPanel.tsx` | `TableLoadingRow`, 인라인 `Dialog` | `FormDialog`로 치환 가능 |
| 커리큘럼 | `CurriculumProgress.tsx` | `CircularProgress` 단독 | `AdminPageLoading` |
| 상담 | `ConsultationsManagement.tsx` | `…` 로딩, 텍스트 빈 목록, 인라인 `Dialog` | `TableLoadingRow` / `TableEmptyRow`, `FormDialog` (파일럿 적용) |
| 미디어 | `MediaManagement.tsx` | `TableLoadingRow`, `Dialog` | `FormDialog` |
| 교재 | `TextbooksCatalogPage.tsx` | 커스텀 로딩 행 | `TableLoadingRow` |
| 플랫폼 | `BranchAdminsPage.tsx` | 목록 로딩·빈 상태 분기, `Dialog` | `PageState` / `EmptyState` 검토 |
| 설정 | `Settings.tsx` | 버튼 `"저장 중..."` | 유지 또는 `ui.common.saving` |
| 커리큘럼 섹션 | `CurriculumSection.tsx` | `Dialog` | `FormDialog` |

## 피드백 규칙 (합의)

- **인라인 로딩(테이블)**: `TableLoadingRow` (`PageState.tsx`)
- **페이지/블록 전체 로딩**: `AdminPageLoading`
- **빈 목록(테이블)**: `TableEmptyRow` 또는 카드형 `EmptyState`
- **치명/상단 고정 안내**: MUI `Alert` + `aria-live`
- **토스트**: `notistack` — 저장 성공·일반 오류
- **폼 모달**: `FormDialog` — 제목·본문·취소·저장 슬롯

## 산출물 위치

- 공통: `src/components/common/PageState.tsx`, `FormDialog.tsx`
- 터치: `src/constants/touch.ts`, `src/theme/mui-theme.ts` (버튼·아이콘 버튼 기본 최소 크기)
- 문구: `src/i18n/ui.ts` — `common.*` 페이지 상태·취소·저장 등

자세한 템플릿은 [UX.md](./UX.md)의 「관리자 화면 템플릿」을 참고합니다.
