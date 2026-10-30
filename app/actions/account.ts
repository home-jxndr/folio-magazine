"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { one, run } from "@/lib/db";
import { randomToken } from "@/lib/password";
import type { ActionState } from "@/lib/action-types";

export async function toggleBookmarkAction(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  const articleId = String(formData.get("article_id") ?? "");
  if (!user) return { ok: false, message: "Sign in to save articles to your reading list." };
  if (!articleId) return { ok: false, message: "Missing article." };

  const existing = await one("SELECT 1 AS x FROM bookmarks WHERE user_id = ? AND article_id = ?", user.id, articleId);
  if (existing) {
    await run("DELETE FROM bookmarks WHERE user_id = ? AND article_id = ?", user.id, articleId);
    revalidatePath("/account/saved");
    return { ok: true, message: "Removed from saved articles." };
  }
  await run("INSERT INTO bookmarks (user_id, article_id, created_at) VALUES (?, ?, datetime('now'))", user.id, articleId);
  revalidatePath("/account/saved");
  return { ok: true, message: "Saved to your reading list." };
}

export async function removeBookmarkAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  await run("DELETE FROM bookmarks WHERE user_id = ? AND article_id = ?", user.id, String(formData.get("article_id") ?? ""));
  revalidatePath("/account/saved");
}

export async function recordReadAction(articleId: string, progress: number): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !articleId) return;
  const clamped = Math.max(1, Math.min(100, Math.round(progress)));
  const existing = await one<{ id: string }>("SELECT id FROM reading_history WHERE user_id = ? AND article_id = ?", user.id, articleId);
  if (existing) {
    await run("UPDATE reading_history SET progress = ?, read_at = datetime('now') WHERE id = ?", clamped, existing.id);
  } else {
    await run(
      "INSERT INTO reading_history (id, user_id, article_id, progress, read_at) VALUES (?, ?, ?, ?, datetime('now'))",
      `hist-${randomToken(6)}`, user.id, articleId, clamped,
    );
  }
  revalidatePath("/account/history");
}

export async function removeHistoryEntryAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  await run("DELETE FROM reading_history WHERE user_id = ? AND article_id = ?", user.id, String(formData.get("article_id") ?? ""));
  revalidatePath("/account/history");
}

export async function clearHistoryAction(): Promise<void> {
  const user = await requireUser();
  await run("DELETE FROM reading_history WHERE user_id = ?", user.id);
  revalidatePath("/account/history");
}

export async function recordShareAction(articleId: string): Promise<void> {
  await run(
    "INSERT INTO analytics_events (id, article_id, kind, source, session_id, created_at) VALUES (?, ?, 'share', 'social', ?, datetime('now'))",
    `evt-${randomToken(6)}`, articleId, randomToken(4),
  );
}
