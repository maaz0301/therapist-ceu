import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { profiles, type Profile } from "@/db/schema";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Server-side auth helpers. Authorization is enforced HERE (and in Server
 * Actions); RLS is the backstop. Wrapped in React `cache` so a single request
 * only hits Supabase / the DB once.
 */

export type SessionUser = { id: string; email: string | null };

/**
 * Verifies the caller's JWT and returns its subject.
 *
 * Uses `getClaims()` rather than `getUser()`: this project signs tokens with
 * asymmetric (ES256) keys, so the signature is verified locally via WebCrypto
 * against a cached JWKS — no network round-trip. `getUser()` calls the Auth
 * server on every invocation (~700ms from this region), which is the single
 * largest cost in a page render. Verification is equally strong; it is the
 * transport that changes, not the trust model.
 *
 * Note: if the project is ever switched back to a symmetric JWT secret,
 * `getClaims()` silently falls back to a network call — correct, just slow.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;

  return {
    id: data.claims.sub,
    email: (data.claims.email as string | undefined) ?? null,
  };
});

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getSessionUser();
  if (!user) return null;

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  return profile ?? null;
});

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

/** Trainer area: any authenticated profile (admins included) may enter. */
export async function requireTrainer(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.accountStatus === "suspended" && profile.role !== "admin") {
    redirect("/suspended");
  }
  return profile;
}

/** Admin area: must be role=admin, otherwise bounce to the trainer dashboard. */
export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "admin") redirect("/dashboard");
  return profile;
}
