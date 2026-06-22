import type { MetadataRoute } from "next";

import { env } from "@/lib/env";
import { getSitemapListings } from "@/lib/queries/directory";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.appUrl.replace(/\/$/, "");

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/directory`, changeFrequency: "daily", priority: 0.9 },
  ];

  let listingRoutes: MetadataRoute.Sitemap = [];
  try {
    const listings = await getSitemapListings();
    listingRoutes = listings.map((l) => ({
      url: `${base}/listings/${l.slug}`,
      lastModified: l.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch {
    // If the DB is unreachable at build, still emit the static sitemap.
  }

  return [...staticRoutes, ...listingRoutes];
}
