"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSession } from "next-auth/react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import ImageUpload from "@/components/ui/image-upload";
import ButtonLogout from "@/components/providers/ButtonLogout";

interface MeUser {
  id: string;
  name: string;
  email: string;
  image: string;
  role: string;
}

async function fetchMe(): Promise<MeUser | null> {
  const response = await fetch("/api/auth/me", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Failed to load profile");

  const data = await response.json();
  return data.user;
}

export default function ProfilePage() {
  const router = useRouter();
  const { update } = useSession();

  const [user, setUser] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    avatar: "",
  });

  useEffect(() => {
    let cancelled = false;

    fetchMe()
      .then((data) => {
        if (cancelled) return;
        setUser(data);
        if (data) {
          setForm({ name: data.name, avatar: data.image });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load profile"
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), avatar: form.avatar }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update profile");
        return;
      }

      setUser(data.user);
      await update({ name: data.user.name, image: data.user.image });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background text-foreground/50">
        <p className="animate-pulse text-sm">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-background px-6 text-foreground">
        <p className="text-foreground/60">You are not signed in.</p>
        <Button onClick={() => router.push("/login")} className="w-full max-w-xs">
          Sign in
        </Button>
      </div>
    );
  }

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen w-full bg-background px-4 py-10 text-foreground sm:px-8 md:px-12">
      <div className="mx-auto w-full max-w-4xl space-y-8">

        {/* Page Header */}
        <div className="border-b border-foreground/10 pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Account Settings
          </h1>
          <p className="mt-1 text-sm text-foreground/60">
            Manage your public profile and account detail configuration
          </p>
        </div>

        {/* Full-width Main Layout */}
        <div className="w-full space-y-8">

          {/* User Profile Overview */}
          <div className="flex w-full flex-col items-center justify-between gap-6 rounded-2xl border border-foreground/10 bg-foreground/5 p-6 backdrop-blur-xl sm:flex-row sm:p-8">
            <div className="flex flex-col items-center gap-5 sm:flex-row">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name}
                  width={96}
                  height={96}
                  className="h-20 w-20 rounded-full border border-foreground/20 object-cover shadow-sm"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-foreground/20 bg-foreground/10 text-xl font-semibold text-foreground">
                  {initials}
                </div>
              )}
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <h2 className="text-xl font-semibold text-foreground">
                    {user.name}
                  </h2>
                  <span className="rounded-full border border-foreground/15 bg-foreground/10 px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider text-foreground/70">
                    {user.role}
                  </span>
                </div>
                <p className="text-sm text-foreground/60">{user.email}</p>
              </div>
            </div>

            {user.role === "admin" && (
              <Button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="w-full sm:w-auto bg-foreground/10 text-foreground hover:bg-foreground/20 border border-foreground/15"
              >
                Go to Dashboard
              </Button>
            )}
          </div>

          {/* Form Controls */}
          <form onSubmit={handleSave} className="w-full space-y-6">
            {error && (
              <div className="w-full rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500">
                {error}
              </div>
            )}

            <div className="w-full space-y-6 rounded-2xl border border-foreground/10 bg-foreground/5 p-6 backdrop-blur-xl sm:p-8">
              <h3 className="text-lg font-semibold text-foreground">
                Personal Information
              </h3>

              <div className="grid w-full gap-6 md:grid-cols-2">
                <Input
                  label="Full Name"
                  name="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full"
                />

                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full opacity-60"
                />
              </div>

              <div className="space-y-2 pt-2">
                <p className="text-sm font-medium text-foreground">
                  Profile Avatar
                </p>
                <div className="w-full">
                  <ImageUpload
                    value={form.avatar}
                    onChange={(url) => setForm({ ...form, avatar: url as string })}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="submit"
                size="lg"
                loading={saving}
                className="w-full sm:w-auto sm:px-8"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>

              <ButtonLogout />
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}