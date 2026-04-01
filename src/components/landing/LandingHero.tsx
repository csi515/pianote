import React from 'react';
import { Box, Container, Typography, Button, Stack, alpha, useTheme } from '@mui/material';
import { ui } from '@/i18n/ui';

interface LandingHeroProps {
    onPrimaryAction: () => void;
}

const LandingHero: React.FC<LandingHeroProps> = ({ onPrimaryAction }) => {
    const theme = useTheme();
    const L = ui.landing;
    return (
        <Box
            sx={{
                pt: { xs: 8, md: 15 },
                pb: { xs: 8, md: 10 },
                textAlign: 'center',
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.1)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
            }}
        >
            <Container maxWidth="md">
                <Typography
                    variant="h2"
                    fontWeight="900"
                    gutterBottom
                    sx={{
                        background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        backgroundClip: 'text',
                        textFillColor: 'transparent',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontSize: { xs: '2.5rem', md: '4rem' },
                    }}
                >
                    {L.heroLine1}
                    <br />
                    {L.heroLine2}
                </Typography>
                <Typography variant="h5" color="text.secondary" sx={{ mb: 4, mt: 2, lineHeight: 1.6 }}>
                    {L.heroSub1}
                    <br />
                    {L.heroSub2}
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ mt: 4 }}>
                    <Button
                        variant="contained"
                        size="large"
                        onClick={onPrimaryAction}
                        sx={{
                            py: 2,
                            px: 5,
                            fontSize: '1.2rem',
                            borderRadius: 50,
                            boxShadow: 4,
                        }}
                    >
                        {L.ctaStart}
                    </Button>
                    <Button
                        variant="outlined"
                        size="large"
                        sx={{
                            py: 2,
                            px: 5,
                            fontSize: '1.2rem',
                            borderRadius: 50,
                            borderWidth: 2,
                        }}
                    >
                        {L.ctaFeaturesDetail}
                    </Button>
                </Stack>
                <Typography variant="caption" display="block" sx={{ mt: 2, color: 'text.disabled' }}>
                    {L.heroFootnote}
                </Typography>
            </Container>
        </Box>
    );
};

export default LandingHero;
