// Email utilities
export interface NewsletterSignup {
  email: string;
  name?: string;
}

export function formatNewsletterEmail(data: NewsletterSignup) {
  return {
    from: "FOLIO <dispatch@folio.press>",
    to: data.email,
    subject: "Welcome to FOLIO Magazine",
    text: `Welcome to FOLIO Magazine!\n\nWe're glad you're here.\n\nBest regards,\nThe FOLIO Team`,
  };
}