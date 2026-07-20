import { z } from "zod";

import { DESCRIPTION_MAX, LISTING_FORMATS, US_STATES } from "@/lib/constants";
import {
  addDays,
  earliestAcceptableStart,
  END_DATE_ORDER_ERROR,
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
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),

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
 * @param originalStartDate the start date already saved on the listing, if any.
 *   An existing training whose start date is in the past must stay editable, so
 *   the "no past dates" rule is skipped when the trainer leaves it untouched.
 *   Always pass the value from the database, never one echoed by the client.
 */
export function buildListingSchema(originalStartDate?: string | null) {
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

    // Schedule: on-demand has no dates; otherwise need a start date.
    if (!data.onDemand) {
      if (!data.startDate) {
        ctx.addIssue({
          code: "custom",
          path: ["startDate"],
          message: "Add a start date, or mark the training available on demand.",
        });
      }
      const startUnchanged =
        !!originalStartDate && data.startDate === originalStartDate;
      if (
        data.startDate &&
        !startUnchanged &&
        data.startDate < earliestAcceptableStart()
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["startDate"],
          message: START_DATE_PAST_ERROR,
        });
      }
      // End date is optional, but when given it must clear the start by a day.
      if (
        data.startDate &&
        data.endDate &&
        data.endDate < addDays(data.startDate, 1)
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["endDate"],
          message: END_DATE_ORDER_ERROR,
        });
      }
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
