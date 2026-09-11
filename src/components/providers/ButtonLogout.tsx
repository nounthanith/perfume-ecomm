"use client";

import { signOut } from "next-auth/react";
import Button from "@/components/ui/button";

interface ButtonLogoutProps {
    className?: string;
    variant?: "primary" | "outline" | "ghost";
}

export default function ButtonLogout({
    className = "",
    variant = "outline",
}: ButtonLogoutProps) {
    return (
        <Button
            type="button"
            variant={variant}
            className={className}
            onClick={() => signOut({ callbackUrl: "/login" })}
        >
            Logout
        </Button>
    );
}