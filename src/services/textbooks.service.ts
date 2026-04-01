/**
 * 교재비 미납 **집계·알림**(대시보드, 상단 종, 본 타일)은 **활성 학생(`students.active`)만** 대상이다.
 * `countStudentsWithUnpaidTextbookFees` 및 UI 문구와 동일 기준.
 * 학생 관리 테이블 교재비 열도 위와 맞추며, 비활성 행은 집계 제외 표시(—).
 * 원시 `student_textbooks` 조회는 비활성 학생에도 있으나, 목록 열 표시는 서비스/테이블에서 제외 처리한다.
 */
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';

type TextbookRow = Database['public']['Tables']['textbooks']['Row'];
type TextbookInsert = Database['public']['Tables']['textbooks']['Insert'];
type StudentTextbookRow = Database['public']['Tables']['student_textbooks']['Row'];

export type StudentTextbookWithDetails = StudentTextbookRow & {
    textbooks: Pick<TextbookRow, 'id' | 'name' | 'price'> | null;
};

export async function listTextbooks (academyId: string): Promise<TextbookRow[]> {
    const { data, error } = await supabase
        .from('textbooks')
        .select('*')
        .eq('academy_id', academyId)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });
    if (error) throw error;
    return (data || []) as TextbookRow[];
}

async function getNextTextbookSortOrder (academyId: string): Promise<number> {
    const { data } = await supabase
        .from('textbooks')
        .select('sort_order')
        .eq('academy_id', academyId)
        .order('sort_order', { ascending: false })
        .limit(1)
        .maybeSingle();
    const max = (data as { sort_order?: number } | null)?.sort_order;
    return (max ?? -1) + 1;
}

export async function createTextbook (row: Omit<TextbookInsert, 'id' | 'created_at'>): Promise<{ error: Error | null }> {
    const sort_order = row.sort_order ?? (await getNextTextbookSortOrder(row.academy_id));
    const { error } = await supabase.from('textbooks').insert({ ...row, sort_order });
    return { error: error ? new Error(error.message) : null };
}

/** 학원 내 교재 나열 순서 일괄 저장 (orderedIds[0]이 맨 위) */
export async function reorderTextbooks (
    academyId: string,
    orderedIds: string[]
): Promise<{ success: boolean; error?: string }> {
    try {
        const { data: existing, error: fetchErr } = await supabase
            .from('textbooks')
            .select('id')
            .eq('academy_id', academyId);
        if (fetchErr) throw fetchErr;
        const ids = new Set((existing || []).map((r) => r.id as string));
        if (orderedIds.some((id) => !ids.has(id))) {
            return { success: false, error: '잘못된 교재입니다.' };
        }
        if (orderedIds.length !== ids.size) {
            return { success: false, error: '교재 목록이 일치하지 않습니다.' };
        }
        for (let i = 0; i < orderedIds.length; i++) {
            const { error } = await supabase
                .from('textbooks')
                .update({ sort_order: i })
                .eq('id', orderedIds[i])
                .eq('academy_id', academyId);
            if (error) throw error;
        }
        return { success: true };
    } catch (e) {
        console.error('reorderTextbooks:', e);
        return {
            success: false,
            error: e instanceof Error ? e.message : '순서 저장 실패',
        };
    }
}

export async function updateTextbook (
    id: string,
    updates: Partial<Pick<TextbookRow, 'name' | 'price' | 'sort_order'>>
): Promise<{ error: Error | null }> {
    const { error } = await supabase.from('textbooks').update(updates).eq('id', id);
    return { error: error ? new Error(error.message) : null };
}

export async function deleteTextbook (id: string): Promise<{ error: Error | null }> {
    const { error: curErr } = await supabase.from('curriculum').delete().eq('textbook_id', id);
    if (curErr) return { error: new Error(curErr.message) };
    const { error } = await supabase.from('textbooks').delete().eq('id', id);
    return { error: error ? new Error(error.message) : null };
}

export async function listStudentTextbooks (
    studentId: string
): Promise<StudentTextbookWithDetails[]> {
    const { data, error } = await supabase
        .from('student_textbooks')
        .select('id, student_id, textbook_id, paid, paid_at, created_at, textbooks ( id, name, price )')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as StudentTextbookWithDetails[];
}

export async function assignTextbook (
    studentId: string,
    textbookId: string
): Promise<{ error: Error | null }> {
    const { error } = await supabase.from('student_textbooks').insert({
        student_id: studentId,
        textbook_id: textbookId,
        paid: false,
        paid_at: null,
    });
    if (error?.code === '23505') {
        return { error: new Error('이미 등록된 교재입니다.') };
    }
    return { error: error ? new Error(error.message) : null };
}

