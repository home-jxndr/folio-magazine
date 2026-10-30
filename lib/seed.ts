import { articles, categories, IMG, p, users } from "./seed-data";
import { hashPassword, randomToken } from "./password";
import type { D1DatabaseLike, D1Stmt } from "./d1";

const iso = (daysAgo: number, hour = 9) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(hour, 20, 0, 0);
  return d.toISOString().slice(0, 19).replace("T", " ");
};

const words = (html: string) => html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
const readingMinutes = (html: string) => Math.max(1, Math.round(words(html) / 220));
const id = (prefix: string, n: number) => `${prefix}-${String(n).padStart(2, "0")}`;

const tags = [
  "architecture", "attention", "design", "cities", "artificial-intelligence", "labour", "policy",
  "software", "climate", "housing", "industry", "economics", "interiors", "home", "work", "space",
  "astronomy", "research", "culture", "technology", "essay", "film", "cinema", "small-business",
  "travel", "europe", "rail", "long-read", "museums", "science", "energy", "manufacturing",
  "agriculture", "law", "food", "biology", "oceans", "restaurants", "politics", "sound", "craft",
  "internet", "infrastructure", "data", "criticism", "biodiversity", "media", "journalism", "editorial",
  "business", "power", "the-internet",
];

const editions = [
  {
    id: "ed-01", slug: "the-sunday-edition-no-184", title: "The Sunday Edition, No. 184",
    subject: "The quiet architecture of attention",
    preheader: "Plus: what the machines learned from us, and ninety days on the night train.",
    body: [
      p("Good morning. This week we published a story about rooms that do almost nothing, and why cities have started treating concentration as infrastructure."),
      p("Marguerite Oyelaran spent three months on Europe's sleeper network for our cover feature. It began as a transport story and became a piece about the last public space that enforces a truce."),
      p("Also inside: Jonah Reyes on the contracts behind the AI demos, and Elsa Krag on why the dawn chorus is getting quieter."),
      p("If someone forwarded this to you, you can subscribe at folio.press/newsletter. The archive is free, always."),
    ].join(""),
    featured: 1, recipients: 38420, opens: 21410, clicks: 4890, daysAgo: 2, status: "sent",
  },
  {
    id: "ed-02", slug: "the-sunday-edition-no-183", title: "The Sunday Edition, No. 183",
    subject: "Who owns the harvest?",
    preheader: "Seed licensing, the return of the company town, and a defence of boredom.",
    body: [
      p("This week Priya Raghunathan read nineteen pages of a seed licence so you do not have to. Her conclusion: the paperwork is the product."),
      p("Elsewhere, Tomás Ferreira argues that the most underfunded public good is the unoccupied hour, and Nina Aldridge visits a video shop that refuses to close."),
      p("Our archive has 184 editions. All of them are free."),
    ].join(""),
    featured: 0, recipients: 37980, opens: 20930, clicks: 4210, daysAgo: 9, status: "sent",
  },
  {
    id: "ed-03", slug: "the-sunday-edition-no-182", title: "The Sunday Edition, No. 182",
    subject: "The deep field is getting crowded",
    preheader: "Astronomy's useful anomaly, plus the last great video shop.",
    body: [
      p("The patch of sky is the size of a grain of sand held at arm's length. It contains 14,000 galaxies, and more of them are faint than the models allow."),
      p("Elsa Krag reports from the Atacama. Also this week: the battery that refuses to die, and a colour restored after a century."),
    ].join(""),
    featured: 0, recipients: 37610, opens: 20270, clicks: 3980, daysAgo: 16, status: "sent",
  },
  {
    id: "ed-04", slug: "the-sunday-edition-no-185", title: "The Sunday Edition, No. 185",
    subject: "The new rules of the long table",
    preheader: "Twenty-two seats, one service, no menu.",
    body: [
      p("This Sunday Nina Aldridge on the restaurants that abandoned the à la carte, and what it does to the room."),
      p("Plus: a rail line reopens and a region wonders what it wants, and a conversation with three critics about taste."),
    ].join(""),
    featured: 1, recipients: 0, opens: 0, clicks: 0, daysAgo: -2, status: "scheduled",
  },
];

