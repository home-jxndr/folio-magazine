import Link from "next/link";
import { ArticleCard, LeadStory } from "@/components/article-card";
import { Ticker } from "@/components/ticker";
import { NewsletterForm } from "@/components/newsletter-form";
import { AdSlot } from "@/components/ad-slot";
import {
  getCollections,
  listArticles,
  listAuthors,
  listCategories,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featuredList, picks, latest, mostRead, collections, tech, culture, breaking, authors, categories] =
    await Promise.all([
      listArticles({ featured: true, limit: 1 }),
      listArticles({ pick: true, limit: 3 }),
      listArticles({ limit: 6 }),
      listArticles({ limit: 5, sort: "popular" }),
      getCollections(),
      listArticles({ category: "technology", limit: 3 }),
      listArticles({ category: "culture", limit: 4 }),
      listArticles({ breaking: true, limit: 5 }),
      listAuthors(),
      listCategories(),
    ]);

  const featured = featuredList[0];
  const briefing = latest.filter((a) => a.id !== featured?.id).slice(0, 3);
  const tickerItems = (breaking.length ? breaking : latest.slice(0, 5)).map((a) => ({ title: a.title, slug: a.slug }));

  if (!featured) {
    return (
      <div className="mx-auto max-w-reading px-6 py-24 text-center">
        <p className="kicker">The desk</p>
        <h1 className="headline mt-4 text-4xl">Nothing has been published yet.</h1>
        <p className="dek mt-4">Sign in to the editorial desk to create the first story.</p>
        <Link href="/admin" className="btn btn-primary mt-8">Open the editorial desk</Link>
      </div>
    );
  }

  return (
    <>
      <Ticker items={tickerItems} />

      <div className="mx-auto max-w-sheet px-5 sm:px-6">
        {/* ------------------------------- Lead ------------------------------- */}
        <section className="grid gap-10 border-b border-rule py-8 lg:grid-cols-[1.65fr_1fr] lg:gap-12 lg:py-12">
          <LeadStory article={featured} />

          <aside className="border-t border-rule pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <div className="flex items-center justify-between">
              <h2 className="font-sans text-[10px] font-semibold uppercase tracking-kicker text-accent">The Briefing</h2>
              <span className="font-sans text-[10px] uppercase tracking-kicker text-ink-soft">Three things to know</span>
            </div>
            <div className="mt-2 divide-y divide-rule">
              {briefing.map((a, i) => (
                <ArticleCard key={a.id} article={a} variant="numbered" index={i + 1} showDek={i === 0} />
              ))}
            </div>

            <div className="mt-6 border-t border-ink pt-5">
              <p className="kicker">From the editor</p>
              <p className="mt-2 font-serif text-[15px] leading-relaxed text-ink-soft">
                “We publish fewer stories than our competitors, and we take longer over them. Reader funding is what
                makes that possible.”
              </p>
              <p className="mt-2 font-sans text-[10px] uppercase tracking-kicker text-ink-soft">Marguerite Oyelaran</p>
            </div>

            <AdSlot placement="sidebar" className="mt-6" />
          </aside>
        </section>

        {/* --------------------------- Editor's picks ------------------------ */}
        <section className="border-b border-rule py-10 lg:py-14">
          <SectionHead
            kicker="Chosen by the desk"
            title="Editor’s Picks"
            href="/latest?sort=picks"
            linkLabel="All picks"
          />
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
            {picks.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </section>

        {/* ---------------------------- Latest + rail ------------------------ */}
        <section className="grid gap-10 py-10 lg:grid-cols-[1fr_320px] lg:gap-14 lg:py-14">
          <div>
            <SectionHead kicker="Every day" title="Latest Stories" href="/latest" linkLabel="All stories" />
            <div className="mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2">
              {latest.map((a, i) => (
                <ArticleCard key={a.id} article={a} showDek={i % 3 !== 2} />
              ))}
            </div>
            <Link
              href="/latest"
              className="mt-10 inline-flex w-full items-center justify-center border border-ink py-3 font-sans text-[10px] font-semibold uppercase tracking-kicker transition-colors hover:bg-ink hover:text-paper"
            >
              Read the full archive
            </Link>
          </div>

          <aside className="lg:border-l lg:border-rule lg:pl-8">
            <h2 className="font-sans text-[10px] font-semibold uppercase tracking-kicker text-accent">Most read this week</h2>
            <ol className="mt-3 divide-y divide-rule">
              {mostRead.map((a, i) => (
                <li key={a.id} className="group flex gap-4 py-4">
                  <span className="font-display text-3xl leading-none text-ink-soft/40">{i + 1}</span>
                  <div>
                    <h3 className="font-display text-[16px] font-semibold leading-snug">
                      <Link href={`/article/${a.slug}`} className="link-underline">{a.title}</Link>
                    </h3>
                    <p className="mt-1 font-sans text-[10px] uppercase tracking-kicker text-ink-soft">
                      {a.category_name} · {new Intl.NumberFormat("en").format(a.views)} reads
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-8 border border-ink bg-ink p-5 text-paper">
              <p className="font-sans text-[9.5px] uppercase tracking-kicker text-paper/60">Newsletter</p>
              <p className="mt-2 font-display text-xl leading-tight">The Sunday Edition</p>
              <p className="mt-2 font-serif text-[14px] leading-relaxed text-paper/70">
                One long read and three short ones, every Sunday morning. Free, and easy to leave.
              </p>
              <div className="mt-4">
                <NewsletterForm variant="band" source="homepage" label="Join free" />
              </div>
            </div>

            <AdSlot placement="inline" className="mt-8" />
          </aside>
        </section>
      </div>

      {/* ---------------------------- Collections --------------------------- */}
      <section className="border-y border-rule bg-ink py-12 text-paper lg:py-16">
        <div className="mx-auto max-w-sheet px-5 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-sans text-[10px] font-semibold uppercase tracking-kicker" style={{ color: "#e2596a" }}>
                Editorial collections
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-paper sm:text-4xl">
                Read by theme, not by date
              </h2>
            </div>
            <p className="max-w-sm font-serif text-sm leading-relaxed text-paper/60">
              The desk groups reporting and criticism into standing collections. Start anywhere.
            </p>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {collections.slice(0, 3).map((c) => (
              <Link
                key={c.collection}
                href={`/collections/${encodeURIComponent(c.collection)}`}
                className="group relative block overflow-hidden border border-paper/20"
              >
                {c.cover && (
                  <img
                    src={c.cover}
                    alt=""
                    className="aspect-[16/10] w-full object-cover opacity-70 transition-all duration-700 group-hover:scale-[1.03] group-hover:opacity-90"
                    loading="lazy"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="font-sans text-[9.5px] uppercase tracking-kicker text-paper/70">{c.n} stories</p>
                  <h3 className="mt-1 font-display text-xl font-semibold text-white">{c.collection}</h3>
                  <span className="mt-2 inline-block font-sans text-[10px] uppercase tracking-kicker text-white/80 underline">
                    Enter collection
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------- Section: Technology --------------------- */}
      <div className="mx-auto max-w-sheet px-5 sm:px-6">
        <section className="grid gap-10 border-b border-rule py-10 lg:grid-cols-[1fr_260px] lg:gap-12 lg:py-14">
          <div>
            <SectionHead kicker="Section" title="Technology" href="/category/technology" linkLabel="More technology" />
            <div className="mt-8 grid gap-8 sm:grid-cols-[1.2fr_1fr]">
              {tech[0] && <ArticleCard article={tech[0]} className="sm:border-r sm:border-rule sm:pr-8" />}
              <div className="divide-y divide-rule">
                {tech.slice(1).map((a) => (
                  <ArticleCard key={a.id} article={a} variant="compact" />
                ))}
                {culture[0] && (
                  <div className="pt-5">
                    <p className="kicker-muted mb-2">Also in this issue</p>
                    <ArticleCard article={culture[0]} variant="minimal" />
                  </div>
                )}
              </div>
            </div>
          </div>
          <aside className="lg:border-l lg:border-rule lg:pl-8">
            <p className="kicker">Opinion</p>
            <p className="mt-3 font-serif text-[15px] leading-relaxed text-ink-soft">
              Signed arguments from columnists and contributors, edited but never softened.
            </p>
            <div className="mt-4 divide-y divide-rule border-t border-rule">
              {(await listArticles({ category: "opinion", limit: 3 })).map((a) => (
                <ArticleCard key={a.id} article={a} variant="compact" showDek={false} />
              ))}
            </div>
            <Link href="/category/opinion" className="mt-3 inline-block font-sans text-[10px] uppercase tracking-kicker text-accent">
              All opinion →
            </Link>
          </aside>
        </section>

        {/* ------------------------------ Culture --------------------------- */}
        <section className="border-b border-rule py-10 lg:py-14">
          <SectionHead kicker="Section" title="Culture" href="/category/culture" linkLabel="More culture" />
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {culture.map((a) => (
              <ArticleCard key={a.id} article={a} showDek={false} />
            ))}
          </div>
        </section>
      </div>

      {/* ----------------------------- Newsletter -------------------------- */}
      <section className="bg-paper-2 py-14 lg:py-20">
        <div className="mx-auto grid max-w-sheet gap-10 px-5 sm:px-6 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <p className="kicker">The newsletters</p>
            <h2 className="headline-xl mt-3 text-[2.4rem] sm:text-[3.2rem]">
              The week, edited to a point.
            </h2>
            <p className="dek mt-4 max-w-lg text-[1.05rem]">
              Join 41,000 readers who get one considered despatch instead of forty alerts. Daily, weekly or monthly —
              your choice. Unsubscribe in one click, and we keep no data we do not need.
            </p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-sans text-[10px] uppercase tracking-kicker text-ink-soft">
              <span>No advertising in the newsletter</span>
              <span aria-hidden>·</span>
              <span>GDPR compliant</span>
              <Link href="/newsletter/archive" className="text-accent underline">Read past editions</Link>
            </div>
          </div>
          <div className="border border-rule bg-paper p-6 sm:p-8">
            <p className="kicker-muted">Choose your frequency</p>
            <div className="mt-4">
              <NewsletterForm variant="inline" source="homepage-band" label="Subscribe" showPreferences />
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------- Contributors ------------------------ */}
      <div className="mx-auto max-w-sheet px-5 sm:px-6">
        <section className="py-12 lg:py-16">
          <SectionHead kicker="The masthead" title="Contributors" href="/authors" linkLabel="All contributors" />
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {authors.slice(0, 4).map((a) => (
              <Link key={a.id} href={`/author/${a.slug}`} className="group flex items-start gap-4">
                {a.avatar_url && (
                  <img
                    src={a.avatar_url}
                    alt={a.name}
                    className="h-16 w-16 shrink-0 object-cover grayscale transition-all duration-500 group-hover:grayscale-0"
                    loading="lazy"
                  />
                )}
                <div>
                  <h3 className="font-display text-[17px] font-semibold leading-tight group-hover:text-accent">{a.name}</h3>
                  <p className="mt-0.5 font-sans text-[10px] uppercase tracking-kicker text-ink-soft">{a.title}</p>
                  <p className="mt-2 line-clamp-2 font-serif text-[13px] leading-snug text-ink-soft">{a.bio}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* --------------------------- Browse sections --------------------- */}
        <section className="border-t border-rule py-10">
          <p className="kicker-muted mb-4">Browse by section</p>
          <div className="flex flex-wrap gap-x-3 gap-y-2">
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/category/${c.slug}`}
                className="border border-rule px-3 py-1.5 font-sans text-[10.5px] uppercase tracking-kicker text-ink-soft transition-colors hover:border-ink hover:text-ink"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function SectionHead({ kicker, title, href, linkLabel }: { kicker: string; title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-ink pb-3">
      <div>
        <p className="kicker">{kicker}</p>
        <h2 className="mt-1.5 font-display text-[1.9rem] font-semibold leading-none tracking-tight sm:text-[2.2rem]">{title}</h2>
      </div>
      {href && linkLabel && (
        <Link href={href} className="link-underline font-sans text-[10px] uppercase tracking-kicker text-ink-soft hover:text-accent">
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}
