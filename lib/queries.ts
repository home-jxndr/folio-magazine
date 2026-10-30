import { all, one } from "./db";

export type ArticleSummary = {
  id: string;
  slug: string;
  title: string;
  dek: string | null;
  excerpt: string | null;
  content_html: string;
  cover_url: string | null;
  cover_caption: string | null;
  cover_alt: string | null;
  category_id: string | null;
  author_id: string | null;
  status: string;
  featured: number;
  editors_pick: number;
  breaking: number;
  collection: string | null;
  views: number;
  reading_minutes: number;
  published_at: string | null;
  updated_at: string;
  created_at: string;
  preview_token: string | null;
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  category_name: string | null;
  category_slug: string | null;
  category_accent: string | null;
  author_name: string | null;
  author_slug: string | null;
  author_avatar: string | null;
  author_title: string | null;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  accent: string | null;
  sort_order: number;
  article_count?: number;
};

export type Author = {
  id: string;
  name: string;
  slug: string;
  title: string | null;
  bio: string | null;
  avatar_url: string | null;
  twitter: string | null;
  role: string;
  article_count?: number;
};

const ARTICLE_SELECT = `
  SELECT a.*, c.name AS category_name, c.slug AS category_slug, c.accent AS category_accent,
         u.name AS author_name, u.slug AS author_slug, u.avatar_url AS author_avatar, u.title AS author_title
  FROM articles a
  LEFT JOIN categories c ON c.id = a.category_id
  LEFT JOIN users u ON u.id = a.author_id`;

const LIVE = "a.status = 'published' AND (a.published_at IS NULL OR a.published_at <= datetime('now'))";

export type ListOptions = {
  limit?: number;
  offset?: number;
  category?: string;
  tag?: string;
  author?: string;
  q?: string;
  featured?: boolean;
  pick?: boolean;
  breaking?: boolean;
  collection?: string;
  from?: string;
  to?: string;
  sort?: "latest" | "popular" | "oldest";
  excludeId?: string;
};

function buildWhere(options: ListOptions) {
  const where: string[] = [LIVE];
  const params: unknown[] = [];
  if (options.category) { where.push("c.slug = ?"); params.push(options.category); }
  if (options.tag) {
    where.push("EXISTS (SELECT 1 FROM article_tags at JOIN tags t ON t.id = at.tag_id WHERE at.article_id = a.id AND t.slug = ?)");
    params.push(options.tag);
  }
  if (options.author) { where.push("u.slug = ?"); params.push(options.author); }
  if (options.featured) where.push("a.featured = 1");
  if (options.pick) where.push("a.editors_pick = 1");
  if (options.breaking) where.push("a.breaking = 1");
  if (options.collection) { where.push("a.collection = ?"); params.push(options.collection); }
  if (options.from) { where.push("a.published_at >= ?"); params.push(options.from); }
  if (options.to) { where.push("a.published_at <= ?"); params.push(`${options.to} 23:59:59`); }
  if (options.excludeId) { where.push("a.id != ?"); params.push(options.excludeId); }
  if (options.q) {
    const like = `%${options.q.trim()}%`;
    where.push(`(a.title LIKE ? OR a.dek LIKE ? OR a.content_html LIKE ? OR u.name LIKE ? OR c.name LIKE ?
      OR EXISTS (SELECT 1 FROM article_tags at JOIN tags t ON t.id = at.tag_id WHERE at.article_id = a.id AND t.name LIKE ?))`);
    params.push(like, like, like, like, like, like);
  }
  return { clause: where.join(" AND "), params };
}

export async function listArticles(options: ListOptions = {}): Promise<ArticleSummary[]> {
  const { clause, params } = buildWhere(options);
  const order = options.sort === "popular" ? "a.views DESC" : options.sort === "oldest" ? "a.published_at ASC" : "a.published_at DESC";
  return all<ArticleSummary>(
    `${ARTICLE_SELECT} WHERE ${clause} ORDER BY ${order} LIMIT ? OFFSET ?`,
    ...params, options.limit ?? 12, options.offset ?? 0,
  );
}

export async function countArticles(options: ListOptions = {}): Promise<number> {
  const { clause, params } = buildWhere(options);
  const row = await one<{ n: number }>(
    `SELECT COUNT(*) AS n FROM articles a
     LEFT JOIN categories c ON c.id = a.category_id
     LEFT JOIN users u ON u.id = a.author_id
     WHERE ${clause}`,
    ...params,
  );
  return Number(row?.n ?? 0);
}

