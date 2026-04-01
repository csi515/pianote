import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';
import { ROUTES } from '@/constants/routes';

interface PlatformAdminRouteProps {
    children: ReactNode;
}

export function PlatformAdminRoute ({ children }: PlatformAdminRouteProps) {
    const { user, profile, loading: authLoading } = useAuth();
    const { isPlatformAdmin, loading: platformLoading } = usePlatformAdmin();

    if (authLoading || platformLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress size={60} />
            </Box>
        );
    }

    if (!user || !profile) {
        return <Navigate to={ROUTES.login} replace />;
    }

    if (!isPlatformAdmin) {
        return <Navigate to={ROUTES.admin.dashboard} replace />;
    }

    return <>{children}</>;
}
