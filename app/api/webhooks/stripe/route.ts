import "server-only";
import { headers } from "next/headers";
import { eq, and, desc } from "drizzle-orm";
import type Stripe from "stripe";

import { stripe, STRIPE_PRICE_IDS } from "@/lib/stripe";
import { db } from "@/lib/db";
import { profiles, listings } from "@/db/schema";
import { SUBSCRIPTION_TIERS, type SubscriptionTier } from "@/lib/constants";

/**
 * Stripe webhook endpoint.
 * Verifies the signature, then updates the trainer's subscription columns
 * (profiles.subscriptionStatus / subscriptionTier / currentPeriodEnd) and
 * auto-deactivates/reactivates listings to match — per scope doc §8.
 *
 * Test locally with:
 *   stripe listen --forward-to localhost:3000/api/webhooks/stripe
 */

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

function mapStripeStatus(
  status: Stripe.Subscription.Status,
): "none" | "trialing" | "active" | "past_due" | "canceled" | "unpaid" {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    case "unpaid":
    case "paused":
      return "unpaid";
    case "incomplete":
      return "none";
    default:
      return "none";
  }
}

function tierFromPriceId(priceId: string | undefined): SubscriptionTier | null {
  if (priceId === STRIPE_PRICE_IDS.basic) return "basic";
  if (priceId === STRIPE_PRICE_IDS.pro) return "pro";
  return null;
}

/** Sync a trainer's profile + listings to match their current subscription. */
async function syncSubscriptionToProfile(
  customerId: string,
  subscription: Stripe.Subscription | null,
) {
  const [profile] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.stripeCustomerId, customerId))
    .limit(1);

  if (!profile) {
    console.error(
      `[stripe webhook] No profile found for customer ${customerId}`,
    );
    return;
  }

  if (!subscription) {
    // Subscription fully gone (e.g. deleted with no replacement).
    await db
      .update(profiles)
      .set({
        subscriptionStatus: "canceled",
        subscriptionTier: null,
        currentPeriodEnd: null,
      })
      .where(eq(profiles.id, profile.id));
    await deactivateAllListings(profile.id);
    return;
  }

  const status = mapStripeStatus(subscription.status);
  const priceId = subscription.items.data[0]?.price.id;
  const tier = tierFromPriceId(priceId);
  const periodEndUnix = subscription.items.data[0]?.current_period_end;

  await db
    .update(profiles)
    .set({
      subscriptionStatus: status,
      subscriptionTier: tier,
      currentPeriodEnd: periodEndUnix
        ? new Date(periodEndUnix * 1000)
        : null,
    })
    .where(eq(profiles.id, profile.id));

  const isActive = status === "active" || status === "trialing";
  if (!isActive) {
    await deactivateAllListings(profile.id);
  } else if (tier) {
    await reactivateListingsUpToLimit(profile.id, tier);
  }
}

async function deactivateAllListings(trainerId: string) {
  await db
    .update(listings)
    .set({ active: false })
    .where(and(eq(listings.trainerId, trainerId), eq(listings.active, true)));
}

/** Reactivate the trainer's most recent listings, up to their tier's limit. */
async function reactivateListingsUpToLimit(
  trainerId: string,
  tier: SubscriptionTier,
) {
  const max = SUBSCRIPTION_TIERS[tier].maxActiveListings;
  if (max === null) {
    // Pro = unlimited. Reactivate every approved listing.
    await db
      .update(listings)
      .set({ active: true })
      .where(
        and(eq(listings.trainerId, trainerId), eq(listings.status, "approved")),
      );
    return;
  }

  const candidates = await db
    .select({ id: listings.id })
    .from(listings)
    .where(
      and(eq(listings.trainerId, trainerId), eq(listings.status, "approved")),
    )
    .orderBy(desc(listings.createdAt))
    .limit(max);

  for (const { id } of candidates) {
    await db.update(listings).set({ active: true }).where(eq(listings.id, id));
  }
}

export async function POST(req: Request) {
  if (!webhookSecret) {
    console.error("[stripe webhook] Missing STRIPE_WEBHOOK_SECRET");
    return new Response("Webhook not configured", { status: 500 });
  }

  const body = await req.text();
  const headerList = await headers();
  const signature = headerList.get("stripe-signature");

  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe webhook] Signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const profileId = session.client_reference_id;

        if (profileId && customerId) {
          // Link the Stripe customer to this profile if not already set.
          await db
            .update(profiles)
            .set({ stripeCustomerId: customerId })
            .where(eq(profiles.id, profileId));
        }

        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string,
          );
          await syncSubscriptionToProfile(customerId, subscription);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscriptionToProfile(
          subscription.customer as string,
          subscription,
        );
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscriptionToProfile(
          subscription.customer as string,
          null,
        );
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const [profile] = await db
          .select({ id: profiles.id })
          .from(profiles)
          .where(eq(profiles.stripeCustomerId, customerId))
          .limit(1);
        if (profile) {
          await db
            .update(profiles)
            .set({ subscriptionStatus: "past_due" })
            .where(eq(profiles.id, profile.id));
        }
        // TODO: send "payment failed" transactional email once email
        // templates for this event are wired up (lib/email).
        break;
      }

      default:
        // Unhandled event types are fine to ignore.
        break;
    }
  } catch (err) {
    console.error(`[stripe webhook] Error handling ${event.type}:`, err);
    return new Response("Webhook handler error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
