import Link from "next/link";
import { AdminForm } from "@/components/admin/form";
import { AdminPageHead, TableShell } from "@/components/admin/ui";
import { deleteCategoryAction, saveCategoryAction } from "@/app/actions/admin";
import { all } from "@/lib/db";
import { listCategories } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sections" };

type Row = { id: string; slug: string; name: string; description: string | null; sort_order: number; n: number };

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  const [categories, counts] = await Promise.all([
    listCategories(),
    all<{ category_id: string; n: number }>(
      "SELECT category_id, COUNT(*) AS n FROM articles GROUP BY category_id",
    ),
  ]);
  const rows: Row[] = categories.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    sort_order: c.sort_order,
    n: Number(counts.find((x) => x.category_id === c.id)?.n ?? 0),
  }));
  const editing = edit ? rows.find((r) => r.id === edit) : null;

  return (
    <div className="space-y-6">
      <AdminPageHead
        kicker="Structure"
        title="Sections"
        description="Sections drive the navigation, the homepage rails and article URLs. Order matters: lower numbers appear first."
      />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div>
          <TableShell head={["Order", "Section", "Slug", "Articles", ""]}>
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-paper-2/40">
                <td className="px-3 py-2.5 font-mono text-[11px] text-ink-soft">{r.sort_order}</td>
                <td className="px-3 py-2.5">
                  <p className="font-display text-[15px] font-semibold">{r.name}</p>
                  {r.description && <p className="font-sans text-[10.5px] text-ink-soft">{r.description}</p>}
                </td>
                <td className="px-3 py-2.5 font-mono text-[10.5px] text-ink-soft">/{r.slug}</td>
                <td className="px-3 py-2.5 font-sans text-[11px]">{r.n}</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/categories?edit=${r.id}`} className="font-sans text-[10px] uppercase tracking-kicker underline">
                      Edit
                    </Link>
                    <Link href={`/category/${r.slug}`} className="font-sans text-[10px] uppercase tracking-kicker text-ink-soft underline">
                      View
                    </Link>
                    <form action={deleteCategoryAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <button
                        type="submit"
                        disabled={r.n > 0}
                        title={r.n > 0 ? "Move or delete the articles in this section first" : "Delete section"}
                        className="font-sans text-[10px] uppercase tracking-kicker text-accent underline disabled:cursor-not-allowed disabled:text-ink-soft/40 disabled:no-underline"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-8 text-center font-serif text-sm text-ink-soft">No sections yet.</td></tr>
            )}
          </TableShell>
          <p className="mt-2 font-sans text-[10px] text-ink-soft">
            A section with articles cannot be deleted — reassign its articles first.
          </p>
        </div>

        <section className="border border-rule bg-paper-2/30 p-5">
          <p className="kicker">{editing ? "Edit section" : "Add a section"}</p>
          <h2 className="mt-1 font-display text-xl font-semibold">{editing ? editing.name : "New section"}</h2>
          <AdminForm
            action={saveCategoryAction}
            submit={editing ? "Save changes" : "Create section"}
            className="mt-4"
            footer={editing ? <Link href="/admin/categories" className="font-sans text-[10px] uppercase tracking-kicker underline">Cancel</Link> : null}
          >
            <input type="hidden" name="id" value={editing?.id ?? ""} />
            <label htmlFor="name" className="label">Name</label>
            <input id="name" name="name" defaultValue={editing?.name ?? ""} required className="field bg-paper" />
            <label htmlFor="description" className="label mt-3">Description</label>
            <textarea id="description" name="description" rows={3} defaultValue={editing?.description ?? ""} className="field bg-paper" />
            <label htmlFor="sort_order" className="label mt-3">Sort order</label>
            <input id="sort_order" name="sort_order" type="number" defaultValue={editing?.sort_order ?? rows.length + 1} className="field bg-paper" />
          </AdminForm>
        </section>
      </div>
    </div>
  );
}
