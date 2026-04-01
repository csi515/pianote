/**
 * 플랫폼(본사) 관리자 전용 API. 권한 경계·RLS 매트릭스는 docs/ROLES.md 참고.
 * 지점 관리자는 동일 학원 스코프로만 동작하며, 클라이언트 필터는 RLS가 최종 검증한다.
 */
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';

export type AcademyRow = Database['public']['Tables']['academies']['Row'];
export type BranchAdminRow = Pick<
    Database['public']['Tables']['users']['Row'],
    'id' | 'name' | 'email' | 'phone' | 'role' | 'academy_id'
>;

export async function checkPlatformAdmin (userId: string): Promise<boolean> {
    const { data, error } = await supabase
        .from('platform_admins')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();

    if (error) {
        console.error('checkPlatformAdmin:', error);
        return false;
    }
    return Boolean(data);
}

export async function listAllAcademies (): Promise<AcademyRow[]> {
    const { data, error } = await supabase.from('academies').select('*').order('name');

    if (error) {
        console.error('listAllAcademies:', error);
        return [];
    }
    return (data || []) as AcademyRow[];
}

export async function listBranchAdmins (academyId: string): Promise<BranchAdminRow[]> {
    const { data, error } = await supabase
        .from('users')
        .select('id, name, email, phone, role, academy_id')
        .eq('academy_id', academyId)
        .eq('role', 'admin')
        .order('name');

    if (error) {
        console.error('listBranchAdmins:', error);
        return [];
    }
    return (data || []) as BranchAdminRow[];
}

/**
 * 해당 지점에 이미 가입한 학생 계정을 지점 관리자(admin)로 임명
 */
export async function appointBranchAdmin (
    academyId: string,
    email: string
): Promise<{ error: Error | null }> {
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
        return { error: new Error('이메일을 입력해 주세요.') };
    }

    const { data: row, error: findError } = await supabase
        .from('users')
        .select('id, role')
        .eq('academy_id', academyId)
        .ilike('email', normalized)
        .maybeSingle();

    if (findError) {
        return { error: findError as Error };
    }
    if (!row) {
        return {
            error: new Error(
                '해당 이메일로 이 지점에 가입한 사용자가 없습니다. 학생으로 먼저 가입한 뒤 임명할 수 있습니다.'
            ),
        };
    }
    if (row.role === 'admin') {
        return { error: new Error('이미 지점 관리자입니다.') };
    }
    if (row.role !== 'student') {
        return { error: new Error('임명할 수 없는 역할입니다.') };
    }

    const { error: upError } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('id', row.id)
        .eq('academy_id', academyId);

    if (upError) {
        return { error: upError as Error };
    }
    return { error: null };
}

/**
 * 지점 관리자 해임 → 학생(student) 역할로 전환
 */
export async function demoteBranchAdmin (
    academyId: string,
    userId: string
): Promise<{ error: Error | null }> {
    const { error } = await supabase
        .from('users')
        .update({ role: 'student' })
        .eq('id', userId)
        .eq('academy_id', academyId)
        .eq('role', 'admin');

    if (error) {
        return { error: error as Error };
    }
    return { error: null };
}
