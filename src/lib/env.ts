/** Vite 클라이언트 환경 — 데모/배포 전 필수 값 확인용 */
export function isSupabaseConfigured(): boolean {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    return Boolean(
        typeof url === 'string' &&
            url.length > 0 &&
            typeof key === 'string' &&
            key.length > 0
    );
}
