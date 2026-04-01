import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { ROUTES } from '@/constants/routes';

export type PageTopBarState = {
    title: string | null;
    /** null이면 뒤로가기 버튼 숨김 */
    backTo: string | null;
};

const defaultState: PageTopBarState = {
    title: null,
    backTo: null,
};

type PageTopBarContextValue = PageTopBarState & {
    setPageTopBar: (patch: Partial<PageTopBarState>) => void;
    resetPageTopBar: () => void;
};

const PageTopBarContext = createContext<PageTopBarContextValue | null>(null);

export function PageTopBarProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<PageTopBarState>(defaultState);
    const resetPageTopBar = useCallback(() => setState(defaultState), []);
    const setPageTopBar = useCallback((patch: Partial<PageTopBarState>) => {
        setState((prev) => ({ ...prev, ...patch }));
    }, []);

    const value = useMemo(
        () => ({ ...state, setPageTopBar, resetPageTopBar }),
        [state, setPageTopBar, resetPageTopBar]
    );

    return (
        <PageTopBarContext.Provider value={value}>{children}</PageTopBarContext.Provider>
    );
}

export function usePageTopBarContextOptional() {
    return useContext(PageTopBarContext);
}

/**
 * 하위 화면에서 호출: 전역 TopBar에 페이지 제목·뒤로가기 경로 설정. 언마운트 시 초기화.
 */
export function usePageTopBar(config: { title: string; backTo?: string | null }) {
    const ctx = useContext(PageTopBarContext);
    const setPageTopBar = ctx?.setPageTopBar;
    const resetPageTopBar = ctx?.resetPageTopBar;

    useEffect(() => {
        if (!setPageTopBar || !resetPageTopBar) return;
        setPageTopBar({
            title: config.title,
            backTo: config.backTo === undefined ? ROUTES.admin.dashboard : config.backTo,
        });
        return () => resetPageTopBar();
        // ctx 전체를 넣으면 state 갱신마다 value 참조가 바뀌어 무한 루프가 난다. setter만 의존한다.
    }, [setPageTopBar, resetPageTopBar, config.title, config.backTo]);
}
