import { supabase } from '@/lib/supabase';

export type AttendanceType = 'check_in' | 'check_out';

export interface AttendanceRecord {
    id?: string;
    student_id: string;
    type: AttendanceType;
    timestamp?: string;
    phone_last_digits: string;
}

/**
 * 학생별 등·하원 기록 (관리자 화면용, 최근 N건)
 */
export const listAttendanceByStudent = async (
    studentId: string,
    limit = 40
): Promise<AttendanceRecord[]> => {
    try {
        const { data, error } = await supabase
            .from('attendance')
            .select('*')
            .eq('student_id', studentId)
            .order('timestamp', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return (data as AttendanceRecord[]) || [];
    } catch (error) {
        console.error('listAttendanceByStudent:', error);
        return [];
    }
};
