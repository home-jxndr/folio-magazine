"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { changePasswordAction, updateProfileAction } from "@/app/actions/auth";
import { IDLE } from "@/lib/action-types";

function Save({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary disabled:opacity-60">
      {pending ? "Saving…" : label}
    </button>
  );
}

function Msg({ state }: { state: { ok: boolean; message: string } }) {
  if (!state.message) return null;
  return (
    <p role="status" aria-live="polite" className={`mt-3 font-sans text-[12px] ${state.ok ? "text-ink-soft" : "text-accent"}`}>
      {state.message}
    </p>
  );
}

export function ProfileForm({
  name,
  title,
  bio,
  avatarUrl,
  twitter,
}: {
  name: string;
  title: string;
  bio: string;
  avatarUrl: string;
  twitter: string;
}) {
  const [state, formAction] = useActionState(updateProfileAction, IDLE);
  return (
    <form action={formAction}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="label">Name</label>
          <input id="name" name="name" defaultValue={name} required className="field" />
        </div>
        <div>
          <label htmlFor="title" className="label">Title / role line</label>
          <input id="title" name="title" defaultValue={title} className="field" placeholder="Reader, Lisbon" />
        </div>
      </div>
      <div className="mt-4">
        <label htmlFor="bio" className="label">Bio</label>
        <textarea id="bio" name="bio" rows={3} defaultValue={bio} className="field" placeholder="A sentence about you." />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="avatar_url" className="label">Profile picture URL</label>
          <input id="avatar_url" name="avatar_url" defaultValue={avatarUrl} className="field" placeholder="https://…" />
        </div>
        <div>
          <label htmlFor="twitter" className="label">X handle (without @)</label>
          <input id="twitter" name="twitter" defaultValue={twitter} className="field" />
        </div>
      </div>
      <div className="mt-5">
        <Save label="Save profile" />
      </div>
      <Msg state={state} />
    </form>
  );
}

export function PasswordForm() {
  const [state, formAction] = useActionState(changePasswordAction, IDLE);
  return (
    <form action={formAction}>
      <div>
        <label htmlFor="current" className="label">Current password</label>
        <input id="current" name="current" type="password" required autoComplete="current-password" className="field" />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="password" className="label">New password</label>
          <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className="field" />
        </div>
        <div>
          <label htmlFor="confirm" className="label">Confirm</label>
          <input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" className="field" />
        </div>
      </div>
      <div className="mt-5">
        <Save label="Change password" />
      </div>
      <Msg state={state} />
    </form>
  );
}