export async function getArticleBySlug(slug: string): Promise<ArticleSummary | null> {
  return one<ArticleSummary>(`${ARTICLE_SELECT} WHERE a.slug = ?`, slug);
}

export async function getArticleById(id: string): Promise<ArticleSummary | null> {
  return one<ArticleSummary>(`${ARTICLE_SELECT} WHERE a.id = ?`, id);
}

export async function getArticleByPreview(token: string): Promise<ArticleSummary | null> {
  return one<ArticleSummary>(`${ARTICLE_SELECT} WHERE a.preview_token = ?`, token);
}

export async function getArticleTags(articleId: string) {
  return all<{ id: string; slug: string; name: string }>(
    `SELECT t.id, t.slug, t.name FROM tags t JOIN article_tags at ON at.tag_id = t.id WHERE at.article_id = ? ORDER BY t.name`,
    articleId,
  );
}

export async function getRelated(article: ArticleSummary, limit = 3): Promise<ArticleSummary[]> {
  const rows = await all<ArticleSummary>(
    `${ARTICLE_SELECT} WHERE ${LIVE} AND a.id != ? AND (a.category_id = ? OR a.author_id = ?)
     ORDER BY (a.category_id = ?) DESC, a.published_at DESC LIMIT ?`,
    article.id, article.category_id, article.author_id, article.category_id, limit,
  );
  if (rows.length) return rows;
  return listArticles({ limit });
}

export async function getAdjacent(article: ArticleSummary) {
  const prev = await one<{ slug: string; title: string }>(
    `SELECT slug, title FROM articles WHERE status='published' AND published_at < ? ORDER BY published_at DESC LIMIT 1`,
    article.published_at,
  );
  const next = await one<{ slug: string; title: string }>(
    `SELECT slug, title FROM articles WHERE status='published' AND published_at > ? ORDER BY published_at ASC LIMIT 1`,
    article.published_at,
  );
  return { prev: prev ?? null, next: next ?? null };
}

export async function listCategories(): Promise<Category[]> {
  return all<Category>("SELECT * FROM categories ORDER BY sort_order ASC, name ASC");
}

export async function getCategory(slug: string): Promise<Category | null> {
  return one<Category>("SELECT * FROM categories WHERE slug = ?", slug);
}

export async function listTags(limit = 60) {
  return all<{ id: string; slug: string; name: string; n: number }>(
    `SELECT t.id, t.slug, t.name, COUNT(at.article_id) AS n FROM tags t
     LEFT JOIN article_tags at ON at.tag_id = t.id
     GROUP BY t.id ORDER BY n DESC, t.name ASC LIMIT ?`, limit,
  );
}

export async function getTag(slug: string) {
  return one<{ id: string; slug: string; name: string }>("SELECT * FROM tags WHERE slug = ?", slug);
}

export async function listAuthors(): Promise<Author[]> {
  return all<Author>(
    `SELECT u.id, u.name, u.slug, u.title, u.bio, u.avatar_url, u.twitter, u.role,
       (SELECT COUNT(*) FROM articles a WHERE a.author_id = u.id AND a.status='published') AS article_count
     FROM users u WHERE u.role IN ('super_admin','admin','editor','author') ORDER BY article_count DESC`,
  );
}

export async function getAuthor(slug: string): Promise<Author | null> {
  return one<Author>(
    `SELECT u.id, u.name, u.slug, u.title, u.bio, u.avatar_url, u.twitter, u.role,
       (SELECT COUNT(*) FROM articles a WHERE a.author_id = u.id AND a.status='published') AS article_count
     FROM users u WHERE u.slug = ?`, slug,
  );
}

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await all<{ key: string; value: string }>("SELECT key, value FROM site_settings");
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function getSetting(key: string, fallback = ""): Promise<string> {
  const row = await one<{ value: string }>("SELECT value FROM site_settings WHERE key = ?", key);
  return row?.value ?? fallback;
}

export async function getCollections(): Promise<{ collection: string; n: number; cover: string | null }[]> {
  return all(
    `SELECT a.collection, COUNT(*) AS n, MAX(a.cover_url) AS cover FROM articles a
     WHERE ${LIVE} AND a.collection IS NOT NULL GROUP BY a.collection ORDER BY n DESC`,
  );
}

