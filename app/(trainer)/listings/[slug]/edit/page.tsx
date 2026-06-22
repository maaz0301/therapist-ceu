import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ListingForm } from "@/components/trainer/listing-form";
import { ListingStatusBadge } from "@/components/listing-status-badge";
import { ButtonLink } from "@/components/ui/button-link";
import { updateListing } from "@/lib/actions/listings";
import { requireTrainer } from "@/lib/auth";
import { getOwnedListingBySlug } from "@/lib/queries/listings";
import { getGroupedTags } from "@/lib/queries/tags";

export const metadata = { title: "Edit listing" };

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await requireTrainer();

  const listing = await getOwnedListingBySlug(slug, profile.id);
  if (!listing) notFound();

  const groups = await getGroupedTags(profile.id);
  const action = updateListing.bind(null, listing.id);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <ButtonLink
          variant="ghost"
          size="sm"
          href="/listings"
          className="-ml-2 text-muted-foreground"
        >
          <ArrowLeft data-icon="inline-start" />
          Back to listings
        </ButtonLink>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Edit listing
          </h1>
          <ListingStatusBadge status={listing.status} active={listing.active} />
        </div>
        {listing.status === "rejected" && listing.rejectionReason ? (
          <p className="mt-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <span className="font-medium">Rejected:</span>{" "}
            {listing.rejectionReason} — editing will resubmit for review.
          </p>
        ) : null}
      </div>

      <ListingForm
        action={action}
        groups={groups}
        listing={listing}
        submitLabel="Save changes"
      />
    </div>
  );
}
