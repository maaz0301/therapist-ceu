import "server-only";

import { env } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/client";
import { WelcomeEmail } from "@/lib/email/templates/welcome";
import { ListingSubmittedEmail } from "@/lib/email/templates/listing-submitted";
import { ListingApprovedEmail } from "@/lib/email/templates/listing-approved";
import { ListingRejectedEmail } from "@/lib/email/templates/listing-rejected";
import { PaymentFailedEmail } from "@/lib/email/templates/payment-failed";
import { AccountDeactivatedEmail } from "@/lib/email/templates/account-deactivated";
import { RenewalReminderEmail } from "@/lib/email/templates/renewal-reminder";
import { TrainerInviteEmail } from "@/lib/email/templates/trainer-invite";

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

/**
 * Creates the trainer's auth user and emails a branded invitation.
 *
 * We deliberately do NOT use `admin.inviteUserByEmail` here. That sends a link
 * back through the PKCE callback, which needs a `code_verifier` cookie in the
 * browser that STARTED the flow. An admin-initiated invite is started in the
 * admin's browser (via the service-role client, which sets no cookie at all),
 * so the invitee's browser has no verifier and the exchange always fails.
 * `generateLink` gives us a token hash we can verify with `verifyOtp` instead,
 * which is stateless and works in any browser.
 */
export async function sendTrainerInviteEmail(
  to: string,
  name?: string | null,
): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin.auth.admin.generateLink({
    type: "invite",
    email: to,
    options: { data: { full_name: name ?? undefined } },
  });

  if (error || !data?.properties?.hashed_token || !data.user) {
    return {
      ok: false,
      error: error?.message ?? "Could not generate an invitation link.",
    };
  }

  // Land on /update-password: an invited trainer has no password yet, so
  // dropping them straight on the dashboard would leave them unable to log
  // in again once this one-time link is spent.
  const inviteUrl =
    `${env.appUrl}/auth/confirm` +
    `?token_hash=${encodeURIComponent(data.properties.hashed_token)}` +
    `&type=invite&next=${encodeURIComponent("/update-password")}`;

  const sent = await sendEmail({
    to,
    subject: "You're invited to list your trainings on TherapistCEU",
    react: TrainerInviteEmail({ name, inviteUrl }),
  });

  if (!sent.ok) {
    // generateLink already created the auth user. If the mail never went out,
    // roll it back — otherwise the address is taken, the trainer has no way in,
    // and a retry just hits "an account with this email already exists".
    const { error: cleanupError } = await admin.auth.admin.deleteUser(
      data.user.id,
    );
    if (cleanupError) {
      console.error(
        `[email] invite to ${to} failed to send AND cleanup failed:`,
        cleanupError,
      );
    }
    return {
      ok: false,
      error: sent.skipped
        ? "Email is not configured (RESEND_API_KEY is missing), so the invitation could not be sent."
        : "The invitation email failed to send. Please try again.",
    };
  }

  return { ok: true, userId: data.user.id };
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

export async function sendPaymentFailedEmail(
  trainerId: string,
  args: { name?: string | null },
) {
  const to = await getUserEmail(trainerId);
  if (!to) return { ok: false, skipped: true };
  return sendEmail({
    to,
    subject: "Action needed: payment failed",
    react: PaymentFailedEmail({
      name: args.name,
      billingUrl: `${env.appUrl}/billing`,
    }),
  });
}

export async function sendAccountDeactivatedEmail(
  trainerId: string,
  args: { name?: string | null },
) {
  const to = await getUserEmail(trainerId);
  if (!to) return { ok: false, skipped: true };
  return sendEmail({
    to,
    subject: "Your listings have been deactivated",
    react: AccountDeactivatedEmail({
      name: args.name,
      billingUrl: `${env.appUrl}/billing`,
    }),
  });
}

export async function sendRenewalReminderEmail(
  trainerId: string,
  args: { name?: string | null; renewalDate: string },
) {
  const to = await getUserEmail(trainerId);
  if (!to) return { ok: false, skipped: true };
  return sendEmail({
    to,
    subject: "Your subscription renews soon",
    react: RenewalReminderEmail({
      name: args.name,
      renewalDate: args.renewalDate,
      billingUrl: `${env.appUrl}/billing`,
    }),
  });
}

