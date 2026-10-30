import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { one, run } from "@/lib/db";
import { randomToken } from "@/lib/password";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { articleId?: string; slug?: string };
    if (!body.articleId) return NextResponse.json({ ok: false }, { status: 400 });

    const article = await one<{ id: string; category_id: string | null }>(
      "SELECT id, category_id FROM articles WHERE id = ?", body.articleId,
    );
    if (!article) return NextResponse.json({ ok: false }, { status: 404 });

    const store = await cookies();
    let sessionId = store.get("folio_session_id")?.value;
    if (!sessionId) {
      sessionId = randomToken(6);
      store.set("folio_session_id", sessionId, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 180,
        secure: process.env.NODE_ENV === "production",
      });
    }

    const referrer = request.headers.get("referer") ?? "";
    const source = /newsletter|email/i.test(referrer)
      ? "newsletter"
      : /google|bing|duckduckgo/i.test(referrer)
        ? "search"
        : /twitter|x\.com|linkedin|instagram|facebook/i.test(referrer)
          ? "social"
          : referrer
            ? "referral"
            : "direct";

    await run(
      `INSERT INTO analytics_events (id, article_id, category_id, path, referrer, source, session_id, kind, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'view', datetime('now'))`,
      `evt-${randomToken(8)}`, article.id, article.category_id, `/article/${body.slug ?? ""}`, referrer.slice(0, 300), source, sessionId,
    );
    await run("UPDATE articles SET views = views + 1 WHERE id = ?", article.id);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
