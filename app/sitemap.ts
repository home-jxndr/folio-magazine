import type { MetadataRoute } from "next";
import { listArticles, listAuthors, listCategories, listTags } from "@/lib/queries";
import { SITE } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, categories, tags, authors] = await Promise.all([
    listArticles({ limit: 500 }),
    listCategories(),
    listTags(200),
    listAuthors(),
  ]);

  const staticPaths = [
    "",
    "/latest",
    "/about",
    "/contact",
    "/membership",
    "/newsletter",
    "/newsletter/archive",
    "/authors",
    "/privacy",
    "/terms",
    "/search",
  ];

  return [
    ...staticPaths.map((p) => ({
      url: `${SITE.url}${p}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: p === "" ? 1 : 0.7,
    })),
    ...categories.map((c) => ({
      url: `${SITE.url}/category/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...articles.map((a) => ({
      url: `${SITE.url}/article/${a.slug}`,
      lastModified: new Date((a.updated_at ?? a.created_at).replace(" ", "T") + "Z"),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...tags.map((t) => ({
      url: `${SITE.url}/tag/${t.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
    ...authors.map((a) => ({
      url: `${SITE.url}/author/${a.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}