export async function getBookmarks(userId: string): Promise<ArticleSummary[]> {
  return all<ArticleSummary>(
    `${ARTICLE_SELECT} JOIN bookmarks b ON b.article_id = a.id WHERE b.user_id = ? ORDER BY b.created_at DESC`, userId,
  );
}

export async function isBookmarked(userId: string, articleId: string): Promise<boolean> {
  const row = await one("SELECT 1 AS x FROM bookmarks WHERE user_id = ? AND article_id = ?", userId, articleId);
  return !!row;
}

export async function getHistory(userId: string, limit = 24) {
  return all<ArticleSummary & { progress: number; read_at: string }>(
    `${ARTICLE_SELECT} JOIN reading_history h ON h.article_id = a.id WHERE h.user_id = ? ORDER BY h.read_at DESC LIMIT ?`,
    userId, limit,
  );
}

export async function getSubscriberByEmail(email: string) {
  return one<{
    id: string; email: string; name: string | null; status: string; frequency: string;
    topics: string; token: string; created_at: string; confirmed_at: string | null; source: string | null;
  }>("SELECT * FROM subscribers WHERE lower(email) = lower(?)", email);
}

export async function getSubscriberByToken(token: string) {
  return one<{
    id: string; email: string; name: string | null; status: string; frequency: string;
    topics: string; token: string; created_at: string;
  }>("SELECT * FROM subscribers WHERE token = ?", token);
}

export async function getComments(articleId: string) {
  return all<{ id: string; author_name: string; body: string; created_at: string; avatar_url: string | null }>(
    `SELECT c.id, c.author_name, c.body, c.created_at, u.avatar_url FROM comments c
     LEFT JOIN users u ON u.id = c.user_id
     WHERE c.article_id = ? AND c.status = 'approved' ORDER BY c.created_at DESC`, articleId,
  );
}

export async function getNewsletterEditions(limit = 20) {
  return all<{
    id: string; slug: string; title: string; subject: string | null; preheader: string | null;
    body_html: string; status: string; featured: number; recipients: number; opens: number;
    clicks: number; sent_at: string | null; scheduled_at: string | null; created_at: string;
  }>("SELECT * FROM newsletter_editions ORDER BY COALESCE(sent_at, scheduled_at, created_at) DESC LIMIT ?", limit);
}

export async function getNewsletterEdition(slug: string) {
  return one<{
    id: string; slug: string; title: string; subject: string | null; preheader: string | null;
    body_html: string; status: string; featured: number; recipients: number; opens: number;
    clicks: number; sent_at: string | null; scheduled_at: string | null; created_at: string;
  }>("SELECT * FROM newsletter_editions WHERE slug = ?", slug);
}

export async function getAdminStats() {
  const [counts, subscribers, views, subscriberGrowth] = await Promise.all([
    one<{ published: number; drafts: number; scheduled: number; review: number; total: number }>(
      `SELECT SUM(CASE WHEN status='published' THEN 1 ELSE 0 END) AS published,
              SUM(CASE WHEN status='draft' THEN 1 ELSE 0 END) AS drafts,
              SUM(CASE WHEN status='scheduled' THEN 1 ELSE 0 END) AS scheduled,
              SUM(CASE WHEN status='review' THEN 1 ELSE 0 END) AS review,
              COUNT(*) AS total FROM articles`,
    ),
    one<{ confirmed: number; pending: number; unsub: number; total: number }>(
      `SELECT SUM(CASE WHEN status='confirmed' THEN 1 ELSE 0 END) AS confirmed,
              SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS pending,
              SUM(CASE WHEN status='unsubscribed' THEN 1 ELSE 0 END) AS unsub,
              COUNT(*) AS total FROM subscribers`,
    ),
    one<{ views: number; uniques: number; avg_dwell: number }>(
      `SELECT COALESCE(SUM(views),0) AS views, 0 AS uniques, 0 AS avg_dwell FROM articles`,
    ),
    one<{ n: number }>(`SELECT COUNT(*) AS n FROM subscribers WHERE created_at >= datetime('now','-30 days')`),
  ]);
  const uniques = await one<{ n: number }>("SELECT COUNT(DISTINCT session_id) AS n FROM analytics_events");
  const dwell = await one<{ avg: number }>("SELECT AVG(dwell_seconds) AS avg FROM analytics_events WHERE dwell_seconds > 0");
  return {
    published: Number(counts?.published ?? 0),
    drafts: Number(counts?.drafts ?? 0),
    scheduled: Number(counts?.scheduled ?? 0),
    review: Number(counts?.review ?? 0),
    total: Number(counts?.total ?? 0),
    subscribers: Number(subscribers?.total ?? 0),
    confirmedSubscribers: Number(subscribers?.confirmed ?? 0),
    pendingSubscribers: Number(subscribers?.pending ?? 0),
    unsubscribed: Number(subscribers?.unsub ?? 0),
    newSubscribers: Number(subscriberGrowth?.n ?? 0),
    views: Number(views?.views ?? 0),
    uniques: Number(uniques?.n ?? 0),
    avgDwell: Math.round(Number(dwell?.avg ?? 0)),
  };
}

