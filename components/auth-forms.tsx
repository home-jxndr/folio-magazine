"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  forgotPasswordAction,
  registerAction,
  resetPasswordAction,
  signInAction,
} from "@/app/actions/auth";
import { IDLE } from "@/lib/action-types";

function Submit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary w-full disabled:opacity-60">
      {pending ? pendingLabel : label}
    </button>
  );
}

function Notice({ ok, message, link }: { ok: boolean; message: string; link?: { href: string; label: string } }) {
  if (!message) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className={`mt-4 border-l-2 px-3 py-2 font-sans text-[12px] leading-relaxed ${ok ? "border-ink text-ink" : "border-accent text-accent"}`}
    >
      {message}
      {link && (
        <Link href={link.href} className="ml-2 underline">
          {link.label}
        </Link>
      )}
    </div>
  );
}

export function LoginForm({ next = "/account" }: { next?: string }) {
  const [state, formAction] = useActionState(signInAction, IDLE);
  return (
    <form action={formAction}>
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="field" />
        {state.errors?.email && <p className="mt-1 font-sans text-[11px] text-accent">{state.errors.email}</p>}
      </div>
      <div className="mt-4">
        <div className="flex items-baseline justify-between">
          <label htmlFor="password" className="label">Password</label>
          <Link href="/forgot-password" className="mb-1.5 font-sans text-[10px] uppercase tracking-kicker text-ink-soft hover:text-accent">
            Forgot?
          </Link>
        </div>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="field" />
        {state.errors?.password && <p className="mt-1 font-sans text-[11px] text-accent">{state.errors.password}</p>}
      </div>
      <div className="mt-5">
        <Submit label="Sign in" pendingLabel="Signing in…" />
      </div>
      <Notice ok={state.ok} message={state.message} />
      <p className="mt-5 font-sans text-[12px] text-ink-soft">
        New to FOLIO?{" "}
        <Link href="/register" className="text-ink underline">Create an account</Link>.
      </p>
    </form>
  );
}

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, IDLE);
  return (
    <form action={formAction}>
      <div>
        <label htmlFor="name" className="label">Name</label>
        <input id="name" name="name" required autoComplete="name" className="field" />
        {state.errors?.name && <p className="mt-1 font-sans text-[11px] text-accent">{state.errors.name}</p>}
      </div>
      <div className="mt-4">
        <label htmlFor="email" className="label">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="field" />
        {state.errors?.email && <p className="mt-1 font-sans text-[11px] text-accent">{state.errors.email}</p>}
      </div>
      <div className="mt-4">
        <label htmlFor="password" className="label">Password</label>
        <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className="field" />
        <p className="mt-1 font-sans text-[10.5px] text-ink-soft">At least 8 characters. Stored as a PBKDF2 hash.</p>
        {state.errors?.password && <p className="mt-1 font-sans text-[11px] text-accent">{state.errors.password}</p>}
      </div>

      <div className="mt-5 border border-rule bg-paper-2/40 p-4">
        <label className="flex items-start gap-2 font-sans text-[12px]">
          <input type="checkbox" name="subscribe" value="yes" defaultChecked className="mt-0.5" />
          <span>
            Also send me <strong>The Sunday Edition</strong>.
            <span className="mt-1 block text-[11px] text-ink-soft">Free, weekly, one-click unsubscribe.</span>
          </span>
        </label>
        <label className="mt-3 block font-sans text-[10px] uppercase tracking-kicker text-ink-soft">
          Frequency
          <select name="frequency" className="field mt-1 bg-paper">
            <option value="weekly">Weekly — The Sunday Edition</option>
            <option value="daily">Daily briefing</option>
            <option value="monthly">Monthly</option>
          </select>
        </label>
      </div>

      <label className="mt-4 flex items-start gap-2 font-sans text-[11.5px] leading-relaxed text-ink-soft">
        <input type="checkbox" name="consent" value="yes" required className="mt-0.5" />
        <span>
          I accept the <Link href="/privacy" className="text-ink underline">privacy notice</Link> and the{" "}
          <Link href="/terms" className="text-ink underline">terms</Link>.
        </span>
      </label>
      {state.errors?.consent && <p className="mt-1 font-sans text-[11px] text-accent">{state.errors.consent}</p>}

      <div className="mt-5">
        <Submit label="Create account" pendingLabel="Creating…" />
      </div>
      <Notice ok={state.ok} message={state.message} link={state.link} />
      <p className="mt-5 font-sans text-[12px] text-ink-soft">
        Already a reader?{" "}
        <Link href="/login" className="text-ink underline">Sign in</Link>.
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(forgotPasswordAction, IDLE);
  return (
    <form action={formAction}>
      <label htmlFor="email" className="label">Account email</label>
      <input id="email" name="email" type="email" required className="field" />
      <div className="mt-5">
        <Submit label="Request reset link" pendingLabel="Preparing…" />
      </div>
      <Notice ok={state.ok} message={state.message} link={state.link} />
      <p className="mt-5 font-sans text-[12px] text-ink-soft">
        <Link href="/login" className="text-ink underline">Back to sign in</Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(resetPasswordAction, IDLE);
  return (
    <form action={formAction}>
      <input type="hidden" name="token" value={token} />
      <div>
        <label htmlFor="password" className="label">New password</label>
        <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className="field" />
      </div>
      <div className="mt-4">
        <label htmlFor="confirm" className="label">Confirm new password</label>
        <input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" className="field" />
      </div>
      <div className="mt-5">
        <Submit label="Set new password" pendingLabel="Saving…" />
      </div>
      <Notice ok={state.ok} message={state.message} />
      {state.ok && (
        <p className="mt-4 font-sans text-[12px]">
          <Link href="/login" className="underline">Continue to sign in</Link>
        </p>
      )}
    </form>
  );
}
