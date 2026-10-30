"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { IDLE } from "@/lib/action-types";
import { FREQUENCIES, NEWSLETTER_TOPICS } from "@/lib/utils";
import type { ActionState } from "@/lib/action-types";

function Save() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary disabled:opacity-60">
      {pending ? "Saving…" : "Save preferences"}
    </button>
  );
}

export function SubscriptionPreferences({
  token,
  email,
  frequency,
  topics,
  action,
}: {
  token: string;
  email: string;
  frequency: string;
  topics: string[];
  action: (prev: ActionState | undefined, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useActionState(action, IDLE);

  return (
    <form action={formAction} className="border border-rule bg-paper-2/40 p-6">
      <input type="hidden" name="token" value={token} />
      <div>
        <p className="kicker-muted">Subscribed address</p>
        <p className="mt-1 font-display text-xl">{email}</p>
      </div>

      <fieldset className="mt-6">
        <legend className="label">Frequency</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {FREQUENCIES.map((f) => (
            <label key={f.value} className="flex cursor-pointer items-start gap-2 border border-rule bg-paper p-3 hover:border-ink">
              <input type="radio" name="frequency" value={f.value} defaultChecked={frequency === f.value} className="mt-1" />
              <span>
                <span className="block font-sans text-[11px] font-semibold uppercase tracking-kicker">{f.label}</span>
                <span className="mt-1 block font-sans text-[11px] leading-snug text-ink-soft">{f.detail}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-6">
        <legend className="label">Which despatches?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {NEWSLETTER_TOPICS.map((t) => (
            <label key={t.value} className="flex cursor-pointer items-center gap-2 border border-rule bg-paper px-3 py-2.5 font-sans text-[12px] hover:border-ink">
              <input type="checkbox" name="topics" value={t.value} defaultChecked={topics.includes(t.value)} />
              {t.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Save />
        <a href={`/newsletter/unsubscribe?token=${token}`} className="font-sans text-[10px] uppercase tracking-kicker text-accent underline">
          Unsubscribe entirely
        </a>
      </div>

      {state.message && (
        <p role="status" aria-live="polite" className={`mt-4 font-sans text-xs ${state.ok ? "text-ink-soft" : "text-accent"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}
