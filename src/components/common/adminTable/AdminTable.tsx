import React from 'react';
import {
    Box,
    Paper,
    Table,
    TableCell,
    TableContainer,
    TablePagination,
} from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import type { TableProps } from '@mui/material/Table';
import type { TablePaginationProps } from '@mui/material/TablePagination';
import visuallyHidden from '@mui/utils/visuallyHidden';
import { tableContainerTouchScrollSx, tablePaginationTouchSx } from '@/constants/touch';
import { ui } from '@/i18n/ui';

/**
 * 관리자 목록용 공통 테이블 UI
 *
 * **구성:** `AdminTableSurface` → `<Table>` + `TableHead`/`TableBody` → (선택) `AdminTablePaginationBar`
 * **로딩/빈:** `TableLoadingRow` / `TableEmptyRow` (`PageState.tsx`)를 `TableBody` 안에서 그대로 사용
 * **문구:** `aria-label`, 열 제목, 빈 메시지는 호출부에서 `ui` 키로 전달 (하드코딩 금지)
 * **터치:** 페이지네이션은 `tablePaginationTouchSx` 적용
 */

export type AdminTableSurfaceProps = {
    children: React.ReactNode;
    /** Paper·TableContainer 추가 스타일 */
    sx?: SxProps<Theme>;
};

/** Paper(outlined) + TableContainer — 내부에 Table과 TablePagination을 함께 둘 수 있음 */
export const AdminTableSurface: React.FC<AdminTableSurfaceProps> = ({ children, sx }) => (
    <TableContainer
        component={Paper}
        variant="outlined"
        sx={{ ...tableContainerTouchScrollSx, ...sx }}
    >
        {children}
    </TableContainer>
);

export type AdminTableWithLabelProps = {
    /** 스크린 리더용 테이블 요약 */
    ariaLabel: string;
    size?: TableProps['size'];
    children: React.ReactNode;
};

/** 접근성용 aria-label이 붙은 Table — 반드시 AdminTableSurface 또는 TableContainer 안에서 사용 */
export const AdminTableWithLabel: React.FC<AdminTableWithLabelProps> = ({
    ariaLabel,
    size = 'small',
    children,
}) => (
    <Table size={size} aria-label={ariaLabel}>
        {children}
    </Table>
);

export type AdminTableActionsHeaderCellProps = {
    /** 시각적으로 숨긴 열 제목 (기본: 행 작업) */
    label?: string;
    width?: number;
};

/** 아이콘만 있는 작업 열 헤더 — 스크린 리더용 텍스트만 노출 */
export const AdminTableActionsHeaderCell: React.FC<AdminTableActionsHeaderCellProps> = ({
    label = ui.common.tableActionsHeader,
    width = 56,
}) => (
    <TableCell width={width} sx={{ position: 'relative' }}>
        <Box component="span" sx={visuallyHidden}>
            {label}
        </Box>
    </TableCell>
);

export type AdminTableReorderHeaderCellProps = {
    label?: string;
    width?: number;
};

/** 순서 조정(드래그·위아래) 전용 열 헤더 */
export const AdminTableReorderHeaderCell: React.FC<AdminTableReorderHeaderCellProps> = ({
    label = ui.common.tableReorderColumnHeader,
    width = 44,
}) => (
    <TableCell width={width} sx={{ position: 'relative' }}>
        <Box component="span" sx={visuallyHidden}>
            {label}
        </Box>
    </TableCell>
);

/** 목록 하단 `1-10 / 100` 형식 (프로젝트 공통) */
/** MUI TablePagination이 넘기는 from·to는 이미 1-based(첫·마지막 행 번호) */
export const defaultAdminTableLabelDisplayedRows: TablePaginationProps['labelDisplayedRows'] = ({
    from,
    to,
    count,
}) => (count === 0 ? '0 / 0' : `${from}-${to} / ${count}`);

export type AdminTablePaginationBarProps = {
    count: number;
    page: number;
    rowsPerPage: number;
    onPageChange: (newPage: number) => void;
    /** 행 수 변경 시(호출부에서 `setPage(0)` 등 함께 처리) */
    onRowsPerPageChange: (newRowsPerPage: number) => void;
    rowsPerPageOptions?: number[];
    labelRowsPerPage?: string;
    labelDisplayedRows?: TablePaginationProps['labelDisplayedRows'];
};

/** Table 바깥·AdminTableSurface 안에서 Table과 형제로 두는 것을 권장 */
export const AdminTablePaginationBar: React.FC<AdminTablePaginationBarProps> = ({
    count,
    page,
    rowsPerPage,
    onPageChange,
    onRowsPerPageChange,
    rowsPerPageOptions = [5, 10, 25, 50],
    labelRowsPerPage = ui.pagination.labelRowsPerPage,
    labelDisplayedRows = defaultAdminTableLabelDisplayedRows,
}) => (
    <TablePagination
        component="div"
        count={count}
        page={page}
        onPageChange={(_, p) => onPageChange(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
            onRowsPerPageChange(parseInt(e.target.value, 10));
        }}
        rowsPerPageOptions={rowsPerPageOptions}
        labelRowsPerPage={labelRowsPerPage}
        labelDisplayedRows={labelDisplayedRows}
        sx={tablePaginationTouchSx}
    />
);
