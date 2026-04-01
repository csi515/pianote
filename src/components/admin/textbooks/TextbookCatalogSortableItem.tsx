import React from 'react';
import { Box, IconButton, Paper, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { touchIconButtonSx } from '@/constants/touch';
import type { Database } from '@/lib/supabase';
import { ui } from '@/i18n/ui';

type TextbookRow = Database['public']['Tables']['textbooks']['Row'];

export type TextbookCatalogSortableItemProps = {
    row: TextbookRow;
    onEdit: () => void;
    onDelete: () => void;
    reorderDisabled?: boolean;
};

export const TextbookCatalogSortableItem: React.FC<TextbookCatalogSortableItemProps> = ({
    row,
    onEdit,
    onDelete,
    reorderDisabled = false,
}) => {
    const theme = useTheme();
    const isMobileList = useMediaQuery(theme.breakpoints.down('md'));
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: row.id,
        disabled: reorderDisabled,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const dragHandle = (
        <IconButton
            type="button"
            size="small"
            aria-label={ui.adminTextbooks.dragHandleAria}
            disabled={reorderDisabled}
            sx={{ ...touchIconButtonSx, cursor: reorderDisabled ? 'default' : 'grab' }}
            {...attributes}
            {...listeners}
        >
            <DragIndicatorIcon fontSize="small" />
        </IconButton>
    );

    const editDeleteIconButtons = (
        <>
            <IconButton
                type="button"
                size="small"
                color="primary"
                aria-label={ui.adminTextbooks.edit}
                onClick={onEdit}
                sx={touchIconButtonSx}
            >
                <EditOutlinedIcon fontSize="small" />
            </IconButton>
            <IconButton
                type="button"
                size="small"
                color="error"
                aria-label={ui.adminTextbooks.delete}
                onClick={onDelete}
                sx={touchIconButtonSx}
            >
                <DeleteOutlineIcon fontSize="small" />
            </IconButton>
        </>
    );

    return (
        <Paper
            ref={setNodeRef}
            variant="outlined"
            sx={{
                mb: 1.5,
                opacity: isDragging ? 0.65 : 1,
                boxShadow: isDragging ? 4 : undefined,
            }}
            style={style}
        >
            {isMobileList ? (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        px: 1.25,
                        py: 1,
                        overflowX: 'auto',
                        flexWrap: 'nowrap',
                        WebkitOverflowScrolling: 'touch',
                    }}
                >
                    <Stack direction="row" alignItems="center" gap={0.25} flexShrink={0}>
                        {dragHandle}
                    </Stack>
                    <Box
                        sx={{
                            flex: '1 1 auto',
                            minWidth: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            overflow: 'hidden',
                        }}
                    >
                        <Typography
                            variant="body2"
                            component="span"
                            fontWeight={600}
                            noWrap
                            title={row.name}
                            sx={{ minWidth: 0 }}
                        >
                            {row.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" component="span" flexShrink={0}>
                            {row.price.toLocaleString('ko-KR')}
                            {ui.common.currencyWon}
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.5} alignItems="center" flexShrink={0}>
                        {editDeleteIconButtons}
                    </Stack>
                </Box>
            ) : (
                <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={1.5}
                        alignItems={{ xs: 'stretch', sm: 'center' }}
                        justifyContent="space-between"
                    >
                        <Stack direction="row" alignItems="center" spacing={0.5} flexWrap="wrap" useFlexGap>
                            {dragHandle}
                            <Typography variant="subtitle1" component="span" sx={{ fontWeight: 600, ml: 0.5 }}>
                                {row.name}
                            </Typography>
                        </Stack>
                        <Stack
                            direction="row"
                            alignItems="center"
                            spacing={2}
                            justifyContent={{ xs: 'space-between', sm: 'flex-end' }}
                        >
                            <Typography variant="body2" color="text.secondary" component="span">
                                {ui.adminTextbooks.price}: {row.price.toLocaleString('ko-KR')}
                            </Typography>
                            <Stack direction="row" spacing={0.5} alignItems="center">
                                {editDeleteIconButtons}
                            </Stack>
                        </Stack>
                    </Stack>
                </Box>
            )}
        </Paper>
    );
};
