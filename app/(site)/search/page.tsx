import type { Metadata } from "next";
import Link from "next/link";
import { ArticleCard } from "@/components/article-card";
import { Pagination } from "@/components/pagination";
import { countArticles, listArticles, listCategories, listTags } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Search" };

const PER_PAGE = 10;

type Props = { searchParams: Promise<{ q?: string; category?: string; from?: string; to?: string; page?: string; sort?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const sort = sp.sort === "popular" ? "popular" : "latest";

  const [results, total, categories, tags, popular] = await Promise.all([
    q || sp.category || sp.from || sp.to
      ? listArticles({ q, category: sp.category, from: sp.from, to: sp.to, limit: PER_PAGE, offset: (page - 1) * PER_PAGE, sort })
      : Promise.resolve([]),
    q || sp.category || sp.from || sp.to ? countArticles({ q, category: sp.category, from: sp.from, to: sp.to }) : Promise.resolve(0),
    listCategories(),
    listTags(10),
    listArticles({ limit: 4, sort: "popular" }),
  ]);

  const hasQuery = Boolean(q || sp.category || sp.from || sp.to);

  return (
    <div className="mx-auto max-w-sheet px-5 sm:px-6">
      <header className="border-b border-ink py-8 lg:py-12">
        <p className="kicker">Content discovery</p>
        <h1 className="headline-xl mt-2 text-[2.4rem] sm:text-[3.2rem]">Search the archive</h1>
        <form action="/search" className="mt-6 flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="q">Search</label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Search titles, authors, sections and tags…"
            className="field flex-1 bg-paper font-serif text-lg"
            autoFocus={!q}
          />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="font-sans text-[10px] uppercase tracking-kicker text-ink-soft">Trending:</span>
          {tags.slice(0, 6).map((t) => (
            <Link key={t.id} href={`/search?q=${encodeURIComponent(t.name)}`} className="border border-rule px-2 py-1 font-sans text-[10px] uppercase tracking-kicker text-ink-soft hover:border-ink hover:text-ink">
              {t.name}
            </Link>
          ))}
        </div>
      </header>

      <div className="grid gap-10 py-8 lg:grid-cols-[1fr_250px] lg:gap-12">
        <div>
          <form className="flex flex-wrap items-end gap-3 border-b border-rule pb-4" action="/search">
            <input type="hidden" name="q" value={q} />
            <div>
              <label htmlFor="category" className="label">Section</label>
              <select id="category" name="category" defaultValue={sp.category ?? ""} className="field bg-paper">
                <option value="">Any section</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="from" className="label">From</label>
              <input id="from" type="date" name="from" defaultValue={sp.from ?? ""} className="field bg-paper" />
            </div>
            <div>
              <label htmlFor="to" className="label">To</label>
              <input id="to" type="date" name="to" defaultValue={sp.to ?? ""} className="field bg-paper" />
            </div>
            <div>
              <label htmlFor="sort" className="label">Sort</label>
              <select id="sort" name="sort" defaultValue={sort} className="field bg-paper">
                <option value="latest">Relevance / newest</option>
                <option value="popular">Most read</option>
              </select>
            </div>
            <button type="submit" className="btn btn-ghost">Refine</button>
          </form>

          {hasQuery ? (
            <>
              <p className="mt-5 font-sans text-[10px] uppercase tracking-kicker text-ink-soft">
                {total} result{total === 1 ? "" : "s"}
                {q && <> for “{q}”</>}
                {sp.category && <> in {categories.find((c) => c.slug === sp.category)?.name}</>}
              </p>
              {results.length === 0 ? (
                <div className="py-14">
                  <p className="font-display text-2xl">Nothing found.</p>
                  <p className="mt-2 font-serif text-ink-soft">
                    Try a broader phrase, or browse a section below.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {categories.map((c) => (
                      <Link key={c.slug} href={`/category/${c.slug}`} className="border border-rule px-3 py-1.5 font-sans text-[10px] uppercase tracking-kicker hover:border-ink">
                        {c.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <ul className="mt-4 divide-y divide-rule">
                  {results.map((a) => (
                    <li key={a.id} className="py-6">
                      <ArticleCard article={a} variant="wide" />
                    </li>
                  ))}
                </ul>
              )}
              <Pagination page={page} total={total} perPage={PER_PAGE} basePath="/search" params={{ q, category: sp.category, from: sp.from, to: sp.to, sort: sort === "latest" ? undefined : sort }} />
            </>
          ) : (
            <div className="py-10">
              <p className="font-display text-2xl">Start with a word.</p>
              <p className="mt-2 max-w-lg font-serif text-[15px] leading-relaxed text-ink-soft">
                Search covers every published article, its author, section and tags. You can also browse the archive by
                section, or start from the most-read stories alongside.
              </p>
              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                {popular.map((a) => (
                  <ArticleCard key={a.id} article={a} showDek={false} />
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="lg:border-l lg:border-rule lg:pl-8">
          <p className="kicker-muted mb-3">Most read</p>
          <ol className="divide-y divide-rule border-y border-rule">
            {popular.map((a, i) => (
              <li key={a.id} className="flex gap-3 py-3">
                <span className="font-display text-xl text-ink-soft/50">{i + 1}</span>
                <Link href={`/article/${a.slug}`} className="font-display text-[14px] font-semibold leading-snug hover:text-accent">
                  {a.title}
                </Link>
              </li>
            ))}
          </ol>
          <p className="kicker-muted mb-3 mt-6">Sections</p>
          <ul className="space-y-2 font-sans text-[12px]">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/category/${c.slug}`} className="text-ink-soft hover:text-accent">{c.name}</Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
