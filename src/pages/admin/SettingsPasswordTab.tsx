import { useState, useRef } from 'react';
import { Box, Typography, TextField, Button, Alert } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { isDevAuthBypass } from '@/lib/devAuth';
import { ui } from '@/i18n/ui';
import { MIN_TOUCH_TARGET_PX } from '@/constants/touch';

const s = ui.adminSettings;
const p = ui.auth.passwordChange;
const signup = ui.auth.adminSignup;

export function SettingsPasswordTab () {
    const { changePassword, session } = useAuth();
    const devNoSession = isDevAuthBypass() && !session;
    const [current, setCurrent] = useState('');
    const [newPwd, setNewPwd] = useState('');
    const [confirm, setConfirm] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [saving, setSaving] = useState(false);
    const lockRef = useRef(false);

    const handleSubmit = async () => {
        if (devNoSession) return;
        if (lockRef.current) return;
        if (newPwd !== confirm) {
            setMessage({ type: 'error', text: signup.passwordMismatch });
            return;
        }
        if (newPwd.length < 6) {
            setMessage({ type: 'error', text: signup.passwordTooShort });
            return;
        }
        lockRef.current = true;
        setSaving(true);
        setMessage(null);
        try {
            const { error } = await changePassword(current, newPwd);
            if (error) {
                setMessage({ type: 'error', text: error.message });
                return;
            }
            setCurrent('');
            setNewPwd('');
            setConfirm('');
            setMessage({ type: 'success', text: p.success });
        } finally {
            setSaving(false);
            lockRef.current = false;
        }
    };

    return (
        <>
            <Typography variant="body2" color="text.secondary">
                {s.passwordTabHint}
            </Typography>
            {devNoSession ? (
                <Alert severity="info">{p.devBypassUnavailable}</Alert>
            ) : null}
            {message ? (
                <Alert severity={message.type}>{message.text}</Alert>
            ) : null}
            <Box
                component="form"
                noValidate
                autoComplete="off"
                onSubmit={(e) => {
                    e.preventDefault();
                    void handleSubmit();
                }}
            >
                <TextField
                    fullWidth
                    type="password"
                    label={p.currentLabel}
                    value={current}
                    onChange={(e) => setCurrent(e.target.value)}
                    autoComplete="current-password"
                    sx={{ mb: 2 }}
                    disabled={devNoSession}
                />
                <TextField
                    fullWidth
                    type="password"
                    label={p.newLabel}
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    autoComplete="new-password"
                    sx={{ mb: 2 }}
                    disabled={devNoSession}
                />
                <TextField
                    fullWidth
                    type="password"
                    label={p.confirmLabel}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    sx={{ mb: 2 }}
                    disabled={devNoSession}
                />
                <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={saving || devNoSession}
                    sx={{ minHeight: MIN_TOUCH_TARGET_PX }}
                >
                    {saving ? p.submitting : p.submit}
                </Button>
            </Box>
        </>
    );
}
