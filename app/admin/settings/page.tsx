import Link from "next/link";
import { AdminForm } from "@/components/admin/form";
import { AdminPageHead, Badge, Empty, TableShell, statusTone } from "@/components/admin/ui";
import { saveSettingsAction, updateContactMessageAction } from "@/app/actions/admin";
import { all } from "@/lib/db";
import { getSettings } from "@/lib/queries";
import { getCurrentUser } from "@/lib/auth";
import { isEmailConfigured } from "@/lib/email";
import { timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Site settings" };

type Message = { id: string; name: string; email: string; subject: string | null; body: string; status: string; created_at: string };

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const [settings, messages] = await Promise.all([
    getSettings(),
    all<Message>("SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 40"),
  ]);
  const canEdit = user?.role === "super_admin";
  const key = (k: string, fallback = "") => settings[k] ?? fallback;

  return (
    <div className="space-y-8">
      <AdminPageHead
        kicker="Administration"
        title="Site settings"
        description="Publication identity, contact details and feature switches. These values are read directly by the site header, footer and contact page."
      />

      {!canEdit && (
        <div className="border-l-2 border-accent bg-accent/5 px-4 py-3 font-sans text-[11.5px]">
          Only a super administrator can change these settings. You are signed in as {user?.role.replace("_", " ")} — the
          values below are read-only.
        </div>
      )}

      <div className="grid gap-8 xl:grid-cols-[1.3fr_1fr]">
        <section className="border border-rule bg-paper-2/30 p-5">
          <p className="kicker">Publication</p>
          {canEdit ? (
            <AdminForm action={saveSettingsAction} submit="Save settings" className="mt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="site_name" className="label">Publication name</label>
                  <input id="site_name" name="setting__site_name" defaultValue={key("site_name", "FOLIO")} className="field bg-paper" />
                </div>
                <div>
                  <label htmlFor="issue" className="label">Issue line</label>
                  <input id="issue" name="setting__issue" defaultValue={key("issue")} className="field bg-paper" />
                </div>
              </div>
              <label htmlFor="tagline" className="label mt-3">Tagline</label>
              <input id="tagline" name="setting__tagline" defaultValue={key("tagline")} className="field bg-paper" />
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="contact_email" className="label">Editorial email</label>
                  <input id="contact_email" name="setting__contact_email" type="email" defaultValue={key("contact_email")} className="field bg-paper" />
                </div>
                <div>
                  <label htmlFor="newsletter_frequency" className="label">Default frequency</label>
                  <select id="newsletter_frequency" name="setting__newsletter_frequency" defaultValue={key("newsletter_frequency", "weekly")} className="field bg-paper">
                    <option value="weekly">Weekly</option>
                    <option value="daily">Daily</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
              <label htmlFor="address" className="label mt-3">Postal address</label>
              <input id="address" name="setting__address" defaultValue={key("address")} className="field bg-paper" />

              <p className="label mt-5">Features</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["comments_moderated", "Comment moderation", "Hold reader comments for approval"],
                  ["ads_enabled", "Advertising slots", "Render active ad placements"],
                  ["cookie_banner", "Cookie notice", "Show the consent banner to new visitors"],
                ].map(([k, label, hint]) => (
                  <label key={k} className="border border-rule bg-paper p-3 font-sans text-[11px]">
                    <span className="block">{label}</span>
                    <span className="mb-2 block text-[10px] leading-snug text-ink-soft">{hint}</span>
                    <select name={`setting__${k}`} defaultValue={key(k, "true")} className="field bg-paper" aria-label={label}>
                      <option value="true">On</option>
                      <option value="false">Off</option>
                    </select>
                  </label>
                ))}
              </div>

              <p className="label mt-5">Social profiles</p>
              <div className="grid gap-3">
                <input name="setting__social_x" defaultValue={key("social_x")} className="field bg-paper" placeholder="https://x.com/…" aria-label="X profile" />
                <input name="setting__social_instagram" defaultValue={key("social_instagram")} className="field bg-paper" placeholder="https://instagram.com/…" aria-label="Instagram profile" />
                <input name="setting__social_linkedin" defaultValue={key("social_linkedin")} className="field bg-paper" placeholder="https://linkedin.com/…" aria-label="LinkedIn profile" />
              </div>
            </AdminForm>
          ) : (
            <dl className="mt-4 divide-y divide-rule font-sans text-[12px]">
              {Object.entries(settings).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2">
                  <dt className="font-mono text-[10.5px] text-ink-soft">{k}</dt>
                  <dd className="text-right">{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        <section className="space-y-5">
          <div className="border border-rule p-5">
            <p className="kicker">Email delivery</p>
            <p className="mt-2 font-sans text-[12px]">
              Status:{" "}
              <Badge tone={isEmailConfigured() ? "live" : "warn"}>{isEmailConfigured() ? "configured" : "not configured"}</Badge>
            </p>
            <p className="mt-2 font-serif text-[13.5px] leading-relaxed text-ink-soft">
              {isEmailConfigured()
                ? "Newsletters, confirmations and password resets are delivered through Resend."
                : "Without RESEND_API_KEY the site still collects subscriptions, but confirmation links are shown on screen and campaign sends are recorded as blocked. Nothing is reported as delivered."}
            </p>
            <p className="mt-3 font-mono text-[10px] text-ink-soft">RESEND_API_KEY · MAIL_FROM</p>
          </div>

          <div className="border border-rule p-5">
            <p className="kicker">Media storage</p>
            <p className="mt-2 font-serif text-[13.5px] leading-relaxed text-ink-soft">
              The media library references hosted image URLs; binary uploads need object storage. To enable uploads,
              bind an R2 bucket and replace the URL field with an upload handler.
            </p>
            <p className="mt-3 font-mono text-[10px] text-ink-soft">R2 binding: FILES (optional)</p>
          </div>

          <div className="border border-rule p-5">
            <p className="kicker">Membership payments</p>
            <p className="mt-2 font-serif text-[13.5px] leading-relaxed text-ink-soft">
              No payment provider is configured, so the Member and Patron tiers are presented as unavailable and no card
              data is collected. Add a provider (for example Stripe) and its keys before enabling checkout.
            </p>
          </div>

          <div className="border border-rule p-5">
            <p className="kicker">Database</p>
            <p className="mt-2 font-serif text-[13.5px] leading-relaxed text-ink-soft">
              Content lives in Cloudflare D1 through the <span className="font-mono text-[12px]">DB</span> binding. The
              schema and demo content are created on the first request; no manual migration step is required.
            </p>
            <Link href="/" className="mt-3 inline-block font-sans text-[10px] uppercase tracking-kicker text-accent">View the magazine →</Link>
          </div>
        </section>
      </div>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-ink pb-2">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">Contact messages</h2>
            <p className="mt-1 font-sans text-[11px] text-ink-soft">Sent from the public contact form. Mark as read or archive once handled.</p>
          </div>
          <Link href="/contact" className="font-sans text-[10px] uppercase tracking-kicker text-accent">Open contact page</Link>
        </div>

        {messages.length === 0 ? (
          <div className="mt-4">
            <Empty title="No messages yet" body="Messages sent through the contact form arrive here." />
          </div>
        ) : (
          <div className="mt-4">
            <TableShell head={["From", "Subject", "Message", "Received", "Status", ""]}>
              {messages.map((m) => (
                <tr key={m.id} className="align-top">
                  <td className="px-3 py-3">
                    <p className="font-sans text-[12px] font-semibold">{m.name}</p>
                    <a href={`mailto:${m.email}`} className="font-mono text-[10px] text-ink-soft underline">{m.email}</a>
                  </td>
                  <td className="px-3 py-3 font-sans text-[11px]">{m.subject ?? "—"}</td>
                  <td className="max-w-md px-3 py-3 font-serif text-[13px] leading-relaxed">{m.body}</td>
                  <td className="px-3 py-3 font-sans text-[10.5px] text-ink-soft">{timeAgo(m.created_at)}</td>
                  <td className="px-3 py-3"><Badge tone={statusTone(m.status)}>{m.status}</Badge></td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      {m.status !== "read" && (
                        <form action={updateContactMessageAction}>
                          <input type="hidden" name="id" value={m.id} />
                          <input type="hidden" name="status" value="read" />
                          <button type="submit" className="font-sans text-[9.5px] uppercase tracking-kicker underline">Mark read</button>
                        </form>
                      )}
                      {m.status !== "archived" && (
                        <form action={updateContactMessageAction}>
                          <input type="hidden" name="id" value={m.id} />
                          <input type="hidden" name="status" value="archived" />
                          <button type="submit" className="font-sans text-[9.5px] uppercase tracking-kicker text-ink-soft underline">Archive</button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </TableShell>
          </div>
        )}
      </section>
    </div>
  );
}
