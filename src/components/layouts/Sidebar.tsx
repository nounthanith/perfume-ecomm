"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Package,
    FolderTree,
    User,
    Menu,
    X,
} from "lucide-react";
import ButtonLogout from "@/components/providers/ButtonLogout";

interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
}

const navItems: NavItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Products", href: "/product-management", icon: Package },
    { label: "Categories", href: "/category-management", icon: FolderTree },
    { label: "Users", href: "/user-management", icon: User },
];

export default function Sidebar({ user }: { user?: { name?: string; email?: string } }) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    const close = () => setOpen(false);

    return (
        <>
            {/* Mobile Top Bar */}
            <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-foreground/10 bg-background px-4 lg:hidden">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-sm font-bold text-background">
                        A
                    </div>
                    <span className="text-lg font-bold tracking-tight text-foreground">
                        Admin Portal
                    </span>
                </div>
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-foreground/10"
                    aria-label="Open menu"
                >
                    <Menu className="h-6 w-6 text-foreground" />
                </button>
            </header>

            {/* Mobile Overlay */}
            {open && (
                <div
                    className="fixed inset-0 z-45 bg-black/40 lg:hidden"
                    onClick={close}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col justify-between border-r border-foreground/10 bg-background p-4 text-foreground transition-all duration-200 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
            >
                {/* Top Brand Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 px-2 py-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground text-lg font-bold text-background">
                            A
                        </div>
                        <span className="text-lg font-bold tracking-tight text-foreground">
                            Admin Portal
                        </span>
                        <button
                            type="button"
                            onClick={close}
                            className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg hover:bg-foreground/10 lg:hidden"
                            aria-label="Close menu"
                        >
                            <X className="h-5 w-5 text-foreground" />
                        </button>
                    </div>

                    {/* Navigation Links */}
                    <nav className="space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={close}
                                    className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${isActive
                                        ? "bg-foreground text-background font-semibold shadow-sm"
                                        : "text-foreground/70 hover:bg-foreground/10 hover:text-foreground"
                                        }`}
                                >
                                    <Icon className="h-5 w-5" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Bottom Profile & Logout Action */}
                <div className="space-y-3 border-t border-foreground/10 pt-4">
                    {user && (
                        <div className="flex items-center gap-3 px-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-foreground/15 bg-foreground/10 text-xs font-semibold text-foreground">
                                <User className="h-4 w-4" />
                            </div>
                            <div className="overflow-hidden text-xs">
                                <p className="truncate font-medium text-foreground">{user.name || "Admin"}</p>
                                <p className="truncate text-foreground/50">{user.email || "admin@system.com"}</p>
                            </div>
                        </div>
                    )}

                    <ButtonLogout className="flex w-full items-center justify-center gap-2 rounded-xl border border-foreground/10 bg-foreground/5 py-2.5 text-sm font-medium text-red-500 transition-all duration-200 hover:border-red-500/30 hover:bg-red-500/10" />
                </div>
            </aside>
        </>
    );
}