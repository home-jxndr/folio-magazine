"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { unsubscribeByTokenAction } from "@/app/actions/newsletter";
import { IDLE } from "@/lib/action-types";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary disabled:opacity-60">
      {pending ? "Removing…" : "Unsubscribe now"}
    </button>
  );
}

export function UnsubscribeForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(unsubscribeByTokenAction, IDLE);

  if (state.ok) {
    return (
      <div className="mt-8 border border-rule bg-paper-2/40 p-5">
        <p role="status" className="font-serif text-[15px] leading-relaxed">{state.message}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/" className="btn btn-ghost">Keep reading the magazine</Link>
          <Link href="/newsletter" className="btn btn-ghost">Subscribe to a different newsletter</Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-8">
      <input type="hidden" name="token" value={token} />
      <div className="flex flex-wrap items-center gap-3">
        <Submit />
        <Link href={`/newsletter/preferences?token=${token}`} className="btn btn-ghost">Change frequency instead</Link>
      </div>
      {state.message && (
        <p role="alert" className="mt-4 border-l-2 border-accent px-3 py-2 font-sans text-[11.5px] text-accent">
          {state.message}
        </p>
      )}
    </form>
  );
}
