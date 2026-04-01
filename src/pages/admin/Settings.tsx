import React, { useMemo, useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    FormGroup,
    FormControlLabel,
    Switch,
    Container,
    TextField,
    Button,
    Alert,
    Tabs,
    Tab,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { ROUTES } from '@/constants/routes';
import { usePageTopBar } from '@/contexts/PageTopBarContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
    loadAdminNotificationPrefs,
    saveAdminNotificationPrefs,
    type AdminNotificationPrefs,
} from '@/lib/notificationPreferences';
import { ui } from '@/i18n/ui';
import { FALLBACK_MONTHLY_FEE_AMOUNT } from '@/services/payments.service';
import { MIN_TOUCH_TARGET_PX } from '@/constants/touch';
import { SettingsPasswordTab } from '@/pages/admin/SettingsPasswordTab';

const s = ui.adminSettings;
const m = ui.adminMyPage;

function tabPanelProps (index: number) {
    return {
        id: `settings-tabpanel-${index}`,
        'aria-labelledby': `settings-tab-${index}`,
        role: 'tabpanel' as const,
    };
}

const Settings: React.FC = () => {
    usePageTopBar({ title: s.pageTitle, backTo: ROUTES.admin.dashboard });
    const { user, profile, academy, refreshUserProfile } = useAuth();
    const [tab, setTab] = useState(0);
    const [notifPrefs, setNotifPrefs] = useState<AdminNotificationPrefs>(() => loadAdminNotificationPrefs());
    const [defaultMonthlyFee, setDefaultMonthlyFee] = useState('');
    const [academyName, setAcademyName] = useState('');
    const [directorName, setDirectorName] = useState('');
    const [savingProfile, setSavingProfile] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const formatMoneyInput = (raw: string): string => {
        const digits = raw.replace(/[^\d]/g, '');
        if (!digits) return '';
        const n = Number(digits);
        if (!Number.isFinite(n)) return '';
        return n.toLocaleString('ko-KR');
    };

    const parsedDefaultMonthlyFee = useMemo(() => {
        const t = defaultMonthlyFee.replaceAll(',', '').trim();
        if (!t) return null;
        const n = Number(t);
        if (!Number.isFinite(n) || n < 0) return null;
        return Math.round(n);
    }, [defaultMonthlyFee]);

    useEffect(() => {
        setNotifPrefs(loadAdminNotificationPrefs());
    }, []);

    useEffect(() => {
        if (!academy) return;
        const v = academy.default_monthly_fee;
        setDefaultMonthlyFee(v != null ? v.toLocaleString('ko-KR') : '');
    }, [academy]);

    useEffect(() => {
        if (academy) setAcademyName(academy.name);
        if (profile) setDirectorName(profile.name ?? '');
    }, [academy?.id, academy?.name, profile?.id, profile?.name]);

    const patchNotif = (key: keyof AdminNotificationPrefs, checked: boolean) => {
        setNotifPrefs((prev) => {
            const next = { ...prev, [key]: checked };
            saveAdminNotificationPrefs(next);
            return next;
        });
    };

    const handleSaveProfile = async () => {
        const trimmedAcademy = academyName.trim();
        const trimmedDirector = directorName.trim();
        if (!trimmedAcademy) {
            setMessage({ type: 'error', text: s.errNameRequired });
            return;
        }
        if (!trimmedDirector) {
            setMessage({ type: 'error', text: m.errDirectorRequired });
            return;
        }
        const userId = profile?.id ?? user?.id;
        if (!academy || !userId) {
            setMessage({ type: 'error', text: s.errLoadAcademy });
            return;
        }

        setSavingProfile(true);
        setMessage(null);
        try {
            (document.activeElement as HTMLElement | null)?.blur();

            const { data: academyRows, error: academyErr } = await supabase
                .from('academies')
                .update({ name: trimmedAcademy })
                .eq('id', academy.id)
                .select('id');
            if (academyErr) throw academyErr;
            if (!academyRows?.length) {
                throw new Error('academy_update_zero_rows');
            }

            const { data: userRows, error: userErr } = await supabase
                .from('users')
                .update({ name: trimmedDirector })
                .eq('id', userId)
                .select('id');
            if (userErr) throw userErr;
            if (!userRows?.length) {
                throw new Error('user_update_zero_rows');
            }

            await refreshUserProfile();
            setMessage({ type: 'success', text: m.msgSaved });
        } catch (e) {
            console.error(e);
            const raw =
                e instanceof Error
                    ? e.message
                    : typeof e === 'object' && e !== null && 'message' in e
                      ? String((e as { message: unknown }).message)
                      : '';
            if (raw === 'academy_update_zero_rows' || raw === 'user_update_zero_rows') {
                setMessage({ type: 'error', text: m.errSaveNoRows });
            } else {
                setMessage({
                    type: 'error',
                    text: raw ? `${m.errSaveFailed} (${raw})` : m.errSaveFailed,
                });
            }
        } finally {
            setSavingProfile(false);
        }
    };

    const saveAcademyDefaults = async () => {
        if (!academy) return;
        if (parsedDefaultMonthlyFee === null && defaultMonthlyFee.trim() !== '') {
            setMessage({ type: 'error', text: s.defaultMonthlyFeeInvalid });
            return;
        }
        setSaving(true);
        setMessage(null);
        try {
            const { error } = await supabase
                .from('academies')
                .update({ default_monthly_fee: parsedDefaultMonthlyFee })
                .eq('id', academy.id);
            if (error) throw error;
            await refreshUserProfile();
            setMessage({ type: 'success', text: s.defaultMonthlyFeeSaved });
        } catch (e) {
            console.error(e);
            setMessage({ type: 'error', text: s.defaultMonthlyFeeSaveFailed });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Container maxWidth="md" sx={{ py: { xs: 3, sm: 4 } }}>
            <Paper sx={{ p: 4, borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {s.settingsHint}
                </Typography>

                {message ? (
                    <Alert severity={message.type} sx={{ mb: 3 }}>
                        {message.text}
                    </Alert>
                ) : null}

                <Tabs
                    value={tab}
                    onChange={(_, v) => setTab(v)}
                    variant="scrollable"
                    scrollButtons="auto"
                    aria-label={s.tabsAriaLabel}
                    allowScrollButtonsMobile
                    sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        mb: 2,
                        minHeight: MIN_TOUCH_TARGET_PX,
                        '& .MuiTabScrollButton-root': {
                            minWidth: MIN_TOUCH_TARGET_PX,
                            minHeight: MIN_TOUCH_TARGET_PX,
                        },
                    }}
                >
                    <Tab
                        label={m.sectionTitle}
                        id="settings-tab-0"
                        aria-controls="settings-tabpanel-0"
                        sx={{ minHeight: MIN_TOUCH_TARGET_PX }}
                    />
                    <Tab
                        label={s.billingDefaultsSection}
                        id="settings-tab-1"
                        aria-controls="settings-tabpanel-1"
                        sx={{ minHeight: MIN_TOUCH_TARGET_PX }}
                    />
                    <Tab
                        label={s.notificationSection}
                        id="settings-tab-2"
                        aria-controls="settings-tabpanel-2"
                        sx={{ minHeight: MIN_TOUCH_TARGET_PX }}
                    />
                    <Tab
                        label={s.passwordTab}
                        id="settings-tab-3"
                        aria-controls="settings-tabpanel-3"
                        sx={{ minHeight: MIN_TOUCH_TARGET_PX }}
                    />
                </Tabs>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }} {...tabPanelProps(0)} hidden={tab !== 0}>
                    {tab === 0 ? (
                        <>
                            <Typography variant="body2" color="text.secondary">
                                {s.profileSectionHint}
                            </Typography>
                            <Box component="form" noValidate autoComplete="off" onSubmit={(e) => e.preventDefault()}>
                                <TextField
                                    fullWidth
                                    label={s.academyNameLabel}
                                    variant="outlined"
                                    value={academyName}
                                    onChange={(e) => setAcademyName(e.target.value)}
                                    sx={{ mb: 3 }}
                                    helperText={s.academyNameHelper}
                                />
                                <TextField
                                    fullWidth
                                    label={m.directorNameLabel}
                                    variant="outlined"
                                    value={directorName}
                                    onChange={(e) => setDirectorName(e.target.value)}
                                    sx={{ mb: 3 }}
                                    helperText={m.directorNameHelper}
                                />
                                <TextField
                                    fullWidth
                                    label={m.emailLabel}
                                    variant="outlined"
                                    value={user?.email ?? profile?.email ?? ''}
                                    sx={{ mb: 3 }}
                                    helperText={m.emailHelper}
                                    disabled
                                />
                                <Button
                                    variant="contained"
                                    size="large"
                                    startIcon={<SaveIcon />}
                                    onClick={() => void handleSaveProfile()}
                                    disabled={savingProfile}
                                >
                                    {savingProfile ? s.saveButtonLoading : s.saveButton}
                                </Button>
                            </Box>
                        </>
                    ) : null}
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }} {...tabPanelProps(1)} hidden={tab !== 1}>
                    {tab === 1 ? (
                        <>
                            <Typography variant="body2" color="text.secondary">
                                {s.defaultMonthlyFeeHint}
                            </Typography>
                            {academy?.default_monthly_fee != null ? (
                                <Typography variant="body1" fontWeight={600}>
                                    {s.defaultMonthlyFeeCurrentLine.replace(
                                        '{amount}',
                                        academy.default_monthly_fee.toLocaleString('ko-KR')
                                    )}
                                </Typography>
                            ) : (
                                <Box>
                                    <Typography variant="body1" fontWeight={600} sx={{ mb: 0.5 }}>
                                        {s.defaultMonthlyFeeNotSavedLine}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {s.defaultMonthlyFeeSystemFallbackNote.replace(
                                            '{amount}',
                                            FALLBACK_MONTHLY_FEE_AMOUNT.toLocaleString('ko-KR')
                                        )}
                                    </Typography>
                                </Box>
                            )}
                            <TextField
                                fullWidth
                                label={s.defaultMonthlyFeeLabel}
                                value={defaultMonthlyFee}
                                onChange={(e) => setDefaultMonthlyFee(formatMoneyInput(e.target.value))}
                                helperText={s.defaultMonthlyFeeHelper}
                                inputProps={{ inputMode: 'numeric' }}
                            />
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                                <Button
                                    variant="contained"
                                    onClick={() => void saveAcademyDefaults()}
                                    disabled={saving || !academy}
                                >
                                    {saving ? ui.common.saving : ui.common.save}
                                </Button>
                            </Box>
                        </>
                    ) : null}
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }} {...tabPanelProps(2)} hidden={tab !== 2}>
                    {tab === 2 ? (
                        <>
                            <Typography variant="body2" color="text.secondary">
                                {s.notificationHint}
                            </Typography>
                            <FormGroup>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={notifPrefs.paymentsOverdue}
                                            onChange={(_, v) => patchNotif('paymentsOverdue', v)}
                                            color="primary"
                                        />
                                    }
                                    label={s.notifyPaymentDueAlerts}
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={notifPrefs.textbookFeesUnpaid}
                                            onChange={(_, v) => patchNotif('textbookFeesUnpaid', v)}
                                            color="primary"
                                        />
                                    }
                                    label={s.notifyTextbookFeeUnpaidAlerts}
                                />
                            </FormGroup>
                        </>
                    ) : null}
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }} {...tabPanelProps(3)} hidden={tab !== 3}>
                    {tab === 3 ? <SettingsPasswordTab /> : null}
                </Box>
            </Paper>
        </Container>
    );
};

export default Settings;
