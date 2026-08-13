"use client";

import { useActionState, useState, useSyncExternalStore } from "react";
import { Plus, X } from "lucide-react";

import { AuthMessage } from "@/components/auth/auth-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { ImageUpload } from "@/components/trainer/image-upload";
import { StateMultiselect } from "@/components/trainer/state-multiselect";
import { TagMultiselect } from "@/components/trainer/tag-multiselect";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { DESCRIPTION_MAX, LISTING_FORMATS } from "@/lib/constants";
import {
  addDays,
  dateOverlapError,
  effectiveEnd,
  END_DATE_ORDER_ERROR,
  MAX_LISTING_DATES,
  START_DATE_PAST_ERROR,
  todayIso,
  type DateRange,
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
  "trainerId",
  "title",
  "description",
  "presenterNames",
  "credentials",
  "format",
  "states",
  "dates",
  "durationHours",
  "price",
  "registrationUrl",
  "websiteUrl",
  "ceCount",
  "accreditingBody",
  "tagIds",
] as const;

// The focus-first-error lookup goes by input name, which matches the schema
// field everywhere except the schedule: that's an array of rows, so its errors
// are reported on `dates` while the inputs are named per column.
const FIELD_INPUT_NAMES: Record<string, string> = { dates: "dateStart" };

// Resolved once per page load so `getToday` is referentially stable, as
// useSyncExternalStore requires. The date never changes mid-session.
let cachedToday: string | null = null;
const getToday = () => (cachedToday ??= todayIso());
const getServerToday = () => "";
const subscribeNever = () => () => { };

/**
 * A schedule row. `key` is a stable React identity so removing the middle row
 * doesn't make the ones after it inherit its input state — the dates themselves
 * are editable and duplicable, so they can't serve as keys.
 */
type DateRow = DateRange & { key: number };

let nextRowKey = 0;
const blankRow = (): DateRow => ({
  startDate: "",
  endDate: null,
  key: nextRowKey++,
});

/**
 * Seeds the editable rows from whatever the form should show: the trainer's
 * rejected submission if there was one, else the saved schedule, else a single
 * empty row to type into.
 */
function toDateRows(ranges: readonly DateRange[] | undefined): DateRow[] {
  if (!ranges?.length) return [blankRow()];
  return ranges.map((r) => ({ ...r, key: nextRowKey++ }));
}

/** Per-row verdict: the two messages to show, and the `min` for the start input. */
type RowCheck = {
  start: string | null;
  end: string | null;
  minStart: string | undefined;
};

/**
 * The same rules the server enforces, checked per row as the trainer types.
 * ISO date strings (yyyy-mm-dd) compare correctly as plain strings.
 *
 * A run that's already saved keeps its date even once it's past — only a new or
 * edited one has to be in the future. The rows also have to run in sequence:
 * each start comes after the last day every earlier row claims, which is that
 * row's end date, or its start date when it has none.
 *
 * @param today the trainer's local date, or "" before hydration.
 * @param savedStarts start dates already on the listing, exempt from both rules.
 */
function checkDateRows(
  rows: readonly DateRow[],
  {
    onDemand,
    today,
    savedStarts,
  }: { onDemand: boolean; today: string; savedStarts: ReadonlySet<string> },
): RowCheck[] {
  // Running maximum across the rows above, and whether it belongs to a run the
  // trainer hasn't touched — two untouched runs keep the order they were saved
  // with, so an old listing with overlapping dates stays editable.
  let latestEnd: string | null = null;
  let latestEndSaved = false;

  return rows.map((row) => {
    if (onDemand) return { start: null, end: null, minStart: undefined };

    const saved = savedStarts.has(row.startDate);
    const nextFree = latestEnd ? addDays(latestEnd, 1) : "";
    // The earliest this row may start: after everything before it, and not in
    // the past. A saved date stays as-is even if it now breaks either rule.
    const minStart = saved
      ? undefined
      : [today, nextFree].sort().at(-1) || undefined;

    let start: string | null = null;
    if (row.startDate && !saved && today && row.startDate < today) {
      start = START_DATE_PAST_ERROR;
    } else if (
      row.startDate &&
      latestEnd &&
      row.startDate <= latestEnd &&
      !(saved && latestEndSaved)
    ) {
      start = dateOverlapError(latestEnd);
    }

    const end =
      row.startDate && row.endDate && row.endDate < addDays(row.startDate, 1)
        ? END_DATE_ORDER_ERROR
        : null;

    if (row.startDate) {
      const rowEnd = effectiveEnd(row);
      if (!latestEnd || rowEnd > latestEnd) {
        latestEnd = rowEnd;
        latestEndSaved = saved;
      }
    }

    return { start, end, minStart };
  });
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-sm text-destructive">{messages[0]}</p>;
}

