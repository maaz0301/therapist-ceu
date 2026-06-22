"use client";

import { Eye, Pencil, Power, PowerOff, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { deleteListing, setListingActive } from "@/lib/actions/listings";

export function ListingActions({
  id,
  slug,
  active,
  canPreview,
}: {
  id: string;
  slug: string;
  active: boolean;
  canPreview: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ButtonLink variant="outline" size="sm" href={`/listings/${slug}/edit`}>
        <Pencil data-icon="inline-start" />
        Edit
      </ButtonLink>

      {canPreview ? (
        <ButtonLink variant="ghost" size="sm" href={`/listings/${slug}`}>
          <Eye data-icon="inline-start" />
          Preview
        </ButtonLink>
      ) : null}

      <form action={setListingActive}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="active" value={active ? "false" : "true"} />
        <Button type="submit" variant="ghost" size="sm">
          {active ? (
            <>
              <PowerOff data-icon="inline-start" />
              Unpublish
            </>
          ) : (
            <>
              <Power data-icon="inline-start" />
              Publish
            </>
          )}
        </Button>
      </form>

      <form
        action={deleteListing}
        onSubmit={(e) => {
          if (!window.confirm("Delete this listing? This cannot be undone.")) {
            e.preventDefault();
          }
        }}
      >
        <input type="hidden" name="id" value={id} />
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 data-icon="inline-start" />
          Delete
        </Button>
      </form>
    </div>
  );
}
