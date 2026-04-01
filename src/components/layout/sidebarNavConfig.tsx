import type { SvgIconProps } from '@mui/material/SvgIcon';
import type { ComponentType } from 'react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import PaymentIcon from '@mui/icons-material/Payment';
import BusinessIcon from '@mui/icons-material/Business';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import { ROUTES } from '@/constants/routes';
import { ui } from '@/i18n/ui';

export type SidebarNavItem = {
    text: string;
    Icon: ComponentType<SvgIconProps>;
    path: string;
};

export const adminNavItems: SidebarNavItem[] = [
    { text: ui.adminDashboard.pageTitle, Icon: DashboardIcon, path: ROUTES.admin.dashboard },
    { text: ui.adminStudents.pageTitle, Icon: PeopleIcon, path: ROUTES.admin.students },
    { text: ui.nav.adminPayments, Icon: PaymentIcon, path: ROUTES.admin.payments },
    { text: ui.nav.adminTextbooks, Icon: LibraryBooksIcon, path: ROUTES.admin.textbooks },
    { text: ui.adminSettings.pageTitle, Icon: SettingsIcon, path: ROUTES.admin.settings },
];

/** 본사(플랫폼) 관리자 전용 — 사이드바 단일 항목 */
export const platformNavItems: SidebarNavItem[] = [
    {
        text: ui.platformBranchAdmins.navTitle,
        Icon: BusinessIcon,
        path: ROUTES.platform.branchAdmins,
    },
];
