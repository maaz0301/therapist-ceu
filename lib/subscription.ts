import { SUBSCRIPTION_TIERS, type SubscriptionTier } from "@/lib/constants";
import type { Profile } from "@/db/schema";

/**
 * Reads subscription state from the profile. In Phase 1 these columns are set
 * manually for development; in Phase 5 Stripe webhooks drive them. All listing
 * limit / publish-gating logic should go through this helper so the rest of the
 * app never has to change when billing goes live.
 */

const ACTIVE_STATUSES = ["active", "trialing"] as const;

export type SubscriptionState = {
  status: Profile["subscriptionStatus"];
  tier: SubscriptionTier | null;
  isActive: boolean;
  /** Max active listings allowed; null = unlimited; 0 = cannot publish. */
  maxActiveListings: number | null;
};

type SubscriptionInput = Pick<
  Profile,
  "subscriptionStatus" | "subscriptionTier"
>;

export function getSubscriptionState(
  profile: SubscriptionInput,
): SubscriptionState {
  const isActive = (ACTIVE_STATUSES as readonly string[]).includes(
    profile.subscriptionStatus,
  );
  const tier = (profile.subscriptionTier ?? null) as SubscriptionTier | null;

  let maxActiveListings: number | null = 0;
  if (isActive && tier) {
    maxActiveListings = SUBSCRIPTION_TIERS[tier].maxActiveListings;
  }

  return { status: profile.subscriptionStatus, tier, isActive, maxActiveListings };
}

/** Whether the trainer can publish (activate) another listing. */
export function canPublishMore(
  state: SubscriptionState,
  currentActiveCount: number,
): boolean {
  if (!state.isActive) return false;
  if (state.maxActiveListings === null) return true; // unlimited (Pro)
  return currentActiveCount < state.maxActiveListings;
}

export type PublishBlockReason = "no_subscription" | "over_limit";

/**
 * Why a trainer can't take another active listing, or null if they can.
 * Distinguishes "never subscribed / lapsed" from "subscribed but at their
 * numeric cap" so callers can show an accurate message instead of a generic
 * "at your limit" that's wrong for someone with zero listings and no plan.
 */
export function publishBlockReason(
  state: SubscriptionState,
  currentActiveCount: number,
): PublishBlockReason | null {
  if (canPublishMore(state, currentActiveCount)) return null;
  return state.isActive ? "over_limit" : "no_subscription";
}

/** Tier required to publish a given number of active listings. */
export function requiredTierFor(activeListingCount: number): SubscriptionTier {
  return activeListingCount > SUBSCRIPTION_TIERS.basic.maxActiveListings!
    ? "pro"
    : "basic";
}

export function tierLabel(tier: SubscriptionTier | null): string {
  if (!tier) return "No plan";
  return SUBSCRIPTION_TIERS[tier].label;
}
