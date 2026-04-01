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
        <Card
            variant="outlined"
            sx={[
                (theme) => ({
                    width: '100%',
                    overflow: 'hidden',
                    borderRadius: { xs: 0, sm: `${theme.shape.borderRadius}px` },
                }),
                ...(sx ? (Array.isArray(sx) ? sx : [sx]) : []),
            ]}
        >
            <CardContent
                sx={{
                    px: { xs: 1.5, sm: 2 },
                    pt: { xs: 1.5, sm: 2 },
                    pb: 1,
                    '&:last-child': { pb: 1 },
                }}
            >
                {children}
            </CardContent>
            <CardActions
                sx={{
                    justifyContent: 'flex-end',
                    flexWrap: 'wrap',
                    gap: 0.5,
                    px: { xs: 1.5, sm: 2 },
                    pb: { xs: 1.5, sm: 2 },
                    pt: 0,
                }}
            >
                {actions}
            </CardActions>
        </Card>
    );
}
