import { supabase } from '@/lib/supabase';
import type { Academy, UserProfile } from '@/types/auth';

/** 0행일 때 single/maybeSingle 이 PGRST116을 내는 경우 방지 */
export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).limit(1);
    if (error) throw error;
    const row = data?.[0];
    return row ? (row as UserProfile) : null;
}

export async function fetchAcademyById(academyId: string): Promise<Academy | null> {
    const { data, error } = await supabase.from('academies').select('*').eq('id', academyId).limit(1);
    if (error) throw error;
    const row = data?.[0];
    return row ? (row as Academy) : null;
}
