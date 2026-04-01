import React, { useEffect, useState, useRef } from 'react';
import { Box, Container, Typography, Paper, TextField, Button, Alert, Link } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { mapPasswordUpdateError } from '@/lib/mapAuthError';
import { ROUTES } from '@/constants/routes';
import { ui } from '@/i18n/ui';
import { MIN_TOUCH_TARGET_PX } from '@/constants/touch';

const t = ui.auth.passwordReset;
const signup = ui.auth.adminSignup;

const ResetPasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [checking, setChecking] = useState(true);
    const [canReset, setCanReset] = useState(false);
    const [loading, setLoading] = useState(false);
    const lockRef = useRef(false);

    useEffect(() => {
        let cancelled = false;

        void supabase.auth.getSession().then(({ data: { session } }) => {
            if (cancelled) return;
            if (session) {
                setCanReset(true);
            }
            setChecking(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (cancelled) return;
            if (event === 'PASSWORD_RECOVERY' || session) {
                setCanReset(true);
            }
            setChecking(false);
        });

        const tmr = window.setTimeout(() => {
            if (cancelled) return;
            setChecking(false);
        }, 4000);

        return () => {
            cancelled = true;
            window.clearTimeout(tmr);
            subscription.unsubscribe();
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (lockRef.current) return;
        setError('');
        if (newPassword !== confirmPassword) {
            setError(signup.passwordMismatch);
            return;
        }
        if (newPassword.length < 6) {
            setError(signup.passwordTooShort);
            return;
        }
        lockRef.current = true;
        setLoading(true);
        try {
            const { error: upErr } = await supabase.auth.updateUser({ password: newPassword });
            if (upErr) {
                setError(mapPasswordUpdateError(upErr).message);
                return;
            }
            setSuccess(true);
            await supabase.auth.signOut();
            window.setTimeout(() => {
                navigate(ROUTES.login, { replace: true });
            }, 1500);
        } finally {
            setLoading(false);
            lockRef.current = false;
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100dvh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                px: 2,
                py: 3,
            }}
        >
            <Container maxWidth="sm">
                <Paper sx={{ p: { xs: 3, sm: 4 }, borderRadius: 2 }}>
                    <Typography variant="h5" component="h1" gutterBottom>
                        {t.resetTitle}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {t.resetSubtitle}
                    </Typography>

                    {checking ? (
                        <Typography variant="body2" color="text.secondary" role="status">
                            {ui.common.loading}
                        </Typography>
                    ) : null}

                    {!checking && !canReset ? (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {t.invalidSession}
                        </Alert>
                    ) : null}

                    {!checking && canReset && !success ? (
                        <>
                            {error ? (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    {error}
                                </Alert>
                            ) : null}
                            <Box component="form" onSubmit={(e) => void handleSubmit(e)} noValidate>
                                <TextField
                                    fullWidth
                                    type="password"
                                    label={t.newPasswordLabel}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    autoComplete="new-password"
                                    required
                                    sx={{ mb: 2 }}
                                />
                                <TextField
                                    fullWidth
                                    type="password"
                                    label={t.confirmPasswordLabel}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    autoComplete="new-password"
                                    required
                                    sx={{ mb: 2 }}
                                />
                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    disabled={loading}
                                    sx={{ minHeight: MIN_TOUCH_TARGET_PX }}
                                >
                                    {loading ? t.saving : t.saveNewPassword}
                                </Button>
                            </Box>
                        </>
                    ) : null}

                    {success ? (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            {t.success}
                        </Alert>
                    ) : null}

                    {!checking && !canReset ? (
                        <Box sx={{ mt: 2, textAlign: 'center' }}>
                            <Link component={RouterLink} to={ROUTES.login} variant="body2">
                                {t.backToLogin}
                            </Link>
                        </Box>
                    ) : null}
                </Paper>
            </Container>
        </Box>
    );
};

export default ResetPasswordPage;
