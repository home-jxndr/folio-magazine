import Link from "next/link";
import type { ArticleSummary } from "@/lib/queries";
import { cn, formatDate, timeAgo } from "@/lib/utils";

function Kicker({ a }: { a: ArticleSummary }) {
  return (
    <span className="kicker">
      <span className="inline-block h-[5px] w-[5px] bg-accent" aria-hidden />
      {a.category_name ?? "Story"}
    </span>
  );
}

export function ArticleCard({
  article,
  variant = "feature",
  index,
  showDek = true,
  priority = false,
  className,
}: {
  article: ArticleSummary;
  variant?: "feature" | "wide" | "compact" | "minimal" | "numbered";
  index?: number;
  showDek?: boolean;
  priority?: boolean;
  className?: string;
}) {
  const href = `/article/${article.slug}`;

  if (variant === "compact" || variant === "numbered") {
    return (
      <article className={cn("group flex gap-4 py-5", className)}>
        {variant === "numbered" && typeof index === "number" && (
          <span className="mt-0.5 shrink-0 font-display text-2xl leading-none text-ink-soft/60">
            {String(index).padStart(2, "0")}
          </span>
        )}
        <div className="min-w-0">
          <Kicker a={article} />
          <h3 className="mt-1.5 font-display text-[17px] font-semibold leading-[1.2] tracking-tight">
            <Link href={href} className="link-underline">{article.title}</Link>
          </h3>
          {showDek && article.dek && (
            <p className="mt-1.5 line-clamp-2 font-serif text-[14px] leading-snug text-ink-soft">{article.dek}</p>
          )}
          <p className="mt-2 font-sans text-[10px] uppercase tracking-kicker text-ink-soft">
            {article.author_name} · {timeAgo(article.published_at)}
          </p>
        </div>
      </article>
    );
  }

  if (variant === "minimal") {
    return (
      <article className={cn("group", className)}>
        <h3 className="font-display text-lg font-semibold leading-tight">
          <Link href={href} className="link-underline">{article.title}</Link>
        </h3>
        <p className="mt-1.5 font-sans text-[10px] uppercase tracking-kicker text-ink-soft">
          {article.category_name} · {formatDate(article.published_at)}
        </p>
      </article>
    );
  }

  if (variant === "wide") {
    return (
      <article className={cn("group grid gap-5 sm:grid-cols-[1fr_1.05fr]", className)}>
        {article.cover_url && (
          <Link href={href} className="img-zoom block overflow-hidden bg-paper-2" tabIndex={-1} aria-hidden>
            <img src={article.cover_url} alt="" loading={priority ? "eager" : "lazy"} className="aspect-[4/3] w-full object-cover" />
          </Link>
        )}
        <div className="flex flex-col justify-center">
          <Kicker a={article} />
          <h3 className="mt-2 font-display text-[1.4rem] font-semibold leading-[1.12] tracking-tight sm:text-[1.6rem]">
            <Link href={href} className="link-underline">{article.title}</Link>
          </h3>
          {showDek && article.dek && <p className="mt-2 font-serif text-[15px] leading-relaxed text-ink-soft">{article.dek}</p>}
          <p className="mt-3 font-sans text-[10px] uppercase tracking-kicker text-ink-soft">
            {article.author_name} · {article.reading_minutes} min read
          </p>
        </div>
      </article>
    );
  }

  return (
    <article className={cn("group flex flex-col", className)}>
      {article.cover_url && (
        <Link href={href} className="img-zoom block overflow-hidden bg-paper-2" tabIndex={-1} aria-hidden>
          <img
            src={article.cover_url}
            alt={article.cover_alt ?? ""}
            loading={priority ? "eager" : "lazy"}
            className="aspect-[3/2] w-full object-cover"
          />
        </Link>
      )}
      <div className="flex flex-1 flex-col pt-3.5">
        <Kicker a={article} />
        <h3 className="mt-2 font-display text-[1.35rem] font-semibold leading-[1.14] tracking-tight">
          <Link href={href} className="link-underline">{article.title}</Link>
        </h3>
        {showDek && article.dek && <p className="mt-2 font-serif text-[15px] leading-relaxed text-ink-soft">{article.dek}</p>}
        <p className="mt-auto pt-3 font-sans text-[10px] uppercase tracking-kicker text-ink-soft">
          {article.author_name} · {article.reading_minutes} min read
        </p>
      </div>
    </article>
  );
}

export function LeadStory({ article }: { article: ArticleSummary }) {
  return (
    <article className="group">
      <Link href={`/article/${article.slug}`} className="img-zoom block overflow-hidden bg-paper-2">
        <img
          src={article.cover_url ?? ""}
          alt={article.cover_alt ?? article.title}
          className="aspect-[16/10] w-full object-cover"
          fetchPriority="high"
        />
      </Link>
      <div className="pt-5">
        <Kicker a={article} />
        <h2 className="headline-xl mt-3 text-[2.5rem] sm:text-[3.3rem] lg:text-[3.9rem]">
          <Link href={`/article/${article.slug}`} className="link-underline">{article.title}</Link>
        </h2>
        {article.dek && <p className="dek mt-4 max-w-2xl text-[1.05rem] sm:text-[1.15rem]">{article.dek}</p>}
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 font-sans text-[10px] uppercase tracking-kicker text-ink-soft">
          <span>By {article.author_name}</span>
          <span aria-hidden>·</span>
          <time dateTime={article.published_at ?? undefined}>{formatDate(article.published_at)}</time>
          <span aria-hidden>·</span>
          <span>{article.reading_minutes} min read</span>
        </div>
      </div>
    </article>
  );
}
