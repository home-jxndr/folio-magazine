import Link from "next/link";
import { AdminPageHead, Badge, TableShell } from "@/components/admin/ui";
import { all } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Contributors" };

type Row = {
  id: string;
  name: string;
  slug: string;
  role: string;
  title: string | null;
  bio: string | null;
  avatar_url: string | null;
  total: number;
  published: number;
  views: number;
};

export default async function AuthorsPage() {
  const rows = await all<Row>(
    `SELECT u.id, u.name, u.slug, u.role, u.title, u.bio, u.avatar_url,
            COUNT(a.id) AS total,
            COALESCE(SUM(CASE WHEN a.status = 'published' THEN 1 ELSE 0 END), 0) AS published,
            COALESCE(SUM(a.views), 0) AS views
     FROM users u LEFT JOIN articles a ON a.author_id = u.id
     WHERE u.role IN ('super_admin','admin','editor','author')
     GROUP BY u.id ORDER BY published DESC, u.name ASC`,
  );

  return (
    <div className="space-y-6">
      <AdminPageHead
        kicker="People"
        title="Contributors"
        description="Everyone with a byline. Profiles appear at /author/slug and are editable from Users & roles; deleting a contributor unassigns their articles."
        action={<Link href="/admin/users" className="btn btn-primary">Manage accounts</Link>}
      />

      <TableShell head={["Contributor", "Role", "Articles", "Published", "Views", "Profile", ""]}>
        {rows.map((u) => (
          <tr key={u.id} className="align-top hover:bg-paper-2/40">
            <td className="px-3 py-3">
              <div className="flex items-center gap-3">
                {u.avatar_url ? (
                  <img src={u.avatar_url} alt="" className="h-9 w-9 object-cover" loading="lazy" />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center bg-paper-2 font-display text-sm">{u.name.slice(0, 1)}</span>
                )}
                <div>
                  <p className="font-display text-[15px] font-semibold">{u.name}</p>
                  <p className="font-sans text-[10px] text-ink-soft">{u.title ?? "No title set"}</p>
                </div>
              </div>
              {!u.bio && <Badge tone="warn">profile incomplete</Badge>}
            </td>
            <td className="px-3 py-3 font-sans text-[10.5px] capitalize text-ink-soft">{u.role.replace("_", " ")}</td>
            <td className="px-3 py-3 font-sans text-[11px]">{u.total}</td>
            <td className="px-3 py-3 font-sans text-[11px]">{u.published}</td>
            <td className="px-3 py-3 font-sans text-[11px]">{Number(u.views).toLocaleString("en")}</td>
            <td className="px-3 py-3">
              <Link href={`/author/${u.slug}`} className="font-sans text-[10px] uppercase tracking-kicker text-ink-soft underline">/author/{u.slug}</Link>
            </td>
            <td className="px-3 py-3">
              <div className="flex flex-wrap gap-2">
                <Link href={`/admin/users?edit=${u.id}`} className="font-sans text-[10px] uppercase tracking-kicker underline">Edit profile</Link>
                <Link href={`/admin/articles?q=&status=draft`} className="font-sans text-[10px] uppercase tracking-kicker text-ink-soft underline">Their drafts</Link>
              </div>
            </td>
          </tr>
        ))}
        {rows.length === 0 && (
          <tr><td colSpan={7} className="px-3 py-8 text-center font-serif text-sm text-ink-soft">No contributors yet.</td></tr>
        )}
      </TableShell>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="border border-rule p-4">
          <p className="kicker-muted">How bylines work</p>
          <p className="mt-2 font-serif text-[14px] leading-relaxed text-ink-soft">
            The byline on an article is the account selected in the editor’s “Byline” field. Authors only see and edit
            their own drafts; editors and administrators can reassign any piece.
          </p>
        </div>
        <div className="border border-rule p-4">
          <p className="kicker-muted">Author submissions</p>
          <p className="mt-2 font-serif text-[14px] leading-relaxed text-ink-soft">
            When an author selects “Publish”, the piece is stored as <em>review</em> instead — an editor has to approve
            it. Review the queue from the dashboard before publication.
          </p>
        </div>
      </div>
    </div>
  );
}
