import { ListChecks, Plus } from "lucide-react";
import Link from "next/link";

import { CeuBadge } from "@/components/ceu-badge";
import { EmptyState } from "@/components/empty-state";
import { FormatBadge } from "@/components/format-badge";
import { ListingActions } from "@/components/trainer/listing-actions";
import { ListingStatusBadge } from "@/components/listing-status-badge";
import { SubscriptionBanner } from "@/components/subscription-banner";
import { ClearQueryParams } from "@/components/clear-query-params";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { requireTrainer } from "@/lib/auth";
import {
  getActiveListingCount,
  getTrainerListings,
  type TrainerListing,
} from "@/lib/queries/listings";
import { getSubscriptionState } from "@/lib/subscription";

export const metadata = { title: "My listings" };

function formatPrice(price: string) {
  const n = Number(price);
  return n <= 0 ? "Free" : `$${n % 1 === 0 ? n : n.toFixed(2)}`;
}

function formatSchedule(listing: TrainerListing) {
  if (listing.onDemand) return "On demand";
  if (!listing.startDate) return "No date set";
  const start = new Date(`${listing.startDate}T00:00:00`).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" },
  );
  if (listing.endDate && listing.endDate !== listing.startDate) {
    const end = new Date(`${listing.endDate}T00:00:00`).toLocaleDateString(
      "en-US",
      { month: "short", day: "numeric", year: "numeric" },
    );
    return `${start} – ${end}`;
  }
  return start;
}

function formatLocation(listing: TrainerListing) {
  if (listing.isOnline) return "Online / Any state";
  if (listing.states.length === 0) return "—";
  return listing.states.join(", ");
}

const BANNERS: Record<string, { tone: "success" | "warn"; text: React.ReactNode }> = {
  "new=published": {
    tone: "success",
    text: "Listing created and submitted for review.",
  },
  "new=limit": {
    tone: "warn",
    text: (
      <>
        Listing saved as a draft — you've reached your plan's active listing limit.{" "}
        <Link href="/billing" className="underline font-medium hover:text-amber-900">
          Upgrade to Pro
        </Link>{" "}
        or unpublish another to publish it.
      </>
    ),
  },
  "updated=1": { tone: "success", text: "Listing updated." },
  "error=limit": {
    tone: "warn",
    text: (
      <>
        You've reached your active listing limit.{" "}
        <Link href="/billing" className="underline font-medium hover:text-amber-900">
          Upgrade to Pro
        </Link>{" "}
        or unpublish another listing first.
      </>
    ),
  },
  "error=rejected": {
    tone: "warn",
    text: "This listing was rejected. Please edit the listing to address the feedback and resubmit it for review.",
  },
};

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const profile = await requireTrainer();
  const [listings, activeCount] = await Promise.all([
    getTrainerListings(profile.id),
    getActiveListingCount(profile.id),
  ]);
  const subscription = getSubscriptionState(profile);

  const sp = await searchParams;
  const bannerKey = sp.new
    ? `new=${sp.new}`
    : sp.updated
      ? "updated=1"
      : sp.error
        ? `error=${sp.error}`
        : null;
  const banner = bannerKey ? BANNERS[bannerKey] : null;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            My listings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create, edit, and manage your training listings.
          </p>
        </div>
        <ButtonLink variant="coral" href="/listings/new">
          <Plus data-icon="inline-start" />
          New listing
        </ButtonLink>
      </div>

      {banner ? (
        <>
          <ClearQueryParams params={["new", "updated", "error"]} />
          <div
            className={cn(
              "rounded-lg border px-4 py-3 text-sm",
              banner.tone === "success"
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-amber-300 bg-amber-50 text-amber-700",
            )}
          >
            {banner.text}
          </div>
        </>
      ) : null}

      <SubscriptionBanner subscription={subscription} activeCount={activeCount} />

      {listings.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No listings yet"
          description="Create your first training listing to start reaching therapists searching for CEUs."
          action={
            <ButtonLink variant="coral" href="/listings/new">
              Create a listing
            </ButtonLink>
          }
        />
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <Card key={listing.id} className="space-y-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <ListingStatusBadge
                      status={listing.status}
                      active={listing.active}
                    />
                    <FormatBadge format={listing.format} />
                    {listing.hasCeu ? (
                      <CeuBadge ceCount={listing.ceCount} />
                    ) : null}
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {listing.title}
                  </h2>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span>{formatPrice(listing.price)}</span>
                    <span>{formatSchedule(listing)}</span>
                    <span>{formatLocation(listing)}</span>
                  </div>
                  {listing.tagNames.length > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      {listing.tagNames.join(" · ")}
                    </p>
                  ) : null}
                </div>
              </div>

              {listing.status === "rejected" && listing.rejectionReason ? (
                <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <span className="font-medium">Rejected:</span>{" "}
                  {listing.rejectionReason}
                </p>
              ) : null}

              <div className="border-t border-border pt-3">
                <ListingActions
                  id={listing.id}
                  slug={listing.slug}
                  active={listing.active}
                  canPreview
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
