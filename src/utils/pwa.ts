/** 설치형 PWA(홈 화면 앱)에서 브라우저 탭과 구분할 때 사용 */
export function isStandalonePwa(): boolean {
    if (typeof window === 'undefined') return false;
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    );
}
