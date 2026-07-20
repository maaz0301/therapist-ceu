"use client";

import { useActionState, useState, useSyncExternalStore } from "react";

import { AuthMessage } from "@/components/auth/auth-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { ImageUpload } from "@/components/trainer/image-upload";
import { StateMultiselect } from "@/components/trainer/state-multiselect";
import { TagMultiselect } from "@/components/trainer/tag-multiselect";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { DESCRIPTION_MAX, LISTING_FORMATS } from "@/lib/constants";
import {
  addDays,
  END_DATE_ORDER_ERROR,
  START_DATE_PAST_ERROR,
  todayIso,
} from "@/lib/dates";
import { listingFormValues } from "@/lib/listings/form-fields";
import { buildListingSchema } from "@/lib/validation/listing";
import type { ListingFormState } from "@/lib/actions/listings";
import type { OwnedListing } from "@/lib/queries/listings";
import type { GroupedTags } from "@/lib/queries/tags";

type ListingAction = (
  state: ListingFormState,
  formData: FormData,
) => Promise<ListingFormState>;

// Visual order of the fields, used to focus the first one that fails.
const FIELD_ORDER = [
  "title",
  "description",
  "presenterNames",
  "credentials",
  "format",
  "states",
  "startDate",
  "endDate",
  "durationHours",
  "price",
  "registrationUrl",
  "websiteUrl",
  "ceCount",
  "accreditingBody",
  "tagIds",
] as const;

