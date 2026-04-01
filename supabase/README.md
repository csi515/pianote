# PiaNote 데이터베이스

## 단일 통합본 (`pianote.sql`)

**[pianote.sql](./pianote.sql)** 하나에 스키마, RLS, 트리거, RPC, 주석·시드(선택)까지 둡니다.  
`supabase/migrations/` 아래에는 타임스탬프 마이그레이션 파일을 두지 않습니다. ([migrations/README.md](./migrations/README.md) 참고)

- **신규·스테이징**: SQL Editor에서 전체 실행 가능한 구간이 많습니다 (`IF NOT EXISTS` / `CREATE OR REPLACE` 등).
- **운영**: 검토 없이 전체를 반복 실행하지 말고, **변경된 구문만** 실행하는 것이 안전합니다.

```bash
npm run build:sql
```

위 명령은 `pianote.sql` 존재·크기만 확인합니다.

## 인증: 이메일 확인 끄기

가입 직후 `academies` / `users` 생성에는 세션이 필요합니다. **Authentication → Providers → Email → Confirm email** 을 끄거나, 로컬 `config.toml`에서 `enable_confirmations = false` 후 `npm run supabase:config:push` 로 반영하세요.

## 관리자·데모 시드 (선택)

- `npm run seed:admin` — 관리자 계정 (`.env`에 `SUPABASE_SERVICE_ROLE_KEY` 필요)
- `npm run seed:demo` — JS로 데모 데이터 upsert (`pianote.sql` 하단 INSERT와 유사)

`service_role` 키는 Git에 넣지 마세요.
