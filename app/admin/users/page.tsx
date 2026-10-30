import Link from "next/link";
import { AdminForm } from "@/components/admin/form";
import { AdminPageHead, Badge, TableShell } from "@/components/admin/ui";
import { deleteUserAction, saveUserAction } from "@/app/actions/admin";
import { all } from "@/lib/db";
import { canManageUsers, getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Users & roles" };

type Row = {
  id: string;
  name: string;
  email: string;
  role: string;
  title: string | null;
  created_at: string;
  articles: number;
};

const ROLES = [
  { value: "super_admin", label: "Super administrator" },
  { value: "admin", label: "Administrator" },
  { value: "editor", label: "Editor" },
  { value: "author", label: "Author / contributor" },
  { value: "subscriber", label: "Subscriber" },
];

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  const me = await getCurrentUser();
  const allowed = canManageUsers(me?.role);
  const rows = await all<Row>(
    `SELECT u.id, u.name, u.email, u.role, u.title, u.created_at,
            (SELECT COUNT(*) FROM articles a WHERE a.author_id = u.id) AS articles
     FROM users u ORDER BY CASE u.role WHEN 'super_admin' THEN 0 WHEN 'admin' THEN 1 WHEN 'editor' THEN 2 WHEN 'author' THEN 3 ELSE 4 END, u.name`,
  );
  const editing = edit ? rows.find((r) => r.id === edit) : null;

  if (!allowed) {
    return (
      <div>
        <AdminPageHead kicker="Administration" title="Users & roles" />
        <div className="mt-6 border border-rule p-6">
          <p className="font-display text-xl">Administrator access required</p>
          <p className="mt-2 font-serif text-[14px] leading-relaxed text-ink-soft">
            Your role ({me?.role.replace("_", " ")}) can manage content but not accounts. Ask a super administrator to
            change roles, add contributors or reset passwords.
          </p>
          <Link href="/admin" className="btn btn-ghost mt-4">Back to the dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHead
        kicker="Administration"
        title="Users & roles"
        description="Roles determine what the desk can do: super administrators control settings and accounts, editors publish, authors submit for review, subscribers read."
      />

      <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <div>
          <TableShell head={["User", "Role", "Articles", "Joined", ""]}>
            {rows.map((u) => (
              <tr key={u.id} className="align-top hover:bg-paper-2/40">
                <td className="px-3 py-2.5">
                  <p className="font-display text-[14px] font-semibold">{u.name}</p>
                  <p className="font-mono text-[10px] text-ink-soft">{u.email}</p>
                  {u.title && <p className="font-sans text-[10px] text-ink-soft">{u.title}</p>}
                </td>
                <td className="px-3 py-2.5">
                  <Badge tone={u.role === "subscriber" ? "muted" : "live"}>{u.role.replace("_", " ")}</Badge>
                </td>
                <td className="px-3 py-2.5 font-sans text-[11px]">{u.articles}</td>
                <td className="px-3 py-2.5 font-sans text-[10.5px] text-ink-soft">{formatDate(u.created_at)}</td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/users?edit=${u.id}`} className="font-sans text-[9.5px] uppercase tracking-kicker underline">Edit</Link>
                    {u.id !== me?.id && (
                      <form action={deleteUserAction}>
                        <input type="hidden" name="id" value={u.id} />
                        <button type="submit" className="font-sans text-[9.5px] uppercase tracking-kicker text-accent underline">Delete</button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </TableShell>
          <p className="mt-2 font-sans text-[10px] text-ink-soft">
            You cannot delete your own account. Deleting a user unassigns their articles but leaves them published.
          </p>

          <div className="mt-6 border border-rule p-4">
            <p className="kicker-muted">What each role can do</p>
            <dl className="mt-3 space-y-2 font-sans text-[11.5px]">
              <div><dt className="font-semibold">Super administrator</dt><dd className="text-ink-soft">Everything, including site settings, accounts and paid-tier configuration.</dd></div>
              <div><dt className="font-semibold">Administrator</dt><dd className="text-ink-soft">Articles, sections, tags, media, newsletters, subscribers and users.</dd></div>
              <div><dt className="font-semibold">Editor</dt><dd className="text-ink-soft">All article and newsletter work, moderation and analytics. No account changes.</dd></div>
              <div><dt className="font-semibold">Author</dt><dd className="text-ink-soft">Own drafts only; can submit for review but cannot publish.</dd></div>
              <div><dt className="font-semibold">Subscriber</dt><dd className="text-ink-soft">Reading, saving, history, comments and newsletter preferences.</dd></div>
            </dl>
          </div>
        </div>

        <section className="border border-rule bg-paper-2/30 p-5">
          <p className="kicker">{editing ? "Edit account" : "Add an account"}</p>
          <h2 className="mt-1 font-display text-xl font-semibold">{editing ? editing.name : "New user"}</h2>
          <AdminForm
            action={saveUserAction}
            submit={editing ? "Save account" : "Create account"}
            className="mt-4"
            footer={editing ? <Link href="/admin/users" className="font-sans text-[10px] uppercase tracking-kicker underline">Cancel</Link> : null}
          >
            <input type="hidden" name="id" value={editing?.id ?? ""} />
            <label htmlFor="name" className="label">Name</label>
            <input id="name" name="name" defaultValue={editing?.name ?? ""} required className="field bg-paper" />
            <label htmlFor="email" className="label mt-3">Email</label>
            <input id="email" name="email" type="email" defaultValue={editing?.email ?? ""} required className="field bg-paper" />
            <label htmlFor="role" className="label mt-3">Role</label>
            <select id="role" name="role" defaultValue={editing?.role ?? "author"} className="field bg-paper">
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <label htmlFor="title" className="label mt-3">Title / beat</label>
            <input id="title" name="title" defaultValue={editing?.title ?? ""} placeholder="Technology editor" className="field bg-paper" />
            <label htmlFor="password" className="label mt-3">{editing ? "New password (optional)" : "Password"}</label>
            <input id="password" name="password" type="password" minLength={8} autoComplete="new-password" className="field bg-paper" />
            <p className="mt-1 font-sans text-[10px] text-ink-soft">At least 8 characters, hashed with PBKDF2 before storage.</p>
          </AdminForm>
          <p className="mt-4 border-t border-rule pt-3 font-sans text-[10px] leading-relaxed text-ink-soft">
            Only a super administrator can grant the super administrator role. Accounts created here are verified
            immediately so they can sign in.
          </p>
        </section>
      </div>
    </div>
  );
}
