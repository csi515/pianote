import React from 'react';
import { Box, Container, Paper, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ui } from '@/i18n/ui';

/** Supabase 환경 변수 없을 때 개발/데모 시 빈 화면 방지 */
const ConfigMissingScreen: React.FC = () => {
    const theme = useTheme();
    return (
    <Box
        sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: theme.palette.background.default,
            px: 2,
            py: 4,
        }}
    >
        <Container maxWidth="sm">
            <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Typography variant="h5" component="h1" gutterBottom fontWeight={700} color="primary">
                    {ui.landing.footerBrand}
                </Typography>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    {ui.system.configMissingTitle}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, lineHeight: 1.7 }}>
                    {ui.system.configMissingBody}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                    {ui.system.configMissingHint}
                </Typography>
            </Paper>
        </Container>
    </Box>
    );
};

export default ConfigMissingScreen;
