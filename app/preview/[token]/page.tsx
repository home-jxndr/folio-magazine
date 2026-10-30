import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleByPreview } from "@/lib/queries";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Draft preview", robots: { index: false, follow: false } };

export default async function PreviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const article = await getArticleByPreview(token);
  if (!article) notFound();

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-6">
      <div className="border border-accent/40 bg-accent/5 px-4 py-3">
        <p className="font-sans text-[10px] uppercase tracking-kicker text-accent">
          Draft preview · {article.status} · not indexed · share this link only with the editorial team
        </p>
      </div>

      <header className="mx-auto mt-8 max-w-3xl text-center">
        <p className="kicker">{article.category_name}</p>
        <h1 className="headline-xl mt-3 text-[2.2rem] sm:text-[3rem]">{article.title}</h1>
        {article.dek && <p className="dek mt-4 text-[1.05rem]">{article.dek}</p>}
        <p className="mt-4 font-sans text-[10px] uppercase tracking-kicker text-ink-soft">
          {article.author_name} · {formatDate(article.published_at ?? article.created_at)} · {article.reading_minutes} min read
        </p>
      </header>

      {article.cover_url && (
        <img src={article.cover_url} alt={article.cover_alt ?? ""} className="mt-8 aspect-[16/9] w-full object-cover" />
      )}
      {article.cover_caption && <p className="mt-2 font-sans text-[10.5px] text-ink-soft">{article.cover_caption}</p>}

      <div className="article-body mx-auto mt-8 max-w-reading" dangerouslySetInnerHTML={{ __html: article.content_html }} />

      <div className="mx-auto mt-10 flex max-w-reading flex-wrap gap-3 border-t border-rule pt-5">
        <Link href={`/admin/articles/${article.id}`} className="btn btn-primary">Edit this draft</Link>
        <Link href="/admin/articles" className="btn btn-ghost">All articles</Link>
      </div>
    </div>
  );
}
