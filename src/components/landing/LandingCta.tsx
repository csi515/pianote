import React from 'react';
import { Box, Container, Typography, alpha, useTheme } from '@mui/material';
import { ui } from '@/i18n/ui';

const LandingCta: React.FC = () => {
    const theme = useTheme();
    const L = ui.landing;
    return (
        <Box sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.05), py: 10 }}>
            <Container maxWidth="md" sx={{ textAlign: 'center' }}>
                <Typography variant="h3" fontWeight="bold" gutterBottom>
                    {L.ctaTitle1}
                    <br />
                    {L.ctaTitle2}
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 5 }}>
                    {L.ctaSubtitle1} <br />
                    {L.ctaSubtitle2}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Typography variant="body1" sx={{ px: 3, py: 1, bgcolor: 'white', borderRadius: 20, boxShadow: 1 }}>
                        {L.ctaChipIntegrated}
                    </Typography>
                    <Typography variant="body1" sx={{ px: 3, py: 1, bgcolor: 'white', borderRadius: 20, boxShadow: 1 }}>
                        {L.ctaChipWeb}
                    </Typography>
                    <Typography variant="body1" sx={{ px: 3, py: 1, bgcolor: 'white', borderRadius: 20, boxShadow: 1 }}>
                        {L.ctaChipDevices}
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
};

export default LandingCta;
