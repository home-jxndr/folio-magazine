import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { signOutAction } from "@/app/actions/auth";
import { AccountNav } from "@/components/account-nav";

export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");

  return (
    <div className="mx-auto max-w-sheet px-5 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-ink py-8">
        <div className="flex items-center gap-4">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="" className="h-14 w-14 object-cover" />
          ) : (
            <span className="flex h-14 w-14 items-center justify-center bg-paper-2 font-display text-xl">
              {user.name.slice(0, 1)}
            </span>
          )}
          <div>
            <p className="kicker">Your FOLIO</p>
            <h1 className="font-display text-3xl font-semibold tracking-tight">{user.name}</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 font-sans text-[10px] uppercase tracking-kicker">
          {isStaff(user.role) && (
            <Link href="/admin" className="text-accent underline">Editorial desk</Link>
          )}
          <span className="text-ink-soft">{user.role.replace("_", " ")}</span>
          <form action={signOutAction}>
            <button type="submit" className="border border-rule px-3 py-2 uppercase tracking-kicker hover:border-ink">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="grid gap-10 py-8 lg:grid-cols-[200px_1fr] lg:gap-14">
        <AccountNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
