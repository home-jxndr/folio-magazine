import type { Metadata } from "next";
import Link from "next/link";
import { PasswordForm, ProfileForm } from "@/components/account-forms";
import { requireUser } from "@/lib/auth";
import { all, one } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your account" };
export default async function AccountPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { welcome } = await searchParams;
  const user = await requireUser();

  const [saved, history, sub] = await Promise.all([
    one<{ n: number }>("SELECT COUNT(*) AS n FROM bookmarks WHERE user_id = ?", user.id),
    one<{ n: number }>("SELECT COUNT(*) AS n FROM reading_history WHERE user_id = ?", user.id),
    one<{ status: string; frequency: string }>("SELECT status, frequency FROM subscribers WHERE lower(email) = lower(?)", user.email),
  ]);
  const rows = await all<{ email: string }>("SELECT email FROM users WHERE id = ?", user.id);

  return (
    <div className="space-y-12">
      {welcome && (
        <div className="border-l-2 border-accent bg-accent/5 px-4 py-3">
          <p className="font-sans text-[12px]">
            Welcome to FOLIO. Your account is ready.{" "}
            <Link href="/latest" className="underline">Start reading</Link> or choose your newsletters.
          </p>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Saved articles", value: String(saved?.n ?? 0), href: "/account/saved" },
          { label: "Stories in history", value: String(history?.n ?? 0), href: "/account/history" },
          { label: "Newsletter", value: sub ? sub.status : "Not subscribed", href: "/account/subscriptions" },
        ].map((s) => (
          <Link key={s.label} href={s.href} className="border border-rule p-4 transition-colors hover:border-ink">
            <p className="font-sans text-[9.5px] uppercase tracking-kicker text-ink-soft">{s.label}</p>
            <p className="mt-1 font-display text-xl capitalize">{s.value}</p>
          </Link>
        ))}
      </section>

      <section>
        <div className="border-b border-ink pb-2">
          <h2 className="font-display text-2xl font-semibold tracking-tight">Profile</h2>
          <p className="mt-1 font-sans text-[11px] text-ink-soft">
            Signed in as {rows[0]?.email}. Your public profile lives at{" "}
            <Link href={`/author/${user.slug}`} className="underline">/author/{user.slug}</Link>.
          </p>
        </div>
        <div className="mt-6 max-w-2xl">
          <ProfileForm
            name={user.name}
            title={user.title ?? ""}
            bio={user.bio ?? ""}
            avatarUrl={user.avatar_url ?? ""}
            twitter=""
          />
        </div>
      </section>

      <section>
        <div className="border-b border-ink pb-2">
          <h2 className="font-display text-2xl font-semibold tracking-tight">Security</h2>
        </div>
        <div className="mt-6 max-w-2xl">
          <PasswordForm />
        </div>
      </section>

      <section>
        <div className="border-b border-ink pb-2">
          <h2 className="font-display text-2xl font-semibold tracking-tight">Reading preferences</h2>
        </div>
        <div className="mt-4 max-w-2xl font-serif text-[15px] leading-relaxed text-ink-soft">
          <p>
            The theme switch in the header remembers your choice on this device and applies it across the magazine,
            including the article view. The focus-mode button on any article hides the surrounding navigation for
            distraction-free reading.
          </p>
          <p className="mt-3">
            Data controls: your reading history can be cleared at any time from the{" "}
            <Link href="/account/history" className="underline">history page</Link>. To delete your account and all
            associated data, write to <a href="mailto:privacy@folio.press" className="underline">privacy@folio.press</a>{" "}
            from this address.
          </p>
        </div>
      </section>
    </div>
  );
}
