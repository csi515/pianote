import React from 'react';
import { Alert } from '@mui/material';
import { StudentConsultationsPanel } from '@/components/admin/students/StudentConsultationsPanel';
import { ui } from '@/i18n/ui';

export type StudentFormDialogConsultationsTabProps = {
    studentId: string | null;
};

/**
 * 학생 폼 다이얼로그 — 상담 일지 탭 (신규 학생은 저장 후 이용 안내)
 */
export const StudentFormDialogConsultationsTab: React.FC<StudentFormDialogConsultationsTabProps> = ({
    studentId,
}) => {
    if (!studentId) {
        return (
            <Alert severity="info" role="status" sx={{ mt: 0 }}>
                {ui.adminStudents.consultationsTabSaveFirstHint}
            </Alert>
        );
    }
    return <StudentConsultationsPanel key={studentId} studentId={studentId} />;
};
