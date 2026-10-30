"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { authenticate, createSession, destroySession, getCurrentUser, requireUser } from "@/lib/auth";
import { all, one, run } from "@/lib/db";
import { hashPassword, randomToken, verifyPassword } from "@/lib/password";
import { isEmail, slugify } from "@/lib/utils";
import type { ActionState } from "@/lib/action-types";

export async function signInAction(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/account");
  const errors: Record<string, string> = {};
  if (!isEmail(email)) errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Enter your password.";
  if (Object.keys(errors).length) return { ok: false, message: "Check the highlighted fields.", errors };

  const user = await authenticate(email, password);
  if (!user) return { ok: false, message: "Those credentials do not match an account." };
  await createSession(user.id);
  revalidatePath("/", "layout");
  redirect(next.startsWith("/") ? next : "/account");
}

export async function registerAction(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const consent = formData.get("consent");
  const subscribe = formData.get("subscribe");
  const frequency = String(formData.get("frequency") ?? "weekly");
  const errors: Record<string, string> = {};

  if (name.length < 2) errors.name = "Tell us your name.";
  if (!isEmail(email)) errors.email = "Enter a valid email address.";
  if (password.length < 8) errors.password = "Use at least 8 characters.";
  if (!consent) errors.consent = "You must accept the privacy notice to create an account.";
  if (Object.keys(errors).length) return { ok: false, message: "Check the highlighted fields.", errors };

  const existing = await one("SELECT id FROM users WHERE lower(email) = lower(?)", email);
  if (existing) return { ok: false, message: "An account with that email already exists. Try signing in." };

  let slug = slugify(name) || "reader";
  const clash = await one("SELECT id FROM users WHERE slug = ?", slug);
  if (clash) slug = `${slug}-${Math.floor(Math.random() * 900 + 100)}`;

  const id = `usr-${randomToken(8)}`;
  await run(
    `INSERT INTO users (id, email, password_hash, name, slug, role, email_verified, created_at)
     VALUES (?, ?, ?, ?, ?, 'subscriber', 1, datetime('now'))`,
    id, email, await hashPassword(password), name, slug,
  );

  if (subscribe) {
    const token = randomToken(12);
    const existingSub = await one<{ id: string; status: string }>("SELECT id, status FROM subscribers WHERE lower(email) = lower(?)", email);
    if (existingSub) {
      await run("UPDATE subscribers SET status='confirmed', frequency=?, confirmed_at=datetime('now'), token=? WHERE id=?", frequency, token, existingSub.id);
    } else {
      await run(
        `INSERT INTO subscribers (id, email, name, status, frequency, topics, token, source, confirmed_at, created_at)
         VALUES (?, ?, ?, 'confirmed', ?, ?, ?, 'registration', datetime('now'), datetime('now'))`,
        `sub-${randomToken(6)}`, email, name, frequency, JSON.stringify(["sunday-edition"]), token,
      );
    }
  }

  await createSession(id);
  revalidatePath("/", "layout");
  redirect("/account?welcome=1");
}

export async function signOutAction(): Promise<void> {
  await destroySession();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function forgotPasswordAction(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!isEmail(email)) return { ok: false, message: "Enter the email address on your account." };
  const user = await one<{ id: string }>("SELECT id FROM users WHERE lower(email) = lower(?)", email);
  // Always answer the same way so the form cannot be used to enumerate accounts.
  if (!user) {
    return { ok: true, message: "If an account exists for that address, a reset link has been prepared." };
  }
  const token = randomToken(24);
  const expires = new Date(Date.now() + 3600_000).toISOString().slice(0, 19).replace("T", " ");
  await run("UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?", token, expires, user.id);
  return {
    ok: true,
    message:
      "A reset link is ready. Email delivery is not configured on this installation, so the secure link is shown here instead.",
    link: { href: `/reset-password?token=${token}`, label: "Open reset link" },
  };
}

export async function resetPasswordAction(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) return { ok: false, message: "Use at least 8 characters." };
  if (password !== confirm) return { ok: false, message: "The two passwords do not match." };
  const user = await one<{ id: string }>(
    "SELECT id FROM users WHERE reset_token = ? AND reset_expires > datetime('now')", token,
  );
  if (!user) return { ok: false, message: "That reset link is invalid or has expired. Request a new one." };
  await run("UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?", await hashPassword(password), user.id);
  return { ok: true, message: "Password updated. You can now sign in." };
}

export async function updateProfileAction(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Sign in to update your profile." };
  const name = String(formData.get("name") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const avatar = String(formData.get("avatar_url") ?? "").trim();
  const twitter = String(formData.get("twitter") ?? "").trim();
  if (name.length < 2) return { ok: false, message: "Your name is required.", errors: { name: "Enter your name." } };
  await run(
    "UPDATE users SET name = ?, title = ?, bio = ?, avatar_url = ?, twitter = ? WHERE id = ?",
    name, title || null, bio || null, avatar || null, twitter.replace(/^@/, "") || null, user.id,
  );
  revalidatePath("/account");
  revalidatePath(`/author/${user.slug}`);
  return { ok: true, message: "Profile saved." };
}

export async function changePasswordAction(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return { ok: false, message: "Sign in first." };
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (next.length < 8) return { ok: false, message: "New password must be at least 8 characters." };
  if (next !== confirm) return { ok: false, message: "New passwords do not match." };
  const row = await one<{ password_hash: string }>("SELECT password_hash FROM users WHERE id = ?", sessionUser.id);
  if (!row || !(await verifyPassword(current, row.password_hash))) {
    return { ok: false, message: "Your current password is incorrect." };
  }
  await run("UPDATE users SET password_hash = ? WHERE id = ?", await hashPassword(next), sessionUser.id);
  return { ok: true, message: "Password changed." };
}

export async function contactAction(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("message") ?? "").trim();
  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = "Enter your name.";
  if (!isEmail(email)) errors.email = "Enter a valid email address.";
  if (body.length < 12) errors.message = "Please give us a little more detail.";
  if (Object.keys(errors).length) return { ok: false, message: "Check the highlighted fields.", errors };
  await run(
    "INSERT INTO contact_messages (id, name, email, subject, body, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))",
    `msg-${randomToken(8)}`, name, email, subject || "General enquiry", body,
  );
  return { ok: true, message: "Message received. The desk reads everything and replies within two working days." };
}

export async function setReadingPreferenceAction(formData: FormData): Promise<void> {
  const theme = String(formData.get("theme") ?? "light");
  const { cookies } = await import("next/headers");
  const store = await cookies();
  store.set("folio_reading", theme, { path: "/", maxAge: 31536000, sameSite: "lax" });
  revalidatePath("/account");
}

export async function markAllNotificationsReadAction(): Promise<void> {
  await requireUser();
  revalidatePath("/admin");
}

export async function exportSubscribersCsvAction(): Promise<ActionState> {
  const user = await requireUser();
  if (!["super_admin", "admin", "editor"].includes(user.role)) return { ok: false, message: "Not permitted." };
  const rows = await all<{ email: string; name: string; status: string; frequency: string; created_at: string }>(
    "SELECT email, name, status, frequency, created_at FROM subscribers ORDER BY created_at DESC",
  );
  const csv = ["email,name,status,frequency,created_at", ...rows.map((r) => [r.email, r.name ?? "", r.status, r.frequency, r.created_at].join(","))].join("\n");
  return { ok: true, message: csv };
}
