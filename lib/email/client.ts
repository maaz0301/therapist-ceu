import "server-only";

import { Resend } from "resend";
import type { ReactElement } from "react";

/**
 * Centralized transactional email sending (Resend).
 * - No-ops gracefully (logs) when RESEND_API_KEY is missing, so local dev and
 *   preview environments work without sending real mail.
 * - Never throws into the request flow; failures are logged and swallowed so a
 *   mail outage can't break signup / listing actions.
 */

const FROM =
  process.env.EMAIL_FROM ?? "TherapistCEU <onboarding@resend.dev>";

let client: Resend | null = null;
function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!client) client = new Resend(key);
  return client;
}

export type SendEmailArgs = {
  to: string;
  subject: string;
  react: ReactElement;
  replyTo?: string;
};

export async function sendEmail({
  to,
  subject,
  react,
  replyTo,
}: SendEmailArgs): Promise<{ ok: boolean; skipped?: boolean }> {
  const resend = getClient();

  if (!resend) {
    console.warn(
      `[email] RESEND_API_KEY not set — skipping "${subject}" to ${to}`,
    );
    return { ok: false, skipped: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      react,
      replyTo,
    });
    if (error) {
      console.error(`[email] failed to send "${subject}" to ${to}:`, error);
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error(`[email] threw sending "${subject}" to ${to}:`, err);
    return { ok: false };
  }
}
