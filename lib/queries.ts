// Database queries
export const SELECT_ARTICLES = "SELECT * FROM articles ORDER BY created_at DESC";
export const INSERT_ARTICLE = "INSERT INTO articles (title, slug, excerpt, content, image, created_at) VALUES (?, ?, ?, ?, ?, ?)";
export const SELECT_ARTICLE_BY_SLUG = "SELECT * FROM articles WHERE slug = ?";
export const SELECT_LATEST_ARTICLES = "SELECT * FROM articles ORDER BY created_at DESC LIMIT 5";
export const SELECT_TAGS = "SELECT DISTINCT tag FROM articles WHERE tag IS NOT NULL";