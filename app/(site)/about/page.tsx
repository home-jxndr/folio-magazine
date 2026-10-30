import type { Metadata } from "next";
import Link from "next/link";
import { getSettings, listAuthors, listCategories } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "About FOLIO",
  description: "FOLIO is an independent digital magazine of ideas, culture and the modern world, funded by readers.",
};
export default async function AboutPage() {
  const [authors, categories, settings] = await Promise.all([listAuthors(), listCategories(), getSettings()]);

  return (
    <div className="mx-auto max-w-sheet px-5 sm:px-6">
      <header className="grid gap-10 border-b border-ink py-12 lg:grid-cols-[1.3fr_1fr] lg:py-16">
        <div>
          <p className="kicker">The publication</p>
          <h1 className="headline-xl mt-3 text-[2.8rem] sm:text-[4rem]">
            An independent magazine, paid for by its readers.
          </h1>
        </div>
        <div className="lg:border-l lg:border-rule lg:pl-8">
          <p className="font-serif text-[17px] leading-relaxed text-ink">
            FOLIO was founded in Lisbon in 2016 with one constraint: no story should exist because an advertiser wanted
            it to. That constraint has shaped everything since — the size of the staff, the speed of publication, the
            kinds of pieces we can afford to report.
          </p>
          <p className="mt-4 font-serif text-[15px] leading-relaxed text-ink-soft">
            We publish roughly eight stories a week across ten desks, plus three newsletters with a combined 41,000
            subscribers. Every article is free to read, permanently. The newsletter list is never sold or shared.
          </p>
        </div>
      </header>

      <section className="grid gap-10 border-b border-rule py-10 sm:grid-cols-3">
        {[
          { n: "2016", l: "Founded in Lisbon" },
          { n: "41,000", l: "Newsletter readers" },
          { n: "10", l: "Editorial desks" },
        ].map((s) => (
          <div key={s.l}>
            <p className="font-display text-4xl font-semibold tracking-tight">{s.n}</p>
            <p className="mt-1 font-sans text-[10px] uppercase tracking-kicker text-ink-soft">{s.l}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-12 py-10 lg:grid-cols-[1fr_1fr]">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight">How we work</h2>
          <div className="mt-5 space-y-4 font-serif text-[16px] leading-relaxed text-ink-soft">
            <p>
              Every piece begins with a question the desk cannot answer quickly. We report it, argue about it in
              conference, and edit it twice. The editor-in-chief reads every article before publication.
            </p>
            <p>
              We publish corrections in full and at the top of the piece, not in a footnote. We do not use anonymous
              sources without an editor’s knowledge, and we do not grant copy approval to subjects.
            </p>
            <p>
              Our budget is published in summary each year. The magazine takes no sponsored content and no advertising
              in its newsletters. Display advertising on the site is clearly labelled and never appears inside an
              article body.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/contact" className="btn btn-ghost">Contact the desk</Link>
            <Link href="/latest" className="btn btn-primary">Read the archive</Link>
          </div>
        </div>

        <div className="border border-rule bg-paper-2/50 p-6">
          <p className="kicker">Editorial standards</p>
          <ul className="mt-4 space-y-3 font-serif text-[15px] leading-relaxed text-ink-soft">
            <li>Corrections are published within one working day of verification.</li>
            <li>Freelance contributors are paid on acceptance, not on publication.</li>
            <li>Photography is licensed and credited. AI-generated imagery is labelled.</li>
            <li>Comments are moderated against published community rules.</li>
            <li>Reader data is limited to what the product requires.</li>
          </ul>
          <p className="mt-5 font-sans text-[10px] uppercase tracking-kicker text-ink-soft">
            {settings.address || "Rua da Boavista 84, 1200-068 Lisbon"}
          </p>
        </div>
      </section>

      <section className="border-t border-rule py-10">
        <div className="flex items-end justify-between border-b border-ink pb-3">
          <h2 className="font-display text-2xl font-semibold tracking-tight">The masthead</h2>
          <Link href="/authors" className="font-sans text-[10px] uppercase tracking-kicker text-accent">All contributors</Link>
        </div>
        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {authors.map((a) => (
            <div key={a.id} className="flex gap-4">
              {a.avatar_url && <img src={a.avatar_url} alt={a.name} className="h-20 w-20 shrink-0 object-cover grayscale" />}
              <div>
                <Link href={`/author/${a.slug}`} className="font-display text-lg font-semibold hover:text-accent">{a.name}</Link>
                <p className="font-sans text-[10px] uppercase tracking-kicker text-ink-soft">{a.title}</p>
                <p className="mt-1 line-clamp-3 font-serif text-[13px] leading-snug text-ink-soft">{a.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-rule py-10">
        <p className="kicker-muted mb-4">Desks</p>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link key={c.slug} href={`/category/${c.slug}`} className="border border-rule px-3 py-1.5 font-sans text-[10px] uppercase tracking-kicker text-ink-soft hover:border-ink hover:text-ink">
              {c.name}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
