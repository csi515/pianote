import React, { useId } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import type { Breakpoint } from '@mui/material/styles';
import { touchButtonSx } from '@/constants/touch';
import { ui } from '@/i18n/ui';

export type FormDialogProps = {
    open: boolean;
    onClose: () => void;
    title: React.ReactNode;
    children: React.ReactNode;
    /** 저장·등록 등 주요 액션 (없으면 primary 버튼 미표시) */
    onPrimary?: () => void | Promise<void>;
    primaryLabel?: string;
    primaryDisabled?: boolean;
    primaryLoading?: boolean;
    cancelLabel?: string;
    maxWidth?: Breakpoint | false;
    fullWidth?: boolean;
    /** DialogContent에 기본 gap·pt 적용 */
    contentSx?: object;
};

/**
 * 관리자 폼 모달 공통 껍데기 — DialogTitle / Content / Actions(취소·주 버튼) 정렬
 */
const FormDialog: React.FC<FormDialogProps> = ({
    open,
    onClose,
    title,
    children,
    onPrimary,
    primaryLabel = ui.common.save,
    primaryDisabled = false,
    primaryLoading = false,
    cancelLabel = ui.common.cancel,
    maxWidth = 'sm',
    fullWidth = true,
    contentSx,
}) => {
    const titleId = useId();
    const handlePrimary = () => {
        if (onPrimary) void onPrimary();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth={fullWidth}
            maxWidth={maxWidth}
            scroll="paper"
            aria-labelledby={titleId}
        >
            <DialogTitle component="h2" id={titleId}>
                {title}
            </DialogTitle>
            <DialogContent
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    pt: 1,
                    ...(contentSx ?? {}),
                }}
            >
                {children}
            </DialogContent>
            <DialogActions sx={{ gap: 1, flexWrap: 'wrap' }}>
                <Button onClick={onClose} sx={touchButtonSx} disabled={primaryLoading}>
                    {cancelLabel}
                </Button>
                {onPrimary ? (
                    <Button
                        variant="contained"
                        onClick={handlePrimary}
                        sx={touchButtonSx}
                        disabled={primaryDisabled || primaryLoading}
                    >
                        {primaryLoading ? ui.common.saving : primaryLabel}
                    </Button>
                ) : null}
            </DialogActions>
        </Dialog>
    );
};

export default FormDialog;
