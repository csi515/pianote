/**
 * 로그인 시「로그인 상태 유지」에 따라 Supabase 세션을 localStorage vs sessionStorage에 둡니다.
 * 플래그는 localStorage에만 두어 새로고침 후에도 동일한 저장소를 사용합니다.
 */
const PERSIST_KEY = 'pianote-auth-persist';

export function getAuthPersistenceUseLocal (): boolean {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem(PERSIST_KEY) !== '0';
}

/** 로그인 직전에 호출. `true`면 브라우저를 닫아도 유지(local), `false`면 탭만(session). */
export function setAuthPersistenceUseLocal (useLocal: boolean): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(PERSIST_KEY, useLocal ? '1' : '0');
}

function targetStorage (): Storage {
    if (typeof window === 'undefined') return localStorage;
    return getAuthPersistenceUseLocal() ? window.localStorage : window.sessionStorage;
}

/** Supabase Auth client용 Storage — get/set 시점에 위 플래그를 따릅니다. */
export function createAuthStorageProxy (): Storage {
    return {
        get length () {
            return targetStorage().length;
        },
        clear () {
            targetStorage().clear();
        },
        getItem (key: string) {
            return targetStorage().getItem(key);
        },
        setItem (key: string, value: string) {
            targetStorage().setItem(key, value);
        },
        removeItem (key: string) {
            targetStorage().removeItem(key);
        },
        key (index: number) {
            return targetStorage().key(index);
        },
    };
}

function clearSupabaseKeys (storage: Storage): void {
    const toRemove: string[] = [];
    for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i);
        if (k?.startsWith('sb-')) toRemove.push(k);
    }
    for (const k of toRemove) {
        storage.removeItem(k);
    }
}

/** 로그인 직전: 사용하지 않는 쪽 저장소의 Supabase 토큰을 지워 이중 세션을 방지합니다. */
export function clearOppositeAuthStorage (): void {
    if (typeof window === 'undefined') return;
    if (getAuthPersistenceUseLocal()) {
        clearSupabaseKeys(window.sessionStorage);
    } else {
        clearSupabaseKeys(window.localStorage);
    }
}
