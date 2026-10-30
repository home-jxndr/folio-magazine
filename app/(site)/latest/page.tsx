import type { Metadata } from "next";
import Link from "next/link";
import { ArticleCard } from "@/components/article-card";
import { Pagination } from "@/components/pagination";
import { NewsletterForm } from "@/components/newsletter-form";
import { countArticles, listArticles, listCategories } from "@/lib/queries";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Latest stories" };

const PER_PAGE = 12;

type Props = {
  searchParams: Promise<{ page?: string; sort?: string; section?: string; from?: string; to?: string; q?: string }>;
};

export default async function LatestPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const sort = sp.sort === "popular" ? "popular" : sp.sort === "oldest" ? "oldest" : "latest";
  const [articles, total, categories] = await Promise.all([
    listArticles({ limit: PER_PAGE, offset: (page - 1) * PER_PAGE, sort, category: sp.section, from: sp.from, to: sp.to, q: sp.q }),
    countArticles({ category: sp.section, from: sp.from, to: sp.to, q: sp.q }),
    listCategories(),
  ]);

  const [lead, ...rest] = articles;

  return (
    <div className="mx-auto max-w-sheet px-5 sm:px-6">
      <header className="border-b border-ink py-8 lg:py-12">
        <p className="kicker">The archive</p>
        <h1 className="headline-xl mt-2 text-[2.6rem] sm:text-[3.6rem]">Latest stories</h1>
        <p className="dek mt-3 max-w-2xl">
          Every piece we have published, newest first. Filter by section or date, or search the full archive.
        </p>
      </header>

      <div className="grid gap-10 py-8 lg:grid-cols-[1fr_260px] lg:gap-12">
        <div>
          <form className="flex flex-wrap items-end gap-3 border-b border-rule pb-4" action="/latest">
            <div className="min-w-[150px] flex-1">
              <label htmlFor="section" className="label">Section</label>
              <select id="section" name="section" defaultValue={sp.section ?? ""} className="field bg-paper">
                <option value="">All sections</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="from" className="label">Published after</label>
              <input id="from" type="date" name="from" defaultValue={sp.from ?? ""} className="field bg-paper" />
            </div>
            <div>
              <label htmlFor="to" className="label">Before</label>
              <input id="to" type="date" name="to" defaultValue={sp.to ?? ""} className="field bg-paper" />
            </div>
            <div>
              <label htmlFor="sort" className="label">Order</label>
              <select id="sort" name="sort" defaultValue={sort} className="field bg-paper">
                <option value="latest">Newest first</option>
                <option value="popular">Most read</option>
                <option value="oldest">Oldest first</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary">Apply</button>
            {(sp.section || sp.from || sp.to || sp.sort) && (
              <Link href="/latest" className="btn btn-ghost">Reset</Link>
            )}
          </form>

          {articles.length === 0 ? (
            <p className="py-16 text-center font-serif text-lg text-ink-soft">
              Nothing matches those filters. <Link href="/latest" className="underline">Clear the filters</Link> and try again.
            </p>
          ) : (
            <>
              {lead && (
                <div className="border-b border-rule py-8">
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

          <Pagination
            page={page}
            total={total}
            perPage={PER_PAGE}
            basePath="/latest"
            params={{ sort: sort === "latest" ? undefined : sort, section: sp.section, from: sp.from, to: sp.to }}
          />
        </div>

        <aside className="lg:border-l lg:border-rule lg:pl-8">
          <div className="border border-ink bg-ink p-5 text-paper">
            <p className="font-sans text-[9.5px] uppercase tracking-kicker text-paper/60">Newsletter</p>
            <p className="mt-2 font-display text-xl leading-tight">The Sunday Edition</p>
            <p className="mt-2 font-serif text-[13.5px] leading-relaxed text-paper/70">
              One long read, three short ones, every Sunday. Free.
            </p>
            <div className="mt-4">
              <NewsletterForm variant="band" source="latest" label="Join" />
            </div>
          </div>
          <div className="mt-6">
            <p className="kicker-muted mb-3">Read by section</p>
            <ul className="divide-y divide-rule border-y border-rule">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link href={`/category/${c.slug}`} className="flex items-center justify-between py-2.5 font-sans text-[12px] hover:text-accent">
                    {c.name}
                    <span className="text-ink-soft" aria-hidden>→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-6 font-sans text-[10px] uppercase tracking-kicker text-ink-soft">
            Archive updated {formatDate(new Date().toISOString())}
          </p>
        </aside>
      </div>
    </div>
  );
}
