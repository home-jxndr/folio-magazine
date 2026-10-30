import { NextResponse } from "next/server";
import { one, run } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.redirect(new URL("/", request.url));

  const ad = await one<{ link_url: string | null }>("SELECT link_url FROM advertisements WHERE id = ?", id);
  await run("UPDATE advertisements SET clicks = clicks + 1 WHERE id = ?", id);

  const target = ad?.link_url || "/";
  return NextResponse.redirect(new URL(target, request.url));
}
