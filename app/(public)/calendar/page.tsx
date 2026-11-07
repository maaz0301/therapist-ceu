import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { getCalendarRuns } from "@/lib/queries/discover";

export const metadata: Metadata = { title: "Calendar" };
export const dynamic = "force-dynamic";

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

function parseMonth(raw: string | undefined) {
  const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(raw ?? "");
  if (m) return { y: Number(m[1]), m: Number(m[2]) - 1 };
  const now = new Date();
  return { y: now.getUTCFullYear(), m: now.getUTCMonth() };
}

const monthHref = (y: number, m: number) => {
  const d = new Date(Date.UTC(y, m, 1));
  return `/calendar?month=${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const { y, m } = parseMonth(month);
  const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const firstDow = new Date(Date.UTC(y, m, 1)).getUTCDay();
  const monthStart = iso(y, m, 1);
  const monthEnd = iso(y, m, daysInMonth);

  const runs = await getCalendarRuns(monthStart, monthEnd);

  // day (1..n) -> runs that cover it
  const byDay = new Map<number, typeof runs>();
  for (const run of runs) {
    const last = run.endDate ?? run.startDate;
    for (let d = 1; d <= daysInMonth; d++) {
      const day = iso(y, m, d);
      if (day >= run.startDate && day <= last) {
        byDay.set(d, [...(byDay.get(d) ?? []), run]);
      }
    }
  }

  const label = new Date(Date.UTC(y, m, 1)).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const cells: (number | null)[] = [
    ...Array<null>(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">{label}</h1>
        <div className="flex gap-2">
          <Link
            href={monthHref(y, m - 1)}
            aria-label="Previous month"
            className="rounded-xl border border-border p-2 hover:bg-accent"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <Link
            href={monthHref(y, m + 1)}
            aria-label="Next month"
            className="rounded-xl border border-border p-2 hover:bg-accent"
          >
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>

      {/* Month grid (tablet and up) */}
      <div className="mt-6 hidden overflow-hidden rounded-2xl border border-border bg-card md:block">
        <div className="grid grid-cols-7 border-b border-border bg-muted/50 text-xs font-medium text-muted-foreground">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="p-2 text-center">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((d, i) => {
            const items = d ? (byDay.get(d) ?? []) : [];
            return (
              <div
                key={i}
                className="min-h-28 border-r border-b border-border p-1.5 last:border-r-0"
              >
                {d ? (
                  <>
                    <div className="text-xs text-muted-foreground">{d}</div>
                    <ul className="mt-1 space-y-1">
                      {items.slice(0, 3).map((r) => (
                        <li key={r.slug + d}>
                          <Link
                            href={`/listings/${r.slug}`}
                            className="block truncate rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary hover:bg-primary/20"
                            title={r.title}
                          >
                            {r.title}
                          </Link>
                        </li>
                      ))}
                      {items.length > 3 ? (
                        <li className="px-1 text-xs text-muted-foreground">
                          +{items.length - 3} more
                        </li>
                      ) : null}
                    </ul>
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Agenda list (all sizes; the only view on phones) */}
      <div className="mt-8 md:mt-10">
        <h2 className="text-lg font-semibold">All sessions this month</h2>
        {runs.length === 0 ? (
          <p className="mt-3 text-muted-foreground">
            Nothing scheduled this month. Try the next one.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card">
            {runs.map((r) => (
              <li key={r.slug + r.startDate} className="p-4">
                <Link
                  href={`/listings/${r.slug}`}
                  className="font-medium hover:text-primary"
                >
                  {r.title}
                </Link>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {r.startDate}
                  {r.endDate && r.endDate !== r.startDate
                    ? ` → ${r.endDate}`
                    : ""}{" "}
                  · {r.format}
                  {r.trainerName ? ` · ${r.trainerName}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
