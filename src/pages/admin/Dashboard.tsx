import React, { useEffect, useState } from 'react';
import { Typography, Paper, Grid, Container, Alert, Tooltip } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import WarningIcon from '@mui/icons-material/Warning';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { useAuth } from '@/contexts/AuthContext';
import { usePageTopBar } from '@/contexts/PageTopBarContext';
import { getAcademyAdminMetrics } from '@/services/academyAdminMetrics.service';
import { ui } from '@/i18n/ui';

const d = ui.adminDashboard;

interface DashboardStats {
    totalStudents: number;
    overduePayments: number;
    textbookFeeUnpaidStudents: number;
}

const AdminDashboard: React.FC = () => {
    const { academy } = useAuth();
    usePageTopBar({ title: d.pageTitle });
    const [stats, setStats] = useState<DashboardStats>({
        totalStudents: 0,
        overduePayments: 0,
        textbookFeeUnpaidStudents: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            if (!academy) return;

            try {
                const m = await getAcademyAdminMetrics(academy.id);
                setStats({
                    totalStudents: m.activeStudentCount,
                    overduePayments: m.overduePaymentsCount,
                    textbookFeeUnpaidStudents: m.unpaidTextbookStudentsCount,
                });
            } catch (error) {
                console.error('Error loading dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, [academy]);

    if (!academy) {
        return (
            <Container maxWidth="lg" sx={{ py: 3 }}>
                <Alert severity="info" role="status" aria-live="polite">
                    {ui.common.academyLoading}
                </Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" component="main" sx={{ py: { xs: 2, sm: 3 } }}>
            <Grid container spacing={{ xs: 2, sm: 2.5 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 2, textAlign: 'center' }}>
                        <PeopleIcon sx={{ fontSize: 36, color: 'primary.main', mb: 1 }} />
                        <Typography variant="subtitle2" fontWeight={600} color="text.secondary" gutterBottom>
                            {d.statTotalStudents}
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" color="primary">
                            {loading ? ui.common.loading : `${stats.totalStudents}${d.countUnit}`}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 2, textAlign: 'center' }}>
                        <WarningIcon sx={{ fontSize: 36, color: 'error.main', mb: 1 }} />
                        <Typography variant="subtitle2" fontWeight={600} color="text.secondary" gutterBottom>
                            {d.statOverdue}
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" color="error.main">
                            {loading
                                ? ui.common.loading
                                : `${stats.overduePayments}${d.countUnitCases}`}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Tooltip title={d.statTextbookFeeUnpaidHint} aria-describedby={undefined}>
                        <Paper sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 2, textAlign: 'center' }}>
                            <MenuBookIcon sx={{ fontSize: 36, color: 'warning.main', mb: 1 }} />
                            <Typography variant="subtitle2" fontWeight={600} color="text.secondary" gutterBottom>
                                {d.statTextbookFeeUnpaid}
                            </Typography>
                            <Typography variant="h4" fontWeight="bold" color="warning.main">
                                {loading
                                    ? ui.common.loading
                                    : `${stats.textbookFeeUnpaidStudents}${d.countUnit}`}
                            </Typography>
                        </Paper>
                    </Tooltip>
                </Grid>
            </Grid>
        </Container>
    );
};

export default AdminDashboard;
