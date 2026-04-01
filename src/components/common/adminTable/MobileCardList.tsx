import { Box, Stack } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';

export type MobileCardListProps = {
    children: React.ReactNode;
    spacing?: number;
    sx?: SxProps<Theme>;
};

/**
 * 모바일 카드 목록 래퍼 — 접근성 `role="list"`, 자식은 `MobileCardListItem`으로 감쌀 것
 */
export function MobileCardList ({ children, spacing = 1.5, sx }: MobileCardListProps) {
    return (
        <Stack
            component="ul"
            role="list"
            spacing={spacing}
            sx={{
                listStyle: 'none',
                m: 0,
                p: 0,
                width: '100%',
                ...sx,
            }}
        >
            {children}
        </Stack>
    );
}

export type MobileCardListItemProps = {
    children: React.ReactNode;
    sx?: SxProps<Theme>;
};

export function MobileCardListItem ({ children, sx }: MobileCardListItemProps) {
    return (
        <Box component="li" role="listitem" sx={sx}>
            {children}
        </Box>
    );
}
