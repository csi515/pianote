import { useContext } from 'react';
import { PlatformAdminContext } from '@/contexts/PlatformAdminContext';

export function usePlatformAdmin () {
    const ctx = useContext(PlatformAdminContext);
    if (!ctx) {
        throw new Error('usePlatformAdmin must be used within PlatformAdminProvider');
    }
    return ctx;
}
