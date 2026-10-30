"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManageContent, canManageUsers, getCurrentUser, requireEditor, requireUser } from "@/lib/auth";
import { all, one, run } from "@/lib/db";
import { hashPassword, randomToken } from "@/lib/password";
import { readingTime, slugify } from "@/lib/utils";
import type { ActionState } from "@/lib/action-types";

function parseTags(value: string): string[] {
  return value.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 12);
}

async function syncTags(articleId: string, names: string[]) {
  await run("DELETE FROM article_tags WHERE article_id = ?", articleId);
  for (const name of names) {
    const slug = slugify(name);
    if (!slug) continue;
    let tag = await one<{ id: string }>("SELECT id FROM tags WHERE slug = ?", slug);
    if (!tag) {
      const id = `tag-${randomToken(4)}`;
      await run("INSERT INTO tags (id, slug, name) VALUES (?, ?, ?)", id, slug, name);
      tag = { id };
    }
    await run("INSERT OR IGNORE INTO article_tags (article_id, tag_id) VALUES (?, ?)", articleId, tag.id);
  }
}

export async function saveArticleAction(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Sign in to continue." };
  if (!canManageContent(user.role) && user.role !== "author") {
    return { ok: false, message: "You do not have permission to edit articles." };
  }

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const dek = String(formData.get("dek") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const body = String(formData.get("content_html") ?? "").trim();
  const cover = String(formData.get("cover_url") ?? "").trim();
  const coverCaption = String(formData.get("cover_caption") ?? "").trim();
  const coverAlt = String(formData.get("cover_alt") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "");
  const authorId = String(formData.get("author_id") ?? user.id);
  const collection = String(formData.get("collection") ?? "").trim();
  const tagNames = parseTags(String(formData.get("tags") ?? ""));
  const seoTitle = String(formData.get("seo_title") ?? "").trim();
  const seoDescription = String(formData.get("seo_description") ?? "").trim();
  const canonical = String(formData.get("canonical_url") ?? "").trim();
  const featured = formData.get("featured") ? 1 : 0;
  const pick = formData.get("editors_pick") ? 1 : 0;
  const breaking = formData.get("breaking") ? 1 : 0;
  let status = String(formData.get("status") ?? "draft");
  const scheduleAt = String(formData.get("published_at") ?? "").trim();

  const errors: Record<string, string> = {};
  if (title.length < 4) errors.title = "Give the piece a working headline.";
  if (!body || body.length < 20) errors.content_html = "The article body is empty.";
  if (!categoryId) errors.category_id = "Choose a section.";
  if (Object.keys(errors).length) return { ok: false, message: "Check the highlighted fields.", errors };

  if (!canManageContent(user.role)) {
    // Authors may submit for review but never publish directly.
    status = status === "published" || status === "scheduled" ? "review" : status;
  }

  const existing = id ? await one<{ id: string; title: string; dek: string | null; content_html: string; author_id: string | null; published_at: string | null }>(
    "SELECT id, title, dek, content_html, author_id, published_at FROM articles WHERE id = ?", id,
  ) : null;

  if (existing && user.role === "author" && existing.author_id !== user.id) {
    return { ok: false, message: "You can only edit your own drafts." };
  }

  let slug = slugify(String(formData.get("slug") ?? "") || title);
  if (!slug) slug = `story-${randomToken(3)}`;
  const slugClash = await one<{ id: string }>("SELECT id FROM articles WHERE slug = ? AND id != ?", slug, id || "none");
  if (slugClash) slug = `${slug}-${randomToken(2)}`;

  const publishedAt =
    status === "published"
      ? existing?.published_at ?? (scheduleAt ? scheduleAt.replace("T", " ") : new Date().toISOString().slice(0, 19).replace("T", " "))
      : status === "scheduled"
        ? scheduleAt.replace("T", " ")
        : existing?.published_at ?? null;

  if (status === "scheduled" && !scheduleAt) {
    return { ok: false, message: "Choose a date and time to schedule this piece.", errors: { published_at: "Required for scheduled articles." } };
  }

  const articleId = existing?.id ?? `art-${randomToken(6)}`;
  const minutes = readingTime(body);

  if (existing) {
    await run(
      `UPDATE articles SET slug=?, title=?, dek=?, excerpt=?, content_html=?, cover_url=?, cover_caption=?, cover_alt=?,
        category_id=?, author_id=?, status=?, featured=?, editors_pick=?, breaking=?, collection=?, reading_minutes=?,
        seo_title=?, seo_description=?, canonical_url=?, published_at=?, updated_at=datetime('now') WHERE id=?`,
      slug, title, dek || null, excerpt || null, body, cover || null, coverCaption || null, coverAlt || null,
      categoryId, authorId, status, featured, pick, breaking, collection || null, minutes,
      seoTitle || null, seoDescription || null, canonical || null, publishedAt, articleId,
    );
    if (existing.content_html !== body || existing.title !== title) {
      await run(
        `INSERT INTO article_revisions (id, article_id, title, dek, content_html, editor_id, note, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        `rev-${randomToken(6)}`, articleId, existing.title, existing.dek, existing.content_html, user.id, "Saved before edit",
      );
    }
  } else {
    await run(
      `INSERT INTO articles (id, slug, title, dek, excerpt, content_html, cover_url, cover_caption, cover_alt, category_id, author_id,
        status, featured, editors_pick, breaking, collection, views, reading_minutes, seo_title, seo_description, canonical_url,
        preview_token, published_at, updated_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      articleId, slug, title, dek || null, excerpt || null, body, cover || null, coverCaption || null, coverAlt || null,
      categoryId, authorId, status, featured, pick, breaking, collection || null, minutes,
      seoTitle || null, seoDescription || null, canonical || null, randomToken(8), publishedAt,
    );
  }

  await syncTags(articleId, tagNames);
  await run(
    "INSERT INTO activity_log (id, actor, action, target, created_at) VALUES (?, ?, ?, ?, datetime('now'))",
    `act-${randomToken(5)}`, user.name,
    status === "published" ? "published" : status === "scheduled" ? "scheduled" : status === "review" ? "submitted for review" : "saved draft",
    title,
  );

  revalidatePath("/");
  revalidatePath("/admin/articles");
  revalidatePath(`/article/${slug}`);
  redirect(`/admin/articles?saved=${encodeURIComponent(title)}`);
}

export async function setArticleStatusAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !canManageContent(user.role)) return;
  const id = String(formData.get("id") ?? "");
  const action = String(formData.get("action") ?? "");
  if (!id) return;
  if (action === "publish") {
    await run("UPDATE articles SET status='published', published_at=COALESCE(published_at, datetime('now')), updated_at=datetime('now') WHERE id=?", id);
  } else if (action === "unpublish") {
    await run("UPDATE articles SET status='draft', updated_at=datetime('now') WHERE id=?", id);
  } else if (action === "archive") {
    await run("UPDATE articles SET status='archived', updated_at=datetime('now') WHERE id=?", id);
  } else if (action === "feature") {
    await run("UPDATE articles SET featured = CASE featured WHEN 1 THEN 0 ELSE 1 END WHERE id=?", id);
  }
  revalidatePath("/");
  revalidatePath("/admin/articles");
  revalidatePath("/admin/calendar");
}

export async function deleteArticleAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !canManageContent(user.role)) return;
  const id = String(formData.get("id") ?? "");
  const article = await one<{ title: string }>("SELECT title FROM articles WHERE id = ?", id);
  await run("DELETE FROM articles WHERE id = ?", id);
  if (article) {
    await run("INSERT INTO activity_log (id, actor, action, target, created_at) VALUES (?, ?, 'deleted', ?, datetime('now'))",
      `act-${randomToken(5)}`, user.name, article.title);
  }
  revalidatePath("/admin/articles");
  redirect("/admin/articles?deleted=1");
}

