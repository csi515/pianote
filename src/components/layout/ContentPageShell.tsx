import React from 'react';
import { Box, Container } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import type { ContainerProps } from '@mui/material/Container';

export type ContentPageShellProps = {
    children: React.ReactNode;
    maxWidth?: ContainerProps['maxWidth'];
    /** Container 추가 스타일 */
    containerSx?: SxProps<Theme>;
};

/**
 * 학생·기타 보조 화면: 전체 배경 + 가운데 Container (AppBar 없는 페이지 통일)
 */
const ContentPageShell: React.FC<ContentPageShellProps> = ({
    children,
    maxWidth = 'lg',
    containerSx,
}) => (
    <Box sx={{ bgcolor: 'background.default', minHeight: { xs: '100dvh', sm: '100vh' } }}>
        <Container
            maxWidth={maxWidth}
            sx={{
                py: { xs: 2, sm: 3 },
                ...((containerSx as object) ?? {}),
            }}
        >
            {children}
        </Container>
    </Box>
);

export default ContentPageShell;
