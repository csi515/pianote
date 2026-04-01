import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { ui } from '@/i18n/ui';

interface LandingNavProps {
    onLogin: () => void;
}

const LandingNav: React.FC<LandingNavProps> = ({ onLogin }) => (
    <Box
        component="nav"
        sx={{
            py: { xs: 1.5, sm: 2 },
            px: { xs: 2, sm: 3 },
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
            bgcolor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
        }}
    >
        <Typography
            variant="h5"
            fontWeight="bold"
            color="primary"
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontSize: { xs: '1.1rem', sm: '1.5rem' },
            }}
        >
            {ui.auth.loginScreen.brandTitle}
        </Typography>
        <Button
            variant="contained"
            onClick={onLogin}
            sx={{
                borderRadius: 4,
                px: { xs: 2, sm: 3 },
                py: { xs: 0.75, sm: 1 },
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                whiteSpace: 'nowrap',
            }}
        >
            {ui.landing.navLogin}
        </Button>
    </Box>
);

export default LandingNav;
