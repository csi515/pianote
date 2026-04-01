import { describe, it, expect } from 'vitest';
import {
    digitsOnly,
    lastFourDigits,
    lastEightDigits,
} from '@/lib/phone';

describe('digitsOnly', () => {
    it('strips non-digits', () => {
        expect(digitsOnly('010-1234-5678')).toBe('01012345678');
    });
});

describe('lastFourDigits', () => {
    it('returns last 4 when enough digits', () => {
        expect(lastFourDigits('01012345678')).toBe('5678');
    });
    it('returns null when too short', () => {
        expect(lastFourDigits('123')).toBeNull();
    });
});

describe('lastEightDigits', () => {
    it('returns last 8 when enough digits', () => {
        expect(lastEightDigits('01012345678')).toBe('12345678');
    });
    it('returns null when too short', () => {
        expect(lastEightDigits('1234567')).toBeNull();
    });
});

