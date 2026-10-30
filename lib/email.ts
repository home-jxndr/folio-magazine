export type SendResult = { delivered: boolean; reason?: string };

/**
 * Sends transactional mail through Resend when RESEND_API_KEY is configured.
 * When it is not, nothing is pretended: callers must surface the reason.
 */
export async function sendEmail(input: { to: string; subject: string; html: string }): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { delivered: false, reason: "RESEND_API_KEY is not configured" };
  const from = process.env.NEWSLETTER_FROM_EMAIL || "FOLIO <dispatch@folio.press>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [input.to], subject: input.subject, html: input.html }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { delivered: false, reason: `Resend responded ${res.status}${detail ? `: ${detail.slice(0, 160)}` : ""}` };
    }
    return { delivered: true };
  } catch (error) {
    return { delivered: false, reason: error instanceof Error ? error.message : "Email request failed" };
  }
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export function emailShell(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f7f3ea;color:#14110f;font-family:Georgia,serif">
    <div style="max-width:600px;margin:0 auto;padding:40px 24px">
      <div style="font-family:Georgia,serif;font-size:28px;letter-spacing:.24em;text-transform:uppercase;text-align:center;padding-bottom:24px;border-bottom:1px solid #d9d1c1">FOLIO</div>
      <h1 style="font-family:Georgia,serif;font-size:26px;line-height:1.2;margin:28px 0 16px">${title}</h1>
      <div style="font-size:16px;line-height:1.7;color:#33302c">${bodyHtml}</div>
      <p style="margin-top:32px;font-size:11px;color:#6b655e;border-top:1px solid #d9d1c1;padding-top:16px">
        FOLIO · Rua da Boavista 84, Lisbon · You are receiving this because you subscribed at folio.press.
      </p>
    </div></body></html>`;
}
