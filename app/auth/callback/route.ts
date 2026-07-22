import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * OAuth / magic-link / email-confirmation callback. Supabase redirects here with
 * a `code` (PKCE) which we exchange for a session cookie, then forward the user
 * to `next` (defaults to the dashboard).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // Only allow same-origin relative paths, so a crafted `next` can't turn a
  // link in our own email into an off-site redirect.
  const requestedNext = searchParams.get("next") ?? "/dashboard";
  const next =
    requestedNext.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/dashboard";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    // Most often the PKCE verifier cookie is absent because the link was
    // opened in a different browser than the one that requested it.
    console.error("[auth/callback] exchangeCodeForSession failed:", error);
  }

  const reason =
    searchParams.get("error_description") ??
    "Could not sign you in. The link may have expired.";
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent(reason)}`,
  );
}
