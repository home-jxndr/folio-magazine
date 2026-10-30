"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "./theme-toggle";
import { signOutAction } from "@/app/actions/auth";

type NavCategory = { slug: string; name: string };
type HeaderUser = { name: string; role: string; slug: string } | null;

const dateLine = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Lisbon",
}).format(new Date());

export function SiteHeader({ categories, user, issue }: { categories: NavCategory[]; user: HeaderUser; issue: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 120);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen || searchOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen, searchOpen]);

  const isStaff = user && ["super_admin", "admin", "editor", "author"].includes(user.role);

  return (
    <>
      <div className="hidden border-b border-rule bg-paper lg:block">
        <div className="mx-auto flex h-9 max-w-sheet items-center justify-between px-6 font-sans text-[10px] uppercase tracking-kicker text-ink-soft">
          <span>{dateLine}</span>
          <span className="text-ink-soft">Independent since 2016 · Lisbon</span>
          <div className="flex items-center gap-5">
            <Link href="/newsletter" className="transition-colors hover:text-accent">
              Newsletters
            </Link>
            {isStaff && (
              <Link href="/admin" className="transition-colors hover:text-accent">
                Editorial desk
              </Link>
            )}
            {user ? (
              <Link href="/account" className="transition-colors hover:text-accent">
                {user.name.split(" ")[0]}&rsquo;s account
              </Link>
            ) : (
              <Link href="/login" className="transition-colors hover:text-accent">
                Sign in
              </Link>
            )}
            <Link href="/membership" className="text-accent transition-opacity hover:opacity-70">
              Subscribe
            </Link>
          </div>
        </div>
      </div>

      <header className="border-b border-rule bg-paper">
        <div className="mx-auto flex max-w-sheet items-end justify-between gap-4 px-5 pb-5 pt-6 sm:px-6 lg:pb-7 lg:pt-9">
          <div className="flex flex-1 items-center gap-3 lg:gap-0">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="flex h-9 items-center gap-2 font-sans text-[10px] uppercase tracking-kicker text-ink lg:hidden"
              aria-label="Open menu"
              aria-expanded={menuOpen}
            >
              <span className="flex flex-col gap-[4px]" aria-hidden>
                <span className="block h-px w-5 bg-ink" />
                <span className="block h-px w-5 bg-ink" />
                <span className="block h-px w-5 bg-ink" />
              </span>
              Menu
            </button>
            <div className="hidden flex-1 font-sans text-[10px] uppercase tracking-kicker text-ink-soft lg:block">
              {issue}
            </div>
          </div>

          <Link href="/" aria-label="FOLIO — home" className="group flex flex-col items-center">
            <span className="font-display text-[2.1rem] font-semibold leading-none tracking-[0.26em] text-ink sm:text-[2.9rem] lg:text-[3.4rem]">
              FOLIO
            </span>
            <span className="mt-1.5 hidden font-sans text-[8.5px] uppercase tracking-wide2 text-ink-soft sm:block">
              Ideas · Culture · The Modern World
            </span>
          </Link>

          <div className="flex flex-1 items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="inline-flex h-9 items-center gap-2 border border-transparent px-2 font-sans text-[10px] uppercase tracking-kicker text-ink transition-colors hover:border-rule"
              aria-label="Search FOLIO"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                <circle cx="10.5" cy="10.5" r="6.5" />
                <path d="M15.5 15.5L21 21" />
              </svg>
              <span className="hidden sm:inline">Search</span>
            </button>
            <ThemeToggle />
            {user ? (
              <Link
                href="/account"
                className="hidden h-9 items-center border border-rule px-3 font-sans text-[10px] uppercase tracking-kicker hover:border-ink sm:inline-flex"
              >
                My FOLIO
              </Link>
            ) : (
              <Link
                href="/register"
                className="hidden h-9 items-center border border-ink bg-ink px-3 font-sans text-[10px] uppercase tracking-kicker text-paper transition-colors hover:bg-accent sm:inline-flex"
              >
                Join
              </Link>
            )}
          </div>
        </div>
      </header>

      <nav
        aria-label="Sections"
        className={`sticky top-0 z-40 border-b border-rule bg-paper/95 backdrop-blur transition-shadow ${scrolled ? "shadow-[0_1px_0_0_var(--rule)]" : ""}`}
      >
        <div className="mx-auto flex max-w-sheet items-center gap-1 overflow-x-auto px-5 no-scrollbar sm:px-6">
          <Link
            href="/latest"
            className="shrink-0 border-b-2 border-transparent px-3 py-3 font-sans text-[10.5px] font-semibold uppercase tracking-kicker text-ink transition-colors hover:border-accent hover:text-accent"
          >
            Latest
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className={`shrink-0 border-b-2 px-3 py-3 font-sans text-[10.5px] font-semibold uppercase tracking-kicker transition-colors hover:border-accent hover:text-accent ${
                pathname === `/category/${c.slug}` ? "border-accent text-accent" : "border-transparent text-ink"
              }`}
            >
              {c.name}
            </Link>
          ))}
          <span className="ml-auto hidden shrink-0 items-center gap-1 pl-4 lg:flex">
            <Link
              href="/newsletter/archive"
              className="px-3 py-3 font-sans text-[10.5px] uppercase tracking-kicker text-ink-soft transition-colors hover:text-accent"
            >
              Archive
            </Link>
            <Link
              href="/membership"
              className="px-3 py-3 font-sans text-[10.5px] font-semibold uppercase tracking-kicker text-accent"
            >
              Membership
            </Link>
          </span>
        </div>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-paper lg:hidden">
          <div className="flex items-center justify-between border-b border-rule px-5 py-5">
            <span className="font-display text-2xl tracking-[0.24em]">FOLIO</span>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="font-sans text-[10px] uppercase tracking-kicker"
              aria-label="Close menu"
            >
              Close
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-6">
            <p className="kicker-muted mb-3">Sections</p>
            <ul className="mb-8 divide-y divide-rule border-y border-rule">
              <li>
                <Link href="/latest" className="block py-3.5 font-display text-2xl">
                  Latest stories
                </Link>
              </li>
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link href={`/category/${c.slug}`} className="block py-3.5 font-display text-2xl">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="kicker-muted mb-3">Your FOLIO</p>
            <ul className="mb-8 space-y-3 border-y border-rule py-4 font-sans text-sm">
              {user ? (
                <>
                  <li><Link href="/account">Account &amp; profile</Link></li>
                  <li><Link href="/account/saved">Saved articles</Link></li>
                  <li><Link href="/account/subscriptions">Newsletter settings</Link></li>
                  {isStaff && <li><Link href="/admin">Editorial desk</Link></li>}
                  <li>
                    <form action={signOutAction}>
                      <button type="submit" className="text-accent">Sign out</button>
                    </form>
                  </li>
                </>
              ) : (
                <>
                  <li><Link href="/login">Sign in</Link></li>
                  <li><Link href="/register">Create an account</Link></li>
                </>
              )}
              <li><Link href="/newsletter">Subscribe to newsletters</Link></li>
            </ul>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setSearchOpen(true);
              }}
              className="w-full border border-ink px-4 py-3 font-sans text-[10px] uppercase tracking-kicker"
            >
              Search FOLIO
            </button>
          </div>
        </div>
      )}

      {searchOpen && <SearchPanel onClose={() => setSearchOpen(false)} onNavigate={(href) => { setSearchOpen(false); router.push(href); }} />}
    </>
  );
}