export async function getPopular(limit = 5, days?: number) {
  if (days) {
    return all<ArticleSummary & { recent: number }>(
      `${ARTICLE_SELECT} WHERE ${LIVE} ORDER BY (SELECT COUNT(*) FROM analytics_events e WHERE e.article_id = a.id AND e.created_at >= datetime('now','-${days} days')) DESC LIMIT ?`,
      limit,
    );
  }
  return listArticles({ limit, sort: "popular" });
}

export async function getAnalyticsSeries(days = 30) {
  return all<{ day: string; views: number; uniques: number }>(
    `SELECT date(created_at) AS day, COUNT(*) AS views, COUNT(DISTINCT session_id) AS uniques
     FROM analytics_events WHERE created_at >= datetime('now', ?) GROUP BY date(created_at) ORDER BY day ASC`,
    `-${days} days`,
  );
}

export async function getTopArticlesByRange(days: number, limit = 8) {
  return all<{ id: string; title: string; slug: string; views: number; category: string | null }>(
    `SELECT a.id, a.title, a.slug, COUNT(e.id) AS views, c.name AS category
     FROM analytics_events e JOIN articles a ON a.id = e.article_id
     LEFT JOIN categories c ON c.id = a.category_id
     WHERE e.created_at >= datetime('now', ?) GROUP BY a.id ORDER BY views DESC LIMIT ?`,
    `-${days} days`, limit,
  );
}

export async function getCategoryBreakdown(days = 30) {
  return all<{ name: string; slug: string; views: number }>(
    `SELECT c.name, c.slug, COUNT(e.id) AS views FROM analytics_events e
     JOIN categories c ON c.id = e.category_id
     WHERE e.created_at >= datetime('now', ?) GROUP BY c.id ORDER BY views DESC`, `-${days} days`,
  );
}

export async function getReferralBreakdown(days = 30) {
  return all<{ source: string; views: number }>(
    `SELECT source, COUNT(*) AS views FROM analytics_events WHERE created_at >= datetime('now', ?) GROUP BY source ORDER BY views DESC`,
    `-${days} days`,
  );
}

export async function getSubscriberSeries(days = 30) {
  return all<{ day: string; n: number }>(
    `SELECT date(created_at) AS day, COUNT(*) AS n FROM subscribers WHERE created_at >= datetime('now', ?) GROUP BY date(created_at) ORDER BY day ASC`,
    `-${days} days`,
  );
}

export async function getActiveAd(placement: string) {
  return one<{ id: string; name: string; body: string | null; image_url: string | null; link_url: string | null; advertiser: string | null }>(
    `SELECT * FROM advertisements WHERE placement = ? AND active = 1
     AND (starts_at IS NULL OR starts_at <= datetime('now')) AND (ends_at IS NULL OR ends_at >= datetime('now'))
     ORDER BY impressions DESC LIMIT 1`, placement,
  );
}

export async function getActivity(limit = 8) {
  return all<{ id: string; actor: string; action: string; target: string; created_at: string }>(
    "SELECT * FROM activity_log ORDER BY created_at DESC LIMIT ?", limit,
  );
}

export async function getTagsFor(articleIds: string[]) {
  if (!articleIds.length) return {} as Record<string, { slug: string; name: string }[]>;
  const placeholders = articleIds.map(() => "?").join(",");
  const rows = await all<{ article_id: string; slug: string; name: string }>(
    `SELECT at.article_id, t.slug, t.name FROM article_tags at JOIN tags t ON t.id = at.tag_id WHERE at.article_id IN (${placeholders})`,
    ...articleIds,
  );
  return rows.reduce<Record<string, { slug: string; name: string }[]>>((acc, r) => {
    (acc[r.article_id] ||= []).push({ slug: r.slug, name: r.name });
    return acc;
  }, {});
}
