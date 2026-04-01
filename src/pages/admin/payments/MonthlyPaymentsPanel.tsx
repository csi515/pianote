import React, { useEffect, useId, useMemo, useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Stack,
    IconButton,
    Switch,
    Chip,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useSnackbar } from 'notistack';
import type { ActiveStudentSummary } from '@/services/students.service';
import {
    createPayment,
    updatePayment,
    toBillingMonthStart,
    shiftMonth,
    lastDayOfMonthYYYYMm,
    dueDateForBillingMonthFromEnrollment,
    formatBillingMonthLabelKo,
    parseYearMonth,
    buildBillingYearOptions,
    type PaymentWithStudent,
} from '@/services/payments.service';
import type { Database } from '@/lib/supabase';
import { ui } from '@/i18n/ui';
import { TableLoadingRow } from '@/components/common/PageState';
import {
    MobileCardList,
    MobileCardListItem,
    MobileStackedCard,
} from '@/components/common/adminTable';
import {
    tableContainerTouchScrollSx,
    tablePaginationTouchSx,
    touchButtonSx,
    touchIconButtonSx,
} from '@/constants/touch';
import { PaymentPaidDateCell } from '@/pages/admin/payments/PaymentPaidDateCell';

type PayStatus = Database['public']['Tables']['payments']['Row']['status'];

function InfoRow ({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <Stack direction="row" spacing={1} alignItems="flex-start" flexWrap="wrap">
            <Typography component="span" variant="caption" color="text.secondary" sx={{ minWidth: 72 }}>
                {label}
            </Typography>
            <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
        </Stack>
    );
}

export type MonthlyPaymentsPanelProps = {
    billingMonthInput: string;
    onBillingMonthInputChange: (v: string) => void;
    loading: boolean;
    students: ActiveStudentSummary[];
    monthlyRows: PaymentWithStudent[];
    onAfterMutation: () => void | Promise<void>;
    academyDefaultMonthlyFee: number | null;
};