function SearchPanel({ onClose, onNavigate }: { onClose: () => void; onNavigate: (href: string) => void }) {
  const [value, setValue] = useState("");
  const [results, setResults] = useState<{ title: string; slug: string; category: string | null; author: string | null }[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(value.trim())}`, { signal: controller.signal });
        if (res.ok) {
          const data = (await res.json()) as { results: typeof results };
          setResults(data.results ?? []);
        }
      } catch {
        /* aborted */
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [value]);

  return (
    <div className="fixed inset-0 z-50 bg-paper/98 backdrop-blur-sm">
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-6">
        <div className="flex items-center justify-between">
          <span className="kicker">Search the archive</span>
          <button type="button" onClick={onClose} className="font-sans text-[10px] uppercase tracking-kicker">
            Close (Esc)
          </button>
        </div>
        <form
          className="mt-6 border-b-2 border-ink pb-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (value.trim()) onNavigate(`/search?q=${encodeURIComponent(value.trim())}`);
          }}
        >
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Search articles, authors, sections…"
            aria-label="Search articles"
            className="w-full bg-transparent font-display text-2xl outline-none placeholder:text-ink-soft/50 sm:text-3xl"
          />
        </form>
        <div className="mt-6">
          {loading && <p className="font-sans text-xs text-ink-soft">Searching…</p>}
          {!loading && value.trim().length >= 2 && results.length === 0 && (
            <p className="font-sans text-sm text-ink-soft">No matches yet. Try a different word, or browse a section.</p>
          )}
          <ul className="divide-y divide-rule">
            {results.map((r) => (
              <li key={r.slug}>
                <button
                  type="button"
                  onClick={() => onNavigate(`/article/${r.slug}`)}
                  className="group flex w-full items-baseline justify-between gap-4 py-4 text-left"
                >
                  <span className="font-display text-lg leading-snug group-hover:text-accent">{r.title}</span>
                  <span className="shrink-0 font-sans text-[10px] uppercase tracking-kicker text-ink-soft">
                    {r.category ?? "Story"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {value.trim().length >= 2 && (
            <button
              type="button"
              onClick={() => onNavigate(`/search?q=${encodeURIComponent(value.trim())}`)}
              className="mt-6 font-sans text-[10px] uppercase tracking-kicker text-accent"
            >
              See all results for “{value.trim()}”
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
