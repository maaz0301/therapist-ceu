import "server-only";
import Stripe from "stripe";

/**
 * The client is created on first use, not at import time. Next.js imports
 * every route module while building, and a missing STRIPE_SECRET_KEY must not
 * fail the whole deploy — it should only fail the request that needs Stripe.
 */
let client: Stripe | null = null;

function getStripe(): Stripe {
  if (client) return client;
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) {
    throw new Error(
      "Missing STRIPE_SECRET_KEY. Set it in .env.local or your hosting environment.",
    );
  }
  client = new Stripe(secretKey, { typescript: true });
  return client;
}

/** Same `stripe.xxx` API as before; the real client is built on first access. */
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    return Reflect.get(getStripe(), prop, receiver);
  },
});

export const STRIPE_PRICE_IDS = {
  basic: process.env.STRIPE_PRICE_BASIC ?? "",
  pro: process.env.STRIPE_PRICE_PRO ?? "",
} as const;
