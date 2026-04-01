import { useMemo } from 'react';
import { Box, BottomNavigation, BottomNavigationAction, Paper, useMediaQuery, useTheme } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { ui } from '@/i18n/ui';
import { ROUTES } from '@/constants/routes';
import { MOBILE_BOTTOM_NAV_INNER_HEIGHT_PX } from '@/constants/layout';
import { MIN_TOUCH_TARGET_PX } from '@/constants/touch';
import {
    adminNavItems,
    platformNavItems,
    type SidebarNavItem,
} from '@/components/layout/sidebarNavConfig';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';

type BottomItem = SidebarNavItem & { shortLabel: string };

function shortLabelForPath (path: string): string {
    const l = ui.layout.mobileBottomNav;
    switch (path) {
        case ROUTES.admin.dashboard:
            return l.dashboard;
        case ROUTES.admin.students:
            return l.students;
        case ROUTES.admin.payments:
            return l.payments;
        case ROUTES.admin.textbooks:
            return l.textbooks;
        case ROUTES.admin.settings:
            return l.settings;
        case ROUTES.platform.branchAdmins:
            return l.platform;
        default:
            return '';
    }
}

/**
 * md 미만: 하단 고정 BottomNavigation. md 이상은 permanent Drawer만 사용(중복 제거).
 */
export function MobileBottomNav () {
    const theme = useTheme();
    const isBelowMd = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true });
    const location = useLocation();
    const navigate = useNavigate();
    const { isPlatformAdmin } = usePlatformAdmin();

    const items = useMemo((): BottomItem[] => {
        const academy = adminNavItems.map((item) => ({
            ...item,
            shortLabel: shortLabelForPath(item.path),
        }));
        const onPlatform = location.pathname.startsWith('/platform');
        if (isPlatformAdmin || onPlatform) {
            return [
                ...platformNavItems.map((item) => ({
                    ...item,
                    shortLabel: shortLabelForPath(item.path),
                })),
                ...academy,
            ];
        }
        return academy;
    }, [location.pathname, isPlatformAdmin]);

    const value = useMemo(() => {
        const i = items.findIndex((item) => item.path === location.pathname);
        return i >= 0 ? i : false;
    }, [items, location.pathname]);

    if (!isBelowMd) return null;

    return (
        <Paper
            component="nav"
            elevation={8}
            square
            aria-label={ui.layout.mobileBottomNavAria}
            sx={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: theme.zIndex.appBar - 1,
                borderTop: 1,
                borderColor: 'divider',
                boxSizing: 'border-box',
                pb: 'env(safe-area-inset-bottom, 0px)',
            }}
        >
            {/** 항목 많을 때(플랫폼+학원) 좁은 폭에서 가로 스크롤 */}
            <Box
                sx={{
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    WebkitOverflowScrolling: 'touch',
                    scrollbarWidth: 'thin',
                }}
            >
                <BottomNavigation
                    value={value}
                    showLabels
                    onChange={(_, newValue) => {
                        const item = items[newValue];
                        if (item) navigate(item.path);
                    }}
                    sx={{
                        minHeight: MOBILE_BOTTOM_NAV_INNER_HEIGHT_PX,
                        width: 'max-content',
                        minWidth: '100%',
                        bgcolor: 'background.paper',
                        '& .MuiBottomNavigationAction-root': {
                            flex: '0 0 auto',
                            minWidth: 64,
                            maxWidth: 'none',
                            minHeight: MIN_TOUCH_TARGET_PX,
                            py: 0.5,
                            px: 0.25,
                        },
                        '& .MuiBottomNavigationAction-label': {
                            fontSize: '0.65rem',
                            lineHeight: 1.1,
                            opacity: 1,
                            '&.Mui-selected': { fontSize: '0.65rem' },
                        },
                    }}
                >
                    {items.map((item) => (
                        <BottomNavigationAction
                            key={item.path}
                            label={item.shortLabel}
                            icon={<item.Icon sx={{ fontSize: 22 }} aria-hidden />}
                            aria-label={`${item.text} ${item.shortLabel}`}
                        />
                    ))}
                </BottomNavigation>
            </Box>
        </Paper>
    );
}
