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

/**
 * A run can't begin before the one before it has finished. `previousEnd` is the
 * last day an earlier row already claims — its end date, or its start date when
 * no end was given (see {@link effectiveEnd}).
 */
export function dateOverlapError(previousEnd: string): string {
  return `Start date must be after the previous date ends (${formatDateRange({
    startDate: previousEnd,
    endDate: null,
  })}).`;
}

/**
 * Upper bound on how many runs one listing may schedule. High enough for a
 * monthly cohort booked two years out, low enough that a scripted submit can't
 * push thousands of rows through the form.
 */
export const MAX_LISTING_DATES = 24;

/** One scheduled run of a training: a start day and an optional last day. */
export type DateRange = { startDate: string; endDate: string | null };

/** Chronological by start date. Dates are ISO, so string order is date order. */
export function sortDateRanges<T extends DateRange>(ranges: readonly T[]): T[] {
  return [...ranges].sort((a, b) => a.startDate.localeCompare(b.startDate));
}

/**
 * The last day a run occupies — its end date, or its start date when it's a
 * single-day training. Mirrors the `coalesce(end_date, start_date)` the
 * database uses to decide whether a run is still upcoming.
 */
export function effectiveEnd(range: DateRange): string {
  return range.endDate ?? range.startDate;
}

/**
 * Runs that haven't finished yet, soonest first. `today` is the caller's
 * reference day (`yyyy-mm-dd`) so server and client can each pass their own.
 */
export function upcomingRanges<T extends DateRange>(
  ranges: readonly T[],
  today: string,
): T[] {
  return sortDateRanges(ranges).filter((r) => effectiveEnd(r) >= today);
}

/**
 * How much of the date to spell out. The directory packs dates into a card
 * (`Sep 14 – 16`), the dashboards list them in a row (`Sep 14, 2026`), and the
 * detail page gives each its own line (`September 14, 2026`).
 */
export type DateStyle = "short" | "medium" | "long";

const DATE_STYLES: Record<DateStyle, Intl.DateTimeFormatOptions> = {
  short: { month: "short", day: "numeric" },
  medium: { month: "short", day: "numeric", year: "numeric" },
  long: { month: "long", day: "numeric", year: "numeric" },
};

/**
 * Renders one run for display, e.g. `September 14 – 16, 2026`.
 *
 * The `T00:00:00` suffix is what keeps the day correct: parsing a bare
 * `yyyy-mm-dd` gives UTC midnight, which renders as the previous day for
 * anyone west of Greenwich.
 */
export function formatDateRange(
  range: DateRange,
  style: DateStyle = "medium",
): string {
  const opts = DATE_STYLES[style];
  const { startDate: start } = range;
  const end = range.endDate;

  const fmt = (iso: string, o: Intl.DateTimeFormatOptions = opts) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", o);
  /** Month + day, never the year — the year is appended once, at the end. */
  const monthDay = (iso: string) =>
    fmt(iso, { month: opts.month, day: "numeric" });

  if (!end || end === start) return fmt(start);

  const year = opts.year ? `, ${end.slice(0, 4)}` : "";

  // Inside one month the month name doesn't need repeating: "Sep 14 – 16, 2026".
  if (start.slice(0, 7) === end.slice(0, 7)) {
    return `${monthDay(start)} – ${Number(end.slice(8, 10))}${year}`;
  }
  // Spanning months but not years, the year is still only worth saying once.
  if (start.slice(0, 4) === end.slice(0, 4)) {
    return `${monthDay(start)} – ${monthDay(end)}${year}`;
  }
  return `${fmt(start)} – ${fmt(end)}`;
}
