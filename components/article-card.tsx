// Article card component
import Image from "next/image";

export function ArticleCard({ title, slug, description, image }) {
  return (
    <div className="group border-y border-[var(--rule)] hover:border-[var(--accent)] transition-colors">
      <Image
        src={image}
        alt={title}
        width={800}
        height={400}
        className="aspect-[4/3] w-full object-cover rounded-t-lg"
      />
      <div className="p-4">
        <h3 className="headline line-clamp-2">{title}</h3>
        <p className="mt-2 text-[var(--ink-soft)] line-clamp-3">{description}</p>
        <a
          href={"/article/" + slug}
          className="mt-3 link-underline block text-[var(--accent)] font-small uppercase tracking-kicker"
        >Read more</a>
      </div>
    </div>
  );
}
