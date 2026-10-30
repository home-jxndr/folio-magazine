"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const groups: { title: string; links: { href: string; label: string; badge?: string }[] }[] = [
  {
    title: "Overview",
    links: [
      { href: "/admin", label: "Dashboard" },
      { href: "/admin/analytics", label: "Analytics" },
      { href: "/admin/calendar", label: "Editorial calendar" },
    ],
  },
  {
    title: "Editorial",
    links: [
      { href: "/admin/articles", label: "Articles" },
      { href: "/admin/articles/new", label: "New article" },
      { href: "/admin/categories", label: "Sections" },
      { href: "/admin/tags", label: "Tags" },
      { href: "/admin/comments", label: "Comments" },
      { href: "/admin/media", label: "Media library" },
    ],
  },
  {
    title: "Audience",
    links: [
      { href: "/admin/subscribers", label: "Subscribers" },
      { href: "/admin/newsletters", label: "Newsletters" },
      { href: "/admin/authors", label: "Contributors" },
    ],
  },
  {
    title: "Administration",
    links: [
      { href: "/admin/users", label: "Users & roles" },
      { href: "/admin/ads", label: "Advertising" },
      { href: "/admin/settings", label: "Site settings" },
    ],
  },
];

export function AdminNav({ userName, role }: { userName: string; role: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between border-b border-rule px-5 py-4 lg:hidden">
        <Link href="/admin" className="font-display text-xl tracking-[0.22em]">FOLIO DESK</Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="border border-rule px-3 py-2 font-sans text-[10px] uppercase tracking-kicker"
          aria-expanded={open}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      <aside className={`${open ? "block" : "hidden"} border-b border-rule bg-paper-2/40 lg:block lg:border-b-0 lg:bg-transparent`}>
        <div className="px-5 py-6 lg:border-b lg:border-rule">
          <Link href="/admin" className="hidden font-display text-2xl tracking-[0.22em] lg:block">
            FOLIO
          </Link>
          <p className="mt-1 font-sans text-[9px] uppercase tracking-kicker text-ink-soft">Editorial desk</p>
        </div>

        <nav className="space-y-6 px-5 py-5" aria-label="Editorial navigation">
          {groups.map((g) => (
            <div key={g.title}>
              <p className="font-sans text-[9px] font-semibold uppercase tracking-kicker text-ink-soft/70">{g.title}</p>
              <ul className="mt-2 space-y-0.5">
                {g.links.map((l) => {
                  const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
                  return (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        onClick={() => setOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={`block px-2 py-1.5 font-sans text-[12px] transition-colors ${
                          active ? "bg-ink text-paper" : "text-ink-soft hover:bg-paper-2 hover:text-ink"
                        }`}
                      >
                        {l.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-rule px-5 py-4">
          <p className="font-sans text-[9px] uppercase tracking-kicker text-ink-soft">Signed in</p>
          <p className="mt-1 font-sans text-[12px]">{userName}</p>
          <p className="font-sans text-[10px] capitalize text-ink-soft">{role.replace("_", " ")}</p>
          <Link href="/" className="mt-3 inline-block font-sans text-[10px] uppercase tracking-kicker text-accent">
            View the magazine →
          </Link>
        </div>
      </aside>
    </>
  );
}
