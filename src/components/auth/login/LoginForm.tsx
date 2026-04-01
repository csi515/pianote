import React from 'react';
import { Box, TextField, Button, Link, Checkbox, FormControlLabel } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { ui } from '@/i18n/ui';

const t = ui.auth.loginScreen;

export type LoginFormState = {
    email: string;
    password: string;
    /** true: localStorage 세션(브라우저 재실행 후에도 유지). false: sessionStorage(탭 단위) */
    rememberMe: boolean;
};

interface LoginFormProps {
    form: LoginFormState;
    onChange: (next: LoginFormState) => void;
    onSubmit: (e: React.FormEvent) => void;
    loading: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({
    form,
    onChange,
    onSubmit,
    loading,
}) => {
    return (
        <Box component="form" onSubmit={onSubmit}>
            <TextField
                fullWidth
                label={t.emailLabel}
                type="email"
                value={form.email}
                onChange={(e) => onChange({ ...form, email: e.target.value })}
                required
                autoComplete="email"
                sx={{ mb: 2 }}
            />
            <TextField
                fullWidth
                label={t.passwordLabel}
                type="password"
                value={form.password}
                onChange={(e) => onChange({ ...form, password: e.target.value })}
                required
                autoComplete="current-password"
                sx={{ mb: 1 }}
            />
            <FormControlLabel
                control={
                    <Checkbox
                        checked={form.rememberMe}
                        onChange={(_, checked) => onChange({ ...form, rememberMe: checked })}
                        color="primary"
                    />
                }
                label={t.rememberMeLabel}
                sx={{ mb: 1, alignItems: 'flex-start', ml: -0.5 }}
            />
            <Box sx={{ mb: 2, textAlign: 'right' }}>
                <Link
                    component={RouterLink}
                    to={ROUTES.auth.forgotPassword}
                    variant="body2"
                    underline="hover"
                >
                    {t.forgotPasswordLink}
                </Link>
            </Box>
            <Button fullWidth type="submit" variant="contained" size="large" disabled={loading}>
                {loading ? t.submitting : t.submit}
            </Button>
        </Box>
    );
};
