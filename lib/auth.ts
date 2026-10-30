import { cookies } from "next/headers";
import { cache } from "react";
import { randomToken, verifyPassword } from "./password";
import { one, run } from "./db";

export type Role = "super_admin" | "admin" | "editor" | "author" | "subscriber";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  slug: string;
  role: Role;
  avatar_url: string | null;
  title: string | null;
  bio: string | null;
  email_verified: number;
};

export const SESSION_COOKIE = "folio_session";
const SESSION_DAYS = 30;

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super administrator",
  admin: "Administrator",
  editor: "Editor",
  author: "Author",
  subscriber: "Subscriber",
};

const STAFF: Role[] = ["super_admin", "admin", "editor", "author"];

export function isStaff(role?: string | null): boolean {
  return STAFF.includes(role as Role);
}

export function canManageContent(role?: string | null): boolean {
  return !!role && ["super_admin", "admin", "editor"].includes(role);
}

export function canManageUsers(role?: string | null): boolean {
  return !!role && ["super_admin", "admin"].includes(role);
}

export function canManageSettings(role?: string | null): boolean {
  return role === "super_admin";
}

export function canAuthor(role?: string | null): boolean {
  return isStaff(role);
}

export async function createSession(userId: string): Promise<string> {
  const token = randomToken(32);
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000).toISOString().slice(0, 19).replace("T", " ");
  await run("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)", token, userId, expires);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_DAYS * 86400,
  });
  return token;
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await run("DELETE FROM sessions WHERE id = ?", token);
  store.delete(SESSION_COOKIE);
}

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const user = await one<SessionUser>(
    `SELECT u.id, u.email, u.name, u.slug, u.role, u.avatar_url, u.title, u.bio, u.email_verified
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.id = ? AND s.expires_at > datetime('now')`,
    token,
  );
  return user ?? null;
});

export async function authenticate(email: string, password: string): Promise<SessionUser | null> {
  const user = await one<SessionUser & { password_hash: string }>(
    "SELECT id, email, name, slug, role, avatar_url, title, bio, email_verified, password_hash FROM users WHERE lower(email) = lower(?)",
    email.trim(),
  );
  if (!user) return null;
  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return null;
  const { password_hash: _ignored, ...rest } = user;
  return rest;
}

export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("You need to sign in to continue.");
  return user;
}

export async function requireStaff(): Promise<SessionUser> {
  const user = await requireUser();
  if (!isStaff(user.role)) throw new Error("You do not have access to the editorial tools.");
  return user;
}

export async function requireEditor(): Promise<SessionUser> {
  const user = await requireUser();
  if (!canManageContent(user.role)) throw new Error("Editorial permissions are required for that action.");
  return user;
}
