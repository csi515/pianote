-- =============================================================================
-- PiaNote DB 단일 통합본 (이 파일만 유지 — supabase/migrations 타임스탬프 SQL 없음)
-- Supabase SQL Editor → New query → 전체 또는 필요한 블록만 실행
-- 순서: 스키마·트리거 → RLS → platform_admins → 초기 관리자 학원(academies)
-- 재실행: IF NOT EXISTS / DROP IF EXISTS / ON CONFLICT DO NOTHING / CREATE OR REPLACE
-- =============================================================================

-- PiaNote 전체 스키마 (빈 프로젝트·기존 DB 모두 idempotent)
-- 적용: Dashboard SQL Editor, 또는 supabase link 후 `supabase db query --linked -f pianote.sql` (대용량·운영은 블록 단위 권장)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- 1. academies
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.academies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(255) NOT NULL,
    owner_email varchar(255) NOT NULL,
    plan varchar(20) NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'paid')),
    student_limit integer NOT NULL DEFAULT 10,
    /** 학원 기본 월 회비(원). 학생 monthly_fee가 NULL이고 직전 청구도 없을 때 기본값으로 사용 */
    default_monthly_fee integer NULL,
    created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS academies_owner_email_key ON public.academies (owner_email);

CREATE INDEX IF NOT EXISTS idx_academies_default_monthly_fee ON public.academies (default_monthly_fee);

