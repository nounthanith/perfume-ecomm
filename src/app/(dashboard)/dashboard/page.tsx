"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Check,
  LayoutDashboard,
  Package,
  Store,
  Users,
} from "lucide-react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Skeleton from "@/components/ui/skeleton";
import StatCard from "@/components/shared/StatCard";
import { useFetch } from "@/hooks/useFetch";

const MAX_MESSAGE = 200;

interface SettingData {
  key: string;
  shopStatus: boolean;
  message: string;
  updatedAt: string | null;
}

interface DashboardResponse {
  setting: SettingData;
  stats: {
    users: number;
    products: number;
  };
}

function formatDateTime(value?: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ open }: { open: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        open
          ? "bg-emerald-500/10 text-emerald-600"
          : "bg-red-500/10 text-red-600"
      }`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {open && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        )}
        <span
          className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
            open ? "bg-emerald-500" : "bg-red-500"
          }`}
        />
      </span>
      {open ? "Open" : "Closed"}
    </span>
  );
}

function StatusToggle({
  checked,
  disabled,
  onToggle,
}: {
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label="Shop open status"
      disabled={disabled}
      onClick={onToggle}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        checked ? "bg-emerald-500" : "bg-foreground/20"
      }`}
    >
      <span
        className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>
      <Skeleton className="h-56 rounded-2xl" />
    </div>
  );
}

export default function DashboardPage() {
  const { data, loading, error, refetch } = useFetch<DashboardResponse>(
    "/api/setting",
    { cache: false }
  );

  const [draftMessage, setDraftMessage] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    };
  }, []);

  const setting = data?.setting;
  const shopStatus = draftStatus ?? setting?.shopStatus ?? true;
  const message = draftMessage ?? setting?.message ?? "";
  const isDirty = message.trim() !== (setting?.message ?? "");
  const remaining = MAX_MESSAGE - message.length;

  const updateSetting = async (body: {
    shopStatus?: boolean;
    message?: string;
  }) => {
    setSaving(true);
    setFormError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/setting", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await res.json().catch(() => null);
      if (!res.ok) throw new Error(result?.error ?? "Update failed");

      setDraftMessage(null);
      setDraftStatus(null);

      if (savedTimer.current) clearTimeout(savedTimer.current);
      setSaved(true);
      savedTimer.current = setTimeout(() => setSaved(false), 2500);

      await refetch();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-foreground/10 bg-foreground/5">
            <LayoutDashboard className="h-5 w-5 text-foreground/80" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              Dashboard
            </h1>
            <p className="text-sm text-foreground/60">
              Shop availability and catalogue at a glance
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/pos">
            <Button variant="outline" size="md" className="gap-1.5">
              <Store className="h-4 w-4" />
              Open POS
            </Button>
          </Link>
          <Link href="/">
            <Button size="md">View Site</Button>
          </Link>
        </div>
      </div>

      {loading && !data ? (
        <DashboardSkeleton />
      ) : error && !setting ? (
        <div className="flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="font-medium underline hover:opacity-70"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard
              label="Total Users"
              value={(data?.stats.users ?? 0).toLocaleString()}
              icon={Users}
            />
            <StatCard
              label="Total Products"
              value={(data?.stats.products ?? 0).toLocaleString()}
              icon={Package}
            />
          </div>

          {/* Shop controls */}
          <section className="overflow-hidden rounded-2xl border border-foreground/10 bg-background shadow-sm">
            <div className="flex items-center justify-between border-b border-foreground/10 bg-foreground/[0.02] px-5 py-3.5">
              <p className="text-sm font-medium text-foreground/80">
                Shop Settings
              </p>
              <span className="text-xs text-foreground/50">
                Updated {formatDateTime(setting?.updatedAt)}
              </span>
            </div>

            {/* Availability */}
            <div className="flex items-center justify-between gap-4 px-5 py-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-foreground">
                    {shopStatus ? "We're Open" : "We're Closed"}
                  </p>
                  <StatusBadge open={shopStatus} />
                </div>
                <p className="mt-1 text-sm text-foreground/60">
                  {shopStatus
                    ? "Customers can browse and check out."
                    : "The storefront shows a closed notice."}
                </p>
              </div>
              <StatusToggle
                checked={shopStatus}
                disabled={saving}
                onToggle={() => {
                  setDraftStatus(!shopStatus);
                  updateSetting({ shopStatus: !shopStatus });
                }}
              />
            </div>

            {/* Announcement */}
            <div className="space-y-3 border-t border-foreground/10 px-5 py-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <label
                    htmlFor="shop-message"
                    className="text-sm font-medium text-foreground"
                  >
                    Message for customers
                  </label>
                  <p className="mt-0.5 text-xs text-foreground/50">
                    Shown on the storefront, up to {MAX_MESSAGE} characters.
                  </p>
                </div>
                <span
                  className={`shrink-0 text-xs tabular-nums ${
                    remaining < 0 ? "text-red-600" : "text-foreground/50"
                  }`}
                >
                  {message.length}/{MAX_MESSAGE}
                </span>
              </div>

              <Input
                id="shop-message"
                name="message"
                value={message}
                maxLength={MAX_MESSAGE}
                placeholder="e.g. Closed today, back tomorrow at 8 AM"
                onChange={(e) => setDraftMessage(e.target.value)}
                error={remaining < 0 ? "Message is too long" : undefined}
              />

              {message && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-600">
                  <span className="mr-2 text-xs font-semibold uppercase tracking-wider opacity-70">
                    Preview
                  </span>
                  {message}
                </div>
              )}

              {formError && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600">
                  {formError}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  loading={saving}
                  disabled={!isDirty}
                  onClick={() => updateSetting({ message })}
                >
                  Save Message
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={saving || !message}
                  onClick={() => {
                    setDraftMessage("");
                    updateSetting({ message: "" });
                  }}
                >
                  Clear
                </Button>
                {saved && (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                    <Check className="h-4 w-4" />
                    Saved
                  </span>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}