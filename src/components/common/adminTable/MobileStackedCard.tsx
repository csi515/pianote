import { Card, CardActions, CardContent } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';

export type MobileStackedCardProps = {
    /** 상단 정보 영역 */
    children: React.ReactNode;
    /** 하단 액션(버튼 행 등) */
    actions: React.ReactNode;
    sx?: SxProps<Theme>;
};

/**
 * 모바일 목록 한 행: 상단 정보 + 하단 액션 분리 (한 손 조작용 터치 영역)
 */
export function MobileStackedCard ({ children, actions, sx }: MobileStackedCardProps) {
    return (
        <Card variant="outlined" sx={{ width: '100%', overflow: 'hidden', ...sx }}>
            <CardContent sx={{ pb: 1, '&:last-child': { pb: 1 } }}>{children}</CardContent>
            <CardActions
                sx={{
                    justifyContent: 'flex-end',
                    flexWrap: 'wrap',
                    gap: 0.5,
                    px: 2,
                    pb: 2,
                    pt: 0,
                }}
            >
                {actions}
            </CardActions>
        </Card>
    );
}
