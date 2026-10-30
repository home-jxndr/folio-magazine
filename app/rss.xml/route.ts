import { listArticles } from "@/lib/queries";
import { SITE } from "@/lib/utils";

export const dynamic = "force-dynamic";

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export async function GET() {
  const articles = await listArticles({ limit: 40 });
  const items = articles
    .map((a) => {
      const url = `${SITE.url}/article/${a.slug}`;
      return `    <item>\n      <title>${escapeXml(a.title)}</title>\n      <link>${url}</link>\n      <guid isPermaLink="true">${url}</guid>\n      <description>${escapeXml(a.dek ?? a.excerpt ?? "")}</description>\n      <author>${escapeXml(a.author_name ?? "FOLIO")}</author>\n      <category>${escapeXml(a.category_name ?? "")}</category>\n      <pubDate>${new Date((a.published_at ?? a.created_at).replace(" ", "T") + "Z").toUTCString()}</pubDate>\n    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n  <channel>\n    <title>${SITE.name} — ${SITE.tagline}</title>\n    <link>${SITE.url}</link>\n    <description>${escapeXml(SITE.description)}</description>\n    <language>en</language>\n    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n    <atom:link href="${SITE.url}/rss.xml" rel="self" type="application/rss+xml" />\n${items}\n  </channel>\n</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=900",
    },
  });
}