export async function restoreRevisionAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !canManageContent(user.role)) return;
  const revisionId = String(formData.get("revision_id") ?? "");
  const rev = await one<{ article_id: string; title: string; dek: string | null; content_html: string }>(
    "SELECT article_id, title, dek, content_html FROM article_revisions WHERE id = ?", revisionId,
  );
  if (!rev) return;
  await run(
    "UPDATE articles SET title=?, dek=?, content_html=?, reading_minutes=?, updated_at=datetime('now') WHERE id=?",
    rev.title, rev.dek, rev.content_html, readingTime(rev.content_html), rev.article_id,
  );
  await run(
    "INSERT INTO article_revisions (id, article_id, title, dek, content_html, editor_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?, 'Restored from history', datetime('now'))",
    `rev-${randomToken(6)}`, rev.article_id, rev.title, rev.dek, rev.content_html, user.id,
  );
  revalidatePath("/admin/articles");
}

/* --------------------------- categories & tags --------------------------- */

export async function saveCategoryAction(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || !canManageContent(user.role)) return { ok: false, message: "Editorial permissions are required." };
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const order = Number(formData.get("sort_order") ?? 0);
  if (name.length < 2) return { ok: false, message: "Enter a section name." };
  if (id) {
    await run("UPDATE categories SET name=?, description=?, sort_order=? WHERE id=?", name, description, order, id);
  } else {
    const slug = slugify(name);
    const clash = await one("SELECT id FROM categories WHERE slug = ?", slug);
    if (clash) return { ok: false, message: "A section with that name already exists." };
    await run("INSERT INTO categories (id, slug, name, description, sort_order) VALUES (?, ?, ?, ?, ?)",
      `cat-${randomToken(4)}`, slug, name, description, order);
  }
  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
  return { ok: true, message: id ? "Section updated." : "Section created." };
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !canManageContent(user.role)) return;
  const id = String(formData.get("id") ?? "");
  const count = await one<{ n: number }>("SELECT COUNT(*) AS n FROM articles WHERE category_id = ?", id);
  if (Number(count?.n ?? 0) > 0) return;
  await run("DELETE FROM categories WHERE id = ?", id);
  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
}

