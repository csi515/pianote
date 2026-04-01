import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Container,
    Paper,
    Alert,
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
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Tabs,
    Tab,
    TablePagination,
    Switch,
    Chip,
    Stack,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/contexts/AuthContext';
import { usePageTopBar } from '@/contexts/PageTopBarContext';
import { useSnackbar } from 'notistack';
import { listActiveStudentSummaries, type ActiveStudentSummary } from '@/services/students.service';
import {
    listPaymentsByAcademyPage,
    listPaymentsForBillingMonth,
    createPayment,
    updatePayment,
    toBillingMonthStart,
    formatMonthInput,
    isStudentInMonthlyPaymentsList,
    ensureMonthlyPaymentsForBillingMonth,
    type PaymentWithStudent,
} from '@/services/payments.service';
import type { Database } from '@/lib/supabase';
import { invalidateAcademyAdminMetricsCache } from '@/services/academyAdminMetrics.service';
import { ui } from '@/i18n/ui';
import MonthlyPaymentsPanel from '@/pages/admin/payments/MonthlyPaymentsPanel';
import { PaymentPaidDateCell } from '@/pages/admin/payments/PaymentPaidDateCell';
import { TableEmptyRow, TableLoadingRow } from '@/components/common/PageState';
import {
    MobileCardList,
    MobileCardListItem,
    MobileStackedCard,
} from '@/components/common/adminTable';
import { tablePaginationTouchSx, touchButtonSx } from '@/constants/touch';

type PayStatus = Database['public']['Tables']['payments']['Row']['status'];

function PaymentsInfoRow ({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <Stack direction="row" spacing={1} alignItems="flex-start" flexWrap="wrap">
            <Typography component="span" variant="caption" color="text.secondary" sx={{ minWidth: 72 }}>
                {label}
            </Typography>
            <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
        </Stack>
    );
}

