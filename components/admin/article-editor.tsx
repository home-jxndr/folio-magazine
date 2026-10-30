"use client";

import Link from "next/link";
import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { autosaveDraftAction, restoreRevisionAction, saveArticleAction } from "@/app/actions/admin";
import { IDLE } from "@/lib/action-types";
import type { Category, ArticleSummary } from "@/lib/queries";

type MediaItem = { id: string; url: string; filename: string; alt: string | null };
type Revision = { id: string; title: string; note: string | null; created_at: string; editor: string | null };

function BarButton({ onClick, label, hint }: { onClick: () => void; label: string; hint: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={hint}
      aria-label={hint}
      className="min-w-7 border border-transparent px-1.5 py-1 font-sans text-[11px] text-ink-soft hover:border-rule hover:text-ink"
    >
      {label}
    </button>
  );
}

function SaveRow({ onStatus }: { onStatus: (s: string) => void }) {
  const { pending } = useFormStatus();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => onStatus("draft")} disabled={pending} className="btn btn-ghost disabled:opacity-60">
        {pending ? "Saving…" : "Save draft"}
      </button>
      <button type="button" onClick={() => onStatus("review")} disabled={pending} className="btn btn-ghost disabled:opacity-60">
        Submit for review
      </button>
      <button type="button" onClick={() => onStatus("published")} disabled={pending} className="btn btn-primary disabled:opacity-60">
        Publish
      </button>
    </div>
  );
}

