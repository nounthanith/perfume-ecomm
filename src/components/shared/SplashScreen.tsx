"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const SPLASH_KEY = "g-fragrance-splash-seen";
const HOLD_MS = 1600;
const FADE_MS = 450;

export default function SplashScreen() {
  const [leaving, setLeaving] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    // The inline script in the root layout adds this class before paint when
    // the splash was already shown in this tab, so returning visitors never
    // see a flash of the overlay. The CSS rule already hides it.
    if (document.documentElement.classList.contains("splash-skipped")) {
      return;
    }

    try {
      sessionStorage.setItem(SPLASH_KEY, "1");
    } catch {
      // Storage can be blocked (private mode); the splash still works.
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const hold = reduceMotion ? 350 : HOLD_MS;
    const fade = reduceMotion ? 0 : FADE_MS;

    const leaveTimer = window.setTimeout(() => setLeaving(true), hold);
    const hideTimer = window.setTimeout(() => setHidden(true), hold + fade);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  // Lock page scrolling only while the overlay is on screen. This is a
  // separate effect because rendering `null` when the splash finishes does
  // NOT unmount the component, so a cleanup inside the timer effect would
  // never run and the page would stay stuck unable to scroll.
  useEffect(() => {
    if (hidden) {
      document.body.style.overflow = "";
      return;
    }

    if (document.documentElement.classList.contains("splash-skipped")) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [hidden]);

  if (hidden) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`app-splash fixed inset-0 z-100 flex flex-col items-center justify-center bg-background px-6 text-center transition-opacity duration-500 ease-out ${
        leaving ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="relative flex h-24 w-24 items-center justify-center border border-foreground/15">
        <Image
          src="/logo.png"
          alt=""
          width={96}
          height={96}
          priority
          className="h-16 w-16 object-contain animate-splash-logo"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 border border-foreground/25 animate-splash-ring"
        />
      </div>

      <p className="mt-6 text-lg font-bold uppercase tracking-[0.35em] animate-splash-rise [animation-delay:250ms]">
        G-Fragrance
      </p>
      <p className="mt-2 text-[10px] uppercase tracking-[0.45em] text-foreground/50 animate-splash-rise [animation-delay:400ms]">
        Premium Fragrances
      </p>

      <div
        aria-hidden="true"
        className="mt-8 h-px w-40 overflow-hidden bg-foreground/15"
      >
        <div className="h-full w-full origin-left bg-foreground animate-splash-track" />
      </div>

      <span className="sr-only">Loading G-Fragrance&hellip;</span>
    </div>
  );
}
