import React, { useMemo } from 'react';
import { Container, Typography, Accordion, AccordionSummary, AccordionDetails, useTheme } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ui } from '@/i18n/ui';

const LandingFaq: React.FC = () => {
    const theme = useTheme();
    const L = ui.landing;
    const faqItems = useMemo(
        () => [
            { q: L.faq1Q, a: L.faq1A },
            { q: L.faq2Q, a: L.faq2A },
            { q: L.faq3Q, a: L.faq3A },
            { q: L.faq4Q, a: L.faq4A },
            { q: L.faq5Q, a: L.faq5A },
            { q: L.faq6Q, a: L.faq6A },
        ],
        [L]
    );

    return (
        <Container maxWidth="md" sx={{ py: 10 }}>
            <Typography variant="h4" fontWeight="bold" textAlign="center" sx={{ mb: 6 }}>
                {L.faqTitle}
            </Typography>
            {faqItems.map((faq, index) => (
                <Accordion
                    key={index}
                    elevation={0}
                    sx={{ mb: 1, border: `1px solid ${theme.palette.divider}`, borderRadius: 2, '&:before': { display: 'none' } }}
                >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle1" fontWeight="bold">
                            Q. {faq.q}
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography color="text.secondary">{faq.a}</Typography>
                    </AccordionDetails>
                </Accordion>
            ))}
        </Container>
    );
};

export default LandingFaq;
