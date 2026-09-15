"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Gem, Menu, X } from "lucide-react";
import ButtonLogout from "../providers/ButtonLogout";

export default function ClientLayout() {
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Blog", path: "/blog" }
  ];

  const linkClass = (path: string) =>
    `px-3 py-2 text-sm font-medium transition-colors ${pathname === path
      ? "bg-foreground/10 text-foreground"
      : "text-foreground/70 hover:bg-foreground/10 hover:text-foreground"
    }`;

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="sticky top-0 z-40 border-b border-foreground/10 bg-background/75 backdrop-blur-md">
      <div className="mx-auto flex max-w-full items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5"
          onClick={closeMenu}
        >
          <span className="flex h-9 w-9 items-center justify-center bg-foreground text-background">
            <Gem className="h-4.5 w-4.5" />
          </span>
          <span className="text-lg font-bold tracking-tight">G-Fragrance</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path} className={linkClass(item.path)}>
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {isLoggedIn ? (
            <>
              <Link
                href="/profile"
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${pathname === "/profile"
                  ? "bg-foreground/10 text-foreground"
                  : "text-foreground/70 hover:bg-foreground/10 hover:text-foreground"
                  }`}
              >
                Profile
              </Link>
              <ButtonLogout className="bg-foreground !px-4 !py-2 !text-sm !font-medium text-background transition-opacity hover:opacity-90" />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="border border-foreground px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-foreground/10"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                Register
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          className="flex h-9 w-9 items-center justify-center border border-foreground/10 text-foreground/80 transition-colors hover:bg-foreground/10 md:hidden"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="space-y-2 border-t border-foreground/10 px-4 py-4 md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              onClick={closeMenu}
              className={`block rounded-none px-3 py-2 text-sm font-medium transition-colors ${pathname === item.path
                ? "bg-foreground/10 text-foreground"
                : "text-foreground/70 hover:bg-foreground/10 hover:text-foreground"
                }`}
            >
              {item.label}
            </Link>
          ))}

          <div className="flex flex-wrap items-center gap-2 pt-2">
            {isLoggedIn ? (
              <div className="flex w-full flex-col gap-2">
                <Link
                  href="/profile"
                  onClick={closeMenu}
                  className="border border-foreground px-4 py-2 text-center text-sm font-medium text-foreground transition-colors hover:bg-foreground/10"
                >
                  Profile
                </Link>
                <ButtonLogout className="w-full px-4 py-2 text-sm" />
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="flex-1 border border-foreground px-4 py-2 text-center text-sm font-medium text-foreground transition-colors hover:bg-foreground/10"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={closeMenu}
                  className="flex-1 bg-foreground px-4 py-2 text-center text-sm font-medium text-background transition-opacity hover:opacity-90"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}