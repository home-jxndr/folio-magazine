import type { Metadata } from "next";
import Link from "next/link";
import { one, run } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Confirm your subscription" };

export default async function ConfirmPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  if (!token) {
    return <Shell title="This link is incomplete" body="The confirmation link is missing its token. Use the link from the email, or subscribe again." />;
  }

  const sub = await one<{ id: string; email: string; status: string; frequency: string }>(
    "SELECT id, email, status, frequency FROM subscribers WHERE token = ?", token,
  );
  if (!sub) {
    return <Shell title="That link is not valid" body="We could not find a subscription for this token. It may have been replaced by a newer signup." />;
  }

  if (sub.status !== "confirmed") {
    await run("UPDATE subscribers SET status = 'confirmed', confirmed_at = datetime('now') WHERE id = ?", sub.id);
  }

  return (
    <Shell
      title={sub.status === "confirmed" ? "You were already confirmed" : "You’re on the list"}
      body={`${sub.email} is confirmed for the ${sub.frequency} newsletter. The next edition will arrive by email. You can change frequency or unsubscribe at any time.`}
      email={sub.email}
      token={token}
    />
  );
}

function Shell({ title, body, email, token }: { title: string; body: string; email?: string; token?: string }) {
  return (
    <div className="mx-auto max-w-2xl px-5 py-20 text-center sm:px-6">
      <p className="kicker">Newsletters</p>
      <h1 className="headline mt-3 text-4xl">{title}</h1>
      <p className="dek mx-auto mt-4 max-w-lg text-[1.05rem]">{body}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-primary">Read the magazine</Link>
        {email && token && (
          <Link href={`/newsletter/preferences?token=${token}`} className="btn btn-ghost">Manage preferences</Link>
        )}
        <Link href="/newsletter/archive" className="btn btn-ghost">Browse editions</Link>
      </div>
    </div>
  );
}
