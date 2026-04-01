/**
 * 앱 라우트 경로 (사이드바·라우터·리다이렉트에서 공통 사용)
 */
export const ROUTES = {
  /** 소개·마케팅 랜딩 */
  landing: '/welcome',
  /** 앱 진입(루트) = 로그인 */
  login: '/',
  signup: '/signup',
  /** 임시: 관리자 전용 회원가입 (signUpAdmin → users.role=admin) */
  signupAdmin: '/signup/admin',
  /** 비밀번호 재설정(이메일 링크의 redirectTo와 동일 경로) */
  auth: {
    forgotPassword: '/forgot-password',
    resetPassword: '/reset-password',
  },
  admin: {
    dashboard: '/admin/dashboard',
    students: '/admin/students',
    settings: '/admin/settings',
    payments: '/admin/payments',
    textbooks: '/admin/textbooks',
  },
  /** 본사(플랫폼) 관리자 전용 */
  platform: {
    branchAdmins: '/platform/branch-admins',
  },
} as const;
