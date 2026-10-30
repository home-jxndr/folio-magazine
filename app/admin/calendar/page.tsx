import Link from "next/link";
import { AdminPageHead, Badge, statusTone } from "@/components/admin/ui";
import { setArticleStatusAction } from "@/app/actions/admin";
import { all } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Editorial calendar" };

type Row = {
  id: string;
  title: string;
  status: string;
  published_at: string | null;
  category_name: string | null;
  author_name: string | null;
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month } = await searchParams;
  const now = new Date();
  const valid = month && /^\d{4}-\d{2}$/.test(month);
  const base = valid ? new Date(`${month}-01T00:00:00Z`) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const year = base.getUTCFullYear();
  const monthIndex = base.getUTCMonth();
  const first = new Date(Date.UTC(year, monthIndex, 1));
  const last = new Date(Date.UTC(year, monthIndex + 1, 0));
  const from = first.toISOString().slice(0, 10);
  const to = last.toISOString().slice(0, 10);

  const rows = await all<Row>(
    `SELECT a.id, a.title, a.status, a.published_at, c.name AS category_name, u.name AS author_name
     FROM articles a LEFT JOIN categories c ON c.id = a.category_id LEFT JOIN users u ON u.id = a.author_id
     WHERE a.published_at IS NOT NULL AND date(a.published_at) BETWEEN ? AND ?
        OR a.status = 'scheduled'
     ORDER BY a.published_at ASC`,
    from, to,
  );

  const scheduled = await all<Row>(
    `SELECT a.id, a.title, a.status, a.published_at, c.name AS category_name, u.name AS author_name
     FROM articles a LEFT JOIN categories c ON c.id = a.category_id LEFT JOIN users u ON u.id = a.author_id
     WHERE a.status = 'scheduled' ORDER BY a.published_at ASC LIMIT 10`,
  );

  const byDay = new Map<string, Row[]>();
  for (const r of rows) {
    const key = (r.published_at ?? "").slice(0, 10);
    if (!key) continue;
    byDay.set(key, [...(byDay.get(key) ?? []), r]);
  }

  const leading = (first.getUTCDay() + 6) % 7;
  const cells: (string | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: last.getUTCDate() }, (_, i) => new Date(Date.UTC(year, monthIndex, i + 1)).toISOString().slice(0, 10)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const prev = new Date(Date.UTC(year, monthIndex - 1, 1));
  const next = new Date(Date.UTC(year, monthIndex + 1, 1));
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <AdminPageHead
        kicker="Planning"
        title="Editorial calendar"
        description="Everything published and scheduled, by day. Scheduled pieces go live at their stored timestamp; publishing early overrides the schedule."
        action={
          <div className="flex items-center gap-2 font-sans text-[10px] uppercase tracking-kicker">
            <Link href={`/admin/calendar?month=${monthKey(prev)}`} className="border border-rule px-3 py-1.5 hover:border-ink">← Prev</Link>
            <Link href="/admin/calendar" className="border border-rule px-3 py-1.5 hover:border-ink">Today</Link>
            <Link href={`/admin/calendar?month=${monthKey(next)}`} className="border border-rule px-3 py-1.5 hover:border-ink">Next →</Link>
          </div>
        }
      />

      <div className="flex items-baseline justify-between border-b border-ink pb-2">
        <h2 className="font-display text-2xl font-semibold tracking-tight">{MONTHS[monthIndex]} {year}</h2>
        <p className="font-sans text-[10px] uppercase tracking-kicker text-ink-soft">
          {rows.filter((r) => r.status === "published").length} published · {rows.filter((r) => r.status === "scheduled").length} scheduled
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-7 border-b border-rule">
            {DAYS.map((d) => (
              <div key={d} className="px-2 py-2 font-sans text-[9px] uppercase tracking-kicker text-ink-soft">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              const items = day ? byDay.get(day) ?? [] : [];
              return (
                <div
                  key={`${day ?? "blank"}-${i}`}
                  className={`min-h-[112px] border-b border-r border-rule p-1.5 ${day === today ? "bg-paper-2/70" : ""}`}
                >
                  {day && (
                    <>
                      <p className={`font-mono text-[10px] ${day === today ? "text-accent" : "text-ink-soft"}`}>{day.slice(8)}</p>
                      <ul className="mt-1 space-y-1">
                        {items.slice(0, 3).map((it) => (
                          <li key={it.id}>
                            <Link
                              href={`/admin/articles/${it.id}`}
                              title={`${it.title} — ${it.status}`}
                              className={`block truncate border-l-2 pl-1.5 font-sans text-[10px] leading-tight hover:text-accent ${
                                it.status === "scheduled" ? "border-accent text-ink-soft" : "border-ink/30"
                              }`}
                            >
                              {it.title}
                            </Link>
                          </li>
                        ))}
                        {items.length > 3 && <li className="pl-1.5 font-sans text-[9px] text-ink-soft">+{items.length - 3} more</li>}
                      </ul>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <section>
        <div className="border-b border-ink pb-2">
          <h2 className="font-display text-xl font-semibold tracking-tight">Scheduled next</h2>
        </div>
        {scheduled.length === 0 ? (
          <p className="mt-4 font-serif text-[14px] text-ink-soft">
            Nothing is scheduled. Set a date and time in the article editor to queue a piece.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-rule">
            {scheduled.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <Link href={`/admin/articles/${s.id}`} className="font-display text-[15px] font-semibold hover:text-accent">{s.title}</Link>
                  <p className="font-sans text-[10px] uppercase tracking-kicker text-ink-soft">
                    {s.published_at ? `${s.published_at.slice(0, 16)} UTC` : "no timestamp set"} · {s.category_name ?? "unassigned"} · {s.author_name ?? "—"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={statusTone(s.status)}>{s.status}</Badge>
                  <form action={setArticleStatusAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="action" value="publish" />
                    <button type="submit" className="font-sans text-[10px] uppercase tracking-kicker text-moss underline">Publish now</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
