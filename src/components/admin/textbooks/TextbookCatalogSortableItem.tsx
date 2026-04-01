import React from 'react';
import { Box, Button, IconButton, Paper, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { touchButtonSx, touchIconButtonSx } from '@/constants/touch';
import type { Database } from '@/lib/supabase';
import { ui } from '@/i18n/ui';

type TextbookRow = Database['public']['Tables']['textbooks']['Row'];

export type TextbookCatalogSortableItemProps = {
    row: TextbookRow;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onEdit: () => void;
    onDelete: () => void;
    disableUp: boolean;
    disableDown: boolean;
    reorderDisabled?: boolean;
};

export const TextbookCatalogSortableItem: React.FC<TextbookCatalogSortableItemProps> = ({
    row,
    onMoveUp,
    onMoveDown,
    onEdit,
    onDelete,
    disableUp,
    disableDown,
    reorderDisabled = false,
}) => {
    const theme = useTheme();
    const isMobileList = useMediaQuery(theme.breakpoints.down('sm'));
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: row.id,
        disabled: reorderDisabled,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const reorderControls = (
        <>
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
            <IconButton
                type="button"
                aria-label={ui.adminTextbooks.moveOrderUpAria}
                size="small"
                disabled={disableUp || reorderDisabled}
                onClick={onMoveUp}
                sx={touchIconButtonSx}
            >
                <ArrowUpwardIcon fontSize="small" />
            </IconButton>
            <IconButton
                type="button"
                aria-label={ui.adminTextbooks.moveOrderDownAria}
                size="small"
                disabled={disableDown || reorderDisabled}
                onClick={onMoveDown}
                sx={touchIconButtonSx}
            >
                <ArrowDownwardIcon fontSize="small" />
            </IconButton>
        </>
    );

    const editDeleteButtons = (
        <>
            <Button size="small" variant="outlined" onClick={onEdit} sx={touchButtonSx}>
                {ui.adminTextbooks.edit}
            </Button>
            <Button size="small" color="error" onClick={onDelete} sx={touchButtonSx}>
                {ui.adminTextbooks.delete}
            </Button>
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
                <>
                    <Box sx={{ p: 2, pb: 1 }}>
                        <Stack spacing={1}>
                            <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 600 }}>
                                {row.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {ui.adminTextbooks.price}: {row.price.toLocaleString('ko-KR')}
                            </Typography>
                        </Stack>
                    </Box>
                    <Box
                        sx={{
                            px: 2,
                            pb: 2,
                            pt: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1.5,
                            alignItems: 'stretch',
                        }}
                    >
                        <Stack
                            direction="row"
                            flexWrap="wrap"
                            gap={0.5}
                            justifyContent="flex-start"
                            alignItems="center"
                        >
                            {reorderControls}
                        </Stack>
                        <Stack direction="row" flexWrap="wrap" gap={1} justifyContent="flex-end">
                            {editDeleteButtons}
                        </Stack>
                    </Box>
                </>
            ) : (
                <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={1.5}
                        alignItems={{ xs: 'stretch', sm: 'center' }}
                        justifyContent="space-between"
                    >
                        <Stack direction="row" alignItems="center" spacing={0.5} flexWrap="wrap" useFlexGap>
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
                            <IconButton
                                type="button"
                                aria-label={ui.adminTextbooks.moveOrderUpAria}
                                size="small"
                                disabled={disableUp || reorderDisabled}
                                onClick={onMoveUp}
                                sx={touchIconButtonSx}
                            >
                                <ArrowUpwardIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                                type="button"
                                aria-label={ui.adminTextbooks.moveOrderDownAria}
                                size="small"
                                disabled={disableDown || reorderDisabled}
                                onClick={onMoveDown}
                                sx={touchIconButtonSx}
                            >
                                <ArrowDownwardIcon fontSize="small" />
                            </IconButton>
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
                            <Stack direction="row" spacing={1}>
                                <Button size="small" variant="outlined" onClick={onEdit}>
                                    {ui.adminTextbooks.edit}
                                </Button>
                                <Button size="small" color="error" onClick={onDelete}>
                                    {ui.adminTextbooks.delete}
                                </Button>
                            </Stack>
                        </Stack>
                    </Stack>
                </Box>
            )}
        </Paper>
    );
};
