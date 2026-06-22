"use client";

import { useActionState, useState } from "react";

import { AuthMessage } from "@/components/auth/auth-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { ImageUpload } from "@/components/trainer/image-upload";
import { StateMultiselect } from "@/components/trainer/state-multiselect";
import { TagMultiselect } from "@/components/trainer/tag-multiselect";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { LISTING_FORMATS } from "@/lib/constants";
import type { ListingFormState } from "@/lib/actions/listings";
import type { OwnedListing } from "@/lib/queries/listings";
import type { GroupedTags } from "@/lib/queries/tags";

type ListingAction = (
  state: ListingFormState,
  formData: FormData,
) => Promise<ListingFormState>;

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-sm text-destructive">{messages[0]}</p>;
}

export function ListingForm({
  action,
  groups,
  listing,
  submitLabel,
}: {
  action: ListingAction;
  groups: GroupedTags;
  listing?: OwnedListing;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, null);
  const errors = state?.fieldErrors;

  const [format, setFormat] = useState<string>(
    listing?.format ?? "Live Virtual",
  );
  const [isOnline, setIsOnline] = useState(listing?.isOnline ?? false);
  const [onDemand, setOnDemand] = useState(listing?.onDemand ?? false);
  const [hasCeu, setHasCeu] = useState(listing?.hasCeu ?? false);

  const showStates =
    (format === "In-Person" || format === "Hybrid") && !isOnline;

  return (
    <form action={formAction} className="space-y-6">
      <AuthMessage error={state?.error} />

      {/* Basics */}
      <Card className="space-y-4 p-6">
        <h2 className="font-heading text-lg font-semibold">Training details</h2>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            defaultValue={listing?.title}
            placeholder="e.g. EMDR Foundations for Trauma Treatment"
            required
          />
          <FieldError messages={errors?.title} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={listing?.description}
            placeholder="What will attendees learn? Who is it for? Any prerequisites?"
            className="min-h-32"
            required
          />
          <FieldError messages={errors?.description} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="presenterNames">Presenter name(s)</Label>
            <Input
              id="presenterNames"
              name="presenterNames"
              defaultValue={listing?.presenterNames}
              placeholder="Dr. Jane Doe"
              required
            />
            <FieldError messages={errors?.presenterNames} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="credentials">Credentials</Label>
            <Input
              id="credentials"
              name="credentials"
              defaultValue={listing?.credentials}
              placeholder="LCSW, RPT-S"
              required
            />
            <FieldError messages={errors?.credentials} />
          </div>
        </div>
      </Card>

      {/* Format & location */}
      <Card className="space-y-4 p-6">
        <h2 className="font-heading text-lg font-semibold">Format & location</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="format">Format</Label>
            <select
              id="format"
              name="format"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className={selectClass}
            >
              {LISTING_FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <FieldError messages={errors?.format} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Availability</Label>
            <label className="flex h-8 items-center gap-2 text-sm">
              <Switch
                checked={isOnline}
                onCheckedChange={(v) => setIsOnline(Boolean(v))}
              />
              Online / available in any state
            </label>
          </div>
        </div>
        <input type="hidden" name="isOnline" value={String(isOnline)} />

        {showStates ? (
          <div className="flex flex-col gap-1.5">
            <Label>In-person state(s)</Label>
            <StateMultiselect
              defaultSelected={listing?.states ?? []}
              error={errors?.states?.[0]}
            />
          </div>
        ) : null}
      </Card>

      {/* Schedule */}
      <Card className="space-y-4 p-6">
        <h2 className="font-heading text-lg font-semibold">Schedule</h2>

        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={onDemand}
            onCheckedChange={(v) => setOnDemand(Boolean(v))}
          />
          Available on demand (no fixed dates)
        </label>
        <input type="hidden" name="onDemand" value={String(onDemand)} />

        {!onDemand ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="startDate">Start date</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                defaultValue={listing?.startDate ?? ""}
              />
              <FieldError messages={errors?.startDate} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="endDate">End date (optional)</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                defaultValue={listing?.endDate ?? ""}
              />
              <FieldError messages={errors?.endDate} />
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-1.5 sm:max-w-xs">
          <Label htmlFor="durationHours">Duration (hours, optional)</Label>
          <Input
            id="durationHours"
            name="durationHours"
            type="number"
            step="0.5"
            min="0"
            defaultValue={listing?.durationHours ?? ""}
            placeholder="e.g. 6"
          />
          <FieldError messages={errors?.durationHours} />
        </div>
      </Card>

      {/* Pricing & registration */}
      <Card className="space-y-4 p-6">
        <h2 className="font-heading text-lg font-semibold">
          Pricing & registration
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="price">Price (USD)</Label>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={listing?.price ?? "0"}
              placeholder="0 for free"
              required
            />
            <FieldError messages={errors?.price} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="registrationUrl">Registration link</Label>
            <Input
              id="registrationUrl"
              name="registrationUrl"
              type="url"
              defaultValue={listing?.registrationUrl}
              placeholder="https://…"
              required
            />
            <FieldError messages={errors?.registrationUrl} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="websiteUrl">Trainer website (optional)</Label>
          <Input
            id="websiteUrl"
            name="websiteUrl"
            type="url"
            defaultValue={listing?.websiteUrl ?? ""}
            placeholder="https://…"
          />
          <FieldError messages={errors?.websiteUrl} />
        </div>
      </Card>

      {/* CEU */}
      <Card className="space-y-4 p-6">
        <h2 className="font-heading text-lg font-semibold">Continuing education</h2>

        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={hasCeu}
            onCheckedChange={(v) => setHasCeu(Boolean(v))}
          />
          This training offers CE credits
        </label>
        <input type="hidden" name="hasCeu" value={String(hasCeu)} />

        {hasCeu ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ceCount">Number of CE credits</Label>
              <Input
                id="ceCount"
                name="ceCount"
                type="number"
                step="0.25"
                min="0"
                defaultValue={listing?.ceCount ?? ""}
                placeholder="e.g. 6"
              />
              <FieldError messages={errors?.ceCount} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="accreditingBody">Accrediting body</Label>
              <Input
                id="accreditingBody"
                name="accreditingBody"
                defaultValue={listing?.accreditingBody ?? ""}
                placeholder="e.g. APA, ASWB, EMDRIA"
              />
              <FieldError messages={errors?.accreditingBody} />
            </div>
          </div>
        ) : null}
      </Card>

      {/* Topics */}
      <Card className="space-y-4 p-6">
        <h2 className="font-heading text-lg font-semibold">Topic tags</h2>
        <p className="text-sm text-muted-foreground">
          Choose every topic that applies so therapists can find your training.
        </p>
        <TagMultiselect
          groups={groups}
          defaultSelected={listing?.tagIds ?? []}
          error={errors?.tagIds?.[0]}
        />
      </Card>

      {/* Image */}
      <Card className="space-y-4 p-6">
        <h2 className="font-heading text-lg font-semibold">Promo image</h2>
        <ImageUpload
          defaultUrl={listing?.imageUrl ?? null}
          error={errors?.image?.[0]}
        />
      </Card>

      <div className="flex items-center justify-end gap-3">
        <SubmitButton variant="coral" size="lg" pendingLabel="Saving…">
          {submitLabel}
        </SubmitButton>
      </div>
    </form>
  );
}
