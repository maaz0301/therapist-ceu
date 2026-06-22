import type { MetadataRoute } from "next";

import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const base = env.appUrl.replace(/\/$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/dashboard",
        "/analytics",
        "/billing",
        "/listings/new",
        "/login",
        "/signup",
        "/auth",
        "/go",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
