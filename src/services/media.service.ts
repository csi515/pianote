import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';

export type MediaRow = Database['public']['Tables']['media']['Row'];
type MediaInsert = Database['public']['Tables']['media']['Insert'];

/** 학생 한 명의 연주 영상 (페이지네이션) */
export const listMediaByStudentPage = async (
    studentId: string,
    page: number,
    pageSize: number
): Promise<{ rows: MediaRow[]; total: number }> => {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    try {
        const { data, error, count } = await supabase
            .from('media')
            .select('*', { count: 'exact' })
            .eq('student_id', studentId)
            .order('uploaded_at', { ascending: false })
            .range(from, to);

        if (error) throw error;
        return {
            rows: (data || []) as MediaRow[],
            total: count ?? 0,
        };
    } catch (e) {
        console.error('listMediaByStudentPage:', e);
        return { rows: [], total: 0 };
    }
};

export const createMedia = async (
    row: MediaInsert
): Promise<{ success: boolean; error?: string }> => {
    try {
        const { error } = await supabase.from('media').insert(row);
        if (error) throw error;
        return { success: true };
    } catch (e) {
        console.error('createMedia:', e);
        return {
            success: false,
            error: e instanceof Error ? e.message : '등록 실패',
        };
    }
};

export const deleteMedia = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const { error } = await supabase.from('media').delete().eq('id', id);
        if (error) throw error;
        return { success: true };
    } catch (e) {
        console.error('deleteMedia:', e);
        return {
            success: false,
            error: e instanceof Error ? e.message : '삭제 실패',
        };
    }
};
