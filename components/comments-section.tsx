"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { addCommentAction } from "@/app/actions/admin";
import { IDLE } from "@/lib/action-types";
import { formatDate, initials } from "@/lib/utils";

type Comment = { id: string; author_name: string; body: string; created_at: string; avatar_url: string | null };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary disabled:opacity-60">
      {pending ? "Sending…" : "Submit comment"}
    </button>
  );
}

export function CommentsSection({
  comments,
  articleId,
  signedIn,
  userName,
  userEmail,
  signedInName,
}: {
  comments: Comment[];
  articleId: string;
  signedIn: boolean;
  userName?: string;
  userEmail?: string;
  signedInName?: string;
}) {
  const [state, formAction] = useActionState(addCommentAction, IDLE);

  return (
    <section id="comments" className="mt-14 border-t border-ink pt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Comments</h2>
        <p className="font-sans text-[10px] uppercase tracking-kicker text-ink-soft">
          {comments.length} approved · moderated before publication
        </p>
      </div>

      {comments.length === 0 ? (
        <p className="mt-4 font-serif text-[15px] text-ink-soft">No comments yet. Be the first to add to the argument.</p>
      ) : (
        <ul className="mt-6 divide-y divide-rule">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-4 py-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-paper-2 font-sans text-[11px] font-semibold text-ink-soft">
                {c.avatar_url ? <img src={c.avatar_url} alt="" className="h-full w-full object-cover" /> : initials(c.author_name)}
              </span>
              <div>
                <p className="font-sans text-[11px] font-semibold uppercase tracking-kicker">
                  {c.author_name} <span className="ml-2 font-normal normal-case tracking-normal text-ink-soft">{formatDate(c.created_at)}</span>
                </p>
                <p className="mt-1.5 font-serif text-[15px] leading-relaxed text-ink">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form action={formAction} className="mt-8 border border-rule bg-paper-2/40 p-5">
        <input type="hidden" name="article_id" value={articleId} />
        <p className="kicker-muted mb-4">Join the conversation</p>
        {!signedIn && (
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="c-name">Name</label>
              <input id="c-name" name="name" required defaultValue={userName} className="field bg-paper" />
            </div>
            <div>
              <label className="label" htmlFor="c-email">Email (never published)</label>
              <input id="c-email" name="email" type="email" defaultValue={userEmail} className="field bg-paper" />
            </div>
          </div>
        )}
        {signedIn && <p className="mb-3 font-sans text-[11px] text-ink-soft">Commenting as {signedInName}</p>}
        <label className="label" htmlFor="c-body">Comment</label>
        <textarea id="c-body" name="body" rows={4} required minLength={4} className="field bg-paper" placeholder="Add to the argument — politely." />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-md font-sans text-[10.5px] leading-relaxed text-ink-soft">
            Comments are reviewed before publication. Abuse is removed. See our{" "}
            <Link href="/terms#comments" className="underline">community rules</Link>.
          </p>
          <Submit />
        </div>
        {state.message && (
          <p role="status" aria-live="polite" className={`mt-3 font-sans text-xs ${state.ok ? "text-ink-soft" : "text-accent"}`}>
            {state.message}
          </p>
        )}
      </form>
    </section>
  );
}
