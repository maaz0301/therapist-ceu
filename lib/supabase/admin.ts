import "server-only";

import { createClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";

/**
 * Service-role Supabase client. BYPASSES RLS — use only in trusted server code
 * (Server Actions / Route Handlers) that has already verified the caller.
 * Currently used for Storage uploads to the listing-images bucket.
 */
export function createSupabaseAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable.");
  }

  return createClient(env.supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export const LISTING_IMAGE_BUCKET = "listing-images";
