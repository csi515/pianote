/** 학원 관리 고정 사이드바 폭 — 태블릿·터치에서 메뉴 탭 여유 */
export const ADMIN_DRAWER_WIDTH = 260;

/** 모바일 하단 탭(아이콘+짧은 라벨) 콘텐츠 영역 최소 높이 — fixed 바와 본문 pb 계산에 동일 적용 */
export const MOBILE_BOTTOM_NAV_INNER_HEIGHT_PX = 56;

/**
 * md 미만 본문 `padding-bottom` — 고정 BottomNavigation + iOS safe-area.
 * MUI `sx` 브레이크포인트로 적용해 초기 프레임에서 콘텐츠가 바에 가려지지 않게 함.
 */
export const MOBILE_MAIN_BOTTOM_PADDING = `calc(${MOBILE_BOTTOM_NAV_INNER_HEIGHT_PX}px + env(safe-area-inset-bottom, 0px))`;

/** 모바일(xs) 본문 좌우 여백(px) — Container·safe-area와 맞춤 */
export const MOBILE_GUTTER_PX = 14;
