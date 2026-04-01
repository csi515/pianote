# 역할·권한: 플랫폼(본사) vs 학원(지점)

**한 줄 요약:** 학원 관리자(`users.role = 'admin'` + 자기 `academy_id`)는 **자기 학원 데이터만** RLS로 접근합니다. 타 학원 행은 정책상 불가입니다. 플랫폼 관리자(`platform_admins`)는 **전 학원 `academies`·전체 `users` 조회·역할 변경**이 허용되는 별도 정책을 가집니다. 이 웹앱에는 **학생 로그인 UI가 없으며**, `users.role = 'student'` 행은 DB·연동용으로 유지될 수 있습니다. 보호자 연락처는 `students.parent_phone`으로만 관리합니다(학부모 계정 개념 없음).

자세한 비밀·클라이언트 금지 사항은 [docs/SECURITY.md](SECURITY.md)를 참고하세요.

---

## 데이터·함수 (스키마)

| 구분 | 저장소 / 함수 | 설명 |
|------|----------------|------|
| 플랫폼 관리자 | `public.platform_admins`, `public.is_platform_admin()` | `auth.uid()`가 테이블에 있으면 true |
| 학원 관리자 | `public.users` 행: `role = 'admin'`, `academy_id` = 담당 학원 | `get_user_academy_id()`, `get_user_role()`과 조합 |

최초 플랫폼 관리자 부여 (Supabase SQL Editor, `auth.users.id` 확인 후):

```sql
INSERT INTO public.platform_admins (user_id) VALUES ('<auth.users 의 uuid>');
```

---

## RLS 정책 매트릭스 (요약)

아래는 **지점 관리자**와 **플랫폼 관리자** 중심입니다. 학생 역할은 “같은 학원 + 본인 `students.user_id`” 조건이 추가로 붙습니다 (`pianote.sql` 전문 참고).

### 지점 관리자 (`get_user_academy_id()` 일치 + 필요 시 `role = 'admin'`)

| 리소스 (테이블) | 읽기 | 쓰기 | 정책 이름 (예시) |
|-----------------|------|------|------------------|
| `academies` | 자기 학원 1행 | 자기 학원 수정 | `Academies: 관리자는 자신의 학원만 조회/수정` |
| `users` | 같은 학원 | 같은 학원 관리자만 수정/추가 | `Users: 같은 학원 사용자만 조회` 등 |
| `students` 및 학원 스코프 테이블 | 같은 학원(학생은 본인 행만) | 관리자만 CUD (정책별) | `Students: …`, `Payments: …`, `Curriculum: …` 등 |
| `instructors`, `scheduled_lessons` | 같은 학원 | 같은 학원 admin | `instructors_admin_all`, `scheduled_lessons_admin_all` |

### 플랫폼 관리자 (`is_platform_admin()`)

| 리소스 | 능력 | 정책 이름 |
|--------|------|-----------|
| `platform_admins` | 본인 행 조회, 플랫폼만 타인 행 insert/delete | `platform_admins_select`, `platform_admins_insert`, `platform_admins_delete` |
| `academies` | **전 행** SELECT, UPDATE | `Academies: platform admin SELECT`, `Academies: platform admin UPDATE` |
| `users` | **전 행** SELECT, UPDATE (역할·임명 등) | `Users: platform admin SELECT`, `Users: platform admin UPDATE` |

플랫폼 관리자에게 **학생·결제 등 지점 업무 테이블을 직접 열람하는 별도 정책은 없음** — 일상 운영은 지점 관리자 세션에서 수행하는 것이 일반적입니다. 필요 시 별도 설계·정책 추가가 필요합니다.

---

## 클라이언트 가드 (앱)

| 구성요소 | 역할 |
|----------|------|
| `PlatformAdminProvider` + `checkPlatformAdmin()` | `platform_admins`에 현재 사용자가 있는지 조회 |
| `PlatformAdminRoute` | `/platform/*` 비플랫폼 사용자 → 학원 대시보드로 리다이렉트 |
| `platformAdmin.service.ts` | 전 학원 목록, 지점 관리자 목록/임명/해임 (RLS가 최종 권한 보장) |

**클라이언트만 믿지 말 것:** 모든 민감 작업은 Supabase RLS·`WITH CHECK`로 재검증됩니다.

---

## API 감사 메모 (`platformAdmin.service.ts`)

| 함수 | 학원 스코프 / 플랫폼 |
|------|----------------------|
| `checkPlatformAdmin` | `platform_admins` 단건 조회 (RLS 적용) |
| `listAllAcademies` | `academies` 전체 — 플랫폼만 전체, 지점 관리자는 자기 학원만 반환 |
| `listBranchAdmins(academyId)` | `users`에서 `academy_id` + `role=admin` — 다른 학원 id는 RLS로 빈/거부 |
| `appointBranchAdmin` | 조회·갱신 시 `academy_id` 고정 — 플랫폼 UPDATE 정책으로 동작, 지점 관리자는 동일 학원만 |
| `demoteBranchAdmin` | `id` + `academy_id` + `role=admin`으로 갱신 |

새 RPC·Edge Function 추가 시 **`is_platform_admin()` 또는 `academy_id` 스코프**를 서버 측에서 반드시 검토합니다.

가입 부트스트랩 RPC(`signup_admin_bootstrap`, `signup_parent_bootstrap` 등, `pianote.sql`)는 **SECURITY DEFINER**·`WITH CHECK`로 학원/역할 경계를 맞춥니다. 변경 시 동일 기준으로 검토합니다.

---

## 이중 역할 UX (플랫폼 + 학원 관리자)

동일 계정이 `platform_admins`에 있으면서 특정 학원 `admin`인 경우:

- 사이드바에 **본사 항목**(`platformNavItems`)과 **학원 운영 항목**(`adminNavItems`)이 함께 표시됩니다 (`Sidebar.tsx`).
- `/platform/*` 경로에서도 동일하게 두 구역이 보이며, 본사 화면으로의 진입은 유지됩니다.

혼동을 줄이기 위해 구역 **구분선·섹션 제목**을 두었습니다. “본사 전용 모드” 토글은 범위가 커서 별도 백로그로 둡니다.

---

## 관련 라우트

- 학원 관리자: `/admin/*`
- 플랫폼(지점 관리자 임명 등): `/platform/branch-admins` — `ROUTES.platform.branchAdmins`