export async function saveTagAction(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || !canManageContent(user.role)) return { ok: false, message: "Editorial permissions are required." };
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, message: "Enter a tag name." };
  const slug = slugify(name);
  if (id) {
    await run("UPDATE tags SET name=?, slug=? WHERE id=?", name, slug, id);
  } else {
    const clash = await one("SELECT id FROM tags WHERE slug = ?", slug);
    if (clash) return { ok: false, message: "That tag already exists." };
    await run("INSERT INTO tags (id, slug, name) VALUES (?, ?, ?)", `tag-${randomToken(4)}`, slug, name);
  }
  revalidatePath("/admin/tags");
  return { ok: true, message: "Tag saved." };
}

export async function deleteTagAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !canManageContent(user.role)) return;
  await run("DELETE FROM tags WHERE id = ?", String(formData.get("id") ?? ""));
  revalidatePath("/admin/tags");
}

/* -------------------------------- media -------------------------------- */

export async function saveMediaAction(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || !canManageContent(user.role)) return { ok: false, message: "Editorial permissions are required." };
  const id = String(formData.get("id") ?? "");
  const url = String(formData.get("url") ?? "").trim();
  const filename = String(formData.get("filename") ?? "").trim();
  const alt = String(formData.get("alt") ?? "").trim();
  const caption = String(formData.get("caption") ?? "").trim();
  const folder = String(formData.get("folder") ?? "Editorial").trim();
  const credit = String(formData.get("credit") ?? "").trim();

  if (id) {
    await run("UPDATE media SET url=?, filename=?, alt=?, caption=?, folder=?, credit=? WHERE id=?", url, filename, alt, caption, folder, credit, id);
    revalidatePath("/admin/media");
    return { ok: true, message: "Asset updated." };
  }
  if (!/^https?:\/\/.+/i.test(url)) return { ok: false, message: "Enter a full image URL (https://…)." };
  if (!filename) return { ok: false, message: "Give the file a name." };
  await run(
    "INSERT INTO media (id, url, filename, alt, caption, folder, credit, uploaded_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))",
    `med-${randomToken(5)}`, url, filename, alt, caption, folder, credit, user.id,
  );
  revalidatePath("/admin/media");
  return { ok: true, message: "Asset added to the library." };
}

