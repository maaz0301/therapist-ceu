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

export async function proxy(request: NextRequest) {
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const protection = protectionFor(request.nextUrl.pathname);
  if (protection) {
    if (!user) {
      return redirectTo(
        request,
        "/login",
        response,
        request.nextUrl.pathname,
      );
    }

    if (protection === "admin") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      // Only bounce when we positively know the user is not an admin; if the
      // lookup fails we fall through to the layout guard rather than risk
      // locking an admin out.
      if (profile && profile.role !== "admin") {
        return redirectTo(request, "/dashboard", response);
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
