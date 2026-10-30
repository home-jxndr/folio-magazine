import Link from "next/link";

export function AuthShell({
  kicker,
  title,
  intro,
  children,
  aside,
}: {
  kicker: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="mx-auto grid max-w-sheet gap-10 px-5 py-10 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:py-16">
      <div className="order-2 lg:order-1 lg:border-r lg:border-rule lg:pr-14">
        <p className="kicker">{kicker}</p>
        <h1 className="headline mt-2 text-[2.2rem] sm:text-[2.8rem]">{title}</h1>
        {intro && <p className="dek mt-3 max-w-md text-[1rem]">{intro}</p>}
        <div className="mt-8 max-w-md">{children}</div>
      </div>
      <div className="order-1 lg:order-2">
        {aside ?? (
          <div className="border border-rule bg-paper-2/50 p-6">
            <p className="font-display text-3xl tracking-[0.24em]">FOLIO</p>
            <p className="mt-3 font-serif text-[15px] leading-relaxed text-ink-soft">
              An independent magazine of ideas, culture and the modern world. Reader-funded since 2016.
            </p>
            <ul className="mt-5 space-y-2 border-t border-rule pt-4 font-sans text-[12px] text-ink-soft">
              <li>Save articles and keep a reading history</li>
              <li>Manage newsletter preferences</li>
              <li>Comment on stories after moderation</li>
            </ul>
            <Link href="/latest" className="mt-5 inline-block font-sans text-[10px] uppercase tracking-kicker text-accent">
              Browse the archive →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
