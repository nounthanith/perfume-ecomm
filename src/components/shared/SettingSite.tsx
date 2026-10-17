"use client";

import { useEffect, useState } from "react";
import Marquee from "react-fast-marquee";
import { Megaphone, Store } from "lucide-react";
import { useFetch } from "@/hooks/useFetch";

interface PublicSetting {
    shopStatus: boolean;
    message: string;
}

interface SettingResponse {
    setting: PublicSetting;
}

export default function SettingSite() {
    const { data } = useFetch<SettingResponse>("/api/setting/public", {
        cache: false,
    });
    const [hidden, setHidden] = useState(false);

    useEffect(() => {
        const onScroll = () => setHidden(window.scrollY > 8);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const setting = data?.setting;
    if (!setting) return null;

    const isOpen = setting.shopStatus ?? true;
    const message = setting.message?.trim() ?? "";

    if (isOpen && !message) return null;

    return (
        <div
            className={`overflow-hidden transition-[max-height] duration-300 ease-out ${hidden ? "max-h-0" : "max-h-24"
                }`}
        >
            {!isOpen && (
                <div className="flex items-center justify-center gap-2 border-b border-white/20 bg-red-600 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                    <Store className="h-3.5 w-3.5 shrink-0" />
                    <span>Currently closed — orders resume soon</span>
                </div>
            )}

            {message && (
                <div className="border-b border-foreground/10 bg-foreground py-2 text-background">
                    <Marquee autoFill gradient={false} speed={45} pauseOnHover>
                        <span className="mx-8 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em]">
                            <Megaphone className="h-3.5 w-3.5 shrink-0" />
                            {message}
                        </span>
                        ✦
                    </Marquee>
                </div>
            )}
        </div>
    );
}
