import type { Metadata } from "next";
import Link from "next/link";
import { ArticleCard } from "@/components/article-card";
import { requireUser } from "@/lib/auth";
import { getBookmarks } from "@/lib/queries";
import { removeBookmarkAction } from "@/app/actions/account";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Saved articles" };

export default async function SavedPage() {
  const user = await requireUser();
  const saved = await getBookmarks(user.id);

  return (
    <div>
      <div className="border-b border-ink pb-2">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Saved articles</h2>
        <p className="mt-1 font-sans text-[11px] text-ink-soft">{saved.length} saved · private to your account</p>
      </div>

      {saved.length === 0 ? (
        <div className="py-16">
          <p className="font-display text-2xl">Nothing saved yet.</p>
          <p className="mt-2 max-w-md font-serif text-[15px] leading-relaxed text-ink-soft">
            Use the “Save” button on any article to keep it here. Saved stories stay available even after they leave the
            homepage.
          </p>
          <Link href="/latest" className="btn btn-primary mt-6">Browse the archive</Link>
        </div>
      ) : (
        <ul className="mt-6 grid gap-x-8 gap-y-10 sm:grid-cols-2">
          {saved.map((a) => (
            <li key={a.id} className="border-b border-rule pb-6">
              <ArticleCard article={a} showDek={false} />
              <div className="mt-3 flex items-center justify-between">
                <span className="font-sans text-[10px] uppercase tracking-kicker text-ink-soft">
                  Saved · published {formatDate(a.published_at)}
                </span>
                <form action={removeBookmarkAction}>
                  <input type="hidden" name="article_id" value={a.id} />
                  <button type="submit" className="font-sans text-[10px] uppercase tracking-kicker text-accent underline">
                    Remove
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
