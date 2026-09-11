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
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-gray-500">You are not signed in.</p>
        <Button onClick={() => router.push("/login")}>Sign in</Button>
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
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="mt-2 text-gray-500">Manage your account details</p>
        </div>

        <div className="flex flex-col items-center gap-3">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name}
              width={96}
              height={96}
              className="h-24 w-24 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-foreground/10 text-2xl font-bold text-foreground">
              {initials}
            </div>
          )}
          <span className="rounded-full bg-foreground/5 px-3 py-1 text-xs font-medium uppercase">
            {user.role}
          </span>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <Input
            label="Full Name"
            name="name"
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="John Doe"
          />

          <Input
            label="Email"
            name="email"
            type="email"
            value={user.email}
            disabled
          />

          <div>
            <p className="mb-1 block text-sm font-medium text-foreground">
              Profile Picture
            </p>
            <ImageUpload
              value={form.avatar}
              onChange={(url) => setForm({ ...form, avatar: url as string })}
            />
          </div>

          <Button type="submit" size="lg" loading={saving} className="w-full">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </form>

        <div className="text-center">
          <ButtonLogout />
        </div>
      </div>
    </div>
  );
}