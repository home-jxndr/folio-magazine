import type { Metadata } from "next";
import Link from "next/link";
import { listAuthors } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Contributors" };

export default async function AuthorsPage() {
  const authors = await listAuthors();

  return (
    <div className="mx-auto max-w-sheet px-5 sm:px-6">
      <header className="border-b border-ink py-10 lg:py-14">
        <p className="kicker">The masthead</p>
        <h1 className="headline-xl mt-2 text-[2.6rem] sm:text-[3.6rem]">Contributors</h1>
        <p className="dek mt-3 max-w-2xl">
          FOLIO is written by a small staff and a rotating group of contributors. Every byline links to the full archive
          of that writer’s work.
        </p>
      </header>

      <div className="grid gap-x-10 gap-y-12 py-10 sm:grid-cols-2 lg:grid-cols-3">
        {authors.map((a) => (
          <article key={a.id} className="group">
            <Link href={`/author/${a.slug}`} className="block">
              {a.avatar_url && (
                <img
                  src={a.avatar_url}
                  alt={a.name}
                  className="aspect-[4/5] w-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0"
                  loading="lazy"
                />
              )}
              <p className="mt-4 kicker">{a.title}</p>
              <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight group-hover:text-accent">{a.name}</h2>
              <p className="mt-2 line-clamp-3 font-serif text-[14.5px] leading-relaxed text-ink-soft">{a.bio}</p>
              <p className="mt-3 font-sans text-[10px] uppercase tracking-kicker text-ink-soft">
                {a.article_count} stories
              </p>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
