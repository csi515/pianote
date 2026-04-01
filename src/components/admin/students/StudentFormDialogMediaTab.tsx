import React from 'react';
import { Alert } from '@mui/material';
import { StudentMediaPanel } from '@/components/admin/students/StudentMediaPanel';
import { ui } from '@/i18n/ui';

export type StudentFormDialogMediaTabProps = {
    studentId: string | null;
};

/**
 * 학생 폼 다이얼로그 — 연주 영상 탭 (신규 학생은 저장 후 이용 안내)
 */
export const StudentFormDialogMediaTab: React.FC<StudentFormDialogMediaTabProps> = ({ studentId }) => {
    if (!studentId) {
        return (
            <Alert severity="info" role="status" sx={{ mt: 0 }}>
                {ui.adminStudents.mediaTabSaveFirstHint}
            </Alert>
        );
    }
    return <StudentMediaPanel key={studentId} studentId={studentId} />;
};
