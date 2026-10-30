"use server";

import { revalidatePath } from "next/cache";
import { all, one, run } from "@/lib/db";
import { getCurrentUser, requireEditor } from "@/lib/auth";
import { randomToken } from "@/lib/password";
import { emailShell, isEmailConfigured, sendEmail } from "@/lib/email";
import { isEmail } from "@/lib/utils";
import type { ActionState } from "@/lib/action-types";

export async function subscribeAction(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const frequency = String(formData.get("frequency") ?? "weekly");
  const consent = formData.get("consent");
  const source = String(formData.get("source") ?? "website");
  const topics = formData.getAll("topics").map(String);

  if (!isEmail(email)) return { ok: false, message: "Enter a valid email address.", errors: { email: "That address is not valid." } };
  if (!consent) return { ok: false, message: "Please confirm you agree to receive the newsletter.", errors: { consent: "Consent is required." } };

  const existing = await one<{ id: string; status: string; token: string }>(
    "SELECT id, status, token FROM subscribers WHERE lower(email) = lower(?)", email,
  );

  if (existing?.status === "confirmed") {
    return { ok: true, message: "You are already on the list — nothing else to do. You can adjust preferences from the link in any edition." };
  }

  const token = existing?.token ?? randomToken(12);
  if (existing) {
    await run(
      "UPDATE subscribers SET status = 'pending', frequency = ?, topics = ?, name = COALESCE(NULLIF(?, ''), name), source = ?, unsubscribed_at = NULL WHERE id = ?",
      frequency, JSON.stringify(topics.length ? topics : ["sunday-edition"]), name, source, existing.id,
    );
  } else {
    await run(
      `INSERT INTO subscribers (id, email, name, status, frequency, topics, token, source, created_at)
       VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, datetime('now'))`,
      `sub-${randomToken(6)}`, email, name || null, frequency, JSON.stringify(topics.length ? topics : ["sunday-edition"]), token, source,
    );
  }

  const confirmUrl = `/newsletter/confirm?token=${token}`;
  const sent = await sendEmail({
    to: email,
    subject: "Confirm your FOLIO subscription",
    html: emailShell("One click to confirm", `<p>Please confirm you would like to receive FOLIO newsletters at this address.</p><p><a href="${confirmUrl}">Confirm subscription</a></p><p>If you did not request this, ignore the message and nothing will be sent.</p>`),
  });

  revalidatePath("/admin/subscribers");
  return {
    ok: true,
    message: sent.delivered
      ? "Almost done — check your inbox for the confirmation link."
      : "Saved as pending. Email delivery is not configured on this installation, so use the confirmation link below to complete the subscription.",
    link: sent.delivered ? undefined : { href: confirmUrl, label: "Confirm subscription" },
  };
}

export async function confirmSubscriptionAction(token: string): Promise<ActionState> {
  const sub = await one<{ id: string; email: string; status: string }>("SELECT id, email, status FROM subscribers WHERE token = ?", token);
  if (!sub) return { ok: false, message: "That confirmation link is not valid." };
  if (sub.status === "confirmed") return { ok: true, message: "Your subscription was already confirmed." };
  await run("UPDATE subscribers SET status = 'confirmed', confirmed_at = datetime('now') WHERE id = ?", sub.id);
  revalidatePath("/admin/subscribers");
  return { ok: true, message: `${sub.email} is confirmed. The next edition will arrive in your inbox.` };
}

export async function unsubscribeAction(token: string): Promise<ActionState> {
  const sub = await one<{ id: string; email: string }>("SELECT id, email FROM subscribers WHERE token = ?", token);
  if (!sub) return { ok: false, message: "That unsubscribe link is not valid." };
  await run("UPDATE subscribers SET status = 'unsubscribed', unsubscribed_at = datetime('now') WHERE id = ?", sub.id);
  revalidatePath("/admin/subscribers");
  return { ok: true, message: `${sub.email} has been removed from all newsletters. No further email will be sent.` };
}

export async function unsubscribeByTokenAction(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  return unsubscribeAction(String(formData.get("token") ?? ""));
}

export async function updateSubscriptionPreferencesAction(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const token = String(formData.get("token") ?? "");
  const frequency = String(formData.get("frequency") ?? "weekly");
  const topics = formData.getAll("topics").map(String);
  const sub = await one<{ id: string; email: string }>("SELECT id, email FROM subscribers WHERE token = ?", token);
  if (!sub) return { ok: false, message: "We could not find that subscription. Use the link from your latest email." };
  await run("UPDATE subscribers SET frequency = ?, topics = ? WHERE id = ?", frequency, JSON.stringify(topics), sub.id);
  revalidatePath("/account/subscriptions");
  return { ok: true, message: "Preferences saved." };
}

export async function subscribeAccountEmailAction(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Sign in first." };
  const token = String(formData.get("token") ?? "");
  const frequency = String(formData.get("frequency") ?? "weekly");
  const topics = formData.getAll("topics").map(String);
  const sub = await one<{ id: string }>("SELECT id FROM subscribers WHERE token = ?", token);
  if (!sub) return { ok: false, message: "No newsletter subscription is linked to this account." };
  await run("UPDATE subscribers SET frequency = ?, topics = ? WHERE id = ?", frequency, JSON.stringify(topics), sub.id);
  revalidatePath("/account/subscriptions");
  return { ok: true, message: "Newsletter preferences saved." };
}

