import { createContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { checkPlatformAdmin } from '@/services/platformAdmin.service';

export type PlatformAdminState = {
    isPlatformAdmin: boolean;
    loading: boolean;
};

export const PlatformAdminContext = createContext<PlatformAdminState | undefined>(undefined);

export function PlatformAdminProvider ({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function run () {
            if (!user) {
                setIsPlatformAdmin(false);
                setLoading(false);
                return;
            }
            setLoading(true);
            const ok = await checkPlatformAdmin(user.id);
            if (!cancelled) {
                setIsPlatformAdmin(ok);
                setLoading(false);
            }
        }

        void run();
        return () => {
            cancelled = true;
        };
    }, [user]);

    return (
        <PlatformAdminContext.Provider value={{ isPlatformAdmin, loading }}>
            {children}
        </PlatformAdminContext.Provider>
    );
}
