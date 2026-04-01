import React, { useCallback, useEffect, useState } from 'react';
import {
    Box,
    Button,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    TextField,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSnackbar } from 'notistack';
import { useAuth } from '@/contexts/AuthContext';
import {
    listConsultationsByStudentPage,
    createConsultation,
    deleteConsultation,
    type ConsultationRow,
} from '@/services/consultations.service';
import visuallyHidden from '@mui/utils/visuallyHidden';
import { ui } from '@/i18n/ui';
import FormDialog from '@/components/common/FormDialog';
import { TableEmptyRow, TableLoadingRow } from '@/components/common/PageState';
import {
    MIN_TOUCH_TARGET_PX,
    tableContainerTouchScrollSx,
    tablePaginationTouchSx,
    touchIconButtonSx,
} from '@/constants/touch';

export type StudentConsultationsPanelProps = {
    studentId: string;
};

export const StudentConsultationsPanel: React.FC<StudentConsultationsPanelProps> = ({ studentId }) => {
    const { profile } = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    const [rows, setRows] = useState<ConsultationRow[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        content: '',
        date: new Date().toISOString().slice(0, 10),
    });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await listConsultationsByStudentPage(studentId, page, rowsPerPage);
            setRows(res.rows);
            setTotal(res.total);
            if (res.rows.length === 0 && page > 0) {
                setPage((p) => Math.max(0, p - 1));
            }
        } catch (e) {
            console.error(e);
            enqueueSnackbar(ui.adminConsultations.studentPanelLoadError, { variant: 'error' });
        } finally {
            setLoading(false);
        }
    }, [studentId, page, rowsPerPage, enqueueSnackbar]);

    useEffect(() => {
        void load();
    }, [load]);

    useEffect(() => {
        setPage(0);
    }, [studentId]);

    const submit = async () => {
        if (!profile) {
            enqueueSnackbar(ui.common.errorShort, { variant: 'error' });
            return;
        }
        if (!form.content.trim() || !form.date.trim()) {
            enqueueSnackbar(ui.adminConsultations.panelSubmitValidationWarning, { variant: 'warning' });
            return;
        }
        setSubmitting(true);
        try {
            const res = await createConsultation({
                student_id: studentId,
                teacher_id: profile.id,
                content: form.content.trim(),
                date: form.date,
            });
            if (res.success) {
                enqueueSnackbar(ui.adminConsultations.createSuccess, { variant: 'success' });
                setOpen(false);
                setForm({
                    content: '',
                    date: new Date().toISOString().slice(0, 10),
                });
                await load();
            } else {
                enqueueSnackbar(res.error ?? ui.common.errorShort, { variant: 'error' });
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm(ui.adminConsultations.deleteConfirm)) return;
        const res = await deleteConsultation(id);
        if (res.success) {
            enqueueSnackbar(ui.adminConsultations.deleteSuccess, { variant: 'success' });
            await load();
        } else {
            enqueueSnackbar(res.error ?? ui.adminConsultations.deleteFailed, { variant: 'error' });
        }
    };

    const openAdd = () => {
        setForm({
            content: '',
            date: new Date().toISOString().slice(0, 10),
        });
        setOpen(true);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<AddIcon />}
                    onClick={openAdd}
                    sx={{ minHeight: MIN_TOUCH_TARGET_PX }}
                >
                    {ui.adminConsultations.add}
                </Button>
            </Box>
            <TableContainer component={Paper} variant="outlined" sx={tableContainerTouchScrollSx}>
                <Table size="small" aria-label={ui.adminConsultations.studentTableAriaLabel}>
                    <TableHead>
                        <TableRow>
                            <TableCell>{ui.adminConsultations.date}</TableCell>
                            <TableCell>{ui.adminConsultations.content}</TableCell>
                            <TableCell width={56} sx={{ position: 'relative' }}>
                                <Box component="span" sx={visuallyHidden}>
                                    {ui.common.tableActionsHeader}
                                </Box>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableLoadingRow colSpan={3} message={ui.common.loading} />
                        ) : rows.length === 0 ? (
                            <TableEmptyRow colSpan={3} message={ui.adminConsultations.tableEmpty} />
                        ) : (
                            rows.map((r) => (
                                <TableRow key={r.id}>
                                    <TableCell>{r.date}</TableCell>
                                    <TableCell sx={{ maxWidth: 360, whiteSpace: 'pre-wrap' }}>
                                        {r.content || ui.adminConsultations.summaryEmpty}
                                    </TableCell>
                                    <TableCell>
                                        <IconButton
                                            size="small"
                                            aria-label={ui.adminConsultations.delete}
                                            onClick={() => void handleDelete(r.id)}
                                            sx={touchIconButtonSx}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
                <TablePagination
                    component="div"
                    count={total}
                    page={page}
                    onPageChange={(_, p) => setPage(p)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    labelRowsPerPage={ui.pagination.labelRowsPerPage}
                    labelDisplayedRows={({ from, to, count }) =>
                        count === 0 ? '0 / 0' : `${from}-${to} / ${count}`
                    }
                    sx={tablePaginationTouchSx}
                />
            </TableContainer>

            <FormDialog
                open={open}
                onClose={() => setOpen(false)}
                title={ui.adminConsultations.add}
                onPrimary={() => void submit()}
                primaryLoading={submitting}
            >
                <TextField
                    label={ui.adminConsultations.date}
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    slotProps={{ inputLabel: { shrink: true } }}
                    fullWidth
                    required
                />
                <TextField
                    label={ui.adminConsultations.content}
                    value={form.content}
                    onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                    fullWidth
                    required
                    multiline
                    minRows={4}
                />
            </FormDialog>
        </Box>
    );
};
