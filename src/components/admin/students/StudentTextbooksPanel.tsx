import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Box,
    Typography,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Switch,
    FormControlLabel,
    Stack,
    TextField,
    useMediaQuery,
    useTheme,
    Paper,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import {
    listStudentTextbooks,
    assignTextbook,
    setStudentTextbookPaid,
    updateStudentTextbookPaidDate,
    removeStudentTextbook,
    type StudentTextbookWithDetails,
} from '@/services/textbooks.service';
import type { Database } from '@/lib/supabase';
import visuallyHidden from '@mui/utils/visuallyHidden';
import { ui } from '@/i18n/ui';
import {
    MobileCardList,
    MobileCardListItem,
    MobileStackedCard,
} from '@/components/common/adminTable';
import { tableContainerTouchScrollSx, tablePaginationTouchSx, touchButtonSx } from '@/constants/touch';

type TextbookRow = Database['public']['Tables']['textbooks']['Row'];

function pickTextbook (
    t: StudentTextbookWithDetails['textbooks']
): Pick<TextbookRow, 'id' | 'name' | 'price'> | null {
    if (!t) return null;
    return Array.isArray(t) ? t[0] ?? null : t;
}

function AssignmentInfoRow ({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <Stack direction="row" spacing={1} alignItems="flex-start" flexWrap="wrap">
            <Typography component="span" variant="caption" color="text.secondary" sx={{ minWidth: 72 }}>
                {label}
            </Typography>
            <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
        </Stack>
    );
}

interface StudentTextbooksPanelProps {
    studentId: string;
    catalog: TextbookRow[];
    /** 교재 배정·납부·삭제 후 상위 목록의 해당 학생 교재비 열만 갱신 */
    onAssignmentsChanged?: (studentId: string) => void;
}

