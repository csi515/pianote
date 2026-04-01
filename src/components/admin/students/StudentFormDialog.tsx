import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Tabs,
    Tab,
    Box,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select,
    Switch,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import type { StudentWithParent } from '@/services/students.service';
import type { Database } from '@/lib/supabase';
import { MIN_TOUCH_TARGET_PX, touchButtonSx } from '@/constants/touch';
import { ui } from '@/i18n/ui';
import { StudentFormDialogTextbooksTab } from '@/components/admin/students/StudentFormDialogTextbooksTab';
import { StudentFormDialogMediaTab } from '@/components/admin/students/StudentFormDialogMediaTab';
import { StudentFormDialogConsultationsTab } from '@/components/admin/students/StudentFormDialogConsultationsTab';

type TextbookRow = Database['public']['Tables']['textbooks']['Row'];

export interface StudentFormData {
    name: string;
    grade: string;
    memo: string;
    parent_phone: string;
    /** YYYY-MM-DD */
    enrollment_date: string;
    /** 퇴원일(빈 문자열이면 재학 중) YYYY-MM-DD */
    left_academy_date: string;
    /** 월 회비(원), 빈 문자열이면 NULL */
    monthly_fee: string;
    /** 수정 시에만 의미 있음. 신규 등록은 항상 활성 */
    active: boolean;
}

interface StudentFormDialogProps {
    open: boolean;
    editingStudent: StudentWithParent | null;
    formData: StudentFormData;
    onFormChange: (next: StudentFormData) => void;
    onClose: () => void;
    onSave: () => void;
    textbookCatalog: TextbookRow[];
    /** 교재 지급·납부 변경 후 목록/집계 갱신 */
    onStudentTextbooksChanged?: (studentId: string) => void;
}

function tabPanelProps (index: number) {
    return {
        id: `student-form-tab-${index}`,
        'aria-labelledby': `student-form-tab-label-${index}`,
        role: 'tabpanel' as const,
    };
}

