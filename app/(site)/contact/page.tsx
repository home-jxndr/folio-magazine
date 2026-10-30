import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { getSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Contact" };

export default async function ContactPage() {
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-sheet px-5 sm:px-6">
      <header className="border-b border-ink py-10 lg:py-14">
        <p className="kicker">Contact</p>
        <h1 className="headline-xl mt-2 text-[2.6rem] sm:text-[3.6rem]">Write to the desk</h1>
        <p className="dek mt-3 max-w-2xl">
          Corrections, pitches, permissions and complaints all arrive in the same inbox and are read by an editor.
        </p>
      </header>

      <div className="grid gap-10 py-8 lg:grid-cols-[1.2fr_1fr] lg:gap-14">
        <ContactForm />
        <aside>
          <div className="border-t border-ink pt-4">
            <p className="kicker">Direct lines</p>
            <dl className="mt-4 space-y-4 font-sans text-[13px]">
              <div>
                <dt className="text-[10px] uppercase tracking-kicker text-ink-soft">Editorial desk</dt>
                <dd className="mt-0.5"><a href={`mailto:${settings.contact_email || "desk@folio.press"}`} className="underline">{settings.contact_email || "desk@folio.press"}</a></dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-kicker text-ink-soft">Corrections</dt>
                <dd className="mt-0.5"><a href="mailto:corrections@folio.press" className="underline">corrections@folio.press</a></dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-kicker text-ink-soft">Pitches</dt>
                <dd className="mt-0.5"><a href="mailto:pitch@folio.press" className="underline">pitch@folio.press</a></dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-kicker text-ink-soft">Post</dt>
                <dd className="mt-0.5 font-serif text-[14px] leading-relaxed">{settings.address || "Rua da Boavista 84, 1200-068 Lisbon, Portugal"}</dd>
              </div>
            </dl>
          </div>
          <div className="mt-8 border border-rule bg-paper-2/50 p-5">
            <p className="kicker-muted">Before you write</p>
            <ul className="mt-3 space-y-2 font-serif text-[14px] leading-relaxed text-ink-soft">
              <li>We cannot answer requests to remove accurate reporting.</li>
              <li>Pitches are answered within ten working days, if at all.</li>
              <li>For subscription problems, include the email address you used.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
