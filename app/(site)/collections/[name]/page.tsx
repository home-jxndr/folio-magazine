import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/article-card";
import { getCollections, listArticles } from "@/lib/queries";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ name: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params;
  return { title: decodeURIComponent(name) };
}

export default async function CollectionPage({ params }: Props) {
  const { name } = await params;
  const collection = decodeURIComponent(name);
  const [articles, collections] = await Promise.all([
    listArticles({ collection, limit: 24 }),
    getCollections(),
  ]);
  if (!articles.length) notFound();

  const [lead, ...rest] = articles;

  return (
    <div>
      <header className="border-b border-rule bg-ink py-12 text-paper lg:py-16">
        <div className="mx-auto max-w-sheet px-5 sm:px-6">
          <p className="font-sans text-[10px] uppercase tracking-kicker" style={{ color: "#e2596a" }}>
            Editorial collection
          </p>
          <h1 className="mt-2 font-display text-[2.6rem] font-semibold tracking-tight sm:text-[3.6rem]">{collection}</h1>
          <p className="mt-3 max-w-xl font-serif text-[15px] leading-relaxed text-paper/70">
            {articles.length} pieces grouped by the desk. Read in any order; the collection is the argument.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-sheet px-5 sm:px-6">
        <div className="grid gap-10 py-8 lg:grid-cols-[1fr_230px] lg:gap-12">
          <div>
            <div className="border-b border-rule pb-8">
              <ArticleCard article={lead} variant="wide" priority />
            </div>
            <div className="grid gap-x-8 gap-y-10 py-8 sm:grid-cols-2">
              {rest.map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          </div>
          <aside className="lg:border-l lg:border-rule lg:pl-8">
            <p className="kicker-muted mb-3">Other collections</p>
            <ul className="divide-y divide-rule border-y border-rule">
              {collections.map((c) => (
                <li key={c.collection}>
                  <Link
                    href={`/collections/${encodeURIComponent(c.collection)}`}
                    className={`flex items-center justify-between py-2.5 font-sans text-[12px] hover:text-accent ${c.collection === collection ? "text-accent" : ""}`}
                  >
                    {c.collection}
                    <span className="text-ink-soft">{c.n}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/latest" className="mt-5 inline-block font-sans text-[10px] uppercase tracking-kicker text-accent">
              All stories →
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
