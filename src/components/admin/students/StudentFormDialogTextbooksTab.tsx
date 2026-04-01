import React from 'react';
import type { Database } from '@/lib/supabase';
import { StudentTextbooksPanel } from '@/components/admin/students/StudentTextbooksPanel';

type TextbookRow = Database['public']['Tables']['textbooks']['Row'];

export type StudentFormDialogTextbooksTabProps = {
    /** 저장된 학생만 교재 패널 표시 */
    studentId: string | null;
    textbookCatalog: TextbookRow[];
    onAssignmentsChanged?: (studentId: string) => void;
};

export const StudentFormDialogTextbooksTab: React.FC<StudentFormDialogTextbooksTabProps> = ({
    studentId,
    textbookCatalog,
    onAssignmentsChanged,
}) => {
    if (!studentId) {
        return null;
    }
    return (
        <StudentTextbooksPanel
            key={studentId}
            studentId={studentId}
            catalog={textbookCatalog}
            onAssignmentsChanged={onAssignmentsChanged}
        />
    );
};
