# 증분 DDL (원격 Supabase)

`pianote.sql` 전체를 운영에 그대로 다시 돌리지 않고, **누락된 변경만** 적용할 때 사용합니다.

| 파일 | 내용 |
|------|------|
| `monthly_due_day.sql` | `students.monthly_due_day` 컬럼·CHECK·COMMENT (`pianote.sql` 해당 블록과 동일) |

## 적용 (둘 중 하나)

### A. Supabase Dashboard (가장 단순)

1. [Dashboard](https://supabase.com/dashboard) → 프로젝트 → **SQL Editor** → New query.
2. `monthly_due_day.sql` **전체**를 붙여넣고 **Run**.
3. **Table Editor** → `students` 테이블에 `monthly_due_day` 열이 보이면 반영 완료.

### B. CLI

1. 한 번만: `npx supabase login` → `npx supabase link` (프로젝트 선택).
2. 저장소 루트에서 `npm run db:apply:monthly-due-day`.

## 확인용 쿼리 (선택)

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'students'
  AND column_name = 'monthly_due_day';
```

`monthly_due_day` 한 행이 나오면 스키마가 맞습니다.

## 참고

- 스키마가 `pianote.sql`과 크게 어긋난 **신규/복구** 인스턴스는 Dashboard에서 `pianote.sql`을 **구간별로 검토한 뒤** 실행하는 편이 안전합니다.
