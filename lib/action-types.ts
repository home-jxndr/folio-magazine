export type ActionState = {
  ok: boolean;
  message: string;
  errors?: Record<string, string>;
  /** Optional link surfaced when email delivery is not configured. */
  link?: { href: string; label: string };
};

export const IDLE: ActionState = { ok: false, message: "" };
