"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import ButtonLogout from "../providers/ButtonLogout";

export default function ClientLayout() {
    const { status } = useSession();
    const isLoggedIn = status === "authenticated";

    const navItems = isLoggedIn
        ? [
            { label: "Home", path: "/" },
            { label: "Profile", path: "/profile" },
        ]
        : [
            { label: "Home", path: "/" },
            { label: "Login", path: "/login" },
            { label: "Register", path: "/register" },
        ];

    return (
        <nav className="flex flex-wrap items-center justify-center gap-2 border-b border-foreground/10 bg-background p-4 sm:justify-start">
            {navItems.map((item) => (
                <Link
                    key={item.path}
                    href={item.path}
                    className="rounded-md px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-foreground/10 hover:text-foreground"
                >
                    {item.label}
                </Link>
            ))}
            {isLoggedIn && <ButtonLogout className="h-8 px-2 text-xs" />}
        </nav>
    );
}