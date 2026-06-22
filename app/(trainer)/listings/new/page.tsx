import { ArrowLeft } from "lucide-react";

import { ListingForm } from "@/components/trainer/listing-form";
import { ButtonLink } from "@/components/ui/button-link";
import { createListing } from "@/lib/actions/listings";
import { requireTrainer } from "@/lib/auth";
import { getGroupedTags } from "@/lib/queries/tags";

export const metadata = { title: "New listing" };

export default async function NewListingPage() {
  const profile = await requireTrainer();
  const groups = await getGroupedTags(profile.id);

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
        <h1 className="mt-2 font-heading text-2xl font-bold text-foreground">
          New training listing
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fill this out and submit — your listing goes live after admin review.
        </p>
      </div>

      <ListingForm
        action={createListing}
        groups={groups}
        submitLabel="Create listing"
      />
    </div>
  );
}
