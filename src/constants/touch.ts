import type { SxProps, Theme } from '@mui/material/styles';

/** 모바일 터치 최소 권장 크기 (px) — WCAG 2.5.5 / 프로젝트 규칙 */
export const MIN_TOUCH_TARGET_PX = 44;

/** 버튼·주요 클릭 영역 */
export const touchButtonSx: SxProps<Theme> = {
    minHeight: MIN_TOUCH_TARGET_PX,
    minWidth: MIN_TOUCH_TARGET_PX,
};

/** 아이콘 전용 버튼 (정사각형 터치 영역) */
export const touchIconButtonSx: SxProps<Theme> = {
    minWidth: MIN_TOUCH_TARGET_PX,
    minHeight: MIN_TOUCH_TARGET_PX,
};

/** TablePagination 툴바·셀렉트·이전·다음 버튼 터치 영역 */
export const tablePaginationTouchSx: SxProps<Theme> = {
    borderTop: 1,
    borderColor: 'divider',
    flexShrink: 0,
    '& .MuiTablePagination-toolbar': {
        flexWrap: 'wrap',
        gap: 1,
        minHeight: MIN_TOUCH_TARGET_PX,
    },
    '& .MuiTablePagination-select': {
        minHeight: MIN_TOUCH_TARGET_PX,
    },
    '& .MuiTablePagination-selectIcon': {
        top: 'calc(50% - 0.5em)',
    },
    '& .MuiTablePagination-actions .MuiIconButton-root': {
        minWidth: MIN_TOUCH_TARGET_PX,
        minHeight: MIN_TOUCH_TARGET_PX,
    },
};
