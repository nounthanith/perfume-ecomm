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
        <nav className="flex flex-wrap items-center justify-center gap-2 border-b border-foreground/10 p-4 sm:justify-start">
            {navItems.map((item) => (
                <Link
                    key={item.path}
                    href={item.path}
                    className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
                >
                    {item.label}
                </Link>
            ))}
            {isLoggedIn && <ButtonLogout className="px-2 h-1 text-xs"/>}
        </nav>
    );
}