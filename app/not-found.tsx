import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-5 py-20">
      <div className="max-w-2xl text-center">
        <p className="font-display text-3xl tracking-[0.24em]">FOLIO</p>
        <p className="mt-10 kicker">Error 404</p>
        <h1 className="headline-xl mt-3 text-[3rem] sm:text-[4.2rem]">This page went to press without us.</h1>
        <p className="dek mx-auto mt-4 max-w-lg text-[1.05rem]">
          The link may be out of date, or the story may have been moved. The archive is intact — start from the front
          page or search for what you were reading.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn btn-primary">Front page</Link>
          <Link href="/latest" className="btn btn-ghost">Latest stories</Link>
          <Link href="/search" className="btn btn-ghost">Search</Link>
        </div>
        <p className="mt-10 font-sans text-[10px] uppercase tracking-kicker text-ink-soft">
          If you believe this is an error, <Link href="/contact" className="underline">tell the desk</Link>.
        </p>
      </div>
    </div>
  );
}
