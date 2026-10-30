"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { subscribeAction } from "@/app/actions/newsletter";
import { IDLE } from "@/lib/action-types";
import { FREQUENCIES } from "@/lib/utils";

type Variant = "band" | "inline" | "footer" | "page";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary shrink-0 disabled:opacity-60">
      {pending ? "Adding…" : label}
      <span aria-hidden>→</span>
    </button>
  );
}

export function NewsletterForm({
  variant = "inline",
  source = "website",
  label = "Subscribe",
  showPreferences = false,
}: {
  variant?: Variant;
  source?: string;
  label?: string;
  showPreferences?: boolean;
}) {
  const [state, formAction] = useActionState(subscribeAction, IDLE);
  const dark = variant === "band" || variant === "footer";

  return (
    <form action={formAction} className="w-full">
      <input type="hidden" name="source" value={source} />
      <div className={`flex flex-col gap-2 sm:flex-row ${variant === "footer" ? "sm:flex-col" : ""}`}>
        <label className="sr-only" htmlFor={`nl-email-${source}-${variant}`}>
          Email address
        </label>
        <input
          id={`nl-email-${source}-${variant}`}
          type="email"
          name="email"
          required
          placeholder="your@email.com"
          autoComplete="email"
          className={`field flex-1 ${dark ? "border-paper/30 text-paper placeholder:text-paper/50 focus:border-paper" : ""}`}
        />
        <Submit label={label} />
      </div>

      {showPreferences && (
        <fieldset className="mt-5">
          <legend className={`label ${dark ? "text-paper/60" : ""}`}>How often?</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {FREQUENCIES.map((f, i) => (
              <label
                key={f.value}
                className={`flex cursor-pointer items-start gap-2 border p-3 text-left transition-colors ${
                  dark ? "border-paper/25 hover:border-paper/60" : "border-rule hover:border-ink"
                }`}
              >
                <input type="radio" name="frequency" value={f.value} defaultChecked={i === 1} className="mt-1 accent-current" />
                <span>
                  <span className={`block font-sans text-[11px] font-semibold uppercase tracking-kicker ${dark ? "text-paper" : ""}`}>
                    {f.label}
                  </span>
                  <span className={`mt-1 block font-sans text-[11px] leading-snug ${dark ? "text-paper/60" : "text-ink-soft"}`}>
                    {f.detail}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <label className={`mt-3 flex items-start gap-2 font-sans text-[11px] leading-relaxed ${dark ? "text-paper/70" : "text-ink-soft"}`}>
        <input type="checkbox" name="consent" value="yes" required className="mt-0.5" />
        <span>
          I agree to receive FOLIO newsletters and accept the{" "}
          <Link href="/privacy" className={`underline ${dark ? "text-paper" : "text-ink"}`}>
            privacy notice
          </Link>
          . Unsubscribe at any time.
        </span>
      </label>

      {state.message && (
        <div
          role="status"
          aria-live="polite"
          className={`mt-3 border-l-2 px-3 py-2 font-sans text-xs leading-relaxed ${
            state.ok ? "border-current" : "border-accent text-accent"
          } ${dark ? "text-paper" : "text-ink"}`}
        >
          {state.message}
          {state.link && (
            <Link href={state.link.href} className="ml-2 underline">
              {state.link.label}
            </Link>
          )}
        </div>
      )}
      {state.errors?.email && <p className="mt-2 font-sans text-xs text-accent">{state.errors.email}</p>}
      {state.errors?.consent && <p className="mt-1 font-sans text-xs text-accent">{state.errors.consent}</p>}
    </form>
  );
}
