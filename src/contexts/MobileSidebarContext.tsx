import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type MobileSidebarContextValue = {
    mobileOpen: boolean;
    setMobileOpen: (open: boolean) => void;
    closeMobileSidebar: () => void;
};

const MobileSidebarContext = createContext<MobileSidebarContextValue | null>(null);

export function MobileSidebarProvider ({ children }: { children: React.ReactNode }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const closeMobileSidebar = useCallback(() => setMobileOpen(false), []);
    const value = useMemo(
        () => ({ mobileOpen, setMobileOpen, closeMobileSidebar }),
        [mobileOpen, closeMobileSidebar]
    );
    return (
        <MobileSidebarContext.Provider value={value}>{children}</MobileSidebarContext.Provider>
    );
}

export function useMobileSidebar (): MobileSidebarContextValue {
    const ctx = useContext(MobileSidebarContext);
    if (!ctx) {
        throw new Error('useMobileSidebar must be used within MobileSidebarProvider');
    }
    return ctx;
}
