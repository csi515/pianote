import { ui } from '@/i18n/ui';

/** Supabase Auth 등에서 오는 메시지를 UI용으로 치환 */
export function mapAuthErrorMessage(raw: string): string {
    const lower = raw.toLowerCase();
    if (lower.includes('rate limit') || lower.includes('email rate')) {
        return ui.auth.rateLimitEmail;
    }
    if (
        lower.includes('row-level security') ||
        lower.includes('violates row-level security') ||
        (lower.includes('academies') && lower.includes('policy'))
    ) {
        return ui.auth.rlsSignupBlocked;
    }
    if (
        lower.includes('duplicate key') ||
        lower.includes('unique constraint') ||
        lower.includes('academies_owner_email')
    ) {
        return ui.auth.duplicateOwnerEmail;
    }
    if (lower.includes('database error') && lower.includes('saving new user')) {
        return ui.auth.signupDatabaseError;
    }
    return raw;
}

/** updateUser(password) 등 비밀번호 변경 응답 */
export function mapPasswordUpdateErrorMessage (raw: string): string {
    const lower = raw.toLowerCase();
    if (lower.includes('same') && lower.includes('password')) {
        return ui.auth.passwordChange.sameAsOld;
    }
    if (
        lower.includes('password') &&
        (lower.includes('weak') || lower.includes('least') || lower.includes('least 6'))
    ) {
        return ui.auth.passwordChange.weakPassword;
    }
    return mapAuthErrorMessage(raw);
}

export function mapPasswordUpdateError (err: unknown): Error {
    const msg =
        err instanceof Error
            ? err.message
            : typeof err === 'object' && err !== null && 'message' in err
              ? String((err as { message: unknown }).message)
              : String(err);
    return new Error(mapPasswordUpdateErrorMessage(msg));
}

export function mapAuthError(err: unknown): Error {
    const msg =
        err instanceof Error
            ? err.message
            : typeof err === 'object' && err !== null && 'message' in err
              ? String((err as { message: unknown }).message)
              : String(err);
    return new Error(mapAuthErrorMessage(msg));
}

/** 로그인(signInWithPassword) 오류 메시지 — 가입용 mapAuthErrorMessage 위에 로그인 전용 매핑 */
export function mapLoginAuthErrorMessage(raw: string): string {
    const lower = raw.toLowerCase();
    if (
        lower.includes('invalid login credentials') ||
        lower.includes('invalid_grant') ||
        lower.includes('invalid email or password')
    ) {
        return ui.auth.loginInvalidCredentials;
    }
    if (lower.includes('email not confirmed')) {
        return ui.auth.loginEmailNotConfirmed;
    }
    return mapAuthErrorMessage(raw);
}

export function mapLoginAuthError(err: unknown): Error {
    const msg =
        err instanceof Error
            ? err.message
            : typeof err === 'object' && err !== null && 'message' in err
              ? String((err as { message: unknown }).message)
              : String(err);
    return new Error(mapLoginAuthErrorMessage(msg));
}
