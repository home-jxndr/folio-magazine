import Link from "next/link";
import { AdminPageHead, Stat, TableShell } from "@/components/admin/ui";
import { LineChart, BarList } from "@/components/admin/charts";
import { CsvButton } from "@/components/admin/csv-button";
import { exportAnalyticsCsvAction } from "@/app/actions/admin";
import {
  getAdminStats,
  getAnalyticsSeries,
  getCategoryBreakdown,
  getPopular,
  getReferralBreakdown,
  getSubscriberSeries,
} from "@/lib/queries";
import { compactNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Analytics" };

const RANGES = [7, 30, 90];

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range } = await searchParams;
  const days = RANGES.includes(Number(range)) ? Number(range) : 30;

  const [series, stats, popular, categories, referrals, subs] = await Promise.all([
    getAnalyticsSeries(days),
    getAdminStats(),
    getPopular(8, days),
    getCategoryBreakdown(days),
    getReferralBreakdown(days),
    getSubscriberSeries(days),
  ]);

  const views = series.reduce((s, d) => s + Number(d.views), 0);
  const uniques = series.reduce((s, d) => s + Number(d.uniques), 0);
  const newSubs = subs.reduce((s, d) => s + Number(d.n), 0);
  const perDay = series.length ? Math.round(views / series.length) : 0;
  const referralTotal = referrals.reduce((s, r) => s + Number(r.views), 0);

  return (
    <div className="space-y-6">
      <AdminPageHead
        kicker="Insight"
        title="Analytics"
        description="Aggregate readership only: page views, unique sessions, sections and referral source categories. No individual reader profiles are built."
        action={<CsvButton action={exportAnalyticsCsvAction} filename="folio-analytics.csv" label="Export report" />}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 font-sans text-[10px] uppercase tracking-kicker">
          {RANGES.map((r) => (
            <Link
              key={r}
              href={`/admin/analytics?range=${r}`}
              className={`border px-3 py-1.5 ${days === r ? "border-ink bg-ink text-paper" : "border-rule text-ink-soft"}`}
            >
              Last {r} days
            </Link>
          ))}
        </div>
        <p className="font-sans text-[10px] uppercase tracking-kicker text-ink-soft">
          {series.length} days with activity · {newSubs} new subscribers
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Views" value={compactNumber(views)} detail={`${perDay.toLocaleString("en")} per active day`} />
        <Stat label="Unique sessions" value={compactNumber(uniques)} detail="Distinct cookies" />
        <Stat label="Avg. time reading" value={`${Math.round(stats.avgDwell / 60)}m ${stats.avgDwell % 60}s`} detail="Where dwell is measured" />
        <Stat label="New subscribers" value={newSubs} detail={`${stats.confirmedSubscribers} confirmed total`} />
        <Stat label="All-time views" value={compactNumber(stats.views)} detail={`${stats.published} published pieces`} />
      </section>

      <section className="border border-rule p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl font-semibold tracking-tight">Daily readership</h2>
          <span className="font-sans text-[10px] uppercase tracking-kicker text-ink-soft">Views · last {days} days</span>
        </div>
        <div className="mt-4">
          <LineChart data={series.map((s) => ({ label: s.day, value: Number(s.views) }))} label="Views per day" />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="border border-rule p-5">
          <h2 className="font-display text-xl font-semibold tracking-tight">Subscriber growth</h2>
          <p className="font-sans text-[10px] uppercase tracking-kicker text-ink-soft">New records per day</p>
          <div className="mt-4">
            <LineChart data={subs.map((s) => ({ label: s.day, value: Number(s.n) }))} height={150} label="New subscribers" />
          </div>
        </section>
        <section className="border border-rule p-5">
          <h2 className="font-display text-xl font-semibold tracking-tight">Where readers come from</h2>
          <div className="mt-4">
            <BarList
              data={referrals.map((r) => ({
                label: `${r.source} · ${referralTotal ? Math.round((Number(r.views) / referralTotal) * 100) : 0}%`,
                value: Number(r.views),
              }))}
              label="Referral category"
            />
            {referrals.length === 0 && <p className="font-serif text-[14px] text-ink-soft">No referral data in this window yet.</p>}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section>
          <div className="border-b border-ink pb-2">
            <h2 className="font-display text-xl font-semibold tracking-tight">Most-read in this period</h2>
          </div>
          <TableShell head={["#", "Article", "Section", "Views"]}>
            {popular.map((a, i) => (
              <tr key={a.id} className="hover:bg-paper-2/40">
                <td className="px-3 py-2.5 font-display text-lg text-ink-soft/60">{i + 1}</td>
                <td className="px-3 py-2.5">
                  <Link href={`/article/${a.slug}`} className="font-display text-[14px] font-semibold hover:text-accent">{a.title}</Link>
                </td>
                <td className="px-3 py-2.5 font-sans text-[10.5px] text-ink-soft">{a.category_name ?? "—"}</td>
                <td className="px-3 py-2.5 font-sans text-[11px]">{compactNumber(a.views)}</td>
              </tr>
            ))}
            {popular.length === 0 && (
              <tr><td colSpan={4} className="px-3 py-8 text-center font-serif text-sm text-ink-soft">No reads recorded in this window.</td></tr>
            )}
          </TableShell>
        </section>

        <section className="border border-rule p-5">
          <h2 className="font-display text-xl font-semibold tracking-tight">Sections</h2>
          <div className="mt-4">
            <BarList data={categories.map((c) => ({ label: c.name, value: Number(c.views) }))} label="Views by section" />
            {categories.length === 0 && <p className="font-serif text-[14px] text-ink-soft">No section activity in this window.</p>}
          </div>
          <div className="mt-5 border-t border-rule pt-4">
            <p className="kicker-muted">Engagement notes</p>
            <ul className="mt-2 space-y-2 font-serif text-[13.5px] leading-relaxed text-ink-soft">
              <li>Reading progress is stored per signed-in reader; anonymous readers are measured in aggregate only.</li>
              <li>Newsletter opens and clicks are recorded per edition from provider webhooks where configured.</li>
              <li>CSV export includes date, views and unique sessions for the last 90 days.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
