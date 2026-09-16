"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { Store, LayoutDashboard, LogOut } from "lucide-react";
import Button from "@/components/ui/button";
import Dialog from "@/components/ui/dialog";

interface PosHeaderProps {
  name?: string;
  role?: string;
}

function useClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return now;
}

export default function PosHeader({ name, role }: PosHeaderProps) {
  const now = useClock();
  const time = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const initial = (name || "C").trim().charAt(0).toUpperCase();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleLogout = async () => {
    setSigningOut(true);
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-foreground/10 bg-background/85 px-4 backdrop-blur-md lg:px-6">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground text-background shadow-sm">
          <Store className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold tracking-tight text-foreground">
            G-Fragrance POS
          </p>
          <p className="hidden text-xs text-foreground/50 sm:block">
            Point of Sale
          </p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2.5">
        <div className="hidden text-right leading-tight sm:block">
          <p className="text-sm font-semibold tabular-nums text-foreground">
            {time}
          </p>
          <p className="text-xs text-foreground/50">{date}</p>
        </div>

        {role === "admin" && (
          <Link
            href="/dashboard"
            className="hidden items-center gap-2 rounded-lg border border-foreground/10 px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground md:inline-flex"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
        )}

        <div className="hidden items-center gap-2.5 rounded-full border border-foreground/10 bg-foreground/[0.03] py-1 pl-1 pr-3 md:flex">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
            {initial}
          </div>
          <div className="leading-tight">
            <p className="text-xs font-medium text-foreground">
              {name || "Cashier"}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-foreground/50">
              {role}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          title="Logout"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/5 text-red-500 transition-colors hover:bg-red-500/10"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>

      <Dialog
        open={confirmOpen}
        onClose={() => !signingOut && setConfirmOpen(false)}
        title="Logout"
        className="max-w-sm"
      >
        <div className="text-sm">
          <p className="text-foreground/70">
            Are you sure you want to logout?
          </p>
          <div className="mt-5 flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              className="flex-1"
              disabled={signingOut}
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="md"
              className="flex-1"
              loading={signingOut}
              onClick={handleLogout}
            >
              {signingOut ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </div>
      </Dialog>
    </header>
  );
}