const MonthlyPaymentsPanel: React.FC<MonthlyPaymentsPanelProps> = ({
    billingMonthInput,
    onBillingMonthInputChange,
    loading,
    students,
    monthlyRows,
    onAfterMutation,
    academyDefaultMonthlyFee,
}) => {
    const monthlyDialogTitleId = useId();
    const theme = useTheme();
    const isMobileList = useMediaQuery(theme.breakpoints.down('md'));

    const { enqueueSnackbar } = useSnackbar();
    const [togglingPaymentId, setTogglingPaymentId] = useState<string | null>(null);
    const [monthlyDialogOpen, setMonthlyDialogOpen] = useState(false);
    const [monthlyForm, setMonthlyForm] = useState({
        student_id: '',
        amount: '',
        due_date: '',
        status: 'pending' as PayStatus,
    });

    const paymentByStudentId = useMemo(() => {
        const m = new Map<string, PaymentWithStudent>();
        for (const p of monthlyRows) {
            if (!m.has(p.student_id)) m.set(p.student_id, p);
        }
        return m;
    }, [monthlyRows]);

    const sortedActiveStudents = useMemo(
        () => [...students].sort((a, b) => a.name.localeCompare(b.name, 'ko')),
        [students]
    );

    const [tablePage, setTablePage] = useState(0);
    const [tableRowsPerPage, setTableRowsPerPage] = useState(10);

    useEffect(() => {
        setTablePage(0);
    }, [billingMonthInput]);

    const totalStudents = sortedActiveStudents.length;
    useEffect(() => {
        setTablePage((p) => {
            const maxP =
                totalStudents === 0 ? 0 : Math.max(0, Math.ceil(totalStudents / tableRowsPerPage) - 1);
            return Math.min(p, maxP);
        });
    }, [totalStudents, tableRowsPerPage]);

    const pagedStudents = useMemo(() => {
        const start = tablePage * tableRowsPerPage;
        return sortedActiveStudents.slice(start, start + tableRowsPerPage);
    }, [sortedActiveStudents, tablePage, tableRowsPerPage]);

    const { year: billingYear, month: billingMonthNum } = useMemo(
        () => parseYearMonth(billingMonthInput),
        [billingMonthInput]
    );
    const billingYearOptions = useMemo(
        () => buildBillingYearOptions(billingYear),
        [billingYear]
    );
    const monthOptions = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);

    const setBillingYearMonth = (y: number, mo: number) => {
        onBillingMonthInputChange(`${y}-${String(mo).padStart(2, '0')}`);
    };

    const openMonthlyRegister = (studentId: string) => {
        const st = students.find((x) => x.id === studentId);
        const fallback =
            academyDefaultMonthlyFee != null ? String(academyDefaultMonthlyFee) : '';
        setMonthlyForm({
            student_id: studentId,
            amount: st?.monthly_fee != null ? String(st.monthly_fee) : fallback,
            due_date: st
                ? dueDateForBillingMonthFromEnrollment(st.enrollment_date, billingMonthInput)
                : lastDayOfMonthYYYYMm(billingMonthInput),
            status: 'pending',
        });
        setMonthlyDialogOpen(true);
    };

    const submitMonthlyCreate = async () => {
        const amt = Number(monthlyForm.amount.replaceAll(',', '').trim());
        if (!monthlyForm.student_id || !monthlyForm.due_date || Number.isNaN(amt) || amt <= 0) {
            enqueueSnackbar(ui.adminPayments.warnCreateMonthly, { variant: 'warning' });
            return;
        }
        const today = new Date().toISOString().slice(0, 10);
        const res = await createPayment({
            student_id: monthlyForm.student_id,
            amount: amt,
            due_date: monthlyForm.due_date,
            billing_month: toBillingMonthStart(billingMonthInput),
            paid_date: monthlyForm.status === 'paid' ? today : null,
            status: monthlyForm.status,
        });
        if (res.success) {
            enqueueSnackbar(ui.adminPayments.toastRegistered, { variant: 'success' });
            setMonthlyDialogOpen(false);
            await onAfterMutation();
        } else {
            enqueueSnackbar(res.error ?? ui.adminPayments.toastFailed, { variant: 'error' });
        }
    };

    const toggleMembershipPaid = async (r: PaymentWithStudent, paid: boolean) => {
        setTogglingPaymentId(r.id);
        const today = new Date().toISOString().slice(0, 10);
        const res = paid
            ? await updatePayment(r.id, { status: 'paid', paid_date: today })
            : await updatePayment(r.id, { paid_date: null, status: 'pending' });
        setTogglingPaymentId(null);
        if (res.success) {
            enqueueSnackbar(ui.adminPayments.toastChanged, { variant: 'success' });
            await onAfterMutation();
        } else {
            enqueueSnackbar(res.error ?? ui.adminPayments.toastFailed, { variant: 'error' });
        }
    };

    const commitPaidDate = async (r: PaymentWithStudent, isoDate: string) => {
        setTogglingPaymentId(r.id);
        const res = await updatePayment(r.id, { paid_date: isoDate, status: 'paid' });
        setTogglingPaymentId(null);
        if (res.success) {
            enqueueSnackbar(ui.adminPayments.toastChanged, { variant: 'success' });
            await onAfterMutation();
        } else {
            enqueueSnackbar(res.error ?? ui.adminPayments.toastFailed, { variant: 'error' });
        }
    };

    return (
        <>
            <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}
            >
                <IconButton
                    type="button"
                    aria-label={ui.adminPayments.prevMonthAria}
                    onClick={() => onBillingMonthInputChange(shiftMonth(billingMonthInput, -1))}
                    size="small"
                    sx={touchIconButtonSx}
                >
                    <ChevronLeftIcon />
                </IconButton>
                <FormControl size="small" sx={{ minWidth: 108 }}>
                    <InputLabel id="billing-year-label">{ui.adminPayments.billingYearLabel}</InputLabel>
                    <Select
                        labelId="billing-year-label"
                        label={ui.adminPayments.billingYearLabel}
                        value={billingYear}
                        onChange={(e) =>
                            setBillingYearMonth(Number(e.target.value), billingMonthNum)
                        }
                    >
                        {billingYearOptions.map((y) => (
                            <MenuItem key={y} value={y}>
                                {ui.adminPayments.billingYearOption.replace('{year}', String(y))}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 108 }}>
                    <InputLabel id="billing-month-label">{ui.adminPayments.billingMonthOnlyLabel}</InputLabel>
                    <Select
                        labelId="billing-month-label"
                        label={ui.adminPayments.billingMonthOnlyLabel}
                        value={billingMonthNum}
                        onChange={(e) =>
                            setBillingYearMonth(billingYear, Number(e.target.value))
                        }
                    >
                        {monthOptions.map((m) => (
                            <MenuItem key={m} value={m}>
                                {ui.adminPayments.billingMonthOption.replace('{month}', String(m))}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <IconButton
                    type="button"
                    aria-label={ui.adminPayments.nextMonthAria}
                    onClick={() => onBillingMonthInputChange(shiftMonth(billingMonthInput, 1))}
                    size="small"
                    sx={touchIconButtonSx}
                >
                    <ChevronRightIcon />
                </IconButton>
            </Stack>
            {isMobileList ? (
                <Paper variant="outlined" sx={{ borderRadius: { xs: 0, sm: 1 }, overflow: 'hidden' }}>
                    <Box sx={{ px: { xs: 0, sm: 2 }, py: { xs: 0, sm: 2 } }}>
                        {loading ? (
                            <Typography color="text.secondary" textAlign="center" py={3}>
                                {ui.common.loading}
                            </Typography>
                        ) : sortedActiveStudents.length === 0 ? (
                            <Typography color="text.secondary" textAlign="center" py={3}>
                                {ui.adminPayments.emptyActiveStudents}
                            </Typography>
                        ) : (
                            <MobileCardList>
                                {pagedStudents.map((s) => {
                                    const r = paymentByStudentId.get(s.id);
                                    return (
                                        <MobileCardListItem key={s.id}>
                                            <MobileStackedCard
                                                actions={
                                                    r ? (
                                                        <Stack
                                                            direction="row"
                                                            alignItems="center"
                                                            flexWrap="wrap"
                                                            gap={1}
                                                            sx={{ width: '100%', justifyContent: 'flex-start' }}
                                                        >
                                                            <Switch
                                                                checked={r.status === 'paid'}
                                                                disabled={togglingPaymentId === r.id}
                                                                onChange={(_, checked) =>
                                                                    void toggleMembershipPaid(r, checked)
                                                                }
                                                                inputProps={{
                                                                    'aria-label':
                                                                        ui.adminPayments.membershipPaidToggleAria,
                                                                }}
                                                            />
                                                            {r.status === 'overdue' ? (
                                                                <Chip
                                                                    size="small"
                                                                    color="error"
                                                                    label={ui.adminPayments.statusOpt.overdue}
                                                                />
                                                            ) : null}
                                                        </Stack>
                                                    ) : (
                                                        <Button
                                                            fullWidth
                                                            variant="outlined"
                                                            onClick={() => openMonthlyRegister(s.id)}
                                                            sx={touchButtonSx}
                                                        >
                                                            {ui.adminPayments.registerThisMonth}
                                                        </Button>
                                                    )
                                                }
                                            >
                                                <Stack spacing={1.25}>
                                                    <Typography variant="subtitle1" fontWeight={600} component="h3">
                                                        {s.name}
                                                    </Typography>
                                                    {r ? (
                                                        <>
                                                            <InfoRow label={ui.adminPayments.amount}>
                                                                <Typography variant="body2">
                                                                    {r.amount.toLocaleString()}
                                                                </Typography>
                                                            </InfoRow>
                                                            <InfoRow label={ui.adminPayments.dueDate}>
                                                                <Typography variant="body2">{r.due_date}</Typography>
                                                            </InfoRow>
                                                            <InfoRow label={ui.adminPayments.paidDate}>
                                                                <PaymentPaidDateCell
                                                                    row={r}
                                                                    disabled={togglingPaymentId === r.id}
                                                                    onPaidDateCommit={commitPaidDate}
                                                                />
                                                            </InfoRow>
                                                        </>
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">
                                                            {ui.adminPayments.notRegistered}
                                                        </Typography>
                                                    )}
                                                </Stack>
                                            </MobileStackedCard>
                                        </MobileCardListItem>
                                    );
                                })}
                            </MobileCardList>
                        )}
                    </Box>
                    {!loading && sortedActiveStudents.length > 0 ? (
                        <TablePagination
                            component="div"
                            count={sortedActiveStudents.length}
                            page={tablePage}
                            onPageChange={(_, p) => setTablePage(p)}
                            rowsPerPage={tableRowsPerPage}
                            onRowsPerPageChange={(e) => {
                                setTableRowsPerPage(parseInt(e.target.value, 10));
                                setTablePage(0);
                            }}
                            rowsPerPageOptions={[5, 10, 25, 50]}
                            labelRowsPerPage={ui.pagination.labelRowsPerPage}
                            labelDisplayedRows={({ from, to, count }) =>
                                count === 0 ? '0 / 0' : `${from}-${to} / ${count}`
                            }
                            sx={tablePaginationTouchSx}
                        />
                    ) : null}
                </Paper>
            ) : (
                <TableContainer component={Paper} variant="outlined" sx={tableContainerTouchScrollSx}>
                    <Table size="small" aria-label={ui.adminPayments.tableAriaLabelMonthly}>
                        <TableHead>
                            <TableRow>
                                <TableCell>{ui.adminPayments.student}</TableCell>
                                <TableCell align="right">{ui.adminPayments.amount}</TableCell>
                                <TableCell>{ui.adminPayments.dueDate}</TableCell>
                                <TableCell>{ui.adminPayments.paidDate}</TableCell>
                                <TableCell sx={{ minWidth: 160 }}>{ui.adminPayments.membershipPaidColumn}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableLoadingRow colSpan={5} message={ui.common.loading} />
                            ) : sortedActiveStudents.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5}>{ui.adminPayments.emptyActiveStudents}</TableCell>
                                </TableRow>
                            ) : (
                                pagedStudents.map((s) => {
                                    const r = paymentByStudentId.get(s.id);
                                    return (
                                        <TableRow key={s.id}>
                                            <TableCell>{s.name}</TableCell>
                                            {r ? (
                                                <>
                                                    <TableCell align="right">{r.amount.toLocaleString()}</TableCell>
                                                    <TableCell>{r.due_date}</TableCell>
                                                    <TableCell>
                                                        <PaymentPaidDateCell
                                                            row={r}
                                                            disabled={togglingPaymentId === r.id}
                                                            onPaidDateCommit={commitPaidDate}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ minWidth: 160 }}>
                                                        <Stack
                                                            direction="row"
                                                            alignItems="center"
                                                            spacing={1}
                                                            flexWrap="wrap"
                                                        >
                                                            <Switch
                                                                checked={r.status === 'paid'}
                                                                disabled={togglingPaymentId === r.id}
                                                                onChange={(_, checked) =>
                                                                    void toggleMembershipPaid(r, checked)
                                                                }
                                                                inputProps={{
                                                                    'aria-label':
                                                                        ui.adminPayments.membershipPaidToggleAria,
                                                                }}
                                                            />
                                                            {r.status === 'overdue' ? (
                                                                <Chip
                                                                    size="small"
                                                                    color="error"
                                                                    label={ui.adminPayments.statusOpt.overdue}
                                                                />
                                                            ) : null}
                                                        </Stack>
                                                    </TableCell>
                                                </>
                                            ) : (
                                                <>
                                                    <TableCell align="right">—</TableCell>
                                                    <TableCell>—</TableCell>
                                                    <TableCell>—</TableCell>
                                                    <TableCell>
                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <Typography
                                                                variant="body2"
                                                                color="text.secondary"
                                                                sx={{ flexShrink: 0 }}
                                                            >
                                                                {ui.adminPayments.notRegistered}
                                                            </Typography>
                                                            <Button
                                                                size="small"
                                                                variant="outlined"
                                                                onClick={() => openMonthlyRegister(s.id)}
                                                                sx={touchButtonSx}
                                                            >
                                                                {ui.adminPayments.registerThisMonth}
                                                            </Button>
                                                        </Stack>
                                                    </TableCell>
                                                </>
                                            )}
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                    {!loading && sortedActiveStudents.length > 0 ? (
                        <TablePagination
                            component="div"
                            count={sortedActiveStudents.length}
                            page={tablePage}
                            onPageChange={(_, p) => setTablePage(p)}
                            rowsPerPage={tableRowsPerPage}
                            onRowsPerPageChange={(e) => {
                                setTableRowsPerPage(parseInt(e.target.value, 10));
                                setTablePage(0);
                            }}
                            rowsPerPageOptions={[5, 10, 25, 50]}
                            labelRowsPerPage={ui.pagination.labelRowsPerPage}
                            labelDisplayedRows={({ from, to, count }) =>
                                count === 0 ? '0 / 0' : `${from}-${to} / ${count}`
                            }
                            sx={tablePaginationTouchSx}
                        />
                    ) : null}
                </TableContainer>
            )}

            <Dialog
                open={monthlyDialogOpen}
                onClose={() => setMonthlyDialogOpen(false)}
                fullWidth
                maxWidth="sm"
                scroll="paper"
                aria-labelledby={monthlyDialogTitleId}
            >
                <DialogTitle component="h2" id={monthlyDialogTitleId}>
                    {ui.adminPayments.registerThisMonth}
                </DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        {formatBillingMonthLabelKo(billingMonthInput)} ·{' '}
                        {students.find((x) => x.id === monthlyForm.student_id)?.name ?? ''}
                    </Typography>
                    <TextField
                        label={ui.adminPayments.amount}
                        type="number"
                        value={monthlyForm.amount}
                        onChange={(e) => setMonthlyForm((f) => ({ ...f, amount: e.target.value }))}
                        fullWidth
                        required
                    />
                    <TextField
                        label={ui.adminPayments.dueDate}
                        type="date"
                        value={monthlyForm.due_date}
                        onChange={(e) => setMonthlyForm((f) => ({ ...f, due_date: e.target.value }))}
                        slotProps={{ inputLabel: { shrink: true } }}
                        fullWidth
                        required
                    />
                    <FormControl fullWidth>
                        <InputLabel>{ui.adminPayments.status}</InputLabel>
                        <Select
                            label={ui.adminPayments.status}
                            value={monthlyForm.status}
                            onChange={(e) =>
                                setMonthlyForm((f) => ({
                                    ...f,
                                    status: e.target.value as PayStatus,
                                }))
                            }
                        >
                            {(Object.keys(ui.adminPayments.statusOpt) as PayStatus[]).map((k) => (
                                <MenuItem key={k} value={k}>
                                    {ui.adminPayments.statusOpt[k]}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setMonthlyDialogOpen(false)} sx={touchButtonSx}>
                        {ui.adminPayments.cancel}
                    </Button>
                    <Button variant="contained" onClick={() => void submitMonthlyCreate()} sx={touchButtonSx}>
                        {ui.adminPayments.save}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default MonthlyPaymentsPanel;
