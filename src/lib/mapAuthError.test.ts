import { describe, it, expect } from 'vitest';
import { mapAuthErrorMessage, mapLoginAuthErrorMessage } from '@/lib/mapAuthError';

describe('mapAuthErrorMessage', () => {
    it('maps rate limit messages', () => {
        const out = mapAuthErrorMessage('Email rate limit exceeded');
        expect(out).not.toContain('rate');
    });

    it('passes through unknown messages', () => {
        expect(mapAuthErrorMessage('Custom error')).toBe('Custom error');
    });
});

describe('mapLoginAuthErrorMessage', () => {
    it('maps invalid credentials', () => {
        const out = mapLoginAuthErrorMessage('Invalid login credentials');
        expect(out).not.toMatch(/invalid login/i);
    });

    it('maps email not confirmed', () => {
        const out = mapLoginAuthErrorMessage('Email not confirmed');
        expect(out.length).toBeGreaterThan(0);
    });
});