export function ArticleEditor({
  article,
  categories,
  authors,
  media,
  revisions,
  tags,
  canPublish,
}: {
  article: ArticleSummary | null;
  categories: Category[];
  authors: { id: string; name: string; role: string }[];
  media: MediaItem[];
  revisions: Revision[];
  tags: string;
  canPublish: boolean;
}) {
  const [state, formAction] = useActionState(saveArticleAction, IDLE);
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState(article?.content_html ?? "");
  const [title, setTitle] = useState(article?.title ?? "");
  const [dek, setDek] = useState(article?.dek ?? "");
  const [cover, setCover] = useState(article?.cover_url ?? "");
  const [autosave, setAutosave] = useState<{ at: string; ok: boolean; message: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [restored, setRestored] = useState(false);

  const wordCount = html.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
  const draftKey = `folio-draft-${article?.id ?? "new"}`;

  // Restore an unsaved local copy if the server copy is older than the local one.
  useEffect(() => {
    if (restored) return;
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const saved = JSON.parse(raw) as { title?: string; dek?: string; html?: string };
      if (article?.id && saved.html && saved.html !== article.content_html) {
        if (window.confirm("An unsaved local copy of this draft is newer. Restore it into the editor?")) {
          setTitle(saved.title ?? title);
          setDek(saved.dek ?? dek);
          setHtml(saved.html);
          if (bodyRef.current) bodyRef.current.innerHTML = saved.html;
        }
      }
    } catch {
      /* ignore malformed local copies */
    }
    setRestored(true);
  }, [article?.id, article?.content_html, dek, draftKey, restored, title]);

  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify({ title, dek, html }));
      } catch {
        /* storage may be full or blocked */
      }
    }, 800);
    return () => clearTimeout(t);
  }, [dek, dirty, draftKey, html, title]);

  const performAutosave = useCallback(async () => {
    if (!article?.id || !formRef.current) return;
    const fd = new FormData(formRef.current);
    const res = await autosaveDraftAction(fd);
    setAutosave({ at: res.savedAt, ok: res.ok, message: res.message });
    if (res.ok) setDirty(false);
  }, [article?.id]);

  useEffect(() => {
    if (!dirty || !article?.id) return;
    const t = setInterval(() => void performAutosave(), 30000);
    return () => clearInterval(t);
  }, [article?.id, dirty, performAutosave]);

  function syncBody() {
    if (bodyRef.current) setHtml(bodyRef.current.innerHTML);
    setDirty(true);
  }

  function exec(command: string, value?: string) {
    bodyRef.current?.focus();
    document.execCommand(command, false, value);
    syncBody();
  }

  function insertHtml(snippet: string) {
    bodyRef.current?.focus();
    document.execCommand("insertHTML", false, snippet);
    syncBody();
  }

  function addLink() {
    const url = window.prompt("Link URL", "https://");
    if (url) exec("createLink", url);
  }

  function addImage(url?: string) {
    const src = url ?? window.prompt("Image URL", cover || "https://");
    if (!src) return;
    const caption = window.prompt("Caption (optional)", "") ?? "";
    insertHtml(
      `<figure><img src="${src}" alt="${caption.replace(/"/g, "&quot;")}" loading="lazy" /><figcaption>${
        caption ? caption.replace(/</g, "&lt;") : ""
      }</figcaption></figure><p><br></p>`,
    );
  }

  function addVideo() {
    const url = window.prompt("Video URL (YouTube, Vimeo or .mp4)", "https://www.youtube.com/watch?v=");
    if (!url) return;
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/);
    const vimeo = url.match(/vimeo\.com\/(\d+)/);
    if (yt) {
      insertHtml(
        `<figure class="embed"><iframe src="https://www.youtube-nocookie.com/embed/${yt[1]}" title="Embedded video" loading="lazy" allowfullscreen></iframe><figcaption>Video</figcaption></figure><p><br></p>`,
      );
    } else if (vimeo) {
      insertHtml(
        `<figure class="embed"><iframe src="https://player.vimeo.com/video/${vimeo[1]}" title="Embedded video" loading="lazy" allowfullscreen></iframe><figcaption>Video</figcaption></figure><p><br></p>`,
      );
    } else {
      insertHtml(`<figure class="embed"><video src="${url}" controls></video><figcaption>Video</figcaption></figure><p><br></p>`);
    }
  }

  function addTable() {
    insertHtml(
      `<table><thead><tr><th>Column</th><th>Column</th></tr></thead><tbody><tr><td>—</td><td>—</td></tr><tr><td>—</td><td>—</td></tr></tbody></table><p><br></p>`,
    );
  }

  function addPullQuote() {
    const text = window.getSelection()?.toString() || window.prompt("Pull quote", "") || "";
    if (!text) return;
    insertHtml(`<blockquote class="pullquote"><p>${text.replace(/</g, "&lt;")}</p></blockquote><p><br></p>`);
  }

  function submitWith(status: string) {
    if (statusRef.current) statusRef.current.value = status;
    formRef.current?.requestSubmit();
  }

  return (
    <form ref={formRef} action={formAction} className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <input type="hidden" name="id" value={article?.id ?? ""} />
      <input ref={statusRef} type="hidden" name="status" defaultValue={article?.status ?? "draft"} />
      <input type="hidden" name="content_html" value={html} readOnly />

      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <SaveRow onStatus={submitWith} />
            <button type="button" onClick={() => submitWith("scheduled")} className="btn btn-ghost">
              Schedule…
            </button>
          </div>
          <div className="flex items-center gap-3 font-sans text-[10px] uppercase tracking-kicker text-ink-soft">
            <span>{wordCount} words</span>
            <span aria-hidden>·</span>
            <span>~{Math.max(1, Math.round(wordCount / 220))} min</span>
            {autosave && (
              <>
                <span aria-hidden>·</span>
                <span className={autosave.ok ? "text-moss" : "text-accent"} title={autosave.message}>
                  {autosave.ok ? `Autosaved ${autosave.at}` : "Autosave paused"}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="mt-5">
          <label htmlFor="title" className="label">Headline</label>
          <input
            id="title"
            name="title"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setDirty(true); }}
            placeholder="The headline as it will run"
            className="w-full border-0 border-b border-rule bg-transparent px-0 py-2 font-display text-[2rem] font-semibold leading-tight tracking-tight outline-none focus:border-ink sm:text-[2.6rem]"
          />
          {state.errors?.title && <p className="mt-1 font-sans text-[11px] text-accent">{state.errors.title}</p>}

          <label htmlFor="dek" className="label mt-5">Standfirst</label>
          <textarea
            id="dek"
            name="dek"
            rows={2}
            value={dek}
            onChange={(e) => { setDek(e.target.value); setDirty(true); }}
            placeholder="One or two sentences that set up the piece"
            className="w-full resize-none border-0 bg-transparent px-0 py-1 font-serif text-[18px] leading-relaxed text-ink-soft outline-none"
          />
        </div>

        <div className="sticky top-0 z-10 -mx-1 mt-4 flex flex-wrap items-center gap-0.5 border-y border-rule bg-paper/95 px-1 py-1.5 backdrop-blur">
          <BarButton onClick={() => exec("formatBlock", "h2")} label="H2" hint="Heading 2" />
          <BarButton onClick={() => exec("formatBlock", "h3")} label="H3" hint="Heading 3" />
          <BarButton onClick={() => exec("formatBlock", "p")} label="¶" hint="Paragraph" />
          <span className="mx-1 h-4 w-px bg-rule" aria-hidden />
          <BarButton onClick={() => exec("bold")} label="B" hint="Bold" />
          <BarButton onClick={() => exec("italic")} label="I" hint="Italic" />
          <BarButton onClick={() => exec("underline")} label="U" hint="Underline" />
          <BarButton onClick={() => exec("strikeThrough")} label="S" hint="Strikethrough" />
          <span className="mx-1 h-4 w-px bg-rule" aria-hidden />
          <BarButton onClick={() => exec("insertUnorderedList")} label="•" hint="Bulleted list" />
          <BarButton onClick={() => exec("insertOrderedList")} label="1." hint="Numbered list" />
          <BarButton onClick={() => exec("formatBlock", "blockquote")} label="❞" hint="Blockquote" />
          <BarButton onClick={addPullQuote} label="Pull" hint="Insert pull quote" />
          <BarButton onClick={() => exec("formatBlock", "pre")} label="</>" hint="Code block" />
          <span className="mx-1 h-4 w-px bg-rule" aria-hidden />
          <BarButton onClick={addLink} label="Link" hint="Insert link" />
          <BarButton onClick={() => addImage()} label="Image" hint="Insert image" />
          <BarButton onClick={addVideo} label="Video" hint="Embed video" />
          <BarButton onClick={addTable} label="Table" hint="Insert table" />
          <BarButton onClick={() => exec("insertHorizontalRule")} label="—" hint="Horizontal rule" />
          <span className="mx-1 h-4 w-px bg-rule" aria-hidden />
          <BarButton onClick={() => exec("undo")} label="↶" hint="Undo" />
          <BarButton onClick={() => exec("redo")} label="↷" hint="Redo" />
          <BarButton onClick={() => exec("removeFormat")} label="Clear" hint="Clear formatting" />
        </div>
        {state.errors?.content_html && <p className="mt-1 font-sans text-[11px] text-accent">{state.errors.content_html}</p>}

        <div
          ref={bodyRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label="Article body"
          onInput={syncBody}
          onBlur={syncBody}
          className="article-body mt-4 min-h-[420px] outline-none focus:outline-none"
          dangerouslySetInnerHTML={{ __html: article?.content_html ?? "<p><br></p>" }}
        />
        <p className="mt-3 border-t border-rule pt-2 font-sans text-[10px] text-ink-soft">
          Autosave writes the headline, standfirst and body every 30 seconds while you type, and keeps a local copy in
          this browser. Use “Save draft” to commit metadata and sections.
        </p>

        <details className="mt-6 border border-rule p-4">
          <summary className="cursor-pointer font-sans text-[10px] uppercase tracking-kicker">SEO &amp; sharing</summary>
          <div className="mt-4 grid gap-4">
            <div>
              <label htmlFor="seo_title" className="label">SEO title</label>
              <input id="seo_title" name="seo_title" defaultValue={article?.seo_title ?? ""} className="field" placeholder="Defaults to the headline" />
            </div>
            <div>
              <label htmlFor="seo_description" className="label">Meta description</label>
              <textarea id="seo_description" name="seo_description" rows={2} defaultValue={article?.seo_description ?? ""} className="field" />
            </div>
            <div>
              <label htmlFor="canonical_url" className="label">Canonical URL</label>
              <input id="canonical_url" name="canonical_url" defaultValue={article?.canonical_url ?? ""} className="field" placeholder="Leave empty to self-canonicalise" />
            </div>
          </div>
        </details>

        {state.message && (
          <p role="status" aria-live="polite" className={`mt-4 border-l-2 px-3 py-2 font-sans text-[11.5px] ${state.ok ? "border-moss" : "border-accent text-accent"}`}>
            {state.message}
          </p>
        )}
      </div>

      <aside className="space-y-5">
        <section className="border border-rule p-4">
          <p className="kicker-muted">Publication</p>
          <dl className="mt-3 space-y-2 font-sans text-[11px]">
            <div className="flex justify-between gap-2">
              <dt className="text-ink-soft">Status</dt>
              <dd className="capitalize">{article?.status ?? "new draft"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-ink-soft">Created</dt>
              <dd>{article ? article.created_at?.slice(0, 10) : "—"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-ink-soft">Views</dt>
              <dd>{article?.views ?? 0}</dd>
            </div>
          </dl>
          <label htmlFor="published_at" className="label mt-4">Schedule date &amp; time</label>
          <input
            id="published_at"
            name="published_at"
            type="datetime-local"
            defaultValue={article?.published_at ? article.published_at.replace(" ", "T").slice(0, 16) : ""}
            className="field"
          />
          {state.errors?.published_at && <p className="mt-1 font-sans text-[10.5px] text-accent">{state.errors.published_at}</p>}
          <p className="mt-1.5 font-sans text-[10px] leading-relaxed text-ink-soft">
            “Schedule…” stores the piece as scheduled; it goes live at this time.
          </p>

          {article?.preview_token && (
            <div className="mt-4 border-t border-rule pt-3">
              <p className="kicker-muted">Draft preview</p>
              <Link
                href={`/preview/${article.preview_token}`}
                target="_blank"
                className="mt-1 block break-all font-mono text-[10px] text-accent underline"
              >
                /preview/{article.preview_token.slice(0, 12)}…
              </Link>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard?.writeText(`${window.location.origin}/preview/${article.preview_token}`);
                }}
                className="mt-2 font-sans text-[10px] uppercase tracking-kicker underline"
              >
                Copy preview link
              </button>
            </div>
          )}
        </section>

        <section className="border border-rule p-4">
          <p className="kicker-muted">Section &amp; author</p>
          <label htmlFor="category_id" className="label mt-3">Section</label>
          <select id="category_id" name="category_id" defaultValue={article?.category_id ?? ""} className="field" required>
            <option value="">Choose a section</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {state.errors?.category_id && <p className="mt-1 font-sans text-[10.5px] text-accent">{state.errors.category_id}</p>}

          <label htmlFor="author_id" className="label mt-3">Byline</label>
          <select id="author_id" name="author_id" defaultValue={article?.author_id ?? authors[0]?.id ?? ""} className="field">
            {authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>

          <label htmlFor="collection" className="label mt-3">Collection</label>
          <input id="collection" name="collection" defaultValue={article?.collection ?? ""} className="field" placeholder="e.g. The Long Read" />

          <label htmlFor="tags" className="label mt-3">Tags</label>
          <input id="tags" name="tags" defaultValue={tags} className="field" placeholder="comma, separated" />
          <p className="mt-1 font-sans text-[10px] text-ink-soft">Up to 12. New tags are created automatically.</p>
        </section>

        {(canPublish) && (
          <section className="border border-rule p-4">
            <p className="kicker-muted">Placement</p>
            <label className="mt-3 flex items-center gap-2 font-sans text-[11.5px]">
              <input type="checkbox" name="featured" defaultChecked={!!article?.featured} /> Lead story on the front page
            </label>
            <label className="mt-2 flex items-center gap-2 font-sans text-[11.5px]">
              <input type="checkbox" name="editors_pick" defaultChecked={!!article?.editors_pick} /> Editor’s pick
            </label>
            <label className="mt-2 flex items-center gap-2 font-sans text-[11.5px]">
              <input type="checkbox" name="breaking" defaultChecked={!!article?.breaking} /> Breaking ticker
            </label>
            <label htmlFor="slug" className="label mt-4">URL slug</label>
            <input id="slug" name="slug" defaultValue={article?.slug ?? ""} className="field" placeholder="auto-generated from the headline" />
          </section>
        )}

        <section className="border border-rule p-4">
          <p className="kicker-muted">Cover image</p>
          <img src={cover || "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=600&q=80"} alt="" className="mt-2 aspect-[3/2] w-full object-cover" />
          <label htmlFor="cover_url" className="label mt-3">Image URL</label>
          <input id="cover_url" name="cover_url" value={cover} onChange={(e) => setCover(e.target.value)} className="field" placeholder="https://…" />
          <label htmlFor="cover_alt" className="label mt-3">Alt text</label>
          <input id="cover_alt" name="cover_alt" defaultValue={article?.cover_alt ?? ""} className="field" />
          <label htmlFor="cover_caption" className="label mt-3">Caption &amp; credit</label>
          <input id="cover_caption" name="cover_caption" defaultValue={article?.cover_caption ?? ""} className="field" />

          <details className="mt-3">
            <summary className="cursor-pointer font-sans text-[10px] uppercase tracking-kicker text-accent">Choose from library</summary>
            <div className="mt-2 grid max-h-56 grid-cols-3 gap-1.5 overflow-y-auto">
              {media.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setCover(m.url)}
                  title={m.filename}
                  className="border border-rule hover:border-accent"
                >
                  <img src={m.url} alt={m.alt ?? ""} className="aspect-square w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          </details>
          <p className="mt-2 font-sans text-[10px] leading-relaxed text-ink-soft">
            Files are referenced by URL — the media library stores metadata, not binaries.
          </p>
        </section>

        <section className="border border-rule p-4">
          <p className="kicker-muted">Excerpt for cards &amp; RSS</p>
          <textarea name="excerpt" rows={3} defaultValue={article?.excerpt ?? ""} className="field mt-2" />
        </section>

        {article && revisions.length > 0 && (
          <section className="border border-rule p-4">
            <p className="kicker-muted">Revision history</p>
            <ol className="mt-2 divide-y divide-rule">
              {revisions.map((r) => (
                <li key={r.id} className="py-2">
                  <p className="font-sans text-[11px]">{r.title}</p>
                  <p className="font-sans text-[9.5px] uppercase tracking-kicker text-ink-soft">
                    {r.created_at.slice(0, 16)} · {r.editor ?? "system"} · {r.note ?? "edit"}
                  </p>
                  <form action={restoreRevisionAction} className="mt-1">
                    <input type="hidden" name="revision_id" value={r.id} />
                    <button type="submit" className="font-sans text-[9.5px] uppercase tracking-kicker text-accent underline">
                      Restore this version
                    </button>
                  </form>
                </li>
              ))}
            </ol>
          </section>
        )}
      </aside>
    </form>
  );
}
