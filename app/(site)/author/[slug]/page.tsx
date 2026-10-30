import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/article-card";
import { countArticles, getAuthor, listArticles } from "@/lib/queries";
import { compactNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const author = await getAuthor(slug);
  return author ? { title: author.name, description: author.bio ?? undefined } : { title: "Contributor not found" };
}

export default async function AuthorPage({ params }: Props) {
  const { slug } = await params;
  const author = await getAuthor(slug);
  if (!author) notFound();

  const [articles, total] = await Promise.all([
    listArticles({ author: slug, limit: 24 }),
    countArticles({ author: slug }),
  ]);
  const views = articles.reduce((sum, a) => sum + a.views, 0);

  return (
    <div className="mx-auto max-w-sheet px-5 sm:px-6">
      <header className="grid gap-8 border-b border-ink py-10 sm:grid-cols-[180px_1fr] lg:py-14">
        {author.avatar_url && (
          <img
            src={author.avatar_url}
            alt={author.name}
            className="h-40 w-40 object-cover grayscale"
          />
        )}
        <div>
          <p className="kicker">Contributor</p>
          <h1 className="headline-xl mt-2 text-[2.4rem] sm:text-[3.4rem]">{author.name}</h1>
          <p className="mt-1 font-sans text-[10px] uppercase tracking-kicker text-ink-soft">{author.title}</p>
          {author.bio && <p className="mt-4 max-w-2xl font-serif text-[16px] leading-relaxed text-ink-soft">{author.bio}</p>}
          <div className="mt-5 flex flex-wrap items-center gap-6 font-sans text-[10px] uppercase tracking-kicker text-ink-soft">
            <span>{total} stories</span>
            <span>{compactNumber(views)} reads</span>
            {author.twitter && (
              <a href={`https://x.com/${author.twitter}`} target="_blank" rel="noreferrer noopener" className="text-accent underline">
                @{author.twitter}
              </a>
            )}
            <Link href={`/search?q=${encodeURIComponent(author.name)}`} className="hover:text-accent">
              Search their work →
            </Link>
          </div>
        </div>
      </header>

      <section className="py-8">
        <div className="flex items-end justify-between border-b border-ink pb-3">
          <h2 className="font-display text-2xl font-semibold tracking-tight">Stories by {author.name.split(" ")[0]}</h2>
          <Link href="/authors" className="font-sans text-[10px] uppercase tracking-kicker text-accent">All contributors</Link>
        </div>
        {articles.length === 0 ? (
          <p className="py-12 font-serif text-lg text-ink-soft">No published stories yet.</p>
        ) : (
          <div className="mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <ArticleCard key={a.id} article={a} showDek={false} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
