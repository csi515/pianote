import React from 'react';
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LandingNav from '@/components/landing/LandingNav';
import LandingHero from '@/components/landing/LandingHero';
import LandingFeatures from '@/components/landing/LandingFeatures';
import LandingCta from '@/components/landing/LandingCta';
import LandingFaq from '@/components/landing/LandingFaq';
import LandingFooter from '@/components/landing/LandingFooter';
import { ROUTES } from '@/constants/routes';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', overflowX: 'hidden' }}>
            <LandingNav onLogin={() => navigate(ROUTES.login)} />
            <LandingHero onPrimaryAction={() => navigate(ROUTES.login)} />
            <LandingFeatures />
            <LandingCta />
            <LandingFaq />
            <LandingFooter />
        </Box>
    );
};

export default LandingPage;
