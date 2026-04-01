import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { fetchAcademyById, fetchUserProfile } from '@/lib/authData';
import { AUTH_NOTICE_PROFILE_MISSING, AUTH_SESSION_NOTICE_KEY } from '@/lib/authSessionNotice';
import { mapAuthError, mapLoginAuthError, mapPasswordUpdateError } from '@/lib/mapAuthError';
import { signUpAdmin } from '@/lib/authSignUp';
import { ROUTES } from '@/constants/routes';
import { getDevMockAuth, isDevAuthBypass } from '@/lib/devAuth';
import { ui } from '@/i18n/ui';
import type { Academy, AuthContextType, UserProfile } from '@/types/auth';

export type { UserProfile, Academy } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [academy, setAcademy] = useState<Academy | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const bootstrapAttemptedRef = useRef<Set<string>>(new Set());

    const tryBootstrapMissingProfile = async (user: User) => {
        const uid = user.id;
        if (bootstrapAttemptedRef.current.has(uid)) return;
        bootstrapAttemptedRef.current.add(uid);

        const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
        const role = String(meta.signup_role ?? '').trim().toLowerCase();

        try {
            if (role === 'admin') {
                const displayName = String(meta.display_name ?? '').trim();
                const academyName = String(meta.academy_name ?? '').trim();
                if (!displayName || !academyName) return;
                await supabase.rpc('signup_admin_bootstrap', {
                    p_display_name: displayName,
                    p_academy_name: academyName,
                });
            }
        } catch (error) {
            // bootstrap 실패는 아래에서 "프로필 없음" 흐름으로 안내한다.
            console.warn('Profile bootstrap failed:', error);
        }
    };

    const loadUserData = async (userId: string) => {
        try {
            const profileData = await fetchUserProfile(userId);
            if (!profileData) {
                const {
                    data: { user: currentUser },
                } = await supabase.auth.getUser();
                if (currentUser) {
                    await tryBootstrapMissingProfile(currentUser);
                    const retry = await fetchUserProfile(userId);
                    if (retry) {
                        setProfile(retry);
                        if (retry.academy_id) {
                            const academyData = await fetchAcademyById(retry.academy_id);
                            setAcademy(academyData);
                        } else {
                            setAcademy(null);
                        }
                        return;
                    }
                }

                sessionStorage.setItem(AUTH_SESSION_NOTICE_KEY, AUTH_NOTICE_PROFILE_MISSING);
                setProfile(null);
                setAcademy(null);
                await supabase.auth.signOut();
                return;
            }
            setProfile(profileData);

            if (profileData.academy_id) {
                const academyData = await fetchAcademyById(profileData.academy_id);
                setAcademy(academyData);
            } else {
                setAcademy(null);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            setProfile(null);
            setAcademy(null);
        }
    };

    const applyDevMock = () => {
        const { user, profile, academy } = getDevMockAuth();
        setUser(user);
        setProfile(profile);
        setAcademy(academy);
        setSession(null);
    };

    useEffect(() => {
        let cancelled = false;

        const clearAuth = () => {
            setSession(null);
            setUser(null);
            setProfile(null);
            setAcademy(null);
        };

        void (async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            if (cancelled) return;

            if (session?.user) {
                setSession(session);
                setUser(session.user);
                await loadUserData(session.user.id);
                if (!cancelled) setLoading(false);
                return;
            }

            if (isDevAuthBypass()) {
                applyDevMock();
                if (!cancelled) setLoading(false);
                return;
            }

            setLoading(false);
        })();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setSession(session);
                setUser(session.user);
                void loadUserData(session.user.id);
                return;
            }
            if (isDevAuthBypass()) {
                applyDevMock();
                return;
            }
            clearAuth();
        });

        return () => {
            cancelled = true;
            subscription.unsubscribe();
        };
    }, []);

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { error: error ? mapLoginAuthError(error) : null };
    };

    const signUp = (email: string, password: string, name: string, phone: string, academyName: string) =>
        signUpAdmin(email, password, name, phone, academyName);

    const signOut = async () => {
        await supabase.auth.signOut();
        if (isDevAuthBypass()) {
            const { user, profile, academy } = getDevMockAuth();
            setUser(user);
            setProfile(profile);
            setAcademy(academy);
            setSession(null);
        }
    };

    /**
     * 마이페이지 저장 등 직후 호출. 실제 로그인 세션이 있으면 DB에서 다시 로드해야 하며,
     * 개발 모드에서도 `applyDevMock()`으로 덮어쓰면 저장한 학원명·원장명이 즉시 사라진다.
     */
    const refreshUserProfile = async () => {
        const {
            data: { session: currentSession },
        } = await supabase.auth.getSession();
        if (currentSession?.user?.id) {
            await loadUserData(currentSession.user.id);
            return;
        }
        if (isDevAuthBypass()) {
            applyDevMock();
        }
    };

    const changePassword = async (currentPassword: string, newPassword: string) => {
        if (isDevAuthBypass() && !session) {
            return { error: new Error(ui.auth.passwordChange.devBypassUnavailable) };
        }
        const email = user?.email?.trim();
        if (!email) {
            return { error: new Error(ui.auth.passwordChange.noEmail) };
        }
        const { error: signErr } = await supabase.auth.signInWithPassword({
            email,
            password: currentPassword,
        });
        if (signErr) {
            return { error: mapLoginAuthError(signErr) };
        }
        const { error: upErr } = await supabase.auth.updateUser({ password: newPassword });
        if (upErr) {
            return { error: mapPasswordUpdateError(upErr) };
        }
        return { error: null };
    };

    const requestPasswordReset = async (email: string) => {
        const redirectTo = `${window.location.origin}${ROUTES.auth.resetPassword}`;
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
            redirectTo,
        });
        return { error: error ? mapAuthError(error) : null };
    };

    const isAdmin = () => profile?.role === 'admin';
    const isStudent = () => profile?.role === 'student';

    const value: AuthContextType = {
        user,
        profile,
        academy,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        changePassword,
        requestPasswordReset,
        refreshUserProfile,
        isAdmin,
        isStudent,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
