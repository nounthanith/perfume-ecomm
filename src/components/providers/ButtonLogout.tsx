"use client";

import { signOut } from "next-auth/react";

interface ButtonLogoutProps {
    className?: string;
    variant?: "primary" | "outline" | "ghost";
}

export default function ButtonLogout({
    className = "",
    variant = "outline",
}: ButtonLogoutProps) {
    return (
        <button
            type="button"
            className={className}
            onClick={() => signOut({ callbackUrl: "/login" })}
        >
            Logout
        </button>
    );
}