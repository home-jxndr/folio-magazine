import type { Metadata } from "next";
import Link from "next/link";
import { SubscriptionPreferences } from "@/components/subscription-preferences";
import { updateSubscriptionPreferencesAction } from "@/app/actions/newsletter";
import { getSubscriberByEmail, getSubscriberByToken } from "@/lib/queries";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Newsletter preferences" };

export default async function PreferencesPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const user = await getCurrentUser();

  let sub = token ? await getSubscriberByToken(token) : null;
  if (!sub && user) sub = await getSubscriberByEmail(user.email);

  if (!sub) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 sm:px-6">
        <p className="kicker">Newsletters</p>
        <h1 className="headline mt-3 text-4xl">No subscription found</h1>
        <p className="dek mt-4">
          {user
            ? "Your account is not subscribed to a newsletter yet. Join below — it takes one field."
            : "Open the link from your latest edition, or sign in with the address you subscribed with."}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/newsletter" className="btn btn-primary">Subscribe to a newsletter</Link>
          {!user && <Link href="/login?next=/newsletter/preferences" className="btn btn-ghost">Sign in</Link>}
        </div>
      </div>
    );
  }

  let topics: string[] = [];
  try {
    topics = JSON.parse(sub.topics) as string[];
  } catch {
    topics = [];
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-6 lg:py-16">
      <p className="kicker">Newsletters</p>
      <h1 className="headline mt-3 text-4xl">Your subscription preferences</h1>
      <p className="dek mt-3 max-w-xl">
        Change how often FOLIO emails you and which despatches you receive. Changes take effect immediately; consent
        records are kept for GDPR compliance.
      </p>
      <div className="mt-8">
        <SubscriptionPreferences
          token={sub.token}
          email={sub.email}
          frequency={sub.frequency}
          topics={topics}
          action={updateSubscriptionPreferencesAction}
        />
      </div>
      <p className="mt-6 font-sans text-[10.5px] leading-relaxed text-ink-soft">
        Status: <strong>{sub.status}</strong> · Subscribed {sub.created_at?.slice(0, 10)}. Questions?{" "}
        <Link href="/contact" className="underline">Contact the desk</Link>.
      </p>
    </div>
  );
}
