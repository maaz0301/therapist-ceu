import Link from "next/link";
import { ClipboardCheck } from "lucide-react";

import { AdminListingActions } from "@/components/admin/admin-listing-actions";
import { CeuBadge } from "@/components/ceu-badge";
import { EmptyState } from "@/components/empty-state";
import { FormatBadge } from "@/components/format-badge";
import { ListingStatusBadge } from "@/components/listing-status-badge";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ClearQueryParams } from "@/components/clear-query-params";
import {
  getAdminListingCounts,
  getAdminListings,
  type AdminListing,
  type AdminListingStatus,
} from "@/lib/queries/admin";
import { formatDateRange, sortDateRanges, upcomingRanges } from "@/lib/dates";

export const metadata = { title: "Listing queue" };
export const dynamic = "force-dynamic";

const TABS: { id: AdminListingStatus | "all"; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "inactive", label: "Inactive" },
  { id: "all", label: "All" },
];

function formatPrice(price: string) {
  const n = Number(price);
  return n <= 0 ? "Free" : `$${n % 1 === 0 ? n : n.toFixed(2)}`;
}

// Moderation cares about what's still to come, but a listing whose dates have
// all passed still has to be reviewable — so fall back to the last one rather
// than showing nothing.
function formatSchedule(listing: AdminListing) {
  if (listing.onDemand) return "On demand";
  if (listing.dates.length === 0) return "No date";

  const sorted = sortDateRanges(listing.dates);
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = upcomingRanges(sorted, today);
  const more = listing.dates.length - 1;
  const label = formatDateRange(upcoming[0] ?? sorted[sorted.length - 1]);

  return more > 0 ? `${label} · ${listing.dates.length} dates` : label;
}

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const statusParam = (sp.status as AdminListingStatus | "all") ?? "pending";
  const status = TABS.some((t) => t.id === statusParam) ? statusParam : "pending";

  const [counts, listings] = await Promise.all([
    getAdminListingCounts(),
    getAdminListings(status === "all" ? undefined : status),
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Listing queue
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review, approve, and manage trainer listings.
          </p>
        </div>
        <ButtonLink href="/admin/listings/new" variant="clay">
          Add listing
        </ButtonLink>
      </div>

      {sp.updated || sp.created ? (
        <>
          <ClearQueryParams params={["updated", "created"]} />
          <div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
            {sp.created ? "Listing created." : "Listing updated."}
          </div>
        </>
      ) : null}

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const count =
            tab.id === "all" ? counts.all : counts[tab.id as AdminListingStatus];
          const isActive = tab.id === status;
          return (
            <Link
              key={tab.id}
              href={tab.id === "pending" ? "/admin" : `/admin?status=${tab.id}`}
              className={cn(
                "inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors",
                isActive
                  ? "border-primary bg-primary text-primary-foreground hover:opacity-90"
                  : "border-border bg-card text-foreground hover:border-clay hover:bg-muted",
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs",
                  isActive
                    ? "bg-primary-foreground/20"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      {listings.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Nothing here"
          description="There are no listings with this status right now."
        />
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <Card key={listing.id} className="space-y-4 p-5">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <ListingStatusBadge
                    status={listing.status}
                    active={listing.active}
                  />
                  <FormatBadge format={listing.format} />
                  {listing.hasCeu ? <CeuBadge ceCount={listing.ceCount} /> : null}
                  {listing.trainerAccountStatus === "suspended" ? (
                    <Badge className="bg-destructive/15 text-destructive">
                      Trainer suspended
                    </Badge>
                  ) : null}
                </div>
                <h2 className="text-lg font-semibold text-foreground">
                  {listing.title}
                </h2>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span>By {listing.trainerName ?? "Unknown"}</span>
                  <span>{formatPrice(listing.price)}</span>
                  <span>{formatSchedule(listing)}</span>
                </div>
              </div>

              {listing.status === "rejected" && listing.rejectionReason ? (
                <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <span className="font-medium">Rejected:</span>{" "}
                  {listing.rejectionReason}
                </p>
              ) : null}

              <div className="border-t border-border pt-3">
                <AdminListingActions
                  id={listing.id}
                  slug={listing.slug}
                  status={listing.status}
                  active={listing.active}
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
