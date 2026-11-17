"use client";

import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/button";

/**
 * PayWay expects a real browser form POST (not fetch) so its hosted checkout
 * can render and later redirect the customer back to our site.
 */
export default function PaywayRedirectForm({
  action,
  fields,
}: {
  action: string;
  fields: Record<string, string>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [showManualButton, setShowManualButton] = useState(false);

  useEffect(() => {
    const redirect = window.setTimeout(() => formRef.current?.submit(), 300);
    const fallback = window.setTimeout(() => setShowManualButton(true), 5000);
    return () => {
      window.clearTimeout(redirect);
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <div className="mx-auto max-w-md border border-foreground/10 p-8 text-center">
      <form ref={formRef} action={action} method="POST" className="hidden">
        {Object.entries(fields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
      </form>

      <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
      <h1 className="text-xl font-semibold">Redirecting to ABA PayWay</h1>
      <p className="mt-2 text-sm text-foreground/60">
        Please wait — do not close this page.
      </p>

      {showManualButton && (
        <Button
          type="button"
          className="mt-6 w-full"
          onClick={() => formRef.current?.submit()}
        >
          Continue to ABA PayWay
        </Button>
      )}
    </div>
  );
}
