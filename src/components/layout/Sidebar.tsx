import React, { useMemo } from 'react';
import {
    Box,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    Drawer,
    Typography,
    Button,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { alpha } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';
import { ui } from '@/i18n/ui';
import { useAuth } from '@/contexts/AuthContext';
import { ADMIN_DRAWER_WIDTH } from '@/constants/layout';
import { MIN_TOUCH_TARGET_PX } from '@/constants/touch';
import { ROUTES } from '@/constants/routes';
import {
    adminNavItems,
    platformNavItems,
    type SidebarNavItem,
} from '@/components/layout/sidebarNavConfig';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';

type NavModel =
    | { kind: 'single'; items: SidebarNavItem[] }
    | { kind: 'split'; platform: SidebarNavItem[]; academy: SidebarNavItem[] };

const Sidebar: React.FC = () => {
    const theme = useTheme();
    const isMdUp = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
    const navigate = useNavigate();
    const location = useLocation();
    const { signOut } = useAuth();
    const { isPlatformAdmin } = usePlatformAdmin();

    const handleLogout = async () => {
        await signOut();
        navigate(ROUTES.login);
    };

    const navModel = useMemo((): NavModel => {
        if (location.pathname.startsWith('/platform')) {
            return { kind: 'split', platform: platformNavItems, academy: adminNavItems };
        }
        if (isPlatformAdmin) {
            return { kind: 'split', platform: platformNavItems, academy: adminNavItems };
        }
        return { kind: 'single', items: adminNavItems };
    }, [location.pathname, isPlatformAdmin]);

    const go = (path: string) => {
        navigate(path);
    };

    const renderItem = (item: SidebarNavItem) => (
        <ListItem key={item.path} disablePadding sx={{ mb: 0.25 }}>
            <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => go(item.path)}
                sx={{
                    '& .MuiListItemIcon-root': {
                        color: location.pathname === item.path ? 'primary.main' : 'text.secondary',
                        minWidth: 44,
                    },
                }}
            >
                <ListItemIcon>
                    <item.Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                        fontWeight: location.pathname === item.path ? 600 : 500,
                        sx: { fontSize: { xs: '0.9375rem', sm: '0.95rem' } },
                    }}
                />
            </ListItemButton>
        </ListItem>
    );

    /** md 미만은 BottomNavigation만 사용 — Drawer·햄버거 제거 */
    if (!isMdUp) return null;

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: ADMIN_DRAWER_WIDTH,
                flexShrink: 0,
                [`& .MuiDrawer-paper`]: {
                    width: ADMIN_DRAWER_WIDTH,
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    borderRight: '1px solid',
                    borderColor: (t) => alpha(t.palette.primary.main, 0.1),
                    background: (t) =>
                        `linear-gradient(180deg, ${alpha(t.palette.primary.main, 0.04)} 0%, ${t.palette.background.paper} 28%)`,
                },
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    minHeight: '100vh',
                }}
            >
                <Box sx={{ px: { xs: 2.5, sm: 3 }, pt: 2.5, pb: 1.5 }}>
                    <Typography variant="h6" fontWeight={700} color="primary" letterSpacing="-0.02em">
                        PiaNote
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, lineHeight: 1.4 }}>
                        {ui.layout.sidebarTagline}
                    </Typography>
                </Box>
                <Divider sx={{ opacity: 0.85 }} />
                <List sx={{ px: 0.5, py: 1.5, flex: 1, overflow: 'auto' }}>
                    {navModel.kind === 'single' ? (
                        navModel.items.map(renderItem)
                    ) : (
                        <>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ px: 1.75, pt: 0.5, pb: 0.75, display: 'block', fontWeight: 600 }}
                            >
                                {ui.layout.sidebarSectionPlatform}
                            </Typography>
                            {navModel.platform.map(renderItem)}
                            <Divider sx={{ my: 1.25, opacity: 0.85 }} />
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ px: 1.75, pt: 0.5, pb: 0.75, display: 'block', fontWeight: 600 }}
                            >
                                {ui.layout.sidebarSectionAcademy}
                            </Typography>
                            {navModel.academy.map(renderItem)}
                        </>
                    )}
                </List>
                <Divider sx={{ opacity: 0.85 }} />
                <Box sx={{ px: 1, py: 1.25 }}>
                    <Button
                        fullWidth
                        size="small"
                        variant="text"
                        color="inherit"
                        onClick={() => {
                            void handleLogout();
                        }}
                        startIcon={<LogoutIcon sx={{ fontSize: 18 }} />}
                        aria-label={ui.layout.sidebarLogout}
                        sx={{
                            justifyContent: 'flex-start',
                            py: 0.5,
                            px: 1,
                            minHeight: MIN_TOUCH_TARGET_PX,
                            fontSize: '0.8125rem',
                            fontWeight: 500,
                            color: 'text.secondary',
                            '& .MuiButton-startIcon': { mr: 0.75, ml: 0 },
                        }}
                    >
                        {ui.layout.sidebarLogout}
                    </Button>
                </Box>
            </Box>
        </Drawer>
    );
};

export default Sidebar;
