// Admin articles list
import Link from "next/link";

export function AdminArticles() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border-[var(--rule)]">
        <thead>
          <tr className="bg-[var(--paper-2)] text-[var(--ink-soft)] uppercase tracking-kicker text-xs">
            <th className="p-4">Title</th>
            <th className="p-4">Slug</th>
            <th className="p-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-[var(--rule)]">
            <td className="p-4"><Link href="/article/test" className="link-underline">Sample Article</Link></td>
            <td className="p-4">test-article</td>
            <td className="p-4"><a href="/admin/articles/[id]/edit" className="text-[var(--accent)] underline">Edit</a> <a href="/admin/articles/[id]" className="text-[var(--rule)] ml-2">Delete</a></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
