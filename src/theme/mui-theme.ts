import { createTheme } from '@mui/material/styles';
import { MOBILE_GUTTER_PX } from '@/constants/layout';
import { MIN_TOUCH_TARGET_PX } from '@/constants/touch';

/** 학원·가정 모두 읽기 편한 따뜻한 톤 (과한 채도·날카로운 네이비 지양) */
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4A6B8A',
      light: '#6E8EAC',
      dark: '#354A63',
      contrastText: '#fff',
    },
    secondary: {
      main: '#E89888',
      light: '#F4C4BA',
      dark: '#C96B5C',
      contrastText: '#2C3540',
    },
    background: {
      default: '#FAF7F2',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2C3540',
      secondary: '#5C6670',
      disabled: '#9AA3AD',
    },
    divider: 'rgba(74, 107, 138, 0.12)',
    success: {
      main: '#43A047',
      light: '#E8F5E9',
    },
    warning: {
      main: '#F5A623',
      light: '#FFF6E5',
    },
    error: {
      main: '#E53935',
    },
    info: {
      main: '#29B6F6',
    },
  },
  typography: {
    fontFamily: [
      'Noto Sans KR',
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'sans-serif',
    ].join(','),
    h1: { fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500, lineHeight: 1.6 },
    subtitle2: { fontWeight: 500, lineHeight: 1.5 },
    body1: { lineHeight: 1.65 },
    body2: { lineHeight: 1.6 },
    button: { fontWeight: 600, letterSpacing: '0.02em' },
  },
  shape: {
    /** 데이터 테이블·카드 공통: 과한 알약형 지양 */
    borderRadius: 10,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          WebkitFontSmoothing: 'antialiased',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 14,
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 22px',
          '&:focus-visible': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: 2,
          },
        }),
        /** 터치 최소 권장 — 관리자 화면 전반 44px 정렬 */
        sizeSmall: {
          minHeight: MIN_TOUCH_TARGET_PX,
        },
        sizeMedium: {
          minHeight: MIN_TOUCH_TARGET_PX,
        },
        sizeLarge: {
          minHeight: MIN_TOUCH_TARGET_PX,
        },
        contained: {
          boxShadow: '0 2px 8px rgba(74, 107, 138, 0.22)',
          '&:hover': {
            boxShadow: '0 4px 14px rgba(74, 107, 138, 0.28)',
          },
        },
        outlined: {
          borderWidth: 1.5,
          '&:hover': {
            borderWidth: 1.5,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 12px rgba(74, 107, 138, 0.08)',
          border: '1px solid rgba(74, 107, 138, 0.06)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundImage: 'none',
        },
        rounded: {
          borderRadius: 10,
        },
        /** 목록·결제 등 테이블 외곽선 카드 */
        outlined: {
          borderRadius: 8,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          minWidth: MIN_TOUCH_TARGET_PX,
          minHeight: MIN_TOUCH_TARGET_PX,
          '&:focus-visible': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: 2,
          },
        }),
      },
    },
    MuiTab: {
      styleOverrides: {
        root: ({ theme }) => ({
          '&:focus-visible': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: -2,
            borderRadius: 1,
          },
        }),
      },
    },
    MuiFab: {
      styleOverrides: {
        root: ({ theme }) => ({
          '&:focus-visible': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: 2,
          },
        }),
      },
    },
    MuiSwitch: {
      styleOverrides: {
        switchBase: ({ theme }) => ({
          '&.Mui-focusVisible': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: 2,
            borderRadius: '50%',
          },
        }),
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRadius: 14,
          [theme.breakpoints.down('sm')]: {
            margin: theme.spacing(1.5),
            width: 'calc(100% - 24px)',
            maxHeight: 'calc(100% - 24px)',
          },
          /** 태블릿: 가장자리 여백·한 손 조작 시 시야 확보 */
          [theme.breakpoints.between('sm', 'lg')]: {
            margin: theme.spacing(2.5),
            maxHeight: 'calc(100% - 40px)',
          },
        }),
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 500,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 12,
          marginLeft: 8,
          marginRight: 8,
          marginBottom: 2,
          minHeight: 48,
          paddingTop: 11,
          paddingBottom: 11,
          [theme.breakpoints.up('sm')]: {
            paddingTop: 12,
            paddingBottom: 12,
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(74, 107, 138, 0.12)',
            '&:hover': {
              backgroundColor: 'rgba(74, 107, 138, 0.16)',
            },
          },
        }),
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          maxWidth: '100%',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          /** Paper로 감싼 테이블: 전역 Paper(10)보다 살짝 각짐 */
          '&.MuiPaper-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        toolbar: {
          flexWrap: 'wrap',
          justifyContent: 'flex-end',
          gap: 8,
          minHeight: 'auto',
          paddingTop: 8,
          paddingBottom: 8,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: ({ theme }) => ({
          fontWeight: 600,
          fontSize: '0.8125rem',
          letterSpacing: '0.02em',
          color: theme.palette.text.secondary,
          borderBottomWidth: 2,
        }),
        body: ({ theme }) => ({
          [theme.breakpoints.up('sm')]: {
            paddingTop: theme.spacing(1.75),
            paddingBottom: theme.spacing(1.75),
            paddingLeft: theme.spacing(2),
            paddingRight: theme.spacing(2),
          },
          [theme.breakpoints.up('md')]: {
            paddingTop: theme.spacing(2),
            paddingBottom: theme.spacing(2),
            paddingLeft: theme.spacing(2.25),
            paddingRight: theme.spacing(2.25),
          },
        }),
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: ({ theme }) => ({
          paddingBottom: theme.spacing(2),
          borderBottom: `1px solid ${theme.palette.divider}`,
        }),
      },
    },
    /** DialogTitle 직후 기본 paddingTop:0 은 outlined Select/TextField 라벨 노치가 스크롤 영역 상단에서 잘림 */
    MuiDialogContent: {
      styleOverrides: {
        root: ({ theme }) => ({
          '.MuiDialogTitle-root + &': {
            paddingTop: theme.spacing(2),
          },
        }),
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: ({ theme }) => ({
          padding: theme.spacing(2, 3),
          gap: theme.spacing(1),
          flexWrap: 'wrap',
        }),
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: ({ theme }) => ({
          paddingLeft: `max(${MOBILE_GUTTER_PX}px, env(safe-area-inset-left))`,
          paddingRight: `max(${MOBILE_GUTTER_PX}px, env(safe-area-inset-right))`,
          [theme.breakpoints.down('sm')]: {
            maxWidth: '100%',
            width: '100%',
          },
          [theme.breakpoints.between('sm', 'lg')]: {
            paddingLeft: `max(${theme.spacing(2.5)}, env(safe-area-inset-left))`,
            paddingRight: `max(${theme.spacing(2.5)}, env(safe-area-inset-right))`,
          },
        }),
      },
    },
  },
});
