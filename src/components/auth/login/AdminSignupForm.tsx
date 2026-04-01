import React from 'react';
import { Box, TextField, Button } from '@mui/material';
import { ui } from '@/i18n/ui';

const t = ui.auth.adminSignup;

export type AdminSignupFormState = {
    email: string;
    password: string;
    confirmPassword: string;
    name: string;
    phone: string;
    academyName: string;
};

interface AdminSignupFormProps {
    form: AdminSignupFormState;
    onChange: (next: AdminSignupFormState) => void;
    onSubmit: (e: React.FormEvent) => void;
    loading: boolean;
}

export const AdminSignupForm: React.FC<AdminSignupFormProps> = ({
    form,
    onChange,
    onSubmit,
    loading,
}) => {
    return (
        <Box component="form" onSubmit={onSubmit}>
            <TextField
                fullWidth
                label={t.academyName}
                value={form.academyName}
                onChange={(e) => onChange({ ...form, academyName: e.target.value })}
                required
                sx={{ mb: 2 }}
            />
            <TextField
                fullWidth
                label={t.directorName}
                value={form.name}
                onChange={(e) => onChange({ ...form, name: e.target.value })}
                required
                sx={{ mb: 2 }}
            />
            <TextField
                fullWidth
                label={t.phone}
                placeholder={t.phonePlaceholder}
                value={form.phone}
                onChange={(e) => onChange({ ...form, phone: e.target.value })}
                required
                inputMode="tel"
                autoComplete="tel"
                helperText={t.phoneHelper}
                sx={{ mb: 2 }}
            />
            <TextField
                fullWidth
                label={t.email}
                type="email"
                value={form.email}
                onChange={(e) => onChange({ ...form, email: e.target.value })}
                required
                sx={{ mb: 2 }}
            />
            <TextField
                fullWidth
                label={t.password}
                type="password"
                value={form.password}
                onChange={(e) => onChange({ ...form, password: e.target.value })}
                required
                helperText={t.passwordHelper}
                sx={{ mb: 2 }}
            />
            <TextField
                fullWidth
                label={t.confirmPassword}
                type="password"
                value={form.confirmPassword}
                onChange={(e) => onChange({ ...form, confirmPassword: e.target.value })}
                required
                sx={{ mb: 3 }}
            />
            <Button fullWidth type="submit" variant="contained" size="large" disabled={loading}>
                {loading ? t.submitting : t.submit}
            </Button>
        </Box>
    );
};