export async function deleteMediaAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !canManageContent(user.role)) return;
  await run("DELETE FROM media WHERE id = ?", String(formData.get("id") ?? ""));
  revalidatePath("/admin/media");
}

/* ------------------------------- comments ------------------------------- */

export async function moderateCommentAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !canManageContent(user.role)) return;
  const id = String(formData.get("id") ?? "");
  const action = String(formData.get("action") ?? "");
  if (action === "approve") await run("UPDATE comments SET status='approved' WHERE id=?", id);
  if (action === "reject") await run("UPDATE comments SET status='rejected' WHERE id=?", id);
  if (action === "delete") await run("DELETE FROM comments WHERE id=?", id);
  revalidatePath("/admin/comments");
}

export async function addCommentAction(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  const articleId = String(formData.get("article_id") ?? "");
  const name = String(formData.get("name") ?? user?.name ?? "").trim();
  const email = String(formData.get("email") ?? user?.email ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (name.length < 2) return { ok: false, message: "Add your name." };
  if (body.length < 4) return { ok: false, message: "Write a comment first." };
  await run(
    "INSERT INTO comments (id, article_id, user_id, author_name, author_email, body, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'pending', datetime('now'))",
    `cmt-${randomToken(6)}`, articleId, user?.id ?? null, name, email || null, body,
  );
  revalidatePath(`/article`);
  return { ok: true, message: "Thank you — your comment is with the moderators and will appear once approved." };
}

/* --------------------------------- users -------------------------------- */

export async function saveUserAction(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || !canManageUsers(user.role)) return { ok: false, message: "Administrator permissions are required." };
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "subscriber");
  const title = String(formData.get("title") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (id) {
    if (role === "super_admin" && user.role !== "super_admin") return { ok: false, message: "Only a super administrator can grant that role." };
    await run("UPDATE users SET name=?, email=?, role=?, title=? WHERE id=?", name, email, role, title || null, id);
    if (password.length >= 8) await run("UPDATE users SET password_hash=? WHERE id=?", await hashPassword(password), id);
    revalidatePath("/admin/users");
    return { ok: true, message: "User updated." };
  }

  if (!name || !email) return { ok: false, message: "Name and email are required." };
  if (password.length < 8) return { ok: false, message: "Set a password of at least 8 characters." };
  const clash = await one("SELECT id FROM users WHERE lower(email)=lower(?)", email);
  if (clash) return { ok: false, message: "That email is already registered." };
  let slug = slugify(name) || "contributor";
  if (await one("SELECT id FROM users WHERE slug=?", slug)) slug = `${slug}-${randomToken(2)}`;
  await run(
    "INSERT INTO users (id, email, password_hash, name, slug, role, title, email_verified, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))",
    `usr-${randomToken(6)}`, email, await hashPassword(password), name, slug, role, title || null,
  );
  revalidatePath("/admin/users");
  return { ok: true, message: `${name} added as ${role.replace("_", " ")}.` };
}

export async function deleteUserAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !canManageUsers(user.role)) return;
  const id = String(formData.get("id") ?? "");
  if (id === user.id) return;
  await run("DELETE FROM users WHERE id = ?", id);
  revalidatePath("/admin/users");
}

/* ------------------------------- settings ------------------------------- */

export async function saveSettingsAction(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "super_admin") return { ok: false, message: "Only a super administrator can change site settings." };
  const entries = Array.from(formData.entries()).filter(([k]) => k.startsWith("setting__"));
  for (const [key, value] of entries) {
    const cleanKey = key.replace("setting__", "");
    const v = value === "on" ? "true" : String(value);
    await run(
      "INSERT INTO site_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      cleanKey, v,
    );
  }
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  return { ok: true, message: "Settings saved." };
}

/* --------------------------------- ads ---------------------------------- */

