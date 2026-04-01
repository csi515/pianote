import { Box, TextField } from '@mui/material';
import type { PaymentWithStudent } from '@/services/payments.service';
import { ui } from '@/i18n/ui';

const p = ui.adminPayments;

export type PaymentPaidDateCellProps = {
    row: PaymentWithStudent;
    disabled: boolean;
    onPaidDateCommit: (row: PaymentWithStudent, isoDate: string) => void | Promise<void>;
    /** xs에서 납부일 열이 숨겨질 때 스위치 아래에 표시 */
    compactBelow?: boolean;
};

/**
 * 미납·연체: 납부일 열은 '—'. 완납: 날짜 입력(토글 시 기본 오늘 → 사용자 변경 가능).
 */
export function PaymentPaidDateCell ({
    row,
    disabled,
    onPaidDateCommit,
    compactBelow,
}: PaymentPaidDateCellProps) {
    if (row.status !== 'paid') {
        return <>{row.paid_date ?? '—'}</>;
    }

    const field = (
        <TextField
            type="date"
            size="small"
            value={row.paid_date ?? ''}
            onChange={(e) => {
                const v = e.target.value;
                if (v && v !== row.paid_date) {
                    void onPaidDateCommit(row, v);
                }
            }}
            disabled={disabled}
            variant="standard"
            inputProps={{
                'aria-label': p.paidDateInputAria,
            }}
            sx={{
                minWidth: 148,
                '& .MuiInputBase-input': { py: 0.5 },
            }}
        />
    );

    if (compactBelow) {
        return <Box sx={{ mt: 0.5 }}>{field}</Box>;
    }
    return field;
}
