import React from 'react';
import { Box } from '@mui/material';

export interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

export const TabPanel = ({ children, value, index }: TabPanelProps) => {
    return (
        <div hidden={value !== index} style={{ marginTop: '24px' }}>
            {value === index && <Box>{children}</Box>}
        </div>
    );
};
