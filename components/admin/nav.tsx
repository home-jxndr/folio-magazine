// Admin navigation
import Link from "next/link";

export function AdminNav() {
  return (
    <nav className="border-b border-[var(--rule)] pb-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6">
        <ul className="flex gap-8 text-[var(--ink)] font-sans uppercase tracking-kicker" style="font-size: 10px;">
          <li>
            <Link href="/" className="hover:text-[var(--accent)]">Dashboard</Link>
          </li>
          <li>
            <Link href="/admin/articles" className="hover:text-[var(--accent)]">Articles</Link>
          </li>
          <li>
            <Link href="/admin/authors" className="hover:text-[var(--accent)]">Authors</Link>
          </li>
          <li>
            <Link href="/admin/categories" className="hover:text-[var(--accent)]">Categories</Link>
          </li>
          <li>
            <Link href="/admin/tags" className="hover:text-[var(--accent)]">Tags</Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
