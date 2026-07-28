/**
 * Shared domain constants for TherapistCEU.com.
 * These mirror the Phase 1 scope and are reused across the directory,
 * trainer portal, and admin. Keep this the single source of truth.
 */

/**
 * Promo image limits. Shared so the client upload field can reject bad files
 * before they are ever sent — an oversized body blows past the request size
 * limit and surfaces as a generic "something went wrong" crash.
 *
 * 4 MB is dictated by the host: Vercel caps serverless function request bodies
 * at 4.5 MB, and that ceiling is not raisable from `next.config.ts`. The cap
 * covers the whole multipart body, so the image limit sits below it to leave
 * room for the rest of the listing fields.
 */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const IMAGE_TYPE_ERROR = "Use a PNG, JPG, or WebP image.";
export const IMAGE_SIZE_ERROR = "Image must be under 4 MB.";

/** Description length cap — mirrored by the textarea's maxLength attribute. */
export const DESCRIPTION_MAX = 5000;

export const LISTING_FORMATS = [
  "Live Virtual",
  "In-Person",
  "On-Demand",
  "Hybrid",
] as const;
export type ListingFormat = (typeof LISTING_FORMATS)[number];

export const CEU_PROVIDERS = [
  "APA",
  "NBCC",
  "ACE/NASW",
  "APT (Association for Play Therapy)",
  "State Board Approved",
  "Non-CE",
] as const;
export type CeuProvider = (typeof CEU_PROVIDERS)[number];

export const PRICE_RANGES = [
  { id: "under-100", label: "Under $100", min: 0, max: 100 },
  { id: "100-250", label: "$100–$250", min: 100, max: 250 },
  { id: "250-500", label: "$250–$500", min: 250, max: 500 },
  { id: "500-plus", label: "$500+", min: 500, max: null },
] as const;
export type PriceRangeId = (typeof PRICE_RANGES)[number]["id"];

export const TAG_CATEGORIES = [
  { id: "modality", label: "Modality" },
  { id: "population", label: "Population" },
  { id: "topic", label: "Topic / Presenting Problem" },
  { id: "business", label: "Business / Practice" },
] as const;
export type TagCategory = (typeof TAG_CATEGORIES)[number]["id"];

export const SUBSCRIPTION_TIERS = {
  basic: { id: "basic", label: "Basic", price: 19, maxActiveListings: 2 },
  pro: { id: "pro", label: "Pro", price: 29, maxActiveListings: null },
} as const;
export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;

/**
 * Location options. "ONLINE" is a pseudo-location (matches every listing that
 * is online); "INTL" is a real, selectable location stored in listing_states
 * like any state code, for trainings held outside the US (e.g. CEU retreats).
 */
export const US_STATES = [
  { code: "ONLINE", name: "Online / Any State" },
  { code: "INTL", name: "Outside the US" },
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "DC", name: "District of Columbia" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
] as const;

/** The full Phase 1 tag taxonomy (seed source of truth). */
export const TAG_TAXONOMY: Record<TagCategory, string[]> = {
  modality: [
    "CBT",
    "DBT",
    "ACT",
    "EMDR",
    "IFS/Parts work/Ego states",
    "Somatic & body-based (Somatic Experiencing, sensorimotor, Brainspotting)",
    "Play therapy (CCPT, sand tray)",
    "Attachment based",
    "Exposure Therapies",
    "Mindfulness-based (MBSR, MBCT)",
    "Motivational Interviewing",
    "Expressive arts (art, music, drama)",
  ],
  population: [
    "Children (under 12)",
    "Adolescents",
    "Adults",
    "Older Adults",
    "Couples",
    "Families",
    "Perinatal / Postpartum",
    "LGBTQ+ Clients",
    "First Responders",
    "Neurodivergent Clients",
  ],
  topic: [
    "Trauma",
    "Anxiety",
    "Depression",
    "Grief and Loss",
    "Attachment",
    "Autism / Developmental",
    "Eating Disorders",
    "Addiction / Substance Use",
    "Perinatal Mental Health",
    "Parenting",
    "School-Based Issues",
    "Chronic Illness",
    "Suicide Prevention",
    "Cultural Competence / Diversity",
    "ADHD / Executive Functioning",
  ],
  business: [
    "Private Practice Building",
    "Ethics and Law",
    "Documentation and Notes",
    "Clinical Supervision",
    "Telehealth",
    "Marketing Your Practice",
    "Insurance and Billing",
    "Clinician Burnout / Wellness",
  ],
};
