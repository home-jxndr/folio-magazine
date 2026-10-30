import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/auth-forms";
import { getCurrentUser } from "@/lib/auth";
import { DEMO_ACCOUNTS } from "@/lib/seed";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(next && next.startsWith("/") ? next : "/account");

  return (
    <AuthShell
      kicker="Your account"
      title="Sign in"
      intro="Reading is free and needs no account. Sign in to save articles, keep your history and manage newsletters."
      aside={
        <div className="border border-rule bg-paper-2/50 p-6">
          <p className="kicker">Demo accounts</p>
          <p className="mt-2 font-serif text-[14px] leading-relaxed text-ink-soft">
            This installation is seeded with working accounts for each role. Passwords are stored as hashes, not plain
            text.
          </p>
          <ul className="mt-4 divide-y divide-rule border-y border-rule">
            {DEMO_ACCOUNTS.map((a) => (
              <li key={a.email} className="py-2.5">
                <p className="font-sans text-[11.5px] font-semibold">{a.role}</p>
                <p className="font-mono text-[11px] text-ink-soft">{a.email}</p>
                <p className="font-mono text-[11px] text-ink-soft">{a.password}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 font-sans text-[10.5px] leading-relaxed text-ink-soft">
            Deploying publicly? Remove these seed accounts and set your own password.
          </p>
        </div>
      }
    >
      <LoginForm next={next} />
      <p className="mt-6 font-sans text-[10.5px] leading-relaxed text-ink-soft">
        By signing in you agree to the <Link href="/terms" className="underline">terms</Link> and{" "}
        <Link href="/privacy" className="underline">privacy notice</Link>.
      </p>
    </AuthShell>
  );
}
