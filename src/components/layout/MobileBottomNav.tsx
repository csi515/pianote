import { useMemo } from 'react';
import { Box, ButtonBase, Paper, Typography, useMediaQuery, useTheme } from '@mui/material';
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

function shortLabelForPath(path: string): string {
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
 * sm 미만(폰)에서만 표시. 태블릿·데스크톱은 사이드바만 사용.
 */
export function MobileBottomNav() {
    const theme = useTheme();
    const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
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

    if (!isPhone) return null;

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
                pb: 'env(safe-area-inset-bottom)',
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'stretch',
                    justifyContent: 'stretch',
                    minHeight: MOBILE_BOTTOM_NAV_INNER_HEIGHT_PX,
                }}
            >
                {items.map((item) => {
                    const selected = location.pathname === item.path;
                    return (
                        <Box key={item.path} sx={{ flex: 1, minWidth: 0 }}>
                            <ButtonBase
                                focusRipple
                                onClick={() => navigate(item.path)}
                                sx={{
                                    width: '100%',
                                    minHeight: MIN_TOUCH_TARGET_PX,
                                    py: 0.75,
                                    px: 0.25,
                                    flexDirection: 'column',
                                    gap: 0.25,
                                    color: selected ? 'primary.main' : 'text.secondary',
                                }}
                            >
                                <item.Icon sx={{ fontSize: 22 }} aria-hidden />
                                <Typography
                                    variant="caption"
                                    component="span"
                                    noWrap
                                    sx={{
                                        fontSize: '0.65rem',
                                        fontWeight: selected ? 600 : 400,
                                        lineHeight: 1.1,
                                    }}
                                >
                                    {item.shortLabel}
                                </Typography>
                            </ButtonBase>
                        </Box>
                    );
                })}
            </Box>
        </Paper>
    );
}
