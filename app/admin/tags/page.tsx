import Link from "next/link";
import { AdminForm } from "@/components/admin/form";
import { AdminPageHead, TableShell } from "@/components/admin/ui";
import { deleteTagAction, saveTagAction } from "@/app/actions/admin";
import { all } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tags" };

type Row = { id: string; slug: string; name: string; n: number };

export default async function TagsPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  const rows = await all<Row>(
    `SELECT t.id, t.slug, t.name, COUNT(at.article_id) AS n
     FROM tags t LEFT JOIN article_tags at ON at.tag_id = t.id
     GROUP BY t.id ORDER BY n DESC, t.name ASC`,
  );
  const editing = edit ? rows.find((r) => r.id === edit) : null;

  return (
    <div className="space-y-6">
      <AdminPageHead
        kicker="Structure"
        title="Tags"
        description="Tags are free-form and created automatically when an article is saved with new ones. They power tag pages and search."
      />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div>
          <TableShell head={["Tag", "Slug", "Articles", ""]}>
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-paper-2/40">
                <td className="px-3 py-2.5 font-display text-[15px] font-semibold">{r.name}</td>
                <td className="px-3 py-2.5 font-mono text-[10.5px] text-ink-soft">/tag/{r.slug}</td>
                <td className="px-3 py-2.5 font-sans text-[11px]">{r.n}</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/tags?edit=${r.id}`} className="font-sans text-[10px] uppercase tracking-kicker underline">Rename</Link>
                    <Link href={`/tag/${r.slug}`} className="font-sans text-[10px] uppercase tracking-kicker text-ink-soft underline">View</Link>
                    <form action={deleteTagAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <button type="submit" className="font-sans text-[10px] uppercase tracking-kicker text-accent underline">Delete</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={4} className="px-3 py-8 text-center font-serif text-sm text-ink-soft">No tags yet.</td></tr>
            )}
          </TableShell>
          <p className="mt-2 font-sans text-[10px] text-ink-soft">
            Renaming a tag keeps its label in sync everywhere. Deleting removes it from every article.
          </p>
        </div>

        <section className="border border-rule bg-paper-2/30 p-5">
          <p className="kicker">{editing ? "Rename tag" : "Add a tag"}</p>
          <AdminForm
            action={saveTagAction}
            submit={editing ? "Save tag" : "Create tag"}
            className="mt-4"
            footer={editing ? <Link href="/admin/tags" className="font-sans text-[10px] uppercase tracking-kicker underline">Cancel</Link> : null}
          >
            <input type="hidden" name="id" value={editing?.id ?? ""} />
            <label htmlFor="name" className="label">Tag name</label>
            <input id="name" name="name" defaultValue={editing?.name ?? ""} required className="field bg-paper" />
          </AdminForm>
        </section>
      </div>
    </div>
  );
}