export function ListingForm({
  action,
  groups,
  listing,
  submitLabel,
  trainerOptions,
  defaultTrainerId,
}: {
  action: ListingAction;
  groups: GroupedTags;
  listing?: OwnedListing;
  submitLabel: string;
  /** Admin-create/edit mode: renders a trainer picker so the listing can be authored on their behalf. */
  trainerOptions?: {
    id: string;
    name: string | null;
    email: string | null;
    plan: string;
    totalListings: number;
    activeListings: number;
    blockReason: "no_subscription" | "over_limit" | null;
  }[];
  /** Trainer to preselect — the trainer the admin started this flow from, or the listing's current owner. */
  defaultTrainerId?: string;
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
    const parsed = buildListingSchema(savedStarts).safeParse(
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
    const first = FIELD_ORDER.find(
      (name) => (fieldErrors as Record<string, string[] | undefined>)[name]?.length,
    );
    if (!first) return;
    const inputName = FIELD_INPUT_NAMES[first] ?? first;
    const el = form.querySelector<HTMLElement>(`[name="${inputName}"]`);
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

  const [trainerId, setTrainerId] = useState<string>(
    initial("trainerId", listing?.trainerId ?? defaultTrainerId),
  );
  const selectedTrainer = trainerOptions?.find((t) => t.id === trainerId);

  // Only a *new* active listing for the selected trainer is actually blocked:
  // creating one outright, or reassigning an existing one onto them. Leaving
  // an already-active listing on its current trainer never changes anyone's
  // count, even if that trainer happens to be at their cap because of it.
  const isReassignment = trainerId !== (listing?.trainerId ?? "");
  const blocksSubmit = Boolean(
    trainerOptions && selectedTrainer?.blockReason && isReassignment,
  );

  const [format, setFormat] = useState<string>(
    listing?.format ?? "Live Virtual",
  );
  const [isOnline, setIsOnline] = useState(listing?.isOnline ?? false);
  const [onDemand, setOnDemand] = useState(listing?.onDemand ?? false);
  const [hasCeu, setHasCeu] = useState(listing?.hasCeu ?? false);

  // Dates are controlled so the ordering rules can be caught before submit.
  // The saved starts are what exempts an already-run date from the "no past
  // dates" rule — a training that repeats keeps its history editable.
  const savedStarts = listing?.dates?.map((d) => d.startDate) ?? [];
  const savedStartSet = new Set(savedStarts);
  const [dateRows, setDateRows] = useState<DateRow[]>(() =>
    toDateRows(state?.dates ?? listing?.dates),
  );

  const [seenState, setSeenState] = useState(state);
  if (seenState !== state) {
    // Adjusting state during render — React's documented alternative to an
    // effect for resetting derived state when an input changes. Placed after
    // every useState above so it can reset them; hook order is unaffected.
    setSeenState(state);
    if (touched.size > 0) setTouched(new Set());
    if (clientErrors) setClientErrors(null);
    // React resets uncontrolled inputs once the action resolves. The schedule
    // is controlled, so it has to be put back by hand — from the rejected
    // submission if there is one, otherwise from what's saved.
    setDateRows(toDateRows(state?.dates ?? listing?.dates));
  }

  function updateRow(key: number, patch: Partial<DateRange>) {
    setDateRows((rows) =>
      rows.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
    markTouched("dates");
  }

  function addRow() {
    setDateRows((rows) =>
      rows.length >= MAX_LISTING_DATES ? rows : [...rows, blankRow()],
    );
  }

  function removeRow(key: number) {
    // Never drop to zero rows — an empty row is the prompt to add a date, and
    // it submits as "no dates" all the same.
    setDateRows((rows) =>
      rows.length <= 1 ? [blankRow()] : rows.filter((row) => row.key !== key),
    );
    markTouched("dates");
  }

  // `todayIso()` reads the browser's timezone, which the server doesn't share.
  // The empty server snapshot keeps the two renders identical through
  // hydration; the real date lands on the client pass.
  const today = useSyncExternalStore(subscribeNever, getToday, getServerToday);

  const showStates =
    (format === "In-Person" || format === "Hybrid") && !isOnline;

  const rowErrors = checkDateRows(dateRows, {
    onDemand,
    today,
    savedStarts: savedStartSet,
  });

  const hasRowError = rowErrors.some((e) => e.start || e.end);

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

        {trainerOptions ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="trainerId">Trainer</Label>
            <NativeSelect
              id="trainerId"
              name="trainerId"
              value={trainerId}
              onChange={(e) => setTrainerId(e.target.value)}
              selectSize="sm"
              className="w-full"
              required
            >
              <option value="">Select a trainer…</option>
              {trainerOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name ?? "Unnamed trainer"}
                </option>
              ))}
            </NativeSelect>
            <FieldError messages={errorsFor("trainerId")} />
            {selectedTrainer ? (
              <p className="text-sm text-muted-foreground">
                {selectedTrainer.email ?? "No email on file"} ·{" "}
                {selectedTrainer.plan} · {selectedTrainer.totalListings}{" "}
                listing{selectedTrainer.totalListings === 1 ? "" : "s"} ·{" "}
                {selectedTrainer.activeListings} live
              </p>
            ) : null}
            {selectedTrainer?.blockReason && isReassignment ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {selectedTrainer.blockReason === "no_subscription"
                  ? "This trainer has no active subscription, so they can't have a live listing. Update their subscription first."
                  : "This trainer is already at their plan's active listing limit. Unpublish one of their listings or upgrade their plan first."}
              </p>
            ) : selectedTrainer?.blockReason ? (
              <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
                {selectedTrainer.blockReason === "no_subscription"
                  ? "This trainer has no active subscription. This listing stays live because it already did."
                  : "This trainer is at their plan's active listing limit, including this listing."}
              </p>
            ) : null}
          </div>
        ) : null}

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
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Running this training more than once? Add each date here instead of
              creating a separate listing — the directory shows whichever one is
              next and moves on to the following date once it has passed.
            </p>

            {dateRows.map((row, i) => {
              const errors = rowErrors[i];
              // A saved date stays editable even if it's past; a fresh row is
              // held to the day after the previous run — or to today when it's
              // the first — matching what the server accepts.
              const minStart = errors.minStart;

              return (
                <div
                  key={row.key}
                  className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-start sm:gap-3"
                >
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Label htmlFor={`dateStart-${row.key}`}>
                      {dateRows.length > 1 ? `Start date ${i + 1}` : "Start date"}
                    </Label>
                    <Input
                      id={`dateStart-${row.key}`}
                      name="dateStart"
                      type="date"
                      value={row.startDate}
                      min={minStart}
                      onChange={(e) =>
                        updateRow(row.key, { startDate: e.target.value })
                      }
                      aria-invalid={errors.start ? true : undefined}
                    />
                    {errors.start ? (
                      <p role="alert" className="text-sm text-destructive">
                        {errors.start}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-1 flex-col gap-1.5">
                    <Label htmlFor={`dateEnd-${row.key}`}>
                      End date (optional)
                    </Label>
                    <Input
                      id={`dateEnd-${row.key}`}
                      name="dateEnd"
                      type="date"
                      value={row.endDate ?? ""}
                      min={
                        row.startDate
                          ? addDays(row.startDate, 1)
                          : today || undefined
                      }
                      onChange={(e) =>
                        updateRow(row.key, { endDate: e.target.value || null })
                      }
                      aria-invalid={errors.end ? true : undefined}
                    />
                    {errors.end ? (
                      <p role="alert" className="text-sm text-destructive">
                        {errors.end}
                      </p>
                    ) : null}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRow(row.key)}
                    // The last row can't be removed, only cleared — keep the
                    // control in the layout so the rows above don't shift.
                    disabled={dateRows.length === 1 && !row.startDate}
                    className="self-end text-muted-foreground sm:mt-6"
                  >
                    <X data-icon="inline-start" />
                    Remove
                    <span className="sr-only">
                      {row.startDate ? ` date ${i + 1}` : " this date"}
                    </span>
                  </Button>
                </div>
              );
            })}

            <FieldError messages={errorsFor("dates")} />

            {dateRows.length < MAX_LISTING_DATES ? (
              <Button type="button" variant="outline" size="sm" onClick={addRow}>
                <Plus data-icon="inline-start" />
                Add another date
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                That&apos;s the maximum of {MAX_LISTING_DATES} dates for one
                listing.
              </p>
            )}
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
          disabled={hasRowError || blocksSubmit}
        >
          {submitLabel}
        </SubmitButton>
      </div>
    </form>
  );
}
