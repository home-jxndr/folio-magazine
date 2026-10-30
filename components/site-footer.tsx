import Link from "next/link";
import { NewsletterForm } from "./newsletter-form";

type FooterCategory = { slug: string; name: string };

export function SiteFooter({
  categories,
  settings,
}: {
  categories: FooterCategory[];
  settings: Record<string, string>;
}) {
  const year = new Date().getFullYear();
  const socials = [
    { label: "X", href: settings.social_x || "https://x.com/foliopress" },
    { label: "Instagram", href: settings.social_instagram || "https://instagram.com/foliopress" },
    { label: "LinkedIn", href: settings.social_linkedin || "https://linkedin.com/company/foliopress" },
  ];

  return (
    <footer className="mt-24 border-t border-rule bg-paper">
      <div className="mx-auto max-w-sheet px-5 py-14 sm:px-6 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <p className="font-display text-3xl tracking-[0.24em]">FOLIO</p>
            <p className="mt-4 max-w-xs font-serif text-[15px] leading-relaxed text-ink-soft">
              {settings.tagline || "An independent magazine of ideas, culture and the modern world."}
            </p>
            <div className="mt-6 max-w-sm">
              <p className="kicker-muted mb-3">The Sunday Edition</p>
              <NewsletterForm variant="footer" source="footer" label="Subscribe" />
            </div>
          </div>

          <FooterColumn title="Sections">
            {categories.slice(0, 7).map((c) => (
              <FooterLink key={c.slug} href={`/category/${c.slug}`}>
                {c.name}
              </FooterLink>
            ))}
            <FooterLink href="/latest">All stories</FooterLink>
          </FooterColumn>

          <FooterColumn title="The publication">
            <FooterLink href="/about">About FOLIO</FooterLink>
            <FooterLink href="/newsletter">Newsletters</FooterLink>
            <FooterLink href="/newsletter/archive">Newsletter archive</FooterLink>
            <FooterLink href="/membership">Membership</FooterLink>
            <FooterLink href="/contact">Contact the desk</FooterLink>
            <FooterLink href="/rss.xml">RSS feed</FooterLink>
          </FooterColumn>

          <FooterColumn title="Your account">
            <FooterLink href="/login">Sign in</FooterLink>
            <FooterLink href="/register">Create an account</FooterLink>
            <FooterLink href="/account/saved">Saved articles</FooterLink>
            <FooterLink href="/account/history">Reading history</FooterLink>
            <FooterLink href="/account/subscriptions">Newsletter settings</FooterLink>
            <FooterLink href="/admin">Editorial desk</FooterLink>
          </FooterColumn>
        </div>

        <div className="mt-14 flex flex-col gap-6 border-t border-rule pt-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-sans text-[10px] uppercase tracking-kicker text-ink-soft">
            <span>© {year} FOLIO Media</span>
            <Link href="/privacy" className="hover:text-accent">Privacy</Link>
            <Link href="/terms" className="hover:text-accent">Terms</Link>
            <Link href="/contact" className="hover:text-accent">Contact</Link>
            <Link href="/sitemap.xml" className="hover:text-accent">Sitemap</Link>
          </div>
          <div className="flex items-center gap-5 font-sans text-[10px] uppercase tracking-kicker">
            {socials.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noreferrer noopener" className="link-underline">
                {s.label}
              </a>
            ))}
          </div>
        </div>
        <p className="mt-6 max-w-3xl font-sans text-[11px] leading-relaxed text-ink-soft">
          FOLIO is funded by readers. {settings.address || "Rua da Boavista 84, Lisbon"}. Editorial enquiries:{" "}
          <a href={`mailto:${settings.contact_email || "desk@folio.press"}`} className="underline">
            {settings.contact_email || "desk@folio.press"}
          </a>
          . All articles are the copyright of their authors.
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="kicker-muted mb-4">{title}</p>
      <ul className="space-y-2.5 font-sans text-[13px]">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="link-underline text-ink-soft transition-colors hover:text-ink">
        {children}
      </Link>
    </li>
  );
}
