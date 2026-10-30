import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getSubscriberByEmail } from "@/lib/queries";
import { SubscriptionPreferences } from "@/components/subscription-preferences";
import { subscribeAccountEmailAction } from "@/app/actions/newsletter";
import { NewsletterForm } from "@/components/newsletter-form";
import { isEmailConfigured } from "@/lib/email";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Newsletter settings" };

export default async function SubscriptionsPage() {
  const user = await requireUser();
  const sub = await getSubscriberByEmail(user.email);

  let topics: string[] = [];
  if (sub) {
    try {
      topics = JSON.parse(sub.topics) as string[];
    } catch {
      topics = [];
    }
  }

  return (
    <div>
      <div className="border-b border-ink pb-2">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Newsletter</h2>
        <p className="mt-1 font-sans text-[11px] text-ink-soft">
          {sub ? `Linked to ${sub.email}` : `No subscription for ${user.email}`}
        </p>
      </div>

      {!isEmailConfigured() && (
        <div className="mt-4 border-l-2 border-accent bg-accent/5 px-4 py-3 font-sans text-[11.5px] leading-relaxed">
          <strong>Email delivery is not configured.</strong> New subscriptions are stored as pending and shown a
          confirmation link on screen. Set <code>RESEND_API_KEY</code> to deliver newsletters and confirmations by email.
        </div>
      )}

      {sub ? (
        <>
          <dl className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="border border-rule p-4">
              <dt className="font-sans text-[9.5px] uppercase tracking-kicker text-ink-soft">Status</dt>
              <dd className="mt-1 font-display text-lg capitalize">{sub.status}</dd>
            </div>
            <div className="border border-rule p-4">
              <dt className="font-sans text-[9.5px] uppercase tracking-kicker text-ink-soft">Frequency</dt>
              <dd className="mt-1 font-display text-lg capitalize">{sub.frequency}</dd>
            </div>
            <div className="border border-rule p-4">
              <dt className="font-sans text-[9.5px] uppercase tracking-kicker text-ink-soft">Subscribed</dt>
              <dd className="mt-1 font-display text-lg">{formatDate(sub.created_at)}</dd>
            </div>
          </dl>

          {sub.status === "pending" ? (
            <div className="mt-6 border border-rule p-5">
              <p className="font-sans text-[12px]">
                This subscription is not confirmed yet.{" "}
                <Link href={`/newsletter/confirm?token=${sub.token}`} className="text-accent underline">
                  Confirm it now
                </Link>{" "}
                to start receiving editions.
              </p>
            </div>
          ) : (
            <div className="mt-6">
              <SubscriptionPreferences
                token={sub.token}
                email={sub.email}
                frequency={sub.frequency}
                topics={topics}
                action={subscribeAccountEmailAction}
              />
            </div>
          )}
        </>
      ) : (
        <div className="mt-6 max-w-lg">
          <p className="font-serif text-[15px] leading-relaxed text-ink-soft">
            Subscribe with the address on your account to receive the newsletter. Preferences can then be managed here.
          </p>
          <div className="mt-5 border border-rule p-5">
            <NewsletterForm variant="inline" source="account" label="Subscribe" showPreferences />
          </div>
        </div>
      )}

      <div className="mt-8">
        <Link href="/newsletter/archive" className="font-sans text-[10px] uppercase tracking-kicker text-accent">
          Read past editions →
        </Link>
      </div>
    </div>
  );
}
