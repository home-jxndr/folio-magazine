"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { toggleBookmarkAction, recordReadAction, recordShareAction } from "@/app/actions/account";
import { IDLE } from "@/lib/action-types";

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const doc = document.documentElement;
        const total = doc.scrollHeight - window.innerHeight;
        setProgress(total > 0 ? Math.min(100, Math.max(0, (window.scrollY / total) * 100)) : 0);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="fixed left-0 top-0 z-[60] h-[2px] w-full bg-transparent" aria-hidden>
      <div className="h-full bg-accent transition-[width] duration-100 ease-out" style={{ width: `${progress}%` }} />
    </div>
  );
}

export function ViewTracker({ articleId, slug }: { articleId: string; slug: string }) {
  const lastSaved = useRef(0);

  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId, slug }),
      keepalive: true,
    }).catch(() => undefined);
  }, [articleId, slug]);

  useEffect(() => {
    let frame = 0;
    const report = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const pct = total > 0 ? Math.min(100, Math.round((window.scrollY / total) * 100)) : 100;
      if (pct - lastSaved.current >= 15 || (pct >= 95 && lastSaved.current < 95)) {
        lastSaved.current = pct;
        recordReadAction(articleId, pct).catch(() => undefined);
      }
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(report);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("beforeunload", report);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("beforeunload", report);
      report();
    };
  }, [articleId]);

  return null;
}

export function ArticleActions({
  articleId,
  title,
  slug,
  initialSaved,
  signedIn,
}: {
  articleId: string;
  title: string;
  slug: string;
  initialSaved: boolean;
  signedIn: boolean;
}) {
  const [state, formAction] = useActionState(toggleBookmarkAction, IDLE);
  const [saved, setSaved] = useState(initialSaved);
  const [copied, setCopied] = useState(false);
  const [readingMode, setReadingMode] = useState(false);

  useEffect(() => {
    if (state.ok && state.message.startsWith("Saved")) setSaved(true);
    if (state.ok && state.message.startsWith("Removed")) setSaved(false);
  }, [state]);

  const url = typeof window !== "undefined" ? `${window.location.origin}/article/${slug}` : `/article/${slug}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
      recordShareAction(articleId).catch(() => undefined);
    } catch {
      setCopied(false);
    }
  }

  function toggleReadingMode() {
    const next = !readingMode;
    setReadingMode(next);
    document.documentElement.classList.toggle("reading-mode", next);
    if (next) window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <form action={formAction}>
          <input type="hidden" name="article_id" value={articleId} />
          <button
            type="submit"
            aria-pressed={saved}
            className={`inline-flex items-center gap-2 border px-3 py-2 font-sans text-[10px] uppercase tracking-kicker transition-colors ${
              saved ? "border-accent bg-accent text-white" : "border-rule hover:border-ink"
            }`}
          >
            <svg width="12" height="14" viewBox="0 0 12 14" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.4" aria-hidden>
              <path d="M1 1h10v12L6 9.6 1 13z" />
            </svg>
            {saved ? "Saved" : "Save"}
          </button>
        </form>

        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center gap-2 border border-rule px-3 py-2 font-sans text-[10px] uppercase tracking-kicker transition-colors hover:border-ink"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
            <rect x="9" y="9" width="11" height="11" />
            <path d="M5 15V5h10" />
          </svg>
          {copied ? "Link copied" : "Copy link"}
        </button>

        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noreferrer noopener"
          onClick={() => recordShareAction(articleId).catch(() => undefined)}
          className="inline-flex h-[34px] w-[34px] items-center justify-center border border-rule font-sans text-[10px] uppercase transition-colors hover:border-ink"
          aria-label="Share on X"
        >
          X
        </a>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noreferrer noopener"
          onClick={() => recordShareAction(articleId).catch(() => undefined)}
          className="inline-flex h-[34px] w-[34px] items-center justify-center border border-rule font-sans text-[10px] uppercase transition-colors hover:border-ink"
          aria-label="Share on LinkedIn"
        >
          in
        </a>
        <a
          href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`}
          className="inline-flex h-[34px] w-[34px] items-center justify-center border border-rule transition-colors hover:border-ink"
          aria-label="Share by email"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <rect x="3" y="5" width="18" height="14" />
            <path d="M3 6l9 7 9-7" />
          </svg>
        </a>

        <button
          type="button"
          onClick={toggleReadingMode}
          aria-pressed={readingMode}
          className="inline-flex items-center gap-2 border border-rule px-3 py-2 font-sans text-[10px] uppercase tracking-kicker transition-colors hover:border-ink"
        >
          {readingMode ? "Exit focus mode" : "Focus mode"}
        </button>
      </div>

      {!signedIn && (
        <p className="font-sans text-[11px] text-ink-soft">
          <Link href={`/login?next=/article/${slug}`} className="underline">Sign in</Link> to keep this in your reading list.
        </p>
      )}
      {state.message && (
        <p role="status" aria-live="polite" className={`font-sans text-[11px] ${state.ok ? "text-ink-soft" : "text-accent"}`}>
          {state.message}{" "}
          {!state.ok && (
            <Link href={`/login?next=/article/${slug}`} className="underline">Sign in</Link>
          )}
        </p>
      )}
    </div>
  );
}
