import React, { useCallback, useEffect, useId, useState } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
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
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSnackbar } from 'notistack';
import {
    listMediaByStudentPage,
    createMedia,
    deleteMedia,
    type MediaRow,
} from '@/services/media.service';
import visuallyHidden from '@mui/utils/visuallyHidden';
import { ui } from '@/i18n/ui';
import { TableEmptyRow, TableLoadingRow } from '@/components/common/PageState';
import { MIN_TOUCH_TARGET_PX, tablePaginationTouchSx, touchButtonSx, touchIconButtonSx } from '@/constants/touch';

export type StudentMediaPanelProps = {
    studentId: string;
};

export const StudentMediaPanel: React.FC<StudentMediaPanelProps> = ({ studentId }) => {
    const theme = useTheme();
    const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));
    const isXs = !isSmUp;
    const addDialogTitleId = useId();
    const { enqueueSnackbar } = useSnackbar();
    const [rows, setRows] = useState<MediaRow[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        youtube_url: '',
        thumbnail: '',
        title: '',
    });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await listMediaByStudentPage(studentId, page, rowsPerPage);
            setRows(res.rows);
            setTotal(res.total);
            if (res.rows.length === 0 && page > 0) {
                setPage((p) => Math.max(0, p - 1));
            }
        } catch (e) {
            console.error(e);
            enqueueSnackbar(ui.adminMedia.studentPanelLoadError, { variant: 'error' });
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
        const url = form.youtube_url.trim();
        if (!url) {
            enqueueSnackbar(ui.adminMedia.requiredUrlWarning, { variant: 'warning' });
            return;
        }
        const res = await createMedia({
            student_id: studentId,
            youtube_url: url,
            thumbnail: form.thumbnail.trim() || null,
            title: form.title.trim() || null,
            curriculum_id: null,
        });
        if (res.success) {
            enqueueSnackbar(ui.adminMedia.createSuccess, { variant: 'success' });
            setOpen(false);
            setForm({ youtube_url: '', thumbnail: '', title: '' });
            await load();
        } else {
            enqueueSnackbar(res.error ?? ui.adminMedia.genericFailed, { variant: 'error' });
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm(ui.adminMedia.deleteConfirm)) return;
        const res = await deleteMedia(id);
        if (res.success) {
            enqueueSnackbar(ui.adminMedia.deleteSuccess, { variant: 'success' });
            await load();
        } else {
            enqueueSnackbar(res.error ?? ui.adminMedia.deleteFailed, { variant: 'error' });
        }
    };

    const openAdd = () => {
        setForm({ youtube_url: '', thumbnail: '', title: '' });
        setOpen(true);
    };

    const colSpan = isXs ? 2 : 4;

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
                    {ui.adminMedia.add}
                </Button>
            </Box>
            <Typography variant="body2" color="text.secondary">
                {ui.adminMedia.studentPanelHint}
            </Typography>
            <TableContainer component={Paper} variant="outlined">
                <Table size="small" aria-label={ui.adminMedia.studentTableAriaLabel}>
                    <TableHead>
                        <TableRow>
                            <TableCell>{ui.adminMedia.videoTitle}</TableCell>
                            {!isXs ? (
                                <>
                                    <TableCell>{ui.adminMedia.tableColUrl}</TableCell>
                                    <TableCell>{ui.adminMedia.tableColUploadedAt}</TableCell>
                                </>
                            ) : null}
                            <TableCell width={56} sx={{ position: 'relative' }}>
                                <Box component="span" sx={visuallyHidden}>
                                    {ui.common.tableActionsHeader}
                                </Box>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableLoadingRow colSpan={colSpan} message={ui.common.loading} />
                        ) : rows.length === 0 ? (
                            <TableEmptyRow colSpan={colSpan} message={ui.adminMedia.emptyList} />
                        ) : (
                            rows.map((r) => (
                                <TableRow key={r.id}>
                                    <TableCell>{r.title ?? '—'}</TableCell>
                                    {!isXs ? (
                                        <>
                                            <TableCell
                                                sx={{
                                                    maxWidth: 200,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                }}
                                            >
                                                <a href={r.youtube_url} target="_blank" rel="noreferrer">
                                                    {r.youtube_url}
                                                </a>
                                            </TableCell>
                                            <TableCell>
                                                {r.uploaded_at
                                                    ? new Date(r.uploaded_at).toLocaleString()
                                                    : '—'}
                                            </TableCell>
                                        </>
                                    ) : null}
                                    <TableCell>
                                        <IconButton
                                            size="small"
                                            aria-label={ui.adminMedia.delete}
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
                        count === 0 ? '0 / 0' : `${from + 1}-${to + 1} / ${count}`
                    }
                    sx={tablePaginationTouchSx}
                />
            </TableContainer>

            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                fullWidth
                maxWidth="sm"
                scroll="paper"
                aria-labelledby={addDialogTitleId}
            >
                <DialogTitle component="h2" id={addDialogTitleId}>
                    {ui.adminMedia.add}
                </DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                    <TextField
                        label={ui.adminMedia.youtubeUrl}
                        value={form.youtube_url}
                        onChange={(e) => setForm((f) => ({ ...f, youtube_url: e.target.value }))}
                        fullWidth
                        required
                    />
                    <TextField
                        label={ui.adminMedia.thumbnailUrl}
                        value={form.thumbnail}
                        onChange={(e) => setForm((f) => ({ ...f, thumbnail: e.target.value }))}
                        fullWidth
                    />
                    <TextField
                        label={ui.adminMedia.videoTitle}
                        value={form.title}
                        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                        fullWidth
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)} sx={touchButtonSx}>
                        {ui.adminPayments.cancel}
                    </Button>
                    <Button variant="contained" onClick={() => void submit()} sx={touchButtonSx}>
                        {ui.adminPayments.save}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
