import Link from "next/link";

export function Pagination({
  page,
  total,
  perPage,
  basePath,
  params = {},
}: {
  page: number;
  total: number;
  perPage: number;
  basePath: string;
  params?: Record<string, string | undefined>;
}) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  if (pages <= 1) return null;

  const href = (p: number) => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) search.set(k, v);
    });
    if (p > 1) search.set("page", String(p));
    const qs = search.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const numbers = Array.from({ length: pages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pages || Math.abs(p - page) <= 1,
  );

  return (
    <nav aria-label="Pagination" className="mt-12 flex items-center justify-between border-t border-rule pt-5">
      <p className="font-sans text-[10px] uppercase tracking-kicker text-ink-soft">
        Page {page} of {pages} · {total} stories
      </p>
      <div className="flex items-center gap-1">
        {page > 1 && (
          <Link href={href(page - 1)} className="border border-rule px-3 py-1.5 font-sans text-[10px] uppercase tracking-kicker hover:border-ink">
            Previous
          </Link>
        )}
        {numbers.map((n, i) => (
          <span key={n} className="flex items-center">
            {i > 0 && numbers[i - 1] !== n - 1 && <span className="px-1 text-ink-soft">…</span>}
            <Link
              href={href(n)}
              aria-current={n === page ? "page" : undefined}
              className={`min-w-[32px] border px-2 py-1.5 text-center font-sans text-[10px] uppercase tracking-kicker ${
                n === page ? "border-ink bg-ink text-paper" : "border-rule hover:border-ink"
              }`}
            >
              {n}
            </Link>
          </span>
        ))}
        {page < pages && (
          <Link href={href(page + 1)} className="border border-rule px-3 py-1.5 font-sans text-[10px] uppercase tracking-kicker hover:border-ink">
            Next
          </Link>
        )}
      </div>
    </nav>
  );
}
