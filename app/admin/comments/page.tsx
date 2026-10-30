import Link from "next/link";
import { AdminPageHead, Badge, Empty, Stat, statusTone } from "@/components/admin/ui";
import { moderateCommentAction } from "@/app/actions/admin";
import { all } from "@/lib/db";
import { timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Comments" };

type Row = {
  id: string;
  body: string;
  author_name: string;
  author_email: string | null;
  status: string;
  created_at: string;
  article_title: string;
  article_slug: string;
};

export default async function CommentsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const filter = status && ["pending", "approved", "rejected"].includes(status) ? status : "";
  const rows = await all<Row>(
    `SELECT c.id, c.body, c.author_name, c.author_email, c.status, c.created_at,
            a.title AS article_title, a.slug AS article_slug
     FROM comments c JOIN articles a ON a.id = c.article_id
     ${filter ? "WHERE c.status = ?" : ""}
     ORDER BY c.created_at DESC LIMIT 100`,
    ...(filter ? [filter] : []),
  );
  const counts = await all<{ status: string; n: number }>("SELECT status, COUNT(*) AS n FROM comments GROUP BY status");
  const count = (s: string) => Number(counts.find((c) => c.status === s)?.n ?? 0);

  return (
    <div className="space-y-6">
      <AdminPageHead
        kicker="Community"
        title="Comments"
        description="Every reader comment waits here for approval. Approving publishes it on the article immediately."
      />

      <section className="grid gap-3 sm:grid-cols-3">
        <Stat label="Awaiting moderation" value={count("pending")} href="/admin/comments?status=pending" />
        <Stat label="Approved" value={count("approved")} href="/admin/comments?status=approved" />
        <Stat label="Rejected" value={count("rejected")} href="/admin/comments?status=rejected" />
      </section>

      <div className="flex flex-wrap gap-2 font-sans text-[10px] uppercase tracking-kicker">
        <Link href="/admin/comments" className={`border px-3 py-1.5 ${!filter ? "border-ink bg-ink text-paper" : "border-rule text-ink-soft"}`}>All</Link>
        {["pending", "approved", "rejected"].map((s) => (
          <Link key={s} href={`/admin/comments?status=${s}`} className={`border px-3 py-1.5 capitalize ${filter === s ? "border-ink bg-ink text-paper" : "border-rule text-ink-soft"}`}>
            {s}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <Empty title="Nothing in the queue" body="Comments submitted on articles will appear here for review." />
      ) : (
        <ul className="space-y-3">
          {rows.map((c) => (
            <li key={c.id} className="border border-rule p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="font-sans text-[12px] font-semibold">{c.author_name}</p>
                  <p className="font-sans text-[10px] text-ink-soft">{c.author_email ?? "no email"} · {timeAgo(c.created_at)}</p>
                </div>
                <Badge tone={statusTone(c.status)}>{c.status}</Badge>
              </div>
              <p className="mt-2 font-serif text-[15px] leading-relaxed">{c.body}</p>
              <p className="mt-2 font-sans text-[10.5px] text-ink-soft">
                On <Link href={`/article/${c.article_slug}`} className="underline">{c.article_title}</Link>
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-rule pt-2.5">
                {c.status !== "approved" && (
                  <form action={moderateCommentAction}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="action" value="approve" />
                    <button type="submit" className="font-sans text-[10px] uppercase tracking-kicker text-moss underline">Approve</button>
                  </form>
                )}
                {c.status !== "rejected" && (
                  <form action={moderateCommentAction}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="action" value="reject" />
                    <button type="submit" className="font-sans text-[10px] uppercase tracking-kicker text-ink-soft underline">Reject</button>
                  </form>
                )}
                <form action={moderateCommentAction}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="action" value="delete" />
                  <button type="submit" className="font-sans text-[10px] uppercase tracking-kicker text-accent underline">Delete</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
