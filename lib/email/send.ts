import "server-only";

import { env } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/client";
import { WelcomeEmail } from "@/lib/email/templates/welcome";
import { ListingSubmittedEmail } from "@/lib/email/templates/listing-submitted";
import { ListingApprovedEmail } from "@/lib/email/templates/listing-approved";
import { ListingRejectedEmail } from "@/lib/email/templates/listing-rejected";

/** Looks up a user's login email by profile/user id via the service role. */
export async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error) {
      console.error("[email] could not resolve user email:", error);
      return null;
    }
    return data.user?.email ?? null;
  } catch (err) {
    console.error("[email] getUserEmail threw:", err);
    return null;
  }
}

export async function sendWelcomeEmail(to: string, name?: string | null) {
  return sendEmail({
    to,
    subject: "Welcome to TherapistCEU",
    react: WelcomeEmail({ name, dashboardUrl: `${env.appUrl}/dashboard` }),
  });
}

export async function sendListingSubmittedEmail(
  trainerId: string,
  args: { name?: string | null; listingTitle: string },
) {
  const to = await getUserEmail(trainerId);
  if (!to) return { ok: false, skipped: true };
  return sendEmail({
    to,
    subject: "We received your listing",
    react: ListingSubmittedEmail({
      name: args.name,
      listingTitle: args.listingTitle,
      dashboardUrl: `${env.appUrl}/listings`,
    }),
  });
}

export async function sendListingApprovedEmail(
  trainerId: string,
  args: { name?: string | null; listingTitle: string; slug: string },
) {
  const to = await getUserEmail(trainerId);
  if (!to) return { ok: false, skipped: true };
  return sendEmail({
    to,
    subject: "Your listing is live on TherapistCEU",
    react: ListingApprovedEmail({
      name: args.name,
      listingTitle: args.listingTitle,
      listingUrl: `${env.appUrl}/listings/${args.slug}`,
    }),
  });
}

export async function sendListingRejectedEmail(
  trainerId: string,
  args: {
    name?: string | null;
    listingTitle: string;
    reason: string;
    slug: string;
  },
) {
  const to = await getUserEmail(trainerId);
  if (!to) return { ok: false, skipped: true };
  return sendEmail({
    to,
    subject: "Action needed on your listing",
    react: ListingRejectedEmail({
      name: args.name,
      listingTitle: args.listingTitle,
      reason: args.reason,
      editUrl: `${env.appUrl}/listings/${args.slug}/edit`,
    }),
  });
}
