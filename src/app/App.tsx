import { RouterProvider } from "react-router";
import { HelmetProvider } from "react-helmet-async";
import { useEffect } from "react";
import { router } from "./routes";

export default function App() {
    useEffect(() => {
        document.title = "DuoReel";
        if (!document.querySelector('link[rel="manifest"]')) {
            const l = document.createElement("link");
            l.rel = "manifest";
            l.href = "/manifest.json";
            l.crossOrigin = "anonymous";
            document.head.appendChild(l);
        }
        if ("serviceWorker" in navigator) {
            window.addEventListener("load", () => {
                navigator.serviceWorker
                    .register("/sw.js")
                    .then((reg) => console.log("SW registered:", reg.scope))
                    .catch((err) => console.warn("SW registration failed:", err));
            });
        }
    }, []);

    return (
        <HelmetProvider>
            <RouterProvider router={router} />
        </HelmetProvider>
    );
}
