# PiaNote

Vite + React + TypeScript + MUI + Supabase 피아노 학원 관리 웹앱.

## 스크립트

- `npm run dev` — 로컬 개발
- `npm run build` — 프로덕션 빌드 (`dist/`)
- `npm run lint` — ESLint

## 환경 변수

루트에 `.env` 를 두고 다음을 설정합니다.

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

관리자 시드(`npm run seed:admin`)는 **서비스 롤**이 필요합니다. 비밀·RLS·트리거 점검은 [docs/SECURITY.md](docs/SECURITY.md)를 참고하세요.

**역할·권한(본사 플랫폼 관리자 vs 학원 관리자):** [docs/ROLES.md](docs/ROLES.md). 최초 `platform_admins` 부여는 해당 문서의 SQL 스니펫을 사용합니다. 플랫폼 전용 화면 예: `/platform/branch-admins`.

**제품 방향:** 웹앱 로그인은 **학원·플랫폼 관리자**만 사용합니다. 학부모·학생용 앱은 두지 않으며, 등·하원 기록은 관리자 화면에서 조회합니다.

## Vercel 배포

1. 저장소를 Vercel에 연결합니다.
2. **Environment Variables**에 위 `VITE_*` 두 개를 Production(및 필요 시 Preview)에 등록합니다.
3. 빌드는 `vercel.json` 기준으로 `npm run build`, 출력 디렉터리는 `dist`입니다. (프레임워크가 Vite로 잡히면 동일하게 동작합니다.)
4. React Router SPA이므로 `vercel.json`의 `rewrites`로 클라이언트 라우트가 `index.html`로 넘어가도록 설정되어 있습니다.
