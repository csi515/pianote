import React, { useEffect, useState } from 'react';
import { Alert, Container } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { usePageTopBar } from '@/contexts/PageTopBarContext';
import { useSnackbar } from 'notistack';
import {
    getStudentsPageWithTextbookPaymentStatuses,
    createStudent,
    updateStudent,
    deleteStudent,
    type StudentWithParent,
} from '@/services/students.service';
import {
    getStudentTextbookPaymentStatuses,
    listTextbooks,
    type StudentTextbookPaymentRowStatus,
} from '@/services/textbooks.service';
import { invalidateAcademyAdminMetricsCache } from '@/services/academyAdminMetrics.service';
import type { Database } from '@/lib/supabase';
import { ui } from '@/i18n/ui';
import { StudentManagementTable } from '@/components/admin/students/StudentManagementTable';
import {
    StudentFormDialog,
    type StudentFormData,
} from '@/components/admin/students/StudentFormDialog';

type TextbookRow = Database['public']['Tables']['textbooks']['Row'];

const trimOrNull = (s: string): string | null => (s.trim() === '' ? null : s.trim());

function parseMonthlyFeeInput (s: string): number | null {
    const t = s.replaceAll(',', '').trim();
    if (!t) return null;
    const n = Number(t);
    if (!Number.isFinite(n) || n < 0) return null;
    return Math.round(n);
}

/** 학생 정보 모달 월 회비 입력란 초기 표시용 (천 단위 콤마) */
function formatMonthlyFeeForInput (n: number): string {
    return n.toLocaleString('ko-KR');
}

