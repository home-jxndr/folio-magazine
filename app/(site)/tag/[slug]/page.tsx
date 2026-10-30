import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/article-card";
import { countArticles, getTag, listArticles, listTags } from "@/lib/queries";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTag(slug);
  return tag ? { title: `Tagged “${tag.name}”` } : { title: "Tag not found" };
}

export default async function TagPage({ params }: Props) {
  const { slug } = await params;
  const tag = await getTag(slug);
  if (!tag) notFound();

  const [articles, total, tags] = await Promise.all([
    listArticles({ tag: slug, limit: 18 }),
    countArticles({ tag: slug }),
    listTags(24),
  ]);

  return (
    <div className="mx-auto max-w-sheet px-5 sm:px-6">
      <header className="border-b border-ink py-10">
        <p className="kicker">Tag</p>
        <h1 className="headline-xl mt-2 text-[2.6rem] sm:text-3xl sm:text-[3.4rem]">{tag.name}</h1>
        <p className="mt-2 font-sans text-[10px] uppercase tracking-kicker text-ink-soft">{total} stories filed under this tag</p>
      </header>

      <div className="grid gap-10 py-8 lg:grid-cols-[1fr_240px]">
        <div>
          {articles.length === 0 ? (
            <p className="py-12 font-serif text-lg text-ink-soft">No published stories carry this tag yet.</p>
          ) : (
            <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((a) => (
                <ArticleCard key={a.id} article={a} showDek={false} />
              ))}
            </div>
          )}
        </div>
        <aside className="lg:border-l lg:border-rule lg:pl-8">
          <p className="kicker-muted mb-3">All tags</p>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <Link
                key={t.id}
                href={`/tag/${t.slug}`}
                className={`border px-2 py-1 font-sans text-[10px] uppercase tracking-kicker transition-colors ${
                  t.slug === slug ? "border-ink bg-ink text-paper" : "border-rule text-ink-soft hover:border-ink hover:text-ink"
                }`}
              >
                {t.name} <span className="opacity-50">{t.n}</span>
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
