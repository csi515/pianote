import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import {
    listAttendanceByStudent,
    type AttendanceRecord,
} from '@/services/attendance.service';
import { ui } from '@/i18n/ui';

function formatAttendanceTime(iso: string | undefined): string {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return iso;
    }
}

interface StudentAttendancePanelProps {
    studentId: string;
}

export const StudentAttendancePanel: React.FC<StudentAttendancePanelProps> = ({ studentId }) => {
    const [rows, setRows] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        void listAttendanceByStudent(studentId, 50).then((data) => {
            if (!cancelled) {
                setRows(data);
                setLoading(false);
            }
        });
        return () => {
            cancelled = true;
        };
    }, [studentId]);

    if (loading) {
        return (
            <Box sx={{ py: 1 }}>
                <CircularProgress size={28} aria-label={ui.common.loading} />
            </Box>
        );
    }

    if (rows.length === 0) {
        return (
            <Typography variant="body2" color="text.secondary">
                {ui.adminStudents.attendanceLogEmpty}
            </Typography>
        );
    }

    return (
        <Box sx={{ mt: 0 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
                {ui.adminStudents.attendanceLogTitle}
            </Typography>
            <Box
                component="ul"
                sx={{
                    m: 0,
                    pl: 2.5,
                    '& li': { mb: 0.5 },
                }}
            >
                {rows.map((r) => (
                    <Typography component="li" key={r.id ?? `${r.student_id}-${r.timestamp}`} variant="body2">
                        {formatAttendanceTime(r.timestamp)} ·{' '}
                        {r.type === 'check_in'
                            ? ui.adminStudents.attendanceTypeIn
                            : ui.adminStudents.attendanceTypeOut}
                    </Typography>
                ))}
            </Box>
        </Box>
    );
};
