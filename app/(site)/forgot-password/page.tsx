import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { ForgotPasswordForm } from "@/components/auth-forms";
import { isEmailConfigured } from "@/lib/email";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Reset your password" };
export default function ForgotPasswordPage() {
  return (
    <AuthShell
      kicker="Account recovery"
      title="Reset your password"
      intro="Enter the address on your account and we will prepare a single-use link that expires in one hour."
      aside={
        <div className={`border p-6 ${isEmailConfigured() ? "border-rule" : "border-accent/40 bg-accent/5"}`}>
          <p className="kicker">{isEmailConfigured() ? "How it works" : "Email delivery not configured"}</p>
          <p className="mt-2 font-serif text-[14.5px] leading-relaxed text-ink-soft">
            {isEmailConfigured()
              ? "The link is emailed to the address on your account. It can only be used once, and expires after an hour."
              : "This installation has no email provider configured (RESEND_API_KEY). Rather than pretend an email was sent, the reset link is displayed on screen after you submit the form. Configure Resend to deliver these by email."}
          </p>
          <p className="mt-4 font-sans text-[10.5px] leading-relaxed text-ink-soft">
            For security, the form answers identically whether or not an account exists.
          </p>
        </div>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
