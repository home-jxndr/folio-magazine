import type { D1DatabaseLike } from "./d1";

export type { D1DatabaseLike };

export async function all<T = Record<string, unknown>>(sql: string, ...params: unknown[]): Promise<T[]> {
  console.warn("D1 database not configured for Vercel deployment");
  return [];
}

export async function one<T = Record<string, unknown>>(sql: string, ...params: unknown[]): Promise<T | null> {
  console.warn("D1 database not configured for Vercel deployment");
  return null;
}

export async function run(sql: string, ...params: unknown[]): Promise<void> {
  console.warn("D1 database not configured for Vercel deployment");
}
;

