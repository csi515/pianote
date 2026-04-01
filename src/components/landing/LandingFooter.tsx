import React from 'react';
import { Box, Container, Typography, Grid, Stack } from '@mui/material';
import { ui } from '@/i18n/ui';

const LandingFooter: React.FC = () => {
    const L = ui.landing;
    return (
        <Box sx={{ bgcolor: '#1a1a1a', color: 'white', py: 6 }}>
            <Container>
                <Grid container spacing={4}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                            {L.footerBrand}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.7 }}>
                            {L.footerTagline1}
                            <br />
                            {L.footerTagline2}
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                            {L.footerContactHeading}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.7 }}>
                            {L.footerEmailLine}
                            <br />
                            {L.footerContactHint}
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                            {L.footerLegalHeading}
                        </Typography>
                        <Stack spacing={1}>
                            <Typography variant="body2" sx={{ opacity: 0.7, cursor: 'pointer' }}>
                                {L.footerTerms}
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.7, cursor: 'pointer' }}>
                                {L.footerPrivacy}
                            </Typography>
                        </Stack>
                    </Grid>
                </Grid>
                <Typography variant="caption" sx={{ display: 'block', mt: 4, opacity: 0.5, textAlign: 'center' }}>
                    {L.footerCopyright}
                </Typography>
            </Container>
        </Box>
    );
};

export default LandingFooter;
