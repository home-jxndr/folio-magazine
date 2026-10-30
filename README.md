# FOLIO — Digital Magazine & Newsletter Platform

An independent editorial magazine and newsletter system, built as a real full-stack app: public magazine, reader
accounts, newsletter infrastructure, and a complete editorial CMS with roles, revisions, scheduling and analytics.

**Stack:** Next.js 16 (App Router, React 19, Server Actions) · TypeScript · Tailwind CSS · Cloudflare D1 (SQLite) via
`@opennextjs/cloudflare` · hand-rolled SVG charts and a custom rich-text editor (no chart/editor dependencies).

**Color scheme:** Light mode uses white background (`--paper: #ffffff`), black text (`--ink: #000000`), green accents (`--rule: #256213`, `--accent: #256213`), and yellowgold divider (`--paper-2: #e4d400`). Dark mode has complementary dimmed variants. Switch via the theme toggle in the header.

**Deployed:** preview environment on Freebuff Sites —
<https://site-b28052a4bdb241b2b9c5c61ce036113b.freebuff.page>
(Next.js 16.4.3 · OpenNext adapter 1.20.12 · D1 binding `DB`).

---

## Run it

```bash
npm ci
npm run dev          # http://localhost:3000
```

The database schema and demo content are created automatically on the first request (idempotent, safe to re-run).

```bash
npm run build                          # Next production build + typecheck
```

### Local database

Content is stored in a SQLite file at `.data/folio.db`, created and seeded on the first request. Nothing else is
required to run the magazine locally — no Cloudflare account, no database server, no migration step. Set
`FOLIO_DB_PATH` to use a different file location, and delete `.data/` to start from a clean seed.

The data layer uses Node's built-in `node:sqlite`, so **Node 22.5 or newer** is required. The file is gitignored;
`lib/db.ts` exposes the same `prepare`/`bind`/`first`/`all`/`run`/`batch` surface that a Cloudflare D1 binding did,
so `lib/queries.ts`, `lib/schema.ts` and `lib/seed.ts` are unchanged.

### Demo accounts

Seeded with hashed passwords (PBKDF2-SHA256, 60k iterations):

| Role | Email | Password |
| --- | --- | --- |
| Super administrator | `editor@folio.press` | `folio-editor` |
| Editor | `jonah@folio.press` | `folio-jonah` |
| Author | `elsa@folio.press` | `folio-elsa` |
| Subscriber | `reader@folio.press` | `folio-reader` |

Remove these accounts (Admin → Users & roles) before running a public deployment.

---

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `RESEND_API_KEY` | No | Newsletter delivery, confirmation and password-reset emails, via Resend. |
| `MAIL_FROM` | No | From address for outgoing mail (default `FOLIO <desk@folio.press>`). |
| `NEXT_PUBLIC_SITE_URL` | No | Canonical origin used in RSS, sitemap and metadata (defaults to the request-independent `SITE.url`). |

Database: no binding or external service is needed. `lib/db.ts` uses Node's built-in `node:sqlite` and keeps everything
in `.data/folio.db` (override with `FOLIO_DB_PATH`).

**Email behaviour is honest about configuration.** Without `RESEND_API_KEY`:

- newsletter signup is stored as `pending` and the confirmation link is shown on screen;
- password reset shows the reset link on screen instead of emailing it;
- sending a newsletter records the campaign as `blocked` and reports that nothing was sent — no deliveries are faked.

**Binary uploads** need object storage (an R2 binding or S3 bucket). The media library stores metadata and hosted
image URLs, which every image field accepts.

**Paid membership** needs a payment provider. The membership page states that checkout is not configured rather than
collecting card details.

---

## What's built

**Public magazine** — homepage with lead story, breaking ticker, editor's picks, latest, most-read, collections,
sections and contributor rails; article pages with cover credits, reading progress, save/bookmark, share, copy link,
focus mode, comments, related stories and prev/next; section, tag, author, collection, latest, search and archive pages;
newsletter landing, archive and individual editions; about, contact, membership, privacy, terms; custom 404;
RSS feed, sitemap, robots, canonical and Open Graph metadata.

**Newsletter system** — subscribe with frequency and topic consent, double opt-in confirmation, unsubscribe,
preference management by token or signed-in email, subscriber segmentation, campaign records, edition writing and
sending.

**Accounts** — registration, sign in/out, password reset, profile editing, password change, saved articles, reading
history (with progress and clearing), newsletter preferences.

**CMS** — dashboard with counts, charts and activity; article list with filters and inline publish/unpublish/delete;
editor with headings, lists, quotes, pull quotes, code, links, images with captions, video embeds, tables, rules,
undo/redo, autosave (server every 30s plus a local backup) and revision restore; sections and tags management; media
library with folders, alt text, credits and usage counts; newsletter editions and sends; subscriber management with
CSV export; comment moderation; contributor overview; users and roles; advertising placements with tracked clicks;
editorial calendar with scheduling; site settings and contact-message triage; analytics with date ranges and CSV export.

**Roles** — `super_admin`, `admin`, `editor`, `author`, `subscriber`. Authors see only their own drafts and cannot
publish (their "Publish" becomes "review"); administrators manage accounts; only super administrators change settings.

---

## Architecture notes

- `lib/schema.ts` + `lib/seed.ts` bootstrap lazily on first DB access, so no manual migration step is needed. Every
  seed insert is `INSERT OR IGNORE`, so an interrupted seed resumes instead of failing on unique constraints.
- Public pages are `force-dynamic`; all data comes from the SQLite database via `lib/db.ts` through `lib/queries.ts` —
  no hardcoded article content in the UI.
- Sessions are opaque random tokens in the `folio_session` cookie, stored in a `sessions` table with expiry.
- `worker.js` at the project root is the Wrangler entry. It stubs `process.chdir`, which OpenNext's Node adapter calls
  with `__dirname` (empty under workerd) and which otherwise fails every request with `no such file or directory`.
- Analytics are aggregate: views, unique session cookies, referral category, section and dwell. No reader profiles.

## Verification status

Locally: `tsc --noEmit` clean; `next build` succeeds on Next.js 16.4.3; `opennextjs-cloudflare build` succeeds;
worker serves the public site, article, archive, search API, RSS, sitemap, robots, 404 and preview routes with the
expected status codes; all admin and account routes render; role gating holds.

On the deployed preview (`freebuff.page`, real workerd + D1):

- public pages, article pages, archive, newsletter, search API, RSS, sitemap all return 200; unknown URLs 404; CSS assets
  return 200 with `text/css`
- signed-out `/admin` and `/account` redirect to `/login?next=…` (307)
- sign-in with `editor@folio.press` returns 303 to `/admin` with a `Secure; HttpOnly; SameSite=Lax` session cookie, and
  the desk renders; author and subscriber sessions are correctly restricted (`/admin/users` → “Administrator access
  required”; `/admin` → “Access denied”)
- newsletter signup writes to D1 and returns the on-screen confirmation link (email provider is unconfigured by
  design), and following that link confirms the subscriber; a second visit reports “already confirmed”

Not verified: real browser interaction, actual email delivery (no `RESEND_API_KEY`), rich-text editing and autosave in a
real browser, and the production environment (deployed only to preview). One caveat: on a completely empty database the
very first concurrent requests can race the lazy schema/seed bootstrap and one may return 500 — reloading works and the
seed completes. Warm up the preview once after any fresh deployment.