function defaultEnrollmentDateYmd (): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const StudentManagement: React.FC = () => {
    const { academy } = useAuth();
    usePageTopBar({ title: ui.adminStudents.pageTitle });
    const { enqueueSnackbar } = useSnackbar();

    const [students, setStudents] = useState<StudentWithParent[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<StudentWithParent | null>(null);
    const [formData, setFormData] = useState<StudentFormData>({
        name: '',
        grade: '',
        memo: '',
        parent_phone: '',
        enrollment_date: '',
        left_academy_date: '',
        monthly_fee: '',
    });
    const [textbookCatalog, setTextbookCatalog] = useState<TextbookRow[]>([]);
    const [textbookPaymentByStudent, setTextbookPaymentByStudent] = useState<
        Record<string, StudentTextbookPaymentRowStatus>
    >({});

    const loadCatalogs = React.useCallback(async () => {
        if (!academy) return;
        try {
            const books = await listTextbooks(academy.id);
            setTextbookCatalog(books);
        } catch (e) {
            console.error('loadCatalogs:', e);
            enqueueSnackbar(ui.adminStudents.genericError, { variant: 'error' });
        }
    }, [academy, enqueueSnackbar]);

    const loadStudentsPage = React.useCallback(async () => {
        if (!academy) return;
        setLoading(true);
        try {
            const pageResult = await getStudentsPageWithTextbookPaymentStatuses(
                academy.id,
                page,
                rowsPerPage
            );
            setStudents(pageResult.rows);
            setTotalCount(pageResult.total);
            setTextbookPaymentByStudent(pageResult.textbookPaymentByStudent);
            if (pageResult.rows.length === 0 && page > 0) {
                setPage((p) => Math.max(0, p - 1));
            }
        } catch (e) {
            console.error('loadStudentsPage:', e);
            enqueueSnackbar(ui.adminStudents.genericError, { variant: 'error' });
        } finally {
            setLoading(false);
        }
    }, [academy, page, rowsPerPage, enqueueSnackbar]);

    /**
     * 교재 배정·납부 변경 시 해당 학생 행의 교재비 열만 재조회 (전체 목록 리로드 없음).
     * 비활성 학생은 대시보드/종과 동일하게 `inactive_excluded`로 맞춤.
     */
    const patchTextbookPaymentForStudent = React.useCallback(
        async (studentId: string) => {
            if (!academy) return;
            try {
                const partial = await getStudentTextbookPaymentStatuses([studentId]);
                setTextbookPaymentByStudent((prev) => {
                    const next = { ...prev, ...partial };
                    const row = students.find((s) => s.id === studentId);
                    if (row && !row.active) {
                        next[studentId] = 'inactive_excluded';
                    }
                    return next;
                });
                if (academy?.id) invalidateAcademyAdminMetricsCache(academy.id);
            } catch (e) {
                console.error('patchTextbookPaymentForStudent:', e);
            }
        },
        [academy, students]
    );

    useEffect(() => {
        void loadCatalogs();
    }, [loadCatalogs]);

    useEffect(() => {
        void loadStudentsPage();
    }, [loadStudentsPage]);

    const handleOpenDialog = (student?: StudentWithParent) => {
        if (student) {
            setEditingStudent(student);
            setFormData({
                name: student.name,
                grade: student.grade ?? '',
                memo: student.memo ?? '',
                parent_phone: student.parent_phone ?? '',
                enrollment_date: student.enrollment_date ?? '',
                left_academy_date: student.left_academy_date ?? '',
                monthly_fee:
                    student.monthly_fee != null ? formatMonthlyFeeForInput(student.monthly_fee) : '',
            });
        } else {
            setEditingStudent(null);
            const academyDefaultFee =
                academy?.default_monthly_fee != null ? academy.default_monthly_fee : null;
            setFormData({
                name: '',
                grade: '',
                memo: '',
                parent_phone: '',
                enrollment_date: defaultEnrollmentDateYmd(),
                left_academy_date: '',
                monthly_fee:
                    academyDefaultFee != null ? formatMonthlyFeeForInput(academyDefaultFee) : '',
            });
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingStudent(null);
        setFormData({
            name: '',
            grade: '',
            memo: '',
            parent_phone: '',
            enrollment_date: '',
            left_academy_date: '',
            monthly_fee: '',
        });
    };

    const handleSave = async () => {
        if (!academy) return;
        if (!formData.name.trim()) {
            enqueueSnackbar(ui.adminStudents.nameRequired, { variant: 'warning' });
            return;
        }

        try {
            if (editingStudent) {
                if (!formData.parent_phone.trim()) {
                    enqueueSnackbar(ui.adminStudents.parentPhoneRequired, { variant: 'warning' });
                    return;
                }
                const parentPhoneTrimmed = formData.parent_phone.trim();
                if (!formData.enrollment_date.trim()) {
                    enqueueSnackbar(ui.adminStudents.enrollmentDateRequired, { variant: 'warning' });
                    return;
                }
                if (
                    formData.monthly_fee.trim() !== '' &&
                    parseMonthlyFeeInput(formData.monthly_fee) === null
                ) {
                    enqueueSnackbar(ui.adminStudents.monthlyFeeInvalid, { variant: 'warning' });
                    return;
                }
                const result = await updateStudent(editingStudent.id, {
                    name: formData.name.trim(),
                    parent_id: null,
                    parent_phone: parentPhoneTrimmed,
                    user_id: editingStudent.user_id ?? null,
                    grade: trimOrNull(formData.grade),
                    memo: trimOrNull(formData.memo),
                    progress_memo: null,
                    curriculum_track_id: null,
                    enrollment_date: formData.enrollment_date.trim(),
                    left_academy_date: trimOrNull(formData.left_academy_date),
                    monthly_fee: parseMonthlyFeeInput(formData.monthly_fee),
                });
                if (result.success) {
                    enqueueSnackbar(ui.adminStudents.saveSuccessEdit, { variant: 'success' });
                    if (academy?.id) invalidateAcademyAdminMetricsCache(academy.id);
                    void loadStudentsPage();
                    handleCloseDialog();
                } else {
                    enqueueSnackbar(result.error || ui.adminStudents.saveError, { variant: 'error' });
                }
            } else {
                if (!formData.parent_phone.trim()) {
                    enqueueSnackbar(ui.adminStudents.parentPhoneRequired, { variant: 'warning' });
                    return;
                }
                if (!formData.enrollment_date.trim()) {
                    enqueueSnackbar(ui.adminStudents.enrollmentDateRequired, { variant: 'warning' });
                    return;
                }
                if (
                    formData.monthly_fee.trim() !== '' &&
                    parseMonthlyFeeInput(formData.monthly_fee) === null
                ) {
                    enqueueSnackbar(ui.adminStudents.monthlyFeeInvalid, { variant: 'warning' });
                    return;
                }
                const parentPhoneTrimmed = formData.parent_phone.trim();
                const result = await createStudent({
                    academy_id: academy.id,
                    name: formData.name.trim(),
                    parent_id: null,
                    parent_phone: parentPhoneTrimmed,
                    enrollment_date: formData.enrollment_date.trim(),
                    left_academy_date: trimOrNull(formData.left_academy_date),
                    monthly_fee: parseMonthlyFeeInput(formData.monthly_fee),
                    active: true,
                    profile_image: null,
                    grade: trimOrNull(formData.grade),
                    memo: trimOrNull(formData.memo),
                    progress_memo: null,
                    curriculum_track_id: null,
                });
                if (result.success) {
                    enqueueSnackbar(ui.adminStudents.saveSuccessCreate, { variant: 'success' });
                    if (academy?.id) invalidateAcademyAdminMetricsCache(academy.id);
                    void loadStudentsPage();
                    handleCloseDialog();
                } else {
                    enqueueSnackbar(result.error || ui.adminStudents.saveError, { variant: 'error' });
                }
            }
        } catch (error) {
            console.error('Save error:', error);
            enqueueSnackbar(ui.adminStudents.genericError, { variant: 'error' });
        }
    };

    const handleDelete = async (student: StudentWithParent) => {
        if (!window.confirm(ui.adminStudents.deleteConfirm.replace('{name}', student.name))) return;
        const result = await deleteStudent(student.id);
        if (result.success) {
            enqueueSnackbar(ui.adminStudents.deleteSuccess, { variant: 'success' });
            if (academy?.id) invalidateAcademyAdminMetricsCache(academy.id);
            void loadStudentsPage();
        } else {
            enqueueSnackbar(result.error || ui.adminStudents.saveError, { variant: 'error' });
        }
    };

    const handleActiveChange = React.useCallback(
        async (student: StudentWithParent, active: boolean) => {
            const result = await updateStudent(student.id, { active });
            if (result.success) {
                enqueueSnackbar(ui.adminStudents.statusUpdated, { variant: 'success' });
                if (academy?.id) invalidateAcademyAdminMetricsCache(academy.id);
                void loadStudentsPage();
            } else {
                enqueueSnackbar(result.error || ui.adminStudents.saveError, { variant: 'error' });
            }
        },
        [academy?.id, enqueueSnackbar, loadStudentsPage]
    );

    if (!academy) {
        return (
            <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 } }}>
                <Alert severity="info" role="status" aria-live="polite">
                    {ui.common.academyLoading}
                </Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 } }}>
            <StudentManagementTable
                students={students}
                textbookPaymentByStudent={textbookPaymentByStudent}
                loading={loading}
                totalCount={totalCount}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={setPage}
                onRowsPerPageChange={setRowsPerPage}
                onEdit={handleOpenDialog}
                onDelete={handleDelete}
                onActiveChange={handleActiveChange}
                onAddStudent={() => handleOpenDialog()}
            />

            <StudentFormDialog
                open={dialogOpen}
                editingStudent={editingStudent}
                formData={formData}
                onFormChange={setFormData}
                onClose={handleCloseDialog}
                onSave={handleSave}
                textbookCatalog={textbookCatalog}
                onStudentTextbooksChanged={(studentId) =>
                    void patchTextbookPaymentForStudent(studentId)
                }
            />
        </Container>
    );
};

export default StudentManagement;
