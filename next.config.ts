import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Nodemailer resolves transports and TLS certs through dynamic requires that
   * the bundler can't trace, so leave it as a real Node dependency at runtime.
   */
  serverExternalPackages: ["nodemailer"],
  experimental: {
    serverActions: {
      /**
       * The Server Action body limit defaults to 1 MB, and exceeding it throws
       * before the action runs — a valid promo image surfaced as a generic
       * error page. Set to 4.5 MB to match Vercel's hard serverless request
       * cap, so local dev fails exactly where production does rather than
       * accepting uploads that would 413 once deployed.
       */
      bodySizeLimit: "4.5mb",
    },
    /**
     * Next 16 defaults `dynamic` to 0, so every dashboard tab switch — and
     * every back/forward — refetches the whole RSC payload from the server.
     * With the database in ap-southeast-2 that round-trip is expensive, so
     * hold dynamic pages briefly in the client router cache. 30s is short
     * enough that listing edits (which call revalidatePath anyway) still
     * show up promptly.
     */
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
};

export default nextConfig;
