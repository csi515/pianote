import React from 'react';
import { Alert } from '@mui/material';
import type { Database } from '@/lib/supabase';
import { StudentTextbooksPanel } from '@/components/admin/students/StudentTextbooksPanel';
import { ui } from '@/i18n/ui';

type TextbookRow = Database['public']['Tables']['textbooks']['Row'];

export type StudentFormDialogTextbooksTabProps = {
    /** 저장된 학생만 교재 패널 표시 */
    studentId: string | null;
    textbookCatalog: TextbookRow[];
    onAssignmentsChanged?: (studentId: string) => void;
};

/**
 * 학생 폼 다이얼로그 — 보유 교재·교재비 탭 (신규 학생은 저장 후 이용 안내)
 */
export const StudentFormDialogTextbooksTab: React.FC<StudentFormDialogTextbooksTabProps> = ({
    studentId,
    textbookCatalog,
    onAssignmentsChanged,
}) => {
    if (!studentId) {
        return (
            <Alert severity="info" role="status" sx={{ mt: 0 }}>
                {ui.adminStudents.textbooksTabSaveFirstHint}
            </Alert>
        );
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