const folders = ["Cover photography", "Editorial", "Portraits", "Archive"];
const mediaItems = [
  { id: "med-01", photo: "photo-1487958449943-2429e8be8625", name: "rotterdam-reading-room.jpg", alt: "Reading room with long oak table", caption: "The still room at the Van Nelle complex, Rotterdam.", folder: "Editorial" },
  { id: "med-02", photo: "photo-1451187580459-43490279c0fa", name: "reykjavik-data-centre.jpg", alt: "Data centre corridors", caption: "A data centre outside Reykjavík.", folder: "Cover photography" },
  { id: "med-03", photo: "photo-1507525428034-b723cf961d3e", name: "sea-defences.jpg", alt: "Sea defences at dusk", caption: "Sea defences near Scheveningen.", folder: "Editorial" },
  { id: "med-04", photo: "photo-1486406146926-c627a92ad1ab", name: "company-town-housing.jpg", alt: "Corporate housing blocks", caption: "Corporate housing in a northern industrial park.", folder: "Editorial" },
  { id: "med-05", photo: "photo-1505691938895-1758d7feb511", name: "lisbon-landing.jpg", alt: "Converted landing with a chair", caption: "A converted landing in a Lisbon apartment.", folder: "Editorial" },
  { id: "med-06", photo: "photo-1519681393784-d120267933ba", name: "atacama-night.jpg", alt: "Night sky over mountains", caption: "The Atacama sky, photographed over four hours.", folder: "Cover photography" },
  { id: "med-07", photo: "photo-1489599849927-2ee91cede3ba", name: "video-shop.jpg", alt: "Empty cinema seats", caption: "The back room of Videodrome, Lisbon.", folder: "Archive" },
  { id: "med-08", photo: "photo-1494790108377-be9c29b29330", name: "marguerite-portrait.jpg", alt: "Portrait of Marguerite Oyelaran", caption: "Marguerite Oyelaran, editor-in-chief.", folder: "Portraits" },
  { id: "med-09", photo: "photo-1507003211169-0a1dd7228f2d", name: "jonah-portrait.jpg", alt: "Portrait of Jonah Reyes", caption: "Jonah Reyes, technology editor.", folder: "Portraits" },
  { id: "med-10", photo: "photo-1541961017774-22349e4a1262", name: "restored-panel.jpg", alt: "Detail of a restored painted panel", caption: "Detail from the restored panel.", folder: "Editorial" },
  { id: "med-11", photo: "photo-1414235077428-338989a2e8c0", name: "long-table-service.jpg", alt: "Dining room service", caption: "Service at a twenty-seat dining room in Copenhagen.", folder: "Editorial" },
  { id: "med-12", photo: "photo-1500937386664-56d1dfef3854", name: "alentejo-wheat.jpg", alt: "Wheat field at golden hour", caption: "Wheat near Alentejo.", folder: "Cover photography" },
];

export const DEMO_ACCOUNTS = [
  { email: "editor@folio.press", password: "folio-editor", role: "Super Administrator" },
  { email: "jonah@folio.press", password: "folio-jonah", role: "Editor" },
  { email: "elsa@folio.press", password: "folio-elsa", role: "Author" },
  { email: "reader@folio.press", password: "folio-reader", role: "Subscriber" },
];

