import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getCurrentUser } from "@/lib/auth";
import { getSettings, listCategories } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [categories, user, settings] = await Promise.all([listCategories(), getCurrentUser(), getSettings()]);
  const nav = categories.map((c) => ({ slug: c.slug, name: c.name }));

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader
        categories={nav}
        issue={settings.issue || "Issue 47"}
        user={user ? { name: user.name, role: user.role, slug: user.slug } : null}
      />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter categories={nav} settings={settings} />
    </div>
  );
}
