import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
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
    TextField,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useAuth } from '@/contexts/AuthContext';
import { ui } from '@/i18n/ui';
import { usePageTopBar } from '@/contexts/PageTopBarContext';
import {
    appointBranchAdmin,
    demoteBranchAdmin,
    listAllAcademies,
    listBranchAdmins,
    type AcademyRow,
    type BranchAdminRow,
} from '@/services/platformAdmin.service';
import { tableContainerTouchScrollSx } from '@/constants/touch';

const BranchAdminsPage: React.FC = () => {
    const { enqueueSnackbar } = useSnackbar();
    const { profile } = useAuth();
    usePageTopBar({ title: ui.platformBranchAdmins.title });

    const [academies, setAcademies] = useState<AcademyRow[]>([]);
    const [academyId, setAcademyId] = useState<string>('');
    const [admins, setAdmins] = useState<BranchAdminRow[]>([]);
    const [emailInput, setEmailInput] = useState('');
    const [loadingList, setLoadingList] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [demoteTarget, setDemoteTarget] = useState<BranchAdminRow | null>(null);
    const [tablePage, setTablePage] = useState(0);
    const [tableRowsPerPage, setTableRowsPerPage] = useState(10);

    const refreshAdmins = useCallback(async () => {
        if (!academyId) {
            setAdmins([]);
            return;
        }
        setLoadingList(true);
        const rows = await listBranchAdmins(academyId);
        setAdmins(rows);
        setLoadingList(false);
    }, [academyId]);

    useEffect(() => {
        void (async () => {
            const rows = await listAllAcademies();
            setAcademies(rows);
            setAcademyId((prev) => prev || rows[0]?.id || '');
        })();
    }, []);

    useEffect(() => {
        void refreshAdmins();
    }, [refreshAdmins]);

    useEffect(() => {
        setTablePage(0);
    }, [academyId]);

    const adminCount = admins.length;
    useEffect(() => {
        setTablePage((p) => {
            const maxP = adminCount === 0 ? 0 : Math.max(0, Math.ceil(adminCount / tableRowsPerPage) - 1);
            return Math.min(p, maxP);
        });
    }, [adminCount, tableRowsPerPage]);

    const pagedAdmins = useMemo(() => {
        const start = tablePage * tableRowsPerPage;
        return admins.slice(start, start + tableRowsPerPage);
    }, [admins, tablePage, tableRowsPerPage]);

    const handleAppoint = async () => {
        if (!academyId) return;
        setSubmitting(true);
        const { error } = await appointBranchAdmin(academyId, emailInput);
        setSubmitting(false);
        if (error) {
            enqueueSnackbar(error.message, { variant: 'error' });
            return;
        }
        enqueueSnackbar(ui.platformBranchAdmins.successAppoint, { variant: 'success' });
        setEmailInput('');
        void refreshAdmins();
    };

    const confirmDemote = async () => {
        if (!demoteTarget || !academyId) return;
        if (demoteTarget.id === profile?.id) {
            enqueueSnackbar(ui.platformBranchAdmins.cannotDemoteSelf, { variant: 'warning' });
            setDemoteTarget(null);
            return;
        }
        setSubmitting(true);
        const { error } = await demoteBranchAdmin(academyId, demoteTarget.id);
        setSubmitting(false);
        setDemoteTarget(null);
        if (error) {
            enqueueSnackbar(error.message, { variant: 'error' });
            return;
        }
        enqueueSnackbar(ui.platformBranchAdmins.successDemote, { variant: 'success' });
        void refreshAdmins();
    };

    return (
        <Container maxWidth="md" sx={{ mt: { xs: 1, sm: 2 }, py: { xs: 1, sm: 2 } }}>
                <Paper sx={{ p: 2, mb: 2 }}>
                    <FormControl fullWidth size="small">
                        <InputLabel id="branch-select-label">{ui.platformBranchAdmins.selectBranch}</InputLabel>
                        <Select
                            labelId="branch-select-label"
                            label={ui.platformBranchAdmins.selectBranch}
                            value={academyId}
                            onChange={(e) => setAcademyId(e.target.value)}
                        >
                            {academies.map((a) => (
                                <MenuItem key={a.id} value={a.id}>
                                    {a.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Paper>

                <Paper sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        {ui.platformBranchAdmins.appointSection}
                    </Typography>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: 1.5,
                            alignItems: { sm: 'flex-start' },
                        }}
                    >
                        <TextField
                            fullWidth
                            size="small"
                            type="email"
                            label={ui.platformBranchAdmins.emailPlaceholder}
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            autoComplete="email"
                        />
                        <Button
                            variant="contained"
                            onClick={() => void handleAppoint()}
                            disabled={submitting || !academyId || !emailInput.trim()}
                            sx={{ minHeight: 44, flexShrink: 0 }}
                        >
                            {ui.platformBranchAdmins.appoint}
                        </Button>
                    </Box>
                </Paper>

                <Paper sx={{ p: { xs: 1, sm: 2 } }}>
                    <TableContainer sx={tableContainerTouchScrollSx}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>{ui.platformBranchAdmins.nameCol}</TableCell>
                                    <TableCell>{ui.platformBranchAdmins.emailCol}</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                                        {ui.platformBranchAdmins.phoneCol}
                                    </TableCell>
                                    <TableCell align="right">{ui.platformBranchAdmins.actionsCol}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {!loadingList && admins.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4}>
                                            <Typography color="text.secondary" variant="body2">
                                                {ui.platformBranchAdmins.emptyAdmins}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                                {pagedAdmins.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell>{row.name}</TableCell>
                                        <TableCell>{row.email}</TableCell>
                                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                                            {row.phone || '—'}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Button
                                                size="small"
                                                color="error"
                                                variant="outlined"
                                                disabled={row.id === profile?.id}
                                                onClick={() => setDemoteTarget(row)}
                                                sx={{ minHeight: 44, minWidth: 44 }}
                                            >
                                                {ui.platformBranchAdmins.demote}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {admins.length > 0 ? (
                            <TablePagination
                                component="div"
                                count={admins.length}
                                page={tablePage}
                                onPageChange={(_, p) => setTablePage(p)}
                                rowsPerPage={tableRowsPerPage}
                                onRowsPerPageChange={(e) => {
                                    setTableRowsPerPage(parseInt(e.target.value, 10));
                                    setTablePage(0);
                                }}
                                rowsPerPageOptions={[5, 10, 25]}
                                labelRowsPerPage={ui.pagination.labelRowsPerPage}
                                labelDisplayedRows={({ from, to, count }) =>
                                    count === 0 ? '0 / 0' : `${from}-${to} / ${count}`
                                }
                            />
                        ) : null}
                    </TableContainer>
                </Paper>

            <Dialog open={Boolean(demoteTarget)} onClose={() => setDemoteTarget(null)} fullWidth maxWidth="xs">
                <DialogTitle>{ui.platformBranchAdmins.demoteConfirmTitle}</DialogTitle>
                <DialogContent>
                    <Typography variant="body2">{ui.platformBranchAdmins.demoteConfirmBody}</Typography>
                    {demoteTarget && (
                        <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>
                            {demoteTarget.name} ({demoteTarget.email})
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDemoteTarget(null)}>{ui.platformBranchAdmins.cancel}</Button>
                    <Button color="error" variant="contained" onClick={() => void confirmDemote()} disabled={submitting}>
                        {ui.platformBranchAdmins.confirm}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default BranchAdminsPage;
