"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const KEY = "folio-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setVisible(true);
    } catch {
      /* storage unavailable */
    }
  }, []);

  function choose(value: "all" | "essential") {
    try {
      localStorage.setItem(KEY, value);
    } catch {
      /* storage unavailable */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      aria-live="polite"
      className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-xl border border-rule bg-paper p-5 shadow-[0_18px_50px_rgba(0,0,0,0.14)] sm:left-6 sm:right-auto"
    >
      <p className="font-sans text-[10px] uppercase tracking-kicker text-accent">Your privacy</p>
      <p className="mt-2 font-serif text-[15px] leading-relaxed text-ink">
        We use essential cookies to keep you signed in and to remember your reading preferences. Analytics cookies are
        optional and aggregate only. Read the{" "}
        <Link href="/privacy" className="underline">
          privacy notice
        </Link>
        .
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => choose("all")} className="btn btn-primary">
          Accept all
        </button>
        <button type="button" onClick={() => choose("essential")} className="btn btn-ghost">
          Essential only
        </button>
      </div>
    </div>
  );
}
