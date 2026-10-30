import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/article-card";
import { AdSlot } from "@/components/ad-slot";
import { CommentsSection } from "@/components/comments-section";
import { NewsletterForm } from "@/components/newsletter-form";
import { ArticleActions, ReadingProgress, ViewTracker } from "@/components/reading-tools";
import { canManageContent, getCurrentUser, isStaff } from "@/lib/auth";
import {
  getAdjacent,
  getArticleBySlug,
  getArticleTags,
  getComments,
  getRelated,
  isBookmarked,
} from "@/lib/queries";
import { formatDate, SITE } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Story not found" };
  const title = article.seo_title || article.title;
  const description = article.seo_description || article.dek || undefined;
  return {
    title,
    description,
    alternates: { canonical: article.canonical_url || `${SITE.url}/article/${article.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `${SITE.url}/article/${article.slug}`,
      images: article.cover_url ? [{ url: article.cover_url }] : undefined,
      publishedTime: article.published_at ?? undefined,
      modifiedTime: article.updated_at,
      authors: article.author_name ? [article.author_name] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: article.cover_url ? [article.cover_url] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const user = await getCurrentUser();
  const canPreview = !!user && (canManageContent(user.role) || (user.role === "author" && article.author_id === user.id));
  if (article.status !== "published" && !canPreview) notFound();

  const [tags, related, adjacent, comments, saved] = await Promise.all([
    getArticleTags(article.id),
    getRelated(article, 3),
    getAdjacent(article),
    getComments(article.id),
    user ? isBookmarked(user.id, article.id) : Promise.resolve(false),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.dek,
    image: article.cover_url ? [article.cover_url] : undefined,
    datePublished: article.published_at,
    dateModified: article.updated_at,
    author: article.author_name ? [{ "@type": "Person", name: article.author_name, url: `${SITE.url}/author/${article.author_slug}` }] : undefined,
    publisher: { "@type": "Organization", name: SITE.name },
    mainEntityOfPage: `${SITE.url}/article/${article.slug}`,
  };

  return (
    <>
      <ReadingProgress />
      <ViewTracker articleId={article.id} slug={article.slug} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {article.status !== "published" && (
        <div className="border-b border-accent bg-accent/10 px-5 py-2 text-center font-sans text-[10px] uppercase tracking-kicker text-accent">
          Preview · this article is {article.status} and is not publicly visible
        </div>
      )}

      <div className="mx-auto max-w-sheet px-5 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 border-b border-rule py-3 font-sans text-[10px] uppercase tracking-kicker text-ink-soft">
          <Link href="/" className="hover:text-accent">FOLIO</Link>
          <span aria-hidden>/</span>
          {article.category_slug && (
            <Link href={`/category/${article.category_slug}`} className="hover:text-accent">{article.category_name}</Link>
          )}
          <span aria-hidden>/</span>
          <span className="truncate text-ink">{article.title}</span>
        </nav>

        <article className="pt-8 lg:pt-12">
          <header className="mx-auto max-w-4xl text-center">
            <Link href={`/category/${article.category_slug}`} className="kicker">
              <span className="inline-block h-[5px] w-[5px] bg-accent" aria-hidden />
              {article.category_name}
            </Link>
            <h1 className="headline-xl mx-auto mt-4 max-w-3xl text-[2.3rem] sm:text-[3.2rem] lg:text-[3.8rem]">{article.title}</h1>
            {article.dek && <p className="dek mx-auto mt-5 max-w-2xl text-[1.1rem] sm:text-[1.25rem]">{article.dek}</p>}

            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 font-sans text-[10px] uppercase tracking-kicker text-ink-soft">
              {article.author_slug && (
                <Link href={`/author/${article.author_slug}`} className="flex items-center gap-2 text-ink hover:text-accent">
                  {article.author_avatar && (
                    <img src={article.author_avatar} alt="" className="h-6 w-6 rounded-full object-cover" />
                  )}
                  {article.author_name}
                </Link>
              )}
              <span aria-hidden>·</span>
              <time dateTime={article.published_at ?? undefined}>{formatDate(article.published_at)}</time>
              <span aria-hidden>·</span>
              <span>{article.reading_minutes} min read</span>
              {article.updated_at && article.published_at && article.updated_at.slice(0, 10) !== article.published_at.slice(0, 10) && (
                <>
                  <span aria-hidden>·</span>
                  <span>Updated {formatDate(article.updated_at)}</span>
                </>
              )}
            </div>
          </header>

          {article.cover_url && (
            <figure className="mx-auto mt-8 max-w-5xl">
              <img
                src={article.cover_url}
                alt={article.cover_alt ?? article.title}
                className="aspect-[16/9] w-full object-cover"
                fetchPriority="high"
              />
              {article.cover_caption && (
                <figcaption className="mt-2 flex flex-wrap items-baseline justify-between gap-2 border-t border-rule pt-2 font-sans text-[10.5px] leading-relaxed text-ink-soft">
                  <span>{article.cover_caption}</span>
                  <span className="uppercase tracking-kicker">FOLIO</span>
                </figcaption>
              )}
            </figure>
          )}

          <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_270px] lg:gap-14">
            <div className="min-w-0">
              <div className="mx-auto max-w-reading">
                <ArticleActions
                  articleId={article.id}
                  title={article.title}
                  slug={article.slug}
                  initialSaved={saved}
                  signedIn={!!user}
                />
              </div>

              <div className="article-body mx-auto mt-8 max-w-reading" dangerouslySetInnerHTML={{ __html: article.content_html }} />

              {tags.length > 0 && (
                <div className="mx-auto mt-10 max-w-reading border-t border-rule pt-5">
                  <p className="kicker-muted mb-3">Filed under</p>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((t) => (
                      <Link
                        key={t.id}
                        href={`/tag/${t.slug}`}
                        className="border border-rule px-2.5 py-1 font-sans text-[10px] uppercase tracking-kicker text-ink-soft transition-colors hover:border-ink hover:text-ink"
                      >
                        {t.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="mx-auto mt-10 max-w-reading border-y border-rule py-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {article.author_avatar && (
                      <img src={article.author_avatar} alt="" className="h-12 w-12 object-cover" />
                    )}
                    <div>
                      <p className="font-sans text-[9.5px] uppercase tracking-kicker text-ink-soft">Written by</p>
                      <Link href={`/author/${article.author_slug}`} className="font-display text-lg font-semibold hover:text-accent">
                        {article.author_name}
                      </Link>
                      {article.author_title && (
                        <p className="font-sans text-[10px] uppercase tracking-kicker text-ink-soft">{article.author_title}</p>
                      )}
                    </div>
                  </div>
                  <Link href={`/author/${article.author_slug}`} className="font-sans text-[10px] uppercase tracking-kicker text-accent">
                    All stories →
                  </Link>
                </div>
              </div>

              <div className="mx-auto mt-8 max-w-reading">
                <ArticleActions
                  articleId={article.id}
                  title={article.title}
                  slug={article.slug}
                  initialSaved={saved}
                  signedIn={!!user}
                />
              </div>

              <div className="mx-auto max-w-reading">
                <CommentsSection
                  comments={comments}
                  articleId={article.id}
                  signedIn={!!user}
                  signedInName={user?.name}
                />
              </div>
            </div>

            <aside className="reading-hide lg:sticky lg:top-16 lg:h-fit">
              <div className="border-t border-ink pt-4">
                <p className="kicker">In this issue</p>
                <p className="mt-2 font-serif text-[14px] leading-relaxed text-ink-soft">
                  {article.category_name} · Issue 47 · {article.reading_minutes} minute read
                </p>
              </div>

              <AdSlot placement="sidebar" className="mt-6" />

              <div className="mt-6 border border-rule p-4">
                <p className="font-sans text-[9.5px] uppercase tracking-kicker text-accent">Newsletter</p>
                <p className="mt-1 font-display text-lg leading-tight">The Sunday Edition</p>
                <p className="mt-1 font-serif text-[13px] leading-snug text-ink-soft">
                  The week’s reporting, edited to a point.
                </p>
                <div className="mt-3">
                  <NewsletterForm variant="inline" source={`article:${article.slug}`} label="Join" />
                </div>
              </div>

              <div className="mt-6 border border-rule p-4">
                <p className="kicker-muted mb-2">Related reading</p>
                <ul className="space-y-3">
                  {related.slice(0, 3).map((r) => (
                    <li key={r.id} className="font-display text-[14px] font-semibold leading-snug">
                      <Link href={`/article/${r.slug}`} className="link-underline">{r.title}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>

          <nav className="mx-auto mt-14 grid max-w-4xl gap-6 border-t border-ink pt-6 sm:grid-cols-2" aria-label="More stories">
            {adjacent.prev ? (
              <Link href={`/article/${adjacent.prev.slug}`} className="group">
                <p className="kicker-muted">Previous story</p>
                <p className="mt-1 font-display text-lg font-semibold leading-snug group-hover:text-accent">{adjacent.prev.title}</p>
              </Link>
            ) : (
              <span />
            )}
            {adjacent.next && (
              <Link href={`/article/${adjacent.next.slug}`} className="group sm:text-right">
                <p className="kicker-muted">Next story</p>
                <p className="mt-1 font-display text-lg font-semibold leading-snug group-hover:text-accent">{adjacent.next.title}</p>
              </Link>
            )}
          </nav>
        </article>

        <section className="mt-14 border-t border-rule pt-8">
          <div className="flex items-end justify-between border-b border-ink pb-3">
            <h2 className="font-display text-2xl font-semibold tracking-tight">More from {article.category_name}</h2>
            <Link href={`/category/${article.category_slug}`} className="font-sans text-[10px] uppercase tracking-kicker text-accent">
              All {article.category_name}
            </Link>
          </div>
          <div className="mt-6 grid gap-8 sm:grid-cols-3">
            {related.map((r) => (
              <ArticleCard key={r.id} article={r} showDek={false} />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
