import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Container, Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import type { ContainerProps } from '@mui/material/Container';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { ui } from '@/i18n/ui';
import { MIN_TOUCH_TARGET_PX } from '@/constants/touch';

export type AdminPageShellProps = {
    title: React.ReactNode;
    /** 지정 시 상단에 뒤로가기(해당 경로로 이동). 생략 시 버튼 없음(대시보드 등) */
    backTo?: string;
    children: React.ReactNode;
    /** 툴바 오른쪽(추가 버튼 등) */
    actions?: React.ReactNode;
    maxWidth?: ContainerProps['maxWidth'];
    containerSx?: SxProps<Theme>;
    appBarColor?: 'primary' | 'default' | 'transparent' | 'inherit';
    appBarPosition?: 'static' | 'sticky';
    appBarSx?: SxProps<Theme>;
    /** 하단 구분선(플랫폼 등 밝은 바에서 사용) */
    borderBottom?: boolean;
};

/**
 * 관리자·플랫폼 하위 화면 공통: 상단 AppBar + 본문 Container
 */
const AdminPageShell: React.FC<AdminPageShellProps> = ({
    title,
    backTo,
    children,
    actions,
    maxWidth = 'lg',
    containerSx,
    appBarColor = 'primary',
    appBarPosition = 'static',
    appBarSx,
    borderBottom = false,
}) => {
    const navigate = useNavigate();
    const showBack = Boolean(backTo);

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
            <AppBar
                position={appBarPosition}
                color={appBarColor}
                elevation={0}
                sx={[
                    borderBottom ? { borderBottom: 1, borderColor: 'divider' } : {},
                    ...(appBarSx ? (Array.isArray(appBarSx) ? appBarSx : [appBarSx]) : []),
                ]}
            >
                <Toolbar
                    sx={{
                        minHeight: { xs: 56, sm: 64 },
                        gap: { xs: 0.5, sm: 1 },
                        px: { xs: 1, sm: 2 },
                        flexWrap: 'nowrap',
                        alignItems: 'center',
                    }}
                >
                    {showBack && (
                        <IconButton
                            edge="start"
                            color="inherit"
                            onClick={() => navigate(backTo!)}
                            aria-label={ui.layout.backAria}
                            sx={{ minWidth: 44, minHeight: 44, flexShrink: 0 }}
                        >
                            <ArrowBackIcon />
                        </IconButton>
                    )}
                    <Typography
                        variant="h6"
                        component="div"
                        sx={{
                            flex: '1 1 auto',
                            minWidth: 0,
                            fontWeight: appBarColor === 'inherit' ? 700 : 600,
                            fontSize: { xs: '0.95rem', sm: '1.25rem' },
                            lineHeight: 1.3,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {title}
                    </Typography>
                    {actions ? (
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: { xs: 0.5, sm: 1 },
                                flexShrink: 0,
                                ml: { xs: 0.5, sm: 1 },
                                '& .MuiButton-root': {
                                    minHeight: MIN_TOUCH_TARGET_PX,
                                    minWidth: MIN_TOUCH_TARGET_PX,
                                },
                            }}
                        >
                            {actions}
                        </Box>
                    ) : null}
                </Toolbar>
            </AppBar>

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
};

export default AdminPageShell;
