# 마이그레이션 폴더

스키마·RLS·트리거·RPC·시드의 **단일 소스**는 상위 디렉터리의 **`pianote.sql`** 입니다.

타임스탬프별 `.sql` 조각은 사용하지 않습니다. DB를 바꿀 때는 `pianote.sql`만 수정한 뒤, 아래 중 하나로 적용합니다.

1. **Supabase Dashboard → SQL Editor** — 변경 블록 또는 전체(신규 프로젝트·검토 후) 실행  
2. **Supabase CLI** — 프로젝트를 `supabase link` 한 뒤 `supabase db query --linked -f ../pianote.sql` 등 (대용량·운영은 블록 단위 권장)

원격 DB에 **누락분만** 맞출 때는 [`../incremental/README.md`](../incremental/README.md) 참고.
