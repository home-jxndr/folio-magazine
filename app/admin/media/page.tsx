import Link from "next/link";
import { AdminForm } from "@/components/admin/form";
import { AdminPageHead, Badge, Empty } from "@/components/admin/ui";
import { deleteMediaAction, saveMediaAction } from "@/app/actions/admin";
import { all } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Media library" };

type Row = {
  id: string;
  url: string;
  filename: string;
  alt: string | null;
  caption: string | null;
  folder: string;
  credit: string | null;
  created_at: string;
  used: number;
};

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ folder?: string; q?: string; edit?: string }> }) {
  const sp = await searchParams;
  const rows = await all<Row>(
    `SELECT m.*, (SELECT COUNT(*) FROM articles a WHERE a.cover_url = m.url) AS used
     FROM media m
     ${sp.q ? "WHERE m.filename LIKE ? OR m.alt LIKE ? OR m.credit LIKE ?" : ""}
     ORDER BY m.created_at DESC LIMIT 200`,
    ...(sp.q ? [`%${sp.q}%`, `%${sp.q}%`, `%${sp.q}%`] : []),
  );
  const folders = Array.from(new Set(rows.map((r) => r.folder)));
  const list = sp.folder ? rows.filter((r) => r.folder === sp.folder) : rows;
  const editing = sp.edit ? rows.find((r) => r.id === sp.edit) : null;

  return (
    <div className="space-y-6">
      <AdminPageHead
        kicker="Assets"
        title="Media library"
        description="The library stores metadata and remote URLs. Uploads are not accepted on this deployment — paste a hosted image URL and the library tracks its alt text, caption, credit and usage."
        action={
          <Link
            href={sp.folder ? `/admin/media?folder=${encodeURIComponent(sp.folder)}` : "/admin/media"}
            className="btn btn-ghost"
          >
            Clear filters
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div>
          <form action="/admin/media" className="mb-4 flex flex-wrap items-end gap-3 border border-rule bg-paper-2/30 p-3">
            <div className="min-w-[160px] flex-1">
              <label htmlFor="q" className="label">Search assets</label>
              <input id="q" name="q" defaultValue={sp.q ?? ""} placeholder="Filename, alt text or credit" className="field bg-paper" />
            </div>
            <div>
              <label htmlFor="folder" className="label">Folder</label>
              <select id="folder" name="folder" defaultValue={sp.folder ?? ""} className="field bg-paper">
                <option value="">All folders</option>
                {folders.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <button type="submit" className="btn btn-ghost">Filter</button>
          </form>

          {list.length === 0 ? (
            <Empty title="No assets match" body="Add a hosted image on the right, or clear the filters." />
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {list.map((m) => (
                <li key={m.id} className="group border border-rule">
                  <img src={m.url} alt={m.alt ?? ""} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                  <div className="p-2">
                    <p className="truncate font-sans text-[11px] font-semibold">{m.filename}</p>
                    <p className="font-sans text-[9.5px] uppercase tracking-kicker text-ink-soft">
                      {m.folder} · {formatDate(m.created_at)}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <Link href={`/admin/media?edit=${m.id}`} className="font-sans text-[9.5px] uppercase tracking-kicker underline">Edit</Link>
                      {m.used > 0 ? (
                        <Badge tone="live">used {m.used}×</Badge>
                      ) : (
                        <form action={deleteMediaAction}>
                          <input type="hidden" name="id" value={m.id} />
                          <button type="submit" className="font-sans text-[9.5px] uppercase tracking-kicker text-accent underline">Delete</button>
                        </form>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 font-sans text-[10px] text-ink-soft">
            Assets still used as an article cover cannot be deleted — replace the cover first.
          </p>
        </div>

        <section className="border border-rule bg-paper-2/30 p-5">
          <p className="kicker">{editing ? "Edit asset" : "Add asset"}</p>
          <AdminForm action={saveMediaAction} submit={editing ? "Save asset" : "Add to library"} className="mt-4"
            footer={editing ? <Link href="/admin/media" className="font-sans text-[10px] uppercase tracking-kicker underline">Cancel</Link> : null}>
            <input type="hidden" name="id" value={editing?.id ?? ""} />
            <label htmlFor="url" className="label">Image URL</label>
            <input id="url" name="url" type="url" defaultValue={editing?.url ?? ""} required placeholder="https://images.unsplash.com/…" className="field bg-paper" />
            <label htmlFor="filename" className="label mt-3">Filename</label>
            <input id="filename" name="filename" defaultValue={editing?.filename ?? ""} required placeholder="lisbon-harbour.jpg" className="field bg-paper" />
            <label htmlFor="alt" className="label mt-3">Alt text</label>
            <input id="alt" name="alt" defaultValue={editing?.alt ?? ""} className="field bg-paper" />
            <label htmlFor="caption" className="label mt-3">Caption</label>
            <input id="caption" name="caption" defaultValue={editing?.caption ?? ""} className="field bg-paper" />
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="folder" className="label">Folder</label>
                <select id="folder" name="folder" defaultValue={editing?.folder ?? "Editorial"} className="field bg-paper">
                  {["Editorial", "Portraits", "Features", "News", "Newsletter", "Archive"].map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="credit" className="label">Credit</label>
                <input id="credit" name="credit" defaultValue={editing?.credit ?? ""} placeholder="Photographer / agency" className="field bg-paper" />
              </div>
            </div>
          </AdminForm>
          <p className="mt-4 border-t border-rule pt-3 font-sans text-[10px] leading-relaxed text-ink-soft">
            Binary uploads require object storage (an R2 binding or S3 bucket) which is not configured here. The library
            works fully with external URLs, and every article image field accepts one.
          </p>
        </section>
      </div>
    </div>
  );
}
