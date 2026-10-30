import type { Metadata } from "next";
import Link from "next/link";
import { NewsletterForm } from "@/components/newsletter-form";
import { isEmailConfigured } from "@/lib/email";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Membership" };

export default async function MembershipPage() {
  const emailReady = isEmailConfigured();

  return (
    <div className="mx-auto max-w-sheet px-5 sm:px-6">
      <header className="border-b border-ink py-10 lg:py-16">
        <p className="kicker">Membership</p>
        <h1 className="headline-xl mt-3 max-w-3xl text-[2.6rem] sm:text-[3.8rem]">
          Independent journalism, paid for by the people who read it.
        </h1>
        <p className="dek mt-4 max-w-2xl text-[1.05rem]">
          FOLIO has no proprietor and no advertising majority. Membership pays for reporters, photographers, legal
          support and the archive, which stays free and permanent.
        </p>
      </header>

      <div className="grid gap-6 py-10 lg:grid-cols-3">
        {[
          {
            name: "Reader",
            price: "Free",
            detail: "Everything published, all newsletters, the full archive.",
            features: ["Unlimited articles", "All newsletters", "Saved articles & reading history"],
            cta: "Create an account",
            href: "/register",
            current: true,
          },
          {
            name: "Member",
            price: "€6 / month",
            detail: "The magazine, plus the Sunday Edition in full and the annual print issue.",
            features: ["Everything in Reader", "Annual print issue", "Members’ letters", "Support the reporting"],
            cta: "Choose Member",
            href: "#not-configured",
          },
          {
            name: "Patron",
            price: "€15 / month",
            detail: "For readers who want the desk to be able to say no to things.",
            features: ["Everything in Member", "Two print issues", "Quarterly editor’s call", "Named in the annual report"],
            cta: "Choose Patron",
            href: "#not-configured",
          },
        ].map((tier) => (
          <section key={tier.name} className={`flex flex-col border p-6 ${tier.name === "Member" ? "border-ink" : "border-rule"}`}>
            <p className="kicker-muted">{tier.name}</p>
            <p className="mt-2 font-display text-3xl font-semibold">{tier.price}</p>
            <p className="mt-2 font-serif text-[14.5px] leading-relaxed text-ink-soft">{tier.detail}</p>
            <ul className="mt-4 flex-1 space-y-2 border-t border-rule pt-4 font-sans text-[12px]">
              {tier.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-accent" aria-hidden>—</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link href={tier.href} className={`mt-6 ${tier.current ? "btn btn-primary" : "btn btn-ghost"}`}>
              {tier.cta}
            </Link>
          </section>
        ))}
      </div>

      <section id="not-configured" className="border border-accent/40 bg-accent/5 p-6">
        <p className="kicker">Payments not configured</p>
        <h2 className="mt-2 font-display text-2xl font-semibold">Paid membership is not live on this installation.</h2>
        <p className="mt-2 max-w-3xl font-serif text-[15px] leading-relaxed text-ink-soft">
          No payment provider credentials are configured, so no checkout is offered and no card details are collected.
          The free reader account and the newsletters are fully functional. To enable paid tiers, add a payment
          provider integration and its environment variables — documented in the project README — and connect the
          Member and Patron buttons to real checkout sessions.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/register" className="btn btn-primary">Create a free account</Link>
          <Link href="/newsletter" className="btn btn-ghost">Subscribe to the newsletter</Link>
        </div>
      </section>

      <section className="mt-10 grid gap-10 border-t border-rule py-10 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-2xl font-semibold">Where the money goes</h2>
          <dl className="mt-4 divide-y divide-rule border-y border-rule font-sans text-[13px]">
            {[
              ["Editorial salaries", "58%"],
              ["Reporting and travel", "14%"],
              ["Photography and illustration", "9%"],
              ["Technology and hosting", "11%"],
              ["Legal and administration", "8%"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-2.5">
                <dt className="text-ink-soft">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="border border-rule p-6">
          <p className="kicker">Not ready for a paid tier?</p>
          <h3 className="mt-2 font-display text-xl">The newsletter is free, and always will be.</h3>
          <p className="mt-2 font-serif text-[14px] leading-relaxed text-ink-soft">
            One long read and three short ones, every Sunday. No advertising, no tracking pixels.
          </p>
          <div className="mt-4">
            <NewsletterForm variant="inline" source="membership" label="Join free" />
          </div>
          {!emailReady && (
            <p className="mt-3 font-sans text-[10.5px] leading-relaxed text-accent">
              Email delivery is not configured on this installation (RESEND_API_KEY). Signups are stored and shown a
              confirmation link instead of an email being sent.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
