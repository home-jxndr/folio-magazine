"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/account", label: "Profile & settings" },
  { href: "/account/saved", label: "Saved articles" },
  { href: "/account/history", label: "Reading history" },
  { href: "/account/subscriptions", label: "Newsletter" },
];

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Account" className="lg:border-r lg:border-rule lg:pr-6">
      <ul className="flex gap-4 overflow-x-auto border-b border-rule pb-3 no-scrollbar lg:flex-col lg:gap-0 lg:border-b-0 lg:pb-0">
        {links.map((l) => {
          const active = pathname === l.href;
          return (
            <li key={l.href} className="shrink-0 lg:border-b lg:border-rule">
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`block whitespace-nowrap py-2 font-sans text-[11px] uppercase tracking-kicker transition-colors lg:py-3 ${
                  active ? "text-accent" : "text-ink-soft hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
