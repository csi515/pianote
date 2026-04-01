/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_ANON_KEY: string;
    readonly VITE_DEV_BYPASS_AUTH?: string;
    readonly VITE_DEV_ACADEMY_ID?: string;
    readonly VITE_DEV_ACADEMY_NAME?: string;
    readonly VITE_DEV_ROLE?: string;
    /** 프로덕션에서만 사용. 설정 시 Sentry 에러 리포팅 활성화 */
    readonly VITE_SENTRY_DSN?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
/// <reference types="vite-plugin-pwa/client" />