export const StudentTextbooksPanel: React.FC<StudentTextbooksPanelProps> = ({
    studentId,
    catalog,
    onAssignmentsChanged,
}) => {
    const { enqueueSnackbar } = useSnackbar();
    const [rows, setRows] = useState<StudentTextbookWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [assignId, setAssignId] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const theme = useTheme();
    const isMobileList = useMediaQuery(theme.breakpoints.down('md'));

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const list = await listStudentTextbooks(studentId);
            setRows(list);
        } catch (e) {
            console.error(e);
            enqueueSnackbar(ui.adminTextbooks.studentPanelLoadError, { variant: 'error' });
        } finally {
            setLoading(false);
        }
    }, [studentId, enqueueSnackbar]);

    useEffect(() => {
        void load();
    }, [load]);

    useEffect(() => {
        setPage(0);
    }, [studentId]);

    const assignedTextbookIds = useMemo(
        () => new Set(rows.map((r) => r.textbook_id)),
        [rows]
    );

    const assignableCatalog = useMemo(
        () => catalog.filter((t) => !assignedTextbookIds.has(t.id)),
        [catalog, assignedTextbookIds]
    );

    const sortedRows = useMemo(() => {
        return [...rows].sort((a, b) => {
            const na = pickTextbook(a.textbooks)?.name ?? '';
            const nb = pickTextbook(b.textbooks)?.name ?? '';
            return na.localeCompare(nb, 'ko');
        });
    }, [rows]);

    const rowCount = sortedRows.length;
    useEffect(() => {
        setPage((p) => {
            const maxP = rowCount === 0 ? 0 : Math.max(0, Math.ceil(rowCount / rowsPerPage) - 1);
            return Math.min(p, maxP);
        });
    }, [rowCount, rowsPerPage]);

    const pagedRows = useMemo(() => {
        const start = page * rowsPerPage;
        return sortedRows.slice(start, start + rowsPerPage);
    }, [sortedRows, page, rowsPerPage]);

    const handleAssign = async () => {
        if (!assignId) {
            enqueueSnackbar(ui.adminTextbooks.studentPanelSelectTextbook, { variant: 'warning' });
            return;
        }
        const { error } = await assignTextbook(studentId, assignId);
        if (error) {
            enqueueSnackbar(error.message, { variant: 'error' });
            return;
        }
        enqueueSnackbar(ui.adminTextbooks.studentPanelAssignSuccess, { variant: 'success' });
        setAssignId('');
        void load();
        onAssignmentsChanged?.(studentId);
    };

    const togglePaid = async (row: StudentTextbookWithDetails, paid: boolean) => {
        const { error } = await setStudentTextbookPaid(row.id, paid);
        if (error) {
            enqueueSnackbar(error.message, { variant: 'error' });
            return;
        }
        void load();
        onAssignmentsChanged?.(studentId);
    };

    const handleRemove = async (id: string) => {
        if (!window.confirm(ui.adminTextbooks.studentPanelRemoveConfirm)) return;
        const { error } = await removeStudentTextbook(id);
        if (error) {
            enqueueSnackbar(error.message, { variant: 'error' });
            return;
        }
        void load();
        onAssignmentsChanged?.(studentId);
    };

    const commitTextbookPaidDate = async (row: StudentTextbookWithDetails, isoDate: string) => {
        const { error } = await updateStudentTextbookPaidDate(row.id, isoDate);
        if (error) {
            enqueueSnackbar(error.message, { variant: 'error' });
            return;
        }
        void load();
        onAssignmentsChanged?.(studentId);
    };

    if (catalog.length === 0) {
        return (
            <Typography variant="body2" color="text.secondary">
                {ui.adminTextbooks.catalogEmptyHint}
            </Typography>
        );
    }

    return (
        <Box>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
                {ui.adminTextbooks.panelTitle}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2, alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 200, flex: 1 }}>
                    <InputLabel>{ui.adminTextbooks.textbookCol}</InputLabel>
                    <Select
                        label={ui.adminTextbooks.textbookCol}
                        value={assignId}
                        onChange={(e) => setAssignId(e.target.value)}
                        disabled={assignableCatalog.length === 0}
                    >
                        {assignableCatalog.map((t) => (
                            <MenuItem key={t.id} value={t.id}>
                                {`${t.name} (${t.price.toLocaleString('ko-KR')}${ui.common.currencyWon})`}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Button
                    variant="contained"
                    size="small"
                    onClick={() => void handleAssign()}
                    disabled={assignableCatalog.length === 0}
                    sx={touchButtonSx}
                >
                    {ui.adminTextbooks.addAssignment}
                </Button>
            </Box>

            {isMobileList ? (
                <Paper variant="outlined" sx={{ borderRadius: { xs: 0, sm: 1 }, overflow: 'hidden' }}>
                    <Box sx={{ px: { xs: 0, sm: 2 }, py: { xs: 0, sm: 2 } }}>
                        {loading ? (
                            <Typography color="text.secondary" textAlign="center" py={3}>
                                {ui.common.loading}
                            </Typography>
                        ) : sortedRows.length === 0 ? (
                            <Typography color="text.secondary" textAlign="center" py={3}>
                                {ui.adminTextbooks.emptyAssignments}
                            </Typography>
                        ) : (
                            <MobileCardList>
                                {pagedRows.map((a) => {
                                    const t = pickTextbook(a.textbooks);
                                    const paidAt =
                                        a.paid && a.paid_at
                                            ? new Date(a.paid_at + 'T12:00:00').toLocaleDateString('ko-KR')
                                            : '—';
                                    return (
                                        <MobileCardListItem key={a.id}>
                                            <MobileStackedCard
                                                actions={
                                                    <Button
                                                        fullWidth
                                                        color="error"
                                                        variant="outlined"
                                                        onClick={() => void handleRemove(a.id)}
                                                        sx={touchButtonSx}
                                                    >
                                                        {ui.adminTextbooks.delete}
                                                    </Button>
                                                }
                                            >
                                                <Stack spacing={1.25}>
                                                    <Typography variant="subtitle1" fontWeight={600} component="h3">
                                                        {t?.name ?? '—'}
                                                    </Typography>
                                                    <AssignmentInfoRow label={ui.adminTextbooks.price}>
                                                        <Typography variant="body2">
                                                            {t?.price != null
                                                                ? t.price.toLocaleString('ko-KR')
                                                                : '—'}
                                                        </Typography>
                                                    </AssignmentInfoRow>
                                                    <AssignmentInfoRow label={ui.adminTextbooks.paidDateColumn}>
                                                        <Typography variant="body2" component="span">
                                                            {paidAt}
                                                        </Typography>
                                                    </AssignmentInfoRow>
                                                    <FormControlLabel
                                                        control={
                                                            <Switch
                                                                checked={a.paid}
                                                                onChange={(_, v) => void togglePaid(a, v)}
                                                                color="success"
                                                                size="small"
                                                            />
                                                        }
                                                        label={
                                                            a.paid ? ui.adminTextbooks.paid : ui.adminTextbooks.unpaid
                                                        }
                                                    />
                                                </Stack>
                                            </MobileStackedCard>
                                        </MobileCardListItem>
                                    );
                                })}
                            </MobileCardList>
                        )}
                    </Box>
                    {!loading && sortedRows.length > 0 ? (
                        <TablePagination
                            component="div"
                            count={sortedRows.length}
                            page={page}
                            onPageChange={(_, p) => setPage(p)}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={(e) => {
                                setRowsPerPage(parseInt(e.target.value, 10));
                                setPage(0);
                            }}
                            rowsPerPageOptions={[5, 10, 25]}
                            labelRowsPerPage={ui.pagination.labelRowsPerPage}
                            labelDisplayedRows={({ from, to, count }) =>
                                count === 0 ? '0 / 0' : `${from}-${to} / ${count}`
                            }
                            sx={tablePaginationTouchSx}
                        />
                    ) : null}
                </Paper>
            ) : (
                <TableContainer sx={tableContainerTouchScrollSx}>
                    <Table size="small" aria-label={ui.adminTextbooks.assignmentsTableAriaLabel}>
                        <TableHead>
                            <TableRow>
                                <TableCell>{ui.adminTextbooks.textbookCol}</TableCell>
                                <TableCell align="right">{ui.adminTextbooks.price}</TableCell>
                                <TableCell align="center">{ui.adminTextbooks.textbookFeeColumn}</TableCell>
                                <TableCell align="center" sx={{ minWidth: 160 }}>
                                    {ui.adminTextbooks.paidDateColumn}
                                </TableCell>
                                <TableCell
                                    align="right"
                                    sx={{
                                        position: 'relative',
                                        whiteSpace: 'nowrap',
                                        width: 1,
                                        minWidth: 96,
                                    }}
                                >
                                    <Box component="span" sx={visuallyHidden}>
                                        {ui.common.tableActionsHeader}
                                    </Box>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5}>…</TableCell>
                                </TableRow>
                            ) : sortedRows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5}>{ui.adminTextbooks.emptyAssignments}</TableCell>
                                </TableRow>
                            ) : (
                                pagedRows.map((a) => {
                                    const t = pickTextbook(a.textbooks);
                                    return (
                                        <TableRow key={a.id}>
                                            <TableCell>{t?.name ?? '—'}</TableCell>
                                            <TableCell align="right">
                                                {t?.price != null ? t.price.toLocaleString('ko-KR') : '—'}
                                            </TableCell>
                                            <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            checked={a.paid}
                                                            onChange={(_, v) => void togglePaid(a, v)}
                                                            color="success"
                                                            size="small"
                                                        />
                                                    }
                                                    label={
                                                        a.paid ? ui.adminTextbooks.paid : ui.adminTextbooks.unpaid
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                {a.paid ? (
                                                    <TextField
                                                        type="date"
                                                        size="small"
                                                        value={a.paid_at ?? ''}
                                                        onChange={(e) => {
                                                            const v = e.target.value;
                                                            if (v && v !== a.paid_at) {
                                                                void commitTextbookPaidDate(a, v);
                                                            }
                                                        }}
                                                        variant="standard"
                                                        inputProps={{
                                                            'aria-label':
                                                                ui.adminTextbooks.textbookPaidDateInputAria,
                                                        }}
                                                        sx={{
                                                            minWidth: 148,
                                                            '& .MuiInputBase-input': { py: 0.5 },
                                                        }}
                                                    />
                                                ) : (
                                                    <Typography variant="body2" component="span">
                                                        —
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell
                                                align="right"
                                                sx={{ whiteSpace: 'nowrap', width: 1, minWidth: 96 }}
                                            >
                                                <Button
                                                    size="small"
                                                    color="error"
                                                    onClick={() => void handleRemove(a.id)}
                                                    sx={{ ...touchButtonSx, whiteSpace: 'nowrap' }}
                                                >
                                                    {ui.adminTextbooks.delete}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                    {!loading && sortedRows.length > 0 ? (
                        <TablePagination
                            component="div"
                            count={sortedRows.length}
                            page={page}
                            onPageChange={(_, p) => setPage(p)}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={(e) => {
                                setRowsPerPage(parseInt(e.target.value, 10));
                                setPage(0);
                            }}
                            rowsPerPageOptions={[5, 10, 25]}
                            labelRowsPerPage={ui.pagination.labelRowsPerPage}
                            labelDisplayedRows={({ from, to, count }) =>
                                count === 0 ? '0 / 0' : `${from}-${to} / ${count}`
                            }
                            sx={tablePaginationTouchSx}
                        />
                    ) : null}
                </TableContainer>
            )}
        </Box>
    );
};
