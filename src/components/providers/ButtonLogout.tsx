"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import Button from "../ui/button";
import Dialog from "../ui/dialog";

interface ButtonLogoutProps {
    className?: string;
    variant?: "primary" | "outline" | "ghost";
}

export default function ButtonLogout({
    className = "",
    variant = "outline",
}: ButtonLogoutProps) {
    const [open, setOpen] = useState(false);

    const handleLogout = () => {
        signOut({ callbackUrl: "/login" });
    };

    return (
        <>
            <Button
                size="lg"
                type="button"
                className={className}
                onClick={() => setOpen(true)}
            >
                Logout
            </Button>

            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                title="Confirm logout"
            >
                <p className="mb-6 text-foreground/70">
                    Are you sure you want to log out?
                </p>
                <div className="flex justify-end gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        onClick={() => setOpen(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        variant="primary"
                        type="button"
                        onClick={handleLogout}
                    >
                        Logout
                    </Button>
                </div>
            </Dialog>
        </>
    );
}