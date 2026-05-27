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

        if (!TAB_PATHS.includes(incoming)) return;

        const saved = scrollMap.current.get(incoming) ?? 0;

        if (saved === 0) {
            window.scrollTo({ top: 0, behavior: "instant" });
            return;
        }

        let rafId: number;
        let observer: ResizeObserver | null = null;
        let timeoutId: ReturnType<typeof setTimeout> | null = null;

        const canScroll = () =>
            document.documentElement.scrollHeight - window.innerHeight >= saved;

        const doRestore = () => {
            if (canScroll()) {
                observer?.disconnect();
                if (timeoutId) clearTimeout(timeoutId);
                window.scrollTo({ top: saved, behavior: "instant" });
            }
        };

        rafId = requestAnimationFrame(() => {
            if (canScroll()) {
                window.scrollTo({ top: saved, behavior: "instant" });
                return;
            }

            // Page not tall enough yet (async content still loading) — watch for growth
            observer = new ResizeObserver(doRestore);
            observer.observe(document.documentElement);

            // Give up after 3s and scroll to best-effort position
            timeoutId = setTimeout(() => {
                observer?.disconnect();
                window.scrollTo({ top: saved, behavior: "instant" });
            }, 3000);
        });

        return () => {
            cancelAnimationFrame(rafId);
            observer?.disconnect();
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [location.pathname]);

    const clearScrollPosition = (pathname: string) => {
        scrollMap.current.delete(pathname);
    };

    return { clearScrollPosition };
}
