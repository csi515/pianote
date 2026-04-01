import React, { useState } from 'react';
import {
    Box,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Menu,
    MenuItem,
    Tooltip,
    TablePagination,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import { ui } from '@/i18n/ui';
import type { StudentWithParent } from '@/services/students.service';
import type { StudentTextbookPaymentRowStatus } from '@/services/textbooks.service';
import { TableEmptyRow, TableLoadingRow } from '@/components/common/PageState';
import { MIN_TOUCH_TARGET_PX, tablePaginationTouchSx, touchIconButtonSx } from '@/constants/touch';

function memoPreviewText (memo: string | null | undefined): string {
    const t = memo?.trim();
    return t || '—';
}

interface StudentManagementTableProps {
    students: StudentWithParent[];
    textbookPaymentByStudent: Record<string, StudentTextbookPaymentRowStatus>;
    loading: boolean;
    totalCount: number;
    page: number;
    rowsPerPage: number;
    onPageChange: (page: number) => void;
    onRowsPerPageChange: (rowsPerPage: number) => void;
    onEdit: (student: StudentWithParent) => void;
    onDelete: (student: StudentWithParent) => void;
    onActiveChange: (student: StudentWithParent, active: boolean) => void;
    /** 테이블 상단에 표시할 학생 추가 액션(전역 TopBar와 중복되지 않도록 여기 배치) */
    onAddStudent?: () => void;
}

export const StudentManagementTable: React.FC<StudentManagementTableProps> = ({
    students,
    textbookPaymentByStudent,
    loading,
    totalCount,
    page,
    rowsPerPage,
    onPageChange,
    onRowsPerPageChange,
    onEdit,
    onDelete,
    onActiveChange,
    onAddStudent,
}) => {
    const theme = useTheme();
    const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));
    const isXs = !isSmUp;

    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [menuStudent, setMenuStudent] = useState<StudentWithParent | null>(null);

    const openStatusMenu = (event: React.MouseEvent<HTMLElement>, student: StudentWithParent) => {
        setMenuAnchor(event.currentTarget);
        setMenuStudent(student);
    };

    const closeStatusMenu = () => {
        setMenuAnchor(null);
        setMenuStudent(null);
    };
    const colSpan = isXs ? 5 : 9;

    /** 교재비 열: TEXTBOOK_FEES / TERMINOLOGY 와 같이 활성 학생만 none/paid/unpaid. 비활성은 집계 제외(—). */
    const renderTextbookFeeCell = (student: StudentWithParent) => {
        if (!student.active) {
            return (
                <Tooltip title={ui.adminStudents.textbookFeeInactiveHint}>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        component="span"
                        aria-label={ui.adminStudents.textbookFeeStatusAriaInactive}
                    >
                        —
                    </Typography>
                </Tooltip>
            );
        }
        const status = textbookPaymentByStudent[student.id] ?? 'none';
        if (status === 'none') {
            return (
                <Typography
                    variant="body2"
                    color="text.secondary"
                    component="span"
                    aria-label={ui.adminStudents.textbookFeeStatusAriaNone}
                >
                    —
                </Typography>
            );
        }
        if (status === 'unpaid') {
            return (
                <Chip
                    label={ui.adminStudents.textbookFeeUnpaidChip}
                    color="warning"
                    size="small"
                    aria-label={ui.adminStudents.textbookFeeStatusAriaUnpaid}
                />
            );
        }
        return (
            <Chip
                label={ui.adminStudents.textbookFeePaidChip}
                color="success"
                size="small"
                aria-label={ui.adminStudents.textbookFeeStatusAriaPaid}
            />
        );
    };

    return (
        <Box sx={{ width: '100%' }}>
            {onAddStudent && (
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        mb: 2,
                    }}
                >
                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<AddIcon />}
                        onClick={onAddStudent}
                        sx={{ minHeight: MIN_TOUCH_TARGET_PX }}
                    >
                        {ui.adminStudents.addStudent}
                    </Button>
                </Box>
            )}
            <Paper
                sx={{
                    minWidth: { xs: '100%', sm: 'auto' },
                    overflow: 'hidden',
                }}
            >
                <TableContainer
                    sx={{
                        overflow: 'auto',
                        WebkitOverflowScrolling: 'touch',
                        maxHeight: { xs: 'min(70vh, 560px)', sm: 'none' },
                    }}
                >
                    <Table
                        stickyHeader={isXs}
                        size="small"
                        aria-label={ui.adminStudents.tableAriaLabel}
                        sx={{
                            minWidth: isXs ? 640 : undefined,
                            '& .MuiTableCell-head': {
                                backgroundColor: 'background.paper',
                            },
                        }}
                    >
                <TableHead>
                    <TableRow>
                        <TableCell>{ui.adminStudents.tableColName}</TableCell>
                        <TableCell>{ui.adminStudents.tableColGrade}</TableCell>
                        {!isXs ? (
                            <>
                                <TableCell sx={{ minWidth: 120, maxWidth: 280 }}>
                                    {ui.adminStudents.tableColMemo}
                                </TableCell>
                                <TableCell>{ui.adminStudents.tableColParent}</TableCell>
                                <TableCell>{ui.adminStudents.tableColEnrollment}</TableCell>
                                <TableCell>{ui.adminStudents.tableColLeftAcademy}</TableCell>
                            </>
                        ) : null}
                        <TableCell>{ui.adminStudents.tableColStatus}</TableCell>
                        <TableCell>
                            <Tooltip title={ui.adminStudents.tableColTextbookFeeHint}>
                                <span>{ui.adminStudents.tableColTextbookFee}</span>
                            </Tooltip>
                        </TableCell>
                        <TableCell align="right">{ui.adminStudents.tableColActions}</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {loading ? (
                        <TableLoadingRow colSpan={colSpan} message={ui.common.loading} />
                    ) : students.length === 0 ? (
                        <TableEmptyRow colSpan={colSpan} message={ui.adminStudents.tableEmpty} />
                    ) : (
                        students.map((student) => (
                            <TableRow key={student.id} hover>
                                    <TableCell>{student.name}</TableCell>
                                    <TableCell>{student.grade?.trim() ? student.grade : '—'}</TableCell>
                                    {!isXs ? (
                                        <>
                                            <TableCell
                                                sx={{
                                                    maxWidth: { xs: 140, sm: 260 },
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                                title={memoPreviewText(student.memo)}
                                            >
                                                {memoPreviewText(student.memo)}
                                            </TableCell>
                                            <TableCell>
                                                {student.parent_phone?.trim() ? student.parent_phone : '—'}
                                            </TableCell>
                                            <TableCell>{student.enrollment_date}</TableCell>
                                            <TableCell>
                                                {student.left_academy_date?.trim()
                                                    ? student.left_academy_date
                                                    : '—'}
                                            </TableCell>
                                        </>
                                    ) : null}
                                    <TableCell>
                                        {student.active ? (
                                            <Chip
                                                label={ui.adminStudents.chipActive}
                                                color="success"
                                                size="small"
                                                aria-label={`${student.name} ${ui.adminStudents.chipActive}`}
                                            />
                                        ) : (
                                            <Chip
                                                label={ui.adminStudents.chipInactive}
                                                color="default"
                                                size="small"
                                                aria-label={`${student.name} ${ui.adminStudents.chipInactive}`}
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell>{renderTextbookFeeCell(student)}</TableCell>
                                    <TableCell align="right">
                                        <Tooltip title={ui.adminStudents.manage}>
                                            <IconButton
                                                size="small"
                                                aria-label={`${student.name} ${ui.adminStudents.manage}`}
                                                aria-haspopup="menu"
                                                aria-expanded={Boolean(menuAnchor) && menuStudent?.id === student.id}
                                                onClick={(e) => openStatusMenu(e, student)}
                                                sx={touchIconButtonSx}
                                            >
                                                <ManageAccountsIcon />
                                            </IconButton>
                                        </Tooltip>
                                        {!isXs ? (
                                            <>
                                                <IconButton
                                                    size="small"
                                                    aria-label={`${student.name} ${ui.adminStudents.editAria}`}
                                                    onClick={() => onEdit(student)}
                                                    sx={touchIconButtonSx}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    aria-label={`${student.name} ${ui.adminStudents.deleteAria}`}
                                                    onClick={() => onDelete(student)}
                                                    sx={touchIconButtonSx}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </>
                                        ) : null}
                                    </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                component="div"
                count={totalCount}
                page={page}
                onPageChange={(_, p) => onPageChange(p)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                    onRowsPerPageChange(parseInt(e.target.value, 10));
                    onPageChange(0);
                }}
                rowsPerPageOptions={[5, 10, 25, 50]}
                labelRowsPerPage={ui.pagination.labelRowsPerPage}
                labelDisplayedRows={({ from, to, count }) =>
                    count === 0 ? '0 / 0' : `${from + 1}-${to + 1} / ${count}`
                }
                sx={tablePaginationTouchSx}
                />
            </Paper>
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={closeStatusMenu}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                {isXs ? (
                    <MenuItem
                        sx={{ minHeight: MIN_TOUCH_TARGET_PX }}
                        onClick={() => {
                            if (menuStudent) onEdit(menuStudent);
                            closeStatusMenu();
                        }}
                    >
                        {ui.adminStudents.editAria}
                    </MenuItem>
                ) : null}
                <MenuItem
                    sx={{ minHeight: MIN_TOUCH_TARGET_PX }}
                    disabled={menuStudent?.active === true}
                    onClick={() => {
                        if (menuStudent) onActiveChange(menuStudent, true);
                        closeStatusMenu();
                    }}
                >
                    {ui.adminStudents.setActive}
                </MenuItem>
                <MenuItem
                    sx={{ minHeight: MIN_TOUCH_TARGET_PX }}
                    disabled={menuStudent?.active === false}
                    onClick={() => {
                        if (menuStudent) onActiveChange(menuStudent, false);
                        closeStatusMenu();
                    }}
                >
                    {ui.adminStudents.setInactive}
                </MenuItem>
                {isXs ? (
                    <MenuItem
                        sx={{ minHeight: MIN_TOUCH_TARGET_PX, color: 'error.main' }}
                        onClick={() => {
                            if (menuStudent) onDelete(menuStudent);
                            closeStatusMenu();
                        }}
                    >
                        {ui.adminStudents.deleteAria}
                    </MenuItem>
                ) : null}
            </Menu>
        </Box>
    );
};
