import { lazy, type ComponentType } from 'react';
import { ROUTES } from '@/constants/routes';

export type AppRole = 'admin';

export type ProtectedRouteDef = {
    path: string;
    Component: ComponentType;
    allowedRoles: AppRole[];
};

const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'));
const Settings = lazy(() => import('@/pages/admin/Settings'));
const StudentManagement = lazy(() => import('@/pages/admin/StudentManagement'));
const PaymentsManagement = lazy(() => import('@/pages/admin/PaymentsManagement'));
const TextbooksCatalogPage = lazy(() => import('@/pages/admin/TextbooksCatalogPage'));

export const protectedRouteDefs: ProtectedRouteDef[] = [
    { path: ROUTES.admin.dashboard, Component: AdminDashboard, allowedRoles: ['admin'] },
    { path: ROUTES.admin.students, Component: StudentManagement, allowedRoles: ['admin'] },
    { path: ROUTES.admin.settings, Component: Settings, allowedRoles: ['admin'] },
    { path: ROUTES.admin.payments, Component: PaymentsManagement, allowedRoles: ['admin'] },
    { path: ROUTES.admin.textbooks, Component: TextbooksCatalogPage, allowedRoles: ['admin'] },
];
