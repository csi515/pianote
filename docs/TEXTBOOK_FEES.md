# 교재비 미납 집계 범위

**월 회비·청구 연체(`payments` 연체 건)** 와는 별도 개념입니다. 용어 정리는 [TERMINOLOGY.md](./TERMINOLOGY.md)를 참고합니다.

**규칙:** 교재비 미납 **건수·인원 집계**, **대시보드 타일**, **상단 종 알림**, **학생 관리 테이블의 교재비 열**(활성 학생 행)은 모두 **재학(활성) 학생만** 동일한 기준을 쓴다.

- DB: `students.active === true`
- 미납 정의: 해당 학생에게 배정된 `student_textbooks` 중 `paid === false`인 행이 하나라도 있음
- **비활성** 학생: 집계·알림에 포함하지 않음. 학생 목록 테이블에서는 교재비 열을 `—`로 두고, 행을 펼치면 교재 패널에서 개별 납부를 그대로 볼 수 있음

구현 참고:

- `countStudentsWithUnpaidTextbookFees` — `textbooks.service.ts` (가능 시 DB RPC `count_active_students_with_unpaid_textbooks` 한 번에 조회)
- 목록 + 행별 상태: `getStudentsPageWithTextbookPaymentStatuses` — `students.service.ts` (비활성 행은 `inactive_excluded`)
- 대시보드: `Dashboard.tsx`
- 상단바: `TopBar.tsx`
