import { z } from "zod";

import { LISTING_FORMATS } from "@/lib/constants";

/**
 * Shared listing schema (used by the client form and the server actions).
 * The form sends values as strings; this schema coerces + validates them, and
 * enforces the cross-field rules from master spec §5 (date logic, CEU, online).
 */
export const listingSchema = z
  .object({
    title: z.string().trim().min(4, "Give your training a clear title.").max(160),
    description: z
      .string()
      .trim()
      .min(30, "Add a description (at least 30 characters)."),
    presenterNames: z.string().trim().min(2, "Who is presenting?").max(200),
    credentials: z.string().trim().min(1, "Add presenter credentials.").max(120),
    format: z.enum(LISTING_FORMATS),

    isOnline: z.boolean(),
    states: z.array(z.string().length(2)).default([]),

    onDemand: z.boolean(),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),

    durationHours: z
      .union([z.coerce.number().positive().max(1000), z.literal("")])
      .optional()
      .transform((v) => (v === "" || v === undefined ? null : Number(v))),

    price: z.coerce.number().min(0, "Price cannot be negative.").max(100000),
    registrationUrl: z.string().trim().url("Enter a valid registration URL."),

    hasCeu: z.boolean(),
    ceCount: z
      .union([z.coerce.number().positive().max(1000), z.literal("")])
      .optional()
      .transform((v) => (v === "" || v === undefined ? null : Number(v))),
    accreditingBody: z.string().trim().max(160).optional().nullable(),

    websiteUrl: z
      .union([z.string().trim().url("Enter a valid website URL."), z.literal("")])
      .optional()
      .transform((v) => (v ? v : null)),

    imageUrl: z.string().trim().url().optional().nullable(),

    tagIds: z
      .array(z.string().uuid())
      .min(1, "Choose at least one topic tag."),
  })
  .superRefine((data, ctx) => {
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
      if (data.startDate && data.endDate && data.endDate < data.startDate) {
        ctx.addIssue({
          code: "custom",
          path: ["endDate"],
          message: "End date can't be before the start date.",
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

export type ListingInput = z.infer<typeof listingSchema>;
