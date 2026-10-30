"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { IDLE } from "@/lib/action-types";
import type { ActionState } from "@/lib/action-types";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary disabled:opacity-60">
      {pending ? "Saving…" : label}
    </button>
  );
}

export function AdminForm({
  action,
  submit = "Save",
  children,
  className = "",
  footer,
}: {
  action: (prev: ActionState | undefined, formData: FormData) => Promise<ActionState>;
  submit?: string;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, IDLE);
  return (
    <form action={formAction} className={className}>
      {children}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Submit label={submit} />
        {footer}
      </div>
      {state.message && (
        <p
          role="status"
          aria-live="polite"
          className={`mt-4 border-l-2 px-3 py-2 font-sans text-[11.5px] leading-relaxed ${
            state.ok ? "border-moss text-ink" : "border-accent text-accent"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
