import { useRef, useEffect } from "react";
import { useLocation } from "react-router";

const TAB_PATHS = ["/discover", "/saved", "/matches"];

export function useScrollMemory() {
    const location = useLocation();
    const scrollMap = useRef<Map<string, number>>(new Map());
    const prevPathname = useRef<string>(location.pathname);

    useEffect(() => {
        const incoming = location.pathname;
        const outgoing = prevPathname.current;

        if (incoming === outgoing) return;

        // Save outgoing tab's scroll position
        if (TAB_PATHS.includes(outgoing)) {
            scrollMap.current.set(outgoing, window.scrollY);
        }

        prevPathname.current = incoming;

        // Restore incoming tab's scroll position after the DOM has painted
        if (TAB_PATHS.includes(incoming)) {
            const saved = scrollMap.current.get(incoming) ?? 0;
            requestAnimationFrame(() => {
                window.scrollTo({ top: saved, behavior: "instant" });
            });
        }
    }, [location.pathname]);

    const clearScrollPosition = (pathname: string) => {
        scrollMap.current.delete(pathname);
    };

    return { clearScrollPosition };
}
