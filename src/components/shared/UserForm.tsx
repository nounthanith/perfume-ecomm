"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";

export interface UserFormData {
  name: string;
  email: string;
  role: "user" | "admin";
  emailVerified: boolean;
}

interface UserFormProps {
  mode: "create" | "edit";
  userId?: string;
  initial?: UserFormData | null;
}

export default function UserForm({ mode, userId, initial }: UserFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit";

  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"user" | "admin">(initial?.role ?? "user");
  const [emailVerified, setEmailVerified] = useState(
    initial?.emailVerified ?? true
  );
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email");
      return;
    }

    if (!isEdit && (!password || password.length < 6)) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (isEdit && password && password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        email: email.trim(),
        role,
        emailVerified,
      };

      if (password) payload.password = password;

      const res = await fetch(
        isEdit ? `/api/auth/users/${userId}` : "/api/auth/users",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(
          data.error ||
            (isEdit ? "Failed to update user" : "Failed to create user")
        );
        return;
      }

      router.push("/user-management");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitLabel = isEdit ? "Save Changes" : "Create User";
  const submittingLabel = isEdit ? "Saving..." : "Creating user...";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <Input
        label="Name"
        name="name"
        type="text"
        required
        placeholder="John Doe"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <Input
        label="Email"
        name="email"
        type="email"
        required
        placeholder="john@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <Input
        label={isEdit ? "New Password (leave blank to keep)" : "Password"}
        name="password"
        type="password"
        required={!isEdit}
        minLength={6}
        placeholder={isEdit ? "••••••" : "At least 6 characters"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <div>
        <label
          htmlFor="role"
          className="mb-1 block text-sm font-medium text-foreground"
        >
          Role
        </label>
        <select
          id="role"
          name="role"
          required
          value={role}
          onChange={(e) => setRole(e.target.value as "user" | "admin")}
          className="mt-1 block w-full rounded-lg border border-foreground/20 bg-background px-3 py-2.5 text-sm text-foreground shadow-sm transition-colors focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <label className="flex cursor-pointer items-center justify-between rounded-lg border border-foreground/20 bg-background px-4 py-3">
        <span>
          <span className="block text-sm font-medium text-foreground">
            Email verified
          </span>
          <span className="block text-xs text-foreground/50">
            Verified users can sign in with their password
          </span>
        </span>
        <input
          type="checkbox"
          name="emailVerified"
          checked={emailVerified}
          onChange={(e) => setEmailVerified(e.target.checked)}
          className="h-4 w-4 accent-foreground"
        />
      </label>

      <Button type="submit" size="lg" loading={submitting} className="w-full">
        {submitting ? submittingLabel : submitLabel}
      </Button>
    </form>
  );
}