/* ----------------------------- editorial ----------------------------- */

export async function saveEditionAction(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const user = await requireEditor().catch(() => null);
  if (!user) return { ok: false, message: "Editorial permissions are required." };
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const preheader = String(formData.get("preheader") ?? "").trim();
  const body = String(formData.get("body_html") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  if (!title) return { ok: false, message: "An edition needs a title." };

  if (id) {
    await run("UPDATE newsletter_editions SET title = ?, subject = ?, preheader = ?, body_html = ? WHERE id = ?", title, subject, preheader, body, id);
  } else {
    const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    await run(
      `INSERT INTO newsletter_editions (id, slug, title, subject, preheader, body_html, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'draft', datetime('now'))`,
      `ed-${randomToken(6)}`, finalSlug, title, subject, preheader, body,
    );
  }
  revalidatePath("/admin/newsletters");
  revalidatePath("/newsletter/archive");
  return { ok: true, message: "Edition saved." };
}

export async function sendEditionAction(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const user = await requireEditor().catch(() => null);
  if (!user) return { ok: false, message: "Editorial permissions are required." };
  const editionId = String(formData.get("edition_id") ?? "");
  const segment = String(formData.get("segment") ?? "all");
  const edition = await one<{ id: string; title: string; subject: string | null; body_html: string }>(
    "SELECT id, title, subject, body_html FROM newsletter_editions WHERE id = ?", editionId,
  );
  if (!edition) return { ok: false, message: "That edition could not be found." };

  const rows = await all<{ email: string; token: string; topics: string }>(
    "SELECT email, token, topics FROM subscribers WHERE status = 'confirmed'",
  );
  const recipients = rows.filter((r) => {
    if (segment === "all") return true;
    try {
      return (JSON.parse(r.topics) as string[]).includes(segment);
    } catch {
      return false;
    }
  });

  if (!isEmailConfigured()) {
    await run(
      `INSERT INTO newsletter_campaigns (id, name, edition_id, segment, status, recipients, created_at)
       VALUES (?, ?, ?, ?, 'blocked', ?, datetime('now'))`,
      `cmp-${randomToken(6)}`, `${edition.title} — ${segment}`, edition.id, segment, recipients.length,
    );
    await run("UPDATE newsletter_editions SET status = 'ready' WHERE id = ?", edition.id);
    revalidatePath("/admin/newsletters");
    return {
      ok: false,
      message: `Resend is not configured (RESEND_API_KEY). ${recipients.length} confirmed subscribers were matched and the campaign was recorded as blocked — no email was sent and nothing is reported as delivered.`,
    };
  }

  let delivered = 0;
  const failures: string[] = [];
  for (const r of recipients) {
    const res = await sendEmail({
      to: r.email,
      subject: edition.subject || edition.title,
      html: emailShell(edition.title, edition.body_html),
    });
    if (res.delivered) delivered += 1;
    else if (res.reason) failures.push(res.reason);
  }

  await run(
    `INSERT INTO newsletter_campaigns (id, name, edition_id, segment, status, recipients, sent_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    `cmp-${randomToken(6)}`, `${edition.title} — ${segment}`, edition.id, segment, delivered ? "sent" : "failed", delivered,
  );
  await run(
    "UPDATE newsletter_editions SET status = ?, recipients = ?, sent_at = datetime('now') WHERE id = ?",
    delivered ? "sent" : "failed", delivered, edition.id,
  );
  revalidatePath("/admin/newsletters");
  revalidatePath("/newsletter/archive");
  return {
    ok: delivered > 0,
    message: delivered
      ? `Sent to ${delivered} of ${recipients.length} subscribers.`
      : `Delivery failed for all ${recipients.length} recipients. ${failures[0] ?? ""}`,
  };
}

export async function createCampaignAction(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const user = await requireEditor().catch(() => null);
  if (!user) return { ok: false, message: "Editorial permissions are required." };
  const name = String(formData.get("name") ?? "").trim();
  const segment = String(formData.get("segment") ?? "all");
  if (!name) return { ok: false, message: "Give the campaign a name." };
  await run(
    `INSERT INTO newsletter_campaigns (id, name, segment, status, created_at) VALUES (?, ?, ?, 'draft', datetime('now'))`,
    `cmp-${randomToken(6)}`, name, segment,
  );
  revalidatePath("/admin/newsletters");
  return { ok: true, message: "Campaign created as a draft." };
}

export async function updateSubscriberStatusAction(formData: FormData): Promise<void> {
  const user = await requireEditor().catch(() => null);
  if (!user) return;
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["confirmed", "pending", "unsubscribed"].includes(status)) return;
  await run("UPDATE subscribers SET status = ? WHERE id = ?", status, id);
  revalidatePath("/admin/subscribers");
}

export async function deleteSubscriberAction(formData: FormData): Promise<void> {
  const user = await requireEditor().catch(() => null);
  if (!user) return;
  await run("DELETE FROM subscribers WHERE id = ?", String(formData.get("id") ?? ""));
  revalidatePath("/admin/subscribers");
}
