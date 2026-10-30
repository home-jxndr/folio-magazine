import type { Metadata } from "next";
import Link from "next/link";
import { NewsletterForm } from "@/components/newsletter-form";
import { getNewsletterEditions } from "@/lib/queries";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Newsletter archive" };
export default async function NewsletterArchivePage() {
  const editions = await getNewsletterEditions(60);
  const sent = editions.filter((e) => e.status === "sent" || e.status === "ready");

  return (
    <div className="mx-auto max-w-sheet px-5 sm:px-6">
      <header className="border-b border-ink py-10 lg:py-14">
        <p className="kicker">The archive</p>
        <h1 className="headline-xl mt-2 text-[2.6rem] sm:text-[3.6rem]">Every edition, free</h1>
        <p className="dek mt-3 max-w-2xl">
          Newsletters stay online permanently. Read one before you subscribe — it is the best way to decide whether the
          tone is for you.
        </p>
      </header>

      <div className="grid gap-10 py-8 lg:grid-cols-[1fr_250px]">
        <div>
          {sent.length === 0 ? (
            <p className="py-12 font-serif text-lg text-ink-soft">No editions have been sent yet.</p>
          ) : (
            <ul className="divide-y divide-rule border-y border-rule">
              {sent.map((e) => (
                <li key={e.id} className="grid gap-2 py-6 sm:grid-cols-[130px_1fr]">
                  <div className="font-sans text-[10px] uppercase tracking-kicker text-ink-soft">
                    {formatDate(e.sent_at)}
                    {e.featured ? <span className="mt-1 block text-accent">Featured</span> : null}
                  </div>
                  <div>
                    <Link href={`/newsletter/${e.slug}`} className="font-display text-xl font-semibold leading-tight hover:text-accent">
                      {e.title}
                    </Link>
                    <p className="mt-1 font-serif text-[15px] text-ink-soft">{e.subject}</p>
                    <p className="mt-2 font-sans text-[10px] uppercase tracking-kicker text-ink-soft">
                      {e.recipients.toLocaleString("en")} readers · {e.recipients ? Math.round((e.opens / e.recipients) * 100) : 0}% opened
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="lg:border-l lg:border-rule lg:pl-8">
          <div className="border border-rule p-4">
            <p className="kicker">Subscribe</p>
            <p className="mt-1 font-display text-lg leading-tight">Get the next edition</p>
            <div className="mt-3">
              <NewsletterForm variant="inline" source="archive" label="Join" />
            </div>
          </div>
          <Link href="/newsletter" className="mt-5 inline-block font-sans text-[10px] uppercase tracking-kicker text-accent">
            About the newsletters →
          </Link>
        </aside>
      </div>
    </div>
  );
}
