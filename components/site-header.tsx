// Site header with navigation
import { useState } from "react";
import { Menu } from "lucide-react";

export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  return (
    <header className="sticky top-0 z-20 bg-[var(--paper)] border-b border-[var(--rule)] backdrop-blur sm:height-16">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-full">
        <h1 className="text-2xl font-semibold tracking-kicker"
          style="font-family: Fraunces, Georgia, serif;">
          FOLIO Magazine
        </h1>
        <nav>
          <ul className="flex gap-8 text-[var(--ink)] font-sans uppercase tracking-kicker" style="font-size: 10px;">
            <li>
              <a href="#main" className="link-underline">Skip to content</a>
            </li>
            <li>
              <a href="/" className="hover:text-[var(--accent)]">Home</a>
            </li>
            <li>
              <a href="/about" className="hover:text-[var(--accent)]">About</a>
            </li>
            <li>
              <a href="/newsletter" className="hover:text-[var(--accent)]">Newsletter</a>
            </li>
          </ul>
        </nav>
        <button
          onClick={() => setIsMenuOpen(true)}
          className="btn-ghost text-[var(--ink)] px-4 py-2 rounded" style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em;">
          Menu
          <Menu className="ml-2 h-4 w-4" />
        </button>
        {/* Mobile menu overlay */}
        {isMenuOpen && (
          <div className="fixed inset-0 bg-[var(--ink)]/50 backdrop-blur z-30 flex items-center justify-center"/>
        )}
      </div>
    </header>
  );
}
