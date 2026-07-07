/**
 * Centralized, validated access to public environment variables.
 * Server-only secrets are read directly in their modules (db, stripe, email)
 * so they never get bundled into client code.
 */

/**
 * Helper to ensure a URL string has a protocol, preventing 'Invalid URL' errors
 * during Vercel builds if e.g. VERCEL_URL is provided without https://
 */
function withProtocol(url: string | undefined, fallback: string) {
  if (!url) return fallback;
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return `https://${url}`;
  }
  return url;
}

export const env = {
  appUrl: withProtocol(process.env.NEXT_PUBLIC_APP_URL, "http://localhost:3000"),
  // Fallback to placeholder to prevent Next.js static generation from crashing
  // when @supabase/ssr does new URL() during the build step.
  supabaseUrl: withProtocol(process.env.NEXT_PUBLIC_SUPABASE_URL, "https://placeholder.supabase.co"),
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder",
};

export function assertSupabaseEnv() {
  if (
    !env.supabaseUrl ||
    !env.supabaseAnonKey ||
    env.supabaseUrl === "https://placeholder.supabase.co"
  ) {
    throw new Error(
      "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.",
    );
  }
}
