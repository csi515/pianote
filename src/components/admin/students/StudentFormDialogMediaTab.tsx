import React from 'react';
import { StudentMediaPanel } from '@/components/admin/students/StudentMediaPanel';

export type StudentFormDialogMediaTabProps = {
    studentId: string | null;
};

export const StudentFormDialogMediaTab: React.FC<StudentFormDialogMediaTabProps> = ({ studentId }) => {
    if (!studentId) {
        return null;
    }
    return <StudentMediaPanel key={studentId} studentId={studentId} />;
};
