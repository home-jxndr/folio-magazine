"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { contactAction } from "@/app/actions/auth";
import { IDLE } from "@/lib/action-types";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary disabled:opacity-60">
      {pending ? "Sending…" : "Send message"}
    </button>
  );
}

export function ContactForm() {
  const [state, formAction] = useActionState(contactAction, IDLE);

  return (
    <form action={formAction} className="border border-rule bg-paper-2/40 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="label">Name</label>
          <input id="name" name="name" required className="field bg-paper" />
          {state.errors?.name && <p className="mt-1 font-sans text-[11px] text-accent">{state.errors.name}</p>}
        </div>
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" name="email" type="email" required className="field bg-paper" />
          {state.errors?.email && <p className="mt-1 font-sans text-[11px] text-accent">{state.errors.email}</p>}
        </div>
      </div>
      <div className="mt-4">
        <label htmlFor="subject" className="label">Subject</label>
        <select id="subject" name="subject" className="field bg-paper">
          <option>Editorial enquiry</option>
          <option>Correction or clarification</option>
          <option>Pitch a story</option>
          <option>Membership and billing</option>
          <option>Press and permissions</option>
          <option>Something else</option>
        </select>
      </div>
      <div className="mt-4">
        <label htmlFor="message" className="label">Message</label>
        <textarea id="message" name="message" rows={6} required minLength={12} className="field bg-paper" />
        {state.errors?.message && <p className="mt-1 font-sans text-[11px] text-accent">{state.errors.message}</p>}
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-sm font-sans text-[10.5px] leading-relaxed text-ink-soft">
          We reply within two working days. Pitches: please include a short summary and your reporting plan.
        </p>
        <Submit />
      </div>
      {state.message && (
        <p role="status" aria-live="polite" className={`mt-4 font-sans text-xs ${state.ok ? "text-ink" : "text-accent"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}
