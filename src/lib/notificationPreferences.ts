/** 관리자 상단 알림 배지에 포함할 항목 (브라우저 localStorage) */

export const NOTIFICATION_PREFS_STORAGE_KEY = 'pianote.notificationPrefs.v2';

export type AdminNotificationPrefs = {
    /** `payments` 연체 청구 건수(대시보드·종과 동일) */
    paymentsOverdue: boolean;
    /** 교재비(`student_textbooks`) 미납 활성 학생 수 */
    textbookFeesUnpaid: boolean;
};

const DEFAULTS: AdminNotificationPrefs = {
    paymentsOverdue: true,
    textbookFeesUnpaid: true,
};

export function getDefaultAdminNotificationPrefs(): AdminNotificationPrefs {
    return { ...DEFAULTS };
}

export function loadAdminNotificationPrefs(): AdminNotificationPrefs {
    try {
        const raw = localStorage.getItem(NOTIFICATION_PREFS_STORAGE_KEY);
        if (!raw) {
            const legacy = localStorage.getItem('pianote.notificationPrefs.v1');
            if (legacy) {
                try {
                    const p = JSON.parse(legacy) as { paymentsOverdue?: boolean };
                    const migrated: AdminNotificationPrefs = {
                        paymentsOverdue:
                            typeof p.paymentsOverdue === 'boolean'
                                ? p.paymentsOverdue
                                : DEFAULTS.paymentsOverdue,
                        textbookFeesUnpaid: DEFAULTS.textbookFeesUnpaid,
                    };
                    saveAdminNotificationPrefs(migrated);
                    return migrated;
                } catch {
                    /* fall through */
                }
            }
            return { ...DEFAULTS };
        }
        const parsed = JSON.parse(raw) as Partial<AdminNotificationPrefs>;
        return {
            paymentsOverdue:
                typeof parsed.paymentsOverdue === 'boolean'
                    ? parsed.paymentsOverdue
                    : DEFAULTS.paymentsOverdue,
            textbookFeesUnpaid:
                typeof parsed.textbookFeesUnpaid === 'boolean'
                    ? parsed.textbookFeesUnpaid
                    : DEFAULTS.textbookFeesUnpaid,
        };
    } catch {
        return { ...DEFAULTS };
    }
}

export function saveAdminNotificationPrefs(prefs: AdminNotificationPrefs): void {
    localStorage.setItem(NOTIFICATION_PREFS_STORAGE_KEY, JSON.stringify(prefs));
    window.dispatchEvent(new CustomEvent('pianote-notification-prefs-changed'));
}
