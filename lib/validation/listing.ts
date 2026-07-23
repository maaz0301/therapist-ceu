import { z } from "zod";

import { DESCRIPTION_MAX, LISTING_FORMATS, US_STATES } from "@/lib/constants";
import {
  addDays,
  dateOverlapError,
  earliestAcceptableStart,
  effectiveEnd,
  END_DATE_ORDER_ERROR,
  MAX_LISTING_DATES,
  START_DATE_PAST_ERROR,
} from "@/lib/dates";

/** Selectable location codes (excludes the ONLINE pseudo-location). */
const LOCATION_CODES = US_STATES.filter((s) => s.code !== "ONLINE").map(
  (s) => s.code,
) as [string, ...string[]];

/**
 * Shared listing schema (used by the client form and the server actions).
 * The form sends values as strings; this schema coerces + validates them, and
 * enforces the cross-field rules from master spec §5 (date logic, CEU, online).
 */
/**
 * An optional numeric field: blank means "not provided", anything else must be
 * a positive number. Written as a nullable pipeline rather than a union so a
 * bad value reports the real constraint instead of Zod's generic union error.
 */
function emptyToNullNumber(
  positiveMessage: string,
  max: number,
  maxMessage: string,
) {
  return z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? null : v),
    z.coerce
      .number({ error: positiveMessage })
      .positive(positiveMessage)
      .max(max, maxMessage)
      .nullable(),
  );
}

const listingObject = z
  .object({
    title: z
      .string()
      .trim()
      .min(4, "Give your training a clear title.")
      .max(160, "Title cannot exceed 160 characters."),
    description: z
      .string()
      .trim()
      .min(30, "Add a description (at least 30 characters).")
      .max(DESCRIPTION_MAX, `Description cannot exceed ${DESCRIPTION_MAX} characters.`),
    presenterNames: z
      .string()
      .trim()
      .min(2, "Who is presenting?")
      .max(200, "Presenter name(s) cannot exceed 200 characters."),
    credentials: z
      .string()
      .trim()
      .min(1, "Add presenter credentials.")
      .max(120, "Credentials cannot exceed 120 characters."),
    format: z.enum(LISTING_FORMATS),

    isOnline: z.boolean(),
    states: z.array(z.enum(LOCATION_CODES)).default([]),

    onDemand: z.boolean(),
    /**
     * One entry per scheduled run. Shape-only here — ordering, past dates and
     * duplicates are cross-field rules, so they live in the refinement below.
     */
    dates: z
      .array(
        z.object({
          startDate: z.string().trim(),
          endDate: z.string().trim().nullable().default(null),
        }),
      )
      .max(MAX_LISTING_DATES, `A listing can hold up to ${MAX_LISTING_DATES} dates.`)
      .default([]),

    durationHours: emptyToNullNumber(
      "Duration must be a positive number of hours.",
      1000,
      "Duration cannot exceed 1000 hours.",
    ),

    price: z.coerce
      .number({ error: "Enter a price, or 0 if the training is free." })
      .min(0, "Price cannot be negative.")
      .max(100000, "Price cannot exceed $100,000."),
    registrationUrl: z.string().trim().url("Enter a valid registration URL."),

    hasCeu: z.boolean(),
    ceCount: emptyToNullNumber(
      "Enter a positive number of CE credits.",
      1000,
      "CE credits cannot exceed 1000.",
    ),
    accreditingBody: z
      .string()
      .trim()
      .max(160, "Accrediting body cannot exceed 160 characters.")
      .optional()
      .nullable(),

    websiteUrl: z
      .union([z.string().trim().url("Enter a valid website URL."), z.literal("")])
      .optional()
      .transform((v) => (v ? v : null)),

    imageUrl: z.string().trim().url().optional().nullable(),

    tagIds: z
      .array(z.string().uuid("That topic tag is no longer available."))
      .min(1, "Choose at least one topic tag."),
  });

/**
 * @param originalStartDates the start dates already saved on the listing. A
 *   training whose earlier runs are in the past must stay editable, so the "no
 *   past dates" rule is skipped for any start the trainer left untouched.
 *   Always pass the values from the database, never ones echoed by the client.
 */
export function buildListingSchema(originalStartDates?: readonly string[] | null) {
  const saved = new Set(originalStartDates ?? []);

  return listingObject.superRefine((data, ctx) => {
    // Location: in-person/hybrid require at least one state unless marked online.
    const needsState = data.format === "In-Person" || data.format === "Hybrid";
    if (needsState && !data.isOnline && data.states.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["states"],
        message: "Select at least one state, or mark it online.",
      });
    }

    // Schedule: on-demand has no dates; otherwise at least one dated run.
    if (!data.onDemand) {
      const rows = data.dates;
      if (rows.length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["dates"],
          message:
            "Add at least one date, or mark the training available on demand.",
        });
      }

      // Every issue below is reported on `dates` rather than a nested path so
      // Zod's `flatten()` still surfaces it — the row is named in the message
      // instead. The form also checks these live, per row, as you type.
      const earliest = earliestAcceptableStart();
      const seen = new Set<string>();
      // The last day any earlier row already claims, so the next run can be
      // held to starting after it. Tracked as a running maximum rather than
      // just the previous row's end, so a row typed out of order is still
      // measured against the whole schedule before it.
      let latestEnd: string | null = null;
      // Whether that day comes from a run the trainer hasn't touched. Two
      // untouched runs keep whatever ordering they were saved with — this rule
      // is for what's being added now, not a reason to block an unrelated edit.
      let latestEndSaved = false;

      rows.forEach((row, i) => {
        const label = rows.length > 1 ? `Date ${i + 1}: ` : "";

        if (!row.startDate) {
          ctx.addIssue({
            code: "custom",
            path: ["dates"],
            message: `${label}add a start date or remove the row.`,
          });
          return;
        }

        // An already-saved run keeps its date even once it's past; only a new
        // or edited one has to be in the future.
        if (!saved.has(row.startDate) && row.startDate < earliest) {
          ctx.addIssue({
            code: "custom",
            path: ["dates"],
            message: `${label}${START_DATE_PAST_ERROR}`,
          });
        }

        // End date is optional, but when given it must clear the start by a day.
        if (row.endDate && row.endDate < addDays(row.startDate, 1)) {
          ctx.addIssue({
            code: "custom",
            path: ["dates"],
            message: `${label}${END_DATE_ORDER_ERROR}`,
          });
        }

        const rowSaved = saved.has(row.startDate);

        if (seen.has(row.startDate)) {
          ctx.addIssue({
            code: "custom",
            path: ["dates"],
            message: `${label}this start date is already listed.`,
          });
        } else if (
          latestEnd &&
          row.startDate <= latestEnd &&
          !(rowSaved && latestEndSaved)
        ) {
          ctx.addIssue({
            code: "custom",
            path: ["dates"],
            message: `${label}${dateOverlapError(latestEnd)}`,
          });
        }
        seen.add(row.startDate);

        const end = effectiveEnd(row);
        if (!latestEnd || end > latestEnd) {
          latestEnd = end;
          latestEndSaved = rowSaved;
        }
      });
    }

    // CEU details required when CEU = Yes.
    if (data.hasCeu) {
      if (!data.ceCount) {
        ctx.addIssue({
          code: "custom",
          path: ["ceCount"],
          message: "How many CE credits does this offer?",
        });
      }
      if (!data.accreditingBody) {
        ctx.addIssue({
          code: "custom",
          path: ["accreditingBody"],
          message: "Add the accrediting body.",
        });
      }
    }
  });
}

export const listingSchema = buildListingSchema();

export type ListingInput = z.infer<typeof listingSchema>;
