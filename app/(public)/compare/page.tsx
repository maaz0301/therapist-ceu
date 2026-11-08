import type { Metadata } from "next";
import Link from "next/link";

import { ButtonLink } from "@/components/ui/button-link";
import { COMPARE_MAX } from "@/lib/compare";
import { getListingsForCompare } from "@/lib/queries/discover";
import { formatDateRange } from "@/lib/dates";

export const metadata: Metadata = { title: "Compare courses" };
export const dynamic = "force-dynamic";

const money = (p: string) => (Number(p) <= 0 ? "Free" : `$${Number(p)}`);

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string }>;
}) {
  const { s } = await searchParams;
  const slugs = (s ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, COMPARE_MAX);
  const rows = await getListingsForCompare(slugs);

  if (rows.length < 2) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-3xl font-bold">Compare courses</h1>
        <p className="mt-3 text-muted-foreground">
          Pick two or three courses with the “Compare” button in the directory
          to see them side by side.
        </p>
        <ButtonLink className="mt-6" variant="clay" href="/directory">
          Browse courses
        </ButtonLink>
      </div>
    );
  }

  const fields: { label: string; get: (r: (typeof rows)[number]) => string }[] = [
    { label: "Trainer", get: (r) => r.trainerName ?? "—" },
    { label: "Credentials", get: (r) => r.credentials || "—" },
    { label: "Format", get: (r) => r.format },
    { label: "Price", get: (r) => money(r.price) },
    {
      label: "Next session",
      get: (r) =>
        r.onDemand
          ? "On demand"
          : r.nextStart
            ? formatDateRange(
                { startDate: r.nextStart, endDate: r.nextEnd },
                "short",
              )
            : "TBA",
    },
    {
      label: "Duration",
      get: (r) => (r.durationHours ? `${Number(r.durationHours)} hours` : "—"),
    },
    {
      label: "Location",
      get: (r) => (r.isOnline ? "Online" : r.states.join(", ") || "In person"),
    },
    {
      label: "Credits",
      get: (r) =>
        r.hasCeu
          ? `${r.ceCount ? Number(r.ceCount) + " · " : ""}${r.accreditingBody ?? "Eligible"}`
          : "None",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold">Compare courses</h1>
      <div className="mt-8 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border align-top">
              <th className="w-36 p-4" />
              {rows.map((r) => (
                <th key={r.slug} className="p-4">
                  <Link
                    href={`/listings/${r.slug}`}
                    className="font-heading text-base font-semibold hover:text-primary"
                  >
                    {r.title}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fields.map((f) => (
              <tr key={f.label} className="border-b border-border">
                <th scope="row" className="p-4 font-medium text-muted-foreground">
                  {f.label}
                </th>
                {rows.map((r) => (
                  <td key={r.slug} className="p-4">
                    {f.get(r)}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <th />
              {rows.map((r) => (
                <td key={r.slug} className="p-4">
                  <ButtonLink size="sm" variant="clay" href={`/listings/${r.slug}`}>
                    View details
                  </ButtonLink>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
