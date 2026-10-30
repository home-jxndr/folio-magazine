import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { AdminNav } from "@/components/admin/nav";
import { signOutAction } from "@/app/actions/auth";

export const dynamic = "force-dynamic";

export const metadata = { title: "Editorial desk" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (!isStaff(user.role)) {
    return (
      <div className="min-h-screen bg-paper">
        <div className="mx-auto max-w-xl px-5 py-24 text-center">
          <p className="kicker">Access denied</p>
          <h1 className="headline mt-3 text-3xl">The editorial desk is for staff accounts.</h1>
          <p className="dek mt-3">
            Your account ({user.email}) has the {user.role.replace("_", " ")} role. Ask an administrator for editorial
            access, or continue reading the magazine.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/" className="btn btn-primary">Back to FOLIO</Link>
            <Link href="/account" className="btn btn-ghost">Your account</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[220px_1fr]">
      <div className="lg:border-r lg:border-rule">
        <div className="lg:sticky lg:top-0">
          <AdminNav userName={user.name} role={user.role} />
        </div>
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-5 py-3">
          <div className="flex items-center gap-4 font-sans text-[10px] uppercase tracking-kicker text-ink-soft">
            <Link href="/" className="hover:text-accent">Magazine</Link>
            <span aria-hidden>·</span>
            <Link href="/latest" className="hover:text-accent">Latest</Link>
            <span aria-hidden>·</span>
            <Link href="/account" className="hover:text-accent">Account</Link>
          </div>
          <div className="flex items-center gap-4 font-sans text-[10px] uppercase tracking-kicker">
            <span className="text-ink-soft">{user.name}</span>
            <form action={signOutAction}>
              <button type="submit" className="border border-rule px-3 py-1.5 hover:border-ink">Sign out</button>
            </form>
          </div>
        </div>
        <div className="px-5 py-6 lg:px-8 lg:py-8">{children}</div>
      </div>
    </div>
  );
}
