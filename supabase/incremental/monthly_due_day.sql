-- students.monthly_due_day — `supabase/pianote.sql` 과 동일 (원격 DB 증분 반영용)
-- 적용: Supabase Dashboard → SQL Editor 에서 실행, 또는 `npm run db:apply:monthly-due-day` (supabase link 후)

ALTER TABLE public.students
    ADD COLUMN IF NOT EXISTS monthly_due_day integer NULL;

ALTER TABLE public.students
    DROP CONSTRAINT IF EXISTS students_monthly_due_day_range;

ALTER TABLE public.students
    ADD CONSTRAINT students_monthly_due_day_range CHECK (
        monthly_due_day IS NULL
        OR (monthly_due_day >= 1 AND monthly_due_day <= 31)
    );

COMMENT ON COLUMN public.students.monthly_due_day IS '월 회비 납부 예정일(1–31). NULL이면 가입일 일자 사용';
