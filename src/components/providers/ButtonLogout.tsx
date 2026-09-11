"use client";

import { signOut } from "next-auth/react";

interface ButtonLogoutProps {
  className?: string;
  variant?: "primary" | "outline" | "ghost";
}

export default function ButtonLogout({
  className = "",
  variant = "outline",
}: ButtonLogoutProps) {
  const handleLogout = () => {
    const isConfirmed = window.confirm("Are you sure you want to log out?");
    if (isConfirmed) {
      signOut({ callbackUrl: "/login" });
    }
  };

  return (
    <button
      type="button"
      className={className}
      onClick={handleLogout}
    >
      Logout
    </button>
  );
}