-- ---------------------------------------------------------------------------
-- 2. users (auth.users 연동)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    academy_id uuid NOT NULL REFERENCES public.academies (id) ON DELETE CASCADE,
    role varchar(20) NOT NULL CHECK (role IN ('admin', 'student')),
    name varchar(255) NOT NULL,
    email varchar(255),
    phone varchar(20),
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_academy ON public.users (academy_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users (role);

-- ---------------------------------------------------------------------------
-- 3. students
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.students (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    academy_id uuid NOT NULL REFERENCES public.academies (id) ON DELETE CASCADE,
    name varchar(255) NOT NULL,
    parent_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
    /** 보호자 연락처(전화번호 문자열) */
    parent_phone text NULL,
    enrollment_date date NOT NULL DEFAULT CURRENT_DATE,
    /** 퇴원일(학원 그만둔 날). NULL이면 재학 중. 월별 결제 목록은 퇴원일이 속한 달까지 표시 */
    left_academy_date date NULL,
    /** 월 회비(원). NULL이면 자동 청구 시 직전 금액·기본값 */
    monthly_fee integer NULL,
    active boolean NOT NULL DEFAULT true,
    profile_image text,
    user_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.students
    ADD COLUMN IF NOT EXISTS parent_phone text NULL;

ALTER TABLE public.students
    ADD COLUMN IF NOT EXISTS left_academy_date date NULL;

ALTER TABLE public.students
    ADD COLUMN IF NOT EXISTS monthly_fee integer NULL;

ALTER TABLE public.students
    ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users (id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_students_user_id_unique ON public.students (user_id)
    WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_students_academy ON public.students (academy_id);
CREATE INDEX IF NOT EXISTS idx_students_parent ON public.students (parent_id);
CREATE INDEX IF NOT EXISTS idx_students_active ON public.students (active);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON public.students (user_id);

-- ---------------------------------------------------------------------------
-- 4. attendance
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attendance (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES public.students (id) ON DELETE CASCADE,
    type varchar(20) NOT NULL CHECK (type IN ('check_in', 'check_out')),
    timestamp timestamptz DEFAULT now(),
    phone_last_digits varchar(8) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_attendance_student ON public.attendance (student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_timestamp ON public.attendance (timestamp);
CREATE INDEX IF NOT EXISTS idx_attendance_phone ON public.attendance (phone_last_digits);

-- ---------------------------------------------------------------------------
-- 5. curriculum
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.curriculum (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    academy_id uuid NOT NULL REFERENCES public.academies (id) ON DELETE CASCADE,
    title varchar(255) NOT NULL,
    level varchar(50),
    "order" integer NOT NULL,
    is_event boolean NOT NULL DEFAULT false,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_curriculum_academy ON public.curriculum (academy_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_order ON public.curriculum ("order");

-- ---------------------------------------------------------------------------
-- 6. student_progress
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES public.students (id) ON DELETE CASCADE,
    curriculum_id uuid NOT NULL REFERENCES public.curriculum (id) ON DELETE CASCADE,
    started_at timestamptz DEFAULT now(),
    completed_at timestamptz,
    status varchar(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
    notes text
);

CREATE INDEX IF NOT EXISTS idx_progress_student ON public.student_progress (student_id);
CREATE INDEX IF NOT EXISTS idx_progress_curriculum ON public.student_progress (curriculum_id);
CREATE INDEX IF NOT EXISTS idx_progress_status ON public.student_progress (status);

-- ---------------------------------------------------------------------------
-- 7. media
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.media (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES public.students (id) ON DELETE CASCADE,
    curriculum_id uuid REFERENCES public.curriculum (id) ON DELETE SET NULL,
    youtube_url text NOT NULL,
    thumbnail text,
    title varchar(255),
    uploaded_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_student ON public.media (student_id);
CREATE INDEX IF NOT EXISTS idx_media_uploaded ON public.media (uploaded_at);

-- ---------------------------------------------------------------------------
-- 8. consultations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.consultations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES public.students (id) ON DELETE CASCADE,
    teacher_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    content text NOT NULL,
    date date NOT NULL DEFAULT CURRENT_DATE,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.consultations
    ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_consultations_student ON public.consultations (student_id);
CREATE INDEX IF NOT EXISTS idx_consultations_teacher ON public.consultations (teacher_id);
CREATE INDEX IF NOT EXISTS idx_consultations_date ON public.consultations (date);

-- ---------------------------------------------------------------------------
-- 9. payments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES public.students (id) ON DELETE CASCADE,
    amount integer NOT NULL,
    due_date date NOT NULL,
    paid_date date,
    status varchar(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
    notes text,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_student ON public.payments (student_id);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON public.payments (due_date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments (status);

-- ---------------------------------------------------------------------------
-- 10. wish_songs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wish_songs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES public.students (id) ON DELETE CASCADE,
    title varchar(255) NOT NULL,
    requested_at timestamptz DEFAULT now(),
    status varchar(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
    response_notes text
);

ALTER TABLE public.wish_songs
    ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES public.users (id) ON DELETE SET NULL;

ALTER TABLE public.wish_songs
    ADD COLUMN IF NOT EXISTS response_notes text;

CREATE INDEX IF NOT EXISTS idx_wish_songs_student ON public.wish_songs (student_id);
CREATE INDEX IF NOT EXISTS idx_wish_songs_status ON public.wish_songs (status);

-- ---------------------------------------------------------------------------
-- 11. instructors & scheduled_lessons
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.instructors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    academy_id uuid NOT NULL REFERENCES public.academies (id) ON DELETE CASCADE,
    name text NOT NULL,
    phone text NOT NULL DEFAULT '',
    role text NOT NULL DEFAULT '전임강사',
    major text NOT NULL DEFAULT '클래식',
    status text NOT NULL DEFAULT '대기 중',
    sort_order integer NOT NULL DEFAULT 0,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_instructors_academy_id ON public.instructors (academy_id);

CREATE TABLE IF NOT EXISTS public.scheduled_lessons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    academy_id uuid NOT NULL REFERENCES public.academies (id) ON DELETE CASCADE,
    instructor_id uuid NOT NULL REFERENCES public.instructors (id) ON DELETE CASCADE,
    student_id uuid REFERENCES public.students (id) ON DELETE SET NULL,
    title text NOT NULL,
    notes text,
    start_at timestamptz NOT NULL,
    end_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT scheduled_lessons_time_order CHECK (end_at > start_at)
);

CREATE INDEX IF NOT EXISTS idx_scheduled_lessons_academy_id ON public.scheduled_lessons (academy_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_lessons_time ON public.scheduled_lessons (academy_id, start_at, end_at);

-- ---------------------------------------------------------------------------
-- 헬퍼 함수
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_student_count(academy_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN (SELECT count(*)::integer FROM public.students WHERE academy_id = academy_uuid AND active = true);
END;
$$;

CREATE OR REPLACE FUNCTION public.check_student_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    current_count integer;
    academy_plan varchar(20);
    max_students integer;
BEGIN
    SELECT plan, student_limit INTO academy_plan, max_students
    FROM public.academies
    WHERE id = NEW.academy_id;

    current_count := public.get_student_count(NEW.academy_id);

    IF academy_plan = 'free' AND current_count >= max_students THEN
        RAISE EXCEPTION '무료 요금제 학생 수 제한 초과. 문의: csi515@nate.com';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_student_limit ON public.students;
CREATE TRIGGER enforce_student_limit
    BEFORE INSERT ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION public.check_student_limit();

CREATE OR REPLACE FUNCTION public.update_payment_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.paid_date IS NOT NULL AND OLD.paid_date IS NULL THEN
        NEW.status := 'paid';
    END IF;

    IF NEW.due_date < CURRENT_DATE AND NEW.paid_date IS NULL THEN
        NEW.status := 'overdue';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_update_payment_status ON public.payments;
CREATE TRIGGER auto_update_payment_status
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_payment_status();


-- =============================================================================
-- RLS + 헬퍼
-- =============================================================================

-- PiaNote RLS + 헬퍼 함수 (bootstrap 이후 실행)

CREATE OR REPLACE FUNCTION public.get_user_academy_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT academy_id FROM public.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS varchar(20)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_student_academy_id(student_uuid uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT academy_id FROM public.students WHERE id = student_uuid;
$$;

ALTER TABLE public.academies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wish_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_lessons ENABLE ROW LEVEL SECURITY;

-- 기존 정책 제거 후 재생성 (재실행 안전)
DROP POLICY IF EXISTS "Academies: 관리자는 자신의 학원만 조회" ON public.academies;
DROP POLICY IF EXISTS "Academies: 관리자는 자신의 학원만 수정" ON public.academies;
DROP POLICY IF EXISTS "Users: 같은 학원 사용자만 조회" ON public.users;
DROP POLICY IF EXISTS "Users: 관리자는 같은 학원 사용자 수정" ON public.users;
DROP POLICY IF EXISTS "Users: 관리자는 같은 학원 사용자 추가" ON public.users;
DROP POLICY IF EXISTS "Students: 같은 학원 학생만 조회" ON public.students;
DROP POLICY IF EXISTS "Students: 학부모는 자녀만 조회" ON public.students;
DROP POLICY IF EXISTS "Students: 같은 학원 · 학부모는 자녀만 조회" ON public.students;
DROP POLICY IF EXISTS "Students: 관리자는 학생 추가" ON public.students;
DROP POLICY IF EXISTS "Students: 관리자는 학생 수정" ON public.students;
DROP POLICY IF EXISTS "Students: 관리자는 학생 삭제" ON public.students;
DROP POLICY IF EXISTS "Attendance: 같은 학원 출석 기록만 조회" ON public.attendance;
DROP POLICY IF EXISTS "Attendance: 출석 기록 추가 가능" ON public.attendance;
DROP POLICY IF EXISTS "Curriculum: 같은 학원 커리큘럼만 조회" ON public.curriculum;
DROP POLICY IF EXISTS "Curriculum: 관리자만 추가" ON public.curriculum;
DROP POLICY IF EXISTS "Curriculum: 관리자만 수정" ON public.curriculum;
DROP POLICY IF EXISTS "Curriculum: 관리자만 삭제" ON public.curriculum;
DROP POLICY IF EXISTS "Progress: 같은 학원 진도만 조회" ON public.student_progress;
DROP POLICY IF EXISTS "Progress: 관리자만 추가" ON public.student_progress;
DROP POLICY IF EXISTS "Progress: 관리자만 수정" ON public.student_progress;
DROP POLICY IF EXISTS "Media: 같은 학원 미디어만 조회" ON public.media;
DROP POLICY IF EXISTS "Media: 관리자만 추가" ON public.media;
DROP POLICY IF EXISTS "Media: 관리자만 수정" ON public.media;
DROP POLICY IF EXISTS "Media: 관리자만 삭제" ON public.media;
DROP POLICY IF EXISTS "Consultations: 관리자만 조회" ON public.consultations;
DROP POLICY IF EXISTS "Consultations: 관리자만 추가" ON public.consultations;
DROP POLICY IF EXISTS "Consultations: 관리자만 수정" ON public.consultations;
DROP POLICY IF EXISTS "Consultations: 관리자만 삭제" ON public.consultations;
DROP POLICY IF EXISTS "Payments: 같은 학원 결제 정보만 조회" ON public.payments;
DROP POLICY IF EXISTS "Payments: 관리자만 추가" ON public.payments;
DROP POLICY IF EXISTS "Payments: 관리자만 수정" ON public.payments;
DROP POLICY IF EXISTS "Payments: 관리자만 삭제" ON public.payments;
DROP POLICY IF EXISTS "Wish Songs: 같은 학원 희망곡만 조회" ON public.wish_songs;
DROP POLICY IF EXISTS "Wish Songs: 학생/학부모는 희망곡 추가" ON public.wish_songs;
DROP POLICY IF EXISTS "Wish Songs: 관리자·학생은 희망곡 추가" ON public.wish_songs;
DROP POLICY IF EXISTS "Wish Songs: 관리자만 수정" ON public.wish_songs;
DROP POLICY IF EXISTS "instructors_admin_all" ON public.instructors;
DROP POLICY IF EXISTS "scheduled_lessons_admin_all" ON public.scheduled_lessons;

CREATE POLICY "Academies: 관리자는 자신의 학원만 조회"
    ON public.academies FOR SELECT
    USING (id = public.get_user_academy_id());

CREATE POLICY "Academies: 관리자는 자신의 학원만 수정"
    ON public.academies FOR UPDATE
    USING (id = public.get_user_academy_id() AND public.get_user_role() = 'admin');

CREATE POLICY "Users: 같은 학원 사용자만 조회"
    ON public.users FOR SELECT
    USING (academy_id = public.get_user_academy_id());

CREATE POLICY "Users: 관리자는 같은 학원 사용자 수정"
    ON public.users FOR UPDATE
    USING (academy_id = public.get_user_academy_id() AND public.get_user_role() = 'admin');

CREATE POLICY "Users: 관리자는 같은 학원 사용자 추가"
    ON public.users FOR INSERT
    WITH CHECK (academy_id = public.get_user_academy_id() AND public.get_user_role() = 'admin');

CREATE POLICY "Students: 같은 학원 학생만 조회"
    ON public.students FOR SELECT
    USING (
        academy_id = public.get_user_academy_id()
        AND (
            public.get_user_role() = 'admin'
            OR (
                public.get_user_role() = 'student'
                AND user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Students: 관리자는 학생 추가"
    ON public.students FOR INSERT
    WITH CHECK (academy_id = public.get_user_academy_id() AND public.get_user_role() = 'admin');

CREATE POLICY "Students: 관리자는 학생 수정"
    ON public.students FOR UPDATE
    USING (academy_id = public.get_user_academy_id() AND public.get_user_role() = 'admin');

CREATE POLICY "Students: 관리자는 학생 삭제"
    ON public.students FOR DELETE
    USING (academy_id = public.get_user_academy_id() AND public.get_user_role() = 'admin');

CREATE POLICY "Attendance: 같은 학원 출석 기록만 조회"
    ON public.attendance FOR SELECT
    USING (public.get_student_academy_id(student_id) = public.get_user_academy_id());

CREATE POLICY "Attendance: 출석 기록 추가 가능"
    ON public.attendance FOR INSERT
    WITH CHECK (public.get_student_academy_id(student_id) = public.get_user_academy_id());

CREATE POLICY "Curriculum: 같은 학원 커리큘럼만 조회"
    ON public.curriculum FOR SELECT
    USING (academy_id = public.get_user_academy_id());

CREATE POLICY "Curriculum: 관리자만 추가"
    ON public.curriculum FOR INSERT
    WITH CHECK (academy_id = public.get_user_academy_id() AND public.get_user_role() = 'admin');

CREATE POLICY "Curriculum: 관리자만 수정"
    ON public.curriculum FOR UPDATE
    USING (academy_id = public.get_user_academy_id() AND public.get_user_role() = 'admin');

CREATE POLICY "Curriculum: 관리자만 삭제"
    ON public.curriculum FOR DELETE
    USING (academy_id = public.get_user_academy_id() AND public.get_user_role() = 'admin');

CREATE POLICY "Progress: 같은 학원 진도만 조회"
    ON public.student_progress FOR SELECT
    USING (public.get_student_academy_id(student_id) = public.get_user_academy_id());

CREATE POLICY "Progress: 관리자만 추가"
    ON public.student_progress FOR INSERT
    WITH CHECK (public.get_student_academy_id(student_id) = public.get_user_academy_id() AND public.get_user_role() = 'admin');

CREATE POLICY "Progress: 관리자만 수정"
    ON public.student_progress FOR UPDATE
    USING (public.get_student_academy_id(student_id) = public.get_user_academy_id() AND public.get_user_role() = 'admin');

CREATE POLICY "Media: 같은 학원 미디어만 조회"
    ON public.media FOR SELECT
    USING (public.get_student_academy_id(student_id) = public.get_user_academy_id());

CREATE POLICY "Media: 관리자만 추가"
    ON public.media FOR INSERT
    WITH CHECK (public.get_student_academy_id(student_id) = public.get_user_academy_id() AND public.get_user_role() = 'admin');

CREATE POLICY "Media: 관리자만 수정"
    ON public.media FOR UPDATE
    USING (public.get_student_academy_id(student_id) = public.get_user_academy_id() AND public.get_user_role() = 'admin');

CREATE POLICY "Media: 관리자만 삭제"
    ON public.media FOR DELETE
    USING (public.get_student_academy_id(student_id) = public.get_user_academy_id() AND public.get_user_role() = 'admin');

CREATE POLICY "Consultations: 관리자만 조회"
    ON public.consultations FOR SELECT
    USING (
        public.get_student_academy_id(student_id) = public.get_user_academy_id()
        AND public.get_user_role() = 'admin'
    );

CREATE POLICY "Consultations: 관리자만 추가"
    ON public.consultations FOR INSERT
    WITH CHECK (
        public.get_student_academy_id(student_id) = public.get_user_academy_id()
        AND public.get_user_role() = 'admin'
    );

CREATE POLICY "Consultations: 관리자만 수정"
    ON public.consultations FOR UPDATE
    USING (
        public.get_student_academy_id(student_id) = public.get_user_academy_id()
        AND public.get_user_role() = 'admin'
    );

CREATE POLICY "Consultations: 관리자만 삭제"
    ON public.consultations FOR DELETE
    USING (
        public.get_student_academy_id(student_id) = public.get_user_academy_id()
        AND public.get_user_role() = 'admin'
    );

CREATE POLICY "Payments: 같은 학원 결제 정보만 조회"
    ON public.payments FOR SELECT
    USING (public.get_student_academy_id(student_id) = public.get_user_academy_id());

CREATE POLICY "Payments: 관리자만 추가"
    ON public.payments FOR INSERT
    WITH CHECK (public.get_student_academy_id(student_id) = public.get_user_academy_id() AND public.get_user_role() = 'admin');

CREATE POLICY "Payments: 관리자만 수정"
    ON public.payments FOR UPDATE
    USING (public.get_student_academy_id(student_id) = public.get_user_academy_id() AND public.get_user_role() = 'admin');

CREATE POLICY "Payments: 관리자만 삭제"
    ON public.payments FOR DELETE
    USING (public.get_student_academy_id(student_id) = public.get_user_academy_id() AND public.get_user_role() = 'admin');

CREATE POLICY "Wish Songs: 같은 학원 희망곡만 조회"
    ON public.wish_songs FOR SELECT
    USING (public.get_student_academy_id(student_id) = public.get_user_academy_id());

CREATE POLICY "Wish Songs: 관리자·학생은 희망곡 추가"
    ON public.wish_songs FOR INSERT
    WITH CHECK (
        public.get_student_academy_id(student_id) = public.get_user_academy_id()
        AND (
            public.get_user_role() = 'admin'
            OR (
                public.get_user_role() = 'student'
                AND EXISTS (
                    SELECT 1
                    FROM public.students s
                    WHERE s.id = wish_songs.student_id
                      AND s.user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Wish Songs: 관리자만 수정"
    ON public.wish_songs FOR UPDATE
    USING (public.get_student_academy_id(student_id) = public.get_user_academy_id() AND public.get_user_role() = 'admin');

CREATE POLICY "instructors_admin_all" ON public.instructors FOR ALL
    USING (
        EXISTS (
            SELECT 1
            FROM public.users u
            WHERE u.id = auth.uid()
              AND u.role = 'admin'
              AND u.academy_id = instructors.academy_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.users u
            WHERE u.id = auth.uid()
              AND u.role = 'admin'
              AND u.academy_id = instructors.academy_id
        )
    );

CREATE POLICY "scheduled_lessons_admin_all" ON public.scheduled_lessons FOR ALL
    USING (
        EXISTS (
            SELECT 1
            FROM public.users u
            WHERE u.id = auth.uid()
              AND u.role = 'admin'
              AND u.academy_id = scheduled_lessons.academy_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.users u
            WHERE u.id = auth.uid()
              AND u.role = 'admin'
              AND u.academy_id = scheduled_lessons.academy_id
        )
    );


-- =============================================================================
-- platform_admins (본사 관리자)
-- =============================================================================

-- 본사(플랫폼) 관리자: 전 지점(academy) 조회·지점별 관리자(users.role=admin) 임명/해임

CREATE TABLE IF NOT EXISTS public.platform_admins (
    user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_admins_user ON public.platform_admins (user_id);

CREATE OR REPLACE FUNCTION public.is_platform_admin ()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.platform_admins
        WHERE user_id = auth.uid()
    );
$$;

ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_admins_select" ON public.platform_admins;
CREATE POLICY "platform_admins_select" ON public.platform_admins FOR SELECT
    USING (user_id = auth.uid() OR public.is_platform_admin ());

DROP POLICY IF EXISTS "platform_admins_insert" ON public.platform_admins;
CREATE POLICY "platform_admins_insert" ON public.platform_admins FOR INSERT
    WITH CHECK (public.is_platform_admin ());

DROP POLICY IF EXISTS "platform_admins_delete" ON public.platform_admins;
CREATE POLICY "platform_admins_delete" ON public.platform_admins FOR DELETE
    USING (public.is_platform_admin () AND user_id <> auth.uid());

-- Academies: 본사 관리자 전체 조회·수정
DROP POLICY IF EXISTS "Academies: platform admin SELECT" ON public.academies;
CREATE POLICY "Academies: platform admin SELECT" ON public.academies FOR SELECT
    USING (public.is_platform_admin ());

DROP POLICY IF EXISTS "Academies: platform admin UPDATE" ON public.academies;
CREATE POLICY "Academies: platform admin UPDATE" ON public.academies FOR UPDATE
    USING (public.is_platform_admin ());

-- Users: 본사 관리자 전체 조회·역할 변경(임명/해임)
DROP POLICY IF EXISTS "Users: platform admin SELECT" ON public.users;
CREATE POLICY "Users: platform admin SELECT" ON public.users FOR SELECT
    USING (public.is_platform_admin ());

DROP POLICY IF EXISTS "Users: platform admin UPDATE" ON public.users;
CREATE POLICY "Users: platform admin UPDATE" ON public.users FOR UPDATE
    USING (public.is_platform_admin ())
    WITH CHECK (public.is_platform_admin ());

-- 최초 본사 관리자 지정 (Supabase SQL Editor에서 auth.users.id 확인 후 실행)
-- INSERT INTO public.platform_admins (user_id) VALUES ('<auth.users 의 uuid>');


-- =============================================================================
-- 가입 부트스트랩 RLS
-- =============================================================================

-- 가입 직후: public.users 행이 없어 get_user_academy_id()가 NULL인 상태에서
-- academies / users INSERT가 필요함 (관리자 회원가입)

DROP POLICY IF EXISTS "Academies: 관리자 본인 학원 등록" ON public.academies;
CREATE POLICY "Academies: 관리자 본인 학원 등록"
    ON public.academies FOR INSERT
    TO authenticated
    WITH CHECK (
        lower(trim(owner_email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
    );

DROP POLICY IF EXISTS "Users: 관리자 본인 프로필 등록" ON public.users;
CREATE POLICY "Users: 관리자 본인 프로필 등록"
    ON public.users FOR INSERT
    TO authenticated
    WITH CHECK (
        id = auth.uid()
        AND role = 'admin'
        AND EXISTS (
            SELECT 1
            FROM public.academies a
            WHERE a.id = academy_id
              AND lower(trim(a.owner_email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
        )
    );

-- =============================================================================
-- 가입 RLS 함수·정책 보완
-- =============================================================================

-- 가입 RLS 보완: JWT/서브쿼리가 academies RLS에 막히지 않도록 SECURITY DEFINER 함수 사용
-- + 익명(anon)에서 학원 UUID 존재 여부만 확인 가능 (academy_exists)

-- auth.users.email + JWT email 병행: 일부 환경에서 RLS/INSERT 시점에 auth.users 조회만으로는 비어 있을 수 있음
CREATE OR REPLACE FUNCTION public.auth_user_email ()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        (SELECT u.email::text FROM auth.users u WHERE u.id = auth.uid()),
        (auth.jwt() ->> 'email')
    );
$$;

CREATE OR REPLACE FUNCTION public.academy_exists (p_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (SELECT 1 FROM public.academies a WHERE a.id = p_id);
$$;

CREATE OR REPLACE FUNCTION public.academy_is_owner (p_academy_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.academies a
        WHERE a.id = p_academy_id
          AND lower(trim(a.owner_email)) = lower(trim(coalesce(public.auth_user_email (), '')))
    );
$$;

REVOKE ALL ON FUNCTION public.auth_user_email () FROM PUBLIC;
REVOKE ALL ON FUNCTION public.academy_exists (uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.academy_is_owner (uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.auth_user_email () TO authenticated;
GRANT EXECUTE ON FUNCTION public.academy_exists (uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.academy_is_owner (uuid) TO authenticated;

DROP POLICY IF EXISTS "Academies: 관리자 본인 학원 등록" ON public.academies;
CREATE POLICY "Academies: 관리자 본인 학원 등록"
    ON public.academies FOR INSERT
    TO authenticated
    WITH CHECK (
        lower(trim(owner_email)) = lower(trim(coalesce(public.auth_user_email (), '')))
        OR lower(trim(owner_email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
    );

DROP POLICY IF EXISTS "Users: 관리자 본인 프로필 등록" ON public.users;
CREATE POLICY "Users: 관리자 본인 프로필 등록"
    ON public.users FOR INSERT
    TO authenticated
    WITH CHECK (
        id = auth.uid()
        AND role = 'admin'
        AND public.academy_is_owner (academy_id)
    );

-- =============================================================================
-- 가입 부트스트랩 RPC (클라이언트 직접 INSERT 대신, RLS 403 방지)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.signup_admin_bootstrap (
    p_display_name text,
    p_academy_name text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid uuid := auth.uid();
    v_email text;
    v_academy_id uuid;
BEGIN
    PERFORM set_config('row_security', 'off', true);

    IF v_uid IS NULL THEN
        RAISE EXCEPTION '로그인이 필요합니다';
    END IF;

    IF EXISTS (SELECT 1 FROM public.users WHERE id = v_uid) THEN
        RAISE EXCEPTION '이미 등록된 계정입니다';
    END IF;

    v_email := COALESCE(
        (SELECT u.email::text FROM auth.users u WHERE u.id = v_uid),
        auth.jwt() ->> 'email'
    );

    IF v_email IS NULL OR length(trim(v_email)) = 0 THEN
        RAISE EXCEPTION '이메일을 확인할 수 없습니다';
    END IF;

    v_email := trim(v_email);

    INSERT INTO public.academies (name, owner_email)
    VALUES (trim(p_academy_name), v_email)
    RETURNING id INTO v_academy_id;

    INSERT INTO public.users (id, academy_id, role, name, email, phone)
    VALUES (v_uid, v_academy_id, 'admin', trim(p_display_name), v_email, '');

    RETURN v_academy_id;
END;
$$;

REVOKE ALL ON FUNCTION public.signup_admin_bootstrap (text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.signup_admin_bootstrap (text, text) TO authenticated;


-- =============================================================================
-- Auth 가입 시 academies / public.users 자동 생성 (이메일 확인 OFF·ON 공통, 세션 불필요)
-- signUp options.data: signup_role, display_name, academy_name | academy_id, phone
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_auth_user_signup ()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    meta jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
    role text := lower(trim(COALESCE(meta->>'signup_role', '')));
    v_email text;
    v_academy_id uuid;
BEGIN
    IF role IS NULL OR role = '' THEN
        RETURN NEW;
    END IF;

    IF EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
        RETURN NEW;
    END IF;

    v_email := NULLIF(trim(NEW.email::text), '');
    IF v_email IS NULL THEN
        RAISE EXCEPTION '이메일을 확인할 수 없습니다';
    END IF;

    PERFORM set_config('row_security', 'off', true);

    IF role = 'admin' THEN
        IF length(trim(COALESCE(meta->>'academy_name', ''))) = 0 OR length(trim(COALESCE(meta->>'display_name', ''))) = 0 THEN
            RAISE EXCEPTION '학원명과 이름을 입력해 주세요';
        END IF;
        INSERT INTO public.academies (name, owner_email)
        VALUES (trim(meta->>'academy_name'), v_email)
        RETURNING id INTO v_academy_id;

        INSERT INTO public.users (id, academy_id, role, name, email, phone)
        VALUES (
            NEW.id,
            v_academy_id,
            'admin',
            trim(meta->>'display_name'),
            v_email,
            COALESCE(NULLIF(trim(COALESCE(meta->>'phone', '')), ''), '')
        );
    ELSE
        RAISE EXCEPTION '가입 유형이 올바르지 않습니다';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_signup ON auth.users;
CREATE TRIGGER on_auth_user_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_auth_user_signup ();


-- =============================================================================
-- 교재·학생-교재
-- =============================================================================

-- 교재 카탈로그(학원별) + 학생-교재 할당·납부

CREATE TABLE IF NOT EXISTS public.textbooks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    academy_id uuid NOT NULL REFERENCES public.academies (id) ON DELETE CASCADE,
    name varchar(255) NOT NULL,
    price integer NOT NULL CHECK (price >= 0),
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_textbooks_academy ON public.textbooks (academy_id);

ALTER TABLE public.textbooks
    ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_textbooks_academy_sort ON public.textbooks (academy_id, sort_order);

CREATE TABLE IF NOT EXISTS public.student_textbooks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES public.students (id) ON DELETE CASCADE,
    textbook_id uuid NOT NULL REFERENCES public.textbooks (id) ON DELETE CASCADE,
    paid boolean NOT NULL DEFAULT false,
    paid_at date,
    created_at timestamptz DEFAULT now(),
    UNIQUE (student_id, textbook_id)
);

CREATE INDEX IF NOT EXISTS idx_student_textbooks_student ON public.student_textbooks (student_id);
CREATE INDEX IF NOT EXISTS idx_student_textbooks_textbook ON public.student_textbooks (textbook_id);
CREATE INDEX IF NOT EXISTS idx_student_textbooks_unpaid ON public.student_textbooks (paid)
    WHERE paid = false;

ALTER TABLE public.textbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_textbooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "textbooks_select" ON public.textbooks;
CREATE POLICY "textbooks_select"
    ON public.textbooks FOR SELECT
    USING (academy_id = public.get_user_academy_id());

DROP POLICY IF EXISTS "textbooks_insert" ON public.textbooks;
CREATE POLICY "textbooks_insert"
    ON public.textbooks FOR INSERT
    WITH CHECK (
        academy_id = public.get_user_academy_id()
        AND public.get_user_role() = 'admin'
    );

DROP POLICY IF EXISTS "textbooks_update" ON public.textbooks;
CREATE POLICY "textbooks_update"
    ON public.textbooks FOR UPDATE
    USING (
        academy_id = public.get_user_academy_id()
        AND public.get_user_role() = 'admin'
    );

DROP POLICY IF EXISTS "textbooks_delete" ON public.textbooks;
CREATE POLICY "textbooks_delete"
    ON public.textbooks FOR DELETE
    USING (
        academy_id = public.get_user_academy_id()
        AND public.get_user_role() = 'admin'
    );

DROP POLICY IF EXISTS "student_textbooks_select" ON public.student_textbooks;
CREATE POLICY "student_textbooks_select"
    ON public.student_textbooks FOR SELECT
    USING (public.get_student_academy_id(student_id) = public.get_user_academy_id());

DROP POLICY IF EXISTS "student_textbooks_insert" ON public.student_textbooks;
CREATE POLICY "student_textbooks_insert"
    ON public.student_textbooks FOR INSERT
    WITH CHECK (
        public.get_student_academy_id(student_id) = public.get_user_academy_id()
        AND public.get_user_role() = 'admin'
        AND EXISTS (
            SELECT 1
            FROM public.textbooks t
            WHERE t.id = textbook_id
              AND t.academy_id = public.get_user_academy_id()
        )
    );

DROP POLICY IF EXISTS "student_textbooks_update" ON public.student_textbooks;
CREATE POLICY "student_textbooks_update"
    ON public.student_textbooks FOR UPDATE
    USING (
        public.get_student_academy_id(student_id) = public.get_user_academy_id()
        AND public.get_user_role() = 'admin'
    );

DROP POLICY IF EXISTS "student_textbooks_delete" ON public.student_textbooks;
CREATE POLICY "student_textbooks_delete"
    ON public.student_textbooks FOR DELETE
    USING (
        public.get_student_academy_id(student_id) = public.get_user_academy_id()
        AND public.get_user_role() = 'admin'
    );


-- =============================================================================
-- 결제 billing_month
-- =============================================================================

-- 월 단위 수업료: 어느 달 분인지(billing_month)로 조회·체크

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS billing_month date;

UPDATE public.payments
SET billing_month = date_trunc('month', due_date)::date
WHERE billing_month IS NULL;

-- 동일 학생·동일 청구월 중복 시 오래된 id 제거 (유니크 인덱스 전제)
DELETE FROM public.payments a
    USING public.payments b
WHERE a.id > b.id
  AND a.student_id = b.student_id
  AND a.billing_month = b.billing_month;

ALTER TABLE public.payments ALTER COLUMN billing_month SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_billing_month ON public.payments (billing_month);
CREATE INDEX IF NOT EXISTS idx_payments_student_billing_month ON public.payments (student_id, billing_month);

CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_student_billing_month ON public.payments (student_id, billing_month);

CREATE OR REPLACE FUNCTION public.set_payment_billing_month ()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.billing_month IS NULL AND NEW.due_date IS NOT NULL THEN
        NEW.billing_month := date_trunc('month', NEW.due_date)::date;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_payment_billing_month ON public.payments;
CREATE TRIGGER trg_payment_billing_month
    BEFORE INSERT OR UPDATE OF due_date, billing_month ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.set_payment_billing_month ();


-- =============================================================================
-- 요금제·학생 한도 제거
-- =============================================================================

-- 학생 수 제한 트리거 제거, 요금제·학생 한도 컬럼 제거
DROP TRIGGER IF EXISTS enforce_student_limit ON public.students;
DROP FUNCTION IF EXISTS public.check_student_limit();

ALTER TABLE public.academies DROP COLUMN IF EXISTS plan;
ALTER TABLE public.academies DROP COLUMN IF EXISTS student_limit;


-- =============================================================================
-- 커리큘럼·교재 연결
-- =============================================================================

-- 커리큘럼 단계 ↔ 교재 카탈로그 연결 (교재 관리에서 등록한 교재 선택)
ALTER TABLE public.curriculum
    ADD COLUMN IF NOT EXISTS textbook_id uuid REFERENCES public.textbooks (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_curriculum_textbook_id ON public.curriculum (textbook_id);

-- 교재 내 단계 번호 (교재마다 1부터)
ALTER TABLE public.curriculum
    ADD COLUMN IF NOT EXISTS textbook_step integer NOT NULL DEFAULT 1;

-- textbook_id 없는 행: 학원의 첫 교재에 연결 (이름순 첫 교재)
UPDATE public.curriculum c
SET textbook_id = sub.tid
FROM (
    SELECT
        c2.id AS cid,
        (
            SELECT t.id
            FROM public.textbooks t
            WHERE t.academy_id = c2.academy_id
            ORDER BY t.name
            LIMIT 1
        ) AS tid
    FROM public.curriculum c2
    WHERE c2.textbook_id IS NULL
) sub
WHERE c.id = sub.cid
    AND sub.tid IS NOT NULL;

-- 교재가 하나도 없는 학원의 고아 커리큘럼 행 제거
DELETE FROM public.curriculum
WHERE textbook_id IS NULL;

-- 교재별 기존 order 순으로 textbook_step 재부여
UPDATE public.curriculum c
SET textbook_step = x.rn
FROM (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY academy_id, textbook_id
            ORDER BY
                "order",
                created_at
        ) AS rn
    FROM public.curriculum
) x
WHERE c.id = x.id;

-- 전역 order는 하위 호환·정렬 보조용으로 단계와 맞춤
UPDATE public.curriculum
SET "order" = textbook_step;

DROP INDEX IF EXISTS idx_curriculum_academy_textbook_step;
CREATE UNIQUE INDEX IF NOT EXISTS idx_curriculum_academy_textbook_step ON public.curriculum (academy_id, textbook_id, textbook_step)
WHERE
    textbook_id IS NOT NULL;


-- =============================================================================
-- 학생별 커리큘럼 경로
-- =============================================================================

-- 학생별 커리큘럼 경로 (행 없음 = 학원 기본 순서 사용)

CREATE TABLE IF NOT EXISTS public.student_curriculum_path (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES public.students (id) ON DELETE CASCADE,
    curriculum_id uuid NOT NULL REFERENCES public.curriculum (id) ON DELETE CASCADE,
    sort_order integer NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE (student_id, curriculum_id)
);

CREATE INDEX IF NOT EXISTS idx_student_curriculum_path_student ON public.student_curriculum_path (student_id);

ALTER TABLE public.student_curriculum_path ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "student_curriculum_path_select" ON public.student_curriculum_path;
CREATE POLICY "student_curriculum_path_select"
    ON public.student_curriculum_path FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.students s
            WHERE s.id = student_curriculum_path.student_id
              AND s.academy_id = public.get_user_academy_id()
              AND (
                  public.get_user_role() = 'admin'
                  OR (
                      public.get_user_role() = 'student'
                      AND s.user_id = auth.uid()
                  )
              )
        )
    );

DROP POLICY IF EXISTS "student_curriculum_path_insert" ON public.student_curriculum_path;
CREATE POLICY "student_curriculum_path_insert"
    ON public.student_curriculum_path FOR INSERT
    WITH CHECK (
        public.get_student_academy_id(student_id) = public.get_user_academy_id()
        AND public.get_user_role() = 'admin'
    );

DROP POLICY IF EXISTS "student_curriculum_path_update" ON public.student_curriculum_path;
CREATE POLICY "student_curriculum_path_update"
    ON public.student_curriculum_path FOR UPDATE
    USING (
        public.get_student_academy_id(student_id) = public.get_user_academy_id()
        AND public.get_user_role() = 'admin'
    );

DROP POLICY IF EXISTS "student_curriculum_path_delete" ON public.student_curriculum_path;
CREATE POLICY "student_curriculum_path_delete"
    ON public.student_curriculum_path FOR DELETE
    USING (
        public.get_student_academy_id(student_id) = public.get_user_academy_id()
        AND public.get_user_role() = 'admin'
    );


-- =============================================================================
-- 커리큘럼 트랙 (학원별 과정 템플릿)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.curriculum_tracks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    academy_id uuid NOT NULL REFERENCES public.academies (id) ON DELETE CASCADE,
    name varchar(255) NOT NULL,
    sort_order integer NOT NULL DEFAULT 0,
    is_default boolean NOT NULL DEFAULT false,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_curriculum_tracks_academy ON public.curriculum_tracks (academy_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_curriculum_tracks_one_default_per_academy
    ON public.curriculum_tracks (academy_id)
    WHERE is_default = true;

CREATE TABLE IF NOT EXISTS public.curriculum_track_steps (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id uuid NOT NULL REFERENCES public.curriculum_tracks (id) ON DELETE CASCADE,
    curriculum_id uuid NOT NULL REFERENCES public.curriculum (id) ON DELETE CASCADE,
    sort_order integer NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE (track_id, curriculum_id)
);

CREATE INDEX IF NOT EXISTS idx_curriculum_track_steps_track ON public.curriculum_track_steps (track_id, sort_order);

COMMENT ON TABLE public.curriculum_tracks IS '학원별 커리큘럼 과정(트랙). is_default 로 학원당 하나의 기본 과정 지정';
COMMENT ON TABLE public.curriculum_track_steps IS '트랙(track_id)에 포함할 curriculum 단계와 순서(sort_order)';

ALTER TABLE public.students
    ADD COLUMN IF NOT EXISTS curriculum_track_id uuid REFERENCES public.curriculum_tracks (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_students_curriculum_track ON public.students (curriculum_track_id);

COMMENT ON COLUMN public.students.curriculum_track_id IS '학생에게 배정한 트랙. NULL이면 학원 기본 트랙(is_default) 사용';

ALTER TABLE public.curriculum_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_track_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "curriculum_tracks_select" ON public.curriculum_tracks;
CREATE POLICY "curriculum_tracks_select"
    ON public.curriculum_tracks FOR SELECT
    USING (academy_id = public.get_user_academy_id());

DROP POLICY IF EXISTS "curriculum_tracks_insert" ON public.curriculum_tracks;
CREATE POLICY "curriculum_tracks_insert"
    ON public.curriculum_tracks FOR INSERT
    WITH CHECK (
        academy_id = public.get_user_academy_id()
        AND public.get_user_role() = 'admin'
    );

DROP POLICY IF EXISTS "curriculum_tracks_update" ON public.curriculum_tracks;
CREATE POLICY "curriculum_tracks_update"
    ON public.curriculum_tracks FOR UPDATE
    USING (
        academy_id = public.get_user_academy_id()
        AND public.get_user_role() = 'admin'
    );

DROP POLICY IF EXISTS "curriculum_tracks_delete" ON public.curriculum_tracks;
CREATE POLICY "curriculum_tracks_delete"
    ON public.curriculum_tracks FOR DELETE
    USING (
        academy_id = public.get_user_academy_id()
        AND public.get_user_role() = 'admin'
    );

DROP POLICY IF EXISTS "curriculum_track_steps_select" ON public.curriculum_track_steps;
CREATE POLICY "curriculum_track_steps_select"
    ON public.curriculum_track_steps FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.curriculum_tracks t
            WHERE t.id = curriculum_track_steps.track_id
              AND t.academy_id = public.get_user_academy_id()
        )
    );

DROP POLICY IF EXISTS "curriculum_track_steps_insert" ON public.curriculum_track_steps;
CREATE POLICY "curriculum_track_steps_insert"
    ON public.curriculum_track_steps FOR INSERT
    WITH CHECK (
        public.get_user_role() = 'admin'
        AND EXISTS (
            SELECT 1
            FROM public.curriculum_tracks t
            WHERE t.id = curriculum_track_steps.track_id
              AND t.academy_id = public.get_user_academy_id()
        )
    );

DROP POLICY IF EXISTS "curriculum_track_steps_update" ON public.curriculum_track_steps;
CREATE POLICY "curriculum_track_steps_update"
    ON public.curriculum_track_steps FOR UPDATE
    USING (
        public.get_user_role() = 'admin'
        AND EXISTS (
            SELECT 1
            FROM public.curriculum_tracks t
            WHERE t.id = curriculum_track_steps.track_id
              AND t.academy_id = public.get_user_academy_id()
        )
    );

DROP POLICY IF EXISTS "curriculum_track_steps_delete" ON public.curriculum_track_steps;
CREATE POLICY "curriculum_track_steps_delete"
    ON public.curriculum_track_steps FOR DELETE
    USING (
        public.get_user_role() = 'admin'
        AND EXISTS (
            SELECT 1
            FROM public.curriculum_tracks t
            WHERE t.id = curriculum_track_steps.track_id
              AND t.academy_id = public.get_user_academy_id()
        )
    );


-- =============================================================================
-- 학생 등하원 비밀번호
-- =============================================================================

-- 학생별 등·하원 번호 8자리 (NULL이면 보호자 연락처 전화 숫자만 기준 뒤 8자리)

ALTER TABLE public.students
    ADD COLUMN IF NOT EXISTS attendance_pin varchar(8) NULL;

ALTER TABLE public.students
    DROP CONSTRAINT IF EXISTS students_attendance_pin_format;

ALTER TABLE public.students
    ADD CONSTRAINT students_attendance_pin_format CHECK (
        attendance_pin IS NULL
        OR attendance_pin ~ '^[0-9]{8}$'
    );

COMMENT ON COLUMN public.students.attendance_pin IS '등하원 매칭용 8자리. NULL이면 students.parent_phone (숫자만) 뒤 8자리';

CREATE INDEX IF NOT EXISTS idx_students_attendance_pin ON public.students (attendance_pin)
    WHERE attendance_pin IS NOT NULL;

-- 매월 납부 예정일(일). NULL이면 가입일 enrollment_date의 일자를 월별 자동 청구에 사용
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


-- =============================================================================
-- 학생 프로필: 학년·특징·진도 요약 (운영 DB에는 동일 ALTER 적용)
-- =============================================================================

ALTER TABLE public.students
    ADD COLUMN IF NOT EXISTS grade varchar(64) NULL;

ALTER TABLE public.students
    ADD COLUMN IF NOT EXISTS memo text NULL;

ALTER TABLE public.students
    ADD COLUMN IF NOT EXISTS progress_memo text NULL;

COMMENT ON COLUMN public.students.grade IS '학년 등 자유 표기 (예: 초3)';
COMMENT ON COLUMN public.students.memo IS '특징·콩쿨 계획 등 자유 메모';
COMMENT ON COLUMN public.students.progress_memo IS '진도 한 줄 요약 (단계별 상세는 student_progress)';


-- =============================================================================
-- 초기 관리자 학원 (데모 학생·커리큘럼 등은 넣지 않음)
-- =============================================================================
--
-- 관리자 로그인(참고): 이메일 csi515@nate.com / 비밀번호 123456
--   → Supabase Auth 계정·public.users 는 scripts/seed-admin.mjs 로 생성하거나
--     Dashboard → Authentication 에서 동일 이메일로 사용자를 만든 뒤,
--     public.users 에 해당 auth.users.id 로 행을 맞춥니다.
--   → 아래 academies.owner_email 과 관리자 이메일이 일치해야 합니다.
--
-- 고정 학원 UUID (SEED_ACADEMY_ID·seed-admin.mjs 기본값과 동일)

INSERT INTO public.academies (id, name, owner_email)
VALUES
    (
        '11111111-1111-1111-1111-111111111111'::uuid,
        'PiaNote',
        'csi515@nate.com'
    )
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 기본 트랙·트랙 단계 백필 (학원이 생긴 뒤 실행되어야 함 — 마이그레이션 20260331140000 과 동일)
-- ---------------------------------------------------------------------------

INSERT INTO public.curriculum_tracks (academy_id, name, sort_order, is_default)
SELECT a.id, '기본', 0, true
FROM public.academies a
WHERE NOT EXISTS (
    SELECT 1
    FROM public.curriculum_tracks t
    WHERE t.academy_id = a.id
);

INSERT INTO public.curriculum_track_steps (track_id, curriculum_id, sort_order)
SELECT
    tr.id,
    c.id,
    (ROW_NUMBER() OVER (
        PARTITION BY tr.id
        ORDER BY tb.sort_order ASC, c.textbook_step ASC, c."order" ASC
    ) - 1) AS sort_order
FROM public.curriculum_tracks tr
JOIN public.curriculum c ON c.academy_id = tr.academy_id
LEFT JOIN public.textbooks tb ON tb.id = c.textbook_id
WHERE tr.is_default = true
  AND NOT EXISTS (
      SELECT 1
      FROM public.curriculum_track_steps s
      WHERE s.track_id = tr.id
  );

-- =============================================================================
-- 마이그레이션: 등·하원 4자리 → 8자리 (기존 운영 DB에 한 번 적용)
-- =============================================================================

ALTER TABLE public.attendance
    ALTER COLUMN phone_last_digits TYPE varchar(8);

UPDATE public.students
SET attendance_pin = NULL
WHERE attendance_pin IS NOT NULL AND char_length(attendance_pin) < 8;

ALTER TABLE public.students
    ALTER COLUMN attendance_pin TYPE varchar(8);

ALTER TABLE public.students
    DROP CONSTRAINT IF EXISTS students_attendance_pin_format;

ALTER TABLE public.students
    ADD CONSTRAINT students_attendance_pin_format CHECK (
        attendance_pin IS NULL
        OR attendance_pin ~ '^[0-9]{8}$'
    );

-- ---------------------------------------------------------------------------
-- RPC: 활성 학생 중 교재비 미납 학생 수 (대시보드·textbooks.service · supabase.ts Functions)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.count_active_students_with_unpaid_textbooks (p_academy_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
    SELECT COUNT(DISTINCT st.student_id)::bigint
    FROM public.student_textbooks st
    INNER JOIN public.students s ON s.id = st.student_id
    WHERE s.academy_id = p_academy_id
      AND s.active = true
      AND st.paid = false;
$$;

REVOKE ALL ON FUNCTION public.count_active_students_with_unpaid_textbooks (uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_active_students_with_unpaid_textbooks (uuid) TO anon, authenticated;

COMMENT ON FUNCTION public.count_active_students_with_unpaid_textbooks (uuid) IS
    '학원 내 활성 학생 중 보유 교재 중 미납(paid=false)이 하나라도 있는 학생 수. 앱 RPC와 동일.';
