import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleEditor } from "@/components/admin/article-editor";
import { AdminPageHead, Badge, statusTone } from "@/components/admin/ui";
import { all } from "@/lib/db";
import { getArticleById, getArticleTags, listCategories } from "@/lib/queries";
import { canManageContent, getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Revision = { id: string; title: string; note: string | null; created_at: string; editor: string | null };

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const article = await getArticleById(id);
  if (!article) notFound();
  if (user?.role === "author" && article.author_id !== user.id) notFound();

  const [categories, authors, media, tagRows, revisions] = await Promise.all([
    listCategories(),
    all<{ id: string; name: string; role: string }>(
      "SELECT id, name, role FROM users WHERE role IN ('super_admin','admin','editor','author') ORDER BY name",
    ),
    all<{ id: string; url: string; filename: string; alt: string | null }>(
      "SELECT id, url, filename, alt FROM media ORDER BY created_at DESC LIMIT 40",
    ),
    getArticleTags(article.id),
    all<Revision>(
      `SELECT r.id, r.title, r.note, r.created_at, u.name AS editor
       FROM article_revisions r LEFT JOIN users u ON u.id = r.editor_id
       WHERE r.article_id = ? ORDER BY r.created_at DESC LIMIT 8`,
      article.id,
    ),
  ]);

  const tags = (tagRows as { name: string }[]).map((t) => t.name).join(", ");

  return (
    <div className="space-y-5">
      <AdminPageHead
        kicker="Editing"
        title={article.title}
        description={`By ${article.author_name ?? "unassigned"} · ${article.category_name ?? "no section"}. Save commits metadata; autosave protects the body while you write.`}
        action={
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone={statusTone(article.status)}>{article.status}</Badge>
            {article.status === "published" && (
              <Link href={`/article/${article.slug}`} className="btn btn-ghost">View live</Link>
            )}
            <Link href="/admin/articles" className="btn btn-ghost">All articles</Link>
          </div>
        }
      />
      <ArticleEditor
        article={article}
        categories={categories}
        authors={authors}
        media={media}
        revisions={revisions}
        tags={tags}
        canPublish={canManageContent(user?.role)}
      />
    </div>
  );
}
