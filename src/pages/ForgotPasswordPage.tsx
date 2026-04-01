import React, { useEffect, useState, useRef } from 'react';
import { Box, Container, Typography, Paper, TextField, Button, Alert, Link } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/constants/routes';
import { ui } from '@/i18n/ui';
import { MIN_TOUCH_TARGET_PX } from '@/constants/touch';

const t = ui.auth.passwordReset;

const ForgotPasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const { requestPasswordReset, loading: authLoading, session, profile } = useAuth();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const lockRef = useRef(false);

    useEffect(() => {
        if (authLoading) return;
        if (session && profile?.role === 'admin') {
            navigate(ROUTES.admin.dashboard, { replace: true });
        }
    }, [authLoading, session, profile?.role, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (lockRef.current) return;
        const trimmed = email.trim().toLowerCase();
        if (!trimmed) {
            setError(t.emailRequired);
            return;
        }
        lockRef.current = true;
        setError('');
        setLoading(true);
        try {
            const { error: err } = await requestPasswordReset(trimmed);
            if (err) {
                setError(err.message);
                return;
            }
            setSent(true);
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
                        {t.forgotTitle}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {t.forgotSubtitle}
                    </Typography>

                    {error ? (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    ) : null}
                    {sent ? (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            {t.sentHint}
                        </Alert>
                    ) : null}

                    {!sent ? (
                        <Box component="form" onSubmit={(e) => void handleSubmit(e)} noValidate>
                            <TextField
                                fullWidth
                                type="email"
                                label={t.emailLabel}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
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
                                {loading ? t.sending : t.sendLink}
                            </Button>
                        </Box>
                    ) : null}

                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <Link component={RouterLink} to={ROUTES.login} variant="body2" sx={{ minHeight: MIN_TOUCH_TARGET_PX, display: 'inline-flex', alignItems: 'center' }}>
                            {t.backToLogin}
                        </Link>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default ForgotPasswordPage;
