import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';
import {
    textbookPaymentRowStatusFromAssignments,
    type StudentTextbookPaymentRowStatus,
} from '@/services/textbooks.service';

type Student = Database['public']['Tables']['students']['Row'];
type StudentInsert = Database['public']['Tables']['students']['Insert'];
type StudentUpdate = Database['public']['Tables']['students']['Update'];

/** 학생 행 (목록/페이지용 — 보호자 연락처는 `parent_phone`만 사용) */
export type StudentWithParent = Student;

/**
 * 학생 목록 조회
 */
export const getStudents = async (academyId: string): Promise<StudentWithParent[]> => {
    try {
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .eq('academy_id', academyId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []) as Student[];
    } catch (error) {
        console.error('Error getting students:', error);
        return [];
    }
};

export type StudentsPageResult = {
    rows: StudentWithParent[];
    total: number;
};

/**
 * 학생 목록 페이지 (Supabase range + 전체 건수)
 */
export const getStudentsPage = async (
    academyId: string,
    page: number,
    pageSize: number
): Promise<StudentsPageResult> => {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    try {
        const { data, error, count } = await supabase
            .from('students')
            .select('*', { count: 'exact' })
            .eq('academy_id', academyId)
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;
        return {
            rows: (data || []) as Student[],
            total: count ?? 0,
        };
    } catch (error) {
        console.error('getStudentsPage:', error);
        return { rows: [], total: 0 };
    }
};

export type StudentsPageWithTextbookResult = {
    rows: StudentWithParent[];
    total: number;
    textbookPaymentByStudent: Record<string, StudentTextbookPaymentRowStatus>;
};

type StudentRowWithTextbooks = StudentWithParent & {
    student_textbooks?: { paid: boolean }[] | null;
};

/**
 * 학생 목록 페이지 + 행별 교재비 납부 상태를 한 번의 select로 조회 (중첩 student_textbooks).
 * 교재비 열 값은 대시보드/종 알림과 동일하게 **활성 학생만** none/paid/unpaid;
 * `active === false` 이면 `inactive_excluded`(표시는 —, 집계 제외).
 */
export const getStudentsPageWithTextbookPaymentStatuses = async (
    academyId: string,
    page: number,
    pageSize: number
): Promise<StudentsPageWithTextbookResult> => {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    try {
        const { data, error, count } = await supabase
            .from('students')
            .select('*, student_textbooks(paid)', { count: 'exact' })
            .eq('academy_id', academyId)
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;
        const raw = (data ?? []) as unknown as StudentRowWithTextbooks[];
        const rows: StudentWithParent[] = [];
        const textbookPaymentByStudent: Record<string, StudentTextbookPaymentRowStatus> = {};
        for (const row of raw) {
            const { student_textbooks: stRows, ...student } = row;
            rows.push(student as StudentWithParent);
            textbookPaymentByStudent[student.id] = student.active
                ? textbookPaymentRowStatusFromAssignments(stRows)
                : 'inactive_excluded';
        }
        return {
            rows,
            total: count ?? 0,
            textbookPaymentByStudent,
        };
    } catch (e) {
        console.error('getStudentsPageWithTextbookPaymentStatuses:', e);
        return { rows: [], total: 0, textbookPaymentByStudent: {} };
    }
};

export type AcademyStudentStats = { total: number; active: number };

export const getAcademyStudentStats = async (
    academyId: string
): Promise<AcademyStudentStats> => {
    try {
        const [{ count: total }, { count: active }] = await Promise.all([
            supabase
                .from('students')
                .select('*', { count: 'exact', head: true })
                .eq('academy_id', academyId),
            supabase
                .from('students')
                .select('*', { count: 'exact', head: true })
                .eq('academy_id', academyId)
                .eq('active', true),
        ]);
        return { total: total ?? 0, active: active ?? 0 };
    } catch (e) {
        console.error('getAcademyStudentStats:', e);
        return { total: 0, active: 0 };
    }
};

/** 드롭다운 등 경량 목록용 (활성 학생 + 가입일·퇴원일·월회비 — 결제 월 필터에 사용) */
export type ActiveStudentSummary = {
    id: string;
    name: string;
    enrollment_date: string;
    left_academy_date: string | null;
    monthly_fee: number | null;
};

export const listActiveStudentSummaries = async (
    academyId: string
): Promise<ActiveStudentSummary[]> => {
    try {
        const { data, error } = await supabase
            .from('students')
            .select('id, name, enrollment_date, left_academy_date, monthly_fee')
            .eq('academy_id', academyId)
            .eq('active', true)
            .order('name', { ascending: true });

        if (error) throw error;
        return (data || []).map((r) => ({
            id: r.id,
            name: r.name,
            enrollment_date: r.enrollment_date as string,
            left_academy_date: r.left_academy_date ?? null,
            monthly_fee: r.monthly_fee ?? null,
        }));
    } catch (e) {
        console.error('listActiveStudentSummaries:', e);
        return [];
    }
};

/**
 * 학생 추가
 */
export const createStudent = async (
    student: StudentInsert
): Promise<{ success: boolean; error?: string; student?: Student }> => {
    try {
        const { data, error } = await supabase
            .from('students')
            .insert(student)
            .select()
            .single();

        if (error) throw error;

        return { success: true, student: data };
    } catch (error) {
        console.error('Error creating student:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '학생 추가 실패',
        };
    }
};

/**
 * 학생 수정
 */
export const updateStudent = async (
    id: string,
    updates: StudentUpdate
): Promise<{ success: boolean; error?: string }> => {
    try {
        const { error } = await supabase
            .from('students')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error updating student:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '학생 수정 실패',
        };
    }
};

/**
 * 학생 삭제 (실제로는 비활성화)
 */
export const deleteStudent = async (
    id: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        const { error } = await supabase
            .from('students')
            .update({ active: false })
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error deleting student:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '학생 삭제 실패',
        };
    }
};

/**
 * 학생 로그인 계정(users.id)으로 연결된 students 행 조회
 */
export const getStudentByUserId = async (
    userId: string
): Promise<Student | null> => {
    try {
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .eq('user_id', userId)
            .eq('active', true)
            .maybeSingle();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('getStudentByUserId:', error);
        return null;
    }
};

/**
 * 학생 수 조회
 */
export const getStudentCount = async (academyId: string): Promise<number> => {
    try {
        const { count, error } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('academy_id', academyId)
            .eq('active', true);

        if (error) throw error;
        return count || 0;
    } catch (error) {
        console.error('Error getting student count:', error);
        return 0;
    }
};
