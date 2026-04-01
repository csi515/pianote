import { lazy, Suspense, useLayoutEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { MOBILE_MAIN_BOTTOM_PADDING } from '@/constants/layout';
import { PageTopBarProvider } from '@/contexts/PageTopBarContext';
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
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default', minWidth: 0 }}>
            {showLayout && <Sidebar />}
            <PageTopBarProvider>
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    minWidth: 0,
                    overflowX: 'hidden',
                    /* xs: 좌우는 MuiContainer(테마)만; 상하는 유지 */
                    px: showLayout ? { xs: 0, sm: 2.5, md: 3, lg: 3.5 } : 0,
                    pt: showLayout ? { xs: 2, sm: 2.5, md: 3, lg: 3.5 } : 0,
                    /* md 미만: BottomNav 높이; md 이상: Drawer만(사이드바 폭은 flex 형제로 확보) */
                    pb: showLayout
                        ? {
                              xs: MOBILE_MAIN_BOTTOM_PADDING,
                              md: 2.5,
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
    );
}
