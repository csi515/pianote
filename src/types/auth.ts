import type { User, Session } from '@supabase/supabase-js';

export interface UserProfile {
    id: string;
    academy_id: string;
    role: 'admin' | 'student';
    name: string;
    email: string | null;
    phone: string | null;
}

export interface Academy {
    id: string;
    name: string;
    owner_email: string;
    default_monthly_fee?: number | null;
}

export interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    academy: Academy | null;
    session: Session | null;
    loading: boolean;
    /** `rememberLogin`: true면 브라우저를 닫아도 유지(localStorage), false면 탭 단위(sessionStorage) */
    signIn: (email: string, password: string, rememberLogin?: boolean) => Promise<{ error: Error | null }>;
    signUp: (
        email: string,
        password: string,
        name: string,
        phone: string,
        academyName: string
    ) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
    /** 로그인 상태에서 현재 비밀번호 확인 후 변경 */
    changePassword: (
        currentPassword: string,
        newPassword: string
    ) => Promise<{ error: Error | null }>;
    /** 비밀번호 재설정 이메일 발송(비로그인) */
    requestPasswordReset: (email: string) => Promise<{ error: Error | null }>;
    /** DB의 학원·프로필 변경 후 UI 동기화 */
    refreshUserProfile: () => Promise<void>;
    isAdmin: () => boolean;
    isStudent: () => boolean;
}
