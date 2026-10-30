import Link from "next/link";
import { AdminPageHead, Badge, Stat, TableShell, statusTone } from "@/components/admin/ui";
import { LineChart, BarList } from "@/components/admin/charts";
import {
  getActivity,
  getAdminStats,
  getAnalyticsSeries,
  getCategoryBreakdown,
  getNewsletterEditions,
  getPopular,
  listArticles,
} from "@/lib/queries";
import { compactNumber, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [stats, popular, activity, series, editions, categories, review, drafts] = await Promise.all([
    getAdminStats(),
    getPopular(5),
    getActivity(7),
    getAnalyticsSeries(30),
    getNewsletterEditions(4),
    getCategoryBreakdown(30),
    listArticles({ limit: 5 }),
    (await import("@/lib/db")).all<{ id: string; title: string; status: string; updated_at: string; author_name: string | null }>(
      `SELECT a.id, a.title, a.status, a.updated_at, u.name AS author_name FROM articles a
       LEFT JOIN users u ON u.id = a.author_id WHERE a.status IN ('draft','review','scheduled')
       ORDER BY a.updated_at DESC LIMIT 6`,
    ),
  ]);

  const seriesData = series.map((s) => ({ label: s.day, value: Number(s.views) }));
  const sentEditions = editions.filter((e) => e.recipients > 0);

  return (
    <div className="space-y-8">
      <AdminPageHead
        kicker="Overview"
        title="The desk today"
        description="Everything published, scheduled and waiting on an editor — plus how the audience is moving."
        action={
          <div className="flex gap-2">
            <Link href="/admin/articles/new" className="btn btn-primary">New article</Link>
            <Link href="/admin/analytics" className="btn btn-ghost">Analytics</Link>
          </div>
        }
      />

      <section className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <Stat label="Published" value={stats.published} detail="Live on the site" href="/admin/articles?status=published" />
        <Stat label="Drafts" value={stats.drafts} detail="Not published" href="/admin/articles?status=draft" />
        <Stat label="Scheduled" value={stats.scheduled} detail="Awaiting publication" href="/admin/calendar" />
        <Stat label="Subscribers" value={compactNumber(stats.subscribers)} detail={`${stats.pendingSubscribers} pending`} href="/admin/subscribers" />
        <Stat label="Article views" value={compactNumber(stats.views)} detail="All time" href="/admin/analytics" />
        <Stat label="Avg. read" value={`${Math.round(stats.avgDwell / 60)}m`} detail={`${compactNumber(stats.uniques)} sessions`} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="border border-rule p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-xl font-semibold tracking-tight">Readership, last 30 days</h2>
            <span className="font-sans text-[10px] uppercase tracking-kicker text-ink-soft">
              {compactNumber(seriesData.reduce((s, d) => s + d.value, 0))} views
            </span>
          </div>
          <div className="mt-4">
            <LineChart data={seriesData} label="Daily page views" />
          </div>
          <div className="mt-4 grid gap-4 border-t border-rule pt-4 sm:grid-cols-2">
            <BarList
              label="Most-read sections (30d)"
              data={categories.slice(0, 5).map((c) => ({ label: c.name, value: Number(c.views) }))}
            />
            <div>
              <p className="mb-2 font-sans text-[9.5px] uppercase tracking-kicker text-ink-soft">Newsletter performance</p>
              <ul className="space-y-2.5 font-sans text-[11.5px]">
                {editions.slice(0, 3).map((e) => (
                  <li key={e.id} className="flex items-baseline justify-between gap-3">
                    <span className="truncate">{e.title}</span>
                    <span className="shrink-0 text-ink-soft">
                      {e.recipients ? `${Math.round((e.opens / e.recipients) * 100)}% open` : e.status}
                    </span>
                  </li>
                ))}
                {editions.length === 0 && <li className="text-ink-soft">No editions yet.</li>}
              </ul>
              <Link href="/admin/newsletters" className="mt-3 inline-block font-sans text-[10px] uppercase tracking-kicker text-accent">
                Manage newsletters →
              </Link>
            </div>
          </div>
        </section>

        <section className="border border-rule p-5">
          <h2 className="font-display text-xl font-semibold tracking-tight">Most popular articles</h2>
          <ol className="mt-3 divide-y divide-rule">
            {popular.map((a, i) => (
              <li key={a.id} className="flex gap-3 py-3">
                <span className="font-display text-xl leading-none text-ink-soft/50">{i + 1}</span>
                <div className="min-w-0">
                  <Link href={`/article/${a.slug}`} className="font-display text-[14px] font-semibold leading-snug hover:text-accent">
                    {a.title}
                  </Link>
                  <p className="mt-0.5 font-sans text-[10px] uppercase tracking-kicker text-ink-soft">
                    {a.category_name} · {compactNumber(a.views)} reads
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <Link href="/admin/analytics" className="mt-3 inline-block font-sans text-[10px] uppercase tracking-kicker text-accent">
            Full analytics →
          </Link>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section>
          <div className="flex items-end justify-between border-b border-ink pb-2">
            <h2 className="font-display text-xl font-semibold tracking-tight">Waiting on the desk</h2>
            <Link href="/admin/articles" className="font-sans text-[10px] uppercase tracking-kicker text-accent">All articles</Link>
          </div>
          <TableShell head={["Title", "Status", "Author", "Updated", ""]}>
            {drafts.map((d) => (
              <tr key={d.id} className="hover:bg-paper-2/40">
                <td className="px-3 py-2.5 font-display text-[14px] font-semibold">
                  <Link href={`/admin/articles/${d.id}`} className="hover:text-accent">{d.title}</Link>
                </td>
                <td className="px-3 py-2.5"><Badge tone={statusTone(d.status)}>{d.status}</Badge></td>
                <td className="px-3 py-2.5 font-sans text-[11px] text-ink-soft">{d.author_name ?? "—"}</td>
                <td className="px-3 py-2.5 font-sans text-[11px] text-ink-soft">{timeAgo(d.updated_at)}</td>
                <td className="px-3 py-2.5 text-right">
                  <Link href={`/admin/articles/${d.id}`} className="font-sans text-[10px] uppercase tracking-kicker text-accent">Edit</Link>
                </td>
              </tr>
            ))}
            {drafts.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-8 text-center font-serif text-sm text-ink-soft">Nothing waiting. The desk is clear.</td></tr>
            )}
          </TableShell>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="border border-rule p-4">
              <p className="font-sans text-[9.5px] uppercase tracking-kicker text-ink-soft">Engagement</p>
              <p className="mt-1 font-display text-lg">{compactNumber(stats.views)} total views</p>
              <p className="font-sans text-[10.5px] text-ink-soft">{stats.newSubscribers} new subscribers in 30 days</p>
            </div>
            <div className="border border-rule p-4">
              <p className="font-sans text-[9.5px] uppercase tracking-kicker text-ink-soft">Newsletter list</p>
              <p className="mt-1 font-display text-lg">{compactNumber(stats.confirmedSubscribers)} confirmed</p>
              <p className="font-sans text-[10.5px] text-ink-soft">
                {sentEditions[0] ? `${sentEditions[0].opens.toLocaleString("en")} opens on the last send` : "No sends yet"}
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="border-b border-ink pb-2">
            <h2 className="font-display text-xl font-semibold tracking-tight">Recent activity</h2>
          </div>
          <ol className="mt-3 divide-y divide-rule">
            {activity.map((a) => (
              <li key={a.id} className="py-2.5">
                <p className="font-sans text-[12px]">
                  <span className="font-semibold">{a.actor}</span> {a.action} <span className="italic">{a.target}</span>
                </p>
                <p className="font-sans text-[10px] uppercase tracking-kicker text-ink-soft">{timeAgo(a.created_at)}</p>
              </li>
            ))}
          </ol>
          <p className="mt-4 font-sans text-[10px] uppercase tracking-kicker text-ink-soft">
            {review.length} pieces in the most recent queue
          </p>
        </section>
      </div>
    </div>
  );
}
