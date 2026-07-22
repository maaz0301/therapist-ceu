import "server-only";

import { getBaseUrl } from "@/lib/site-url";
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
  | { ok: true; userId: string; inviteUrl: string; emailSent: boolean }
  | { ok: false; error: string }
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
    `${await getBaseUrl()}/auth/confirm` +
    `?token_hash=${encodeURIComponent(data.properties.hashed_token)}` +
    `&type=invite&next=${encodeURIComponent("/update-password")}`;

  const sent = await sendEmail({
    to,
    subject: "You're invited to list your trainings on TherapistCEU",
    react: TrainerInviteEmail({ name, inviteUrl }),
  });

  // A failed send is NOT a failed invite. The auth user exists and the link
  // above is the trainer's actual way in, so we keep the account and hand the
  // link back to the admin to pass along manually. Deleting the user here (as
  // we used to) made an unconfigured mail provider a hard blocker on creating
  // trainers at all.
  if (!sent.ok) {
    console.warn(
      `[email] invite to ${to} was not delivered (${
        sent.skipped ? "no mail provider configured" : "provider error"
      }); returning the link for manual delivery`,
    );
  }

  return {
    ok: true,
    userId: data.user.id,
    inviteUrl,
    emailSent: sent.ok,
  };
}

export async function sendWelcomeEmail(to: string, name?: string | null) {
  return sendEmail({
    to,
    subject: "Welcome to TherapistCEU",
    react: WelcomeEmail({ name, dashboardUrl: `${await getBaseUrl()}/dashboard` }),
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
      dashboardUrl: `${await getBaseUrl()}/listings`,
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
      listingUrl: `${await getBaseUrl()}/listings/${args.slug}`,
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
      editUrl: `${await getBaseUrl()}/listings/${args.slug}/edit`,
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
      billingUrl: `${await getBaseUrl()}/billing`,
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
      billingUrl: `${await getBaseUrl()}/billing`,
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
      billingUrl: `${await getBaseUrl()}/billing`,
    }),
  });
}

