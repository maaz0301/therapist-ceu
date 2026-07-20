import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Handles email links that arrive as a `token_hash` + `type` (the default
 * Supabase email template format) rather than a PKCE `code`.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  // Only allow same-origin relative paths, so a crafted `next` can't turn a
  // link in our own email into an off-site redirect.
  const requestedNext = searchParams.get("next") ?? "/dashboard";
  const next =
    requestedNext.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/dashboard";

  if (tokenHash && type) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error(`[auth/confirm] verifyOtp failed (type=${type}):`, error);
  }

  return NextResponse.redirect(
    `${origin}/login?error=Could not verify the link. It may have expired.`,
  );
}
