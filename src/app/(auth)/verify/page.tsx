"use client";

import { Suspense, useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const queryEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(queryEmail);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (!queryEmail) return;

    let cancelled = false;

    fetch(`/api/auth/verify-otp?email=${encodeURIComponent(queryEmail)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.verified) return;

        sessionStorage.removeItem("pendingSignup");
        router.replace("/login?verified=1");
      })
      .catch(() => { });

    return () => {
      cancelled = true;
    };
  }, [queryEmail, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !otp) {
      setError("Email and verification code are required");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Verification failed");
        return;
      }

      const pending = sessionStorage.getItem("pendingSignup");
      if (pending) {
        const { email: pendingEmail, password } = JSON.parse(pending);
        sessionStorage.removeItem("pendingSignup");

        const signInResult = await signIn("credentials", {
          email: pendingEmail,
          password,
          redirect: false,
        });

        if (!signInResult?.error) {
          router.push("/");
          router.refresh();
          return;
        }
      }

      router.push("/login?verified=1");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");

    if (!email) {
      setError("Enter your email first");
      return;
    }

    setResending(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to resend the code");
        return;
      }

      setError("");
      setOtp("");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Verify Your Email</h1>
          <p className="mt-2 text-gray-500">
            We sent a 6-digit code to your email. Enter it below to activate
            your account.
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* <Input
            label="Email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          /> */}

          <Input
            label="Verification Code"
            name="otp"
            type="text"
            inputMode="numeric"
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="6-digit code"
            maxLength={6}
          />

          <Button type="submit" size="lg" loading={loading} className="w-full">
            {loading ? "Verifying..." : "Verify Email"}
          </Button>
        </form>

        <div className="text-center text-sm text-gray-500">
          Didn&apos;t receive the code?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="font-medium text-foreground hover:underline disabled:opacity-50"
          >
            {resending ? "Sending..." : "Resend code"}
          </button>
        </div>

        <p className="text-center text-sm text-gray-500">
          Already verified?{" "}
          <Link href="/login" className="font-medium text-foreground hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      }
    >
      <VerifyForm />
    </Suspense>
  );
}