import React, { useState, useRef } from 'react';
import { Box, Container, Typography, Button, Paper, Alert, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthRedirectOnLogin } from '@/hooks/useAuthRedirectOnLogin';
import { AdminSignupForm } from '@/components/auth/login/AdminSignupForm';
import { ROUTES } from '@/constants/routes';
import { ui } from '@/i18n/ui';

const labels = ui.auth.adminSignup;

/**
 * 임시: 관리자 전용 회원가입 — signUpAdmin(auth metadata signup_role=admin) → DB 트리거로 학원·admin 프로필 생성
 */
const AdminSignupPage: React.FC = () => {
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const submitLockRef = useRef(false);
    const navigate = useNavigate();
    const { signUp, loading: authLoading } = useAuth();

    useAuthRedirectOnLogin();

    const [signupForm, setSignupForm] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        phone: '',
        academyName: '',
    });

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitLockRef.current) return;
        setError('');
        setSuccess(false);
        if (signupForm.password !== signupForm.confirmPassword) {
            setError(labels.passwordMismatch);
            return;
        }
        if (signupForm.password.length < 6) {
            setError(labels.passwordTooShort);
            return;
        }
        submitLockRef.current = true;
        setLoading(true);
        try {
            const { error: err } = await signUp(
                signupForm.email.trim().toLowerCase(),
                signupForm.password,
                signupForm.name.trim(),
                signupForm.phone,
                signupForm.academyName.trim()
            );
            if (err) {
                setError(err.message);
                return;
            }
            setSuccess(true);
        } catch {
            setError(labels.signupErrorGeneric);
        } finally {
            setLoading(false);
            submitLockRef.current = false;
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100dvh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.default',
                py: { xs: 2, sm: 4 },
                px: { xs: 1, sm: 2 },
            }}
        >
            <Container maxWidth="sm">
                <Paper elevation={3} sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: { xs: 2, sm: 3 } }}>
                    <Box textAlign="center" mb={2}>
                        <Typography
                            variant="h3"
                            fontWeight="bold"
                            color="primary"
                            gutterBottom
                            sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}
                        >
                            {labels.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {labels.subtitle}
                        </Typography>
                    </Box>

                    {success && (
                        <Alert severity="success" sx={{ mb: 2 }} role="status">
                            {labels.signupSuccess}
                        </Alert>
                    )}
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {!success ? (
                        <AdminSignupForm
                            form={signupForm}
                            onChange={setSignupForm}
                            onSubmit={handleSignup}
                            loading={loading || authLoading}
                        />
                    ) : (
                        <Box textAlign="center">
                            <Button
                                variant="contained"
                                fullWidth
                                size="large"
                                onClick={() => navigate(ROUTES.login, { replace: true })}
                            >
                                {labels.goToLogin}
                            </Button>
                        </Box>
                    )}

                    {!success ? (
                        <Box textAlign="center" mt={3}>
                            <Link
                                component="button"
                                type="button"
                                variant="body2"
                                onClick={() => navigate(ROUTES.login)}
                                sx={{ cursor: 'pointer' }}
                            >
                                {labels.goToLogin}
                            </Link>
                        </Box>
                    ) : null}
                </Paper>
            </Container>
        </Box>
    );
};

export default AdminSignupPage;
