import Link from "next/link";

export function Ticker({ items }: { items: { title: string; slug: string }[] }) {
  if (!items.length) return null;
  const doubled = [...items, ...items];

  return (
    <div className="border-b border-rule bg-paper-2">
      <div className="mx-auto flex max-w-sheet items-center gap-4 px-5 sm:px-6">
        <span className="flex shrink-0 items-center gap-2 py-2.5 font-sans text-[9.5px] font-bold uppercase tracking-kicker text-accent">
          <span className="relative flex h-1.5 w-1.5" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping bg-accent opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 bg-accent" />
          </span>
          Latest
        </span>
        <div className="group relative flex-1 overflow-hidden">
          <div className="flex w-max animate-marquee items-center gap-8 py-2.5 group-hover:[animation-play-state:paused]">
            {doubled.map((item, i) => (
              <Link
                key={`${item.slug}-${i}`}
                href={`/article/${item.slug}`}
                className="whitespace-nowrap font-sans text-[11.5px] text-ink transition-colors hover:text-accent"
                aria-hidden={i >= items.length}
                tabIndex={i >= items.length ? -1 : 0}
              >
                <span className="mr-2 text-ink-soft/60" aria-hidden>—</span>
                {item.title}
              </Link>
            ))}
          </div>
        </div>
        <span className="hidden shrink-0 font-sans text-[9.5px] uppercase tracking-kicker text-ink-soft sm:block">
          Updated hourly
        </span>
      </div>
    </div>
  );
}
