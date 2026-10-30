import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { ResetPasswordForm } from "@/components/auth-forms";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Set a new password" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <AuthShell kicker="Account recovery" title="This link is incomplete" intro="A reset link needs its token. Request a new one to continue.">
        <Link href="/forgot-password" className="btn btn-primary w-full">Request a new link</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell kicker="Account recovery" title="Set a new password" intro="Choose a password of at least eight characters. You will be signed out of other sessions the next time they expire.">
      <ResetPasswordForm token={token} />
    </AuthShell>
  );
}
