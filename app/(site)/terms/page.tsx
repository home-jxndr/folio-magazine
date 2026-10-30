import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Terms and conditions" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-6">
      <p className="kicker">Legal</p>
      <h1 className="headline mt-3 text-4xl sm:text-5xl">Terms and conditions</h1>
      <p className="mt-3 font-sans text-[10px] uppercase tracking-kicker text-ink-soft">Last updated 12 October 2026</p>

      <div className="article-body mt-8">
        <p>
          These terms govern your use of FOLIO. By creating an account, subscribing to a newsletter or posting a
          comment, you agree to them.
        </p>

        <h2>Reading and reuse</h2>
        <p>
          Articles are free to read. You may quote short extracts with attribution and a link. Republishing whole
          articles, scraping the archive or using our journalism to train commercial models requires written
          permission from the editor.
        </p>

        <h2>Accounts</h2>
        <p>
          You are responsible for keeping your password secure and for activity on your account. Accounts may be
          suspended for abuse, impersonation or attempts to compromise the service.
        </p>

        <h2 id="comments">Comments and community rules</h2>
        <ul>
          <li>Comments are moderated before publication. Moderation is editorial, not legal, and we do not guarantee publication.</li>
          <li>No abuse, harassment, hate speech, spam or disclosure of private information.</li>
          <li>No impersonation of another person or of FOLIO staff.</li>
          <li>We may remove a comment, close a thread, or suspend an account that repeatedly breaches these rules.</li>
        </ul>

        <h2>Newsletters</h2>
        <p>
          Newsletters are free. You may unsubscribe at any time using the link in any edition. We may change frequency
          or retire a newsletter; material changes are announced to subscribers first.
        </p>

        <h2>Membership</h2>
        <p>
          Paid membership tiers are not enabled on this installation because no payment provider is configured. Where
          they are offered, payment terms, renewal and cancellation are presented at checkout before any charge.
        </p>

        <h2>Accuracy and corrections</h2>
        <p>
          We report in good faith and correct errors promptly. If you believe something is inaccurate, write to{" "}
          <a href="mailto:corrections@folio.press">corrections@folio.press</a> with the article and the evidence.
        </p>

        <h2>Liability</h2>
        <p>
          The service is provided as is. To the extent permitted by law, FOLIO is not liable for indirect or
          consequential loss arising from use of the site. Nothing in these terms limits liability that cannot be
          limited by law.
        </p>

        <h2>Governing law</h2>
        <p>These terms are governed by the laws of Portugal. Disputes are subject to the courts of Lisbon.</p>
      </div>

      <div className="mt-10 border-t border-rule pt-5 font-sans text-[12px]">
        <Link href="/privacy" className="underline">Privacy notice</Link>
        <span className="mx-2 text-ink-soft">·</span>
        <Link href="/contact" className="underline">Contact the desk</Link>
      </div>
    </div>
  );
}