export const StudentFormDialog: React.FC<StudentFormDialogProps> = ({
    open,
    editingStudent,
    formData,
    onFormChange,
    onClose,
    onSave,
    textbookCatalog,
    onStudentTextbooksChanged,
}) => {
    const theme = useTheme();
    const isBelowMd = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true });
    const [tab, setTab] = useState(0);

    const tabLabels = [
        ui.adminStudents.dialogTabBasic,
        ui.adminStudents.dialogTabContactMemo,
        ui.adminStudents.dialogTabBilling,
        ui.adminStudents.dialogTabTextbooks,
        ui.adminStudents.dialogTabMedia,
        ui.adminStudents.dialogTabConsultations,
    ];

    useEffect(() => {
        if (open) setTab(0);
    }, [open]);

    const formatMoneyInput = (raw: string): string => {
        const digits = raw.replace(/[^\d]/g, '');
        if (!digits) return '';
        const n = Number(digits);
        if (!Number.isFinite(n)) return '';
        return n.toLocaleString('ko-KR');
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            scroll="paper"
            aria-labelledby="student-form-dialog-title"
            slotProps={{
                paper: {
                    sx: {
                        maxHeight: { xs: 'calc(100% - env(safe-area-inset-top, 0px) - 24px)', sm: 'none' },
                    },
                },
            }}
        >
            <DialogTitle component="h2" id="student-form-dialog-title">
                {editingStudent ? ui.adminStudents.dialogTitleEdit : ui.adminStudents.dialogTitleAdd}
            </DialogTitle>
            <DialogContent
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0,
                    overflowY: 'auto',
                    WebkitOverflowScrolling: 'touch',
                }}
            >
                {isBelowMd ? (
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel id="student-form-section-label" shrink>
                            {ui.adminStudents.dialogSectionSelectLabel}
                        </InputLabel>
                        <Select
                            labelId="student-form-section-label"
                            value={tab}
                            label={ui.adminStudents.dialogSectionSelectLabel}
                            onChange={(e) => setTab(Number(e.target.value))}
                            sx={{ minHeight: MIN_TOUCH_TARGET_PX }}
                        >
                            {tabLabels.map((label, i) => (
                                <MenuItem key={`student-form-tab-opt-${i}`} value={i}>
                                    {label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                ) : (
                    <Tabs
                        value={tab}
                        onChange={(_, v) => setTab(v)}
                        variant="scrollable"
                        scrollButtons="auto"
                        aria-label={ui.adminStudents.dialogTabsAriaLabel}
                        allowScrollButtonsMobile
                        sx={{
                            borderBottom: 1,
                            borderColor: 'divider',
                            mb: 2,
                            minHeight: MIN_TOUCH_TARGET_PX,
                            '& .MuiTabScrollButton-root': {
                                minWidth: MIN_TOUCH_TARGET_PX,
                                minHeight: MIN_TOUCH_TARGET_PX,
                            },
                        }}
                    >
                        <Tab
                            label={ui.adminStudents.dialogTabBasic}
                            id="student-form-tab-label-0"
                            aria-controls="student-form-tab-0"
                            sx={{ minHeight: MIN_TOUCH_TARGET_PX }}
                        />
                        <Tab
                            label={ui.adminStudents.dialogTabContactMemo}
                            id="student-form-tab-label-1"
                            aria-controls="student-form-tab-1"
                            sx={{ minHeight: MIN_TOUCH_TARGET_PX }}
                        />
                        <Tab
                            label={ui.adminStudents.dialogTabBilling}
                            id="student-form-tab-label-2"
                            aria-controls="student-form-tab-2"
                            sx={{ minHeight: MIN_TOUCH_TARGET_PX }}
                        />
                        <Tab
                            label={ui.adminStudents.dialogTabTextbooks}
                            id="student-form-tab-label-3"
                            aria-controls="student-form-tab-3"
                            sx={{ minHeight: MIN_TOUCH_TARGET_PX }}
                        />
                        <Tab
                            label={ui.adminStudents.dialogTabMedia}
                            id="student-form-tab-label-4"
                            aria-controls="student-form-tab-4"
                            sx={{ minHeight: MIN_TOUCH_TARGET_PX }}
                        />
                        <Tab
                            label={ui.adminStudents.dialogTabConsultations}
                            id="student-form-tab-label-5"
                            aria-controls="student-form-tab-5"
                            sx={{ minHeight: MIN_TOUCH_TARGET_PX }}
                        />
                    </Tabs>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }} {...tabPanelProps(0)} hidden={tab !== 0}>
                    {tab === 0 ? (
                        <>
                            <TextField
                                fullWidth
                                label={ui.adminStudents.studentNameLabel}
                                value={formData.name}
                                onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
                            />
                            <TextField
                                fullWidth
                                type="date"
                                label={ui.adminStudents.enrollmentDateLabel}
                                value={formData.enrollment_date}
                                onChange={(e) =>
                                    onFormChange({ ...formData, enrollment_date: e.target.value })
                                }
                                helperText={ui.adminStudents.enrollmentDateHelper}
                                slotProps={{ inputLabel: { shrink: true } }}
                            />
                            <TextField
                                fullWidth
                                type="date"
                                label={ui.adminStudents.leftAcademyDateLabel}
                                value={formData.left_academy_date}
                                onChange={(e) =>
                                    onFormChange({ ...formData, left_academy_date: e.target.value })
                                }
                                helperText={ui.adminStudents.leftAcademyDateHelper}
                                slotProps={{ inputLabel: { shrink: true } }}
                            />
                            {editingStudent ? (
                                <Box>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={formData.active}
                                                onChange={(_, v) =>
                                                    onFormChange({ ...formData, active: v })
                                                }
                                                color={formData.active ? 'success' : 'default'}
                                                inputProps={{
                                                    'aria-label': ui.adminStudents.activeStatusLabel,
                                                }}
                                            />
                                        }
                                        label={
                                            <Typography component="span" variant="body2">
                                                {ui.adminStudents.activeStatusLabel}
                                                <Typography
                                                    component="span"
                                                    variant="caption"
                                                    color="text.secondary"
                                                    sx={{ ml: 1 }}
                                                >
                                                    (
                                                    {formData.active
                                                        ? ui.adminStudents.chipActive
                                                        : ui.adminStudents.chipInactive}
                                                    )
                                                </Typography>
                                            </Typography>
                                        }
                                    />
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ display: 'block', pl: 0.5, mt: -0.5 }}
                                    >
                                        {ui.adminStudents.activeStatusHelper}
                                    </Typography>
                                </Box>
                            ) : null}
                            <TextField
                                fullWidth
                                label={ui.adminStudents.gradeLabel}
                                value={formData.grade}
                                onChange={(e) => onFormChange({ ...formData, grade: e.target.value })}
                                helperText={ui.adminStudents.gradeHelper}
                            />
                        </>
                    ) : null}
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }} {...tabPanelProps(1)} hidden={tab !== 1}>
                    {tab === 1 ? (
                        <>
                            <TextField
                                fullWidth
                                label={ui.adminStudents.parentPhoneLabel}
                                placeholder={ui.adminStudents.parentPhonePlaceholder}
                                value={formData.parent_phone}
                                onChange={(e) =>
                                    onFormChange({ ...formData, parent_phone: e.target.value })
                                }
                                helperText={ui.adminStudents.parentPhoneHelper}
                            />
                            <TextField
                                fullWidth
                                multiline
                                minRows={2}
                                label={ui.adminStudents.memoLabel}
                                value={formData.memo}
                                onChange={(e) => onFormChange({ ...formData, memo: e.target.value })}
                                helperText={ui.adminStudents.memoHelper}
                            />
                        </>
                    ) : null}
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }} {...tabPanelProps(2)} hidden={tab !== 2}>
                    {tab === 2 ? (
                        <TextField
                            fullWidth
                            type="text"
                            label={ui.adminStudents.monthlyFeeLabel}
                            value={formData.monthly_fee}
                            onChange={(e) =>
                                onFormChange({
                                    ...formData,
                                    monthly_fee: formatMoneyInput(e.target.value),
                                })
                            }
                            helperText={ui.adminStudents.monthlyFeeHelper}
                            slotProps={{ inputLabel: { shrink: true } }}
                            inputProps={{ inputMode: 'numeric' }}
                        />
                    ) : null}
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }} {...tabPanelProps(3)} hidden={tab !== 3}>
                    {tab === 3 ? (
                        <StudentFormDialogTextbooksTab
                            studentId={editingStudent?.id ?? null}
                            textbookCatalog={textbookCatalog}
                            onAssignmentsChanged={onStudentTextbooksChanged}
                        />
                    ) : null}
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }} {...tabPanelProps(4)} hidden={tab !== 4}>
                    {tab === 4 ? (
                        <StudentFormDialogMediaTab studentId={editingStudent?.id ?? null} />
                    ) : null}
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }} {...tabPanelProps(5)} hidden={tab !== 5}>
                    {tab === 5 ? (
                        <StudentFormDialogConsultationsTab studentId={editingStudent?.id ?? null} />
                    ) : null}
                </Box>
            </DialogContent>
            <DialogActions
                sx={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'flex-end',
                    gap: 1,
                    px: { xs: 2, sm: 3 },
                    pb: { xs: 2, sm: 2 },
                    pt: 1,
                    '& .MuiButton-root': {
                        flex: '0 0 auto',
                        width: 'auto',
                        minHeight: MIN_TOUCH_TARGET_PX,
                        minWidth: MIN_TOUCH_TARGET_PX,
                    },
                }}
            >
                <Button onClick={onClose} sx={touchButtonSx}>
                    {ui.common.cancel}
                </Button>
                <Button variant="contained" onClick={onSave} sx={touchButtonSx}>
                    {ui.common.save}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
