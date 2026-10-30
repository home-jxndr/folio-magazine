import Link from "next/link";
import { cn } from "@/lib/utils";

export function AdminPageHead({
  kicker,
  title,
  description,
  action,
}: {
  kicker: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink pb-4">
      <div>
        <p className="kicker">{kicker}</p>
        <h1 className="mt-1.5 font-display text-[2rem] font-semibold leading-none tracking-tight">{title}</h1>
        {description && <p className="mt-2 max-w-2xl font-serif text-[14px] leading-relaxed text-ink-soft">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Stat({ label, value, detail, href }: { label: string; value: string | number; detail?: string; href?: string }) {
  const inner = (
    <>
      <p className="font-sans text-[9.5px] uppercase tracking-kicker text-ink-soft">{label}</p>
      <p className="mt-1.5 font-display text-[1.9rem] font-semibold leading-none tracking-tight">{value}</p>
      {detail && <p className="mt-1.5 font-sans text-[10.5px] text-ink-soft">{detail}</p>}
    </>
  );
  return href ? (
    <Link href={href} className="block border border-rule p-4 transition-colors hover:border-ink">
      {inner}
    </Link>
  ) : (
    <div className="border border-rule p-4">{inner}</div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "live" | "draft" | "warn" | "muted" }) {
  const tones = {
    neutral: "border-rule text-ink-soft",
    live: "border-moss/50 bg-moss/10 text-moss",
    draft: "border-rule bg-paper-2 text-ink-soft",
    warn: "border-accent/40 bg-accent/10 text-accent",
    muted: "border-rule text-ink-soft/70",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 border px-2 py-0.5 font-sans text-[9.5px] uppercase tracking-kicker", tones[tone])}>
      {children}
    </span>
  );
}

export function statusTone(status: string): "live" | "draft" | "warn" | "muted" {
  if (status === "published" || status === "sent" || status === "confirmed") return "live";
  if (status === "scheduled" || status === "ready" || status === "pending") return "warn";
  if (status === "archived" || status === "unsubscribed" || status === "blocked") return "muted";
  return "draft";
}

export function TableShell({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto border border-rule">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr className="border-b border-rule bg-paper-2/60">
            {head.map((h) => (
              <th key={h} className="px-3 py-2.5 font-sans text-[9.5px] font-semibold uppercase tracking-kicker text-ink-soft">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-rule">{children}</tbody>
      </table>
    </div>
  );
}

export function Empty({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="border border-dashed border-rule px-6 py-14 text-center">
      <p className="font-display text-xl">{title}</p>
      {body && <p className="mx-auto mt-2 max-w-md font-serif text-[14px] text-ink-soft">{body}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 font-sans text-[10.5px] text-accent">{message}</p>;
}
