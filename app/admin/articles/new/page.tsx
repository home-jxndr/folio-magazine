import Link from "next/link";
import { ArticleEditor } from "@/components/admin/article-editor";
import { AdminPageHead } from "@/components/admin/ui";
import { all } from "@/lib/db";
import { listCategories } from "@/lib/queries";
import { canManageContent, getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "New article" };

export default async function NewArticlePage() {
  const user = await getCurrentUser();
  const [categories, authors, media] = await Promise.all([
    listCategories(),
    all<{ id: string; name: string; role: string }>(
      "SELECT id, name, role FROM users WHERE role IN ('super_admin','admin','editor','author') ORDER BY name",
    ),
    all<{ id: string; url: string; filename: string; alt: string | null }>(
      "SELECT id, url, filename, alt FROM media ORDER BY created_at DESC LIMIT 40",
    ),
  ]);

  return (
    <div className="space-y-5">
      <AdminPageHead
        kicker="New piece"
        title="Draft an article"
        description="Write, add media and save. Nothing is public until the piece is published; the preview link is private."
        action={<Link href="/admin/articles" className="btn btn-ghost">All articles</Link>}
      />
      <ArticleEditor
        article={null}
        categories={categories}
        authors={authors}
        media={media}
        revisions={[]}
        tags=""
        canPublish={canManageContent(user?.role)}
      />
    </div>
  );
}