export async function saveAdAction(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || !canManageContent(user.role)) return { ok: false, message: "Editorial permissions are required." };
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const placement = String(formData.get("placement") ?? "sidebar");
  const body = String(formData.get("body") ?? "").trim();
  const link = String(formData.get("link_url") ?? "").trim();
  const advertiser = String(formData.get("advertiser") ?? "").trim();
  const image = String(formData.get("image_url") ?? "").trim();
  if (!name) return { ok: false, message: "Name the placement." };
  if (id) {
    await run("UPDATE advertisements SET name=?, placement=?, body=?, link_url=?, advertiser=?, image_url=? WHERE id=?",
      name, placement, body, link, advertiser, image || null, id);
  } else {
    await run(
      "INSERT INTO advertisements (id, name, placement, body, link_url, advertiser, image_url, active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))",
      `ad-${randomToken(5)}`, name, placement, body, link, advertiser, image || null,
    );
  }
  revalidatePath("/admin/ads");
  revalidatePath("/", "layout");
  return { ok: true, message: "Placement saved." };
}

export async function toggleAdAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !canManageContent(user.role)) return;
  await run("UPDATE advertisements SET active = CASE active WHEN 1 THEN 0 ELSE 1 END WHERE id=?", String(formData.get("id") ?? ""));
  revalidatePath("/admin/ads");
  revalidatePath("/", "layout");
}

export async function deleteAdAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !canManageContent(user.role)) return;
  await run("DELETE FROM advertisements WHERE id=?", String(formData.get("id") ?? ""));
  revalidatePath("/admin/ads");
}

export async function updateContactMessageAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !canManageUsers(user.role)) return;
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "read");
  await run("UPDATE contact_messages SET status = ? WHERE id = ?", status, id);
  revalidatePath("/admin/settings");
}

export async function exportAnalyticsCsvAction(): Promise<ActionState> {
  const user = await requireEditor().catch(() => null);
  if (!user) return { ok: false, message: "Editorial permissions are required." };
  const rows = await all<{ day: string; views: number; uniques: number }>(
    `SELECT date(created_at) AS day, COUNT(*) AS views, COUNT(DISTINCT session_id) AS uniques
     FROM analytics_events GROUP BY date(created_at) ORDER BY day DESC LIMIT 90`,
  );
  const csv = ["date,views,unique_visitors", ...rows.map((r) => `${r.day},${r.views},${r.uniques}`)].join("\n");
  return { ok: true, message: csv };
}

export async function trackAdClickAction(adId: string): Promise<void> {
  await requireUser().catch(() => null);
  await run("UPDATE advertisements SET clicks = clicks + 1 WHERE id = ?", adId);
}

/** Lightweight autosave used by the rich-text editor. Does not redirect. */
export async function autosaveDraftAction(formData: FormData): Promise<{ ok: boolean; message: string; savedAt: string }> {
  const user = await getCurrentUser();
  const savedAt = new Date().toISOString().slice(11, 16);
  if (!user) return { ok: false, message: "Session expired — sign in again to autosave.", savedAt };
  if (!canManageContent(user.role) && user.role !== "author") {
    return { ok: false, message: "You do not have permission to edit this article.", savedAt };
  }
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, message: "Autosave runs once the draft is created.", savedAt };

  const article = await one<{ author_id: string | null }>("SELECT author_id FROM articles WHERE id = ?", id);
  if (!article) return { ok: false, message: "That article no longer exists.", savedAt };
  if (user.role === "author" && article.author_id !== user.id) {
    return { ok: false, message: "You can only edit your own drafts.", savedAt };
  }

  await run(
    "UPDATE articles SET title = COALESCE(NULLIF(?, ''), title), dek = ?, content_html = COALESCE(NULLIF(?, ''), content_html), reading_minutes = ?, updated_at = datetime('now') WHERE id = ?",
    String(formData.get("title") ?? ""), String(formData.get("dek") ?? ""), String(formData.get("content_html") ?? ""),
    readingTime(String(formData.get("content_html") ?? "")), id,
  );
  return { ok: true, message: "Autosaved", savedAt };
}
