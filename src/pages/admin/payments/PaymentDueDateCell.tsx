import { useEffect, useState } from 'react';
import {
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    TextField,
    Typography,
} from '@mui/material';
import {
    isoDateRangeForBillingMonthStart,
    type PaymentWithStudent,
} from '@/services/payments.service';
import { ui } from '@/i18n/ui';
import { touchButtonSx } from '@/constants/touch';

const p = ui.adminPayments;

export type PaymentDueDateCellProps = {
    row: PaymentWithStudent;
    disabled: boolean;
    onDueDateCommit: (
        row: PaymentWithStudent,
        isoDate: string,
        applyMonthlyDueDay: boolean
    ) => void | Promise<void>;
};

/**
 * 청구 월(`billing_month`) 안에서만 납부 예정일을 바꿀 수 있게 min/max 제한.
 * 변경 시 확인 다이얼로그에서 이후 자동 청구용 학생 `monthly_due_day` 반영 여부 선택.
 */
export function PaymentDueDateCell ({ row, disabled, onDueDateCommit }: PaymentDueDateCellProps) {
    const range = isoDateRangeForBillingMonthStart(row.billing_month);
    const due = row.due_date?.slice(0, 10) ?? '';
    const [draft, setDraft] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [applyMonthlyDueDay, setApplyMonthlyDueDay] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const displayDue = draft ?? due;

    useEffect(() => {
        setDraft(null);
    }, [row.id, row.due_date]);

    if (!range) {
        return <Typography variant="body2">{due || '—'}</Typography>;
    }

    const openConfirm = (nextIso: string) => {
        setDraft(nextIso);
        setApplyMonthlyDueDay(false);
        setDialogOpen(true);
    };

    const handleCancel = () => {
        if (submitting) return;
        setDialogOpen(false);
        setDraft(null);
    };

    const handleConfirm = async () => {
        if (!draft || submitting) return;
        setSubmitting(true);
        try {
            await onDueDateCommit(row, draft, applyMonthlyDueDay);
        } finally {
            setSubmitting(false);
            setDialogOpen(false);
            setDraft(null);
        }
    };

    return (
        <>
            <TextField
                type="date"
                size="small"
                value={displayDue}
                onChange={(e) => {
                    const v = e.target.value;
                    if (!v || v === due) return;
                    if (v < range.min || v > range.max) return;
                    openConfirm(v);
                }}
                disabled={disabled}
                variant="standard"
                slotProps={{ inputLabel: { shrink: true } }}
                inputProps={{
                    min: range.min,
                    max: range.max,
                    'aria-label': p.dueDateInputAria,
                }}
                sx={{
                    minWidth: 148,
                    '& .MuiInputBase-input': { py: 0.5 },
                }}
            />
            <Dialog
                open={dialogOpen}
                onClose={() => {
                    if (!submitting) handleCancel();
                }}
                disableEscapeKeyDown={submitting}
                fullWidth
                maxWidth="xs"
                aria-labelledby="due-date-confirm-title"
            >
                <DialogTitle id="due-date-confirm-title">{p.dueDateChangeDialogTitle}</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        {draft ? p.dueDateChangeSummary.replace('{date}', draft) : null}
                    </Typography>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={applyMonthlyDueDay}
                                onChange={(_, c) => setApplyMonthlyDueDay(c)}
                                disabled={submitting}
                                inputProps={{
                                    'aria-label': p.dueDateApplyDefaultCheckbox,
                                }}
                            />
                        }
                        label={p.dueDateApplyDefaultCheckbox}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 2, pb: 2, gap: 1 }}>
                    <Button onClick={handleCancel} disabled={submitting} sx={touchButtonSx}>
                        {p.cancel}
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => void handleConfirm()}
                        disabled={submitting}
                        sx={touchButtonSx}
                    >
                        {p.save}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
