import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { env } from "@/lib/env";

/**
 * Next.js proxy (formerly "middleware"). Two jobs:
 *  1. Refresh the Supabase auth session on every request.
 *  2. Gate protected route groups BEFORE they render, so an unauthenticated (or
 *     non-admin) request never reaches a page that queries private data. The
 *     route-group layouts keep their own guards as defense-in-depth.
 */

const TRAINER_PREFIXES = ["/dashboard", "/analytics", "/billing"];

/** Returns the required access level for a path, or null if public. */
function protectionFor(pathname: string): "trainer" | "admin" | null {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return "admin";

  if (
    TRAINER_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    )
  ) {
    return "trainer";
  }

  // Trainer listing management — but NOT the public /listings/[slug] detail page.
  if (
    pathname === "/listings" ||
    pathname === "/listings/new" ||
    (pathname.startsWith("/listings/") && pathname.endsWith("/edit"))
  ) {
    return "trainer";
  }

  return null;
}

function redirectTo(
  request: NextRequest,
  pathname: string,
  from: NextResponse,
  withNext?: string,
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  if (withNext) url.searchParams.set("next", withNext);
  const redirect = NextResponse.redirect(url);
  // Carry over any refreshed auth cookies.
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

/**
 * Rescues auth links that did not land on an auth route.
 *
 * Supabase only honours `emailRedirectTo` when it matches the project's
 * Redirect URL allow-list; otherwise it silently substitutes the bare Site URL
 * and drops our path entirely. A magic link then lands on `/` still carrying
 * its `?code=`, nothing consumes it, and the user is quietly never signed in
 * (or, when Site URL is still the default, on localhost). Rather than depend on
 * dashboard configuration being right, forward any request that carries auth
 * params to the handler that knows how to spend them.
 */
function authHandoff(request: NextRequest): NextResponse | null {
  const { pathname, searchParams } = request.nextUrl;
  if (pathname.startsWith("/auth/")) return null;

  // `error_code` is Supabase-specific, so this can't swallow an unrelated
  // `?error=` belonging to one of our own pages.
  if (searchParams.has("error_code") && pathname !== "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set(
      "error",
      searchParams.get("error_description") ??
        "Could not sign you in. The link may have expired.",
    );
    return NextResponse.redirect(url);
  }

  const code = searchParams.get("code");
  const hasTokenHash =
    searchParams.has("token_hash") && searchParams.has("type");
  if (!code && !hasTokenHash) return null;

  const url = request.nextUrl.clone();
  url.pathname = code ? "/auth/callback" : "/auth/confirm";
  if (!searchParams.has("next")) {
    // Keep the user headed where they were, except `/` — a magic link landing
    // on the marketing page means the path was stripped, not requested.
    url.searchParams.set("next", pathname === "/" ? "/dashboard" : pathname);
  }
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const handoff = authHandoff(request);
  if (handoff) return handoff;

  let response = NextResponse.next({ request });

  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Verifies the ES256 signature locally against a cached JWKS rather than
  // calling the Auth server (see lib/auth.ts for the rationale), and still
  // refreshes the session when the access token is near expiry — so this keeps
  // running on every matched request, as before.
  const { data, error } = await supabase.auth.getClaims();
  const userId = error ? null : data?.claims?.sub;

  const protection = protectionFor(request.nextUrl.pathname);
  if (protection) {
    if (!userId) {
      return redirectTo(
        request,
        "/login",
        response,
        request.nextUrl.pathname,
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