export async function seedDatabase(db: D1DatabaseLike) {
  const stmts: D1Stmt[] = [];
  // Idempotent: a partially completed seed can be resumed safely.
  const add = (sql: string, ...values: unknown[]) =>
    stmts.push(db.prepare(sql.replace(/^INSERT INTO /, "INSERT OR IGNORE INTO ")).bind(...values));

  // settings
  const settings: Record<string, string> = {
    site_name: "FOLIO",
    tagline: "An independent magazine of ideas, culture and the modern world.",
    issue: "Issue 47 · Autumn 2026",
    contact_email: "desk@folio.press",
    address: "Rua da Boavista 84, 1200-068 Lisbon",
    newsletter_frequency: "weekly",
    comments_moderated: "true",
    ads_enabled: "true",
    cookie_banner: "true",
    social_x: "https://x.com/foliopress",
    social_instagram: "https://instagram.com/foliopress",
    social_linkedin: "https://linkedin.com/company/foliopress",
  };
  for (const [k, v] of Object.entries(settings)) add("INSERT INTO site_settings (key, value) VALUES (?, ?)", k, v);

  // users
  for (const u of users) {
    const hash = await hashPassword(u.password);
    add(
      `INSERT INTO users (id, email, password_hash, name, slug, role, avatar_url, bio, title, twitter, email_verified, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      u.id, u.email, hash, u.name, u.slug, u.role, u.avatar, u.bio, u.title, u.twitter ?? null, iso(400),
    );
  }

  // categories
  for (const c of categories) {
    add("INSERT INTO categories (id, slug, name, description, accent, sort_order) VALUES (?, ?, ?, ?, ?, ?)",
      c.id, c.slug, c.name, c.description, c.accent, c.order);
  }

  // tags
  const tagIds: Record<string, string> = {};
  tags.forEach((t, i) => {
    tagIds[t] = id("tag", i + 1);
    add("INSERT INTO tags (id, slug, name) VALUES (?, ?, ?)", tagIds[t], t, t.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()));
  });

  // articles
  for (const a of articles) {
    const status = a.status ?? "published";
    const published = status === "published" ? iso(a.daysAgo) : status === "scheduled" ? iso(-3) : null;
    add(
      `INSERT INTO articles (id, slug, title, dek, excerpt, content_html, cover_url, cover_caption, cover_alt, category_id, author_id,
        status, featured, editors_pick, breaking, collection, views, reading_minutes, seo_title, seo_description, preview_token, published_at, updated_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      a.id, a.slug, a.title, a.dek, a.excerpt, a.body, a.cover, a.coverCaption, a.coverCaption,
      a.category, a.author, status, a.featured ? 1 : 0, a.pick ? 1 : 0, a.breaking ? 1 : 0, a.collection ?? null,
      a.views, readingMinutes(a.body), a.title, a.dek, randomToken(8), published, iso(Math.max(0, a.daysAgo - 1), 12), iso(a.daysAgo + 2),
    );
    for (const t of a.tags) {
      if (tagIds[t]) add("INSERT OR IGNORE INTO article_tags (article_id, tag_id) VALUES (?, ?)", a.id, tagIds[t]);
    }
    add(
      `INSERT INTO article_revisions (id, article_id, title, dek, content_html, editor_id, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      `${a.id}-rev-1`, a.id, a.title, a.dek, a.body, a.author, "Initial publication", published ?? iso(a.daysAgo),
    );
  }

  // newsletters
  for (const e of editions) {
    add(
      `INSERT INTO newsletter_editions (id, slug, title, subject, preheader, body_html, status, featured, recipients, opens, clicks, scheduled_at, sent_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      e.id, e.slug, e.title, e.subject, e.preheader, e.body, e.status, e.featured,
      e.recipients, e.opens, e.clicks,
      iso(e.daysAgo - 1, 6), e.status === "sent" ? iso(e.daysAgo, 6) : null, iso(e.daysAgo + 4, 15),
    );
  }
  add(
    `INSERT INTO newsletter_campaigns (id, name, edition_id, segment, frequency, status, recipients, opens, clicks, sent_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    "cmp-01", "Sunday Edition — weekly send", "ed-01", "all", "weekly", "sent", 38420, 21410, 4890, iso(2, 6), iso(4),
  );
  add(
    `INSERT INTO newsletter_campaigns (id, name, edition_id, segment, frequency, status, recipients, opens, clicks, sent_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    "cmp-02", "Culture desk — monthly digest", null, "culture", "monthly", "draft", 0, 0, 0, null, iso(1),
  );

  // subscribers
  const subscriberRows: [string, string, string, string, string, string, number][] = [
    ["hello@example.com", "Weekly", "weekly", "confirmed", "website", "[\"sunday-edition\"]", 120],
    ["reader@folio.press", "Sam Whitlock", "weekly", "confirmed", "website", "[\"sunday-edition\",\"science\"]", 380],
    ["m.okafor@example.com", "M. Okafor", "daily", "confirmed", "article-inline", "[\"sunday-edition\",\"technology\"]", 96],
    ["j.lindqvist@example.com", "J. Lindqvist", "monthly", "confirmed", "homepage", "[\"culture\"]", 74],
    ["ana.pereira@example.com", "Ana Pereira", "weekly", "confirmed", "referral", "[\"sunday-edition\"]", 61],
    ["t.nakamura@example.com", "T. Nakamura", "weekly", "pending", "homepage", "[\"sunday-edition\"]", 0],
    ["dubois@example.com", "C. Dubois", "weekly", "unsubscribed", "homepage", "[]", 300],
    ["h.svensson@example.com", "H. Svensson", "daily", "confirmed", "article-inline", "[\"technology\",\"science\"]", 45],
    ["k.mensah@example.com", "K. Mensah", "weekly", "confirmed", "referral", "[\"sunday-edition\"]", 22],
    ["r.iyer@example.com", "R. Iyer", "monthly", "confirmed", "website", "[\"culture\",\"sunday-edition\"]", 200],
    ["l.moreau@example.com", "L. Moreau", "weekly", "confirmed", "homepage", "[\"sunday-edition\"]", 12],
    ["p.andersen@example.com", "P. Andersen", "weekly", "pending", "homepage", "[\"sunday-edition\"]", 2],
  ];
  subscriberRows.forEach(([email, name, freq, status, source, topics, days], i) => {
    add(
      `INSERT INTO subscribers (id, email, name, status, frequency, topics, token, source, confirmed_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id("sub", i + 1), email, name, status, freq, topics, randomToken(10), source,
      status === "confirmed" ? iso(days, 8) : null, iso(days, 8),
    );
  });

  // media
  mediaItems.forEach((m) => {
    add(
      `INSERT INTO media (id, url, filename, alt, caption, folder, mime, credit, uploaded_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'image/jpeg', 'FOLIO', 'usr-marguerite', ?)`,
      m.id, IMG(m.photo, 1600), m.name, m.alt, m.caption, m.folder, iso(30),
    );
  });

  // ads
  add(
    `INSERT INTO advertisements (id, name, placement, image_url, body, link_url, advertiser, active, impressions, clicks, starts_at, ends_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, 184200, 2140, ?, ?)`,
    "ad-01", "Membership — autumn campaign", "sidebar",
    IMG("photo-1497366754035-f200968a6e72", 800),
    "Independent journalism, funded by readers. Join FOLIO from €6 a month.",
    "/membership", "FOLIO", iso(30), iso(-30),
  );
  add(
    `INSERT INTO advertisements (id, name, placement, body, link_url, advertiser, active, impressions, clicks, starts_at, ends_at)
     VALUES (?, ?, ?, ?, ?, ?, 1, 96500, 1180, ?, ?)`,
    "ad-02", "Newsletter house ad", "inline", "The Sunday Edition. One long read, three short ones, no noise.", "/newsletter", "FOLIO", iso(20), iso(-20),
  );

  // comments
  const commentRows: [string, string, string, string, string][] = [
    ["art-attention", "Ines V.", "ines@example.com", "The still room at the Van Nelle is the best thing in Rotterdam and almost nobody knows it exists. Glad to see it written about properly.", "approved"],
    ["art-attention", "a reader", "reader2@example.com", "Do you have the open specification link? The piece mentions it but I cannot find it.", "approved"],
    ["art-machines", "D. Osei", "d.osei@example.com", "The point about supervision being a new skill is the one I keep coming back to.", "pending"],
    ["art-boredom", "H. Marsh", "hm@example.com", "Disagree almost entirely, but this is elegantly argued.", "approved"],
    ["art-nighttrain", "Léa", "lea@example.com", "I took the Trieste–Ljubljana sleeper last month and the conductor was still explaining the line.", "approved"],
  ];
  commentRows.forEach(([article, name, email, body, status], i) => {
    add(
      `INSERT INTO comments (id, article_id, author_name, author_email, body, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      id("cmt", i + 1), article, name, email, body, status, iso(i + 1, 11),
    );
  });

  // reader bookmarks + history
  add("INSERT INTO bookmarks (user_id, article_id, created_at) VALUES (?, ?, ?)", "usr-reader", "art-attention", iso(1));
  add("INSERT INTO bookmarks (user_id, article_id, created_at) VALUES (?, ?, ?)", "usr-reader", "art-deepfield", iso(4));
  add("INSERT INTO bookmarks (user_id, article_id, created_at) VALUES (?, ?, ?)", "usr-reader", "art-payfornews", iso(9));
  [["art-attention", 82, 1], ["art-machines", 64, 2], ["art-nighttrain", 100, 3], ["art-birds", 31, 5]].forEach(([a, prog, days], i) => {
    add("INSERT INTO reading_history (id, user_id, article_id, progress, read_at) VALUES (?, ?, ?, ?, ?)",
      id("hist", i + 1), "usr-reader", a as string, prog as number, iso(days as number, 20));
  });

  // analytics events (deterministic)
  const sources = ["direct", "search", "newsletter", "social", "referral"];
  const published = articles.filter((a) => (a.status ?? "published") === "published");
  let seed = 42;
  const rand = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  let evt = 0;
  for (let day = 0; day < 45; day++) {
    for (const a of published) {
      const base = Math.max(1, Math.round((a.views / 400) * (1 - day / 70)));
      const count = Math.max(1, Math.round(base * (0.5 + rand())));
      for (let k = 0; k < count; k++) {
        evt++;
        const src = sources[Math.floor(rand() * sources.length)];
        add(
          `INSERT INTO analytics_events (id, article_id, category_id, path, referrer, source, session_id, kind, dwell_seconds, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'view', ?, ?)`,
          `evt-${evt}`, a.id, a.category, `/article/${a.slug}`, src === "newsletter" ? "email" : src,
          src, `sess-${evt % 900}`, Math.round(20 + rand() * 300), iso(day, 7 + Math.floor(rand() * 14)),
        );
      }
    }
  }

  // activity
  const activity: [string, string, string, string][] = [
    ["Marguerite Oyelaran", "published", "The Quiet Architecture of Attention", "2 hours ago"],
    ["Jonah Reyes", "submitted for review", "The Battery That Refuses to Die", "5 hours ago"],
    ["Priya Raghunathan", "edited", "Who Owns the Harvest?", "Yesterday"],
    ["Marguerite Oyelaran", "approved comment on", "In Defence of Boredom", "Yesterday"],
    ["Nina Aldridge", "scheduled", "The New Rules of the Long Table", "2 days ago"],
    ["Elsa Krag", "created", "The Silence of the Birds at Dawn", "3 days ago"],
  ];
  activity.forEach(([actor, action, target, when], i) => {
    add("INSERT INTO activity_log (id, actor, action, target, created_at) VALUES (?, ?, ?, ?, ?)",
      id("act", i + 1), actor, action, target, iso(i, 15 - i));
  });

  const BATCH = 25;
  for (let i = 0; i < stmts.length; i += BATCH) {
    await db.batch(stmts.slice(i, i + BATCH));
  }
}
