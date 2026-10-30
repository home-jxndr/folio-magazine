import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { RegisterForm } from "@/components/auth-forms";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Create an account" };

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/account");

  return (
    <AuthShell
      kicker="Join FOLIO"
      title="Create your reader account"
      intro="Free, no card, no advertising profiles. Save stories, keep your place and choose which newsletters arrive."
      aside={
        <div className="border border-rule bg-paper-2/50 p-6">
          <p className="font-display text-3xl tracking-[0.24em]">FOLIO</p>
          <p className="mt-3 font-serif text-[15px] leading-relaxed text-ink-soft">
            “We publish fewer stories than our competitors, and we take longer over them. Reader funding is what makes
            that possible.”
          </p>
          <p className="mt-3 font-sans text-[10px] uppercase tracking-kicker text-ink-soft">Marguerite Oyelaran, Editor-in-Chief</p>
          <div className="mt-6 border-t border-rule pt-4">
            <p className="font-sans text-[10px] uppercase tracking-kicker text-ink-soft">What you get</p>
            <ul className="mt-2 space-y-2 font-serif text-[14px] text-ink-soft">
              <li>Saved articles and reading history</li>
              <li>Newsletter preferences in one place</li>
              <li>The Sunday Edition, if you want it</li>
            </ul>
          </div>
        </div>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
