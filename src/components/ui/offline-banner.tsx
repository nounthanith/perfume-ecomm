// components/OfflineBanner.tsx
"use client";

import { useEffect, useState } from "react";

export default function OfflineBanner() {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        setIsOnline(navigator.onLine);
        const goOnline = () => setIsOnline(true);
        const goOffline = () => setIsOnline(false);

        window.addEventListener("online", goOnline);
        window.addEventListener("offline", goOffline);
        return () => {
            window.removeEventListener("online", goOnline);
            window.removeEventListener("offline", goOffline);
        };
    }, []);

    if (isOnline) return null;

    return (
        <div className="fixed inset-x-0 top-0 z-50 bg-foreground/90 p-3 text-center text-sm text-background">
            You&apos;re offline. Some features may not work until your connection is back.
        </div>
    );
}