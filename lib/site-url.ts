import "server-only";

import { headers } from "next/headers";

import { env } from "@/lib/env";

/**
 * Absolute base URL for the *current request*.
 *
 * Anything Stripe or an email links back to must point at the domain the user
 * is actually on. Reading `process.env.NEXT_PUBLIC_APP_URL` at module scope
 * cannot do that: it is captured at build time, and when the variable is unset
 * in the deployed environment it silently falls back to localhost — which is
 * how a real checkout ended up redirecting to `localhost:3000`.
 *
 * Resolution order:
 *  1. `NEXT_PUBLIC_APP_URL` when explicitly configured — the operator's word wins.
 *  2. The forwarded host of this request, which is always the live domain.
 *  3. `VERCEL_URL`, for contexts with no inbound request (cron, build).
 */
export async function getBaseUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return env.appUrl;

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) {
    const proto =
      h.get("x-forwarded-proto") ??
      (host.startsWith("localhost") || host.startsWith("127.0.0.1")
        ? "http"
        : "https");
    return `${proto}://${host}`;
  }

  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return env.appUrl;
}
