import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ListingForm } from "@/components/trainer/listing-form";
import { ButtonLink } from "@/components/ui/button-link";
import { adminUpdateListing } from "@/lib/actions/admin";
import { getAdminTrainers, getAnyListingForEdit } from "@/lib/queries/admin";
import { getGroupedTags } from "@/lib/queries/tags";
import { canPublishMore, getSubscriptionState, tierLabel } from "@/lib/subscription";

export const metadata = { title: "Edit listing" };
export const dynamic = "force-dynamic";

export default async function AdminEditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [listing, groups, trainers] = await Promise.all([
    getAnyListingForEdit(id),
    getGroupedTags(),
    getAdminTrainers(),
  ]);
  if (!listing) notFound();

  const action = adminUpdateListing.bind(null, id);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <ButtonLink variant="ghost" size="sm" href="/admin" className="-ml-2">
        <ArrowLeft data-icon="inline-start" />
        Back to queue
      </ButtonLink>
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Edit listing
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Admin edit — changes save immediately without altering the review
          status.
        </p>
      </div>
      <ListingForm
        action={action}
        groups={groups}
        listing={listing}
        submitLabel="Update Changes"
        trainerOptions={trainers.map((t) => ({
          id: t.id,
          name: t.fullName,
          email: t.contactEmail,
          plan: `${tierLabel(t.subscriptionTier)} · ${t.subscriptionStatus}`,
          totalListings: t.totalListings,
          activeListings: t.activeListings,
          atLimit: !canPublishMore(getSubscriptionState(t), t.activeListings),
        }))}
      />
    </div>
  );
}
