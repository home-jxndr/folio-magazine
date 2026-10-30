import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/article-card";
import { Pagination } from "@/components/pagination";
import { NewsletterForm } from "@/components/newsletter-form";
import { AdSlot } from "@/components/ad-slot";
import { countArticles, getCategory, listArticles, listCategories } from "@/lib/queries";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string; sort?: string }> };
const PER_PAGE = 9;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: "Section not found" };
  return {
    title: category.name,
    description: category.description ?? `Stories from the ${category.name} desk.`,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const sort = sp.sort === "popular" ? "popular" : sp.sort === "oldest" ? "oldest" : "latest";

  const category = await getCategory(slug);
  if (!category) notFound();

  const [articles, total, categories] = await Promise.all([
    listArticles({ category: slug, limit: PER_PAGE, offset: (page - 1) * PER_PAGE, sort }),
    countArticles({ category: slug }),
    listCategories(),
  ]);

  const [lead, ...rest] = articles;

  return (
    <div>
      <header className="border-b border-rule">
        <div className="mx-auto max-w-sheet px-5 py-10 sm:px-6 lg:py-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="kicker">Section</p>
              <h1 className="headline-xl mt-2 text-[3rem] sm:text-[4.2rem]" style={{ color: category.accent ?? undefined }}>
                {category.name}
              </h1>
              {category.description && <p className="dek mt-3 max-w-2xl text-[1.05rem]">{category.description}</p>}
            </div>
            <p className="font-sans text-[10px] uppercase tracking-kicker text-ink-soft">{total} stories</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-sheet px-5 sm:px-6">
        <div className="grid gap-10 py-8 lg:grid-cols-[1fr_260px] lg:gap-12">
          <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-rule pb-3">
              <div className="flex gap-4 font-sans text-[10px] uppercase tracking-kicker">
                {[
                  { v: "latest", l: "Newest" },
                  { v: "popular", l: "Most read" },
                  { v: "oldest", l: "Oldest" },
                ].map((o) => (
                  <Link
                    key={o.v}
                    href={`/category/${slug}?sort=${o.v}`}
                    className={sort === o.v ? "border-b border-accent pb-1 text-accent" : "text-ink-soft hover:text-ink"}
                  >
                    {o.l}
                  </Link>
                ))}
              </div>
              <Link href={`/search?category=${slug}`} className="font-sans text-[10px] uppercase tracking-kicker text-ink-soft hover:text-accent">
                Search this section →
              </Link>
            </div>

            {articles.length === 0 ? (
              <p className="py-16 font-serif text-lg text-ink-soft">
                This desk has not published yet. <Link href="/latest" className="underline">Browse the whole archive</Link>.
              </p>
            ) : (
              <>
                {lead && (
                  <div className="border-b border-rule pb-8">
                    <ArticleCard article={lead} variant="wide" priority />
                  </div>
                )}
                <div className="grid gap-x-8 gap-y-10 py-8 sm:grid-cols-2">
                  {rest.map((a) => (
                    <ArticleCard key={a.id} article={a} />
                  ))}
                </div>
              </>
            )}

            <Pagination page={page} total={total} perPage={PER_PAGE} basePath={`/category/${slug}`} params={{ sort: sort === "latest" ? undefined : sort }} />
          </div>

          <aside className="lg:border-l lg:border-rule lg:pl-8">
            <AdSlot placement="sidebar" />
            <div className="mt-6">
              <p className="kicker-muted mb-3">Other sections</p>
              <ul className="divide-y divide-rule border-y border-rule">
                {categories.filter((c) => c.slug !== slug).map((c) => (
                  <li key={c.slug}>
                    <Link href={`/category/${c.slug}`} className="flex items-center justify-between py-2.5 font-sans text-[12px] hover:text-accent">
                      {c.name}
                      <span className="text-ink-soft" aria-hidden>→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-6 border border-rule p-4">
              <p className="font-sans text-[9.5px] uppercase tracking-kicker text-accent">Newsletter</p>
              <p className="mt-1 font-display text-lg leading-tight">The Sunday Edition</p>
              <div className="mt-3">
                <NewsletterForm variant="inline" source={`category:${slug}`} label="Join" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
