import type { User } from '@supabase/supabase-js';
import type { Academy, UserProfile } from '@/types/auth';

const DEV_USER_ID = '00000000-0000-4000-8000-000000000001';

/**
 * 개발 서버에서 로그인 없이 학원(관리자) 등 보호 라우트 진입.
 * 프로덕션 빌드에서는 항상 false.
 * 끄려면 .env에 VITE_DEV_BYPASS_AUTH=false
 */
export function isDevAuthBypass (): boolean {
    if (!import.meta.env.DEV) return false;
    return import.meta.env.VITE_DEV_BYPASS_AUTH !== 'false';
}

function parseRole (): UserProfile['role'] {
    const r = import.meta.env.VITE_DEV_ROLE;
    if (r === 'student' || r === 'admin') return r;
    return 'admin';
}

/** Supabase User 최소 필드 (클라이언트 표시용) */
export function createDevMockUser (id: string): User {
    return {
        id,
        aud: 'authenticated',
        role: 'authenticated',
        email: 'dev@local.invalid',
        app_metadata: {},
        user_metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        identities: [],
    } as User;
}

export function getDevMockAuth (): { user: User; profile: UserProfile; academy: Academy } {
    const academyId = import.meta.env.VITE_DEV_ACADEMY_ID?.trim() || DEV_USER_ID;
    const academyName = import.meta.env.VITE_DEV_ACADEMY_NAME?.trim() || '개발 학원';
    const role = parseRole();
    const user = createDevMockUser(DEV_USER_ID);
    const profile: UserProfile = {
        id: DEV_USER_ID,
        academy_id: academyId,
        role,
        name: '개발 사용자',
        email: 'dev@local.invalid',
        phone: '',
    };
    const academy: Academy = {
        id: academyId,
        name: academyName,
        owner_email: 'dev@local.invalid',
    };
    return { user, profile, academy };
}
