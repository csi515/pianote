import React from 'react';
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
    Tooltip,
    Typography,
    useMediaQuery,
    useTheme,
    Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { ui } from '@/i18n/ui';
import type { StudentWithParent } from '@/services/students.service';
import type { StudentTextbookPaymentRowStatus } from '@/services/textbooks.service';
import { TableEmptyRow, TableLoadingRow } from '@/components/common/PageState';
import {
    AdminTablePaginationBar,
    MobileCardList,
    MobileCardListItem,
    MobileStackedCard,
} from '@/components/common/adminTable';
import { MIN_TOUCH_TARGET_PX, tableContainerTouchScrollSx, touchIconButtonSx } from '@/constants/touch';

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
    /** 테이블 상단에 표시할 학생 추가 액션(전역 TopBar와 중복되지 않도록 여기 배치) */
    onAddStudent?: () => void;
}

function FieldRow ({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ flexWrap: 'wrap' }}>
            <Typography component="span" variant="caption" color="text.secondary" sx={{ minWidth: 72 }}>
                {label}
            </Typography>
            <Typography component="span" variant="body2" sx={{ flex: 1, minWidth: 0 }}>
                {value}
            </Typography>
        </Stack>
    );
}

/** 테이블·카드 공통: 이름 옆에 작은 활성/비활성 문구 */
function StudentNameWithStatus ({
    student,
    nameVariant = 'body2',
}: {
    student: StudentWithParent;
    nameVariant?: 'body2' | 'subtitle1';
}) {
    const statusLabel = student.active ? ui.adminStudents.chipActive : ui.adminStudents.chipInactive;
    return (
        <Stack direction="row" alignItems="baseline" spacing={0.75} flexWrap="wrap" component="span">
            <Typography component="span" variant={nameVariant} fontWeight={600}>
                {student.name}
            </Typography>
            <Typography
                component="span"
                variant="caption"
                color={student.active ? 'success.main' : 'text.secondary'}
                sx={{ fontSize: '0.7rem', lineHeight: 1.2 }}
                aria-label={`${student.name} ${statusLabel}`}
            >
                {statusLabel}
            </Typography>
        </Stack>
    );
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
    onAddStudent,
}) => {
    const theme = useTheme();
    const isMobileList = useMediaQuery(theme.breakpoints.down('md'));

    const colSpan = 7;

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

    const renderMobileCard = (student: StudentWithParent) => (
        <MobileCardListItem key={student.id}>
            <MobileStackedCard
                actions={
                    <>
                        <Tooltip title={ui.adminStudents.editAria}>
                            <IconButton
                                size="small"
                                aria-label={`${student.name} ${ui.adminStudents.editAria}`}
                                onClick={() => onEdit(student)}
                                sx={touchIconButtonSx}
                            >
                                <EditIcon />
                            </IconButton>
                        </Tooltip>
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
                }
            >
                <Stack spacing={1.25}>
                    <Box component="h3" sx={{ m: 0 }}>
                        <StudentNameWithStatus student={student} nameVariant="subtitle1" />
                    </Box>
                    <FieldRow
                        label={ui.adminStudents.tableColGrade}
                        value={student.grade?.trim() ? student.grade : '—'}
                    />
                    <FieldRow label={ui.adminStudents.tableColMemo} value={memoPreviewText(student.memo)} />
                    <FieldRow
                        label={ui.adminStudents.tableColParent}
                        value={student.parent_phone?.trim() ? student.parent_phone : '—'}
                    />
                    <FieldRow label={ui.adminStudents.tableColEnrollment} value={student.enrollment_date} />
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Tooltip title={ui.adminStudents.tableColTextbookFeeHint}>
                            <Typography variant="caption" color="text.secondary" component="span">
                                {ui.adminStudents.tableColTextbookFee}
                            </Typography>
                        </Tooltip>
                        <Box component="span">{renderTextbookFeeCell(student)}</Box>
                    </Stack>
                </Stack>
            </MobileStackedCard>
        </MobileCardListItem>
    );

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
                    borderRadius: { xs: 0, sm: 1 },
                }}
            >
                {isMobileList ? (
                    <>
                        <Box sx={{ px: { xs: 0, sm: 2 }, py: { xs: 0, sm: 2 } }}>
                            {loading ? (
                                <Typography color="text.secondary" textAlign="center" py={3}>
                                    {ui.common.loading}
                                </Typography>
                            ) : students.length === 0 ? (
                                <Typography color="text.secondary" textAlign="center" py={3}>
                                    {ui.adminStudents.tableEmpty}
                                </Typography>
                            ) : (
                                <MobileCardList>{students.map(renderMobileCard)}</MobileCardList>
                            )}
                        </Box>
                        <AdminTablePaginationBar
                            count={totalCount}
                            page={page}
                            rowsPerPage={rowsPerPage}
                            onPageChange={onPageChange}
                            onRowsPerPageChange={(n) => {
                                onRowsPerPageChange(n);
                                onPageChange(0);
                            }}
                        />
                    </>
                ) : (
                    <>
                        <TableContainer sx={tableContainerTouchScrollSx}>
                            <Table
                                size="small"
                                aria-label={ui.adminStudents.tableAriaLabel}
                                sx={{
                                    '& .MuiTableCell-head': {
                                        backgroundColor: 'background.paper',
                                    },
                                }}
                            >
                                <TableHead>
                                    <TableRow>
                                        <TableCell>{ui.adminStudents.tableColName}</TableCell>
                                        <TableCell>{ui.adminStudents.tableColGrade}</TableCell>
                                        <TableCell sx={{ minWidth: 120, maxWidth: 280 }}>
                                            {ui.adminStudents.tableColMemo}
                                        </TableCell>
                                        <TableCell>{ui.adminStudents.tableColParent}</TableCell>
                                        <TableCell>{ui.adminStudents.tableColEnrollment}</TableCell>
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
                                                <TableCell>
                                                    <StudentNameWithStatus student={student} />
                                                </TableCell>
                                                <TableCell>{student.grade?.trim() ? student.grade : '—'}</TableCell>
                                                <TableCell
                                                    sx={{
                                                        maxWidth: 260,
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
                                                <TableCell>{renderTextbookFeeCell(student)}</TableCell>
                                                <TableCell align="right">
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
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <AdminTablePaginationBar
                            count={totalCount}
                            page={page}
                            rowsPerPage={rowsPerPage}
                            onPageChange={onPageChange}
                            onRowsPerPageChange={(n) => {
                                onRowsPerPageChange(n);
                                onPageChange(0);
                            }}
                        />
                    </>
                )}
            </Paper>
        </Box>
    );
};
