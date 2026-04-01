import React, { useMemo } from 'react';
import { Container, Typography, Grid, Card, CardContent, Box, alpha, useTheme } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import PeopleIcon from '@mui/icons-material/People';
import PianoIcon from '@mui/icons-material/Piano';
import DevicesIcon from '@mui/icons-material/Devices';
import { ui } from '@/i18n/ui';

const LandingFeatures: React.FC = () => {
    const theme = useTheme();
    const L = ui.landing;
    const features = useMemo(
        () => [
            {
                icon: <PeopleIcon sx={{ fontSize: 40 }} />,
                title: L.feature1Title,
                desc: L.feature1Desc,
            },
            {
                icon: <CheckCircleOutlineIcon sx={{ fontSize: 40 }} />,
                title: L.feature2Title,
                desc: L.feature2Desc,
            },
            {
                icon: <ShowChartIcon sx={{ fontSize: 40 }} />,
                title: L.feature3Title,
                desc: L.feature3Desc,
            },
            {
                icon: <PianoIcon sx={{ fontSize: 40 }} />,
                title: L.feature4Title,
                desc: L.feature4Desc,
            },
            {
                icon: <DevicesIcon sx={{ fontSize: 40 }} />,
                title: L.feature5Title,
                desc: L.feature5Desc,
            },
        ],
        [L]
    );

    return (
        <Container sx={{ py: 10 }} id="features">
            <Typography variant="h6" color="primary" fontWeight="bold" textAlign="center" gutterBottom>
                {L.featuresKicker}
            </Typography>
            <Typography variant="h3" fontWeight="bold" textAlign="center" sx={{ mb: 8 }}>
                {L.featuresTitle}
            </Typography>
            <Grid container spacing={4}>
                {features.map((feature, index) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                        <Card
                            elevation={0}
                            sx={{
                                height: '100%',
                                borderRadius: 4,
                                bgcolor: alpha(theme.palette.background.paper, 0.5),
                                backdropFilter: 'blur(5px)',
                                border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                                transition: 'transform 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-5px)',
                                    boxShadow: theme.shadows[4],
                                },
                            }}
                        >
                            <CardContent sx={{ p: 4 }}>
                                <Box
                                    sx={{
                                        width: 60,
                                        height: 60,
                                        borderRadius: 3,
                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        color: 'primary.main',
                                        mb: 2,
                                    }}
                                >
                                    {feature.icon}
                                </Box>
                                <Typography variant="h5" fontWeight="bold" gutterBottom>
                                    {feature.title}
                                </Typography>
                                <Typography variant="body1" color="text.secondary">
                                    {feature.desc}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
};

export default LandingFeatures;
