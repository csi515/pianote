import React, { useEffect, useState } from 'react';
import {
    AppBar,
    Toolbar,
    Box,
    IconButton,
    Typography,
    Tooltip,
    Badge,
    Popover,
    Button,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePageTopBarContextOptional } from '@/contexts/PageTopBarContext';
import { ui } from '@/i18n/ui';
import { ROUTES } from '@/constants/routes';
import { MIN_TOUCH_TARGET_PX, touchIconButtonSx } from '@/constants/touch';
import { getAcademyAdminMetrics } from '@/services/academyAdminMetrics.service';
import {
    loadAdminNotificationPrefs,
    NOTIFICATION_PREFS_STORAGE_KEY,
    type AdminNotificationPrefs,
} from '@/lib/notificationPreferences';

const TopBar: React.FC = () => {
    const { profile, academy, signOut } = useAuth();
    const navigate = useNavigate();
    const theme = useTheme();
    const isBelowMd = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true });
    const pageTop = usePageTopBarContextOptional();
    const displayName = profile?.name?.trim() || ui.topBar.userFallback;
    const isAdmin = profile?.role === 'admin';
    const [overduePay, setOverduePay] = useState(0);
    const [textbookUnpaidStudents, setTextbookUnpaidStudents] = useState(0);
    const [notifPrefs, setNotifPrefs] = useState<AdminNotificationPrefs>(() => loadAdminNotificationPrefs());
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const academyId = academy?.id;

    useEffect(() => {
        const syncPrefs = () => setNotifPrefs(loadAdminNotificationPrefs());
        window.addEventListener('pianote-notification-prefs-changed', syncPrefs);
        const onStorage = (e: StorageEvent) => {
            if (e.key === NOTIFICATION_PREFS_STORAGE_KEY) syncPrefs();
        };
        window.addEventListener('storage', onStorage);
        return () => {
            window.removeEventListener('pianote-notification-prefs-changed', syncPrefs);
            window.removeEventListener('storage', onStorage);
        };
    }, []);

    useEffect(() => {
        if (!isAdmin || !academyId) {
            setOverduePay(0);
            setTextbookUnpaidStudents(0);
            return;
        }
        let cancelled = false;
        void getAcademyAdminMetrics(academyId).then((m) => {
            if (!cancelled) {
                setOverduePay(m.overduePaymentsCount);
                setTextbookUnpaidStudents(m.unpaidTextbookStudentsCount);
            }
        });
        return () => {
            cancelled = true;
        };
    }, [isAdmin, academyId]);

    const badgePay = notifPrefs.paymentsOverdue ? overduePay : 0;
    const badgeTextbook = notifPrefs.textbookFeesUnpaid ? textbookUnpaidStudents : 0;
    const badgeTotal = badgePay + badgeTextbook;

    const open = Boolean(anchorEl);

    const pageTitle = pageTop?.title ?? null;

    const handleLogout = async () => {
        await signOut();
        navigate(ROUTES.login);
    };

    return (
        <AppBar
            position="sticky"
            elevation={0}
            sx={{
                bgcolor: 'background.paper',
                borderBottom: 1,
                borderColor: 'divider',
                boxShadow: '0 2px 12px rgba(74, 107, 138, 0.06)',
                pt: 'env(safe-area-inset-top, 0px)',
            }}
        >
            <Toolbar
                sx={{
                    gap: { xs: 0.5, sm: 1.5 },
                    minHeight: { xs: 56, sm: 58, md: 64 },
                    py: 0.5,
                    px: { xs: 2, sm: 2, md: 2.5 },
                    flexWrap: 'nowrap',
                }}
            >
                <Box
                    flexGrow={1}
                    minWidth={0}
                    sx={{
                        overflow: 'hidden',
                        pl: { xs: 0.5, sm: 0 },
                    }}
                >
                    {pageTitle ? (
                        <>
                            <Typography
                                variant="subtitle1"
                                component="h1"
                                noWrap
                                color="text.primary"
                                fontWeight={600}
                                sx={{
                                    lineHeight: 1.3,
                                    fontSize: { xs: '0.95rem', sm: '1rem', md: '1.0625rem' },
                                }}
                            >
                                {pageTitle}
                            </Typography>
                            {academy ? (
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    noWrap
                                    sx={{
                                        display: { xs: 'none', sm: 'block' },
                                    }}
                                >
                                    {academy.name} · {displayName}
                                </Typography>
                            ) : (
                                <Tooltip title={profile?.email ?? ''}>
                                    <Typography variant="body2" color="text.secondary" noWrap>
                                        {displayName}
                                    </Typography>
                                </Tooltip>
                            )}
                        </>
                    ) : (
                        <>
                            {academy && (
                                <Typography
                                    variant="h6"
                                    noWrap
                                    color="text.primary"
                                    fontWeight={600}
                                    sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                                >
                                    {academy.name}
                                </Typography>
                            )}
                            <Tooltip title={profile?.email ?? ''}>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    noWrap
                                    sx={{ display: { xs: 'none', sm: 'block' } }}
                                >
                                    {displayName}
                                </Typography>
                            </Tooltip>
                        </>
                    )}
                </Box>
                <IconButton
                    color="default"
                    aria-label={ui.topBar.notifications}
                    sx={{ minWidth: MIN_TOUCH_TARGET_PX, minHeight: MIN_TOUCH_TARGET_PX, flexShrink: 0 }}
                    onClick={(e) => {
                        if (isAdmin) setAnchorEl(e.currentTarget);
                    }}
                >
                    <Badge
                        color="error"
                        badgeContent={badgeTotal}
                        max={99}
                        invisible={!isAdmin || badgeTotal === 0}
                    >
                        <NotificationsIcon />
                    </Badge>
                </IconButton>
                {isBelowMd ? (
                    <Tooltip title={ui.layout.sidebarLogout}>
                        <IconButton
                            type="button"
                            color="inherit"
                            aria-label={ui.layout.sidebarLogout}
                            onClick={() => void handleLogout()}
                            sx={{ ...touchIconButtonSx, flexShrink: 0, color: 'text.secondary' }}
                        >
                            <LogoutIcon />
                        </IconButton>
                    </Tooltip>
                ) : null}
                {isAdmin && (
                    <Popover
                        open={open}
                        anchorEl={anchorEl}
                        onClose={() => setAnchorEl(null)}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    >
                        <Box sx={{ p: 2, maxWidth: { xs: 300, sm: 360 } }}>
                            {badgeTotal > 0 ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {notifPrefs.paymentsOverdue && overduePay > 0 ? (
                                        <Box>
                                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                {ui.topBar.pendingOverduePrefix} {overduePay}
                                                {ui.topBar.pendingOverdueUnit}
                                            </Typography>
                                            <Button
                                                fullWidth
                                                variant="contained"
                                                size="small"
                                                onClick={() => {
                                                    setAnchorEl(null);
                                                    navigate(ROUTES.admin.payments);
                                                }}
                                            >
                                                {ui.topBar.goPayments}
                                            </Button>
                                        </Box>
                                    ) : null}
                                    {notifPrefs.textbookFeesUnpaid && textbookUnpaidStudents > 0 ? (
                                        <Box>
                                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                {ui.topBar.textbookFeeUnpaidPrefix} {textbookUnpaidStudents}
                                                {ui.topBar.textbookFeeUnpaidUnit}
                                            </Typography>
                                            <Button
                                                fullWidth
                                                variant="contained"
                                                size="small"
                                                onClick={() => {
                                                    setAnchorEl(null);
                                                    navigate(ROUTES.admin.students);
                                                }}
                                            >
                                                {ui.topBar.goStudents}
                                            </Button>
                                        </Box>
                                    ) : null}
                                </Box>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    {ui.topBar.noNotifications}
                                </Typography>
                            )}
                        </Box>
                    </Popover>
                )}
            </Toolbar>
        </AppBar>
    );
};

export default TopBar;
