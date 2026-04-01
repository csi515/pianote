import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/constants/routes';
import { isDevAuthBypass } from '@/lib/devAuth';

/**
 * 로그인/회원가입 페이지에서 이미 로그인된 사용자 처리.
 * 웹앱은 학원 관리자(및 플랫폼)만 사용 — 학생 계정은 로그아웃 후 안내.
 *
 * 개발 모드에서 인증 우회(VITE_DEV_BYPASS_AUTH) 시 세션은 없고 mock user만 있으면
 * 자동 리다이렉트하지 않아, 실제 계정으로 로그인·가입 플로우를 테스트할 수 있게 함.
 */
export const useAuthRedirectOnLogin = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, profile, session, loading: authLoading, signOut } = useAuth();

    useEffect(() => {
        if (authLoading) return;
        if (!user || !profile) return;
        if (isDevAuthBypass() && !session) {
            return;
        }
        const isAuthPage =
            location.pathname === ROUTES.login ||
            location.pathname === ROUTES.signup ||
            location.pathname === ROUTES.signupAdmin;
        if (!isAuthPage) return;
        if (profile.role === 'admin') {
            navigate(ROUTES.admin.dashboard, { replace: true });
            return;
        }
        void (async () => {
            await signOut();
            navigate(ROUTES.login, {
                replace: true,
                state: { authMessageKey: 'loginAdminOnly' as const },
            });
        })();
    }, [authLoading, user, profile, session, location.pathname, navigate, signOut]);
};
