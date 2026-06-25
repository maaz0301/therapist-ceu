import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";

import { profiles } from "@/db/schema";
import { db } from "@/lib/db";
import { sendRenewalReminderEmail } from "@/lib/email/send";

export const dynamic = "force-dynamic";

/**
 * Daily cron (configure in vercel.json, same pattern as expire-listings):
 * sends a renewal reminder email to trainers whose subscription renews in
 * exactly 7 days. Stripe doesn't fire a webhook event for "renews soon", so
 * this has to be a scheduled check against current_period_end instead.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const dueForReminder = await db
    .select({
      id: profiles.id,
      fullName: profiles.fullName,
      currentPeriodEnd: profiles.currentPeriodEnd,
    })
    .from(profiles)
    .where(
      and(
        eq(profiles.subscriptionStatus, "active"),
        sql`${profiles.currentPeriodEnd}::date = current_date + interval '7 days'`,
      ),
    );

  let sent = 0;
  for (const profile of dueForReminder) {
    if (!profile.currentPeriodEnd) continue;
    const result = await sendRenewalReminderEmail(profile.id, {
      name: profile.fullName,
      renewalDate: profile.currentPeriodEnd.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    });
    if (result.ok) sent += 1;
  }

  return NextResponse.json({
    ok: true,
    checked: dueForReminder.length,
    sent,
    at: new Date().toISOString(),
  });
}
