import {
  BarChart3,
  Eye,
  ListChecks,
  MousePointerClick,
  Plus,
} from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { ListingStatusBadge } from "@/components/listing-status-badge";
import { StatCard } from "@/components/analytics/stat-card";
import { SubscriptionBanner } from "@/components/subscription-banner";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { requireTrainer } from "@/lib/auth";
import { getTrainerAnalytics } from "@/lib/queries/analytics";
import {
  getActiveListingCount,
  getTrainerListingCounts,
  getTrainerListings,
} from "@/lib/queries/listings";
import { getSubscriptionState } from "@/lib/subscription";

export const metadata = { title: "Dashboard" };

export default async function TrainerDashboardPage() {
  const profile = await requireTrainer();

  const [counts, activeCount, analytics, listings] = await Promise.all([
    getTrainerListingCounts(profile.id),
    getActiveListingCount(profile.id),
    getTrainerAnalytics(profile.id, "all"),
    getTrainerListings(profile.id),
  ]);
  const subscription = getSubscriptionState(profile);
  const recent = listings.slice(0, 5);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Welcome{profile.fullName ? `, ${profile.fullName}` : ""}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your trainings and track their performance.
          </p>
        </div>
        <ButtonLink variant="coral" href="/listings/new">
          <Plus data-icon="inline-start" />
          New listing
        </ButtonLink>
      </div>

      <SubscriptionBanner subscription={subscription} activeCount={activeCount} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active listings"
          value={activeCount}
          icon={ListChecks}
          hint={`${counts.pending} pending review`}
        />
        <StatCard label="Total views" value={analytics.totals.views} icon={Eye} />
        <StatCard
          label="Link clicks"
          value={analytics.totals.clicks}
          icon={MousePointerClick}
        />
        <StatCard
          label="Total listings"
          value={counts.total}
          icon={BarChart3}
        />
      </div>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">Recent listings</h2>
          {listings.length > 0 ? (
            <ButtonLink variant="ghost" size="sm" href="/listings">
              View all
            </ButtonLink>
          ) : null}
        </div>

        {recent.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="No listings yet"
            description="Create your first training listing to start reaching therapists."
            action={
              <ButtonLink variant="coral" href="/listings/new">
                Create a listing
              </ButtonLink>
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {recent.map((listing) => (
              <li
                key={listing.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {listing.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {listing.format}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <ListingStatusBadge
                    status={listing.status}
                    active={listing.active}
                  />
                  <ButtonLink
                    variant="outline"
                    size="sm"
                    href={`/listings/${listing.slug}/edit`}
                  >
                    Edit
                  </ButtonLink>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
