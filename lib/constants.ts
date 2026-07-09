/**
 * Shared domain constants for TherapistCEU.com.
 * These mirror the Phase 1 scope and are reused across the directory,
 * trainer portal, and admin. Keep this the single source of truth.
 */

export const LISTING_FORMATS = [
  "Live Virtual",
  "In-Person",
  "On-Demand",
  "Hybrid",
] as const;
export type ListingFormat = (typeof LISTING_FORMATS)[number];

export const CEU_PROVIDERS = ["APA", "NBCC", "ACE/NASW", "State Board Approved", "Non-CE"] as const;
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

export const US_STATES = [
  { code: "ONLINE", name: "Online / Any State" },
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
    "EMDR",
    "Play Therapy",
    "Child-Centered Play Therapy (CCPT)",
    "Cognitive Behavioral Therapy (CBT)",
    "Dialectical Behavior Therapy (DBT)",
    "Acceptance and Commitment Therapy (ACT)",
    "Internal Family Systems (IFS)",
    "Somatic Therapy",
    "Motivational Interviewing",
    "Narrative Therapy",
    "Gottman Method",
    "Emotionally Focused Therapy (EFT)",
    "Sandtray Therapy",
    "Art Therapy",
    "Brainspotting",
    "Trauma-Focused CBT (TF-CBT)",
    "SPACE Program",
    "Filial Therapy",
    "Theraplay",
    "Child Parent Psychotherapy (CPP)",
    "Parent Child Interaction Therapy (PCIT)",
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
  ],
  business: [
    "Private Practice Building",
    "Ethics and Law",
    "Documentation and Notes",
    "Clinical Supervision",
    "Telehealth",
    "Marketing Your Practice",
    "Insurance and Billing",
  ],
};
