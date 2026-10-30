// Seed database on first run
export async function seedDB(db: Database) {
  // Check if articles exist
  const existing = await db.execute("SELECT COUNT(*) FROM articles");
  if (existing[0].count === 0) {
    // Insert seed data
    for (const article of SEED_ARTICLES) {
      await db.execute(INSERT_ARTICLE, [
        article.title,
        article.slug,
        article.excerpt,
        article.content,
        article.image,
        new Date().toISOString(),
      ]);
    }
    // Insert seed users
    for (const user of SEED_USERS) {
      const hashedPassword = await hashPassword(user.password);
      await db.execute(
        "INSERT INTO users (email, name, password, role) VALUES (?, ?, ?, ?)",
        [user.email, user.name, hashedPassword, user.role]
      );
    }
  }
}

async function hashPassword(password: string): Promise<string> {
  // In production, use bcrypt or similar
  return password; // Placeholder
}