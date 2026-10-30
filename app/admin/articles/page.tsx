import Link from "next/link";
import { AdminPageHead, Badge, Empty, TableShell, statusTone } from "@/components/admin/ui";
import { Pagination } from "@/components/pagination";
import { all } from "@/lib/db";
import { deleteArticleAction, setArticleStatusAction } from "@/app/actions/admin";
import { listCategories } from "@/lib/queries";
import { compactNumber, timeAgo } from "@/lib/utils";
import { getCurrentUser, canManageContent } from "@/lib/auth";
import type { ArticleSummary } from "@/lib/queries";

export const dynamic = "force-dynamic";

const PER_PAGE = 15;

type Props = { searchParams: Promise<{ status?: string; category?: string; q?: string; page?: string; saved?: string; deleted?: string }> };

export default async function AdminArticlesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const user = await getCurrentUser();
  const canPublish = canManageContent(user?.role);

  const where: string[] = ["1=1"];
  const params: unknown[] = [];
  if (sp.status) { where.push("a.status = ?"); params.push(sp.status); }
  if (sp.category) { where.push("a.category_id = ?"); params.push(sp.category); }
  if (sp.q) { where.push("(a.title LIKE ? OR a.dek LIKE ?)"); params.push(`%${sp.q}%`, `%${sp.q}%`); }
  if (user?.role === "author") { where.push("a.author_id = ?"); params.push(user.id); }

  const clause = where.join(" AND ");
  const [rows, count, categories] = await Promise.all([
    all<ArticleSummary>(
      `SELECT a.*, c.name AS category_name, c.slug AS category_slug, u.name AS author_name, u.avatar_url AS author_avatar
       FROM articles a LEFT JOIN categories c ON c.id = a.category_id LEFT JOIN users u ON u.id = a.author_id
       WHERE ${clause} ORDER BY a.updated_at DESC LIMIT ? OFFSET ?`,
      ...params, PER_PAGE, (page - 1) * PER_PAGE,
    ),
    all<{ n: number }>(`SELECT COUNT(*) AS n FROM articles a WHERE ${clause}`, ...params),
    listCategories(),
  ]);
  const total = Number(count[0]?.n ?? 0);

  return (
    <div className="space-y-6">
      <AdminPageHead
        kicker="Content"
        title="Articles"
        description="Create, edit, schedule and unpublish. Authors see only their own drafts and cannot publish without an editor."
        action={<Link href="/admin/articles/new" className="btn btn-primary">New article</Link>}
      />

      {(sp.saved || sp.deleted) && (
        <div className="border-l-2 border-accent bg-accent/5 px-4 py-2.5 font-sans text-[12px]">
          {sp.saved ? `Saved “${sp.saved}”.` : "Article deleted."}
        </div>
      )}

      <form className="flex flex-wrap items-end gap-3 border border-rule bg-paper-2/30 p-4" action="/admin/articles">
        <div className="min-w-[180px] flex-1">
          <label htmlFor="q" className="label">Search</label>
          <input id="q" name="q" defaultValue={sp.q ?? ""} placeholder="Title or standfirst" className="field bg-paper" />
        </div>
        <div>
          <label htmlFor="status" className="label">Status</label>
          <select id="status" name="status" defaultValue={sp.status ?? ""} className="field bg-paper">
            <option value="">All</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="review">In review</option>
            <option value="scheduled">Scheduled</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div>
          <label htmlFor="category" className="label">Section</label>
          <select id="category" name="category" defaultValue={sp.category ?? ""} className="field bg-paper">
            <option value="">All sections</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <button type="submit" className="btn btn-ghost">Filter</button>
        {(sp.q || sp.status || sp.category) && <Link href="/admin/articles" className="btn btn-ghost">Clear</Link>}
      </form>

      {rows.length === 0 ? (
        <Empty
          title="No articles match"
          body="Adjust the filters, or start a new piece."
          action={<Link href="/admin/articles/new" className="btn btn-primary">Create an article</Link>}
        />
      ) : (
        <TableShell head={["Title", "Status", "Section", "Author", "Views", "Updated", "Actions"]}>
          {rows.map((a) => (
            <tr key={a.id} className="align-top hover:bg-paper-2/40">
              <td className="px-3 py-3">
                <Link href={`/admin/articles/${a.id}`} className="font-display text-[15px] font-semibold leading-snug hover:text-accent">
                  {a.title}
                </Link>
                <p className="mt-0.5 font-mono text-[10px] text-ink-soft">/article/{a.slug}</p>
                {a.featured ? <span className="mt-1 inline-block"><Badge tone="warn">Featured</Badge></span> : null}
              </td>
              <td className="px-3 py-3"><Badge tone={statusTone(a.status)}>{a.status}</Badge></td>
              <td className="px-3 py-3 font-sans text-[11px] text-ink-soft">{a.category_name ?? "—"}</td>
              <td className="px-3 py-3 font-sans text-[11px] text-ink-soft">{a.author_name ?? "—"}</td>
              <td className="px-3 py-3 font-sans text-[11px] text-ink-soft">{compactNumber(a.views)}</td>
              <td className="px-3 py-3 font-sans text-[11px] text-ink-soft">{timeAgo(a.updated_at)}</td>
              <td className="px-3 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/admin/articles/${a.id}`} className="font-sans text-[10px] uppercase tracking-kicker underline">
                    Edit
                  </Link>
                  {a.status === "published" && (
                    <Link href={`/article/${a.slug}`} className="font-sans text-[10px] uppercase tracking-kicker text-ink-soft underline">
                      View
                    </Link>
                  )}
                  {canPublish && a.status !== "published" && (
                    <form action={setArticleStatusAction}>
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="action" value="publish" />
                      <button type="submit" className="font-sans text-[10px] uppercase tracking-kicker text-moss underline">Publish</button>
                    </form>
                  )}
                  {canPublish && a.status === "published" && (
                    <form action={setArticleStatusAction}>
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="action" value="unpublish" />
                      <button type="submit" className="font-sans text-[10px] uppercase tracking-kicker text-ink-soft underline">Unpublish</button>
                    </form>
                  )}
                  {canPublish && (
                    <form action={deleteArticleAction}>
                      <input type="hidden" name="id" value={a.id} />
                      <button type="submit" className="font-sans text-[10px] uppercase tracking-kicker text-accent underline">Delete</button>
                    </form>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </TableShell>
      )}

      <Pagination page={page} total={total} perPage={PER_PAGE} basePath="/admin/articles" params={{ q: sp.q, status: sp.status, category: sp.category }} />
    </div>
  );
}
