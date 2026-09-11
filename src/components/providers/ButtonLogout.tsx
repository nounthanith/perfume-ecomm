"use client";

import { signOut } from "next-auth/react";
import Button from "../ui/button";

interface ButtonLogoutProps {
    className?: string;
    variant?: "primary" | "outline" | "ghost";
}

export default function ButtonLogout({
    className = "",
    variant = "outline",
}: ButtonLogoutProps) {
    const handleLogout = () => {
        const isConfirmed = window.confirm("Are you sure you want to log out?");
        if (isConfirmed) {
            signOut({ callbackUrl: "/login" });
        }
    };

    return (
        <Button
            size="lg"
            type="button"
            className={className}
            onClick={handleLogout}
        >
            Logout
        </Button>
    );
}