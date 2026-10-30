import { getActiveAd } from "@/lib/queries";

export async function AdSlot({ placement, className = "" }: { placement: string; className?: string }) {
  const ad = await getActiveAd(placement);
  if (!ad) return null;

  return (
    <aside className={`border border-rule bg-paper-2/60 p-4 ${className}`} aria-label="Advertisement">
      <p className="font-sans text-[9px] uppercase tracking-kicker text-ink-soft">Advertisement · {ad.advertiser ?? "FOLIO"}</p>
      {ad.image_url && (
        <img src={ad.image_url} alt="" className="mt-3 aspect-[4/3] w-full object-cover" loading="lazy" />
      )}
      {ad.body && <p className="mt-3 font-serif text-[15px] leading-snug text-ink">{ad.body}</p>}
      {ad.link_url && (
        <a
          href={`/api/ads/click?id=${ad.id}`}
          className="mt-3 inline-block font-sans text-[10px] uppercase tracking-kicker text-accent underline"
        >
          Find out more
        </a>
      )}
    </aside>
  );
}
