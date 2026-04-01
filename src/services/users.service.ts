import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';

export type StudentRoleUser = Pick<
    Database['public']['Tables']['users']['Row'],
    'id' | 'name' | 'email'
>;

/**
 * 같은 학원의 학생 역할 사용자 목록 (students.user_id 연결용)
 */
export const getStudentRoleUsers = async (
    academyId: string
): Promise<StudentRoleUser[]> => {
    const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('academy_id', academyId)
        .eq('role', 'student')
        .order('name');

    if (error) {
        console.error('getStudentRoleUsers:', error);
        return [];
    }
    return (data || []) as StudentRoleUser[];
};
