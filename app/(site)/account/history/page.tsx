import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getHistory } from "@/lib/queries";
import { clearHistoryAction, removeHistoryEntryAction } from "@/app/actions/account";
import { timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Reading history" };

export default async function HistoryPage() {
  const user = await requireUser();
  const history = await getHistory(user.id, 40);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-ink pb-2">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight">Reading history</h2>
          <p className="mt-1 font-sans text-[11px] text-ink-soft">
            {history.length} stories · only visible to you
          </p>
        </div>
        {history.length > 0 && (
          <form action={clearHistoryAction}>
            <button type="submit" className="border border-rule px-3 py-2 font-sans text-[10px] uppercase tracking-kicker hover:border-accent hover:text-accent">
              Clear all history
            </button>
          </form>
        )}
      </div>

      {history.length === 0 ? (
        <div className="py-16">
          <p className="font-display text-2xl">No reading history yet.</p>
          <p className="mt-2 max-w-md font-serif text-[15px] leading-relaxed text-ink-soft">
            Articles you read while signed in appear here, with your progress saved so you can pick up where you left
            off.
          </p>
          <Link href="/latest" className="btn btn-primary mt-6">Find something to read</Link>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-rule">
          {history.map((h) => (
            <li key={h.id} className="flex flex-wrap items-center gap-4 py-4">
              {h.cover_url && (
                <Link href={`/article/${h.slug}`} className="shrink-0">
                  <img src={h.cover_url} alt="" className="h-16 w-24 object-cover" loading="lazy" />
                </Link>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-sans text-[9.5px] uppercase tracking-kicker text-ink-soft">
                  {h.category_name} · {timeAgo(h.read_at)}
                </p>
                <Link href={`/article/${h.slug}`} className="font-display text-lg font-semibold leading-snug hover:text-accent">
                  {h.title}
                </Link>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-1 w-32 bg-rule" role="progressbar" aria-valuenow={h.progress} aria-valuemin={0} aria-valuemax={100} aria-label="Reading progress">
                    <div className="h-full bg-accent" style={{ width: `${h.progress}%` }} />
                  </div>
                  <span className="font-sans text-[10px] text-ink-soft">{h.progress}% read</span>
                </div>
              </div>
              <form action={removeHistoryEntryAction}>
                <input type="hidden" name="article_id" value={h.id} />
                <button type="submit" className="font-sans text-[10px] uppercase tracking-kicker text-ink-soft underline hover:text-accent">
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
