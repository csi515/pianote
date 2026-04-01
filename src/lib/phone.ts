/**
 * 전화번호 문자열에서 숫자만 추출합니다.
 */
export function digitsOnly(input: string): string {
    return input.replace(/\D/g, '');
}

/**
 * 저장용: 숫자만 남긴 전화번호 (예: 01012345678)
 */
export function normalizePhoneDigits(raw: string): string {
    return digitsOnly(raw);
}

/**
 * 매칭용: 뒤 4자리 (4자리 미만이면 null)
 */
export function lastFourDigits(raw: string): string | null {
    const d = digitsOnly(raw);
    if (d.length < 4) return null;
    return d.slice(-4);
}

/**
 * 매칭용: 숫자만 기준 뒤 8자리 (8자리 미만이면 null)
 */
export function lastEightDigits(raw: string): string | null {
    const d = digitsOnly(raw);
    if (d.length < 8) return null;
    return d.slice(-8);
}

