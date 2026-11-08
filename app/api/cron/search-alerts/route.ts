import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { profiles, searchAlerts } from "@/db/schema";
import { db } from "@/lib/db";
import { sendSearchAlertEmail } from "@/lib/email/send";
import { findAlertMatches } from "@/lib/queries/engagement";

export const dynamic = "force-dynamic";

/**
 * Daily cron: for every saved keyword alert, emails the learner any course
 * published since the alert last fired. `last_notified_at` only advances after
 * a successful send, so an outage retries on the next run instead of dropping
 * matches.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Only learners who have not switched alert emails off in Settings.
  const alerts = (
    await db
      .select({ alert: searchAlerts })
      .from(searchAlerts)
      .innerJoin(profiles, eq(profiles.id, searchAlerts.userId))
      .where(eq(profiles.notifyAlerts, true))
  ).map((r) => r.alert);
  const startedAt = new Date();
  let sent = 0;

  for (const alert of alerts) {
    const matches = await findAlertMatches(alert.query, alert.lastNotifiedAt);
    if (matches.length === 0) {
      await db
        .update(searchAlerts)
        .set({ lastNotifiedAt: startedAt })
        .where(eq(searchAlerts.id, alert.id));
      continue;
    }
    const result = await sendSearchAlertEmail(alert.userId, {
      query: alert.query,
      courses: matches.map((m) => ({
        title: m.title,
        slug: m.slug,
        schedule: m.schedule,
      })),
    });
    if (result.ok) {
      sent += 1;
      await db
        .update(searchAlerts)
        .set({ lastNotifiedAt: startedAt })
        .where(eq(searchAlerts.id, alert.id));
    }
  }

  return NextResponse.json({ ok: true, checked: alerts.length, sent });
}
