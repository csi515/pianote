import { lazy, Suspense, useLayoutEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography, useMediaQuery, useTheme } from '@mui/material';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { MOBILE_BOTTOM_NAV_INNER_HEIGHT_PX } from '@/constants/layout';
import { PageTopBarProvider } from '@/contexts/PageTopBarContext';
import { MobileSidebarProvider } from '@/contexts/MobileSidebarContext';
import { ROUTES } from '@/constants/routes';
import { protectedRouteDefs } from '@/app/appRouteConfig';
import { PlatformAdminRoute } from '@/components/auth/PlatformAdminRoute';
import { isStandalonePwa } from '@/utils/pwa';
import { ui } from '@/i18n/ui';

const Login = lazy(() => import('@/pages/Login'));
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const AdminSignupPage = lazy(() => import('@/pages/AdminSignupPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
const BranchAdminsPage = lazy(() => import('@/pages/platform/BranchAdminsPage'));

function RouteFallback() {
    return (
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            minHeight="60vh"
            gap={2}
        >
            <CircularProgress size={48} aria-hidden />
            <Typography variant="body2" color="text.secondary" role="status" aria-live="polite">
                {ui.common.loading}
            </Typography>
        </Box>
    );
}

export function AppRoutes() {
    const location = useLocation();
    const navigate = useNavigate();
    const theme = useTheme();
    const isPhone = useMediaQuery(theme.breakpoints.down('sm'));

    useLayoutEffect(() => {
        if (!isStandalonePwa()) return;
        if (location.pathname !== ROUTES.landing) return;
        navigate(ROUTES.login, { replace: true });
    }, [location.pathname, navigate]);

    const showLayout =
        location.pathname !== ROUTES.login &&
        location.pathname !== ROUTES.signup &&
        location.pathname !== ROUTES.signupAdmin &&
        location.pathname !== ROUTES.landing &&
        location.pathname !== ROUTES.auth.forgotPassword &&
        location.pathname !== ROUTES.auth.resetPassword;

    return (
        <MobileSidebarProvider>
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default', minWidth: 0 }}>
            {showLayout && <Sidebar />}
            <PageTopBarProvider>
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    minWidth: 0,
                    overflowX: 'hidden',
                    p: showLayout ? { xs: 2, sm: 2.5, md: 3, lg: 3.5 } : 0,
                    pb: showLayout
                        ? isPhone
                            ? `calc(${MOBILE_BOTTOM_NAV_INNER_HEIGHT_PX}px + env(safe-area-inset-bottom))`
                            : {
                                  xs: 'max(16px, env(safe-area-inset-bottom))',
                                  sm: 2.5,
                                  md: 3,
                                  lg: 3.5,
                              }
                        : 0,
                    transition: 'all 0.3s',
                }}
            >
                {showLayout && <TopBar />}
                <Suspense fallback={<RouteFallback />}>
                    <Routes>
                        <Route path={ROUTES.login} element={<Login />} />
                        <Route path={ROUTES.signup} element={<Login />} />
                        <Route path={ROUTES.signupAdmin} element={<AdminSignupPage />} />
                        <Route path={ROUTES.landing} element={<LandingPage />} />
                        <Route path={ROUTES.auth.forgotPassword} element={<ForgotPasswordPage />} />
                        <Route path={ROUTES.auth.resetPassword} element={<ResetPasswordPage />} />

                        {protectedRouteDefs.map(({ path, Component, allowedRoles }) => (
                            <Route
                                key={path}
                                path={path}
                                element={
                                    <ProtectedRoute allowedRoles={allowedRoles}>
                                        <Component />
                                    </ProtectedRoute>
                                }
                            />
                        ))}

                        <Route
                            path={ROUTES.platform.branchAdmins}
                            element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <PlatformAdminRoute>
                                        <BranchAdminsPage />
                                    </PlatformAdminRoute>
                                </ProtectedRoute>
                            }
                        />

                        <Route path="*" element={<Navigate to={ROUTES.login} replace />} />
                    </Routes>
                </Suspense>
            </Box>
            </PageTopBarProvider>
            {showLayout && <MobileBottomNav />}
        </Box>
        </MobileSidebarProvider>
    );
}
