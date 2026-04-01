import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Button,
    Paper,
    Tabs,
    Tab,
    Alert,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { TabPanel } from '@/components/auth/TabPanel';
import { useAuthRedirectOnLogin } from '@/hooks/useAuthRedirectOnLogin';
import { LoginForm } from '@/components/auth/login/LoginForm';
import { AdminSignupForm } from '@/components/auth/login/AdminSignupForm';
import { ROUTES } from '@/constants/routes';
import { AUTH_NOTICE_PROFILE_MISSING, AUTH_SESSION_NOTICE_KEY } from '@/lib/authSessionNotice';
import { ui } from '@/i18n/ui';

const Login: React.FC = () => {
    const [tabValue, setTabValue] = useState(0);
    const [error, setError] = useState('');
    const [sessionNotice, setSessionNotice] = useState('');
    const [loading, setLoading] = useState(false);
    const submitLockRef = useRef(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { signIn, signUp, loading: authLoading } = useAuth();

    useAuthRedirectOnLogin();

    useEffect(() => {
        const v = sessionStorage.getItem(AUTH_SESSION_NOTICE_KEY);
        if (v === AUTH_NOTICE_PROFILE_MISSING) {
            sessionStorage.removeItem(AUTH_SESSION_NOTICE_KEY);
            setSessionNotice(ui.auth.profileMissingSignedOut);
        }
    }, []);

    const authInfoMessage =
        (location.state as { authMessageKey?: 'loginAdminOnly' } | null)?.authMessageKey ===
        'loginAdminOnly'
            ? ui.auth.loginAdminOnly
            : null;

    const [loginForm, setLoginForm] = useState({
        email: '',
        password: '',
    });

    const [signupForm, setSignupForm] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        phone: '',
        academyName: '',
    });

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
        setError('');
        setSessionNotice('');
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitLockRef.current) return;
        submitLockRef.current = true;
        setError('');
        setLoading(true);
        try {
            const email = loginForm.email.trim().toLowerCase();
            const { error: err } = await signIn(email, loginForm.password);
            if (err) setError(err.message);
        } catch {
            setError(ui.auth.loginGenericError);
        } finally {
            setLoading(false);
            submitLockRef.current = false;
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitLockRef.current) return;
        setError('');
        if (signupForm.password !== signupForm.confirmPassword) {
            setError(ui.auth.adminSignup.passwordMismatch);
            return;
        }
        if (signupForm.password.length < 6) {
            setError(ui.auth.adminSignup.passwordTooShort);
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
            if (err) setError(err.message);
        } catch {
            setError(ui.auth.adminSignup.signupErrorGeneric);
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
                    <Box textAlign="center" mb={3}>
                        <Typography
                            variant="h3"
                            fontWeight="bold"
                            color="primary"
                            gutterBottom
                            sx={{ fontSize: { xs: '1.75rem', sm: '3rem' } }}
                        >
                            {ui.auth.loginScreen.brandTitle}
                        </Typography>
                    </Box>

                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        variant="scrollable"
                        scrollButtons="auto"
                        allowScrollButtonsMobile
                        sx={{ borderBottom: 1, borderColor: 'divider' }}
                    >
                        <Tab label={ui.auth.loginScreen.tabLogin} />
                        <Tab label={ui.auth.loginScreen.tabSignup} />
                    </Tabs>

                    {sessionNotice && (
                        <Alert severity="warning" sx={{ mt: 2 }} role="status">
                            {sessionNotice}
                        </Alert>
                    )}
                    {authInfoMessage && (
                        <Alert severity="info" sx={{ mt: 2 }} role="status">
                            {authInfoMessage}
                        </Alert>
                    )}
                    {error && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <TabPanel value={tabValue} index={0}>
                        <LoginForm
                            form={loginForm}
                            onChange={setLoginForm}
                            onSubmit={handleLogin}
                            loading={loading || authLoading}
                        />
                    </TabPanel>

                    <TabPanel value={tabValue} index={1}>
                        <AdminSignupForm
                            form={signupForm}
                            onChange={setSignupForm}
                            onSubmit={handleSignup}
                            loading={loading || authLoading}
                        />
                    </TabPanel>

                    <Box textAlign="center" mt={3}>
                        <Button
                            variant="text"
                            onClick={() => navigate(ROUTES.signupAdmin)}
                            sx={{ textTransform: 'none' }}
                        >
                            {ui.auth.adminSignup.title} →
                        </Button>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default Login;
