// Seed data for articles
export const SEED_ARTICLES = [
  {
    title: "Getting Started with Next.js 16",
    slug: "getting-started-nextjs-16",
    excerpt: "Learn the basics of the latest Next.js version and its new features.",
    content: "# Next.js 16 introduces...",
    image: "/images/nextjs-16.png",
  },
  {
    title: "Tailwind CSS Color System",
    slug: "tailwind-color-system",
    excerpt: "Custom color variables for your design system.",
    content: "# Custom colors in Tailwind...",
    image: "/images/tailwind-colors.png",
  },
];

export const SEED_USERS = [
  {
    email: "editor@folio.press",
    name: "Editor",
    password: "hashed-password",
    role: "editor",
  },
  {
    email: "reader@folio.press",
    name: "Reader",
    password: "hashed-password",
    role: "reader",
  },
];
