# PiaNote 보안·운영 (1단계: 신뢰·안전)

클라이언트·DB·배포에서 **Auth, RLS, 트리거, 비밀, 무결성, 백업**을 점검할 때 사용합니다.  
DB 정의의 단일 소스는 [supabase/pianote.sql](../supabase/pianote.sql)입니다.

---

## 1. `pianote.sql` 적용 순서 (권장)

1. **스키마·인덱스·트리거(업무 테이블)** — 테이블 생성부터 순서대로.
2. **RLS 활성화 및 정책** — `get_user_academy_id()` 등 헬퍼 이후.
3. **`platform_admins`** (본사 관리자 테이블·정책).
4. **가입 부트스트랩** — `auth_user_email`, `academy_exists`, `academy_is_owner`, `Academies/Users` INSERT 정책, `signup_admin_bootstrap` / `signup_parent_bootstrap` RPC.
5. **Auth 가입 트리거** — `public.handle_auth_user_signup`, `on_auth_user_signup` on `auth.users` (아래 점검 필수).
6. **교재·기타 후반 테이블** 및 해당 RLS.
7. **초기 학원 행** — 파일 말미 `INSERT INTO public.academies` (운영에서는 필요 시만).

**주의:** 운영 DB에 **검토 없이 전체 파일을 반복 실행**하지 마세요. 스키마 변경은 [supabase/pianote.sql](../supabase/pianote.sql)에 반영한 뒤, 필요한 SQL만 SQL Editor에서 실행하거나 스테이징에서 검증하는 것이 안전합니다.

**학생 프로필 컬럼 추가(`grade`, `memo`, `progress_memo`):** [supabase/pianote.sql](../supabase/pianote.sql)의 해당 `ALTER TABLE public.students …` 블록만 SQL Editor에서 실행하면 됩니다. RLS는 행 단위이므로 정책 변경은 보통 불필요합니다.

---

## 2. 가입 메타데이터 ↔ DB 트리거

`auth.signUp`의 `options.data`는 Supabase에 **`raw_user_meta_data`** 로 저장됩니다.  
`AFTER INSERT ON auth.users` 트리거 `handle_auth_user_signup`이 이 JSON을 읽어 `public.academies` / `public.users`를 채웁니다.

구현 참고: [src/lib/authSignUp.ts](../src/lib/authSignUp.ts)

| 구분 | `options.data` 키 (앱) | 트리거에서 사용 (`meta->>'…'`) | 비고 |
|------|------------------------|--------------------------------|------|
| 관리자 | `signup_role` = `'admin'` | `signup_role` | 없으면 트리거 스킵(시드·수동 Auth만 있는 경우 등). |
| 관리자 | `display_name` | `display_name` | `public.users.name` |
| 관리자 | `academy_name` | `academy_name` | `public.academies.name` |
| 학부모 | `signup_role` = `'parent'` | `signup_role` | |
| 학부모 | `display_name` | `display_name` | |
| 학부모 | `academy_id` | `academy_id` | UUID 문자열, 해당 `public.academies.id` 존재 필요. |
| 학부모 | `phone` | `phone` | 정규화된 숫자 문자열(앱에서 10자리 이상). |

이메일은 트리거가 **`auth.users.email`** 을 사용합니다(메타데이터 아님).

트리거 내 `RAISE EXCEPTION`이 나면 **Auth 사용자 생성 전체가 롤백**될 수 있어, 클라이언트에는 일반적인 DB/가입 오류로 보일 수 있습니다. 메시지 매핑은 [src/lib/mapAuthError.ts](../src/lib/mapAuthError.ts)를 참고합니다.

---

## 3. SQL 점검 (Supabase SQL Editor에 붙여넣기)

### 3.1 트리거·함수 존재

```sql
-- public 쪽 함수
SELECT proname, prosrc IS NOT NULL AS defined
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname = 'handle_auth_user_signup';

-- auth.users 트리거 (이름은 배포본과 동일한지 확인)
SELECT tgname, tgenabled, pg_get_triggerdef(oid)
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
  AND NOT tgisinternal;
```

기대: `on_auth_user_signup`(또는 동일 역할)이 `AFTER INSERT`로 연결되어 있음.

### 3.2 핵심 RLS 정책 이름 (일부)

```sql
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('academies', 'users', 'students')
ORDER BY tablename, policyname;
```

`Academies: …`, `Users: …`, `Students: …` 등 [pianote.sql](../supabase/pianote.sql)에 정의된 이름과 대략 일치하는지 확인합니다.

### 3.3 가입용 RPC (선택·수동 복구용)

```sql
SELECT proname
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN ('signup_admin_bootstrap', 'signup_parent_bootstrap', 'academy_exists', 'auth_user_email');
```

---

## 4. 수동 시나리오 체크리스트

배포·스키마 변경 직후, **비운영 또는 스테이징**에서 권장합니다. **프로덕션 URL로 배포한 뒤**에도 아래 항목을 같은 순서로 한 번 더 확인하면 Auth·RLS 회귀를 줄일 수 있습니다.

- [ ] **관리자 학원 가입**  
  로그인 화면「학원 가입」→ 이메일·비밀번호·이름·학원명 입력 → 성공 후 Supabase Table Editor에서  
  `auth.users` 해당 이메일, `public.academies`에 새 학원, `public.users`에 `role = admin` 행이 생겼는지 확인.

