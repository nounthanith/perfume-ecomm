"use client";

import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/context/CartContext";
import { ThemeProvider } from "@/context/ThemeContext";
import CartDrawer from "@/components/shared/CartDrawer";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SessionProvider>
        <CartProvider>
          {children}
          {/* <CartDrawer /> */}
        </CartProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}