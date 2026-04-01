import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';
import {
    Box,
    Button,
    CircularProgress,
    Container,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Paper,
    Typography,
    TablePagination,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import {
    DndContext,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragStartEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { TextbookCatalogSortableItem } from '@/components/admin/textbooks/TextbookCatalogSortableItem';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/contexts/AuthContext';
import { usePageTopBar } from '@/contexts/PageTopBarContext';
import { useSnackbar } from 'notistack';
import {
    listTextbooks,
    createTextbook,
    updateTextbook,
    deleteTextbook,
    reorderTextbooks,
} from '@/services/textbooks.service';
import type { Database } from '@/lib/supabase';
import { ui } from '@/i18n/ui';
import { tablePaginationTouchSx, touchButtonSx } from '@/constants/touch';

type TextbookRow = Database['public']['Tables']['textbooks']['Row'];

const TextbooksCatalogPage: React.FC = () => {
    const catalogDialogTitleId = useId();
    const { academy } = useAuth();
    usePageTopBar({ title: ui.adminTextbooks.catalogTitle, backTo: ROUTES.admin.dashboard });
    const { enqueueSnackbar } = useSnackbar();
    const [rows, setRows] = useState<TextbookRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [isReordering, setIsReordering] = useState(false);
    const [activeDragId, setActiveDragId] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<TextbookRow | null>(null);
    const [form, setForm] = useState({ name: '', price: '' });
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const load = useCallback(
        async (opts?: { silent?: boolean }) => {
            if (!academy) return;
            if (!opts?.silent) setLoading(true);
            try {
                const list = await listTextbooks(academy.id);
                setRows(list);
            } catch (e) {
                console.error(e);
                enqueueSnackbar(ui.adminTextbooks.catalogLoadError, { variant: 'error' });
            } finally {
                if (!opts?.silent) setLoading(false);
            }
        },
        [academy, enqueueSnackbar]
    );

    useEffect(() => {
        void load();
    }, [load]);

    const pagedRows = useMemo(() => {
        const start = page * rowsPerPage;
        return rows.slice(start, start + rowsPerPage);
    }, [rows, page, rowsPerPage]);

    useEffect(() => {
        const maxPage = rows.length === 0 ? 0 : Math.max(0, Math.ceil(rows.length / rowsPerPage) - 1);
        if (page > maxPage) {
            setPage(maxPage);
        }
    }, [rows.length, rowsPerPage, page]);

    const openCreate = () => {
        setEditing(null);
        setForm({ name: '', price: '' });
        setDialogOpen(true);
    };

    const openEdit = (row: TextbookRow) => {
        setEditing(row);
        setForm({ name: row.name, price: String(row.price) });
        setDialogOpen(true);
    };

    const submit = async () => {
        if (!academy) return;
        const price = Number(form.price);
        if (!form.name.trim() || Number.isNaN(price) || price < 0) {
            enqueueSnackbar(ui.adminTextbooks.formValidationError, { variant: 'warning' });
            return;
        }
        if (editing) {
            const { error } = await updateTextbook(editing.id, {
                name: form.name.trim(),
                price,
            });
            if (error) {
                enqueueSnackbar(error.message, { variant: 'error' });
                return;
            }
            enqueueSnackbar(ui.adminTextbooks.toastSaved, { variant: 'success' });
        } else {
            const { error } = await createTextbook({
                academy_id: academy.id,
                name: form.name.trim(),
                price,
            });
            if (error) {
                enqueueSnackbar(error.message, { variant: 'error' });
                return;
            }
            enqueueSnackbar(ui.adminTextbooks.toastCreated, { variant: 'success' });
        }
        setDialogOpen(false);
        void load();
    };

    const handleDelete = async (row: TextbookRow) => {
        if (!window.confirm(ui.adminTextbooks.deleteConfirm.replace('{name}', row.name))) return;
        const { error } = await deleteTextbook(row.id);
        if (error) {
            enqueueSnackbar(error.message, { variant: 'error' });
            return;
        }
        enqueueSnackbar(ui.adminTextbooks.deleteSuccess, { variant: 'success' });
        void load();
    };

    const applyReorder = useCallback(
        async (orderedIds: string[]) => {
            if (!academy) return;
            setIsReordering(true);
            try {
                const res = await reorderTextbooks(academy.id, orderedIds);
                if (res.success) {
                    enqueueSnackbar(ui.adminTextbooks.reorderSuccess, { variant: 'success' });
                    await load({ silent: true });
                } else {
                    enqueueSnackbar(res.error ?? ui.adminTextbooks.reorderFailed, { variant: 'error' });
                }
            } finally {
                setIsReordering(false);
            }
        },
        [academy, enqueueSnackbar, load]
    );

    const moveTextbook = (id: string, dir: -1 | 1) => {
        if (isReordering) return;
        const idx = rows.findIndex((x) => x.id === id);
        const j = idx + dir;
        if (j < 0 || j >= rows.length) return;
        const next = [...rows];
        [next[idx], next[j]] = [next[j], next[idx]];
        void applyReorder(next.map((r) => r.id));
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveDragId(String(event.active.id));
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveDragId(null);
        const { active, over } = event;
        if (!over || active.id === over.id || isReordering) return;
        const pageStart = page * rowsPerPage;
        const oldLocal = pagedRows.findIndex((r) => r.id === active.id);
        const newLocal = pagedRows.findIndex((r) => r.id === over.id);
        if (oldLocal < 0 || newLocal < 0) return;
        const oldIndex = pageStart + oldLocal;
        const newIndex = pageStart + newLocal;
        const next = arrayMove(rows, oldIndex, newIndex);
        void applyReorder(next.map((r) => r.id));
    };

    const handleDragCancel = () => {
        setActiveDragId(null);
    };

    const sortableIds = useMemo(() => pagedRows.map((r) => r.id), [pagedRows]);

    const activeRow = useMemo(
        () => (activeDragId ? rows.find((r) => r.id === activeDragId) : null),
        [activeDragId, rows]
    );

    return (
        <Container maxWidth="md" sx={{ py: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<AddIcon />}
                    onClick={openCreate}
                >
                    {ui.adminTextbooks.add}
                </Button>
            </Box>
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }} role="status">
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    {ui.adminTextbooks.catalogHint}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {ui.adminTextbooks.dndHint}
                </Typography>
            </Paper>

            {loading ? (
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 2,
                        py: 8,
                    }}
                    role="status"
                    aria-live="polite"
                >
                    <CircularProgress size={28} aria-hidden />
                    <Typography variant="body2" color="text.secondary">
                        {ui.common.loading}
                    </Typography>
                </Box>
            ) : rows.length === 0 ? (
                <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                    <Typography color="text.secondary">{ui.adminTextbooks.emptyCatalog}</Typography>
                </Paper>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragCancel={handleDragCancel}
                >
                    <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                        <Box
                            sx={{
                                maxHeight: { xs: 'none', md: '70vh' },
                                overflowY: { xs: 'visible', md: 'auto' },
                                pr: { md: 0.5 },
                            }}
                        >
                            {pagedRows.map((r, indexOnPage) => {
                                const globalIndex = page * rowsPerPage + indexOnPage;
                                return (
                                    <TextbookCatalogSortableItem
                                        key={r.id}
                                        row={r}
                                        onMoveUp={() => moveTextbook(r.id, -1)}
                                        onMoveDown={() => moveTextbook(r.id, 1)}
                                        onEdit={() => openEdit(r)}
                                        onDelete={() => void handleDelete(r)}
                                        disableUp={globalIndex === 0}
                                        disableDown={globalIndex === rows.length - 1}
                                        reorderDisabled={isReordering}
                                    />
                                );
                            })}
                        </Box>
                    </SortableContext>
                    <TablePagination
                        component="div"
                        count={rows.length}
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
                    <DragOverlay dropAnimation={null}>
                        {activeRow ? (
                            <Paper
                                elevation={8}
                                sx={{
                                    p: 2,
                                    maxWidth: 360,
                                    cursor: 'grabbing',
                                }}
                            >
                                <Typography fontWeight={600}>{activeRow.name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {activeRow.price.toLocaleString('ko-KR')}
                                    {ui.common.currencyWon}
                                </Typography>
                            </Paper>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            )}

            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                fullWidth
                maxWidth="xs"
                scroll="paper"
                aria-labelledby={catalogDialogTitleId}
            >
                <DialogTitle component="h2" id={catalogDialogTitleId}>
                    {editing ? ui.adminTextbooks.dialogTitleEdit : ui.adminTextbooks.dialogTitleAdd}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label={ui.adminTextbooks.name}
                        fullWidth
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        label={ui.adminTextbooks.price}
                        type="number"
                        fullWidth
                        value={form.price}
                        onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                        inputProps={{ min: 0 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)} sx={touchButtonSx}>
                        {ui.adminTextbooks.cancel}
                    </Button>
                    <Button variant="contained" onClick={() => void submit()} sx={touchButtonSx}>
                        {ui.common.save}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default TextbooksCatalogPage;