// Resolved once per page load so `getToday` is referentially stable, as
// useSyncExternalStore requires. The date never changes mid-session.
let cachedToday: string | null = null;
const getToday = () => (cachedToday ??= todayIso());
const getServerToday = () => "";
const subscribeNever = () => () => {};

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

  /**
   * Server errors describe the values as they were *submitted*. Once a trainer
   * edits a field that feedback is stale, so each field's error is dropped as
   * soon as it is touched — and the whole set resets on the next submit.
   */
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set());
  const [clientErrors, setClientErrors] = useState<Record<
    string,
    string[] | undefined
  > | null>(null);

  const [seenState, setSeenState] = useState(state);
  if (seenState !== state) {
    // Adjusting state during render — React's documented alternative to an
    // effect for resetting derived state when an input changes.
    setSeenState(state);
    if (touched.size > 0) setTouched(new Set());
    if (clientErrors) setClientErrors(null);
  }

  function markTouched(name: string) {
    setTouched((prev) => {
      if (!name || prev.has(name)) return prev;
      const next = new Set(prev);
      next.add(name);
      return next;
    });
  }

  // Native inputs, textareas and selects all bubble change events to the form,
  // so one handler covers them. The two multiselects report in via callbacks.
  function handleFieldChange(e: React.ChangeEvent<HTMLFormElement>) {
    const target = e.target as unknown as { name?: string };
    if (target.name) markTouched(target.name);
  }

  /**
   * Client-side pass over the *same* Zod schema the action uses, so every
   * required field reports inline on submit instead of after a round-trip.
   * Native `required` tooltips are suppressed (`noValidate`) in favour of these
   * — the browser shows one at a time and skips the custom multiselects.
   */
  const errorsFor = (name: string) =>
    touched.has(name)
      ? undefined
      : (clientErrors?.[name] ?? state?.fieldErrors?.[name]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = e.currentTarget;
    const parsed = buildListingSchema(savedStart || undefined).safeParse(
      listingFormValues(new FormData(form)),
    );
    if (parsed.success) {
      setClientErrors(null);
      return;
    }

    // Cancelling the submit event also cancels React's form action.
    e.preventDefault();
    const fieldErrors = parsed.error.flatten().fieldErrors;
    setClientErrors(fieldErrors);
    setTouched(new Set());

    // Land the trainer on the first problem rather than leaving them to hunt
    // for it — the form is long enough that errors can be off-screen.
    const first = FIELD_ORDER.find((name) => fieldErrors[name]?.length);
    if (!first) return;
    const el = form.querySelector<HTMLElement>(`[name="${first}"]`);
    (el ?? form).scrollIntoView({ behavior: "smooth", block: "center" });
    el?.focus({ preventScroll: true });
  }


  /**
   * Prefer what the trainer just submitted over the saved listing. React resets
   * the form after the action resolves, and the reset reads these — so echoing
   * the rejected input back is what keeps it on screen.
   */
  const initial = (field: string, fallback?: string | number | null) =>
    state?.values?.[field] ?? (fallback == null ? "" : String(fallback));

  const [format, setFormat] = useState<string>(
    listing?.format ?? "Live Virtual",
  );
  const [isOnline, setIsOnline] = useState(listing?.isOnline ?? false);
  const [onDemand, setOnDemand] = useState(listing?.onDemand ?? false);
  const [hasCeu, setHasCeu] = useState(listing?.hasCeu ?? false);

  // Dates are controlled so the ordering rules can be caught before submit.
  const savedStart = listing?.startDate ?? "";
  const [startDate, setStartDate] = useState(savedStart);
  const [endDate, setEndDate] = useState(listing?.endDate ?? "");

  // `todayIso()` reads the browser's timezone, which the server doesn't share.
  // The empty server snapshot keeps the two renders identical through
  // hydration; the real date lands on the client pass.
  const today = useSyncExternalStore(subscribeNever, getToday, getServerToday);

  const showStates =
    (format === "In-Person" || format === "Hybrid") && !isOnline;

  // A training that already started keeps its date; only a *change* must be
  // in the future, matching what the server enforces.
  const startChanged = startDate !== savedStart;
  const minStart = startChanged || !savedStart ? today : undefined;

  // ISO date strings (yyyy-mm-dd) compare correctly as plain strings.
  const startPastError =
    !onDemand && startDate && today && startChanged && startDate < today
      ? START_DATE_PAST_ERROR
      : null;

  // End date is optional; when set it must be at least a day after the start.
  const minEnd = startDate ? addDays(startDate, 1) : today || undefined;
  const dateOrderError =
    !onDemand && startDate && endDate && endDate < addDays(startDate, 1)
      ? END_DATE_ORDER_ERROR
      : null;

  return (
    <form
      action={formAction}
      onChange={handleFieldChange}
      onSubmit={handleSubmit}
      noValidate
      className="space-y-6"
    >
      <AuthMessage error={state?.error} />

      {/* Basics */}
      <Card className="space-y-4 p-6">
        <h2 className="font-heading text-lg font-semibold">Training details</h2>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            defaultValue={initial("title", listing?.title)}
            placeholder="e.g. EMDR Foundations"
            required
          />
          <FieldError messages={errorsFor("title")} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={initial("description", listing?.description)}
            placeholder="What will attendees learn? Who is it for? Any prerequisites?"
            maxLength={DESCRIPTION_MAX}
            className="min-h-32"
            required
          />
          <FieldError messages={errorsFor("description")} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="presenterNames">Presenter name(s)</Label>
            <Input
              id="presenterNames"
              name="presenterNames"
              defaultValue={initial("presenterNames", listing?.presenterNames)}
              placeholder="Dr. Jane Doe"
              required
            />
            <FieldError messages={errorsFor("presenterNames")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="credentials">Credentials</Label>
            <Input
              id="credentials"
              name="credentials"
              defaultValue={initial("credentials", listing?.credentials)}
              placeholder="LCSW, RPT-S"
              required
            />
            <FieldError messages={errorsFor("credentials")} />
          </div>
        </div>
      </Card>

      {/* Format & location */}
      <Card className="space-y-4 p-6">
        <h2 className="font-heading text-lg font-semibold">Format & location</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="format">Format</Label>
            <NativeSelect
              id="format"
              name="format"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              selectSize="sm"
              className="w-full"
            >
              {LISTING_FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </NativeSelect>
            <FieldError messages={errorsFor("format")} />
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
              error={errorsFor("states")?.[0]}
              onSelectionChange={() => markTouched("states")}
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
                value={startDate}
                min={minStart}
                onChange={(e) => setStartDate(e.target.value)}
                aria-invalid={startPastError ? true : undefined}
              />
              {startPastError ? (
                <p role="alert" className="text-sm text-destructive">
                  {startPastError}
                </p>
              ) : (
                <FieldError messages={errorsFor("startDate")} />
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="endDate">End date (optional)</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                value={endDate}
                min={minEnd}
                onChange={(e) => setEndDate(e.target.value)}
                aria-invalid={dateOrderError ? true : undefined}
              />
              {dateOrderError ? (
                <p role="alert" className="text-sm text-destructive">
                  {dateOrderError}
                </p>
              ) : (
                <FieldError messages={errorsFor("endDate")} />
              )}
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
            defaultValue={initial("durationHours", listing?.durationHours)}
            placeholder="e.g. 6"
          />
          <FieldError messages={errorsFor("durationHours")} />
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
              defaultValue={initial("price", listing?.price ?? "0")}
              placeholder="0 for free"
              required
            />
            <FieldError messages={errorsFor("price")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="registrationUrl">Registration link</Label>
            <Input
              id="registrationUrl"
              name="registrationUrl"
              type="url"
              defaultValue={initial("registrationUrl", listing?.registrationUrl)}
              placeholder="https://…"
              required
            />
            <FieldError messages={errorsFor("registrationUrl")} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="websiteUrl">Trainer website (optional)</Label>
          <Input
            id="websiteUrl"
            name="websiteUrl"
            type="url"
            defaultValue={initial("websiteUrl", listing?.websiteUrl)}
            placeholder="https://…"
          />
          <FieldError messages={errorsFor("websiteUrl")} />
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
                defaultValue={initial("ceCount", listing?.ceCount)}
                placeholder="e.g. 6"
              />
              <FieldError messages={errorsFor("ceCount")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="accreditingBody">Accrediting body</Label>
              <Input
                id="accreditingBody"
                name="accreditingBody"
                defaultValue={initial("accreditingBody", listing?.accreditingBody)}
                placeholder="e.g. APA, ASWB, EMDRIA"
              />
              <FieldError messages={errorsFor("accreditingBody")} />
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
          error={errorsFor("tagIds")?.[0]}
              onSelectionChange={() => markTouched("tagIds")}
        />
      </Card>

      {/* Image */}
      <Card className="space-y-4 p-6">
        <h2 className="font-heading text-lg font-semibold">Promo image</h2>
        <ImageUpload
          defaultUrl={listing?.imageUrl ?? null}
          error={errorsFor("image")?.[0]}
        />
      </Card>

      <div className="flex items-center justify-end gap-3">
        <SubmitButton
          variant="clay"
          size="lg"
          pendingLabel="Saving…"
          disabled={Boolean(dateOrderError || startPastError)}
        >
          {submitLabel}
        </SubmitButton>
      </div>
    </form>
  );
}
