"use server";

import { redirect } from "next/navigation";

import { stripe, STRIPE_PRICE_IDS } from "@/lib/stripe";
import { requireTrainer } from "@/lib/auth";
import { getBaseUrl } from "@/lib/site-url";
import type { SubscriptionTier } from "@/lib/constants";

/**
 * Creates a Stripe Checkout session for the given tier and redirects the
 * trainer there. `client_reference_id` links the session back to our
 * profile id so the webhook can attach the resulting Stripe customer.
 */
export async function createCheckoutSession(formData: FormData) {
  const profile = await requireTrainer();
  const tier = formData.get("tier") as SubscriptionTier;
  const priceId = STRIPE_PRICE_IDS[tier];

  if (!priceId) {
    throw new Error(`No Stripe price configured for tier "${tier}"`);
  }

  const appUrl = await getBaseUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    client_reference_id: profile.id,
    customer_email: profile.contactEmail ?? undefined,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/billing?checkout=success`,
    cancel_url: `${appUrl}/billing?checkout=canceled`,
    allow_promotion_codes: true, // founding-member coupon codes apply here
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL");
  }

  redirect(session.url);
}

/**
 * Creates a Stripe Customer Portal session so the trainer can self-serve
 * manage/cancel/upgrade their subscription, then redirects them there.
 */
export async function createPortalSession() {
  const profile = await requireTrainer();

  if (!profile.stripeCustomerId) {
    throw new Error(
      "No Stripe customer on file yet — subscribe to a plan first.",
    );
  }

  const appUrl = await getBaseUrl();

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripeCustomerId,
    return_url: `${appUrl}/billing`,
  });

  redirect(session.url);
}
