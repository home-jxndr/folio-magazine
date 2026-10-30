import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NewsletterForm } from "@/components/newsletter-form";
import { getNewsletterEdition, getNewsletterEditions } from "@/lib/queries";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const edition = await getNewsletterEdition(slug);
  return edition
    ? { title: edition.title, description: edition.subject ?? edition.preheader ?? undefined }
    : { title: "Edition not found" };
}

export default async function EditionPage({ params }: Props) {
  const { slug } = await params;
  const edition = await getNewsletterEdition(slug);
  if (!edition) notFound();
  const others = (await getNewsletterEditions(8)).filter((e) => e.slug !== slug && e.status === "sent").slice(0, 3);

  return (
    <div className="mx-auto max-w-sheet px-5 sm:px-6">
      <div className="grid gap-12 py-8 lg:grid-cols-[minmax(0,1fr)_270px] lg:gap-16">
        <article className="mx-auto w-full max-w-3xl">
          <Link href="/newsletter/archive" className="font-sans text-[10px] uppercase tracking-kicker text-ink-soft hover:text-accent">
            ← Newsletter archive
          </Link>
          <header className="mt-5 border-b border-ink pb-6">
            <p className="kicker">Newsletter · {edition.status === "sent" ? formatDate(edition.sent_at) : "Preview"}</p>
            <h1 className="headline mt-3 text-[2.2rem] sm:text-[2.9rem]">{edition.title}</h1>
            {edition.preheader && <p className="dek mt-3 text-[1.05rem]">{edition.preheader}</p>}
            <p className="mt-3 font-sans text-[10px] uppercase tracking-kicker text-ink-soft">
              {edition.recipients.toLocaleString("en")} readers
              {edition.recipients > 0 && <> · {Math.round((edition.opens / edition.recipients) * 100)}% opened</>}
            </p>
          </header>
          <div className="article-body mx-auto mt-8 max-w-reading" dangerouslySetInnerHTML={{ __html: edition.body_html }} />
          <footer className="mt-10 border-t border-rule pt-5 font-sans text-[10.5px] leading-relaxed text-ink-soft">
            You are reading an edition of the FOLIO newsletter online.{" "}
            <Link href="/newsletter" className="underline">Subscribe</Link> to receive the next one by email, or{" "}
            <Link href="/newsletter/preferences" className="underline">manage your preferences</Link>.
          </footer>
        </article>

        <aside className="reading-hide lg:border-l lg:border-rule lg:pl-8">
          <div className="border border-ink bg-ink p-5 text-paper">
            <p className="font-sans text-[9.5px] uppercase tracking-kicker text-paper/60">The Sunday Edition</p>
            <p className="mt-2 font-display text-xl leading-tight">Get it by email</p>
            <p className="mt-2 font-serif text-[13.5px] leading-relaxed text-paper/70">Free, weekly, and easy to leave.</p>
            <div className="mt-4">
              <NewsletterForm variant="band" source={`edition:${edition.slug}`} label="Join" />
            </div>
          </div>
          {others.length > 0 && (
            <div className="mt-6">
              <p className="kicker-muted mb-3">Previous editions</p>
              <ul className="space-y-3">
                {others.map((o) => (
                  <li key={o.id}>
                    <Link href={`/newsletter/${o.slug}`} className="font-display text-[15px] font-semibold leading-snug hover:text-accent">
                      {o.title}
                    </Link>
                    <p className="font-sans text-[10px] uppercase tracking-kicker text-ink-soft">{formatDate(o.sent_at)}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
