import { NextResponse } from "next/server";
import { listArticles } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const results = await listArticles({ q, limit: 6 });
  return NextResponse.json({
    results: results.map((a) => ({
      title: a.title,
      slug: a.slug,
      category: a.category_name,
      author: a.author_name,
    })),
  });
}
