import "server-only";

import { sql } from "drizzle-orm";

import { db } from "@/lib/db";

export type AnalyticsPeriod = "30d" | "90d" | "12m" | "all";

export const ANALYTICS_PERIODS: { id: AnalyticsPeriod; label: string }[] = [
  { id: "30d", label: "Last 30 days" },
  { id: "90d", label: "Last 90 days" },
  { id: "12m", label: "Last 12 months" },
  { id: "all", label: "All time" },
];

export function periodToSince(period: AnalyticsPeriod): Date | null {
  const now = new Date();
  switch (period) {
    case "30d":
      return new Date(now.getTime() - 30 * 864e5);
    case "90d":
      return new Date(now.getTime() - 90 * 864e5);
    case "12m": {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      return d;
    }
    default:
      return null;
  }
}

export type PerListingStat = {
  id: string;
  title: string;
  views: number;
  clicks: number;
};

export type TrendPoint = { day: string; views: number };

export type TrainerAnalytics = {
  totals: { views: number; clicks: number };
  perListing: PerListingStat[];
  trend: TrendPoint[];
};

export async function getTrainerAnalytics(
  trainerId: string,
  period: AnalyticsPeriod,
): Promise<TrainerAnalytics> {
  const since = periodToSince(period);
  const sinceClause = since
    ? sql`and e.created_at >= ${since.toISOString()}`
    : sql``;

  const perListingRows = await db.execute<{
    id: string;
    title: string;
    views: number;
    clicks: number;
  }>(sql`
    select
      l.id,
      l.title,
      count(e.id) filter (where e.type = 'view')::int as views,
      count(e.id) filter (where e.type = 'link_click')::int as clicks
    from listings l
    left join analytics_events e
      on e.listing_id = l.id ${sinceClause}
    where l.trainer_id = ${trainerId}
    group by l.id, l.title
    order by views desc, l.created_at desc
  `);

  const perListing = perListingRows as unknown as PerListingStat[];

  const totals = perListing.reduce(
    (acc, r) => ({
      views: acc.views + Number(r.views),
      clicks: acc.clicks + Number(r.clicks),
    }),
    { views: 0, clicks: 0 },
  );

  const trendRows = await db.execute<{ day: string; views: number }>(sql`
    select
      to_char(date_trunc('day', e.created_at), 'YYYY-MM-DD') as day,
      count(*)::int as views
    from analytics_events e
    join listings l on l.id = e.listing_id
    where l.trainer_id = ${trainerId}
      and e.type = 'view'
      ${since ? sql`and e.created_at >= ${since.toISOString()}` : sql``}
    group by day
    order by day asc
  `);

  return {
    totals,
    perListing: perListing.map((r) => ({
      ...r,
      views: Number(r.views),
      clicks: Number(r.clicks),
    })),
    trend: (trendRows as unknown as TrendPoint[]).map((r) => ({
      day: r.day,
      views: Number(r.views),
    })),
  };
}
