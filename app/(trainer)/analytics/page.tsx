import { Eye, MousePointerClick, TrendingUp } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { StatCard } from "@/components/analytics/stat-card";
import { TrendChart } from "@/components/analytics/trend-chart";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { requireTrainer, requireUser } from "@/lib/auth";
import {
  ANALYTICS_PERIODS,
  getTrainerAnalytics,
  type AnalyticsPeriod,
} from "@/lib/queries/analytics";

export const metadata = { title: "Analytics" };

function isPeriod(value: string | undefined): value is AnalyticsPeriod {
  return value === "30d" || value === "90d" || value === "12m" || value === "all";
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const [user, sp] = await Promise.all([requireUser(), searchParams]);
  const period: AnalyticsPeriod = isPeriod(sp.period) ? sp.period : "all";

  const [, analytics] = await Promise.all([
    requireTrainer(),
    getTrainerAnalytics(user.id, period),
  ]);
  const ctr =
    analytics.totals.views > 0
      ? Math.round((analytics.totals.clicks / analytics.totals.views) * 100)
      : 0;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Views and registration-link clicks across your listings.
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {ANALYTICS_PERIODS.map((p) => (
            <ButtonLink
              key={p.id}
              variant={p.id === period ? "default" : "ghost"}
              size="sm"
              href={`/analytics?period=${p.id}`}
            >
              {p.label}
            </ButtonLink>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total views" value={analytics.totals.views} icon={Eye} />
        <StatCard
          label="Link clicks"
          value={analytics.totals.clicks}
          icon={MousePointerClick}
        />
        <StatCard
          label="Click-through rate"
          value={`${ctr}%`}
          icon={TrendingUp}
          hint="Clicks ÷ views"
        />
      </div>

      <Card className="space-y-4 p-6">
        <h2 className="font-heading text-lg font-semibold">Views over time</h2>
        <TrendChart data={analytics.trend} />
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 font-heading text-lg font-semibold">
          Per-listing performance
        </h2>
        {analytics.perListing.length === 0 ? (
          <EmptyState
            icon={Eye}
            title="No data yet"
            description="Once your listings are live and getting traffic, you'll see per-listing stats here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Listing</th>
                  <th className="pb-2 text-right font-medium">Views</th>
                  <th className="pb-2 text-right font-medium">Clicks</th>
                  <th className="pb-2 text-right font-medium">CTR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {analytics.perListing.map((row) => {
                  const rowCtr =
                    row.views > 0
                      ? Math.round((row.clicks / row.views) * 100)
                      : 0;
                  return (
                    <tr key={row.id}>
                      <td className="max-w-xs truncate py-2.5 pr-4 font-medium text-foreground">
                        {row.title}
                      </td>
                      <td className="py-2.5 text-right tabular-nums">
                        {row.views}
                      </td>
                      <td className="py-2.5 text-right tabular-nums">
                        {row.clicks}
                      </td>
                      <td
                        className={cn(
                          "py-2.5 text-right tabular-nums text-muted-foreground",
                        )}
                      >
                        {rowCtr}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
