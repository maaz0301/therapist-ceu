import { ArrowLeft } from "lucide-react";

import { ListingForm } from "@/components/trainer/listing-form";
import { ButtonLink } from "@/components/ui/button-link";
import { adminCreateListing } from "@/lib/actions/admin";
import { getAdminTrainers } from "@/lib/queries/admin";
import { getGroupedTags } from "@/lib/queries/tags";
import { canPublishMore, getSubscriptionState, tierLabel } from "@/lib/subscription";

export const metadata = { title: "New listing" };
export const dynamic = "force-dynamic";

export default async function AdminNewListingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const [{ trainerId }, trainers, groups] = await Promise.all([
    searchParams,
    getAdminTrainers(),
    getGroupedTags(),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <ButtonLink variant="ghost" size="sm" href="/admin" className="-ml-2">
        <ArrowLeft data-icon="inline-start" />
        Back to queue
      </ButtonLink>
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          New listing
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a listing on a trainer&apos;s behalf — it publishes immediately.
        </p>
      </div>
      <ListingForm
        action={adminCreateListing}
        groups={groups}
        submitLabel="Create listing"
        defaultTrainerId={trainerId}
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
