import type { Metadata } from "next";
import Link from "next/link";
import { getSubscriberByToken } from "@/lib/queries";
import { UnsubscribeForm } from "@/components/unsubscribe-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Unsubscribe" };

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const sub = token ? await getSubscriberByToken(token) : null;

  if (!token || !sub) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center sm:px-6">
        <p className="kicker">Newsletters</p>
        <h1 className="headline mt-3 text-4xl">This link is not valid</h1>
        <p className="dek mt-4">Use the unsubscribe link at the bottom of your latest edition, or contact the desk.</p>
        <Link href="/contact" className="btn btn-primary mt-8">Contact the desk</Link>
      </div>
    );
  }

  if (sub.status === "unsubscribed") {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center sm:px-6">
        <p className="kicker">Newsletters</p>
        <h1 className="headline mt-3 text-4xl">You are already unsubscribed</h1>
        <p className="dek mt-4">{sub.email} will not receive further newsletters. You can resubscribe at any time.</p>
        <Link href="/newsletter" className="btn btn-primary mt-8">Resubscribe</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-20 sm:px-6">
      <p className="kicker">Newsletters</p>
      <h1 className="headline mt-3 text-4xl">Leave the list?</h1>
      <p className="dek mt-4 max-w-lg">
        {sub.email} currently receives the {sub.frequency} newsletter. Unsubscribing removes you from every FOLIO
        newsletter immediately. We keep only a record that the address opted out, so we do not mail it again.
      </p>
      <UnsubscribeForm token={token} />
      <p className="mt-5 font-sans text-[10.5px] text-ink-soft">
        You can also <Link href={`/newsletter/preferences?token=${token}`} className="underline">edit your preferences</Link> without leaving.
      </p>
    </div>
  );
}
