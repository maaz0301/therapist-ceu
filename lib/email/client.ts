import "server-only";

import { render } from "@react-email/components";
import nodemailer, { type Transporter } from "nodemailer";
import { Resend } from "resend";
import type { ReactElement } from "react";

/**
 * Centralized transactional email sending.
 *
 * Two providers are supported, picked in this order:
 *   1. SMTP  — set SMTP_HOST (+ SMTP_USER / SMTP_PASS). Works with Gmail,
 *      Fastmail, SES, or any relay.
 *   2. Resend — set RESEND_API_KEY.
 *
 * - No-ops gracefully (logs) when neither is configured, so local dev and
 *   preview environments work without sending real mail.
 * - Never throws into the request flow; failures are logged and swallowed so a
 *   mail outage can't break signup / listing actions.
 */

/** RFC 5322 `Name <addr>`, quoting the display name only when it needs it. */
function formatFrom(name: string | undefined, address: string): string {
  if (!name) return address;
  const escaped = name.replace(/([\\"])/g, "\\$1");
  return /^[\w .'-]+$/.test(name)
    ? `${name} <${address}>`
    : `"${escaped}" <${address}>`;
}

function resolveFrom(): string {
  const address = process.env.SMTP_FROM_EMAIL ?? process.env.SMTP_USER;
  if (address) return formatFrom(process.env.SMTP_FROM_NAME, address);
  return process.env.EMAIL_FROM ?? "TherapistCEU <onboarding@resend.dev>";
}

let smtp: Transporter | null = null;
function getSmtpTransport(): Transporter | null {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  if (smtp) return smtp;

  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER ?? process.env.SMTP_FROM_EMAIL;
  const pass = process.env.SMTP_PASS
    ? process.env.SMTP_PASS.replace(/^["']|["']$/g, "").replace(/\s+/g, "")
    : undefined;

  smtp = nodemailer.createTransport({
    host,
    port,
    // 465 is implicit TLS; 587/25 start plaintext and upgrade via STARTTLS.
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
  });
  return smtp;
}

let resend: Resend | null = null;
function getResendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resend) resend = new Resend(key);
  return resend;
}

/** True when a mail provider is wired up and sends will actually go out. */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST || process.env.RESEND_API_KEY);
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
  const transport = getSmtpTransport();

  if (transport) {
    try {
      // Nodemailer takes markup, not React — render both parts so clients that
      // refuse HTML still get a readable message.
      const [html, text] = await Promise.all([
        render(react),
        render(react, { plainText: true }),
      ]);
      await transport.sendMail({
        from: resolveFrom(),
        to,
        subject,
        html,
        text,
        replyTo,
      });
      return { ok: true };
    } catch (err) {
      console.error(`[email] SMTP send of "${subject}" to ${to} failed:`, err);
      return { ok: false };
    }
  }

  const client = getResendClient();

  if (!client) {
    console.warn(
      `[email] no mail provider configured (set SMTP_HOST or RESEND_API_KEY) — skipping "${subject}" to ${to}`,
    );
    return { ok: false, skipped: true };
  }

  try {
    const { error } = await client.emails.send({
      from: resolveFrom(),
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