const PaymentsManagement: React.FC = () => {
    const paymentDialogTitleId = useId();
    const theme = useTheme();
    const isMobileList = useMediaQuery(theme.breakpoints.down('sm'));

    const { academy } = useAuth();
    usePageTopBar({ title: ui.adminPayments.title, backTo: ROUTES.admin.dashboard });
    const { enqueueSnackbar } = useSnackbar();
    const [tab, setTab] = useState(0);
    const [billingMonthInput, setBillingMonthInput] = useState(() => formatMonthInput(new Date()));
    const [rowsAll, setRowsAll] = useState<PaymentWithStudent[]>([]);
    const [totalAll, setTotalAll] = useState(0);
    const [pageAll, setPageAll] = useState(0);
    const [rowsPerPageAll, setRowsPerPageAll] = useState(10);
    const [monthlyRows, setMonthlyRows] = useState<PaymentWithStudent[]>([]);
    const [students, setStudents] = useState<ActiveStudentSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [togglingPaymentId, setTogglingPaymentId] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [form, setForm] = useState({
        student_id: '',
        amount: '',
        due_date: '',
        status: 'pending' as PayStatus,
    });

    const studentsForMonthlyPayments = useMemo(
        () =>
            students.filter((s) =>
                isStudentInMonthlyPaymentsList(
                    s.enrollment_date,
                    s.left_academy_date,
                    billingMonthInput
                )
            ),
        [students, billingMonthInput]
    );

    const loadAll = useCallback(async () => {
        if (!academy) return;
        setLoading(true);
        const [paysRes, studentList] = await Promise.all([
            listPaymentsByAcademyPage(academy.id, pageAll, rowsPerPageAll, { paidOnly: false }),
            listActiveStudentSummaries(academy.id),
        ]);
        setRowsAll(paysRes.rows);
        setTotalAll(paysRes.total);
        setStudents(studentList);
        setLoading(false);
        if (paysRes.rows.length === 0 && pageAll > 0) {
            setPageAll((p) => Math.max(0, p - 1));
        }
    }, [academy, pageAll, rowsPerPageAll]);

    const loadMonthly = useCallback(async () => {
        if (!academy) return;
        setLoading(true);
        try {
            const studs = await listActiveStudentSummaries(academy.id);
            const eligible = studs.filter((s) =>
                isStudentInMonthlyPaymentsList(
                    s.enrollment_date,
                    s.left_academy_date,
                    billingMonthInput
                )
            );
            await ensureMonthlyPaymentsForBillingMonth(billingMonthInput, academy.id, eligible);
            const start = toBillingMonthStart(billingMonthInput);
            const pays = await listPaymentsForBillingMonth(academy.id, start);
            setMonthlyRows(pays);
            setStudents(studs);
        } finally {
            setLoading(false);
        }
    }, [academy, billingMonthInput]);

    useEffect(() => {
        if (tab === 0) void loadMonthly();
    }, [tab, loadMonthly]);

    useEffect(() => {
        if (tab === 1) void loadAll();
    }, [tab, loadAll]);

    const openCreate = () => {
        if (students.length === 0) {
            enqueueSnackbar(ui.adminPayments.noStudentsForPayments, { variant: 'warning' });
            return;
        }
        setForm({
            student_id: students[0]?.id ?? '',
            amount: '',
            due_date: new Date().toISOString().slice(0, 10),
            status: 'pending',
        });
        setDialogOpen(true);
    };

    const submitCreate = async () => {
        const amt = Number(form.amount.replaceAll(',', '').trim());
        if (!form.student_id || !form.due_date || Number.isNaN(amt) || amt <= 0) {
            enqueueSnackbar(ui.adminPayments.warnCreateAll, { variant: 'warning' });
            return;
        }
        const today = new Date().toISOString().slice(0, 10);
        const res = await createPayment({
            student_id: form.student_id,
            amount: amt,
            due_date: form.due_date,
            billing_month: toBillingMonthStart(form.due_date.slice(0, 7)),
            paid_date: form.status === 'paid' ? today : null,
            status: form.status,
        });
        if (res.success) {
            enqueueSnackbar(ui.adminPayments.toastRegistered, { variant: 'success' });
            setDialogOpen(false);
            if (academy?.id) invalidateAcademyAdminMetricsCache(academy.id);
            await loadAll();
        } else {
            enqueueSnackbar(res.error ?? ui.adminPayments.toastFailed, { variant: 'error' });
        }
    };

    const toggleMembershipPaidAll = async (r: PaymentWithStudent, paid: boolean) => {
        setTogglingPaymentId(r.id);
        const today = new Date().toISOString().slice(0, 10);
        const res = paid
            ? await updatePayment(r.id, { status: 'paid', paid_date: today })
            : await updatePayment(r.id, { paid_date: null, status: 'pending' });
        setTogglingPaymentId(null);
        if (res.success) {
            enqueueSnackbar(ui.adminPayments.toastChanged, { variant: 'success' });
            if (academy?.id) invalidateAcademyAdminMetricsCache(academy.id);
            await loadAll();
        } else {
            enqueueSnackbar(res.error ?? ui.adminPayments.toastFailed, { variant: 'error' });
        }
    };

    const commitPaidDateAll = async (r: PaymentWithStudent, isoDate: string) => {
        setTogglingPaymentId(r.id);
        const res = await updatePayment(r.id, { paid_date: isoDate, status: 'paid' });
        setTogglingPaymentId(null);
        if (res.success) {
            enqueueSnackbar(ui.adminPayments.toastChanged, { variant: 'success' });
            if (academy?.id) invalidateAcademyAdminMetricsCache(academy.id);
            await loadAll();
        } else {
            enqueueSnackbar(res.error ?? ui.adminPayments.toastFailed, { variant: 'error' });
        }
    };

    const onMonthlyMutation = useCallback(async () => {
        if (academy?.id) invalidateAcademyAdminMetricsCache(academy.id);
        await loadMonthly();
    }, [academy?.id, loadMonthly]);

    return (
        <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 } }}>
            <Paper variant="outlined" sx={{ mb: 2 }}>
                <Tabs
                    value={tab}
                    onChange={(_, v) => {
                        setTab(v);
                        if (v === 1) setPageAll(0);
                    }}
                    variant="fullWidth"
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab label={ui.adminPayments.tabMonthly} />
                    <Tab label={ui.adminPayments.tabAll} />
                </Tabs>
            </Paper>

            {tab === 0 && (
                <MonthlyPaymentsPanel
                    billingMonthInput={billingMonthInput}
                    onBillingMonthInputChange={setBillingMonthInput}
                    loading={loading}
                    students={studentsForMonthlyPayments}
                    monthlyRows={monthlyRows}
                    onAfterMutation={onMonthlyMutation}
                    academyDefaultMonthlyFee={academy?.default_monthly_fee ?? null}
                />
            )}

            {tab === 1 && (
                <>
                    <Alert severity="info" sx={{ mb: 2 }} role="status" aria-live="polite">
                        {ui.adminPayments.allTabHint}
                    </Alert>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                        <Button
                            variant="contained"
                            color="secondary"
                            startIcon={<AddIcon />}
                            onClick={openCreate}
                            disabled={students.length === 0}
                        >
                            {ui.adminPayments.add}
                        </Button>
                    </Box>
                    {!loading && students.length === 0 ? (
                        <Alert severity="warning" sx={{ mb: 2 }} role="status" aria-live="polite">
                            {ui.adminPayments.noStudentsForPayments}
                        </Alert>
                    ) : null}
                    {!loading && totalAll === 0 && students.length > 0 ? (
                        <Alert severity="info" sx={{ mb: 2 }} role="status" aria-live="polite">
                            {ui.adminPayments.emptyAllListHint}
                        </Alert>
                    ) : null}
                    {isMobileList ? (
                        <Paper variant="outlined">
                            <Box sx={{ p: 2 }}>
                                {loading ? (
                                    <Typography color="text.secondary" textAlign="center" py={3}>
                                        {ui.common.loading}
                                    </Typography>
                                ) : rowsAll.length === 0 ? (
                                    <Typography color="text.secondary" textAlign="center" py={3}>
                                        {ui.adminPayments.emptyAllList}
                                    </Typography>
                                ) : (
                                    <MobileCardList>
                                        {rowsAll.map((r) => (
                                            <MobileCardListItem key={r.id}>
                                                <MobileStackedCard
                                                    actions={
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
                                                                    void toggleMembershipPaidAll(r, checked)
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
                                                    }
                                                >
                                                    <Stack spacing={1.25}>
                                                        <Typography variant="subtitle1" fontWeight={600} component="h3">
                                                            {r.student_name}
                                                        </Typography>
                                                        <PaymentsInfoRow label={ui.adminPayments.amount}>
                                                            <Typography variant="body2">
                                                                {r.amount.toLocaleString()}
                                                            </Typography>
                                                        </PaymentsInfoRow>
                                                        <PaymentsInfoRow label={ui.adminPayments.dueDate}>
                                                            <Typography variant="body2">{r.due_date}</Typography>
                                                        </PaymentsInfoRow>
                                                        <PaymentsInfoRow label={ui.adminPayments.paidDate}>
                                                            <PaymentPaidDateCell
                                                                row={r}
                                                                disabled={togglingPaymentId === r.id}
                                                                onPaidDateCommit={commitPaidDateAll}
                                                            />
                                                        </PaymentsInfoRow>
                                                    </Stack>
                                                </MobileStackedCard>
                                            </MobileCardListItem>
                                        ))}
                                    </MobileCardList>
                                )}
                            </Box>
                            <TablePagination
                                component="div"
                                count={totalAll}
                                page={pageAll}
                                onPageChange={(_, p) => setPageAll(p)}
                                rowsPerPage={rowsPerPageAll}
                                onRowsPerPageChange={(e) => {
                                    setRowsPerPageAll(parseInt(e.target.value, 10));
                                    setPageAll(0);
                                }}
                                rowsPerPageOptions={[5, 10, 25, 50]}
                                labelRowsPerPage={ui.pagination.labelRowsPerPage}
                                labelDisplayedRows={({ from, to, count }) =>
                                    count === 0 ? '0 / 0' : `${from + 1}-${to + 1} / ${count}`
                                }
                                sx={tablePaginationTouchSx}
                            />
                        </Paper>
                    ) : (
                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small" aria-label={ui.adminPayments.tableAriaLabelAll}>
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
                                    ) : rowsAll.length === 0 ? (
                                        <TableEmptyRow colSpan={5} message={ui.adminPayments.emptyAllList} />
                                    ) : (
                                        rowsAll.map((r) => (
                                            <TableRow key={r.id}>
                                                <TableCell>{r.student_name}</TableCell>
                                                <TableCell align="right">{r.amount.toLocaleString()}</TableCell>
                                                <TableCell>{r.due_date}</TableCell>
                                                <TableCell>
                                                    <PaymentPaidDateCell
                                                        row={r}
                                                        disabled={togglingPaymentId === r.id}
                                                        onPaidDateCommit={commitPaidDateAll}
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
                                                                void toggleMembershipPaidAll(r, checked)
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
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                            <TablePagination
                                component="div"
                                count={totalAll}
                                page={pageAll}
                                onPageChange={(_, p) => setPageAll(p)}
                                rowsPerPage={rowsPerPageAll}
                                onRowsPerPageChange={(e) => {
                                    setRowsPerPageAll(parseInt(e.target.value, 10));
                                    setPageAll(0);
                                }}
                                rowsPerPageOptions={[5, 10, 25, 50]}
                                labelRowsPerPage={ui.pagination.labelRowsPerPage}
                                labelDisplayedRows={({ from, to, count }) =>
                                    count === 0 ? '0 / 0' : `${from + 1}-${to + 1} / ${count}`
                                }
                                sx={tablePaginationTouchSx}
                            />
                        </TableContainer>
                    )}
                </>
            )}

            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                fullWidth
                maxWidth="sm"
                scroll="paper"
                aria-labelledby={paymentDialogTitleId}
            >
                <DialogTitle component="h2" id={paymentDialogTitleId}>
                    {ui.adminPayments.add}
                </DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                    <FormControl fullWidth required>
                        <InputLabel>{ui.adminPayments.student}</InputLabel>
                        <Select
                            label={ui.adminPayments.student}
                            value={form.student_id}
                            onChange={(e) => setForm((f) => ({ ...f, student_id: e.target.value }))}
                        >
                            {students.map((s) => (
                                <MenuItem key={s.id} value={s.id}>
                                    {s.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        label={ui.adminPayments.amount}
                        type="number"
                        value={form.amount}
                        onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                        fullWidth
                        required
                    />
                    <TextField
                        label={ui.adminPayments.dueDate}
                        type="date"
                        value={form.due_date}
                        onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                        slotProps={{ inputLabel: { shrink: true } }}
                        fullWidth
                        required
                    />
                    <FormControl fullWidth>
                        <InputLabel>{ui.adminPayments.status}</InputLabel>
                        <Select
                            label={ui.adminPayments.status}
                            value={form.status}
                            onChange={(e) =>
                                setForm((f) => ({
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
                    <Button onClick={() => setDialogOpen(false)} sx={touchButtonSx}>
                        {ui.adminPayments.cancel}
                    </Button>
                    <Button variant="contained" onClick={() => void submitCreate()} sx={touchButtonSx}>
                        {ui.adminPayments.save}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default PaymentsManagement;
