import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';

export type ConsultationRow = Database['public']['Tables']['consultations']['Row'];
type ConsultationInsert = Database['public']['Tables']['consultations']['Insert'];

/** 학생 한 명의 상담 일지 (페이지네이션) */
export const listConsultationsByStudentPage = async (
    studentId: string,
    page: number,
    pageSize: number
): Promise<{ rows: ConsultationRow[]; total: number }> => {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    try {
        const { data, error, count } = await supabase
            .from('consultations')
            .select('*', { count: 'exact' })
            .eq('student_id', studentId)
            .order('date', { ascending: false })
            .range(from, to);

        if (error) throw error;
        return {
            rows: (data || []) as ConsultationRow[],
            total: count ?? 0,
        };
    } catch (e) {
        console.error('listConsultationsByStudentPage:', e);
        return { rows: [], total: 0 };
    }
};

export const createConsultation = async (
    row: ConsultationInsert
): Promise<{ success: boolean; error?: string }> => {
    try {
        const { error } = await supabase.from('consultations').insert(row);
        if (error) throw error;
        return { success: true };
    } catch (e) {
        console.error('createConsultation:', e);
        return {
            success: false,
            error: e instanceof Error ? e.message : '등록 실패',
        };
    }
};

export const deleteConsultation = async (
    id: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        const { error } = await supabase.from('consultations').delete().eq('id', id);
        if (error) throw error;
        return { success: true };
    } catch (e) {
        console.error('deleteConsultation:', e);
        return {
            success: false,
            error: e instanceof Error ? e.message : '삭제 실패',
        };
    }
};