- [ ] **학부모 가입**  
  학부모 가입 경로에서 **유효한 학원 UUID** 입력 → 가입 후 `public.users`에 `role = parent`, `academy_id` 일치 확인.

- [ ] **학원 경계**  
  학원 A 관리자로 로그인했을 때 학원 B의 학생/데이터가 조회·수정되지 않음(앱 동작 및 필요 시 RLS 점검).

- [ ] **중복 이메일(관리자 학원)**  
  동일 이메일로 두 번째「관리자 학원」가입 시도 시 DB 제약(`academies`의 `owner_email` 유니크) 또는 Auth 정책에 따라 거절되는지 확인.

---

## 5. 프로덕션 배포 전 (Supabase 대시보드·Vercel)

호스티드 프로젝트는 **Supabase Dashboard**에서 URL·이메일 정책을 설정합니다. 로컬 [`supabase/config.toml`](../supabase/config.toml)의 `site_url`은 호스티드 프로젝트에 **자동 반영되지 않습니다**.

| 항목 | 위치 | 확인 |
|------|------|------|
| Site URL | Authentication → URL Configuration | 프로덕션 도메인(예: `https://xxx.vercel.app` 또는 커스텀 도메인) |
| Redirect URLs | 동일 | 위와 동일한 URL·`www` 변형·Vercel Preview URL이 필요하면 추가. **비밀번호 재설정** 이메일 링크는 앱의 `redirectTo`가 `window.location.origin + /reset-password` 이므로, 각 환경(로컬·프로덕션) 도메인에 `/reset-password`가 Redirect URLs에 포함돼 있어야 합니다. |
| 이메일 확인 | Authentication → Providers → Email → Confirm email | 켜면 가입 직후 세션이 없을 수 있음. [AdminSignupPage 성공 문구](../src/pages/AdminSignupPage.tsx)와 UX가 맞는지 확인 |
| Vercel 환경 변수 | Project → Settings → Environment Variables | Production·Preview에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 필수([.env.example](../.env.example)). |

---

## 6. 비밀·환경 변수·Vercel

| 항목 | 규칙 |
|------|------|
| 브라우저에 노출 | **`VITE_` 접두사**가 붙은 변수만** Vite에 의해 클라이언트 번들에 포함될 수 있음. |
| 클라이언트에서 사용 | [src/lib/supabase.ts](../src/lib/supabase.ts) — `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 만. |
| 서비스 롤 | **`SUPABASE_SERVICE_ROLE_KEY`** 는 [scripts/seed-admin.mjs](../scripts/seed-admin.mjs) 등 **서버/로컬 스크립트 전용**. 프론트·`VITE_*`에 넣지 않음. |
| 저장소 | `.env`, `.env.local`은 [.gitignore](../.gitignore)로 커밋 제외. PR·캡처에 키 포함 금지. |
| Vercel | Production/Preview에 **`VITE_SUPABASE_URL`**, **`VITE_SUPABASE_ANON_KEY`** 필수. 서비스 롤은 Vercel 프론트 프로젝트에 보통 불필요(Edge Function 등 별도 백엔드가 있을 때만 해당 환경에 제한). |

**빌드:** `npm run build`는 환경 변수 없이도 통과할 수 있습니다. 배포 후 **실제 로그인·API 호출**으로 `VITE_*` 누락 여부를 확인하세요.

---

## 7. 로컬/CI: 클라이언트에 서비스 롤 패턴 금지 (선택)

저장소에 포함된 점검 스크립트:

```bash
npm run check:secrets
```

`src/`, `public/` 아래 소스에서 `SUPABASE_SERVICE_ROLE` 등 위험 패턴이 없으면 종료 코드 0입니다.  
CI(GitHub Actions 등)에서 `npm run check:secrets`를 `lint`와 함께 실행할 수 있습니다.

---

## 8. 데이터 무결성 (요약)

- **`public.users.id`** — `auth.users.id` FK. 트리거/시드가 실패하면 로그인은 되어도 앱 프로필이 비어 있을 수 있음.
- **`academies.owner_email`** — 유니크 인덱스 `academies_owner_email_key`. 동일 이메일로 학원 두 개 불가(의도된 제약).
- **`students.user_id`** — 부분 유니크 인덱스로 학생 계정 1:1 유지.

`public.users.email` 전역 유니크는 스키마에 없음. 학원별 이메일 유일을 요구하면 별도 정책·인덱스 설계가 필요합니다.

---

## 9. 백업·복구 (Supabase)

- **PITR(포인트인타임 복구)** 가능 여부·보관 기간은 **Supabase 프로젝트 플랜**에 따릅니다. 대시보드 **Project Settings → Database** 등에서 확인하세요.
- 중요 스키마 변경 전에는 조직 규칙에 따라 **수동 백업·스테이징 검증**을 권장합니다.
- 운영에서 문제가 생기면 Supabase 지원·대시보드의 복구 옵션을 먼저 확인합니다.

---

## 관련 파일

| 파일 | 역할 |
|------|------|
| [supabase/pianote.sql](../supabase/pianote.sql) | 스키마, RLS, 트리거, RPC |
| [src/lib/authSignUp.ts](../src/lib/authSignUp.ts) | 가입 시 `options.data` |
| [src/lib/supabase.ts](../src/lib/supabase.ts) | Anon 클라이언트 |
| [scripts/seed-admin.mjs](../scripts/seed-admin.mjs) | 서비스 롤로 Auth·`public.users` 시드 |
| [vercel.json](../vercel.json) | 빌드·SPA 라우팅 |
