import type { ListingCardData } from "@/components/listing-card";

/**
 * Demo data for the Phase 0 landing showcase + styleguide only.
 * Replaced by real database listings in Phase 1 (seed) and Phase 3 (directory).
 */
export const SAMPLE_LISTINGS: ListingCardData[] = [
  {
    slug: "emdr-intensive-trauma",
    title: "EMDR Intensive: Treating Complex Trauma",
    trainerName: "Dr. Alyssa Romero",
    credentials: "PhD, LCSW",
    format: "Live Virtual",
    hasCeu: true,
    ceCount: "12",
    price: 349,
    location: "Online",
    schedule: "Starts Oct 14",
    excerpt:
      "A two-day live virtual intensive on applying EMDR to complex, developmental trauma with live consultation.",
  },
  {
    slug: "play-therapy-foundations",
    title: "Child-Centered Play Therapy Foundations",
    trainerName: "Marcus Bell",
    credentials: "LPC, RPT",
    format: "On-Demand",
    hasCeu: true,
    ceCount: "6",
    price: 129,
    location: "Online",
    schedule: "On Demand",
    excerpt:
      "On-demand certificate course covering the core skills and theory of child-centered play therapy.",
  },
  {
    slug: "private-practice-launch",
    title: "Launch Your Private Practice in 90 Days",
    trainerName: "Priya Nair",
    credentials: "LMFT",
    format: "Live Virtual",
    hasCeu: false,
    ceCount: null,
    price: 0,
    location: "Online",
    schedule: "Starts Nov 2",
    excerpt:
      "A free live workshop on the business essentials of starting a thriving cash-pay private practice.",
  },
  {
    slug: "dbt-skills-in-person",
    title: "DBT Skills Group Facilitation",
    trainerName: "Dr. Wendell Ford",
    credentials: "PsyD",
    format: "In-Person",
    hasCeu: true,
    ceCount: "14",
    price: 525,
    location: "Austin, TX",
    schedule: "Dec 5–6",
    excerpt:
      "Hands-on, in-person training on running effective DBT skills groups across adolescent and adult populations.",
  },
];
