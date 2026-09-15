"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface DialogProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    className?: string;
}

export default function Dialog({
    open,
    onClose,
    title,
    children,
    className,
}: DialogProps) {
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        document.addEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [open, onClose]);

    if (!open) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4 backdrop-blur-sm"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? "dialog-title" : undefined}
                className={`w-full max-w-md rounded-lg border border-foreground/10 bg-background p-6 shadow-lg ${className ?? ""}`}
            >
                <div className="mb-4 flex items-center justify-between">
                    {title && (
                        <h2 id="dialog-title" className="text-lg font-semibold text-foreground">
                            {title}
                        </h2>
                    )}
                    <button
                        onClick={onClose}
                        aria-label="Close dialog"
                        className="ml-auto rounded-md p-1 text-foreground/60 transition-colors hover:bg-foreground/10 hover:text-foreground"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                {children}
            </div>
        </div>,
        document.body
    );
}