export async function setStudentTextbookPaid (
    assignmentId: string,
    paid: boolean
): Promise<{ error: Error | null }> {
    const today = new Date().toISOString().slice(0, 10);
    const { error } = await supabase
        .from('student_textbooks')
        .update({
            paid,
            paid_at: paid ? today : null,
        })
        .eq('id', assignmentId);
    return { error: error ? new Error(error.message) : null };
}

/** 납부 처리된 교재의 납부일만 변경 (스위치로 납부한 뒤 날짜 조정용) */
export async function updateStudentTextbookPaidDate (
    assignmentId: string,
    paidAtIso: string
): Promise<{ error: Error | null }> {
    const { error } = await supabase
        .from('student_textbooks')
        .update({
            paid: true,
            paid_at: paidAtIso,
        })
        .eq('id', assignmentId);
    return { error: error ? new Error(error.message) : null };
}

export async function removeStudentTextbook (assignmentId: string): Promise<{ error: Error | null }> {
    const { error } = await supabase.from('student_textbooks').delete().eq('id', assignmentId);
    return { error: error ? new Error(error.message) : null };
}

/** 학생 목록 행별 교재비 표시: 배정 없음 | 전부 납부 | 미납 | 비활성(집계·알림 제외) */
export type StudentTextbookPaymentRowStatus = 'none' | 'paid' | 'unpaid' | 'inactive_excluded';

/** `student_textbooks` 행 또는 중첩 select 결과로 행 상태 계산 (목록 조회·부분 갱신 공통) */
export function textbookPaymentRowStatusFromAssignments (
    rows: { paid: boolean }[] | null | undefined
): StudentTextbookPaymentRowStatus {
    if (!rows?.length) return 'none';
    if (rows.some((r) => r.paid === false)) return 'unpaid';
    return 'paid';
}

/**
 * 보유 교재·납부 상태만 조회 (부분 갱신용). `paid`/`none` 등은 DB 그대로이며,
 * 비활성 학생은 호출부에서 `inactive_excluded`로 덮어씀(집계는 활성만과 동일 규칙).
 */
export async function getStudentTextbookPaymentStatuses (
    studentIds: string[]
): Promise<Record<string, StudentTextbookPaymentRowStatus>> {
    const result: Record<string, StudentTextbookPaymentRowStatus> = {};
    for (const id of studentIds) {
        result[id] = 'none';
    }
    if (studentIds.length === 0) return result;

    const { data, error } = await supabase
        .from('student_textbooks')
        .select('student_id, paid')
        .in('student_id', studentIds);
    if (error) throw error;

    const agg = new Map<string, { any: boolean; anyUnpaid: boolean }>();
    for (const id of studentIds) {
        agg.set(id, { any: false, anyUnpaid: false });
    }
    for (const row of data ?? []) {
        const sid = row.student_id as string;
        const cur = agg.get(sid);
        if (!cur) continue;
        cur.any = true;
        if (row.paid === false) cur.anyUnpaid = true;
    }
    for (const id of studentIds) {
        const cur = agg.get(id)!;
        if (!cur.any) result[id] = 'none';
        else if (cur.anyUnpaid) result[id] = 'unpaid';
        else result[id] = 'paid';
    }
    return result;
}

/**
 * 활성 학생 중 보유 교재 중 하나라도 교재비 미납(`paid = false`)인 학생 수 (중복 학생 1명으로 카운트).
 * DB에 `count_active_students_with_unpaid_textbooks` RPC가 있으면 한 번의 왕복으로 처리한다.
 */
export async function countStudentsWithUnpaidTextbookFees (academyId: string): Promise<number> {
    const { data: rpcData, error: rpcErr } = await supabase.rpc(
        'count_active_students_with_unpaid_textbooks',
        { p_academy_id: academyId }
    );
    if (!rpcErr && rpcData != null) {
        const n = typeof rpcData === 'number' ? rpcData : Number(rpcData);
        if (Number.isFinite(n)) return n;
    }
    if (rpcErr) {
        console.warn('countStudentsWithUnpaidTextbookFees RPC fallback:', rpcErr.message);
    }

    const { data: studs, error: e1 } = await supabase
        .from('students')
        .select('id')
        .eq('academy_id', academyId)
        .eq('active', true);
    if (e1) {
        console.error('countStudentsWithUnpaidTextbookFees students:', e1);
        return 0;
    }
    if (!studs?.length) return 0;
    const sids = studs.map((s) => s.id);
    const { data: rows, error: e2 } = await supabase
        .from('student_textbooks')
        .select('student_id')
        .eq('paid', false)
        .in('student_id', sids);
    if (e2) {
        console.error('countStudentsWithUnpaidTextbookFees student_textbooks:', e2);
        return 0;
    }
    if (!rows?.length) return 0;
    return new Set(rows.map((r) => r.student_id as string)).size;
}
