import React from 'react';
import {
    Alert,
    AlertTitle,
    Box,
    CircularProgress,
    TableCell,
    TableRow,
    Typography,
} from '@mui/material';
import { ui } from '@/i18n/ui';

type TableLoadingRowProps = {
    colSpan: number;
    message: string;
};

/**
 * 테이블 본문용 로딩 행 — CircularProgress + aria-live 문구 (스낵바와 구분된 인라인 패턴)
 */
export const TableLoadingRow: React.FC<TableLoadingRowProps> = ({ colSpan, message }) => (
    <TableRow>
        <TableCell colSpan={colSpan} align="center" sx={{ py: 4 }}>
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 1.5,
                }}
            >
                <CircularProgress size={24} aria-hidden />
                <span role="status" aria-live="polite">
                    {message}
                </span>
            </Box>
        </TableCell>
    </TableRow>
);

type TableEmptyRowProps = {
    colSpan: number;
    message: string;
};

export const TableEmptyRow: React.FC<TableEmptyRowProps> = ({ colSpan, message }) => (
    <TableRow>
        <TableCell colSpan={colSpan} align="center" sx={{ py: 3 }}>
            <Typography variant="body2" color="text.secondary" role="status">
                {message}
            </Typography>
        </TableCell>
    </TableRow>
);

export type AdminPageLoadingProps = {
    message?: string;
    minHeight?: number | string;
};

/**
 * 페이지·패널 단위 중앙 로딩 — 테이블 밖 전체 영역용
 */
export const AdminPageLoading: React.FC<AdminPageLoadingProps> = ({
    message = ui.common.loading,
    minHeight = 240,
}) => (
    <Box
        sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            minHeight,
            py: 4,
        }}
    >
        <CircularProgress aria-hidden />
        <Typography component="div" role="status" aria-live="polite" variant="body2" color="text.secondary">
            {message}
        </Typography>
    </Box>
);

export type EmptyStateProps = {
    title: string;
    description?: string;
    action?: React.ReactNode;
    minHeight?: number | string;
};

/**
 * 카드·섹션 단위 빈 상태 (테이블이 아닌 블록용)
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
    title,
    description,
    action,
    minHeight = 200,
}) => (
    <Box
        sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.5,
            minHeight,
            py: 4,
            px: 2,
            textAlign: 'center',
        }}
    >
        <Typography variant="subtitle1" fontWeight={600} color="text.primary">
            {title}
        </Typography>
        {description ? (
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }}>
                {description}
            </Typography>
        ) : null}
        {action ? <Box sx={{ mt: 1 }}>{action}</Box> : null}
    </Box>
);

export type PageStateProps =
    | { variant: 'loading'; message?: string; minHeight?: number | string }
    | {
          variant: 'error';
          title: string;
          description?: string;
      }
    | {
          variant: 'empty';
          title: string;
          description?: string;
          action?: React.ReactNode;
      };

/**
 * 로딩 / 에러 / 빈 상태를 한 컴포넌트로 분기 (목록 상단·본문 블록용)
 */
export const PageState: React.FC<PageStateProps> = (props) => {
    if (props.variant === 'loading') {
        return <AdminPageLoading message={props.message} minHeight={props.minHeight} />;
    }
    if (props.variant === 'error') {
        return (
            <Alert severity="error" role="alert" aria-live="assertive" sx={{ my: 1 }}>
                <AlertTitle>{props.title}</AlertTitle>
                {props.description ?? null}
            </Alert>
        );
    }
    return (
        <EmptyState
            title={props.title}
            description={props.description}
            action={props.action}
        />
    );
};
