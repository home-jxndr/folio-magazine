import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy notice" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-6">
      <p className="kicker">Legal</p>
      <h1 className="headline mt-3 text-4xl sm:text-5xl">Privacy notice</h1>
      <p className="mt-3 font-sans text-[10px] uppercase tracking-kicker text-ink-soft">Last updated 12 October 2026</p>

      <div className="article-body mt-8">
        <p>
          This notice explains what FOLIO collects, why, and what you can do about it. It is written to be read, not to
          protect us from you.
        </p>

        <h2>What we collect</h2>
        <ul>
          <li><strong>Account data:</strong> your name, email address and a hashed password. We never store passwords in plain text.</li>
          <li><strong>Reading data:</strong> articles you save, and your reading progress if you are signed in. This is used only to show your own history.</li>
          <li><strong>Newsletter data:</strong> your email, chosen frequency, topic preferences, consent timestamp and subscription status.</li>
          <li><strong>Analytics:</strong> aggregated page views, referrer category and approximate session identifiers. We do not build advertising profiles.</li>
          <li><strong>Comments:</strong> the name and email you provide, and the text of the comment, held for moderation.</li>
        </ul>

        <h2>Legal bases</h2>
        <p>
          Account and comment data are processed to perform the service you asked for (contract). Newsletter data is
          processed on the basis of your explicit consent, which you may withdraw at any time. Aggregate analytics are
          processed under legitimate interest, and only after you accept optional cookies.
        </p>

        <h2>Cookies</h2>
        <p>
          Essential cookies keep you signed in (<code>folio_session</code>) and remember your theme. They are set
          without consent because the service cannot function without them. Analytics cookies are optional; if you
          choose “essential only”, no analytics cookies are set.
        </p>

        <h2>Email</h2>
        <p>
          Newsletters are delivered through a transactional email provider. Every edition includes a one-click
          unsubscribe link, and unsubscribing removes you from all FOLIO newsletters immediately. We keep a minimal
          record that an address opted out so that we do not mail it again.
        </p>

        <h2>Retention</h2>
        <p>
          Account data is kept until you delete your account. Newsletter records are kept while your subscription is
          active plus 24 months for consent records. Aggregate analytics are retained for 24 months.
        </p>

        <h2>Your rights</h2>
        <p>
          You may request access, correction, export or deletion of your data, and you may object to processing. Write
          to <a href="mailto:privacy@folio.press">privacy@folio.press</a> from the address on your account. We respond
          within 30 days. You may also complain to your national data protection authority.
        </p>

        <h2>Processors</h2>
        <p>
          We use a hosting provider, a transactional email provider and a database provider. They process data on our
          instructions only. A current list is available on request.
        </p>

        <h2>Children</h2>
        <p>FOLIO is not directed at children under 16, and we do not knowingly collect their data.</p>
      </div>

      <div className="mt-10 border-t border-rule pt-5 font-sans text-[12px]">
        <Link href="/terms" className="underline">Terms and conditions</Link>
        <span className="mx-2 text-ink-soft">·</span>
        <Link href="/contact" className="underline">Contact the desk</Link>
      </div>
    </div>
  );
}
