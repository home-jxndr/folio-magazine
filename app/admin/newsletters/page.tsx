import Link from "next/link";
import { AdminForm } from "@/components/admin/form";
import { AdminPageHead, Badge, Empty, Stat, TableShell, statusTone } from "@/components/admin/ui";
import { createCampaignAction, saveEditionAction, sendEditionAction } from "@/app/actions/newsletter";
import { all } from "@/lib/db";
import { isEmailConfigured } from "@/lib/email";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Newsletters" };

type Edition = {
  id: string;
  slug: string;
  title: string;
  subject: string | null;
  preheader: string | null;
  body_html: string;
  status: string;
  featured: number;
  recipients: number;
  opens: number;
  clicks: number;
  sent_at: string | null;
  created_at: string;
};

type Campaign = {
  id: string;
  name: string;
  segment: string;
  status: string;
  recipients: number;
  opens: number;
  clicks: number;
  sent_at: string | null;
  created_at: string;
};

export default async function NewslettersPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  const [editions, campaigns, confirmed] = await Promise.all([
    all<Edition>("SELECT * FROM newsletter_editions ORDER BY created_at DESC LIMIT 50"),
    all<Campaign>("SELECT * FROM newsletter_campaigns ORDER BY created_at DESC LIMIT 20"),
    all<{ n: number }>("SELECT COUNT(*) AS n FROM subscribers WHERE status = 'confirmed'"),
  ]);
  const editing = edit ? editions.find((e) => e.id === edit) : null;
  const sent = editions.filter((e) => e.recipients > 0);
  const openRate = sent.length
    ? Math.round((sent.reduce((s, e) => s + e.opens, 0) / sent.reduce((s, e) => s + e.recipients, 0)) * 100)
    : 0;
  const clickRate = sent.length
    ? Math.round((sent.reduce((s, e) => s + e.clicks, 0) / sent.reduce((s, e) => s + e.recipients, 0)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <AdminPageHead
        kicker="Audience"
        title="Newsletters"
        description="Write an edition, choose a segment and send. Delivery is honest about its configuration: nothing is marked sent unless the email provider accepted it."
        action={<Link href="/newsletter/archive" className="btn btn-ghost">Public archive</Link>}
      />

      {!isEmailConfigured() && (
        <div className="border-l-2 border-accent bg-accent/5 px-4 py-3 font-sans text-[11.5px] leading-relaxed">
          <strong>RESEND_API_KEY is not set.</strong> Sending records the campaign as <em>blocked</em> and sends nothing.
          Subscribers can still be collected and editions published to the web archive. Set the key to enable delivery.
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-4">
        <Stat label="Confirmed subscribers" value={Number(confirmed[0]?.n ?? 0)} href="/admin/subscribers?status=confirmed" />
        <Stat label="Editions" value={editions.length} detail={`${sent.length} sent`} />
        <Stat label="Open rate" value={`${openRate}%`} detail="Across sent editions" />
        <Stat label="Click rate" value={`${clickRate}%`} detail="Across sent editions" />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <section>
          <div className="border-b border-ink pb-2">
            <h2 className="font-display text-xl font-semibold tracking-tight">Editions</h2>
          </div>
          {editions.length === 0 ? (
            <Empty title="No editions yet" body="Write the first edition with the form beside this list." />
          ) : (
            <TableShell head={["Edition", "Status", "Sent", "Recipients", "Opens", ""]}>
              {editions.map((e) => (
                <tr key={e.id} className="hover:bg-paper-2/40">
                  <td className="px-3 py-2.5">
                    <Link href={`/admin/newsletters?edit=${e.id}`} className="font-display text-[14px] font-semibold hover:text-accent">{e.title}</Link>
                    <p className="font-mono text-[10px] text-ink-soft">/newsletter/{e.slug}</p>
                  </td>
                  <td className="px-3 py-2.5"><Badge tone={statusTone(e.status)}>{e.status}</Badge></td>
                  <td className="px-3 py-2.5 font-sans text-[10.5px] text-ink-soft">{e.sent_at ? formatDate(e.sent_at) : "—"}</td>
                  <td className="px-3 py-2.5 font-sans text-[11px]">{e.recipients}</td>
                  <td className="px-3 py-2.5 font-sans text-[11px]">{e.opens}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/newsletter/${e.slug}`} className="font-sans text-[9.5px] uppercase tracking-kicker text-ink-soft underline">View</Link>
                      <Link href={`/admin/newsletters?edit=${e.id}`} className="font-sans text-[9.5px] uppercase tracking-kicker underline">Edit</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </TableShell>
          )}

          <div className="mt-6">
            <div className="border-b border-ink pb-2">
              <h2 className="font-display text-xl font-semibold tracking-tight">Campaigns</h2>
            </div>
            <TableShell head={["Campaign", "Segment", "Status", "Recipients", "Sent"]}>
              {campaigns.map((c) => (
                <tr key={c.id}>
                  <td className="px-3 py-2.5 font-sans text-[11.5px]">{c.name}</td>
                  <td className="px-3 py-2.5 font-sans text-[11px] text-ink-soft">{c.segment}</td>
                  <td className="px-3 py-2.5"><Badge tone={statusTone(c.status)}>{c.status}</Badge></td>
                  <td className="px-3 py-2.5 font-sans text-[11px]">{c.recipients}</td>
                  <td className="px-3 py-2.5 font-sans text-[10.5px] text-ink-soft">{c.sent_at ? formatDate(c.sent_at) : "—"}</td>
                </tr>
              ))}
              {campaigns.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-6 text-center font-serif text-[13px] text-ink-soft">No campaigns recorded yet.</td></tr>
              )}
            </TableShell>
            <div className="mt-4 border border-rule p-4">
              <p className="kicker-muted">Plan a campaign</p>
              <AdminForm action={createCampaignAction} submit="Create campaign" className="mt-3">
                <div className="grid gap-3 sm:grid-cols-[1fr_150px]">
                  <input name="name" required placeholder="Campaign name" className="field bg-paper" aria-label="Campaign name" />
                  <select name="segment" className="field bg-paper" aria-label="Segment">
                    <option value="all">All confirmed</option>
                    <option value="culture">Culture readers</option>
                    <option value="politics">Politics readers</option>
                    <option value="technology">Technology readers</option>
                  </select>
                </div>
              </AdminForm>
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div className="border border-rule bg-paper-2/30 p-5">
            <p className="kicker">{editing ? "Edit edition" : "New edition"}</p>
            <h2 className="mt-1 font-display text-xl font-semibold">{editing ? editing.title : "Write the next dispatch"}</h2>
            <AdminForm
              action={saveEditionAction}
              submit={editing ? "Save edition" : "Create edition"}
              className="mt-4"
              footer={editing ? <Link href="/admin/newsletters" className="font-sans text-[10px] uppercase tracking-kicker underline">Cancel</Link> : null}
            >
              <input type="hidden" name="id" value={editing?.id ?? ""} />
              <label htmlFor="title" className="label">Title</label>
              <input id="title" name="title" defaultValue={editing?.title ?? ""} required className="field bg-paper" />
              <label htmlFor="slug" className="label mt-3">Slug</label>
              <input id="slug" name="slug" defaultValue={editing?.slug ?? ""} placeholder="auto-generated" className="field bg-paper" />
              <label htmlFor="subject" className="label mt-3">Email subject</label>
              <input id="subject" name="subject" defaultValue={editing?.subject ?? ""} className="field bg-paper" />
              <label htmlFor="preheader" className="label mt-3">Preheader</label>
              <input id="preheader" name="preheader" defaultValue={editing?.preheader ?? ""} className="field bg-paper" />
              <label htmlFor="body_html" className="label mt-3">Body HTML</label>
              <textarea id="body_html" name="body_html" rows={10} defaultValue={editing?.body_html ?? ""} className="field bg-paper font-mono text-[11px]" placeholder="<p>Good morning…</p>" />
              <p className="mt-1 font-sans text-[10px] text-ink-soft">
                HTML is sent as written and published to the public archive. Paragraphs, links and images are supported.
              </p>
            </AdminForm>
          </div>

          {editing && (
            <div className="border border-ink p-5">
              <p className="kicker">Send this edition</p>
              <p className="mt-1 font-serif text-[14px] leading-relaxed text-ink-soft">
                Choose a segment. Only confirmed subscribers are matched; the send is logged with the exact count.
              </p>
              <AdminForm action={sendEditionAction} submit="Send edition now" className="mt-3">
                <input type="hidden" name="edition_id" value={editing.id} />
                <label htmlFor="segment" className="label">Segment</label>
                <select id="segment" name="segment" className="field bg-paper">
                  <option value="all">All confirmed subscribers</option>
                  <option value="culture">Culture readers</option>
                  <option value="politics">Politics readers</option>
                  <option value="technology">Technology readers</option>
                </select>
              </AdminForm>
              <p className="mt-3 font-sans text-[10px] leading-relaxed text-ink-soft">
                To publish without emailing, keep the edition as a draft and link it from the archive yourself — sending
                is the only action that contacts subscribers.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
