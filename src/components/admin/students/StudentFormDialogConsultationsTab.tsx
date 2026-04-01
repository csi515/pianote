import React from 'react';
import { StudentConsultationsPanel } from '@/components/admin/students/StudentConsultationsPanel';

export type StudentFormDialogConsultationsTabProps = {
    studentId: string | null;
};

export const StudentFormDialogConsultationsTab: React.FC<StudentFormDialogConsultationsTabProps> = ({
    studentId,
}) => {
    if (!studentId) {
        return null;
    }
    return <StudentConsultationsPanel key={studentId} studentId={studentId} />;
};
