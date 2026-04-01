import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { ui } from '@/i18n/ui';
import { touchButtonSx } from '@/constants/touch';
import { isStandalonePwa } from '@/utils/pwa';

const SESSION_DISMISS_KEY = 'pianote_pwa_install_prompt_dismissed';

/** Chromium `beforeinstallprompt` — DOM 타입에 없을 수 있어 최소 필드만 정의 */
type BeforeInstallPromptEventLike = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function isIosLike (): boolean {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(ua)) return true;
    return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
}

const PROMPT_DELAY_MS = 2500;

/**
 * 폰(sm 미만)에서만, 브라우저 탭이 아닐 때 세션 최초 1회 설치(홈 화면 추가) 안내
 */
export function PwaInstallPrompt () {
    const theme = useTheme();
    const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
    const { enqueueSnackbar } = useSnackbar();
    const [open, setOpen] = useState(false);
    const [iosMode, setIosMode] = useState(false);
    const deferredPromptRef = useRef<BeforeInstallPromptEventLike | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showPrompt = useCallback(() => {
        if (typeof window === 'undefined') return;
        if (isStandalonePwa()) return;
        if (sessionStorage.getItem(SESSION_DISMISS_KEY)) return;
        setOpen(true);
    }, []);

    useEffect(() => {
        if (!isPhone) return;

        const onBip = (e: Event) => {
            e.preventDefault();
            deferredPromptRef.current = e as BeforeInstallPromptEventLike;
        };
        window.addEventListener('beforeinstallprompt', onBip);

        timerRef.current = setTimeout(() => {
            showPrompt();
        }, PROMPT_DELAY_MS);

        return () => {
            window.removeEventListener('beforeinstallprompt', onBip);
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [isPhone, showPrompt]);

    const handleDismiss = () => {
        sessionStorage.setItem(SESSION_DISMISS_KEY, '1');
        setOpen(false);
        setIosMode(false);
    };

    const handleInstall = async () => {
        const ev = deferredPromptRef.current;
        if (ev) {
            try {
                await ev.prompt();
                await ev.userChoice;
            } catch {
                /* 사용자 취소 등 */
            }
            deferredPromptRef.current = null;
            sessionStorage.setItem(SESSION_DISMISS_KEY, '1');
            setOpen(false);
            setIosMode(false);
            return;
        }
        if (isIosLike()) {
            setIosMode(true);
            return;
        }
        enqueueSnackbar(ui.pwaInstall.installUnavailable, { variant: 'info' });
        sessionStorage.setItem(SESSION_DISMISS_KEY, '1');
        setOpen(false);
    };

    const handleIosClose = () => {
        sessionStorage.setItem(SESSION_DISMISS_KEY, '1');
        setOpen(false);
        setIosMode(false);
    };

    const p = ui.pwaInstall;

    return (
        <Dialog
            open={open}
            onClose={(_, reason) => {
                if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
                    handleDismiss();
                }
            }}
            aria-labelledby="pwa-install-title"
            fullWidth
            maxWidth="xs"
        >
            <DialogTitle id="pwa-install-title">{iosMode ? p.iosTitle : p.dialogTitle}</DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary">
                    {iosMode ? p.iosBody : p.dialogBody}
                </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                {iosMode ? (
                    <Button onClick={handleIosClose} variant="contained" fullWidth sx={touchButtonSx}>
                        {p.iosConfirm}
                    </Button>
                ) : (
                    <>
                        <Button onClick={handleDismiss} sx={touchButtonSx}>
                            {p.later}
                        </Button>
                        <Button onClick={() => void handleInstall()} variant="contained" sx={touchButtonSx}>
                            {p.install}
                        </Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
}
