/**
 * Date helpers for the listing schedule fields.
 *
 * Every date in the form is an ISO `yyyy-mm-dd` string. That format sorts
 * lexicographically, so plain string comparison is correct ordering — no Date
 * parsing needed, and no timezone drift from constructing Date objects.
 */

/** Today as `yyyy-mm-dd` in the *viewer's* local timezone. Client-side only. */
export function todayIso(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

/** Shifts an ISO date by whole days, e.g. `addDays("2026-07-20", 1)`. */
export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Earliest start date the server will accept, as `yyyy-mm-dd`.
 *
 * The client blocks anything before the trainer's local today. The server runs
 * in UTC, so a trainer in UTC+13 can legitimately submit a local "today" that
 * is still yesterday in UTC. Allowing one day of slack keeps that valid submit
 * from being rejected; the client is what enforces the exact rule.
 */
export function earliestAcceptableStart(): string {
  return addDays(new Date().toISOString().slice(0, 10), -1);
}

export const START_DATE_PAST_ERROR = "Start date can't be in the past.";
export const END_DATE_ORDER_ERROR =
  "End date must be at least one day after the start date.";
