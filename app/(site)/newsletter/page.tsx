import type { Metadata } from "next";
import Link from "next/link";
import { NewsletterForm } from "@/components/newsletter-form";
import { getNewsletterEditions } from "@/lib/queries";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Newsletters",
  description: "The Sunday Edition, the Daily Briefing and The Monthly — free newsletters from FOLIO.",
};

export default async function NewsletterPage() {
  const editions = await getNewsletterEditions(6);
  const featured = editions.find((e) => e.featured && e.status === "sent") ?? editions.find((e) => e.status === "sent");

  return (
    <div>
      <header className="border-b border-rule">
        <div className="mx-auto grid max-w-sheet gap-10 px-5 py-12 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:py-16">
          <div>
            <p className="kicker">Newsletters</p>
            <h1 className="headline-xl mt-3 text-[2.7rem] sm:text-[3.8rem]">
              One considered despatch, not forty alerts.
            </h1>
            <p className="dek mt-4 max-w-xl text-[1.05rem]">
              41,000 readers get the week edited to a point: one long read, three short ones and a single recommendation.
              Choose a daily briefing, the Sunday Edition or a monthly dispatch.
            </p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-sans text-[10px] uppercase tracking-kicker text-ink-soft">
              <span>Free</span>
              <span aria-hidden>·</span>
              <span>No advertising</span>
              <span aria-hidden>·</span>
              <span>One-click unsubscribe</span>
            </div>
          </div>
          <div className="border border-ink bg-paper-2/50 p-6 sm:p-8">
            <p className="kicker">Join the list</p>
            <p className="mt-1 font-display text-2xl">Choose your frequency</p>
            <div className="mt-5">
              <NewsletterForm variant="page" source="newsletter-page" label="Subscribe" showPreferences />
            </div>
            <p className="mt-5 font-sans text-[10.5px] leading-relaxed text-ink-soft">
              We store your email, frequency and topic choices only. We never sell or share the list. See the{" "}
              <Link href="/privacy" className="underline">privacy notice</Link>.
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-sheet px-5 sm:px-6">
        <section className="grid gap-8 border-b border-rule py-10 sm:grid-cols-3">
          {[
            { t: "The Sunday Edition", d: "Our flagship. One long read and three shorter pieces, chosen by the editor. Sundays, 06:00." },
            { t: "The Daily Briefing", d: "Three stories and one line of context, before seven on weekdays. No hot takes." },
            { t: "The Monthly", d: "A single dispatch at the end of each month: the best of the archive, plus a letter from the desk." },
          ].map((f) => (
            <div key={f.t} className="border-t border-ink pt-4">
              <h2 className="font-display text-xl font-semibold leading-tight">{f.t}</h2>
              <p className="mt-2 font-serif text-[14.5px] leading-relaxed text-ink-soft">{f.d}</p>
            </div>
          ))}
        </section>

        {featured && (
          <section className="border-b border-rule py-10">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-ink pb-3">
              <div>
                <p className="kicker">Featured edition</p>
                <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">{featured.title}</h2>
              </div>
              <Link href={`/newsletter/${featured.slug}`} className="font-sans text-[10px] uppercase tracking-kicker text-accent">
                Read it online →
              </Link>
            </div>
            <div className="mt-6 grid gap-8 sm:grid-cols-[1.4fr_1fr]">
              <div>
                <p className="font-serif text-[17px] leading-relaxed text-ink">{featured.preheader}</p>
                <p className="mt-4 line-clamp-4 font-serif text-[15px] leading-relaxed text-ink-soft">
                  {featured.body_html.replace(/<[^>]+>/g, " ").slice(0, 340)}…
                </p>
                <Link href={`/newsletter/${featured.slug}`} className="mt-5 inline-flex font-sans text-[10px] uppercase tracking-kicker text-accent">
                  Continue reading →
                </Link>
              </div>
              <div className="border border-rule p-5">
                <p className="kicker-muted">By the numbers</p>
                <dl className="mt-3 space-y-2 font-sans text-[12px]">
                  <div className="flex justify-between"><dt className="text-ink-soft">Sent</dt><dd>{formatDate(featured.sent_at)}</dd></div>
                  <div className="flex justify-between"><dt className="text-ink-soft">Recipients</dt><dd>{featured.recipients.toLocaleString("en")}</dd></div>
                  <div className="flex justify-between"><dt className="text-ink-soft">Open rate</dt><dd>{featured.recipients ? Math.round((featured.opens / featured.recipients) * 100) : 0}%</dd></div>
                  <div className="flex justify-between"><dt className="text-ink-soft">Click rate</dt><dd>{featured.recipients ? Math.round((featured.clicks / featured.recipients) * 100) : 0}%</dd></div>
                </dl>
              </div>
            </div>
          </section>
        )}

        <section className="py-10">
          <div className="flex items-end justify-between border-b border-ink pb-3">
            <h2 className="font-display text-2xl font-semibold tracking-tight">Recent editions</h2>
            <Link href="/newsletter/archive" className="font-sans text-[10px] uppercase tracking-kicker text-accent">
              Full archive
            </Link>
          </div>
          <ul className="divide-y divide-rule">
            {editions.filter((e) => e.status === "sent").slice(0, 4).map((e) => (
              <li key={e.id} className="flex flex-wrap items-baseline justify-between gap-3 py-4">
                <div>
                  <Link href={`/newsletter/${e.slug}`} className="font-display text-lg font-semibold hover:text-accent">
                    {e.title}
                  </Link>
                  <p className="font-serif text-[14px] text-ink-soft">{e.subject}</p>
                </div>
                <span className="font-sans text-[10px] uppercase tracking-kicker text-ink-soft">{formatDate(e.sent_at)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
