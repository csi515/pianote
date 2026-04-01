import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';
import { ROUTES } from '@/constants/routes';

interface ProtectedRouteProps {
    children: ReactNode;
    allowedRoles?: ('admin')[];
    redirectTo?: string;
}

export const ProtectedRoute = ({
    children,
    allowedRoles,
    redirectTo = ROUTES.login
}: ProtectedRouteProps) => {
    const { user, profile, loading } = useAuth();

    // 로딩 중일 때
    if (loading) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight="100vh"
            >
                <CircularProgress size={60} />
            </Box>
        );
    }

    // 로그인하지 않은 경우
    if (!user) {
        return <Navigate to={redirectTo} replace />;
    }

    // 프로필이 없는 경우 (데이터 로딩 실패)
    if (!profile) {
        return <Navigate to={redirectTo} replace />;
    }

    // 역할 체크 — 웹앱 로그인은 학원·플랫폼 관리자만 (학생 계정은 DB·연동용)
    if (allowedRoles && !allowedRoles.some((r) => r === profile.role)) {
        if (profile.role === 'admin') {
            return <Navigate to={ROUTES.admin.dashboard} replace />;
        }
        return (
            <Navigate
                to={ROUTES.login}
                replace
                state={{
                    authMessageKey: 'loginAdminOnly',
                }}
            />
        );
    }

    return <>{children}</>;
};
