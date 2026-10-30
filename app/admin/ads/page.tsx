import Link from "next/link";
import { AdminForm } from "@/components/admin/form";
import { AdminPageHead, Badge, Stat, TableShell } from "@/components/admin/ui";
import { deleteAdAction, saveAdAction, toggleAdAction } from "@/app/actions/admin";
import { all } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Advertising" };

type Row = {
  id: string;
  name: string;
  placement: string;
  body: string | null;
  link_url: string | null;
  advertiser: string | null;
  image_url: string | null;
  active: number;
  impressions: number;
  clicks: number;
};

export default async function AdsPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  const rows = await all<Row>("SELECT * FROM advertisements ORDER BY active DESC, created_at DESC");
  const editing = edit ? rows.find((r) => r.id === edit) : null;
  const impressions = rows.reduce((s, r) => s + r.impressions, 0);
  const clicks = rows.reduce((s, r) => s + r.clicks, 0);

  return (
    <div className="space-y-6">
      <AdminPageHead
        kicker="Commercial"
        title="Advertising"
        description="House and display placements. Each active slot renders on the homepage, section pages and article sidebars; clicks are counted through a tracked redirect."
      />

      <section className="grid gap-3 sm:grid-cols-3">
        <Stat label="Active placements" value={rows.filter((r) => r.active).length} detail={`${rows.length} total`} />
        <Stat label="Impressions" value={impressions.toLocaleString("en")} detail="All time" />
        <Stat
          label="Clicks"
          value={clicks.toLocaleString("en")}
          detail={impressions ? `${((clicks / impressions) * 100).toFixed(1)}% CTR` : "No impressions yet"}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div>
          <TableShell head={["Placement", "Slot", "Status", "Impressions", "Clicks", ""]}>
            {rows.map((r) => (
              <tr key={r.id} className="align-top hover:bg-paper-2/40">
                <td className="px-3 py-2.5">
                  <p className="font-display text-[14px] font-semibold">{r.name}</p>
                  <p className="font-sans text-[10px] text-ink-soft">{r.advertiser ?? "House"}</p>
                  {r.body && <p className="mt-1 line-clamp-2 font-serif text-[12px] text-ink-soft">{r.body}</p>}
                </td>
                <td className="px-3 py-2.5 font-sans text-[10px] uppercase tracking-kicker text-ink-soft">{r.placement}</td>
                <td className="px-3 py-2.5"><Badge tone={r.active ? "live" : "muted"}>{r.active ? "live" : "paused"}</Badge></td>
                <td className="px-3 py-2.5 font-sans text-[11px]">{r.impressions.toLocaleString("en")}</td>
                <td className="px-3 py-2.5 font-sans text-[11px]">{r.clicks.toLocaleString("en")}</td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/ads?edit=${r.id}`} className="font-sans text-[9.5px] uppercase tracking-kicker underline">Edit</Link>
                    <form action={toggleAdAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <button type="submit" className="font-sans text-[9.5px] uppercase tracking-kicker text-ink-soft underline">
                        {r.active ? "Pause" : "Activate"}
                      </button>
                    </form>
                    <form action={deleteAdAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <button type="submit" className="font-sans text-[9.5px] uppercase tracking-kicker text-accent underline">Delete</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-8 text-center font-serif text-sm text-ink-soft">No placements yet.</td></tr>
            )}
          </TableShell>
          <p className="mt-2 font-sans text-[10px] text-ink-soft">
            Impressions count slot renders; clicks route through <code className="font-mono">/api/ads/click</code> and are
            counted before redirecting to the advertiser.
          </p>
        </div>

        <section className="border border-rule bg-paper-2/30 p-5">
          <p className="kicker">{editing ? "Edit placement" : "New placement"}</p>
          <AdminForm
            action={saveAdAction}
            submit={editing ? "Save placement" : "Create placement"}
            className="mt-4"
            footer={editing ? <Link href="/admin/ads" className="font-sans text-[10px] uppercase tracking-kicker underline">Cancel</Link> : null}
          >
            <input type="hidden" name="id" value={editing?.id ?? ""} />
            <label htmlFor="name" className="label">Internal name</label>
            <input id="name" name="name" defaultValue={editing?.name ?? ""} required className="field bg-paper" />
            <label htmlFor="placement" className="label mt-3">Slot</label>
            <select id="placement" name="placement" defaultValue={editing?.placement ?? "sidebar"} className="field bg-paper">
              <option value="sidebar">Sidebar (home, sections, articles)</option>
              <option value="inline">Inline (homepage mid-rail)</option>
              <option value="footer">Footer banner</option>
            </select>
            <label htmlFor="advertiser" className="label mt-3">Advertiser</label>
            <input id="advertiser" name="advertiser" defaultValue={editing?.advertiser ?? ""} className="field bg-paper" />
            <label htmlFor="body" className="label mt-3">Copy</label>
            <textarea id="body" name="body" rows={3} defaultValue={editing?.body ?? ""} className="field bg-paper" />
            <label htmlFor="image_url" className="label mt-3">Image URL</label>
            <input id="image_url" name="image_url" type="url" defaultValue={editing?.image_url ?? ""} className="field bg-paper" />
            <label htmlFor="link_url" className="label mt-3">Click-through URL</label>
            <input id="link_url" name="link_url" type="url" defaultValue={editing?.link_url ?? ""} className="field bg-paper" />
          </AdminForm>
          <p className="mt-4 border-t border-rule pt-3 font-sans text-[10px] leading-relaxed text-ink-soft">
            Placements are labelled “Advertisement” wherever they appear. No advertising is injected into article body
            text or newsletters.
          </p>
        </section>
      </div>
    </div>
  );
}
