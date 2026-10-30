import Link from "next/link";
import { AdminPageHead, Badge, Empty, Stat, TableShell, statusTone } from "@/components/admin/ui";
import { CsvButton } from "@/components/admin/csv-button";
import { deleteSubscriberAction, updateSubscriberStatusAction } from "@/app/actions/newsletter";
import { exportSubscribersCsvAction } from "@/app/actions/auth";
import { all } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Subscribers" };

type Row = {
  id: string;
  email: string;
  name: string | null;
  status: string;
  frequency: string;
  topics: string;
  source: string | null;
  created_at: string;
  confirmed_at: string | null;
};

function parseTopics(raw: string): string[] {
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export default async function SubscribersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; frequency?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const where: string[] = ["1=1"];
  const params: unknown[] = [];
  if (sp.status) { where.push("status = ?"); params.push(sp.status); }
  if (sp.frequency) { where.push("frequency = ?"); params.push(sp.frequency); }
  if (sp.q) { where.push("(email LIKE ? OR name LIKE ?)"); params.push(`%${sp.q}%`, `%${sp.q}%`); }

  const [rows, counts, freq] = await Promise.all([
    all<Row>(
      `SELECT id, email, name, status, frequency, topics, source, created_at, confirmed_at
       FROM subscribers WHERE ${where.join(" AND ")} ORDER BY created_at DESC LIMIT 150`,
      ...params,
    ),
    all<{ status: string; n: number }>("SELECT status, COUNT(*) AS n FROM subscribers GROUP BY status"),
    all<{ frequency: string; n: number }>("SELECT frequency, COUNT(*) AS n FROM subscribers GROUP BY frequency"),
  ]);

  const count = (s: string) => Number(counts.find((c) => c.status === s)?.n ?? 0);
  const total = counts.reduce((s, c) => s + Number(c.n), 0);

  return (
    <div className="space-y-6">
      <AdminPageHead
        kicker="Audience"
        title="Subscribers"
        description="Consent is recorded per address: pending until confirmed, then confirmed. Unsubscribing is honoured immediately and kept on record."
        action={<CsvButton action={exportSubscribersCsvAction} filename="folio-subscribers.csv" label="Export subscribers" />}
      />

      <section className="grid gap-3 sm:grid-cols-4">
        <Stat label="Total records" value={total} />
        <Stat label="Confirmed" value={count("confirmed")} detail="Actively receiving" href="/admin/subscribers?status=confirmed" />
        <Stat label="Pending" value={count("pending")} detail="Awaiting confirmation" href="/admin/subscribers?status=pending" />
        <Stat label="Unsubscribed" value={count("unsubscribed")} detail="Opted out" href="/admin/subscribers?status=unsubscribed" />
      </section>

      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <form action="/admin/subscribers" className="flex flex-wrap items-end gap-3 border border-rule bg-paper-2/30 p-3">
          <div className="min-w-[150px] flex-1">
            <label htmlFor="q" className="label">Search</label>
            <input id="q" name="q" defaultValue={sp.q ?? ""} placeholder="Email or name" className="field bg-paper" />
          </div>
          <div>
            <label htmlFor="status" className="label">Status</label>
            <select id="status" name="status" defaultValue={sp.status ?? ""} className="field bg-paper">
              <option value="">All</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="unsubscribed">Unsubscribed</option>
            </select>
          </div>
          <div>
            <label htmlFor="frequency" className="label">Frequency</label>
            <select id="frequency" name="frequency" defaultValue={sp.frequency ?? ""} className="field bg-paper">
              <option value="">All</option>
              <option value="weekly">Weekly</option>
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <button type="submit" className="btn btn-ghost">Filter</button>
          {(sp.q || sp.status || sp.frequency) && <Link href="/admin/subscribers" className="font-sans text-[10px] uppercase tracking-kicker underline">Clear</Link>}
        </form>
        <div className="border border-rule p-3">
          <p className="kicker-muted">By frequency</p>
          <ul className="mt-2 space-y-1.5 font-sans text-[11.5px]">
            {freq.map((f) => (
              <li key={f.frequency} className="flex justify-between">
                <Link href={`/admin/subscribers?frequency=${f.frequency}`} className="capitalize text-ink-soft hover:text-ink">{f.frequency}</Link>
                <span>{f.n}</span>
              </li>
            ))}
            {freq.length === 0 && <li className="text-ink-soft">No records</li>}
          </ul>
        </div>
      </div>

      {rows.length === 0 ? (
        <Empty title="No subscribers match" body="Try clearing the filters, or invite readers from the newsletter page." />
      ) : (
        <TableShell head={["Subscriber", "Status", "Frequency", "Topics", "Source", "Joined", "Actions"]}>
          {rows.map((s) => (
            <tr key={s.id} className="align-top hover:bg-paper-2/40">
              <td className="px-3 py-2.5">
                <p className="font-sans text-[12px]">{s.email}</p>
                <p className="font-sans text-[10px] text-ink-soft">{s.name ?? "—"}</p>
              </td>
              <td className="px-3 py-2.5"><Badge tone={statusTone(s.status)}>{s.status}</Badge></td>
              <td className="px-3 py-2.5 font-sans text-[11px] capitalize">{s.frequency}</td>
              <td className="px-3 py-2.5 font-sans text-[10px] text-ink-soft">
                {parseTopics(s.topics).join(", ") || "all"}
              </td>
              <td className="px-3 py-2.5 font-sans text-[10px] text-ink-soft">{s.source ?? "web"}</td>
              <td className="px-3 py-2.5 font-sans text-[10.5px] text-ink-soft">{formatDate(s.created_at)}</td>
              <td className="px-3 py-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  {s.status !== "confirmed" && (
                    <form action={updateSubscriberStatusAction}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="status" value="confirmed" />
                      <button type="submit" className="font-sans text-[9.5px] uppercase tracking-kicker text-moss underline">Confirm</button>
                    </form>
                  )}
                  {s.status !== "unsubscribed" && (
                    <form action={updateSubscriberStatusAction}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="status" value="unsubscribed" />
                      <button type="submit" className="font-sans text-[9.5px] uppercase tracking-kicker text-ink-soft underline">Unsubscribe</button>
                    </form>
                  )}
                  <form action={deleteSubscriberAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <button type="submit" className="font-sans text-[9.5px] uppercase tracking-kicker text-accent underline">Delete</button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </TableShell>
      )}
      <p className="font-sans text-[10px] leading-relaxed text-ink-soft">
        Deleting a record removes the consent history with it. Prefer “Unsubscribe” so the address is not mailed again;
        use Delete only for erasure requests.
      </p>
    </div>
  );
}
