/**
 * Single source of truth for the site's identity and niche vocabulary.
 * Change this file (plus the palette in app/globals.css) to re-skin the
 * directory for any profession — no other file should hardcode a brand name.
 */
export const brand = {
  name: "Skillhive",
  tagline: "Find the right professional training, faster",
  description:
    "Search a clean, modern directory of professional courses and trainings — by topic, format, location, price and accreditation.",
  supportEmail: "support@skillhive.app",
  legalName: "Skillhive",
  /** What a "credit" is called in this niche (CEU, CPD, CE hours, PDU...). */
  credit: { short: "Credits", long: "Continuing-education credits", badge: "Credit eligible" },
  /** Words shown to users; the DB keeps its internal names. */
  terms: { provider: "Trainer", providers: "Trainers", learner: "Learner", listing: "Course" },
} as const;

export type Brand = typeof brand;
